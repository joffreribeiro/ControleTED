// Paginação simples e reutilizável para tabelas grandes
// Esse módulo expõe `window.Pagination.renderPaginatedTable` para uso pelas renderers existentes.

export function renderPaginatedTable({ tbody, rows, footerHtml = '', pagerId = 'pager', pageSize = 50, pageSizeOptions = [25,50,100,250,500,'all'], initialPage = 1 }) {
    if (!tbody) return;
    window._paginations = window._paginations || {};

    const tableEl = tbody.closest('table') || tbody.parentElement;
    let pagerEl = document.getElementById(pagerId);
    if (!pagerEl) {
        pagerEl = document.createElement('div');
        pagerEl.id = pagerId;
        pagerEl.style.cssText = 'margin-top:0.5rem; display:flex; align-items:center; justify-content:flex-end; gap:8px;';
        const wrapper = tableEl.closest('.table-wrapper') || tableEl.parentElement;
        try { wrapper.insertAdjacentElement('afterend', pagerEl); } catch(e) { tableEl.parentElement.appendChild(pagerEl); }
    }

    const state = window._paginations[pagerId] = {
        tbody,
        rows: Array.isArray(rows) ? rows : (rows ? rows.split('\n') : []),
        footerHtml: footerHtml || '',
        pagerEl,
        pageSize: pageSize || 50,
        page: Number(initialPage) || 1,
        pageSizeOptions: pageSizeOptions || [25,50,100,250,500,'all']
    };

    function getTotalPages() {
        if (state.pageSize === 'all') return 1;
        return Math.max(1, Math.ceil(state.rows.length / state.pageSize));
    }

    function renderPage(page) {
        if (!state.rows) { state.tbody.innerHTML = state.footerHtml; return; }
        const totalPages = getTotalPages();
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        state.page = page;
        // persistência simples em memória para sessões curtas
        try { window._financeiroPage = state.page; window._financeiroPageSize = state.pageSize; } catch(e) {}

        let html = '';
        if (state.pageSize === 'all') {
            html = state.rows.join('') + state.footerHtml;
        } else {
            const start = (state.page - 1) * state.pageSize;
            const end = Math.min(start + state.pageSize, state.rows.length);
            html = state.rows.slice(start, end).join('') + state.footerHtml;
        }

        state.tbody.innerHTML = html;
        renderPager();
    }

    function renderPager() {
        const totalPages = getTotalPages();
        state.pagerEl.innerHTML = '';

        // Page size select
        const sizeSel = document.createElement('select');
        sizeSel.style.cssText = 'padding:6px; border-radius:6px;';
        state.pageSizeOptions.forEach(opt => {
            const o = document.createElement('option');
            o.value = String(opt);
            o.textContent = opt === 'all' ? 'Todos' : `${opt} / página`;
            if ((opt === 'all' && state.pageSize === 'all') || (opt !== 'all' && Number(opt) === Number(state.pageSize))) o.selected = true;
            sizeSel.appendChild(o);
        });
        sizeSel.onchange = function() {
            const v = this.value === 'all' ? 'all' : Number(this.value);
            state.pageSize = v;
            renderPage(1);
        };

        // Prev/Next
        const btnPrev = document.createElement('button');
        btnPrev.className = 'btn btn-sm';
        btnPrev.textContent = '‹ Prev';
        btnPrev.disabled = state.page <= 1;
        btnPrev.onclick = () => renderPage(state.page - 1);

        const btnNext = document.createElement('button');
        btnNext.className = 'btn btn-sm';
        btnNext.textContent = 'Next ›';
        btnNext.disabled = state.page >= totalPages;
        btnNext.onclick = () => renderPage(state.page + 1);

        // Jump input
        const jumpInput = document.createElement('input');
        jumpInput.type = 'number';
        jumpInput.min = 1;
        jumpInput.value = state.page;
        jumpInput.style.cssText = 'width:72px; padding:6px; border-radius:6px;';
        jumpInput.onchange = function() { const p = Math.max(1, Math.min(getTotalPages(), Number(this.value)||1)); renderPage(p); };

        // Info
        const info = document.createElement('div');
        info.style.cssText = 'font-size:0.9rem; color:var(--text-muted); padding-left:6px;';
        info.textContent = `Página ${state.page} de ${totalPages} • ${state.rows.length} linhas`;

        state.pagerEl.appendChild(sizeSel);
        state.pagerEl.appendChild(btnPrev);
        state.pagerEl.appendChild(btnNext);
        state.pagerEl.appendChild(jumpInput);
        state.pagerEl.appendChild(info);
    }

    // Render initial page
    renderPage(state.page || 1);

    // Expor um método de controle externo
    state.goToPage = renderPage;
    window._paginations[pagerId] = state;
    return state;
}

// Torna a função disponível via window para compatibilidade com código não modular
window.Pagination = window.Pagination || {};
window.Pagination.renderPaginatedTable = renderPaginatedTable;

export default { renderPaginatedTable };