// App-level Firebase helpers and cloud save/load functions
// Relies on `firebase-init.js` to initialize Firebase and expose window helpers

// Wait helper
async function waitForHelper(name, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (window[name]) return true;
    await new Promise(r => setTimeout(r, 150));
  }
  return false;
}

window.salvarNoCloud = async function() {
  try {
    const ok = await waitForHelper('firestoreBatchSet', 5000);
    if (!ok) throw new Error('Firestore helpers indisponíveis');
    showToast('Salvando na nuvem...', 'info');
    console.log('[Cloud] iniciar salvarNoCloud');
    // Ensure dados exists
    if (!window.dados) window.dados = { teds: [], proxiId: 1 };
    await window.firestoreBatchSet('teds', window.dados.teds || []);
    console.log('[Cloud] firestoreBatchSet ok');
    // Update meta nextId so other clients can pick up current proxi
    try {
      if (window.firestoreSetDoc) {
        await window.firestoreSetDoc('meta/teds', { nextId: window.dados.proxiId }, { merge: true });
        console.log('[Cloud] meta/teds updated to', window.dados.proxiId);
      }
    } catch (e) {
      console.warn('Não foi possível atualizar meta/teds', e);
    }
    showToast('Dados salvos na nuvem com sucesso', 'success');
  } catch (e) {
    console.error(e);
    showToast('Erro ao salvar na nuvem: ' + (e.message || e), 'error');
  }
};

window.carregarDoCloud = async function() {
  try {
    const ok = await waitForHelper('firestoreGetCollection', 5000);
    if (!ok) throw new Error('Firestore helpers indisponíveis');
    showToast('Carregando dados da nuvem...', 'info');
    console.log('[Cloud] iniciar carregarDoCloud');
    const items = await window.firestoreGetCollection('teds');
    console.log('[Cloud] firestoreGetCollection items count=', (items || []).length);
    const normalized = (items || []).map(d => {
      const copy = Object.assign({}, d);
      if (!copy.id) {
        if (copy._docId) {
          const n = Number(copy._docId);
          copy.id = isFinite(n) ? n : copy._docId;
        }
      }
      try { delete copy._docId; } catch (e) {}
      return copy;
    });
    window.dados = window.dados || { teds: [], proxiId: 1 };
    window.dados.teds = normalized;
    window.dados.proxiId = window.dados.teds.length ? Math.max(...window.dados.teds.map(t => Number(t.id) || 0)) + 1 : 1;
    // Try to read meta/teds to align proxiId
    try {
      if (window.firestoreGetDoc) {
        const meta = await window.firestoreGetDoc('meta/teds');
        if (meta && meta.nextId) window.dados.proxiId = Math.max(window.dados.proxiId, meta.nextId);
      }
    } catch (e) { console.warn('Erro lendo meta/teds', e); }

    try { atualizarDashboard(); } catch(e) {}
    try { atualizarListaTEDs(); } catch(e) {}
    try { atualizarSeletorTED(); } catch(e) {}
    try { atualizarGantt(); } catch(e) {}

    showToast('Dados carregados da nuvem', 'success');
  } catch (e) {
    console.error(e);
    showToast('Erro ao carregar da nuvem: ' + (e.message || e), 'error');
  }
};

// Diagnostic test function triggered by UI button
window.testFirestoreConnection = async function() {
  try {
    showToast('Testando conexão com Firestore...', 'info');
    const okDoc = await waitForHelper('firestoreGetDoc', 3000);
    const okColl = await waitForHelper('firestoreGetCollection', 3000);
    if (!okDoc && !okColl) {
      showToast('Helpers do Firestore não estão disponíveis', 'error');
      console.warn('[Test] firestore helpers não disponíveis');
      return;
    }

    // Try read meta/teds
    let meta = null;
    try {
      if (window.firestoreGetDoc) {
        meta = await window.firestoreGetDoc('meta/teds');
        console.log('[Test] meta/teds', meta);
      }
    } catch (e) { console.warn('[Test] erro lendo meta/teds', e); }

    // Try read few docs from teds
    let items = [];
    try {
      if (window.firestoreGetCollection) {
        items = await window.firestoreGetCollection('teds');
        console.log('[Test] teds count=', items.length, items.slice(0,3));
      }
    } catch (e) { console.warn('[Test] erro lendo teds', e); }

    // Update UI indicators based on results
    if (items && items.length >= 0) {
      document.getElementById('cloudStatusIcon').style.color = 'var(--success)';
      document.getElementById('cloudLastSync').textContent = 'Test OK: ' + (items.length) + ' teds';
      showToast('Conexão testada com sucesso', 'success');
    } else {
      document.getElementById('cloudStatusIcon').style.color = 'var(--danger)';
      showToast('Falha no teste de conexão', 'error');
    }
  } catch (e) {
    console.error('[Test] erro', e);
    document.getElementById('cloudStatusIcon').style.color = 'var(--danger)';
    showToast('Erro no teste: ' + (e.message || e), 'error');
  }
};

  // Cloud status / last sync indicator + autosave
  ;(async function() {
    // helpers
    function setCloudStatus(connected) {
      const el = document.getElementById('cloudStatusIcon');
      if (!el) return;
      if (connected) {
        el.style.color = 'var(--success)';
        el.title = 'Conectado ao Firestore';
      } else {
        el.style.color = 'var(--danger)';
        el.title = 'Desconectado do Firestore';
      }
    }

    function setLastSync(ts) {
      const el = document.getElementById('cloudLastSync');
      if (!el) return;
      if (!ts) {
        el.textContent = 'Nunca sincronizado';
        return;
      }
      const d = (ts instanceof Date) ? ts : new Date(ts);
      el.textContent = 'Última sync: ' + d.toLocaleString();
    }

    // Wait for firestore helpers (collection snapshot + salvarDados)
    await waitForHelper('firestoreOnCollectionSnapshot', 5000);
    await waitForHelper('salvarDados', 1000);

    // Track last saved snapshot to detect changes
    window._lastSavedTedsSnapshot = JSON.stringify((window.dados && window.dados.teds) ? window.dados.teds : []);

    // Attach collection snapshot to detect server connectivity and last sync
    try {
      if (window.firestoreOnCollectionSnapshot) {
        window.firestoreOnCollectionSnapshot('teds', snap => {
          try {
            // If snapshot metadata indicates data not from cache, we consider connected
            const meta = snap && snap.metadata ? snap.metadata : null;
            const fromCache = meta ? !!meta.fromCache : false;
            setCloudStatus(!fromCache);
            setLastSync(new Date());
          } catch (e) { console.warn('cloud snapshot handler error', e); }
        });
      }
    } catch (e) { console.warn('Erro anexando snapshot de teds para status', e); }

    // Listen to online/offline browser events
    window.addEventListener('online', () => { setCloudStatus(true); });
    window.addEventListener('offline', () => { setCloudStatus(false); });

    // Autosave loop: every 12s check for changes and call salvarDados()
    setInterval(async () => {
      try {
        const current = JSON.stringify((window.dados && window.dados.teds) ? window.dados.teds : []);
        if (current !== window._lastSavedTedsSnapshot) {
          // dirty
          if (typeof window.salvarDados === 'function') {
            await window.salvarDados();
            window._lastSavedTedsSnapshot = JSON.stringify((window.dados && window.dados.teds) ? window.dados.teds : []);
            setLastSync(new Date());
            setCloudStatus(true);
          }
        }
      } catch (e) {
        console.warn('autosave error', e);
        setCloudStatus(false);
      }
    }, 12000);

    // initial UI
    setCloudStatus(navigator.onLine);
    setLastSync(null);

  })();
