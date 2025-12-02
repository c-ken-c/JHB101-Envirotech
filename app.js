document.addEventListener('DOMContentLoaded', () => {
    const languageSwitcher = document.getElementById('language-switcher');
    let currentLang = localStorage.getItem('lang') || getBrowserLang() || 'zh-TW';

    const setLanguage = async (lang) => {
        const response = await fetch(`${lang}.json`);
        const translations = await response.json();
        
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[key]) {
                element.innerHTML = translations[key];
            }
        });

        document.documentElement.lang = lang.startsWith('en') ? 'en' : 'zh-Hant';
        localStorage.setItem('lang', lang);
        updateSwitcherUI(lang);
    };

    const getBrowserLang = () => {
        const lang = navigator.language || navigator.userLanguage;
        if (lang.startsWith('en')) {
            return 'en';
        }
        if (lang.startsWith('zh')) {
            return 'zh-TW';
        }
        return null;
    };

    const updateSwitcherUI = (lang) => {
        document.querySelectorAll('#language-switcher button').forEach(button => {
            if (button.getAttribute('data-lang') === lang) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    };

    languageSwitcher.addEventListener('click', (event) => {
        const lang = event.target.getAttribute('data-lang');
        if (lang && lang !== currentLang) {
            currentLang = lang;
            setLanguage(lang);
        }
    });

    // Initial load
    setLanguage(currentLang);


    // --- Category switching logic from original file ---
    const categoryButtons = document.querySelectorAll('.category-btn');
    const categoryContents = document.querySelectorAll('.category-content');

    const animateCards = (container) => {
        const productCards = container.querySelectorAll('.product-card');
        productCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.animation = 'none';
            setTimeout(() => {
                card.style.animation = `fadeIn 0.5s ease-in-out forwards`;
                card.style.animationDelay = `${index * 0.07}s`;
            }, 10);
        });
    };

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const categoryId = button.getAttribute('data-category');
            
            categoryContents.forEach(content => {
                if (content.id === categoryId) {
                    content.classList.add('active');
                    animateCards(content);
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });

    const initialActiveContent = document.querySelector('.category-content.active');
    if (initialActiveContent) {
        animateCards(initialActiveContent);
    }
});
