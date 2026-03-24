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

  // ===== User management and role enforcement =====
  // Apply role-based UI permissions (admin vs user)
  function isCurrentUserAdmin() {
    try {
      return window.currentUserProfile && window.currentUserProfile.role === 'admin';
    } catch (e) { return false; }
  }

  function applyRolePermissions() {
    const admin = isCurrentUserAdmin();
    // disable create/edit/delete TED actions for non-admins
    try {
      const selectors = ['[onclick*="criarTED" ]','[onclick*="criarTED("]','[onclick*="editarTED" ]','[onclick*="editarTED("]','[onclick*="deletarTED" ]','[onclick*="deletarTED("]'];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => { try { el.disabled = !admin; } catch(e){} });
      });
    } catch (e) { console.warn('applyRolePermissions error', e); }

    // disable modal edit buttons (by text)
    try {
      document.querySelectorAll('#modalDetalhes .btn').forEach(b => {
        const txt = (b.textContent || '').toLowerCase();
        if (txt.includes('editar') || txt.includes('deletar')) b.disabled = !admin;
      });
    } catch (e) {}

    // disable create user form for non-admins
    try { document.getElementById('create_email').disabled = !admin; } catch(e){}
    try { document.getElementById('create_password').disabled = !admin; } catch(e){}
    try { document.getElementById('create_name').disabled = !admin; } catch(e){}
    try { document.getElementById('create_role').disabled = !admin; } catch(e){}
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
      window.currentUserProfile = null;
      applyRolePermissions();
      showToast('Desconectado', 'info');
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
      if (!users || users.length === 0) { wrap.innerHTML = '<div>Nenhum usuário cadastrado.</div>'; return; }
      const html = users.map(u => {
        const role = u.role || 'user';
        const name = u.displayName || u.email || u.uid;
        const uid = u.uid || u._docId || '';
        const deleteBtn = isCurrentUserAdmin() ? `<button class="btn" onclick="(function(){ deleteUser('${uid}'); })()">Remover</button>` : '';
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px;border-bottom:1px solid var(--border);"><div><strong>${name}</strong><div style="font-size:12px;color:var(--text-muted)">${u.email} · ${role}</div></div><div>${deleteBtn}</div></div>`;
      }).join('');
      wrap.innerHTML = html;
    } catch (e) { console.warn('loadUsersList error', e); }
  };

  // Delete user profile (Firestore doc). Note: does not delete Firebase Auth user.
  window.deleteUser = async function(uid) {
    try {
      if (!isCurrentUserAdmin()) { showToast('Apenas administradores podem remover usuários', 'error'); return; }
      if (!confirm('Remover perfil deste usuário (somente Firestore)?')) return;
      await waitForHelper('firestoreDeleteDoc', 2000);
      const ok = await window.firestoreDeleteDoc('users/' + uid);
      if (ok) { showToast('Perfil removido (Firestore)', 'success'); loadUsersList(); }
      else showToast('Erro removendo perfil', 'error');
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
            window.currentUserProfile = profile || { uid: user.uid, email: user.email, role: 'user', displayName: user.displayName || '' };
            showToast('Conectado como ' + (window.currentUserProfile.displayName || window.currentUserProfile.email), 'info');
            // Hide login screen
            try { if (window.hideLoginModal) window.hideLoginModal(); } catch(e){}
          } else {
            window.currentUser = null;
            window.currentUserProfile = null;
            // Show login screen
            try { if (window.showLoginModal) window.showLoginModal(); } catch(e){}
          }
        } catch (e) { console.warn('auth state handler', e); }
        try { applyRolePermissions(); } catch(e) {}
        try { loadUsersList(); } catch(e) {}
      });
    }
    // After setting auth listener, ensure bootstrap admin exists if no users
    try {
      await createBootstrapAdminIfNeeded();
    } catch(e) {}
  })();

// showLoginModal / hideLoginModal are now defined in index.html inline script
// and exposed on window. Use window.showLoginModal() / window.hideLoginModal().

// Bootstrap an admin user if users collection is empty
async function createBootstrapAdminIfNeeded() {
  try {
    await waitForHelper('firestoreGetCollection', 3000);
    const users = await window.firestoreGetCollection('users');
    if (users && users.length > 0) return false;
    // no users — create the provided admin account
    await waitForHelper('authCreateUser', 3000);
    const email = 'joffre.ribeiro@imbel.gov.br';
    const password = '123';
    const name = 'Joffre Ribeiro';
    try {
      const user = await window.authCreateUser(email, password, { displayName: name, role: 'admin' });
      if (user) {
        showToast('Admin criado e conectado: ' + email, 'success');
        return true;
      }
    } catch (e) {
      console.warn('createBootstrapAdminIfNeeded error creating user', e);
    }
  } catch(e) { console.warn('createBootstrapAdminIfNeeded error', e); }
  return false;
}

// Force create the admin account and sign in (used by UI button)
window.forceCreateAdmin = async function() {
  const email = 'joffre.ribeiro@imbel.gov.br';
  const password = '123';
  const name = 'Joffre Ribeiro';
  try {
    showToast('Criando admin (forçado)...', 'info');
    await waitForHelper('authCreateUser', 5000);
    try {
      const user = await window.authCreateUser(email, password, { displayName: name, role: 'admin' });
      if (user) {
        showToast('Admin criado com sucesso', 'success');
      }
    } catch (e) {
      // If email already in use, show message and attempt sign-in
      console.warn('forceCreateAdmin:create error', e);
      if (e && e.code && e.code === 'auth/email-already-in-use') {
        showToast('Email já existe, tentando entrar...', 'warning');
      } else {
        showToast('Erro criando admin: ' + (e.message || e), 'error');
      }
    }

    // Try to sign in as the admin
    try {
      await waitForHelper('authSignIn', 3000);
      const u = await window.authSignIn(email, password);
      if (u) {
        showToast('Logado como admin', 'success');
      }
    } catch (e) {
      console.warn('forceCreateAdmin: signin error', e);
      showToast('Não foi possível entrar automaticamente: ' + (e.message || e), 'warning');
    }

    // Refresh users list
    try { await loadUsersList(); } catch(e) {}
  } catch (e) {
    console.error('forceCreateAdmin error', e);
    showToast('Erro forçando criação de admin: ' + (e.message || e), 'error');
  }
};
