(() => {
    const header = document.querySelector('.jhb-header');
    if (!header) return;
    const toggle = header.querySelector('.jhb-menu');
    const navigation = header.querySelector('.jhb-nav');
    header.classList.add('is-enhanced');

    function closeMenu(returnFocus = false) {
        if (toggle.getAttribute('aria-expanded') !== 'true') return;
        toggle.setAttribute('aria-expanded', 'false');
        if (returnFocus) toggle.focus();
    }

    toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
    });
    navigation.addEventListener('click', event => {
        if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeMenu(true);
    });
    document.addEventListener('click', event => {
        if (!header.contains(event.target)) closeMenu();
    });
})();
