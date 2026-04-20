/**
 * ARQUIVO LEGADO — Não usado em produção.
 * O backend ativo é backend/src/index.ts (TypeScript/Express).
 * Não adicionar novas funcionalidades aqui. Planejado para remoção.
 *
 * ----
 * Servidor simples para compartilhar dados do sistema TED entre navegadores.
 *
 * USO:  node servidor.js
 *
 * Não precisa de nenhuma instalação (npm install, etc).
 * Basta ter o Node.js instalado e executar o comando acima.
 *
 * Ao abrir http://localhost:5000 no navegador, o sistema carrega automaticamente.
 *
 * ARQUITETURA:
 * Este é o servidor de produção atual. Persiste os dados em JSON local (dados/ted-sistema.json)
 * e não requer banco de dados.
 *
 * O diretório backend/ contém uma implementação alternativa em TypeScript com Express +
 * PostgreSQL + JWT, ainda não integrada ao frontend. Quando essa migração for concluída,
 * este arquivo poderá ser removido.
 *
 * Variáveis de ambiente opcionais (mesmas aceitas pelo backend/):
 *   TED_DATA_FILE — caminho absoluto para o arquivo JSON de dados
 *   TED_DATA_DIR  — diretório onde criar ted-sistema.json (ignorado se TED_DATA_FILE definido)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const INDEX_FILE = path.join(__dirname, 'index.html');

const DEFAULT_DATA = { teds: [], proxiId: 1 };

// Resolve o caminho do arquivo de dados — mesma lógica do backend/src/services/fileStorage.ts
function getDataFilePath() {
    const explicitFile = (process.env.TED_DATA_FILE || '').trim();
    if (explicitFile) return path.resolve(explicitFile);
    const explicitDir = (process.env.TED_DATA_DIR || '').trim();
    if (explicitDir) return path.resolve(explicitDir, 'ted-sistema.json');
    return path.join(__dirname, 'dados', 'ted-sistema.json');
}

const DATA_FILE = getDataFilePath();
const DATA_DIR = path.dirname(DATA_FILE);

// Extensões de arquivo para servir estáticos (se necessário no futuro)
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Garantir que a pasta dados existe
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Garantir que o arquivo de dados existe
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
}

// Normaliza o valor lido/recebido — mesma lógica do backend/src/services/fileStorage.ts
function normalizarDados(valor) {
    if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
        return { ...DEFAULT_DATA };
    }
    const proxiId = (typeof valor.proxiId === 'number' && isFinite(valor.proxiId) && valor.proxiId >= 1)
        ? valor.proxiId : 1;
    return {
        ...valor,
        teds: Array.isArray(valor.teds) ? valor.teds : [],
        proxiId
    };
}

function lerDados() {
    try {
        const conteudo = fs.readFileSync(DATA_FILE, 'utf-8').trim();
        if (!conteudo) return { ...DEFAULT_DATA };
        return normalizarDados(JSON.parse(conteudo));
    } catch (e) {
        console.error('Erro ao ler arquivo de dados:', e.message);
        return { ...DEFAULT_DATA };
    }
}

function salvarDados(dados) {
    const normalizado = normalizarDados(dados);
    // Escrita atômica: gravar em .tmp e depois renomear
    const tmpFile = DATA_FILE + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(normalizado, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DATA_FILE);
    return normalizado;
}

function enviarJSON(res, statusCode, obj) {
    const body = JSON.stringify(obj);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store'
    });
    res.end(body);
}

function enviarArquivo(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Arquivo não encontrado');
            return;
        }
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        });
        res.end();
        return;
    }

    const url = req.url.split('?')[0]; // ignorar query string

    // API: Health check
    if (url === '/api/health' && req.method === 'GET') {
        return enviarJSON(res, 200, { status: 'OK', timestamp: new Date().toISOString() });
    }

    // API: Status do armazenamento
    if (url === '/api/storage/status' && req.method === 'GET') {
        const dados = lerDados();
        return enviarJSON(res, 200, {
            mode: 'file',
            path: DATA_FILE,
            items: dados.teds.length
        });
    }

    // API: Ler dados
    if (url === '/api/storage/app-data' && req.method === 'GET') {
        const dados = lerDados();
        return enviarJSON(res, 200, dados);
    }

    // API: Salvar dados
    if (url === '/api/storage/app-data' && req.method === 'PUT') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const salvo = salvarDados(payload);
                enviarJSON(res, 200, { message: 'Dados salvos com sucesso', data: salvo });
            } catch (e) {
                console.error('Erro ao salvar dados:', e.message);
                enviarJSON(res, 400, { error: 'JSON inválido: ' + e.message });
            }
        });
        return;
    }

    // Página principal
    if (url === '/' || url === '/index.html') {
        return enviarArquivo(res, INDEX_FILE);
    }

    // Outros arquivos estáticos (para futuro uso)
    const resolved = path.resolve(__dirname, path.normalize(url).replace(/^[/\\]/, ''));
    if (!resolved.startsWith(__dirname + path.sep)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Proibido');
        return;
    }
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
        return enviarArquivo(res, resolved);
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Não encontrado');
});

server.listen(PORT, () => {
    console.log('');
    console.log('==============================================');
    console.log('  Sistema TED - Servidor de Dados');
    console.log('==============================================');
    console.log('');
    console.log(`  Abra no navegador: http://localhost:${PORT}`);
    console.log('');
    console.log(`  Arquivo de dados:  ${DATA_FILE}`);
    console.log('');
    console.log('  Para parar: Ctrl+C');
    console.log('==============================================');
    console.log('');
});
