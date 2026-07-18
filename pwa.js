/**
 * pwa.js — registro do Service Worker e gestão de instalação/atualização da PWA.
 * Padrão portado de ../Ponto/pwa.js, adaptado para os helpers já existentes no
 * Controle TED (showToast/confirmarAcao em js/main.js) em vez do módulo Notifications
 * do Ponto, e injetando o botão de instalação na sidebar em vez de um <header>.
 */

const PWA = {
    deferredPrompt: null,
    isInstalled: false,

    init() {
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.checkInstallStatus();
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
        if (reloadBtn) reloadBtn.addEventListener('click', () => window.location.reload());
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

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('[PWA] Prompt de instalação disponível');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            console.log('[PWA] App instalado');
            this.isInstalled = true;
            this.hideInstallButton();
            if (typeof window.showToast === 'function') window.showToast('App instalado com sucesso!', 'success');
        });
    },

    showInstallButton() {
        let btn = document.getElementById('pwa-install-btn');

        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'pwa-install-btn';
            btn.className = 'topbar-btn';
            btn.title = 'Instalar como aplicativo';
            btn.innerHTML = '<i data-lucide="download" class="inline-icon-sm"></i> Instalar App';
            btn.onclick = () => this.promptInstall();

            const actions = document.querySelector('.sidebar-actions');
            if (actions) {
                const row = document.createElement('div');
                row.className = 'sidebar-action-btns';
                row.style.marginTop = '6px';
                row.appendChild(btn);
                actions.appendChild(row);
                try { if (typeof window.initLucideIcons === 'function') window.initLucideIcons(); else if (window.lucide) window.lucide.createIcons(); } catch (e) {}
            }
        }

        btn.style.display = 'inline-flex';
    },

    hideInstallButton() {
        const btn = document.getElementById('pwa-install-btn');
        if (btn) btn.style.display = 'none';
    },

    async promptInstall() {
        if (!this.deferredPrompt) {
            if (typeof window.showToast === 'function') window.showToast('App já está instalado ou não pode ser instalado neste navegador', 'info');
            return;
        }

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log('[PWA] Resultado da instalação:', outcome);

        if (outcome === 'accepted' && typeof window.showToast === 'function') {
            window.showToast('Instalando aplicativo...', 'success');
        }

        this.deferredPrompt = null;
        this.hideInstallButton();
    },

    checkInstallStatus() {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isIOSStandalone = isIOS && window.navigator && !!window.navigator.standalone;

        this.isInstalled = isStandalone || isIOSStandalone;

        if (this.isInstalled) {
            console.log('[PWA] App está rodando como instalado');
            this.hideInstallButton();
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
