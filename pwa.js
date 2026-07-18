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
