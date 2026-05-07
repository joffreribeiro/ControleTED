/**
 * ARQUIVO LEGADO — Não usado em produção.
 * O frontend ativo é frontend/src/ (React/TypeScript/Vite).
 * Não adicionar novas funcionalidades aqui. Planejado para remoção.
 */

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

// app.js roda como módulo; use window.showToast quando disponível.
const showToast = (...args) => {
  if (typeof window.showToast === 'function') {
    return window.showToast(...args);
  }
  const [message, type = 'info'] = args;
  console[type === 'error' ? 'error' : 'log']('[Toast fallback][' + type + ']', message);
};

window.salvarNoCloud = async function() {
  try {
    const ok = await waitForHelper('firestoreBatchSet', 5000);
    if (!ok) throw new Error('Firestore helpers indisponíveis');
    showToast('Salvando na nuvem...', 'info');
    // show loader (fallback if helper not yet defined)
    (function(msg){
      if (typeof window.showGlobalLoader === 'function') return window.showGlobalLoader(msg);
      const g = document.getElementById('globalLoader');
      if (g) {
        try { const m = g.querySelector('.global-loader-message'); if (m) m.textContent = msg; } catch(e){}
        g.classList.add('active'); g.setAttribute('aria-hidden','false');
      }
    })('Salvando na nuvem...');
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
    try { if (typeof window.hideGlobalLoader === 'function') window.hideGlobalLoader(); else { const g = document.getElementById('globalLoader'); if (g) { g.classList.remove('active'); g.setAttribute('aria-hidden','true'); } } } catch(e){}
    try { if (typeof window.showSaveConfirmation === 'function') window.showSaveConfirmation('#btnSalvarTopo'); else { const b = document.getElementById('btnSalvarTopo'); if (b) { b.classList.add('btn-saved'); setTimeout(()=>b.classList.remove('btn-saved'),2000); } } } catch(e){}
  } catch (e) {
    console.error(e);
    showToast('Erro ao salvar na nuvem: ' + (e.message || e), 'error');
    try { if (typeof window.hideGlobalLoader === 'function') window.hideGlobalLoader(); else { const g = document.getElementById('globalLoader'); if (g) { g.classList.remove('active'); g.setAttribute('aria-hidden','true'); } } } catch(e){}
  }
};

