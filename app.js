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
    // Atualizar in-place para que referências locais em main.js (var dados) continuem válidas
    window.dados.teds.splice(0, window.dados.teds.length, ...normalized);
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

    // Re-sincronizar tedSelecionado com o novo objeto do Firestore e re-renderizar tabelas
    try {
      if (window.tedSelecionado && window.tedSelecionado.id != null) {
        const tedId = window.tedSelecionado.id;
        if (typeof window.carregarDetalhes === 'function') {
          window.carregarDetalhes(tedId);
        }
      }
    } catch(e) { console.warn('re-sync tedSelecionado após carregarDoCloud:', e); }

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
      const role = (document.getElementById('create_role') || {}).value || 'leitor';
      const upRestritaEl = document.getElementById('create_up');
      const upRestrita = upRestritaEl ? (upRestritaEl.value || null) : null;
      const activeEl = document.getElementById('create_active');
      const active = activeEl ? activeEl.checked : true;

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
      const user = await window.authCreateUser(email, password, {
        displayName: name,
        role: role,
        upRestrita: (role === 'editor' && upRestrita) ? upRestrita : null,
        active: active
      });
      if (user) {
        showToast('Usuário criado com sucesso', 'success');
        // Limpar formulário
        ['create_email','create_password','create_name'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        if (upRestritaEl) upRestritaEl.value = '';
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
        wrap.innerHTML = '<div style="padding:8px;color:var(--text-muted)">Nenhum usuário cadastrado.</div>';
        return;
      }

      const roleLabels = { admin: '🔑 Admin', editor: '✏️ Editor', leitor: '📖 Leitor', user: '📖 Leitor' };

      users.forEach(u => {
        const role = u.role || 'leitor';
        const name = u.displayName || u.email || u.uid || '';
        const uid = u.uid || u._docId || '';
        const upInfo = u.upRestrita ? ' | UP: ' + u.upRestrita : '';
        const activeStatus = u.active === false ? ' | ⛔ Inativo' : '';

        const row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 4px;border-bottom:1px solid var(--border);gap:8px';

        const info = document.createElement('div');
        info.style.cssText = 'flex:1;min-width:0';
        const strong = document.createElement('div');
        strong.style.cssText = 'font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
        strong.textContent = name;
        const sub = document.createElement('div');
        sub.style.cssText = 'font-size:12px;color:var(--text-muted);margin-top:2px';
        sub.textContent = (u.email || '') + ' · ' + (roleLabels[role] || role) + upInfo + activeStatus;
        info.appendChild(strong);
        info.appendChild(sub);

        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:6px;flex-shrink:0';

        if (isCurrentUserAdmin() && uid) {
          // Botão ativar/desativar
          const btnToggle = document.createElement('button');
          btnToggle.className = 'btn';
          btnToggle.style.cssText = 'font-size:12px;padding:4px 8px';
          btnToggle.textContent = u.active === false ? 'Ativar' : 'Desativar';
          btnToggle.addEventListener('click', () => window.toggleUserActive(uid, !(u.active === false)));
          actions.appendChild(btnToggle);

          const btnRemove = document.createElement('button');
          btnRemove.className = 'btn';
          btnRemove.style.cssText = 'font-size:12px;padding:4px 8px';
          btnRemove.textContent = 'Remover';
          btnRemove.addEventListener('click', () => window.deleteUser(uid));
          actions.appendChild(btnRemove);
        }

        row.appendChild(info);
        row.appendChild(actions);
        wrap.appendChild(row);
      });
    } catch (e) { console.warn('loadUsersList error', e); }
  };

  // Toggle user active status
  window.toggleUserActive = async function(uid, newActive) {
    try {
      if (!isCurrentUserAdmin()) { showToast('Apenas administradores podem alterar usuários', 'error'); return; }
      await waitForHelper('firestoreSetDoc', 2000);
      await window.firestoreSetDoc('users/' + uid, { active: newActive }, { merge: true });
      showToast(newActive ? 'Usuário ativado' : 'Usuário desativado', 'success');
      loadUsersList();
    } catch (e) { console.warn('toggleUserActive', e); showToast('Erro ao alterar status', 'error'); }
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

  // Load and render audit log (admin only)
  window.loadAuditLog = async function(filterTedId) {
    try {
      if (!isCurrentUserAdmin()) return;
      const wrap = document.getElementById('auditLogContainer');
      if (!wrap) return;
      wrap.innerHTML = '<div style="padding:8px;color:var(--text-muted)">Carregando...</div>';

      await waitForHelper('firestoreQueryCollection', 3000);
      const logs = await window.firestoreQueryCollection('auditLog', { orderByField: 'dataHora', orderDir: 'desc', limitCount: 200 });

      const filtered = filterTedId ? logs.filter(l => String(l.tedId) === String(filterTedId) || String(l.tedNumero) === String(filterTedId)) : logs;

      if (!filtered || filtered.length === 0) {
        wrap.innerHTML = '<div style="padding:8px;color:var(--text-muted)">Nenhum registro encontrado.</div>';
        return;
      }

      const acaoLabels = {
        'editar_info': 'Editou informações gerais',
        'adicionar_fisico': 'Adicionou cadastro físico',
        'editar_fisico': 'Editou cadastro físico',
        'remover_fisico': 'Removeu cadastro físico',
        'adicionar_exec_fisica': 'Adicionou execução física',
        'remover_exec_fisica': 'Removeu execução física',
        'marcar_realizado': 'Marcou entrega como realizada',
        'desmarcar_realizado': 'Removeu marcação de entrega',
        'editar_realizado': 'Editou entrega realizada',
        'adicionar_financeiro': 'Adicionou cadastro financeiro',
        'editar_financeiro': 'Editou cadastro financeiro',
        'remover_financeiro': 'Removeu cadastro financeiro',
        'adicionar_exec_financeira': 'Adicionou execução financeira',
        'remover_exec_financeira': 'Removeu execução financeira'
      };

      let html = '<table style="width:100%;border-collapse:collapse;font-size:13px">';
      html += '<thead><tr style="background:var(--bg-secondary);text-align:left">';
      html += '<th style="padding:6px 8px;border-bottom:1px solid var(--border)">Data/Hora</th>';
      html += '<th style="padding:6px 8px;border-bottom:1px solid var(--border)">Usuário</th>';
      html += '<th style="padding:6px 8px;border-bottom:1px solid var(--border)">TED</th>';
      html += '<th style="padding:6px 8px;border-bottom:1px solid var(--border)">Ação</th>';
      html += '<th style="padding:6px 8px;border-bottom:1px solid var(--border)">Detalhe</th>';
      html += '</tr></thead><tbody>';

      filtered.forEach(l => {
        const dt = new Date(l.dataHora);
        const dtStr = isNaN(dt) ? l.dataHora : dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const acaoStr = acaoLabels[l.acao] || l.acao || '';
        const detalhe = l.campo ? l.campo : '';
        html += `<tr style="border-bottom:1px solid var(--border)">
          <td style="padding:5px 8px;white-space:nowrap">${dtStr}</td>
          <td style="padding:5px 8px">${l.usuarioNome || ''}</td>
          <td style="padding:5px 8px">${l.tedNumero || l.tedId || ''}</td>
          <td style="padding:5px 8px">${acaoStr}</td>
          <td style="padding:5px 8px;color:var(--text-muted)">${detalhe}</td>
        </tr>`;
      });

      html += '</tbody></table>';
      wrap.innerHTML = html;
    } catch (e) { console.warn('loadAuditLog error', e); }
  };

  // Populate UP select in create user form
  window.popularUpsFormUsuario = function() {
    const sel = document.getElementById('create_up');
    if (!sel) return;
    const ups = [...new Set((window.dados && window.dados.teds ? window.dados.teds : [])
      .map(t => t.upResponsavel || t.up || '').filter(Boolean))].sort();
    sel.innerHTML = '<option value="">Todas as UPs</option>';
    ups.forEach(up => {
      const opt = document.createElement('option');
      opt.value = up;
      opt.textContent = up;
      sel.appendChild(opt);
    });
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
              // Normalizar role legado: 'user' → 'leitor'
              if (profile.role === 'user') profile.role = 'leitor';
              // Verificar se conta está ativa
              if (profile.active === false) {
                showToast('Sua conta está desativada. Entre em contato com o administrador.', 'error');
                if (window.authSignOut) window.authSignOut();
                return;
              }
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
