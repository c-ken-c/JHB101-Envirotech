(() => {
    'use strict';
    const data = window.JHB_SEARCH_DATA;
    const brandIds = new Set(data.brands.map(item => item.id));
    const typeIds = new Set(data.types.map(item => item.id));
    const fold = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
    const aliases = new Map(data.brands.flatMap(brand => [
        [fold(brand.id), brand.id], [fold(brand.name), brand.id]
    ]));
    for (const label of ['Thetis', 'Thetis Environmental', 'Perma Filters', '希斯']) aliases.set(fold(label), 'perma-filter');
    const availableTypes = (brand = 'all') => data.types.map(type => ({
        ...type,
        count: data.products.filter(product => product.typeId === type.id && (brand === 'all' || product.brandId === brand)).length
    }));
    const availableBrands = (type = 'all') => data.brands.map(brand => ({
        ...brand,
        count: data.products.filter(product => product.brandId === brand.id && (type === 'all' || product.typeId === type)).length
    }));
    function normalizeState(input, preference = 'brand') {
        const rawBrand = String(input.brand || 'all');
        const rawType = String(input.type || 'all');
        const state = {
            brand: aliases.get(fold(rawBrand)) || (brandIds.has(rawBrand) ? rawBrand : 'all'),
            type: typeIds.has(rawType) ? rawType : 'all',
            q: String(input.q || '').slice(0, 120)
        };
        let notice = '';
        if (state.brand !== 'all' && state.type !== 'all'
            && !data.products.some(product => product.brandId === state.brand && product.typeId === state.type)) {
            if (preference === 'type') {
                state.brand = 'all';
                notice = '已改為全部品牌，以下顯示提供此類設備的品牌。';
            } else {
                state.type = 'all';
                const brand = data.brands.find(item => item.id === state.brand);
                notice = (brand?.name || '此品牌') + ' 的設備類型已更新，現在顯示全部可選類型。';
            }
        } else if ((rawBrand !== 'all' && state.brand === 'all') || (rawType !== 'all' && state.type === 'all')) {
            notice = '已更新為目前可選的品牌與設備類型。';
        }
        return { state, notice };
    }
    function filterProducts(input) {
        const tokens = String(input.q || '').trim().split(/\s+/u).map(fold).filter(Boolean);
        return data.products.filter(product => {
            if (input.brand !== 'all' && product.brandId !== input.brand) return false;
            if (input.type !== 'all' && product.typeId !== input.type) return false;
            const brand = data.brands.find(item => item.id === product.brandId);
            const type = data.types.find(item => item.id === product.typeId);
            const aliasesText = product.brandId === 'perma-filter' ? 'Thetis Perma Filters 希斯' : '';
            const searchable = fold([brand.name, type.label, product.name, product.description, aliasesText,
                ...product.models.map(model => model.name)].join(' '));
            return tokens.every(token => searchable.includes(token));
        });
    }
    function readQuery() {
        const query = new URLSearchParams(location.search);
        return {
            brand: query.get('brand') || 'all',
            type: query.get('type') || query.get('category') || 'all',
            q: (query.get('q') || '').slice(0, 120)
        };
    }
    function writeQuery(state) {
        const url = new URL(location.href);
        for (const key of ['brand', 'type', 'q']) {
            const value = state[key] || '';
            if (!value || value === 'all') url.searchParams.delete(key);
            else url.searchParams.set(key, value);
        }
        url.searchParams.delete('category');
        url.searchParams.delete('page');
        url.hash = 'product-search';
        try { history.replaceState(null, '', url); } catch {
            // The local search still operates when a browser restricts file URL changes.
        }
    }
    window.JHBSearch = { data, escape, fold, readQuery, writeQuery, normalizeState, filterProducts, availableTypes, availableBrands };
})();
