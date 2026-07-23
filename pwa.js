/**
 * pwa.js — registro do Service Worker e checagem de versão (site e APK Android).
 * O prompt de "instalar como app" (beforeinstallprompt) foi removido por pedido do
 * usuário — o app continua funcionando como PWA/instalável pelo menu nativo do
 * navegador, só não oferece mais um botão próprio convidando pra isso.
 */

const PWA = {
    init() {
        this.registerServiceWorker();
        this.setupUpdateNotification();
        this.checkAppVersion();
    },

    // Detecta apps "congelados" que não conseguem se auto-atualizar pela rede — sobretudo
    // o APK Android (Capacitor): ele carrega js/main.js, app.js etc. do pacote local
    // (webDir empacotado no build), não do Firebase Hosting, então um `firebase deploy`
    // sozinho nunca chega até um aparelho com o APK já instalado (ver bug dos TEDs
    // ressuscitados por cache/autosave — o mesmo problema de "código antigo rodando" pode
    // se repetir de outras formas). Compara a versão empacotada nesta build
    // (window.APP_BUILD_VERSION, definida inline em index.html) com version.json,
    // lido sempre do Hosting ao vivo (cache: 'no-store' + cache-busting) para nunca aceitar
    // uma resposta de cache/CDN velha.
    // Nome fixo do asset em TODA release do GitHub (ver scripts/release-apk.js) — é o que
    // permite usar o alias .../releases/latest/download/<nome>, que sempre resolve pro
    // asset da release mais recente sem precisar atualizar link nenhum a cada versão nova.
    APK_DOWNLOAD_URL: 'https://github.com/joffreribeiro/ControleTED/releases/latest/download/controle-ted.apk',

    checkAppVersion() {
        const HOSTING_VERSION_URL = 'https://controleted.web.app/version.json';

        const attempt = async () => {
            if (!navigator.onLine) return;
            try {
                const resp = await fetch(HOSTING_VERSION_URL + '?t=' + Date.now(), { cache: 'no-store' });
                if (!resp.ok) return;
                const data = await resp.json();
                const latest = data && data.version;
                const current = window.APP_BUILD_VERSION;
                if (latest && current && latest !== current) {
                    // Marcar como desatualizado: js/main.js bloqueia a GRAVAÇÃO nesse estado,
                    // porque uma build antiga salvando por cima apaga alterações de outros
                    // usuários (ver _bloqueadoPorVersaoDesatualizada). Só marcamos com
                    // mismatch confirmado — falha de rede/CORS cai no catch e não marca.
                    window._appDesatualizado = true;

                    // Atualizar SOZINHO no navegador, em vez de depender de o usuário ver e
                    // clicar no banner. Enquanto alguém fica numa build antiga o sistema é
                    // inconsistente entre as máquinas, então quanto menos passos manuais,
                    // melhor. Guarda em sessionStorage evita laço de recarga: tenta no
                    // máximo UMA vez por versão-alvo por sessão; se ainda assim continuar
                    // desatualizado, cai no banner manual.
                    const isNative = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
                    let jaTentou = false;
                    try { jaTentou = sessionStorage.getItem('pwa_auto_upd') === String(latest); } catch (e) {}
                    // No app nativo recarregar não adianta (o código vem empacotado no APK),
                    // então lá sempre mostramos o banner com o link de download.
                    if (!isNative && !jaTentou) {
                        try { sessionStorage.setItem('pwa_auto_upd', String(latest)); } catch (e) {}
                        console.log('[PWA] Versão ' + latest + ' disponível — atualizando automaticamente.');
                        this.limparCachesERecarregar();
                        return;
                    }
                    this.showVersionBanner(latest);
                }
            } catch (e) {
                // Rede instável, CORS bloqueado, ou offline "silencioso": não é um erro
                // acionável pelo usuário — não interromper o carregamento do app por isso.
                console.warn('[PWA] checkAppVersion falhou (não crítico):', e);
            }
        };

        attempt();
        // Se a primeira tentativa caiu offline, tentar de novo assim que a conexão voltar.
        window.addEventListener('online', () => attempt(), { once: true });
    },

    showVersionBanner(latestVersion) {
        if (document.getElementById('pwa-version-banner')) return; // já exibido nesta sessão

        const isNative = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());

        const banner = document.createElement('div');
        banner.id = 'pwa-version-banner';
        banner.className = 'pwa-version-banner';

        const msg = isNative
            ? 'Este aplicativo instalado está desatualizado.'
            : 'Há uma nova versão do sistema disponível.';

        banner.innerHTML =
            '<span class="pwa-version-banner-text">🔄 ' + msg + '</span>' +
            '<span class="pwa-version-banner-actions">' +
            (isNative
                ? '<button type="button" class="pwa-version-banner-btn" id="pwa-version-banner-download">Baixar atualização</button>'
                : '<button type="button" class="pwa-version-banner-btn" id="pwa-version-banner-reload">Atualizar agora</button>') +
            '<button type="button" class="pwa-version-banner-close" id="pwa-version-banner-close" aria-label="Fechar aviso">&times;</button>' +
            '</span>';

        document.body.appendChild(banner);

        const reloadBtn = document.getElementById('pwa-version-banner-reload');
        if (reloadBtn) reloadBtn.addEventListener('click', () => this.limparCachesERecarregar());
        const downloadBtn = document.getElementById('pwa-version-banner-download');
        if (downloadBtn) downloadBtn.addEventListener('click', () => {
            // '_system' é a convenção Cordova/Capacitor pra abrir no navegador padrão do
            // aparelho em vez de navegar dentro da própria WebView (que não sabe lidar com
            // o download/instalação de um .apk). Sem isso a WebView provavelmente só
            // tentaria renderizar o arquivo binário e falharia em silêncio.
            window.open(this.APK_DOWNLOAD_URL, '_system');
        });
        const closeBtn = document.getElementById('pwa-version-banner-close');
        if (closeBtn) closeBtn.addEventListener('click', () => banner.remove());
    },

    // Um reload simples NÃO era suficiente: o Service Worker podia continuar servindo os
    // .js antigos do cache (app.js/firebase-init.js eram "cache primeiro"), então o usuário
    // clicava "Atualizar agora", a página recarregava e continuava na versão velha — e sem
    // saber disso ele seguia sobrescrevendo dados de outros usuários. Aqui apagamos os
    // caches e desregistramos o SW antes de recarregar, pra garantir código novo.
    async limparCachesERecarregar() {
        try {
            if (window.caches && caches.keys) {
                const nomes = await caches.keys();
                await Promise.all(nomes.map(n => caches.delete(n)));
            }
        } catch (e) { console.warn('[PWA] falha limpando caches', e); }
        try {
            if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(r => r.unregister()));
            }
        } catch (e) { console.warn('[PWA] falha desregistrando SW', e); }
        // Cache-busting na própria navegação, pra não reaproveitar o HTML do cache HTTP.
        try {
            const u = new URL(window.location.href);
            u.searchParams.set('_upd', Date.now().toString(36));
            window.location.replace(u.toString());
        } catch (e) { window.location.reload(); }
    },

    async registerServiceWorker() {
        // Ignorar registro em file:// (abrir index.html direto do disco, sem servidor)
        if (location.protocol === 'file:' || location.origin === 'null') {
            console.log('[PWA] Ambiente local (file://) detectado — registro de Service Worker ignorado');
            return;
        }

        if (!('serviceWorker' in navigator)) {
            console.log('[PWA] Service Worker não suportado');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('[PWA] Service Worker registrado:', registration);

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateNotification();
                    }
                });
            });
        } catch (error) {
            console.error('[PWA] Erro ao registrar Service Worker:', error);
        }
    },

    showUpdateNotification() {
        if (typeof window.confirmarAcao === 'function') {
            window.confirmarAcao('Nova versão disponível. Deseja atualizar agora?', () => {
                window.location.reload();
            }, 'Atualizar');
        } else {
            window.location.reload();
        }
    },

    setupUpdateNotification() {
        let refreshing = false;
        navigator.serviceWorker?.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PWA.init());
} else {
    PWA.init();
}

window.PWA = PWA;
