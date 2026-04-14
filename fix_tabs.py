import re
import sys
from datetime import datetime


def find_tag_pos(content, tag_regex, start=0):
    m = re.search(tag_regex, content[start:], re.IGNORECASE)
    if not m:
        return -1
    return start + m.start()


def find_matching_div_end(content, start_index):
    # Find matching </div> for the <div ...> that starts at start_index
    pattern = re.compile(r'<(/?)div\b', re.IGNORECASE)
    depth = 0
    for m in pattern.finditer(content, start_index):
        pos = start_index + m.start()
        is_closing = (m.group(1) == '/')
        if not is_closing:
            depth += 1
        else:
            depth -= 1
        if depth == 0:
            end_gt = content.find('>', pos)
            if end_gt == -1:
                return len(content)
            return end_gt + 1
    return None


def safe_backup(path):
    ts = datetime.now().strftime('%Y%m%d%H%M%S')
    bak = path + '.bak.' + ts
    with open(path, 'r', encoding='utf-8') as f:
        txt = f.read()
    with open(bak, 'w', encoding='utf-8') as f:
        f.write(txt)
    print(f'Backup criado: {bak}')
    return bak


def main():
    path = 'index.html'
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print('Erro abrindo index.html:', e)
        sys.exit(1)

    # localizar inicio de detalhes
    detalhes_pos = find_tag_pos(content, r'<div\s+id\s*=\s*["\']detalhes["\']')
    if detalhes_pos == -1:
        print('Não achei <div id="detalhes">; abortando.')
        sys.exit(1)

    # localizar inicio do bloco das abas (relatorios)
    rel_start = content.find('<!-- TAB 5: Relatórios -->')
    if rel_start == -1:
        rel_start = content.find('<!-- TAB 5')
    if rel_start == -1:
        print('Não achei o marcador de Relatórios. Abortando.')
        sys.exit(1)

    # localizar inicio de <div id="config" após rel_start
    config_pos = find_tag_pos(content, r'<div\s+id\s*=\s*["\']config["\']', rel_start)
    if config_pos == -1:
        config_pos = content.find('<div id="config"', rel_start)
    if config_pos == -1:
        print('Não achei <div id="config"> depois de Relatórios. Abortando.')
        sys.exit(1)

    # encontrar o fim da div#config (matching)
    config_end = find_matching_div_end(content, config_pos)
    if config_end is None:
        print('Não consegui encontrar o fim da div #config. Abortando.')
        sys.exit(1)

    # Extrair bloco das abas
    tabs_block = content[rel_start:config_end]

    # Remover o bloco da posição atual
    content_sem_bloco = content[:rel_start] + content[config_end:]

    # Criar backup seguro antes de alterar
    try:
        bak = safe_backup(path)
    except Exception as e:
        print('Não foi possível criar backup:', e)
        sys.exit(1)

    # Encontrar o fechamento real de div#detalhes no conteúdo sem o bloco
    new_detalhes_end = find_matching_div_end(content_sem_bloco, detalhes_pos)
    if new_detalhes_end is None:
        # tentar localizar um marcador de modal ou o primeiro </div> após detalhes_pos
        modal_pos = content_sem_bloco.find('<!-- Modal de Detalhes -->')
        if modal_pos != -1:
            last_close = content_sem_bloco.rfind('</div>', 0, modal_pos)
            if last_close != -1:
                new_detalhes_end = last_close + len('</div>')
        if new_detalhes_end is None:
            next_close = content_sem_bloco.find('</div>', detalhes_pos)
            if next_close != -1:
                new_detalhes_end = next_close + len('</div>')

    if new_detalhes_end is None:
        print('Não consegui localizar o fechamento de div#detalhes após remover o bloco. Abortando para evitar corromper o arquivo.')
        sys.exit(1)

    # Inserir o bloco logo após o fechamento de div#detalhes
    content_final = content_sem_bloco[:new_detalhes_end] + '\n\n' + tabs_block + '\n\n' + content_sem_bloco[new_detalhes_end:]

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content_final)

    print('Concluído. Blocos movidos para fora de #detalhes.')
    print('Backup salvo em:', bak)
    print('\nVerifique no console do navegador:')
    print("var rel = document.getElementById('relatorios'); console.log('pai:', rel && rel.parentElement && rel.parentElement.id, rel && rel.parentElement && rel.parentElement.className);")


if __name__ == '__main__':
    main()
