const fs = require('fs');
let texto = fs.readFileSync('e:\\MEUS DOCUMENTOS\\Downloads\\recursos_gerais_export.csv', 'utf8');
if (texto.charCodeAt(0) === 0xFEFF) texto = texto.substring(1);

function splitCSVLine(line, sep) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch === '"') {
            if (inQuotes && c + 1 < line.length && line[c + 1] === '"') {
                current += '"';
                c++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === sep && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}

const lines = texto.split('\n').filter(l => l.trim());
const headers = splitCSVLine(lines[0], ';').map(h => h.replace(/^"|"$/g, '').trim());
console.log('Headers:', headers.length, headers);
console.log('');

const tedIdx = headers.indexOf('TED');
const transfIdx = headers.indexOf('NC - Transferência');
const ndIdx = headers.indexOf('NC - Natureza Despesa');
const valorIdx = headers.findIndex(h => h.includes('Valor Linha'));
const dataIdx = headers.indexOf('Emissão - Dia');
console.log('Indices: TED=' + tedIdx, 'Transf=' + transfIdx, 'ND=' + ndIdx, 'Valor=' + valorIdx, 'Data=' + dataIdx);

const teds = {};
let erros = 0;
for (let i = 1; i < lines.length; i++) {
    const vals = splitCSVLine(lines[i], ';');
    const ted = (vals[tedIdx] || '').trim();
    if (ted) {
        if (!teds[ted]) teds[ted] = 0;
        teds[ted]++;
    } else {
        erros++;
        if (erros <= 2) console.log('Linha sem TED:', i + 1, vals.slice(0, 8));
    }
}
console.log('');
console.log('TEDs encontrados:', Object.keys(teds).length);
Object.keys(teds).sort().forEach(t => console.log('  ' + t + ': ' + teds[t] + ' linhas'));
console.log('Linhas sem TED:', erros);
