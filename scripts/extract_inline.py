"""
Script para:
- Extrair <script> inline (sem src) de index.html para arquivos em js/
- Se não houver scripts com type="module", concatenar em js/main.js e inserir um único <script src="js/main.js"></script> antes de </body>
- Caso existam scripts com type="module", criar arquivos separados js/extracted_<n>.js e re-inserir tags externas preservando atributos
- Detectar estilos inline repetidos (threshold configurable) e gerar classes em styles.css, substituindo attributos style por classes

Fazer backups antes de rodar — este script assume que backups já foram criados.
"""

import re
import os
from pathlib import Path
from collections import Counter, defaultdict

WORKDIR = Path('.').resolve()
INDEX = WORKDIR / 'index.html'
STYLES = WORKDIR / 'styles.css'
JS_DIR = WORKDIR / 'js'

THRESHOLD = 3  # mínimo de repetições para gerar uma classe

# Leitura
print('Lendo', INDEX)
html = INDEX.read_text(encoding='utf-8')

# 1) Extrair scripts inline (preservar ordem)
script_pattern = re.compile(r'(?is)<script\b([^>]*)>(.*?)</script>')
extracted = []

counter = { 'n': 0 }

def script_replacer(m):
    attrs = (m.group(1) or '').strip()
    content = m.group(2) or ''
    if re.search(r"\bsrc\s*=", attrs, flags=re.IGNORECASE):
        return m.group(0)  # manter script com src
    idx = counter['n']
    extracted.append({'attrs': attrs, 'content': content})
    counter['n'] += 1
    return f'<!-- EXTRACTED_SCRIPT_{idx} -->'

print('Extraindo scripts inline...')
new_html = script_pattern.sub(script_replacer, html)
print('Encontrados', len(extracted), 'scripts inline (sem src).')

# Garantir dir js
if not JS_DIR.exists():
    JS_DIR.mkdir(parents=True)

# Se não houver scripts inline, apenas manter HTML
if extracted:
    # Detectar se existe algum script com type=module
    any_module = any(re.search(r"\btype\s*=\s*['\"]module['\"]", s['attrs'], flags=re.IGNORECASE) for s in extracted)

    if any_module:
        print('Encontrado(s) script(s) module; criando arquivos separados para preservar atributos.')
        # Criar um arquivo por script e substituir cada marcador pelo tag correspondente
        for i, s in enumerate(extracted, start=1):
            fname = JS_DIR / f'extracted_{i:03d}.js'
            content = s['content'].lstrip('\n')
            fname.write_text(content, encoding='utf-8')

        # Substituir placeholders por tags com atributos e src
        def placeholder_to_tag(match):
            m = re.match(r'<!-- EXTRACTED_SCRIPT_(\d+) -->', match.group(0))
            if not m:
                return match.group(0)
            idx = int(m.group(1))
            info = extracted[idx]
            attrs = info['attrs']
            attrs = attrs or ''
            # remover eventuais src existentes (devem não existir)
            attrs_clean = re.sub(r"\bsrc\s*=\s*(['\"]).*?\1", '', attrs, flags=re.IGNORECASE)
            # garantir espaçamento correto
            if attrs_clean and not attrs_clean.startswith(' '):
                attrs_clean = ' ' + attrs_clean
            tag = f'<script{attrs_clean} src="js/extracted_{idx+1:03d}.js"></script>'
            return tag

        new_html = re.sub(r'<!-- EXTRACTED_SCRIPT_\d+ -->', lambda m: placeholder_to_tag(m), new_html)
        print('Substituídos placeholders por tags externas individuais.')
    else:
        # concatenar tudo em main.js
        print('Nenhum script module detectado; concatenando em js/main.js')
        parts = []
        for i, s in enumerate(extracted, start=1):
            parts.append(f"\n\n/* --- extracted script {i} --- */\n\n" + s['content'].lstrip('\n'))
        mainjs = JS_DIR / 'main.js'
        mainjs.write_text(''.join(parts), encoding='utf-8')
        print('Criado', mainjs)
        # remover todos os placeholders
        new_html = re.sub(r'<!-- EXTRACTED_SCRIPT_\d+ -->', '', new_html)
        # inserir tag script antes do fechamento de </body>
        where = re.search(r'(?i)</body>', new_html)
        if where:
            idx = where.start()
            new_html = new_html[:idx] + '\n<script src="js/main.js"></script>\n' + new_html[idx:]
            print('Inserida tag <script src="js/main.js"></script> antes de </body>')
        else:
            # fallback: append to end
            new_html = new_html + '\n<script src="js/main.js"></script>\n'
            print('Tag <script src="js/main.js"></script> anexada ao final (</body> não encontrado)')

# 2) Detectar estilos inline e contar repetições
style_pattern = re.compile(r'style\s*=\s*(?P<quote>\"|\')(.*?)(?P=quote)', flags=re.IGNORECASE|re.DOTALL)