window.carregarDoCloud = async function() {
  try {
    const ok = await waitForHelper('firestoreGetCollection', 5000);
    if (!ok) throw new Error('Firestore helpers indisponíveis');
    showToast('Carregando dados da nuvem...', 'info');
    // show loader (fallback if helper not yet defined)
    (function(msg){
      if (typeof window.showGlobalLoader === 'function') return window.showGlobalLoader(msg);
      const g = document.getElementById('globalLoader');
      if (g) {
        try { const m = g.querySelector('.global-loader-message'); if (m) m.textContent = msg; } catch(e){}
        g.classList.add('active'); g.setAttribute('aria-hidden','false');
      }
    })('Carregando dados da nuvem...');
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
    try { atualizarFiltroTedEntregas(); } catch(e) {}
    try { renderEntregasFromFilter(); } catch(e) {}
    try { renderResumoFinanceiroFromFilter(); } catch(e) {}
    try { popularFiltrosRelatorios(); } catch(e) {}
    try { if (typeof window.enhanceEmptyStates === 'function') window.enhanceEmptyStates(); } catch(e) {}

    showToast('Dados carregados da nuvem', 'success');
    try { if (typeof window.hideGlobalLoader === 'function') window.hideGlobalLoader(); else { const g = document.getElementById('globalLoader'); if (g) { g.classList.remove('active'); g.setAttribute('aria-hidden','true'); } } } catch(e){}
  } catch (e) {
    console.error(e);
    showToast('Erro ao carregar da nuvem: ' + (e.message || e), 'error');
    try { if (typeof window.hideGlobalLoader === 'function') window.hideGlobalLoader(); else { const g = document.getElementById('globalLoader'); if (g) { g.classList.remove('active'); g.setAttribute('aria-hidden','true'); } } } catch(e){}
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

    // Autosave loop de segurança: every 30s check for unsaved changes
    // (O salvamento principal agora é via debounce de 1.5s em salvarDados())
    setInterval(async () => {
      try {
        const current = JSON.stringify((window.dados && window.dados.teds) ? window.dados.teds : []);
        if (current !== window._lastSavedTedsSnapshot) {
          // dirty – forçar salvamento imediato
          if (typeof window.salvarDadosImediato === 'function') {
            await window.salvarDadosImediato();
          } else if (typeof window.salvarDados === 'function') {
            await window.salvarDados();
          }
          window._lastSavedTedsSnapshot = JSON.stringify((window.dados && window.dados.teds) ? window.dados.teds : []);
          setLastSync(new Date());
          setCloudStatus(true);
        }
      } catch (e) {
        console.warn('autosave error', e);
        setCloudStatus(false);
      }
    }, 30000);

    // initial UI
    setCloudStatus(navigator.onLine);
    setLastSync(null);

    // Auto-carregar dados da nuvem no startup quando a base local estiver vazia.
    try {
      const semDadosLocais = !window.dados || !Array.isArray(window.dados.teds) || window.dados.teds.length === 0;
      if (semDadosLocais && typeof window.carregarDoCloud === 'function') {
        await window.carregarDoCloud();
      }
    } catch (e) {
      console.warn('auto carregarDoCloud falhou (verifique as Firestore Security Rules — leitura deve ser pública):', e && e.code ? e.code : e);
    }

  })();

  // ===== User management and role enforcement =====
  // Apply role-based UI permissions (admin vs user)
  function isCurrentUserAdmin() {
    try {
      return window.currentUserProfile && window.currentUserProfile.role === 'admin';
    } catch (e) { return false; }
  }

  function applyRolePermissions() {
    const admin = isCurrentUserAdmin();
    // Delegate to the inline updateAdminUI function for UI updates
    if (window.updateAdminUI) {
      window.updateAdminUI(admin);
    }
  }

  // Sign-in handler
  window.handleSignIn = async function() {
    try {
      const emailEl = document.getElementById('modal_login_email') || document.getElementById('login_email') || {};
      const passEl = document.getElementById('modal_login_password') || document.getElementById('login_password') || {};
      const email = (emailEl.value || '').trim();
      const password = (passEl.value || '').trim();
      if (!email || !password) { showToast('Informe email e senha', 'warning'); return; }
      showToast('Entrando...', 'info');
      await waitForHelper('authSignIn', 3000);
      const user = await window.authSignIn(email, password);
      if (user) {
        showToast('Login realizado', 'success');
        try { if (window.hideLoginModal) window.hideLoginModal(); } catch(e){}
        // profile will be loaded by authOnStateChanged listener
      }
    } catch (e) {
      console.error('handleSignIn error', e);
      showToast('Erro ao entrar: ' + (e.message || e), 'error');
    }
  };

  // Sign-out handler
  window.handleSignOut = async function() {
    try {
      if (window.authSignOut) await window.authSignOut();
      window.currentUser = null;
      window.currentUserProfile = null;
      applyRolePermissions();
      showToast('Voltou ao modo leitura', 'info');
    } catch (e) { console.warn('handleSignOut', e); showToast('Erro ao sair', 'error'); }
  };

  // Create user (requires admin or bootstrap when no users exist)
  window.handleCreateUser = async function() {
    try {
      const email = (document.getElementById('create_email') || {}).value || '';
      const password = (document.getElementById('create_password') || {}).value || '';
      const name = (document.getElementById('create_name') || {}).value || '';
      const role = (document.getElementById('create_role') || {}).value || 'user';
      if (!email || !password) { showToast('Email e senha são obrigatórios', 'warning'); return; }

      // check if admin or bootstrap (no users exist)
      let allow = false;
      try {
        const users = await (window.firestoreGetCollection ? window.firestoreGetCollection('users') : Promise.resolve([]));
        if (!users || users.length === 0) allow = true;
      } catch(e){ }
      if (!allow) allow = isCurrentUserAdmin();
      if (!allow) { showToast('Apenas administradores podem criar usuários', 'error'); return; }

      showToast('Criando usuário...', 'info');
      await waitForHelper('authCreateUser', 3000);
      const user = await window.authCreateUser(email, password, { displayName: name, role: role });
      if (user) {
        showToast('Usuário criado', 'success');
        loadUsersList();
      }
    } catch (e) {
      console.error('handleCreateUser error', e);
      showToast('Erro ao criar usuário: ' + (e.message || e), 'error');
    }
  };

  // Load and render users list
  window.loadUsersList = async function() {
    try {
      await waitForHelper('firestoreGetCollection', 3000);
      const users = await window.firestoreGetCollection('users');
      const wrap = document.getElementById('usersListContainer');
      if (!wrap) return;
      wrap.innerHTML = '';
      if (!users || users.length === 0) {
        const empty = document.createElement('div');
        empty.textContent = 'Nenhum usuário cadastrado.';
        wrap.appendChild(empty);
        return;
      }
      users.forEach(u => {
        const role = u.role || 'user';
        const name = u.displayName || u.email || u.uid || '';
        const uid = u.uid || u._docId || '';

        const row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:6px;border-bottom:1px solid var(--border)';

        const info = document.createElement('div');
        const strong = document.createElement('strong');
        strong.textContent = name;
        const sub = document.createElement('div');
        sub.style.cssText = 'font-size:12px;color:var(--text-muted)';
        sub.textContent = (u.email || '') + ' · ' + role;
        info.appendChild(strong);
        info.appendChild(sub);

        const actions = document.createElement('div');
        if (isCurrentUserAdmin() && uid) {
          const btn = document.createElement('button');
          btn.className = 'btn';
          btn.textContent = 'Remover';
          btn.addEventListener('click', () => window.deleteUser(uid));
          actions.appendChild(btn);
        }

        row.appendChild(info);
        row.appendChild(actions);
        wrap.appendChild(row);
      });
    } catch (e) { console.warn('loadUsersList error', e); }
  };

  // Delete user profile (Firestore doc). Note: does not delete Firebase Auth user.
  window.deleteUser = async function(uid) {
    try {
      if (!isCurrentUserAdmin()) { showToast('Apenas administradores podem remover usuários', 'error'); return; }
      confirmarAcao('Remover perfil deste usuário (somente Firestore)?', async function() {
        await waitForHelper('firestoreDeleteDoc', 2000);
        const ok = await window.firestoreDeleteDoc('users/' + uid);
        if (ok) { showToast('Perfil removido (Firestore)', 'success'); loadUsersList(); }
        else showToast('Erro removendo perfil', 'error');
      }, 'Confirmar');
      return;
    } catch (e) { console.warn('deleteUser', e); showToast('Erro ao remover usuário', 'error'); }
  };

  // Listen to auth state and load profile
  ;(async function(){
    await waitForHelper('authOnStateChanged', 5000);
    if (window.authOnStateChanged) {
      window.authOnStateChanged(async (user) => {
        try {
          if (user) {
            window.currentUser = user;
            // fetch profile
            let profile = null;
            try {
              if (window.firestoreGetDoc) profile = await window.firestoreGetDoc('users/' + user.uid);
            } catch (e) { console.warn('error loading user profile', e); }

            if (profile && profile.role) {
              window.currentUserProfile = profile;
            } else {
              // Perfil não encontrado: verificar se é o primeiro usuário (bootstrap) e tratar como admin
              const allUsers = await (window.firestoreGetCollection ? window.firestoreGetCollection('users').catch(()=>[]) : Promise.resolve([]));
              const isFirstUser = !allUsers || allUsers.length === 0;
              window.currentUserProfile = {
                uid: user.uid,
                email: user.email,
                role: isFirstUser ? 'admin' : 'user',
                displayName: user.displayName || ''
              };
              // Salvar perfil no Firestore para consultas futuras
              if (window.firestoreSetDoc) {
                window.firestoreSetDoc('users/' + user.uid, window.currentUserProfile).catch(e => console.warn('Erro salvando perfil', e));
              }
            }

            showToast('Conectado como ' + (window.currentUserProfile.displayName || window.currentUserProfile.email), 'info');
            // Hide login screen if it was open
            try { if (window.hideLoginModal) window.hideLoginModal(); } catch(e){}
            // Recarregar dados se ainda estiverem vazios (ex: regras exigem auth para leitura)
            try {
              const semDados = !window.dados || !Array.isArray(window.dados.teds) || window.dados.teds.length === 0;
              if (semDados && typeof window.carregarDoCloud === 'function') {
                await window.carregarDoCloud();
              }
            } catch(e) { console.warn('recarregar após login falhou:', e && e.code ? e.code : e); }
          } else {
            window.currentUser = null;
            window.currentUserProfile = null;
            // DO NOT show login screen — read mode is the default
            // User can click the admin login button if they want
          }
        } catch (e) { console.warn('auth state handler', e); }
        // Só aplicar permissões após o perfil estar definido
        try {
          if (window.currentUser) {
            applyRolePermissions();
          }
        } catch(e) {}
      });
    }
    // After setting auth listener, ensure bootstrap admin exists if no users
    try {
      await createBootstrapAdminIfNeeded();
    } catch(e) {}
  })();

// showLoginModal / hideLoginModal are now defined in index.html inline script
// and exposed on window. Use window.showLoginModal() / window.hideLoginModal().

// Bootstrap admin check: creation disabled for safety
async function createBootstrapAdminIfNeeded() {
  // Prevent automatic creation of admin accounts from code.
  return false;
}

// Force create the admin account and sign in (used by UI button)
window.forceCreateAdmin = async function() {
  if (typeof showToast === 'function') {
    showToast('Operação não permitida.', 'warning');
  }
  return;
};
