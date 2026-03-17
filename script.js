document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const mobileWrap = document.querySelector('.mobile-nav-wrap');
  const mobileLinks = document.querySelectorAll('.mobile-nav a');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let lastScrollY = window.scrollY;
  const setHeaderState = () => {
    if (!header) return;
    const currentY = window.scrollY;
    header.classList.toggle('scrolled', currentY > 12);

    if (prefersReducedMotion) {
      header.classList.remove('header-hidden');
      lastScrollY = currentY;
      return;
    }

    const menuOpen = body.classList.contains('menu-open');
    if (menuOpen || currentY <= 24) {
      header.classList.remove('header-hidden');
    } else if (currentY > lastScrollY + 6 && currentY > 120) {
      header.classList.add('header-hidden');
    } else if (currentY < lastScrollY - 6) {
      header.classList.remove('header-hidden');
    }
    lastScrollY = currentY;
  };
  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  if (toggle && mobileWrap) {
    const setMenu = (open) => {
      mobileWrap.classList.toggle('open', open);
      toggle.classList.toggle('is-active', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      body.classList.toggle('menu-open', open);
    };

    toggle.addEventListener('click', () => {
      const open = !mobileWrap.classList.contains('open');
      setMenu(open);
    });

    mobileLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('click', (event) => {
      const clickedInside = mobileWrap.contains(event.target) || toggle.contains(event.target);
      if (!clickedInside) setMenu(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 980) setMenu(false);
    });
  }

  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav-link]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const hrefFile = href.split('/').pop();
    if (hrefFile === current) link.classList.add('active');
  });

  const revealTargets = document.querySelectorAll('.hero-box, .hero-visual, .section-header, .info-panel, .theme-card, .callout, .sidebar, .article, .contact-page-wrap');
  revealTargets.forEach((el, index) => {
    el.classList.add('reveal-on-scroll');
    el.style.transitionDelay = prefersReducedMotion ? '0ms' : `${Math.min(index * 70, 280)}ms`;
  });

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(el => observer.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  document.querySelectorAll('.btn, .theme-card, .callout, .info-panel').forEach(el => {
    el.addEventListener('mouseenter', () => el.classList.add('is-hovered'));
    el.addEventListener('mouseleave', () => el.classList.remove('is-hovered'));
  });

  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.type = 'button';
  backToTop.setAttribute('aria-label', 'Revenir en haut');
  backToTop.textContent = '↑';
  document.body.appendChild(backToTop);

  const toggleBackToTop = () => {
    backToTop.classList.toggle('visible', window.scrollY > 420);
  };
  toggleBackToTop();
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  const searchRoot = document.querySelector('[data-search-root]');
  const searchDataEl = document.querySelector('.search-data');
  if (searchRoot && searchDataEl) {
    let selectedHref = '';
    let selectedIndex = -1;
    const input = searchRoot.querySelector('.site-search-input');
    const submit = searchRoot.querySelector('.search-submit');
    const suggestionsBox = searchRoot.querySelector('.search-suggestions');
    const allItems = JSON.parse(searchDataEl.textContent || '[]');
    let filteredItems = [];

    const normalize = (value) => value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

    const renderSuggestions = () => {
      suggestionsBox.innerHTML = '';
      if (!filteredItems.length) {
        suggestionsBox.hidden = true;
        return;
      }
      filteredItems.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'search-suggestion' + (index === selectedIndex ? ' active' : '');
        const group = item.href.includes('independante') ? 'Page utile' : 'Sous-partie';
        div.innerHTML = `<strong>${item.title}</strong><small>${group}</small>`;
        div.addEventListener('mousedown', (event) => {
          event.preventDefault();
          input.value = item.title;
          selectedHref = item.href;
          selectedIndex = index;
          renderSuggestions();
        });
        suggestionsBox.appendChild(div);
      });
      suggestionsBox.hidden = false;
    };

    const updateResults = () => {
      const q = normalize(input.value.trim());
      if (!q) {
        filteredItems = [];
        selectedIndex = -1;
        selectedHref = '';
        renderSuggestions();
        return;
      }
      filteredItems = allItems.filter(item => normalize(item.title).includes(q)).slice(0, 8);
      const exact = filteredItems.find(item => normalize(item.title) === q);
      selectedHref = exact ? exact.href : (filteredItems[0]?.href || '');
      selectedIndex = filteredItems.length ? 0 : -1;
      renderSuggestions();
    };

    const openResult = () => {
      if (selectedHref) window.location.href = selectedHref;
    };

    input.addEventListener('input', updateResults);
    input.addEventListener('focus', updateResults);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        if (!filteredItems.length) return;
        event.preventDefault();
        selectedIndex = (selectedIndex + 1) % filteredItems.length;
        selectedHref = filteredItems[selectedIndex].href;
        input.value = filteredItems[selectedIndex].title;
        renderSuggestions();
      }
      if (event.key === 'ArrowUp') {
        if (!filteredItems.length) return;
        event.preventDefault();
        selectedIndex = (selectedIndex - 1 + filteredItems.length) % filteredItems.length;
        selectedHref = filteredItems[selectedIndex].href;
        input.value = filteredItems[selectedIndex].title;
        renderSuggestions();
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        openResult();
      }
      if (event.key === 'Escape') {
        suggestionsBox.hidden = true;
      }
    });
    submit.addEventListener('click', openResult);
    document.addEventListener('click', (event) => {
      if (!searchRoot.contains(event.target)) suggestionsBox.hidden = true;
    });
  }
});


function showShareFeedback(message) {
  let feedback = document.querySelector('.share-feedback');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.className = 'share-feedback';
    document.body.appendChild(feedback);
  }
  feedback.textContent = message;
  feedback.classList.add('visible');
  clearTimeout(showShareFeedback._timer);
  showShareFeedback._timer = setTimeout(() => feedback.classList.remove('visible'), 2200);
}

async function shareSite() {
  const title = 'Guide du funéraire en France';
  const text = 'Un site simple, pédagogique et neutre pour comprendre les démarches après un décès.';
  const url = window.location.href;

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (error) {
      if (error && error.name === 'AbortError') return;
    }
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      showShareFeedback('Lien copié. Vous pouvez maintenant le partager.');
      return;
    }
  } catch (error) {}

  const mailto = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}`;
  window.location.href = mailto;
}
// Scroll auto sur mobile pour afficher le titre de la sous-partie en haut
window.addEventListener('load', () => {
  if (window.innerWidth > 768) return;

  const isHomePage =
    window.location.pathname.endsWith('/') ||
    window.location.pathname.endsWith('/index.html') ||
    window.location.pathname === '/index.html';

  if (isHomePage) return;

  const title =
    document.querySelector('main h1') ||
    document.querySelector('main h2');

  if (!title) return;

  setTimeout(() => {
    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.offsetHeight : 0;
    const extraSpace = 16;

    const targetY =
      title.getBoundingClientRect().top +
      window.pageYOffset -
      headerHeight -
      extraSpace;

    window.scrollTo({
      top: Math.max(targetY, 0),
      behavior: 'smooth'
    });
  }, 300);
});
