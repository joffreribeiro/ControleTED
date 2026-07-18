/**
 * Gera o APK debug e publica como release no GitHub, sob um nome de asset FIXO
 * ('controle-ted.apk') — é o que faz o link .../releases/latest/download/controle-ted.apk
 * (usado pelo banner de "app desatualizado" em pwa.js) sempre resolver pra versão mais
 * nova, sem precisar editar link nenhum a cada release.
 *
 * Pré-requisito: gh CLI instalado E autenticado (`gh auth login`) — publicar é uma ação
 * que expõe conteúdo publicamente, então esse passo é sempre manual/deliberado, nunca
 * automático (não rodar isso a partir de um hook/CI sem revisão).
 *
 * Uso: node scripts/release-apk.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REPO = 'joffreribeiro/ControleTED';
const ASSET_NAME = 'controle-ted.apk';
const APK_SRC = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');

function run(cmd, args, cwd) {
    console.log('[release-apk] $ ' + cmd + ' ' + args.join(' '));
    if (process.platform === 'win32') {
        // No Windows, execFileSync com shell:true (necessário pra rodar gradlew.bat) NÃO
        // escapa os argumentos — só concatena com espaço antes de repassar pro cmd.exe.
        // Qualquer argumento com espaço (caminho com pasta "OneDrive\Documentos\Trabalho e
        // Projetos\...", --title/--notes com texto) vira vários argumentos separados pro
        // comando de destino. Aspar manualmente cada argumento com espaço evita isso.
        const quoted = args.map(a => /[\s"]/.test(a) ? '"' + String(a).replace(/"/g, '\\"') + '"' : a);
        execFileSync(cmd, quoted, { cwd: cwd || ROOT, stdio: 'inherit', shell: true });
    } else {
        execFileSync(cmd, args, { cwd: cwd || ROOT, stdio: 'inherit' });
    }
}

function lerVersao() {
    const versionJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));
    const version = versionJson.version;
    if (!version) throw new Error('version.json sem campo "version"');
    return version;
}

function main() {
    // 0. Checar gh CLI ANTES de gastar tempo compilando — falha rápida e clara.
    try {
        execFileSync('gh', ['auth', 'status'], { stdio: 'ignore', shell: process.platform === 'win32' });
    } catch (e) {
        console.error('[release-apk] gh CLI não encontrado ou não autenticado.');
        console.error('[release-apk] Instale (https://cli.github.com) e rode: gh auth login');
        process.exit(1);
    }

    const version = lerVersao();
    const tag = 'v' + version;
    console.log('[release-apk] Versão (version.json): ' + version + ' -> tag ' + tag);

    // 1-3. Build da build web + sync Capacitor + compilar APK debug
    run('node', ['scripts/build-www.js']);
    run('npx', ['cap', 'sync', 'android']);
    // No Windows, execFileSync com shell:true não busca no cwd sem o prefixo './' —
    // sem ele, cmd.exe responde "não é reconhecido" mesmo com o arquivo presente ali.
    const gradlew = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';
    run(gradlew, ['assembleDebug'], path.join(ROOT, 'android'));

    if (!fs.existsSync(APK_SRC)) {
        console.error('[release-apk] APK não encontrado em ' + APK_SRC + ' após o build.');
        process.exit(1);
    }

    // 4. Copiar para um nome fixo (o nome do arquivo de origem do gradle não muda entre
    // builds, mas isolar numa cópia evita qualquer acoplamento com o layout de output do AGP)
    const distDir = path.join(ROOT, 'dist-release');
    fs.mkdirSync(distDir, { recursive: true });
    const apkDist = path.join(distDir, ASSET_NAME);
    fs.copyFileSync(APK_SRC, apkDist);
    console.log('[release-apk] APK copiado para ' + apkDist);

    // 5. Publicar/atualizar a release no GitHub
    const tagExiste = (() => {
        try {
            execFileSync('gh', ['release', 'view', tag, '--repo', REPO], { stdio: 'ignore', shell: process.platform === 'win32' });
            return true;
        } catch (e) { return false; }
    })();

    if (tagExiste) {
        console.log('[release-apk] Release ' + tag + ' já existe — atualizando o asset (--clobber).');
        run('gh', ['release', 'upload', tag, apkDist, '--repo', REPO, '--clobber']);
    } else {
        console.log('[release-apk] Criando release ' + tag + '.');
        run('gh', ['release', 'create', tag, apkDist,
            '--repo', REPO,
            '--title', 'Controle TED ' + version,
            '--notes', 'Build automatizado via scripts/release-apk.js. Versão: ' + version + '.']);
    }

    console.log('[release-apk] Pronto. Download estável: https://github.com/' + REPO + '/releases/latest/download/' + ASSET_NAME);
}

main();
