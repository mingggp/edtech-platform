/* ===================================================================
   Learn.html — premium player + auto-completion + quiz + comments
   =================================================================== */
(function () {
  "use strict";

  /* ============== THEME (keep subject accent; toggle light/dark surface) ============== */
  var root = document.documentElement;
  var btnDark = document.getElementById('btn-dark');
  var btnLight = document.getElementById('btn-light');
  function setTheme(t, persist) {
    root.setAttribute('data-theme', t);
    btnDark.setAttribute('aria-pressed', t === 'dark');
    btnLight.setAttribute('aria-pressed', t === 'light');
    if (persist === false) return;
    try { localStorage.setItem('ming-theme', t); } catch (e) {}
  }
  btnDark.addEventListener('click', function () { setTheme('dark'); });
  btnLight.addEventListener('click', function () { setTheme('light'); });
  try {
    var sv = localStorage.getItem('ming-theme') || 'petronas-light';
    setTheme((sv === 'petronas' || sv === 'classic-dark' || sv === 'dark') ? 'dark' : 'light', false);
  } catch (e) {}

  /* ============== SUBJECT ACCENT (optional ?subj= override) ============== */
  var SUBJ = {
    math:  { c: 'var(--subj-math)',  fg: 'var(--subj-math-fg)',  grad: 'var(--subj-math-grad)' },
    phys:  { c: 'var(--subj-phys)',  fg: 'var(--subj-phys-fg)',  grad: 'var(--subj-phys-grad)' },
    tpat3: { c: 'var(--subj-tpat)',  fg: 'var(--subj-tpat-fg)',  grad: 'var(--subj-tpat-grad)' },
    tgat2: { c: 'var(--subj-tgat)',  fg: 'var(--subj-tgat-fg)',  grad: 'var(--subj-tgat-grad)' }
  };
  try {
    var qs = new URLSearchParams(location.search).get('subj');
    if (qs && SUBJ[qs]) {
      root.style.setProperty('--accent', SUBJ[qs].c);
      root.style.setProperty('--accent-fg', SUBJ[qs].fg);
      root.style.setProperty('--accent-grad', SUBJ[qs].grad);
    }
  } catch (e) {}

  /* ============== SIDEBAR ============== */
  var app = document.querySelector('.app');
  document.getElementById('toggle-sidebar').addEventListener('click', function () {
    app.classList.toggle('sidebar-collapsed');
  });

  /* ============== PLAYER ENGINE (mock media clock) ============== */
  var DURATION = 38 * 60 + 12;       // 2292s
  var state = { t: 10 * 60 + 54, playing: false, rate: 1, vol: 1, muted: false, boost: false, prevRate: 1, completed: false };

  var player = document.getElementById('player');
  var stage = document.getElementById('stage');
  var ctrl = document.getElementById('ctrl');
  var filled = document.getElementById('filled');
  var buffered = document.getElementById('buffered');
  var knob = document.getElementById('knob');
  var scrub = document.getElementById('scrub');
  var curTimeEl = document.getElementById('cur-time');
  var playIco = document.getElementById('play-ico');
  var bigPlay = document.getElementById('big-play');
  var boostChip = document.getElementById('boost-chip');
  var rateBtn = document.getElementById('rate-btn');
  var liveDot = stage.querySelector('.live-dot');
  document.getElementById('dur-time').textContent = fmt(DURATION);

  function fmt(s) {
    s = Math.max(0, Math.floor(s));
    var m = Math.floor(s / 60), ss = s % 60;
    return m + ':' + (ss < 10 ? '0' : '') + ss;
  }
  var PLAY_SVG = '<path d="M8 5v14l11-7L8 5z"/>';
  var PAUSE_SVG = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';

  function render() {
    var pct = state.t / DURATION * 100;
    filled.style.width = pct + '%';
    knob.style.left = pct + '%';
    buffered.style.width = Math.min(100, pct + 12) + '%';
    curTimeEl.textContent = fmt(state.t);
    playIco.innerHTML = state.playing ? PAUSE_SVG : PLAY_SVG;
    player.classList.toggle('playing', state.playing);
    if (liveDot) liveDot.textContent = 'power rule · นาที ' + fmt(state.t);
    updateWatch();
  }

  /* completion: backend-style — counted done at >=90% watched */
  var watchPctEl = document.getElementById('watch-pct');
  var watchState = document.getElementById('watch-state');
  var wsRing = document.getElementById('ws-ring');
  var watchLabel = document.getElementById('watch-label');
  function updateWatch() {
    var p = Math.round(state.t / DURATION * 100);
    if (watchPctEl) watchPctEl.textContent = p + '%';
    if (wsRing) wsRing.style.background = 'conic-gradient(var(--accent) 0deg ' + (p / 100 * 360) + 'deg, var(--bg-3) ' + (p / 100 * 360) + 'deg)';
    if (p >= 90 && !state.completed) markLessonComplete();
  }

  function markLessonComplete() {
    state.completed = true;
    watchState.classList.add('done');
    watchLabel.innerHTML = '<b>เรียนจบบทนี้แล้ว</b> · ระบบบันทึกอัตโนมัติ';
    // active lesson → done
    var al = document.getElementById('active-lesson');
    if (al) {
      al.classList.remove('active'); al.classList.add('done');
      al.querySelector('.ico').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    }
    // progress 9 → 10 of 24
    var done = 10, total = 24, pct = Math.round(done / total * 100);
    document.getElementById('sb-bar').style.width = pct + '%';
    document.getElementById('sb-pct').textContent = pct + '%';
    document.getElementById('sb-done').textContent = done;
    document.getElementById('hdr-pct').textContent = pct + '%';
    document.getElementById('hdr-done').textContent = done;
    document.getElementById('hdr-ring').style.background = 'conic-gradient(var(--accent) 0deg ' + (pct / 100 * 360) + 'deg, var(--bg-3) ' + (pct / 100 * 360) + 'deg)';
    toast('นับว่าเรียนจบบทนี้แล้ว · +1 บทเรียน');
    revealQuiz(true);
  }

  /* rAF loop */
  var last = null;
  function loop(ts) {
    if (last == null) last = ts;
    var dt = (ts - last) / 1000; last = ts;
    if (state.playing) {
      state.t += dt * state.rate;
      if (state.t >= DURATION) { state.t = DURATION; state.playing = false; }
      render();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function play() { if (state.t >= DURATION) state.t = 0; state.playing = true; render(); }
  function pause() { state.playing = false; render(); }
  function toggle() { state.playing ? pause() : play(); }
  function seek(d) { state.t = Math.max(0, Math.min(DURATION, state.t + d)); render(); }

  document.getElementById('play-btn').addEventListener('click', toggle);
  bigPlay.addEventListener('click', function (e) { e.stopPropagation(); play(); });
  document.getElementById('back10').addEventListener('click', function () { seek(-10); flashRipple('left'); });
  document.getElementById('fwd10').addEventListener('click', function () { seek(10); flashRipple('right'); });

  /* scrub seek + drag */
  function scrubTo(clientX) {
    var r = scrub.getBoundingClientRect();
    var p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    state.t = p * DURATION; render();
  }
  var scrubbing = false;
  scrub.addEventListener('mousedown', function (e) { scrubbing = true; scrubTo(e.clientX); });
  window.addEventListener('mousemove', function (e) { if (scrubbing) scrubTo(e.clientX); });
  window.addEventListener('mouseup', function () { scrubbing = false; });

  /* stage click (play/pause) vs dblclick (seek / fullscreen) */
  var clickTimer = null;
  stage.addEventListener('click', function () {
    if (clickTimer) return;
    clickTimer = setTimeout(function () { clickTimer = null; toggle(); }, 230);
  });
  stage.addEventListener('dblclick', function (e) {
    clearTimeout(clickTimer); clickTimer = null;
    var r = stage.getBoundingClientRect();
    var x = e.clientX - r.left;
    if (x < r.width * 0.4) { seek(-10); flashRipple('left'); }
    else if (x > r.width * 0.6) { seek(10); flashRipple('right'); }
    else toggleFullscreen();
  });
  function flashRipple(side) {
    var el = document.getElementById('ripple-' + side);
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }

  /* idle controls auto-hide */
  var idleTimer;
  function poke() {
    player.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { if (state.playing) player.classList.add('idle'); }, 2600);
  }
  player.addEventListener('mousemove', poke);
  player.addEventListener('mouseleave', function () { if (state.playing) player.classList.add('idle'); });

  /* ============== SPEED ============== */
  var presets = document.getElementById('speed-presets');
  var speedRange = document.getElementById('speed-range');
  var speedVal = document.getElementById('speed-val');
  var popRate = document.getElementById('pop-rate');
  function setRate(r, fromSlider) {
    r = Math.max(0.25, Math.min(3, r));
    state.rate = r;
    var label = (Number.isInteger(r) ? r : r) + '×';
    rateBtn.textContent = label;
    popRate.textContent = label;
    speedVal.textContent = r.toFixed(2) + '×';
    if (!fromSlider) speedRange.value = r;
    presets.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('on', parseFloat(b.dataset.r) === r);
    });
  }
  presets.querySelectorAll('button').forEach(function (b) {
    b.addEventListener('click', function () { setRate(parseFloat(b.dataset.r)); });
  });
  speedRange.addEventListener('input', function () { setRate(parseFloat(speedRange.value), true); });
  rateBtn.addEventListener('click', function (e) { e.stopPropagation(); togglePop(); });

  /* ============== QUALITY ============== */
  document.getElementById('q-list').querySelectorAll('.q-opt').forEach(function (o) {
    o.addEventListener('click', function () {
      document.getElementById('q-list').querySelectorAll('.q-opt').forEach(function (x) { x.classList.remove('on'); });
      o.classList.add('on');
      document.getElementById('q-badge').textContent = o.dataset.q;
    });
  });

  /* settings popover */
  var pop = document.getElementById('settings-pop');
  function togglePop() { pop.classList.toggle('open'); }
  document.getElementById('gear-btn').addEventListener('click', function (e) { e.stopPropagation(); togglePop(); });
  document.addEventListener('click', function (e) {
    if (pop.classList.contains('open') && !pop.contains(e.target) && e.target.id !== 'gear-btn' && e.target.id !== 'rate-btn') pop.classList.remove('open');
  });

  /* ============== VOLUME ============== */
  var volRange = document.getElementById('vol-range');
  var volIco = document.getElementById('vol-ico');
  var VOL_ON = '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>';
  var VOL_MUTE = '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m23 9-6 6M17 9l6 6"/>';
  function applyVol() {
    volIco.innerHTML = (state.muted || state.vol === 0) ? VOL_MUTE : VOL_ON;
    volRange.value = state.muted ? 0 : state.vol;
  }
  volRange.addEventListener('input', function () { state.vol = parseFloat(volRange.value); state.muted = state.vol === 0; applyVol(); });
  document.getElementById('mute-btn').addEventListener('click', function () { state.muted = !state.muted; applyVol(); });

  /* captions */
  var cap = document.getElementById('caption');
  var ccBtn = document.getElementById('cc-btn');
  var capOn = false;
  ccBtn.addEventListener('click', function () {
    capOn = !capOn;
    ccBtn.style.color = capOn ? '#fff' : '';
    ccBtn.style.background = capOn ? 'oklch(0.99 0.005 285 / 0.2)' : '';
    cap.hidden = !capOn;
    cap.textContent = 'ดึงเลขชี้กำลังลงมาคูณ แล้วลดกำลังลงหนึ่ง — นี่คือหัวใจของ power rule';
  });

  /* fullscreen */
  var fsBtn = document.getElementById('fs-btn');
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      (player.requestFullscreen || player.webkitRequestFullscreen || function () {}).call(player);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
    }
  }
  fsBtn.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', function () {
    player.classList.toggle('fs-active', !!document.fullscreenElement);
  });

  /* ============== KEYBOARD ============== */
  var holdTimer = null;
  function isTyping(el) {
    return el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable);
  }
  document.addEventListener('keydown', function (e) {
    if (isTyping(document.activeElement)) return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (e.repeat) return;
      if (holdTimer == null) {
        holdTimer = setTimeout(function () {
          // hold → 2x boost
          state.boost = true;
          state.prevRate = state.rate;
          if (!state.playing) play();
          setRate(2);
          boostChip.classList.add('show');
        }, 240);
      }
    } else if (e.code === 'ArrowLeft') { e.preventDefault(); seek(-10); flashRipple('left'); }
    else if (e.code === 'ArrowRight') { e.preventDefault(); seek(10); flashRipple('right'); }
    else if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); }
    else if (e.key === 'm' || e.key === 'M') { state.muted = !state.muted; applyVol(); }
  });
  document.addEventListener('keyup', function (e) {
    if (e.code !== 'Space') return;
    if (isTyping(document.activeElement)) return;
    clearTimeout(holdTimer); holdTimer = null;
    if (state.boost) {
      state.boost = false;
      setRate(state.prevRate);
      boostChip.classList.remove('show');
    } else {
      toggle(); // short tap
    }
  });

  /* ============== TOAST ============== */
  var toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.style.cssText = 'position:fixed;left:50%;bottom:32px;transform:translateX(-50%) translateY(20px);z-index:9999;background:var(--accent-grad);color:#fff;font-family:"IBM Plex Sans Thai",sans-serif;font-size:14px;font-weight:600;padding:12px 20px;border-radius:99px;box-shadow:0 16px 40px -10px oklch(0 0 0 / 0.5);opacity:0;transition:opacity .3s,transform .3s;display:flex;align-items:center;gap:8px;';
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' + msg;
    requestAnimationFrame(function () { toastEl.style.opacity = '1'; toastEl.style.transform = 'translateX(-50%) translateY(0)'; });
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.style.opacity = '0'; toastEl.style.transform = 'translateX(-50%) translateY(20px)'; }, 2600);
  }

  setRate(1); applyVol(); render();

  /* ============== QUIZ ============== */
  var quiz = document.getElementById('quiz');
  var qsDone = document.getElementById('qs-done');
  var answered = 0;
  var quizRevealed = false;
  function revealQuiz(scroll) {
    if (!quizRevealed) { quiz.classList.add('revealed'); quizRevealed = true; }
    if (scroll) setTimeout(function () { quiz.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 400);
  }
  // reveal on scroll-into-view as fallback
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { revealQuiz(false); io.disconnect(); } });
    }, { threshold: 0.3 });
    io.observe(quiz);
  } else { revealQuiz(false); }

  quiz.querySelectorAll('.quiz-q').forEach(function (q) {
    var ans = q.dataset.answer;
    var choices = q.querySelectorAll('.choice');
    var explain = q.querySelector('.explain');
    choices.forEach(function (c) {
      c.addEventListener('click', function () {
        if (q.classList.contains('answered')) return;
        q.classList.add('answered');
        var k = c.dataset.k;
        choices.forEach(function (cc) {
          cc.disabled = true;
          if (cc.dataset.k === ans) cc.classList.add('correct');
        });
        if (k !== ans) c.classList.add('wrong');
        explain.classList.add('show');
        answered++;
        qsDone.textContent = answered;
        if (answered === 2) {
          var allRight = quiz.querySelectorAll('.choice.wrong').length === 0;
          toast(allRight ? 'เก่งมาก! ตอบถูกทั้ง 2 ข้อ 🎉' : 'ทำครบแล้ว · ดูเฉลยด้านล่างได้เลย');
        }
      });
    });
  });

  /* ============== DOC PREVIEW ============== */
  document.getElementById('preview-doc').addEventListener('click', function () { openDocPreview(); });
  document.getElementById('dl-doc').addEventListener('click', function (e) {
    e.preventDefault(); toast('กำลังดาวน์โหลดเอกสาร · สรุปบท 2.3');
  });
  function openDocPreview() {
    var bd = document.createElement('div');
    bd.style.cssText = 'position:fixed;inset:0;z-index:200;background:oklch(from var(--bg-0) l c h / 0.6);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:32px;opacity:0;transition:opacity .2s';
    bd.innerHTML =
      '<div style="background:var(--bg-1);border:1px solid var(--glass-line-strong);border-radius:18px;width:min(640px,96vw);max-height:86vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 40px 100px -24px oklch(0 0 0 / 0.7);transform:scale(0.96);transition:transform .22s">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--line-soft)">' +
          '<div style="font-family:Bricolage Grotesque;font-weight:700;font-size:16px;color:var(--fg-0)">สรุปบท 2.3 · Power Rule <span style="font-family:JetBrains Mono;font-size:11px;color:var(--fg-3);font-weight:500">PDF · 6 หน้า</span></div>' +
          '<button id="dpv-x" style="width:32px;height:32px;border-radius:9px;border:1px solid var(--line);background:var(--bg-2);color:var(--fg-1);cursor:pointer;display:flex;align-items:center;justify-content:center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
        '</div>' +
        '<div style="flex:1;overflow-y:auto;padding:24px;background:var(--bg-0)">' +
          '<div style="background:#fff;border-radius:8px;padding:40px 44px;box-shadow:0 10px 30px -10px oklch(0 0 0 / 0.4);color:#1a1a2e;font-family:IBM Plex Sans Thai,sans-serif;line-height:1.7">' +
            '<div style="font-family:Bricolage Grotesque;font-weight:800;font-size:24px;letter-spacing:-0.02em;color:#10101e">Power Rule — กฎเลขชี้กำลัง</div>' +
            '<div style="font-family:JetBrains Mono;font-size:11px;letter-spacing:0.1em;color:#7a7a8a;margin:6px 0 22px;text-transform:uppercase">mingsmileyface · คณิต A-Level · บท 2.3</div>' +
            '<div style="font-size:15px;font-weight:700;color:#10101e;margin-bottom:6px">1 · สูตรหลัก</div>' +
            '<div style="background:#f3f3fb;border-radius:8px;padding:14px 18px;font-size:20px;font-family:Bricolage Grotesque;font-weight:700;color:#2a2a4a;text-align:center;margin-bottom:18px">d/dx · xⁿ = n · xⁿ⁻¹</div>' +
            '<div style="font-size:15px;font-weight:700;color:#10101e;margin-bottom:6px">2 · ขั้นตอน</div>' +
            '<div style="color:#3a3a52;margin-bottom:18px">① ดึงเลขชี้กำลังลงมาคูณข้างหน้า&nbsp;&nbsp;② ลดเลขชี้กำลังลง 1&nbsp;&nbsp;③ คูณกับสัมประสิทธิ์เดิม</div>' +
            '<div style="font-size:15px;font-weight:700;color:#10101e;margin-bottom:6px">3 · ตัวอย่าง</div>' +
            '<div style="color:#3a3a52">• d/dx · 3x⁵ = 15x⁴<br>• d/dx · x = 1<br>• d/dx · 7 = 0 (ค่าคงที่)</div>' +
            '<div style="margin-top:24px;height:1px;background:#e8e8f2"></div>' +
            '<div style="color:#9a9aac;font-size:12px;margin-top:14px;text-align:center">— ดูตัวอย่างหน้า 1 จาก 6 · โหลดไฟล์เต็มเพื่ออ่านต่อ —</div>' +
          '</div>' +
        '</div>' +
        '<div style="padding:14px 20px;border-top:1px solid var(--line-soft);display:flex;gap:10px;justify-content:flex-end">' +
          '<button id="dpv-dl" class="btn btn-primary btn-sm">โหลดไฟล์เต็ม (PDF)</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bd);
    requestAnimationFrame(function () { bd.style.opacity = '1'; bd.querySelector('div').style.transform = 'scale(1)'; });
    function close() { bd.style.opacity = '0'; setTimeout(function () { bd.remove(); }, 200); }
    bd.addEventListener('click', function (e) { if (e.target === bd) close(); });
    bd.querySelector('#dpv-x').addEventListener('click', close);
    bd.querySelector('#dpv-dl').addEventListener('click', function () { close(); toast('กำลังดาวน์โหลดเอกสาร · สรุปบท 2.3'); });
  }

  /* ============== RATING ============== */
  var myStars = document.getElementById('my-stars');
  var rateLbl = document.getElementById('rate-lbl');
  var starBtns = Array.prototype.slice.call(myStars.querySelectorAll('button'));
  var myRating = 0;
  function paintStars(n) { starBtns.forEach(function (b, i) { b.classList.toggle('lit', i < n); }); }
  starBtns.forEach(function (b, i) {
    b.addEventListener('mouseenter', function () { paintStars(i + 1); });
    b.addEventListener('click', function () {
      myRating = i + 1; paintStars(myRating); myStars.classList.add('set');
      rateLbl.textContent = 'ให้ ' + myRating + ' ดาวแล้ว · ขอบคุณ!';
    });
  });
  myStars.addEventListener('mouseleave', function () { paintStars(myRating); });

  /* ============== COMMENTS ============== */
  var GIFS = [
    { lab: 'เก่งมาก!', grad: 'linear-gradient(135deg, oklch(0.6 0.2 145), oklch(0.75 0.18 130))' },
    { lab: 'ทึ่งสุดๆ', grad: 'linear-gradient(135deg, oklch(0.55 0.24 305), oklch(0.65 0.24 5))' },
    { lab: 'เข้าใจแล้ว!', grad: 'linear-gradient(135deg, oklch(0.6 0.2 255), oklch(0.7 0.16 215))' },
    { lab: 'สู้ๆ', grad: 'linear-gradient(135deg, oklch(0.7 0.18 60), oklch(0.8 0.17 95))' },
    { lab: 'ขอบคุณครับ', grad: 'linear-gradient(135deg, oklch(0.6 0.22 18), oklch(0.7 0.2 35))' },
    { lab: 'ว้าวว', grad: 'linear-gradient(135deg, oklch(0.55 0.2 200), oklch(0.68 0.22 285))' }
  ];
  var COMMENTS = [
    { ini: 'นก', av: 'linear-gradient(135deg,oklch(0.74 0.21 35),oklch(0.86 0.20 130))', nm: 'น้องนก', inst: false, stars: 5, tm: '2 ชม.', text: 'พี่หมิงอธิบายที่มาของสูตรดีมากกก เห็นภาพเลยว่าทำไมต้องลดกำลังลง 1 🔥', likes: 12, liked: false },
    { ini: 'หม', av: 'var(--accent-grad)', nm: 'พี่หมิง', inst: true, stars: 0, tm: '1 ชม.', text: 'ดีใจที่ชอบกันนะ 🙏 ใครงงตรง first principle ลองดูซ้ำนาที 6:40 อีกรอบ แล้วมาถามได้เลย', likes: 8, liked: false },
    { ini: 'ตน', av: 'linear-gradient(135deg,oklch(0.80 0.16 205),oklch(0.55 0.22 295))', nm: 'น้องตูน', inst: false, stars: 5, tm: 'เมื่อวาน', text: 'ทำโจทย์ท้ายคลิปได้ทั้ง 2 ข้อแล้ว!', gif: { lab: 'เก่งมาก!', grad: 'linear-gradient(135deg, oklch(0.6 0.2 145), oklch(0.75 0.18 130))' }, likes: 5, liked: false }
  ];
  var STAR = '<svg viewBox="0 0 24 24"><path d="m12 2 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>';
  var cmtList = document.getElementById('cmt-list');
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function starsMini(n) {
    if (!n) return '';
    var s = ''; for (var i = 0; i < n; i++) s += STAR;
    return '<span class="stars-mini">' + s + '</span>';
  }
  function gifHTML(g) {
    if (!g) return '';
    return '<div class="cgif" style="background:' + g.grad + '"><div class="gshim"></div><span class="lab">' + esc(g.lab) + '</span><span class="bdg">GIF</span></div>';
  }
  function render_comments() {
    cmtList.innerHTML = COMMENTS.map(function (c, idx) {
      return '<div class="cmt">' +
        '<div class="av" style="background:' + c.av + '">' + c.ini + '</div>' +
        '<div class="cbody">' +
          '<div class="crow"><span class="nm">' + c.nm + '</span>' + (c.inst ? '<span class="badge-inst">พี่หมิง</span>' : '') + starsMini(c.stars) + '<span class="tm">' + c.tm + '</span></div>' +
          '<div class="ctext">' + esc(c.text) + '</div>' +
          gifHTML(c.gif) +
          '<div class="cact">' +
            '<button class="like' + (c.liked ? ' liked' : '') + '" data-i="' + idx + '"><svg viewBox="0 0 24 24" fill="' + (c.liked ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M7 11.5V21h13l1.5-9.5h-7L16 5a3 3 0 0 0-3-3l-3 9.5z"/></svg> ' + c.likes + '</button>' +
            '<button><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 17l-5-5 5-5M4 12h11a4 4 0 0 1 4 4v1"/></svg> ตอบกลับ</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    cmtList.querySelectorAll('.like').forEach(function (b) {
      b.addEventListener('click', function () {
        var c = COMMENTS[+b.dataset.i];
        c.liked = !c.liked; c.likes += c.liked ? 1 : -1;
        render_comments();
      });
    });
    document.getElementById('cmt-count').textContent = COMMENTS.length;
  }
  render_comments();

  /* composer: auto-grow */
  var input = document.getElementById('cmt-input');
  input.addEventListener('input', function () { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 160) + 'px'; });

  /* emoji picker */
  var EMOJI = ['😀','😂','🥹','😎','🤩','😭','🔥','👍','🙏','💯','🎉','🧠','✅','❓','😱','👏','💪','✨','📚','⚡','🤔','😅','🥳','❤️'];
  var emojiGrid = document.getElementById('emoji-grid');
  emojiGrid.innerHTML = EMOJI.map(function (e) { return '<button type="button">' + e + '</button>'; }).join('');
  var emojiPicker = document.getElementById('emoji-picker');
  var gifPicker = document.getElementById('gif-picker');
  document.getElementById('emoji-btn').addEventListener('click', function (e) { e.stopPropagation(); gifPicker.classList.remove('open'); emojiPicker.classList.toggle('open'); });
  emojiGrid.querySelectorAll('button').forEach(function (b) {
    b.addEventListener('click', function () {
      input.value += b.textContent; input.focus();
      input.dispatchEvent(new Event('input'));
    });
  });

  /* gif picker */
  var gifGrid = document.getElementById('gif-grid');
  gifGrid.innerHTML = GIFS.map(function (g, i) {
    return '<div class="gt" data-i="' + i + '" style="background:' + g.grad + '"><div class="gshim"></div><span class="lab">' + g.lab + '</span><span class="bdg">GIF</span></div>';
  }).join('');
  var pendingGif = null;
  var gifPending = document.getElementById('gif-pending');
  document.getElementById('gif-btn').addEventListener('click', function (e) { e.stopPropagation(); emojiPicker.classList.remove('open'); gifPicker.classList.toggle('open'); });
  gifGrid.querySelectorAll('.gt').forEach(function (t) {
    t.addEventListener('click', function () {
      pendingGif = GIFS[+t.dataset.i];
      gifPending.classList.add('show');
      document.getElementById('gif-pending-thumb').style.background = pendingGif.grad;
      document.getElementById('gif-pending-nm').textContent = pendingGif.lab + ' · GIF';
      gifPicker.classList.remove('open');
    });
  });
  document.getElementById('gif-pending-rm').addEventListener('click', function () { pendingGif = null; gifPending.classList.remove('show'); });
  document.addEventListener('click', function (e) {
    if (!emojiPicker.contains(e.target) && e.target.id !== 'emoji-btn') emojiPicker.classList.remove('open');
    if (!gifPicker.contains(e.target) && e.target.id !== 'gif-btn') gifPicker.classList.remove('open');
  });

  /* post comment */
  document.getElementById('cmt-send').addEventListener('click', function () {
    var txt = input.value.trim();
    if (!txt && !pendingGif) { input.focus(); return; }
    COMMENTS.unshift({ ini: 'ปม', av: 'var(--grad-cool)', nm: 'น้องปาล์ม', inst: false, stars: myRating, tm: 'เมื่อกี้', text: txt, gif: pendingGif, likes: 0, liked: false });
    input.value = ''; input.style.height = 'auto';
    pendingGif = null; gifPending.classList.remove('show');
    render_comments();
    cmtList.firstChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* prev/next */
  document.getElementById('next-lesson').addEventListener('click', function () { toast('ไปบทถัดไป · 2.4 Product rule'); });
  document.getElementById('prev-lesson').addEventListener('click', function () { toast('กลับบทก่อนหน้า · 2.2'); });

})();
