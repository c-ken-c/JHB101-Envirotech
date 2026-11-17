(() => {
  'use strict';
  const root = document.querySelector('.b-wrap');
  const core = window.JHBSearch;
  if (!root || !core) return;
  const { data } = core;
  const query = document.querySelector('#b-keyword');
  const brandGrid = document.querySelector('#b-brand-grid');
  const typeChips = document.querySelector('#b-type-chips');
  const resultArea = document.querySelector('#b-results');
  const count = document.querySelector('#b-result-count');
  const cards = [...resultArea.querySelectorAll('[data-product-id]')];
  const empty = document.querySelector('#b-empty');
  const notice = document.querySelector('#b-notice');
  const brands = new Map(data.brands.map(brand => [brand.id, brand]));
  const types = new Map(data.types.map(type => [type.id, type]));
  const legacyCategories = new Map([
    ['thetis-uf', { brand: 'perma-filter', type: 'uf' }],
    ['thetis-mbr', { brand: 'perma-filter', type: 'mbr' }],
    ['thetis-separator', { brand: 'perma-filter', type: 'filter' }],
    ['memstar-uf', { brand: 'memstar', type: 'uf' }],
    ['memstar-mbr', { brand: 'memstar', type: 'mbr' }],
    ['nature-works', { brand: 'nature-works', type: 'media' }],
    ['fluence-mabr', { brand: 'fluence', type: 'mabr' }],
  ]);

  function readEntry() {
    const input = core.readQuery();
    const legacy = legacyCategories.get(location.hash.slice(1));
    const hasSearch = new URLSearchParams(location.search);
    if (legacy && !['brand', 'type', 'category', 'q'].some(key => hasSearch.has(key))) {
      return { ...legacy, q: '' };
    }
    return input;
  }

  function scrollToLegacy() {
    const target = legacyCategories.has(location.hash.slice(1))
      ? document.getElementById(location.hash.slice(1)) : null;
    if (target && !target.hidden) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  }

  let initial = core.normalizeState(readEntry(), 'brand');
  let state = initial.state;

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }


  function announce(message) { notice.textContent = message || ''; }

  function brandName() {
    return state.brand === 'all' ? '全部品牌' : brands.get(state.brand)?.name || '全部品牌';
  }

  function buildBrands() {
    brandGrid.replaceChildren();
    const all = make('button', 'b-brand-tile');
    all.type = 'button';
    all.dataset.brand = 'all';
    all.append(make('span', 'b-brand-all', '全品牌'), make('span', 'b-brand-qty', data.products.length + ' 個系列'));
    brandGrid.append(all);
    for (const brand of data.brands) {
      const button = make('button', 'b-brand-tile');
      button.type = 'button';
      button.dataset.brand = brand.id;
      button.setAttribute('aria-label', brand.name + '，' + data.products.filter(product => product.brandId === brand.id).length + ' 個系列');
      const image = make('img');
      image.src = brand.logo;
      image.alt = brand.name;
      image.width = 132;
      image.height = 42;
      button.append(image, make('span', 'b-brand-qty', data.products.filter(product => product.brandId === brand.id).length + ' 個系列'));
      brandGrid.append(button);
    }
  }

  function paintIdentity() {
    for (const button of brandGrid.querySelectorAll('[data-brand]')) {
      button.setAttribute('aria-pressed', String(button.dataset.brand === state.brand));
    }
    const brand = brands.get(state.brand);
    document.querySelector('#b-brand-title').textContent = brand ? brand.name : '瀏覽所有代理品牌';
    document.querySelector('#b-brand-description').textContent = brand
      ? brand.description
      : '從熟悉的品牌開始，查看其設備系列與適用類型；也可以直接以型號查找。';
    document.querySelector('#b-selected-kicker').textContent = brand ? 'BRAND SHOWROOM' : 'OUR REPRESENTED BRANDS';
    const brandLink = document.querySelector('#b-brand-link');
    brandLink.href = brand ? brand.href : 'brands.html';
    brandLink.textContent = brand ? '認識 ' + brand.name + ' →' : '查看品牌介紹 →';
    const productCount = state.brand === 'all' ? data.products.length : data.products.filter(product => product.brandId === state.brand).length;
    const typeCount = core.availableTypes(state.brand).filter(type => type.count > 0).length;
    document.querySelector('#b-brand-stats').textContent = productCount + ' 個系列 · ' + typeCount + ' 種設備類型';
  }

  function paintTypes() {
    typeChips.replaceChildren();
    const available = core.availableTypes(state.brand).filter(type => type.count > 0);
    const total = state.brand === 'all' ? data.products.length : data.products.filter(product => product.brandId === state.brand).length;
    const list = [{ id: 'all', label: '全部類型', count: total }, ...available];
    for (const type of list) {
      const button = make('button', 'b-type-chip');
      button.type = 'button';
      button.dataset.type = type.id;
      button.append(document.createTextNode(type.label), make('span', '', String(type.count)));
      button.setAttribute('aria-pressed', String(type.id === state.type));
      typeChips.append(button);
    }
  }

  function markType() {
    for (const button of typeChips.querySelectorAll('[data-type]')) {
      button.setAttribute('aria-pressed', String(button.dataset.type === state.type));
    }
  }

  function paintResults() {
    const products = core.filterProducts(state);
    const visibleIds = new Set(products.map(product => product.id));
    for (const card of cards) card.hidden = !visibleIds.has(card.dataset.productId);
    const selectedType = state.type === 'all' ? '全部類型' : types.get(state.type)?.label || '全部類型';
    count.textContent = brandName() + ' · ' + selectedType + ' · ' + products.length + ' 個系列';
    empty.hidden = products.length !== 0;
    document.querySelector('#b-clear-keyword').hidden = !state.q.trim();
  }

  function update(next, { identity = false, message = '', save = true } = {}) {
    const normalized = core.normalizeState(next, 'brand');
    state = normalized.state;
    if (identity) { paintIdentity(); paintTypes(); }
    else markType();
    paintResults();
    announce([message, normalized.notice].filter(Boolean).join(' '));
    if (save) core.writeQuery(state);
  }

  brandGrid.addEventListener('click', event => {
    const button = event.target.closest('button[data-brand]');
    if (!button || !brandGrid.contains(button) || button.dataset.brand === state.brand) return;
    const brand = button.dataset.brand;
    update({ ...state, brand }, { identity: true, message: '已切換至' + (brand === 'all' ? '全部品牌。' : (brands.get(brand)?.name || '') + '。') });
  });

  typeChips.addEventListener('click', event => {
    const button = event.target.closest('button[data-type]');
    if (!button || !typeChips.contains(button)) return;
    update({ ...state, type: button.dataset.type });
  });

  document.querySelector('#b-search-form').addEventListener('submit', event => {
    event.preventDefault();
    update({ ...state, q: query.value });
  });
  query.addEventListener('input', () => update({ ...state, q: query.value }));
  document.querySelector('#b-reset-all').addEventListener('click', () => {
    query.value = '';
    update({ brand: 'all', type: 'all', q: '' }, { identity: true, message: '已顯示全部品牌與設備系列。' });
  });
  document.querySelector('#b-empty-reset').addEventListener('click', () => {
    query.value = '';
    update({ brand: 'all', type: 'all', q: '' }, { identity: true, message: '已清除條件，顯示全部系列。' });
    query.focus({ preventScroll: true });
  });
  document.querySelector('#b-clear-keyword').addEventListener('click', () => {
    query.value = '';
    update({ ...state, q: '' }, { message: '已清除關鍵字，保留品牌與類型。' });
    query.focus({ preventScroll: true });
  });
  window.addEventListener('popstate', () => {
    const next = core.normalizeState(readEntry(), 'brand');
    query.value = next.state.q;
    update(next.state, { identity: true, message: next.notice, save: false });
    scrollToLegacy();
  });

  window.addEventListener('hashchange', () => {
    if (!legacyCategories.has(location.hash.slice(1))) return;
    const next = core.normalizeState(readEntry(), 'brand');
    query.value = next.state.q;
    update(next.state, { identity: true, message: next.notice, save: false });
    scrollToLegacy();
  });

  buildBrands();
  query.value = state.q;
  paintIdentity();
  paintTypes();
  paintResults();
  announce(initial.notice);
  scrollToLegacy();
})();

