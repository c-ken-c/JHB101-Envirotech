(() => {
    'use strict';

    const form = document.querySelector('#catalog-search-form');
    const cards = [...document.querySelectorAll('[data-series-card]')];
    const count = document.querySelector('#catalog-results-count');
    const empty = document.querySelector('#catalog-empty');
    const search = document.querySelector('#product-search');
    const brand = form.elements.namedItem('brand');
    const type = form.elements.namedItem('type');
    const keyword = form.elements.namedItem('q');

    const fold = (text) => text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    const brandAliases = new Map([
        ['permafilter', 'perma-filter'], ['permafilters', 'perma-filter'],
        ['thetis', 'perma-filter'], ['thetisenvironmental', 'perma-filter'], ['希斯', 'perma-filter'],
        ['memstar', 'memstar'], ['fluence', 'fluence'], ['natureworks', 'nature-works'],
        ['fedco', 'fedco'],
    ]);
    const optionValue = (control, value) => [...control.options].some(option => option.value === value) ? value : '';
    const searchable = cards.map(card => ({ card, text: fold(card.dataset.search) }));

    const render = () => {
        const tokens = keyword.value.trim().split(/\s+/u).map(fold).filter(Boolean);
        let visible = 0;
        for (const { card, text } of searchable) {
            const matches = (!brand.value || card.dataset.brand === brand.value)
                && (!type.value || card.dataset.type === type.value)
                && tokens.every(token => text.includes(token));
            card.hidden = !matches;
            if (matches) visible += 1;
        }
        count.textContent = '顯示 ' + visible + '／' + cards.length + ' 個產品系列';
        empty.hidden = visible !== 0;
    };

    const readFilters = () => {
        const params = new URLSearchParams(location.search);
        const namedBrand = params.get('brand') || '';
        brand.value = optionValue(brand, brandAliases.get(fold(namedBrand)) || namedBrand);
        type.value = optionValue(type, params.get('type') || params.get('category') || '');
        keyword.value = (params.get('q') || '').slice(0, 120);
        render();
    };

    const saveFilters = () => {
        const url = new URL(location.href);
        for (const [key, value] of [['brand', brand.value], ['type', type.value], ['q', keyword.value.trim()]]) {
            if (value) url.searchParams.set(key, value);
            else url.searchParams.delete(key);
        }
        url.searchParams.delete('category');
        url.hash = 'product-search';
        try {
            history.replaceState(null, '', url);
        } catch {
            // Some file:// browser modes restrict changing the query; filtering still works locally.
        }
    };

    const applyFilters = () => {
        render();
        saveFilters();
    };

    form.addEventListener('submit', event => { event.preventDefault(); applyFilters(); });
    brand.addEventListener('change', applyFilters);
    type.addEventListener('change', applyFilters);
    keyword.addEventListener('input', applyFilters);
    const resetFilters = () => { form.reset(); applyFilters(); };
    document.querySelector('#catalog-reset').addEventListener('click', resetFilters);
    document.querySelector('#catalog-empty-reset').addEventListener('click', () => {
        resetFilters();
        keyword.focus();
    });

    const sections = [...document.querySelectorAll('#legacy-catalog .category-content')];
    const sectionIds = new Set(sections.map(section => section.id));
    const tabs = [...document.querySelectorAll('#legacy-catalog button[data-category]')];
    const defaultId = 'memstar-uf';

    const showCategory = id => {
        if (!sectionIds.has(id)) return false;
        for (const section of sections) section.classList.toggle('active', section.id === id);
        for (const button of tabs) {
            const active = button.dataset.category === id;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        }
        return true;
    };

    const categoryFromHash = () => {
        try { return decodeURIComponent(location.hash.slice(1)); }
        catch { return ''; }
    };

    const syncCategory = ({ initial = false, scroll = false } = {}) => {
        const id = categoryFromHash();
        if (showCategory(id)) {
            if (scroll) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
        } else if (initial || id === '' || id === 'legacy-catalog') {
            showCategory(defaultId);
        }
    };

    for (const button of tabs) {
        button.addEventListener('click', () => {
            const id = button.dataset.category;
            if (!showCategory(id)) return;
            // Changing the sidebar selection preserves the current viewport.
            try { history.pushState(null, '', '#' + encodeURIComponent(id)); }
            catch { location.hash = id; }
        });
    }

    window.addEventListener('hashchange', () => syncCategory({ scroll: true }));
    window.addEventListener('popstate', () => {
        readFilters();
        syncCategory();
    });
    readFilters();
    syncCategory({ initial: true, scroll: Boolean(location.hash) });

    document.querySelectorAll('[data-fedco-filter]').forEach(link => {
        link.addEventListener('click', event => {
            if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
            event.preventDefault();
            brand.value = 'fedco';
            type.value = optionValue(type, link.dataset.fedcoFilter);
            keyword.value = '';
            applyFilters();
            search.scrollIntoView({ block: 'start' });
            brand.focus({ preventScroll: true });
        });
    });

    const dialog = document.querySelector('#catalog-pdf-dialog');
    const pdfFrame = document.querySelector('#catalog-pdf-frame');
    const pdfOpen = document.querySelector('#catalog-pdf-open');
    const pdfTitle = document.querySelector('#catalog-pdf-title');
    let focusedPdf = null;
    document.querySelector('#catalog-pdf-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
        pdfFrame.removeAttribute('src');
        focusedPdf?.focus();
        focusedPdf = null;
    });
    document.querySelector('#legacy-catalog').addEventListener('click', event => {
        const link = event.target.closest('a.show-pdf-button');
        // Direct local previews use the browser's PDF tab instead of a file iframe.
        if (!link || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey
            || location.protocol === 'file:' || window.innerWidth <= 768
            || !window.matchMedia('(hover: hover) and (pointer: fine)').matches
            || typeof dialog.showModal !== 'function') return;
        const name = link.closest('.product-card')?.querySelector('.product-model')?.textContent.trim();
        pdfTitle.textContent = name ? name + ' 型錄' : '原有設備型錄';
        pdfFrame.title = pdfTitle.textContent;
        pdfOpen.href = link.href;
        pdfFrame.src = link.href;
        try {
            dialog.showModal();
            focusedPdf = link;
            event.preventDefault();
        } catch {
            pdfFrame.removeAttribute('src');
            // The original link remains usable even if the preview dialog cannot open.
        }
    });
})();