print('Detectando estilos inline...')
all_styles = []
for m in style_pattern.finditer(new_html):
    raw = m.group(2) if m.groups() else m.group(0)
    if raw is None:
        raw = m.group(0)
    all_styles.append(raw.strip())

print('Estilos inline únicos encontrados (não normalizados):', len(set(all_styles)))

# Normalizar função (split por ; e por : somente em primeira ocorrência)

def normalize_style(s):
    parts = [p.strip() for p in s.split(';') if p.strip()]
    props = []
    for p in parts:
        if ':' in p:
            k, v = p.split(':', 1)
            k = k.strip().lower()
            v = v.strip()
            props.append((k, v))
        else:
            # inválido, manter como-chave única
            props.append((p.strip().lower(), ''))
    # ordenar por nome da propriedade para canonicalizar
    props_sorted = sorted(props, key=lambda x: x[0])
    return '; '.join([f"{k}: {v}".rstrip() for k, v in props_sorted])

norm_counts = Counter()
orig_examples = {}

for s in all_styles:
    norm = normalize_style(s)
    norm_counts[norm] += 1
    orig_examples.setdefault(norm, s)

# selecionar estilos que atingem threshold
selected = [norm for norm, cnt in norm_counts.items() if cnt >= THRESHOLD]
print('Estilos normalizados que excedem threshold (%d): %d' % (THRESHOLD, len(selected)))

style_to_class = {}
css_rules = []
for i, norm in enumerate(selected, start=1):
    cls = f'auto-style-{i:03d}'
    style_to_class[norm] = cls
    # reconstruir regra CSS a partir do norm (norm já no formato 'prop: val; prop2: val2')
    rule_body = norm
    # garantir ponto e vírgula final
    if rule_body and not rule_body.strip().endswith(';'):
        rule_body = rule_body + ';'
    css_rules.append(f'.{cls} {{ {rule_body} }}')

# 3) Substituir ocorrências no HTML por classes (iterando por matches, construindo novo HTML)
if style_to_class:
    print('Substituindo estilos inline por classes...')
    matches = list(style_pattern.finditer(new_html))
    out_parts = []
    last_pos = 0
    for m in matches:
        start, end = m.span()
        raw_style = m.group(2)
        if raw_style is None:
            raw_style = m.group(0)
        norm = normalize_style(raw_style.strip())
        if norm not in style_to_class:
            continue
        cls = style_to_class[norm]
        # localizar limites da tag que contém este atributo
        tag_start = new_html.rfind('<', 0, start)
        tag_end = new_html.find('>', end)
        if tag_start == -1 or tag_end == -1:
            continue
        # adicionar trecho até inicio da tag
        out_parts.append(new_html[last_pos:tag_start])
        tag = new_html[tag_start:tag_end+1]
        # remover attribute style
        tag_no_style = re.sub(r'\sstyle\s*=\s*(\"|\')(.*?)(\"|\')', '', tag, flags=re.IGNORECASE|re.DOTALL)
        # procurar attribute class
        mcls = re.search(r'class\s*=\s*(\"|\')(.*?)(\"|\')', tag_no_style, flags=re.IGNORECASE|re.DOTALL)
        if mcls:
            quote = mcls.group(1)
            existing = mcls.group(2).strip()
            new_classes = (existing + ' ' + cls).strip()
            # reconstruir tag substituindo a classe
            tag_replaced = tag_no_style[:mcls.start()] + f'class="{new_classes}"' + tag_no_style[mcls.end():]
        else:
            # inserir antes do fechamento da tag
            if tag_no_style.endswith('/>'):
                tag_replaced = tag_no_style[:-2].rstrip() + f' class="{cls}" />'
            else:
                tag_replaced = tag_no_style[:-1].rstrip() + f' class="{cls}">'
        out_parts.append(tag_replaced)
        last_pos = tag_end+1
    out_parts.append(new_html[last_pos:])
    final_html = ''.join(out_parts)
else:
    final_html = new_html

# 4) Gravar resultados (sobrescrevendo index.html e atualizando styles.css)
OUT_INDEX = INDEX
print('Escrevendo novo index em', OUT_INDEX)
OUT_INDEX.write_text(final_html, encoding='utf-8')

if css_rules:
    print('Anexando', len(css_rules), 'regras a', STYLES)
    orig_css = STYLES.read_text(encoding='utf-8') if STYLES.exists() else ''
    footer = '\n\n/* ===== Auto-generated classes (extract_inline.py) ===== */\n'
    footer += '\n'.join(css_rules) + '\n'
    STYLES.write_text(orig_css + footer, encoding='utf-8')

print('Operação concluída.')
print('Scripts extraídos:', len(extracted))
print('Classes geradas:', len(css_rules))
