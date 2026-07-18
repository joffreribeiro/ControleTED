/**
 * Popula www/ com os arquivos estáticos reais do Controle TED, pra servir de webDir do
 * Capacitor. NÃO é um build do site — o site continua sendo os mesmos arquivos servidos
 * direto pelo Firebase Hosting a partir da raiz do repo, sem transpile/bundle nenhum.
 * Isso existe só porque apontar o webDir do Capacitor pra raiz do repo levaria junto
 * frontend/, backend/, node_modules/, backups etc. — usar lista de permissão explícita
 * é mais seguro do que uma lista de exclusão nesse repo (tem bastante arquivo solto na
 * raiz que não faz parte do site: scripts de teste, ARCHITECTURE.md, .env.example...).
 *
 * Uso: node scripts/build-www.js  (rodar antes de `npx cap sync android`)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');

// Mesma lista de CACHE_ASSETS do sw.js, mais manifest/ícones (o SW não precisa se
// auto-cachear, mas o wrapper Android precisa empacotar o próprio sw.js e os ícones).
const FILES = [
    'index.html',
    'styles.css',
    'js/main.js',
    'firebase-init.js',
    'app.js',
    'pwa.js',
    'sw.js',
    'manifest.json',
    'favicon.svg',
    'logo-controle-ted.svg',
    'icon-72.png',
    'icon-96.png',
    'icon-128.png',
    'icon-144.png',
    'icon-152.png',
    'icon-192.png',
    'icon-384.png',
    'icon-512.png',
    'icon-maskable-192.png',
    'icon-maskable-512.png'
];

function limparWww() {
    if (fs.existsSync(WWW)) fs.rmSync(WWW, { recursive: true, force: true });
    fs.mkdirSync(WWW, { recursive: true });
}

function copiar(relPath) {
    const src = path.join(ROOT, relPath);
    const dest = path.join(WWW, relPath);
    if (!fs.existsSync(src)) {
        console.warn('[build-www] AUSENTE (pulado):', relPath);
        return false;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    return true;
}

limparWww();
let ok = 0;
for (const f of FILES) {
    if (copiar(f)) ok++;
}
console.log(`[build-www] ${ok}/${FILES.length} arquivos copiados para www/`);
if (ok !== FILES.length) {
    console.error('[build-www] Algum arquivo esperado não foi encontrado — confira a lista acima antes de gerar o APK.');
    process.exit(1);
}
