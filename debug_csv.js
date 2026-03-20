// Debug: simular exatamente o que o parser faz com o CSV real
const fs = require('fs');

let texto = fs.readFileSync(String.raw`e:\MEUS DOCUMENTOS\Downloads\recursos_gerais_export.csv`, 'utf8');
if (texto.charCodeAt(0) === 0xFEFF) texto = texto.substring(1);

const separador = ';';

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
const headers = splitCSVLine(lines[0], separador).map(h => h.replace(/^"|"$/g, '').trim());

let out = '';
out += 'HEADERS (' + headers.length + '):\n';
headers.forEach((h, i) => { out += '  [' + i + '] "' + h + '" (len=' + h.length + ')\n'; });

// Check a few data lines
const problemLines = [];
for (let i = 1; i < Math.min(lines.length, 100); i++) {
    const values = splitCSVLine(lines[i], separador);
    if (values.length !== headers.length) {
        problemLines.push({ line: i, fields: values.length, expected: headers.length });
    }
}
out += '\nPROBLEM LINES (field count != header count) in first 100:\n';
problemLines.forEach(p => { out += '  Line ' + p.line + ': ' + p.fields + ' fields (expected ' + p.expected + ')\n'; });

// Check what colND finds
const findHeader = (keywords, exact) => {
    if (exact) {
        for (const h of headers) {
            if (h === exact || h.toLowerCase() === exact.toLowerCase()) return { h, method: 'exact' };
        }
    }
    for (const h of headers) {
        const hLow = h.toLowerCase();
        if (keywords.every(kw => hLow.indexOf(kw.toLowerCase()) > -1)) return { h, method: 'keyword' };
    }
    return null;
};

out += '\nCOLUMN DETECTION:\n';
out += '  colTransf: ' + JSON.stringify(findHeader(['transfer'], 'NC - Transferência')) + '\n';
out += '  colTedNome: ' + JSON.stringify(findHeader([], 'TED')) + '\n';
out += '  colND: ' + JSON.stringify(findHeader(['natureza', 'despes'], 'NC - Natureza Despesa')) + '\n';
out += '  colValor: ' + JSON.stringify(findHeader(['valor', 'linha'], 'NC - Valor Linha')) + '\n';
out += '  colData: ' + JSON.stringify(findHeader(['emiss', 'dia'], 'Emissão - Dia')) + '\n';

// Show first 5 data lines parsed
out += '\nFIRST 5 DATA LINES:\n';
for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
    const values = splitCSVLine(lines[i], separador).map(v => v.replace(/^"|"$/g, '').trim());
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = values[idx] || ''; });
    out += '  Line ' + i + ':\n';
    out += '    NC-Transf: "' + (obj['NC - Transferência'] || 'NOT FOUND') + '"\n';
    out += '    NC-ND: "' + (obj['NC - Natureza Despesa'] || 'NOT FOUND') + '"\n';
    out += '    NC-Valor: "' + (obj['NC - Valor Linha'] || obj[' NC - Valor Linha '] || 'NOT FOUND') + '"\n';
    out += '    Data: "' + (obj['Emissão - Dia'] || 'NOT FOUND') + '"\n';
    out += '    ALL KEYS: ' + Object.keys(obj).join(' | ') + '\n';
}

// Check findHeader with empty keywords for 'TED'
out += '\n\nCRITICAL: findHeader([], "TED") with empty keywords array:\n';
// With empty keywords, keywords.every() returns true for ALL headers (vacuous truth!)
const tedResult = findHeader([], 'TED');
out += '  Result: ' + JSON.stringify(tedResult) + '\n';
if (tedResult && tedResult.method === 'keyword') {
    out += '  *** BUG: Empty keywords array matches ALL headers via vacuous truth! ***\n';
    out += '  This means colTedNome = "' + tedResult.h + '" (FIRST HEADER!)\n';
}

// Check what values the first header has in data
if (tedResult) {
    out += '\nValues of "' + tedResult.h + '" column in first 10 lines:\n';
    for (let i = 1; i <= Math.min(10, lines.length - 1); i++) {
        const values = splitCSVLine(lines[i], separador).map(v => v.replace(/^"|"$/g, '').trim());
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = values[idx] || ''; });
        out += '  Line ' + i + ': "' + (obj[tedResult.h] || '') + '"\n';
    }
}

// Count unique NDs found by the parser
const ndCol = findHeader(['natureza', 'despes'], 'NC - Natureza Despesa');
const ndColName = ndCol ? ndCol.h : null;
const allNDs = new Set();
for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i], separador).map(v => v.replace(/^"|"$/g, '').trim());
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = values[idx] || ''; });
    const nd = ndColName ? obj[ndColName] : '';
    if (nd) allNDs.add(nd);
}
out += '\nALL UNIQUE NDs found (' + allNDs.size + '):\n';
Array.from(allNDs).sort().forEach(nd => {
    const isValid = /^[\d.\-]+$/.test(nd) && nd.replace(/[^0-9]/g, '').length >= 4;
    out += '  "' + nd + '" ' + (isValid ? 'VALID' : '*** INVALID ***') + '\n';
});

fs.writeFileSync(String.raw`e:\MEUS DOCUMENTOS\OneDrive\Documentos\Controle TED\Controle-TED\debug_output.txt`, out);
console.log('Done! Output in debug_output.txt');
