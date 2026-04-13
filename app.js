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
      console.warn('auto carregarDoCloud falhou', e);
    }

  })();

  // ===== User management and role enforcement =====
  // Apply role-based UI permissions (admin vs user)
  function isCurrentUserAdmin() {
    try {
      const role = window.currentUserProfile && window.currentUserProfile.role;
      return Boolean(role && String(role).toLowerCase() === 'admin');
    } catch (e) { return false; }
  }

  function applyRolePermissions() {
    const admin = isCurrentUserAdmin();
    try { document.body.dataset.role = admin ? 'admin' : 'user'; } catch(e) {}
    if (window.updateAdminUI) {
      try { window.updateAdminUI(admin); } catch(e) { console.warn('updateAdminUI error', e); }
    }
  }

  // Renderiza e inicializa o conteúdo das abas administrativas quando o usuário for admin
  function renderizarConteudoAbasAdmin() {
    const admin = isCurrentUserAdmin();
    console.log('[Permissões] isAdmin =', admin);

    const mapaAbas = {
      configuracoes: 'tab-configuracoes',
      relatorios:    'tab-relatorios'
    };

    Object.entries(mapaAbas).forEach(([abaId, btnId]) => {
      const aba = document.getElementById(abaId);
      const btn = document.getElementById(btnId)
                || document.querySelector(`[data-tab="${abaId}"]`)
                || document.querySelector(`button[onclick*="${abaId}"]`);

      if (!aba) {
        console.warn('[Permissões] Aba não encontrada no DOM:', abaId);
        return;
      }

      if (admin) {
        aba.style.display = '';
        if (btn) btn.style.display = '';

        if (!aba.dataset.rendered || aba.dataset.rendered === 'false') {
          console.log('[Permissões] Renderizando conteúdo da aba:', abaId);
          try { dispararRenderAba(abaId); } catch(e) { console.warn('dispararRenderAba error', e); }
          aba.dataset.rendered = 'true';
        }
      } else {
        aba.style.display = 'none';
        if (btn) btn.style.display = 'none';
        if (aba) aba.dataset.rendered = 'false';
      }
    });
  }

  function dispararRenderAba(abaId) {
    switch (abaId) {
      case 'configuracoes':
        try { if (typeof renderConfiguracoes    === 'function') renderConfiguracoes();    } catch(e){}
        try { if (typeof inicializarConfiguracoes === 'function') inicializarConfiguracoes(); } catch(e){}
        try { if (typeof carregarConfiguracoes  === 'function') carregarConfiguracoes();  } catch(e){}
        try {
          const btn = document.querySelector(`button[onclick*="configuracoes"]`) || document.getElementById('tab-configuracoes');
          if (btn && typeof btn.click === 'function') {
            const evt = new CustomEvent('tab-init', { detail: { tabId: 'configuracoes' } });
            document.dispatchEvent(evt);
          }
        } catch(e){}
        break;

      case 'relatorios':
        // garantir que os filtros estejam populados antes de renderizar os relatórios
        try { if (typeof popularFiltrosRelatorios === 'function') popularFiltrosRelatorios(); } catch(e){}
        try { if (typeof atualizarSeletorTED === 'function') atualizarSeletorTED(); } catch(e){}
        try { if (typeof renderRelatorios      === 'function') renderRelatorios();      } catch(e){}
        try { if (typeof inicializarRelatorios === 'function') inicializarRelatorios(); } catch(e){}
        try { if (typeof carregarRelatorios    === 'function') carregarRelatorios();    } catch(e){}
        try {
          const evt = new CustomEvent('tab-init', { detail: { tabId: 'relatorios' } });
          document.dispatchEvent(evt);
        } catch(e){}
        break;

      default:
        console.warn('[dispararRenderAba] Aba desconhecida:', abaId);
    }
  }

  window.renderizarConteudoAbasAdmin = renderizarConteudoAbasAdmin;
  window.dispararRenderAba = dispararRenderAba;

  // Expose helpers globally so they can be used from the console
  // and by inline scripts that are not module-scoped.
  window.isCurrentUserAdmin = isCurrentUserAdmin;
  window.applyRolePermissions = applyRolePermissions;

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

  // Listen to auth state and load profile (improved: retry + render admin tabs)
  ;(async function(){
    await waitForHelper('authOnStateChanged', 5000);
    if (!window.authOnStateChanged) {
      console.warn('[Auth] authOnStateChanged não disponível');
      return;
    }

    window.authOnStateChanged(async (user) => {
      try {
        if (user) {
          window.currentUser = user;

          // Busca perfil com retry (até 3 tentativas com backoff)
          let profile = null;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              if (window.firestoreGetDoc) {
                profile = await window.firestoreGetDoc('users/' + user.uid);
                if (profile) break;
              }
            } catch (e) {
              console.warn(`[Auth] Tentativa ${attempt + 1} de carregar perfil falhou`, e);
              await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
            }
          }

          window.currentUserProfile = profile || {
            uid: user.uid,
            email: user.email,
            role: 'user',
            displayName: user.displayName || ''
          };

          console.log('[Auth] Perfil carregado:', window.currentUserProfile);
          showToast(
            'Conectado como ' + (window.currentUserProfile.displayName || window.currentUserProfile.email),
            'info'
          );
          try { if (window.hideLoginModal) window.hideLoginModal(); } catch(e){}

        } else {
          window.currentUser = null;
          window.currentUserProfile = null;
        }
      } catch (e) {
        console.warn('[Auth] Erro no handler de estado', e);
      }

      // Aguarda o DOM estar pronto antes de aplicar permissões
      await new Promise(r => setTimeout(r, 150));

      try {
        applyRolePermissions();
        if (typeof window.renderizarConteudoAbasAdmin === 'function') {
          window.renderizarConteudoAbasAdmin();
        }
      } catch(e) {
        console.warn('[Auth] Erro aplicando permissões', e);
      }
    });

    try { await createBootstrapAdminIfNeeded(); } catch(e) {}
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
    const password = '123456';
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
  const password = '123456';
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
