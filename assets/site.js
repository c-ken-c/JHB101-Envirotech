(() => {
  'use strict';
  const groups=[...document.querySelectorAll('[data-switch-group]')];
  function sync(){
    let hash;try{hash=decodeURIComponent(location.hash.slice(1));}catch{hash='';}
    let target=document.getElementById(hash)||document.getElementById(hash.split('--')[0]);
    if(target?.dataset.panelAlias){
      hash=target.dataset.panelAlias;
      target=document.getElementById(hash);
      try {
        history.replaceState(null, '', '#' + hash);
      } catch {
        // Keep the resolved panel active if the browser restricts local URL changes.
      }
    }
    groups.forEach(group=>{
      const panels=[...group.children].filter(p=>p.hasAttribute('data-panel'));
      const chosen=panels.find(p=>p===target||p.contains(target))||panels[0];
      panels.forEach(p=>p.dataset.active=String(p===chosen));
      for(const panel of panels){
        const mini=[...panel.querySelectorAll('[data-mini-page]')].filter(el=>el.closest('[data-panel]')===panel);
        const page=chosen===panel&&hash.includes('--')?Number(hash.split('--').at(-1)):1;
        const selected=mini.some(el=>Number(el.dataset.miniPage)===page)?page:1;
        mini.forEach(el=>el.dataset.active=String(Number(el.dataset.miniPage)===selected));
        panel.querySelectorAll('[data-mini-link]').forEach(a=>{if(Number(a.dataset.miniLink)===selected)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
      }
    });
    document.querySelectorAll('[data-panel-link]').forEach(a=>{
      let panel=document.getElementById(a.dataset.panelLink);
      if(a.dataset.panelLink==='models-1'&&a.closest('.product-tabs'))panel=document.querySelector('[id^="models-"][data-active="true"]');
      let active=panel?.dataset.active==='true';
      for(let parent=panel?.parentElement;parent;parent=parent.parentElement){if(parent.hasAttribute('data-panel')&&parent.dataset.active!=='true')active=false;}
      if(active)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');
    });
  }
  function scrollToModelAnchor(){
    const fragment=location.hash;
    let id;try{id=decodeURIComponent(fragment.slice(1));}catch{return;}
    const target=document.getElementById(id);
    if(!target?.matches('.product-panel#models-1, [data-legacy-model-anchor]'))return;
    requestAnimationFrame(()=>{
      if(location.hash===fragment)target.scrollIntoView({block:'start'});
    });
  }
  function syncLocation(){sync();scrollToModelAnchor();}
  sync();
  document.addEventListener('click',e=>{
    const link=e.target.closest('a[data-panel-link],a[data-mini-link]');
    if(!link||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const url=new URL(link.href);if(url.pathname!==location.pathname)return;
    e.preventDefault();
    try{history.pushState(null,'',url.hash);}catch{location.hash=url.hash;}
    sync();
    let hash;try{hash=decodeURIComponent(url.hash.slice(1));}catch{return;}
    const target=document.getElementById(hash)||document.getElementById(hash.split('--')[0]);
    const panel=target?.matches('[data-panel]')?target:target?.closest('[data-panel]');
    panel?.querySelector('h2,h3')?.focus({preventScroll:true});
  });
  addEventListener('popstate',syncLocation);addEventListener('hashchange',syncLocation);
  const search=document.querySelector('[data-search-results]');
  if(search){
    const q=new URLSearchParams(location.search),query=(q.get('q')||'').trim(),brand=q.get('brand')||'all',category=q.get('category')||'all';
    const form=document.querySelector('.filter-bar');form.elements.q.value=query;
    if([...form.elements.brand.options].some(o=>o.value===brand))form.elements.brand.value=brand;
    if([...form.elements.category.options].some(o=>o.value===category))form.elements.category.value=category;
    const cards=[...search.querySelectorAll('[data-product-id]')],matches=cards.filter(c=>(brand==='all'||c.dataset.brand===brand)&&(category==='all'||c.dataset.category===category)&&c.dataset.search.includes(query.toLowerCase()));
    const total=Math.max(1,Math.ceil(matches.length/3)),raw=Number(q.get('page')),n=Number.isInteger(raw)?Math.min(total,Math.max(1,raw)):1;
    cards.forEach(c=>c.hidden=!matches.slice((n-1)*3,n*3).includes(c));
    document.querySelector('#search-count').textContent=matches.length+' 個相關系列';document.querySelector('#search-empty').hidden=matches.length>0;
    const pager=document.querySelector('#search-pager');
    for(let i=1;i<=total&&total>1;i++){const a=document.createElement('a'),params=new URLSearchParams(q);params.set('page',i);a.href='search.html?'+params;a.textContent=i;if(i===n)a.setAttribute('aria-current','page');pager.append(a);}
  }
  document.documentElement.classList.add('js');
  scrollToModelAnchor();
})();
