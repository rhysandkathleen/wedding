/* =========================================================================
   site.js — shared behaviour for every page
   • Palette cycling (rainbow button)   • EN / GR language toggle
   • Nav + footer injection              • Scroll reveal
   ========================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     1. PALETTES  — four themes; the rainbow button cycles 1 → 2 → 3 → 4 → 1.
        Each is anchored on a single accent colour with a chosen contrast ink.
     --------------------------------------------------------------------- */
  const PALETTES = [
    // 1 · Peach — accent #fed0bb, contrast #4a342a
    { name:'Peach',  bg:'#fef4ee', bg2:'#fde8dd', surface:'#fffaf7', text:'#4a342a', soft:'#93776a', line:'#f3ddd0', accent:'#fed0bb', ink:'#d98a6b', on:'#4a342a' },
    // 2 · Meadow — accent #d0e2ba, contrast #414934
    { name:'Meadow', bg:'#f4f7ee', bg2:'#e7efd9', surface:'#fafcf5', text:'#3b4230', soft:'#727a60', line:'#dde7cc', accent:'#d0e2ba', ink:'#7e9456', on:'#414934' },
    // 3 · Blush — punchy rose: bg #f8edec, mid accent #d6a1a0, deep terracotta ink/text #ba5242
    { name:'Blush',  bg:'#f8edec', bg2:'#f3e0df', surface:'#fffafa', text:'#ba5242', soft:'#9e655b', line:'#eed7d4', accent:'#d6a1a0', ink:'#ba5242', on:'#5a201a' },
    // 4 · Forest — inverted dark: dark-green ground, light text, lighter-green accent #99aa7d
    { name:'Forest', bg:'#414934', bg2:'#4a5340', surface:'#4d5640', text:'#f4efe6', soft:'#c1c6b1', line:'#5a6347', accent:'#99aa7d', ink:'#99aa7d', on:'#23281a' },
  ];

  function applyPalette(i) {
    const p = PALETTES[(i % PALETTES.length + PALETTES.length) % PALETTES.length];
    const r = document.documentElement.style;
    r.setProperty('--bg', p.bg);
    r.setProperty('--bg-2', p.bg2);
    r.setProperty('--surface', p.surface);
    r.setProperty('--text', p.text);
    r.setProperty('--soft', p.soft);
    r.setProperty('--line', p.line);
    r.setProperty('--accent', p.accent);
    r.setProperty('--accent-ink', p.ink);
    r.setProperty('--on-accent', p.on);
    document.documentElement.dataset.palette = p.name.toLowerCase();
  }

  let paletteIdx = parseInt(localStorage.getItem('kr-palette') || '0', 10) || 0;
  applyPalette(paletteIdx);

  function cyclePalette() {
    paletteIdx = (paletteIdx + 1) % PALETTES.length;
    localStorage.setItem('kr-palette', String(paletteIdx));
    applyPalette(paletteIdx);
    if (window.KR && KR.onPaletteChange) KR.onPaletteChange(paletteIdx);
  }

  /* ---------------------------------------------------------------------
     2. LANGUAGE  — swaps any element carrying data-en / data-gr.
        Placeholders use data-en-ph / data-gr-ph.
     --------------------------------------------------------------------- */
  let lang = localStorage.getItem('kr-lang') || 'en';

  function applyLang(l) {
    lang = l;
    localStorage.setItem('kr-lang', l);
    document.documentElement.lang = (l === 'gr') ? 'el' : 'en';
    document.querySelectorAll('[data-en]').forEach(el => {
      const v = el.getAttribute('data-' + l);
      if (v !== null) el.innerHTML = v;
    });
    document.querySelectorAll('[data-en-ph]').forEach(el => {
      const v = el.getAttribute('data-' + l + '-ph');
      if (v !== null) el.setAttribute('placeholder', v);
    });
    document.querySelectorAll('.lang-toggle button').forEach(b =>
      b.classList.toggle('on', b.dataset.lang === l));
    if (window.KR && KR.onLangChange) KR.onLangChange(l);
  }

  // expose for pages that build content dynamically
  window.KR = window.KR || {};
  KR.getLang = () => lang;
  KR.t = (en, gr) => (lang === 'gr' ? gr : en);

  /* ---------------------------------------------------------------------
     2b. HEADING FONTS  — a different face per language so neither alphabet
         falls back. site.js writes --display-en / --display-el; the CSS
         html[lang="el"] rule decides which one is live. Saved choices are
         shared across every page via localStorage.
     --------------------------------------------------------------------- */
  const FONT_STACKS = {
    'MBJ Chunky':         "'MBJ Chunky', 'Hanken Grotesk', sans-serif",
    'Berthold Block':     "'berthold-block-w1g', 'Hanken Grotesk', sans-serif",
    'Adlery Pro':         "'adlery-pro-blockletter', 'Hanken Grotesk', sans-serif",
    'Playfair Display':   "'Playfair Display', Georgia, serif",
    'Hanken Grotesk':     "'Hanken Grotesk', system-ui, sans-serif",
    'Merriweather':       "'Merriweather', Georgia, serif",
    'Noto Serif':         "'Noto Serif', Georgia, serif",
    'Crimson Text':       "'Crimson Text', Georgia, serif",
  };
  const DEFAULT_FONTS = { en:'MBJ Chunky', el:'Berthold Block' };

  function getFonts() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('kr-fonts')) || {}; } catch (e) {}
    return Object.assign({}, DEFAULT_FONTS, saved);
  }
  function applyFonts() {
    const f = getFonts();
    const r = document.documentElement.style;
    r.setProperty('--display-en', FONT_STACKS[f.en] || FONT_STACKS['MBJ Chunky']);
    r.setProperty('--display-el', FONT_STACKS[f.el] || FONT_STACKS['Berthold Block']);
  }
  applyFonts();

  KR.FONT_STACKS = FONT_STACKS;
  KR.getFonts = getFonts;
  KR.setFont = (which, name) => {            // which: 'en' | 'el'
    const saved = getFonts();
    saved[which] = name;
    localStorage.setItem('kr-fonts', JSON.stringify(saved));
    applyFonts();
  };

  /* ---------------------------------------------------------------------
     3. NAV + FOOTER injection
     --------------------------------------------------------------------- */
  const LINKS = [
    { href:'index.html',         en:'Home',    gr:'Αρχική' },
    { href:'the-day.html',       en:'The Day', gr:'Η Μέρα' },
    { href:'rsvp.html',          en:'RSVP',    gr:'RSVP' },
    { href:'travel.html',        en:'Travel',  gr:'Ταξίδι' },
    { href:'accommodation.html', en:'Stay',    gr:'Διαμονή' },
    { href:'explore.html',       en:'Explore', gr:'Περιοχή' },
    { href:'faq.html',           en:'FAQ',     gr:'Ερωτήσεις' },
  ];

  function currentFile() {
    const p = location.pathname.split('/').pop();
    return p === '' ? 'index.html' : p;
  }

  function buildNav() {
    const here = currentFile();
    const nav = document.createElement('header');
    nav.className = 'nav';
    nav.innerHTML = `
      <div class="wrap">
        <a class="brand" href="index.html">K<span class="amp">&amp;</span>R</a>
        <button class="menu-btn" aria-label="Menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
        <nav class="nav-links">
          ${LINKS.map(l => `<a href="${l.href}" data-en="${l.en}" data-gr="${l.gr}"${l.href===here?' class="active"':''}>${l.en}</a>`).join('')}
        </nav>
        <div class="nav-tools">
          <div class="lang-toggle" role="group" aria-label="Language">
            <button data-lang="en" aria-label="English" title="English"><span class="lbl">EN</span></button>
            <button data-lang="gr" aria-label="Ελληνικά" title="Ελληνικά"><span class="lbl">ΕΛ</span></button>
          </div>
          <button class="palette-btn" aria-label="Change colour theme" title="Change colour theme"></button>
        </div>
      </div>`;
    document.body.prepend(nav);

    nav.querySelector('.palette-btn').addEventListener('click', cyclePalette);
    nav.querySelectorAll('.lang-toggle button').forEach(b =>
      b.addEventListener('click', () => applyLang(b.dataset.lang)));

    const menuBtn = nav.querySelector('.menu-btn');
    const links = nav.querySelector('.nav-links');
    menuBtn.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));

    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });
  }

  function buildFooter() {
    const here = currentFile();
    const f = document.createElement('footer');
    f.className = 'foot';
    f.innerHTML = `
      <div class="wrap">
        <div class="foot-top">
          <div class="foot-id">
            <img class="foot-geese" src="assets/geese.svg" alt="" aria-hidden="true">
            <div>
              <div class="foot-brand">Kathleen <span class="amp" style="color:var(--accent-ink)">&amp;</span> Rhys</div>
              <p style="color:var(--soft);margin-top:8px" data-en="12 June 2027 · Aitoliko, Greece" data-gr="12 Ιουνίου 2027 · Αιτωλικό, Ελλάδα">12 June 2027 · Aitoliko, Greece</p>
            </div>
          </div>
          <nav class="foot-links">
            ${LINKS.map(l => `<a href="${l.href}" data-en="${l.en}" data-gr="${l.gr}"${l.href===here?' style="color:var(--text)"':''}>${l.en}</a>`).join('')}
          </nav>
        </div>
        <div class="foot-bottom">
          <span>♡ K &amp; R · 2027</span>
        </div>
      </div>`;
    document.body.appendChild(f);
  }

  /* ---------------------------------------------------------------------
     4. SCROLL REVEAL
     --------------------------------------------------------------------- */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach(e => e.classList.add('in')); return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold:0.12, rootMargin:'0px 0px -8% 0px' });
    els.forEach(e => io.observe(e));
  }

  /* ---------------------------------------------------------------------
     init
     --------------------------------------------------------------------- */
  function init() {
    buildNav();
    buildFooter();
    applyLang(lang);
    initReveal();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
