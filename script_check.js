const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'index.html');
let html;
try {
  html = fs.readFileSync(file, 'utf8');
} catch (e) {
  console.error('Erro ao ler index.html:', e.message);
  process.exit(2);
}
const re = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
let m; let i = 0; let errors = 0;
while ((m = re.exec(html)) !== null) {
  i++;
  const src = m[1];
  if (!src.trim()) {
    console.log(`Script ${i}: (vazio) - SKIPPED`);
    continue;
  }
  try {
    new Function(src);
    console.log(`Script ${i}: OK`);
  } catch (err) {
    console.error(`Script ${i}: ERROR -> ${err.message}`);
    errors++;
  }
}
if (i === 0) console.log('Nenhum <script> encontrado em index.html');
if (errors > 0) process.exit(2);
