/* ==========================================================================
   Mingsmileyface · Site Config  (shared CMS layer)
   --------------------------------------------------------------------------
   One source of truth for: public navbar items + Landing-page sections/text.
   Persisted in localStorage['ming-site'] so the Admin "หน้าเว็บ & เมนู" panel
   and every public page read/write the SAME state.

   Public pages: just <script src="site-config.js"></script> before </body>.
     - rebuilds .nav-links from config (adds หน้าหลัก, applies on/off toggles)
     - on Landing, hides disabled sections + applies edited text
     - if edit flag is on (set by admin), boots the inline editor

   Admin panel uses: MingSite.get(), MingSite.save(cfg), MingSite.reset(),
                     MingSite.NAV_ITEMS, MingSite.SECTIONS, MingSite.openEditor()
   ========================================================================== */
(function (global) {
  'use strict';

  var STORE = 'ming-site';
  var EDIT_FLAG = 'ming-site-edit';

  /* ---- canonical definitions (order matters) ------------------------------ */
  var NAV_ITEMS = [
    { id: 'home',    label: 'หน้าหลัก',        file: 'Landing Page.html', anchor: '#' },
    { id: 'courses', label: 'คอร์ส',           file: 'Courses.html',      anchor: '#courses' },
    { id: 'results', label: 'ผลงานนักเรียน',   file: 'Results.html' },
    { id: 'reviews', label: 'รีวิว',           file: 'Testimonials.html' },
    { id: 'about',   label: 'เกี่ยวกับ',       file: 'About.html' },
    { id: 'location',label: 'สถานที่เรียน',     file: 'Location.html' },
    { id: 'faq',     label: 'FAQ',             file: 'FAQ.html' }
  ];

  // Landing sections (data-sec attr) + whether the admin may also edit text in it
  var SECTIONS = [
    { id: 'hero',    label: 'ฮีโร่ (หัวเรื่องหลัก)' },
    { id: 'trust',   label: 'แถบสถิติความน่าเชื่อถือ' },
    { id: 'about',   label: 'เกี่ยวกับติวเตอร์' },
    { id: 'why',     label: 'ทำไมต้องเรียนกับเรา' },
    { id: 'courses', label: 'คอร์สเด่น' },
    { id: 'results', label: 'ผลงานนักเรียน' },
    { id: 'how',     label: 'เริ่มยังไง (3 ขั้นตอน)' },
    { id: 'location',label: 'สถานที่เรียนออนไซต์ (teaser)' },
    { id: 'cta',     label: 'กล่องเรียกร้องให้สมัคร (CTA)' }
  ];

  var COURSE_LANES = [
    { id: 'math', label: 'คณิต' },
    { id: 'phys', label: 'ฟิสิกส์' },
    { id: 'tpat', label: 'TPAT3' },
    { id: 'tgat', label: 'TGAT2' }
  ];
  var SPEEDS = { slow: 14, medium: 24, fast: 42 }; // px / second

  // About page sections (data-sec) — ids are distinct from Landing so they
  // share cfg.sections / cfg.text without collision
  var ABOUT_SECTIONS = [
    { id: 'aboutHero',       label: 'ฮีโร่ (About)' },
    { id: 'aboutStats',      label: 'แถบสถิติ' },
    { id: 'aboutStory',      label: 'เส้นทาง / Timeline' },
    { id: 'aboutPhilosophy', label: 'ปรัชญาการสอน' },
    { id: 'aboutSmiley',     label: 'ทำไมชื่อ smileyface (มุก)' },
    { id: 'aboutSubjects',   label: 'วิชาที่สอน + คลิป' }
  ];
  var ABOUT_CLIPS = [
    { id: 'math',  label: 'คณิต' },
    { id: 'phys',  label: 'ฟิสิกส์' },
    { id: 'tpat3', label: 'TPAT3' },
    { id: 'tgat2', label: 'TGAT2' }
  ];
  // About timeline (#aboutStory) — editable & creatable from admin
  var STORY_DEFAULT = [
    { year: '2559', kind: 'GRADE 12', title: 'เหรียญทอง สอวน. ฟิสิกส์ ระดับประเทศ', body: 'ปีสุดท้ายของ ม.ปลาย — คว้าเหรียญทองโอลิมปิกวิชาการ พร้อมกับติวเพื่อนในห้องไปด้วยจนหลายคนสอบติดคณะในฝัน.', tag: 'จุดเริ่มต้น' },
    { year: '2560', kind: 'YEAR 1', title: 'เข้าวิศวกรรมศาสตร์ จุฬาฯ · เกียรตินิยม', body: 'ระหว่างเรียนวิศวะ รับติวน้อง ม.ปลายเป็นกลุ่มเล็กๆ ทั้งคณิตและฟิสิกส์ — เริ่มเห็นว่า "วิธีคิด" สำคัญกว่า "จำนวนโจทย์".', tag: 'มหาวิทยาลัย' },
    { year: '2562', kind: 'LAUNCH', title: 'เปิด Mingsmileyface เต็มตัว', body: 'ตัดสินใจสอนเต็มเวลา ทั้งออนไลน์และออนไซต์. คอร์สแรกเน้นคณิต–ฟิสิกส์ ม.ปลาย และค่อยๆ ขยายสู่สนามสอบเข้ามหา\'ลัย.', tag: 'ก่อตั้ง' },
    { year: '2565', kind: 'SYSTEM', title: 'สร้างระบบติว + dashboard ของตัวเอง', body: 'จากกระดาษและไลน์กลุ่ม สู่แพลตฟอร์มที่มี progress · streak · คลังข้อสอบจริง — เพื่อให้น้องเห็นความก้าวหน้าทุกวัน.', tag: 'แพลตฟอร์ม' },
    { year: '2569', kind: 'TODAY', title: 'ปีที่ 2 · นักเรียน 2,400+ คน', body: 'วันนี้พี่หมิงโฟกัส 4 วิชาที่ถนัดที่สุด — เน้นคุณภาพมากกว่าปริมาณ. ยังตอบทุกคำถามเองภายใน 12 ชั่วโมงเหมือนวันแรก.', tag: 'ปัจจุบัน' }
  ];

  // About "ทำไมชื่อ smileyface" gag — กดเรื่อยๆ คำกวนๆ จะวนไปไม่รู้จบ (แก้/เพิ่มได้จาก admin)
  var GAG_DEFAULT = [
    'ไม่บอก 😏',
    'ก็บอกไปแล้วไงว่าไม่บอก 🙃',
    'ทำไมยังกดอยู่อีกล่ะเนี่ย 😂',
    'เอาจริงดิ ยังไม่ยอมแพ้?',
    'นิ้วน้องไม่เมื่อยเหรอ พี่เริ่มเป็นห่วงละ',
    'ความลับมันต้องมีบ้างสิ ถึงจะน่าค้นหา',
    'ถ้าบอกง่ายๆ มันจะเท่ตรงไหนล่ะ',
    'ใกล้แล้ว... ล้อเล่น ยังอีกไกลมาก',
    'โอเค บอกก็ได้ ฟังดีๆ นะ... ไม่บอก 😆',
    'น้องนี่ดื้อจริง พี่ชอบบบ',
    'ลองเดาเองสิ เดี๋ยวพี่พยักหน้าให้ (ไม่พยักหรอก)',
    'ความลับระดับนี้ ต้องสมัครเรียนก่อนถึงจะปลดล็อก 🔒',
    'สปอยล์ให้นิดนึง: มันคือ... เดี๋ยวค่อยบอก',
    'แอดมินแอบนับอยู่นะ ว่าน้องจะกดถึงครั้งที่เท่าไหร่ 👀',
    'เอาน่า กดต่อไปเรื่อยๆ ชีวิตจะได้มีลุ้น',
    'พี่หมิงเขียนมุกดักไว้เยอะมาก กดยังไงก็ไม่หมดหรอก',
    'จริงๆ คำตอบมันอยู่ในคอร์สนั่นแหละ 🤫',
    'ยอมแพ้ยัง? ยังเนอะ... พี่ก็ว่างั้นแหละ',
    'นับถือความพยายาม แต่ก็ยังไม่บอกอยู่ดี',
    'เอาละ ครั้งนี้จริงๆ... เกือบบอกแล้วเชียว แต่ไม่ 😎'
  ];

  // Dashboard news strip — admin-controlled (เปิด/ปิด + แก้ข้อความได้). ปิดไว้ก่อนเป็นค่าเริ่มต้น
  var DASH_NEWS_DEFAULT = [
    { kind: 'urgent',  tag: 'DEADLINE', text: 'สมัครสอบ <b>A-Level ครั้งที่ 1</b> ปิดรับ 28 พฤษภาคม · เหลือ 12 วัน' },
    { kind: 'course',  tag: 'COURSE',   text: 'เปิดคอร์สใหม่ <b>กลศาสตร์ของไหล</b> · พี่หมิงสอน live ทุกวันพุธ 20:00' },
    { kind: 'success', tag: 'RESULT',   text: 'ยินดีกับ <b>87% ของรุ่น TCAS 67</b> ที่สอบติดคณะอันดับ 1 — ดูผลทั้งหมด' },
    { kind: 'live',    tag: 'LIVE',     text: 'คืนนี้ 21:00 · <b>ตะลุยโจทย์ TPAT3 ปีล่าสุด</b> กับพี่หมิง' }
  ];

  var CD_PRESETS_DEFAULT = [
    { id: 'tgat-tpat', title: 'นับถอยหลังสอบ <b>TGAT/TPAT · TCAS 70</b>', target: '2026-12-12T08:30:00' },
    { id: 'alevel',    title: 'นับถอยหลังสอบ <b>A-Level · TCAS 70</b>',   target: '2027-03-06T08:30:00' },
    { id: 'gsat',      title: 'นับถอยหลังสอบ <b>กสพท (TPAT1)</b>',        target: '2026-12-19T08:30:00' }
  ];

  function defaults() {
    var nav = {}, sec = {}, lanes = {};
    NAV_ITEMS.forEach(function (n) { nav[n.id] = true; });
    SECTIONS.forEach(function (s) { sec[s.id] = true; });
    ABOUT_SECTIONS.forEach(function (s) { sec[s.id] = true; });
    COURSE_LANES.forEach(function (l) { lanes[l.id] = true; });
    return { nav: nav, navOrder: NAV_ITEMS.map(function (n) { return n.id; }), sections: sec, order: SECTIONS.map(function (s) { return s.id; }), countdownPresets: CD_PRESETS_DEFAULT.map(function (p) { return { id: p.id, title: p.title, target: p.target }; }), aboutOrder: ABOUT_SECTIONS.map(function (s) { return s.id; }), text: {}, clips: {}, story: STORY_DEFAULT.map(function (e) { return Object.assign({}, e); }), gag: GAG_DEFAULT.slice(), courses: { autoscroll: true, speed: 'slow', lanes: lanes }, dashNews: { enabled: false, items: DASH_NEWS_DEFAULT.map(function (e) { return Object.assign({}, e); }) } };
  }

  // sanitize an order array: keep only known ids; insert any missing ids at
  // their DEFAULT position (before the next default-neighbor present), not at the end —
  // so new sections land where the canonical order intends even for old saved configs
  function normalizeNavOrder(arr) {
    var known = NAV_ITEMS.map(function (n) { return n.id; });
    var seen = {}, out = [];
    (arr || []).forEach(function (id) { if (known.indexOf(id) >= 0 && !seen[id]) { seen[id] = 1; out.push(id); } });
    known.forEach(function (id) { if (!seen[id]) { out.push(id); seen[id] = 1; } });
    return out;
  }
  function normalizeOrder(arr) {
    var known = SECTIONS.map(function (s) { return s.id; });
    var seen = {}, out = [];
    (arr || []).forEach(function (id) { if (known.indexOf(id) >= 0 && !seen[id]) { seen[id] = 1; out.push(id); } });
    known.forEach(function (id, i) {
      if (seen[id]) return;
      var at = out.length;
      for (var j = i + 1; j < known.length; j++) {
        var idx = out.indexOf(known[j]);
        if (idx >= 0) { at = idx; break; }
      }
      out.splice(at, 0, id);
      seen[id] = 1;
    });
    return out;
  }
  function normalizeAboutOrder(arr) {
    var known = ABOUT_SECTIONS.map(function (s) { return s.id; });
    var seen = {}, out = [];
    (arr || []).forEach(function (id) { if (known.indexOf(id) >= 0 && !seen[id]) { seen[id] = 1; out.push(id); } });
    known.forEach(function (id, i) {
      if (seen[id]) return;
      var at = out.length;
      for (var j = i + 1; j < known.length; j++) {
        var idx = out.indexOf(known[j]);
        if (idx >= 0) { at = idx; break; }
      }
      out.splice(at, 0, id);
      seen[id] = 1;
    });
    return out;
  }

  /* ---- storage ------------------------------------------------------------ */
  function get() {
    var base = defaults();
    try {
      var raw = localStorage.getItem(STORE);
      if (raw) {
        var saved = JSON.parse(raw);
        if (saved.nav)      Object.keys(saved.nav).forEach(function (k) { base.nav[k] = saved.nav[k]; });
        base.navOrder = normalizeNavOrder(saved.navOrder);
        if (saved.sections) Object.keys(saved.sections).forEach(function (k) { base.sections[k] = saved.sections[k]; });
        base.order = normalizeOrder(saved.order);
        base.aboutOrder = normalizeAboutOrder(saved.aboutOrder);
        if (saved.text)     base.text = saved.text;
        if (saved.clips)    base.clips = saved.clips;
        if (Array.isArray(saved.story)) base.story = saved.story;
        if (Array.isArray(saved.gag) && saved.gag.length) base.gag = saved.gag.slice();
        if (saved.courses) {
          if (typeof saved.courses.autoscroll === 'boolean') base.courses.autoscroll = saved.courses.autoscroll;
          if (saved.courses.speed) base.courses.speed = saved.courses.speed;
          if (saved.courses.lanes) Object.keys(saved.courses.lanes).forEach(function (k) { base.courses.lanes[k] = saved.courses.lanes[k]; });
        }
        if (saved.dashNews) {
          if (typeof saved.dashNews.enabled === 'boolean') base.dashNews.enabled = saved.dashNews.enabled;
          if (Array.isArray(saved.dashNews.items)) base.dashNews.items = saved.dashNews.items.slice();
        }
        if (Array.isArray(saved.countdownPresets)) base.countdownPresets = saved.countdownPresets.slice();
      }
    } catch (e) {}
    return base;
  }
  function save(cfg) {
    try { localStorage.setItem(STORE, JSON.stringify(cfg)); } catch (e) {}
  }
  function reset() {
    try { localStorage.removeItem(STORE); } catch (e) {}
  }

  /* ---- helpers ------------------------------------------------------------ */
  function currentFile() {
    var p = location.pathname.split('/').pop();
    try { p = decodeURIComponent(p); } catch (e) {}
    return p || 'Landing Page.html';
  }
  function isLanding() {
    return currentFile() === 'Landing Page.html' || !!document.querySelector('[data-sec="hero"]');
  }
  function isAbout() {
    return currentFile() === 'About.html' || !!document.querySelector('[data-sec="aboutHero"]');
  }
  function isEditablePage() { return isLanding() || isAbout(); }
  function currentSections() { return isAbout() ? ABOUT_SECTIONS : SECTIONS; }
  function clipFor(key) {
    var cfg = get();
    return (cfg.clips && cfg.clips[key]) || '';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---- NAV: rebuild .nav-links from config -------------------------------- */
  function applyNav(cfg) {
    cfg = cfg || get();
    var ul = document.querySelector('.nav-links');
    if (!ul) return;
    var cur = currentFile();
    var onLanding = isLanding();
    var html = '';
    var byId = {};
    NAV_ITEMS.forEach(function (it) { byId[it.id] = it; });
    normalizeNavOrder(cfg.navOrder).forEach(function (id) {
      var item = byId[id];
      if (!item || cfg.nav[item.id] === false) return;
      var href, isCur = false;
      if (item.id === 'home') {
        href = onLanding ? '#' : item.file;
        isCur = onLanding;
      } else if (item.id === 'courses') {
        href = item.file; // ไปหน้าคอร์สเต็มเสมอ (ไม่เลื่อนไป section ในหน้า Landing)
        isCur = (cur === item.file);
      } else {
        href = item.file;
        isCur = (cur === item.file);
      }
      html += '<li><a href="' + href + '"' + (isCur ? ' class="current" aria-current="page"' : '') + '>' + item.label + '</a></li>';
    });
    ul.innerHTML = html;
  }

  /* ---- LANDING/ABOUT: section visibility + text overrides ----------------- */
  function applyLanding(cfg) {
    cfg = cfg || get();
    if (!isEditablePage()) return;
    document.querySelectorAll('[data-sec]').forEach(function (el) {
      var id = el.getAttribute('data-sec');
      if (cfg.sections[id] === false) el.setAttribute('data-hidden-section', '');
      else el.removeAttribute('data-hidden-section');
    });
    document.querySelectorAll('[data-edit]').forEach(function (el) {
      var key = el.getAttribute('data-edit');
      if (cfg.text && typeof cfg.text[key] === 'string') el.innerHTML = cfg.text[key];
    });
  }

  /* ---- LANDING/ABOUT: section order ------------------------------------- */
  function applyOrder(cfg) {
    cfg = cfg || get();
    var secs, order;
    if (isLanding()) { secs = SECTIONS; order = normalizeOrder(cfg.order); }
    else if (isAbout()) { secs = ABOUT_SECTIONS; order = normalizeAboutOrder(cfg.aboutOrder); }
    else return;
    var map = {};
    document.querySelectorAll('[data-sec]').forEach(function (el) { map[el.getAttribute('data-sec')] = el; });
    var main = null;
    for (var k in map) { if (map[k]) { main = map[k].parentNode; break; } }
    if (!main) return;
    order.forEach(function (id) { if (map[id]) main.appendChild(map[id]); });
  }

  /* ---- LANDING: featured-courses columns (vertical auto-scroll, mouse-scrollable) */
  function applyCourses(cfg) {
    cfg = cfg || get();
    if (!isLanding()) return;
    var wrap = document.getElementById('subj-cols');
    if (!wrap) return;
    var cc = cfg.courses || {};
    var lanes = cc.lanes || {};
    var pxPerSec = SPEEDS[cc.speed] || SPEEDS.slow;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var cols = Array.prototype.slice.call(wrap.querySelectorAll('.lane-col'));
    cols.forEach(function (col) {
      var id = col.getAttribute('data-lane');
      if (lanes[id] === false) col.setAttribute('data-hidden', '');
      else col.removeAttribute('data-hidden');
    });

    var autoscroll = cc.autoscroll !== false && !reduce;
    wrap.classList.toggle('no-autoscroll', !autoscroll);

    var visible = cols.filter(function (c) { return !c.hasAttribute('data-hidden'); });
    visible.forEach(function (col, idx) {
      setupColumn(col, idx, pxPerSec, autoscroll);
    });
  }

  function setupColumn(col, idx, pxPerSec, autoscroll) {
    var vp = col.querySelector('.lane-vp');
    var track = col.querySelector('.lane-vtrack');
    if (!vp || !track) return;

    // cancel any prior loop (re-entrant on config change)
    if (col._raf) { cancelAnimationFrame(col._raf); col._raf = null; }

    // clone for seamless loop only when auto-scrolling; do it once
    if (autoscroll && track.getAttribute('data-looped') !== '1') {
      var originals = Array.prototype.slice.call(track.children);
      var guard = 0;
      while (track.scrollHeight < vp.clientHeight + 40 && guard < 24) {
        originals.forEach(function (c) { track.appendChild(c.cloneNode(true)); });
        guard++;
      }
      col._setH = track.scrollHeight;
      Array.prototype.slice.call(track.children).forEach(function (c) {
        var cl = c.cloneNode(true); cl.setAttribute('aria-hidden', 'true'); cl.setAttribute('tabindex', '-1');
        track.appendChild(cl);
      });
      track.setAttribute('data-looped', '1');
    }

    if (!autoscroll) { vp.classList.add('no-mask'); return; }
    vp.classList.remove('no-mask');

    var setH = col._setH || track.scrollHeight / 2;
    var dir = idx % 2 === 1 ? -1 : 1;          // alternate up / down
    vp.scrollTop = dir === 1 ? 0 : setH;        // reverse columns start lower so they can move up-then-wrap

    // pause auto when the user is interacting or hovering
    var paused = false, hovering = false, idle = null;
    function nudge() { paused = true; clearTimeout(idle); idle = setTimeout(function () { paused = false; }, 1400); }
    vp.addEventListener('wheel', nudge, { passive: true });
    vp.addEventListener('touchstart', nudge, { passive: true });
    vp.addEventListener('touchmove', nudge, { passive: true });
    vp.addEventListener('pointerdown', nudge);
    col.addEventListener('mouseenter', function () { hovering = true; });
    col.addEventListener('mouseleave', function () { hovering = false; });

    var last = performance.now();
    function tick(now) {
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      if (!paused && !hovering) vp.scrollTop += dir * pxPerSec * dt;
      // seamless wrap over one set height
      if (vp.scrollTop >= setH) vp.scrollTop -= setH;
      else if (vp.scrollTop <= 0) vp.scrollTop += setH;
      col._raf = requestAnimationFrame(tick);
    }
    col._raf = requestAnimationFrame(tick);
  }

  /* ---- ABOUT: timeline (#aboutStory) — data-driven, editable from admin --- */
  function applyStory(cfg) {
    cfg = cfg || get();
    var wrap = document.getElementById('about-timeline');
    if (!wrap) return;
    var rows = Array.isArray(cfg.story) ? cfg.story : STORY_DEFAULT;
    wrap.innerHTML = rows.map(function (e) {
      return '<div class="tl-row reveal in">' +
        '<div class="tl-year">' + esc(e.year) + (e.kind ? '<span>' + esc(e.kind) + '</span>' : '') + '</div>' +
        '<div class="tl-spine"><div class="tl-dot"></div>' +
          '<div class="tl-body"><h3>' + esc(e.title) + '</h3><p>' + esc(e.body) + '</p>' +
          (e.tag ? '<span class="tl-tag">' + esc(e.tag) + '</span>' : '') + '</div></div></div>';
    }).join('');
  }

  /* ---- INLINE EDITOR (admin-only) ----------------------------------------- */
  function editFlag() {
    try { return localStorage.getItem(EDIT_FLAG) === '1'; } catch (e) { return false; }
  }
  function openEditor() {
    try { localStorage.setItem(EDIT_FLAG, '1'); } catch (e) {}
  }
  function closeEditor() {
    try { localStorage.removeItem(EDIT_FLAG); } catch (e) {}
  }

  function bootEditor() {
    var cfg = get();
    var SECS = currentSections();
    // working copy of section visibility
    var work = {};
    SECS.forEach(function (s) { work[s.id] = cfg.sections[s.id] !== false; });

    injectEditorCSS();

    // Reveal everything (don't keep edited sections invisible while editing)
    document.querySelectorAll('[data-hidden-section]').forEach(function (el) {
      el.removeAttribute('data-hidden-section');
    });

    // per-section control chip
    document.querySelectorAll('[data-sec]').forEach(function (el) {
      var id = el.getAttribute('data-sec');
      var def = SECS.filter(function (s) { return s.id === id; })[0] || { label: id };
      el.classList.add('ed-section');
      if (!work[id]) el.classList.add('ed-section--off');
      var chip = document.createElement('div');
      chip.className = 'ed-chip';
      chip.innerHTML =
        '<span class="ed-chip-name">' + def.label + '</span>' +
        '<button type="button" class="ed-eye" aria-label="ซ่อน/แสดงส่วนนี้">' +
          eyeSvg(work[id]) + '<span>' + (work[id] ? 'แสดงอยู่' : 'ซ่อนอยู่') + '</span>' +
        '</button>';
      var btn = chip.querySelector('.ed-eye');
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        work[id] = !work[id];
        el.classList.toggle('ed-section--off', !work[id]);
        btn.innerHTML = eyeSvg(work[id]) + '<span>' + (work[id] ? 'แสดงอยู่' : 'ซ่อนอยู่') + '</span>';
      });
      el.appendChild(chip);
    });

    // editable text
    document.querySelectorAll('[data-edit]').forEach(function (el) {
      el.setAttribute('contenteditable', 'true');
      el.classList.add('ed-text');
      el.addEventListener('keydown', function (e) {
        // keep it single-rich-block; allow Enter for <br> only with shift
        if (e.key === 'Enter' && !e.shiftKey && el.tagName !== 'P') { /* allow */ }
      });
    });

    // top toolbar
    var bar = document.createElement('div');
    bar.className = 'ed-bar';
    bar.innerHTML =
      '<div class="ed-bar-l"><span class="ed-dot"></span><b>โหมดแก้ไข</b><span class="ed-bar-sub">คลิกที่ข้อความเพื่อแก้ · ใช้ปุ่มตา 👁 เพื่อซ่อนส่วน</span></div>' +
      '<div class="ed-bar-r"><button type="button" class="ed-btn ed-cancel">ออกโดยไม่บันทึก</button><button type="button" class="ed-btn ed-save">บันทึกการเปลี่ยนแปลง</button></div>';
    document.body.appendChild(bar);
    document.body.classList.add('ed-on');

    bar.querySelector('.ed-cancel').addEventListener('click', function () {
      closeEditor(); location.reload();
    });
    bar.querySelector('.ed-save').addEventListener('click', function () {
      var fresh = get();
      // sections
      SECS.forEach(function (s) { fresh.sections[s.id] = !!work[s.id]; });
      // text
      fresh.text = fresh.text || {};
      document.querySelectorAll('[data-edit]').forEach(function (el) {
        // strip the injected chip if any landed inside (it won't, chips are appended to section)
        fresh.text[el.getAttribute('data-edit')] = el.innerHTML.trim();
      });
      save(fresh);
      closeEditor();
      location.reload();
    });
  }

  function eyeSvg(on) {
    return on
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-2.2 2.9M6.6 6.6A13.2 13.2 0 0 0 2 11s3.5 7 10 7a10.9 10.9 0 0 0 3.6-.6M3 3l18 18"/></svg>';
  }

  function injectEditorCSS() {
    if (document.getElementById('ed-css')) return;
    var s = document.createElement('style');
    s.id = 'ed-css';
    s.textContent = [
      'body.ed-on{padding-top:56px}',
      '.ed-bar{position:fixed;top:0;left:0;right:0;height:56px;z-index:9999;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 20px;background:oklch(0.16 0.016 285 / .92);backdrop-filter:blur(18px) saturate(160%);-webkit-backdrop-filter:blur(18px) saturate(160%);border-bottom:1px solid var(--glass-line-strong);color:var(--fg-0);font-family:"IBM Plex Sans Thai",sans-serif}',
      '.ed-bar-l{display:flex;align-items:center;gap:10px;font-size:14px;min-width:0}',
      '.ed-bar-l b{font-family:var(--font-display),sans-serif;font-weight:700}',
      '.ed-bar-sub{color:var(--fg-2);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ed-dot{width:9px;height:9px;border-radius:50%;background:var(--brand-magenta);box-shadow:0 0 0 4px oklch(0.68 0.25 5 / .25);flex:0 0 auto}',
      '.ed-bar-r{display:flex;gap:10px;flex:0 0 auto}',
      '.ed-btn{font-family:inherit;font-size:13px;font-weight:600;padding:9px 16px;border-radius:10px;cursor:pointer;border:1px solid var(--line);background:var(--bg-2);color:var(--fg-1);transition:background .2s,color .2s,border-color .2s}',
      '.ed-btn:hover{color:var(--fg-0);border-color:var(--fg-3)}',
      '.ed-save{background:var(--grad-signature);border-color:transparent;color:#fff;box-shadow:0 8px 22px -8px oklch(0.66 0.23 295 / .6)}',
      '.ed-save:hover{color:#fff;filter:brightness(1.05)}',
      '.ed-section{position:relative;outline:1.5px dashed transparent;outline-offset:-2px;transition:outline-color .2s}',
      '.ed-section:hover{outline-color:var(--glass-line-strong)}',
      '.ed-section--off{opacity:.4;filter:grayscale(.6)}',
      '.ed-chip{position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:50;display:flex;align-items:center;gap:10px;padding:5px 6px 5px 14px;border-radius:99px;background:oklch(0.16 0.016 285 / .9);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--glass-line-strong);box-shadow:var(--shadow-2);opacity:0;pointer-events:none;transition:opacity .2s}',
      '.ed-section:hover>.ed-chip,.ed-section--off>.ed-chip{opacity:1;pointer-events:auto}',
      '.ed-chip-name{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.02em;color:var(--fg-1);white-space:nowrap}',
      '.ed-eye{display:inline-flex;align-items:center;gap:6px;font-family:"IBM Plex Sans Thai",sans-serif;font-size:12px;font-weight:600;color:var(--fg-0);background:var(--bg-3);border:1px solid var(--line);border-radius:99px;padding:5px 11px;cursor:pointer}',
      '.ed-eye svg{width:14px;height:14px}',
      '.ed-eye:hover{background:var(--bg-2)}',
      '.ed-text{cursor:text;border-radius:6px;transition:box-shadow .15s,background .15s}',
      '.ed-text:hover{box-shadow:0 0 0 2px var(--glass-line-strong)}',
      '.ed-text:focus{outline:none;box-shadow:0 0 0 2px var(--brand-magenta);background:oklch(0.68 0.25 5 / .06)}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---- DASHBOARD: news strip (admin on/off + editable items) -------------- */
  function applyDashNews(cfg) {
    cfg = cfg || get();
    var sec = document.getElementById('news-strip');
    if (!sec) return;
    var nd = cfg.dashNews || {};
    var items = Array.isArray(nd.items) ? nd.items.filter(function (it) { return it && it.text; }) : [];
    if (!nd.enabled || !items.length) { sec.style.display = 'none'; sec.setAttribute('hidden', ''); return; }
    sec.style.display = ''; sec.removeAttribute('hidden');
    var row = sec.querySelector('.news-row');
    if (!row) return;
    function cls(k) { return k === 'urgent' ? ' urgent' : k === 'success' ? ' success' : ''; }
    function tagOf(it) { return it.tag || (it.kind ? String(it.kind).toUpperCase() : 'ข่าว'); }
    var one = items.map(function (it) {
      return '<div class="news-item' + cls(it.kind) + '"><span class="tag">' + esc(tagOf(it)) + '</span><span>' + (it.text || '') + '</span></div>';
    }).join('');
    row.innerHTML = one + one; // duplicate for seamless marquee loop
  }

  /* ---- boot --------------------------------------------------------------- */
  function boot() {
    var cfg = get();
    applyNav(cfg);
    applyOrder(cfg);
    applyLanding(cfg);
    applyStory(cfg);
    applyCourses(cfg);
    applyDashNews(cfg);
    if (isEditablePage() && editFlag()) bootEditor();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.MingSite = {
    get: get, save: save, reset: reset,
    applyNav: applyNav, applyLanding: applyLanding, applyCourses: applyCourses, applyOrder: applyOrder, applyDashNews: applyDashNews,
    normalizeOrder: normalizeOrder, normalizeNavOrder: normalizeNavOrder, normalizeAboutOrder: normalizeAboutOrder, clipFor: clipFor, applyStory: applyStory,
    gagLines: function () { var c = get(); return (Array.isArray(c.gag) && c.gag.length) ? c.gag.slice() : GAG_DEFAULT.slice(); },
    openEditor: openEditor, closeEditor: closeEditor,
    NAV_ITEMS: NAV_ITEMS, SECTIONS: SECTIONS, ABOUT_SECTIONS: ABOUT_SECTIONS, ABOUT_CLIPS: ABOUT_CLIPS, STORY_DEFAULT: STORY_DEFAULT, GAG_DEFAULT: GAG_DEFAULT, DASH_NEWS_DEFAULT: DASH_NEWS_DEFAULT, COURSE_LANES: COURSE_LANES
  };
})(window);
