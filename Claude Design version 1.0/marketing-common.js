/* Mingsmileyface · marketing-common.js
   Shared behaviour for marketing pages: theme toggle, nav scroll state,
   reveal-on-scroll, and restoring the persisted accent before paint-ish. */
(function () {
  var root = document.documentElement;

  /* ---- accent (persisted by Tweaks; also restored here for no-React pages) */
  try {
    var savedAccent = localStorage.getItem('ming-accent');
    if (savedAccent && savedAccent !== 'signature') root.setAttribute('data-accent', savedAccent);
    var savedPL = localStorage.getItem('ming-pricelayout');
    if (savedPL) root.setAttribute('data-pricelayout', savedPL);
  } catch (e) {}

  /* ---- theme toggle ---- */
  var btnDark = document.getElementById('btn-dark');
  var btnLight = document.getElementById('btn-light');
  function setTheme(t) {
    root.setAttribute('data-theme', t === 'classic-dark' ? 'dark' : t === 'classic-light' ? 'light' : t);
    if (btnDark) btnDark.setAttribute('aria-pressed', String((t === 'petronas' || t === 'classic-dark' || t === 'dark')));
    if (btnLight) btnLight.setAttribute('aria-pressed', String((t === 'petronas-light' || t === 'classic-light' || t === 'light')));
    try { localStorage.setItem('ming-theme', t); } catch (e) {}
  }
  if (btnDark) btnDark.addEventListener('click', function () { setTheme('petronas'); });
  if (btnLight) btnLight.addEventListener('click', function () { setTheme('petronas-light'); });
  try {
    var saved = localStorage.getItem('ming-theme');
    setTheme(saved === 'dark' ? 'petronas' : saved === 'light' ? 'petronas-light' : (saved || 'petronas-light'));
  } catch (e) {}

  /* ---- nav scroll state ---- */
  var navWrap = document.getElementById('nav-wrap');
  function onScroll() {
    if (!navWrap) return;
    if (window.scrollY > 24) navWrap.classList.add('scrolled');
    else navWrap.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- reveal on scroll ---- */
  var reveals = document.querySelectorAll('.reveal');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  reveals.forEach(function (el) { io.observe(el); });
  // Failsafe: never leave content hidden if IO is throttled (e.g. backgrounded
  // tab) or unsupported. Reveal anything still hidden after a short grace.
  setTimeout(function () {
    document.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) el.classList.add('in');
    });
  }, 1600);

  /* ---- soon-gated pages: Referral, Testimonials, Results, FAQ ------------
     Not live yet. Site-wide nav/footer links to them are grayed out and no
     longer navigate; the pages themselves show a coming-soon notice
     (see soon-banner block at the top of each). Re-applied on every pass
     because site-config.js rebuilds .nav-links from scratch after this
     script runs (and can rebuild it again later from the inline editor),
     which would otherwise wipe the gating. */
  var SOON_PAGES = ['referral.html', 'testimonials.html', 'results.html', 'faq.html'];
  function baseName(href) {
    try { return href.split('/').pop().split('#')[0].split('?')[0].toLowerCase(); } catch (e) { return ''; }
  }
  function applySoonGating() {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var target = baseName(a.getAttribute('href'));
      if (SOON_PAGES.indexOf(target) === -1) return;
      if (a.closest('.soon-banner')) return; // banner's own "back" links stay live
      if (a.dataset.soonWired) return;
      a.dataset.soonWired = '1';
      a.classList.add('nav-soon');
      a.addEventListener('click', function (e) { e.preventDefault(); });
    });
  }
  applySoonGating();
  // catch nav rebuilds by site-config.js (applyNav / inline editor) which
  // replace .nav-links innerHTML after this script has already run once
  var navLinksEl = document.querySelector('.nav-links');
  if (navLinksEl && window.MutationObserver) {
    new MutationObserver(applySoonGating).observe(navLinksEl, { childList: true, subtree: true });
  }
  // belt-and-suspenders: a couple of delayed re-passes cover any other
  // late DOM rebuilds outside .nav-links
  setTimeout(applySoonGating, 300);
  setTimeout(applySoonGating, 1200);
})();
