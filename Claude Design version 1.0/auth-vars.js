/* ==========================================================================
   Auth brand-panel · interactive floating variables
   - turns the static .glyph symbols into draggable chips with hover tidbits
   - shared by Login Signup.html + Forgot Reset Password.html
   ========================================================================== */
(function () {
  // pool of variables · constants · equations (สุ่มทุกครั้งที่โหลด)
  var POOL = [
    ['∫', 'อินทิเกรต', 'หาพื้นที่ใต้กราฟ'],
    ['Σ', 'ซิกมา', 'ผลรวมของทุกพจน์'],
    ['π', 'พาย', '≈ 3.14159'],
    ['√', 'สแควร์รูท', 'รากที่สอง'],
    ['Δ', 'เดลตา', 'การเปลี่ยนแปลง'],
    ['∞', 'อินฟินิตี้', 'ค่าอนันต์'],
    ['θ', 'ทีตา', 'มุมในตรีโกณ'],
    ['λ', 'แลมบ์ดา', 'ความยาวคลื่น'],
    ['Ω', 'โอห์ม', 'ความต้านทานไฟฟ้า'],
    ['φ', 'ฟี', 'อัตราส่วนทอง ≈ 1.618'],
    ['ω', 'โอเมกา', 'ความเร็วเชิงมุม'],
    ['μ', 'มิว', 'สัมประสิทธิ์เสียดทาน'],
    ['ρ', 'โร', 'ความหนาแน่น'],
    ['e', 'ออยเลอร์', '≈ 2.71828'],
    ['∴', 'เพราะฉะนั้น', 'ใช้สรุปผลพิสูจน์'],
    ['∂', 'พาเชียล', 'อนุพันธ์ย่อย'],
    ['Σⁿ', 'ผลรวม n พจน์', 'อนุกรมเลขคณิต/เรขาคณิต'],
    ['a²+b²=c²', 'พีทาโกรัส', 'ด้านสามเหลี่ยมมุมฉาก'],
    ['(a+b)²', 'กำลังสองสมบูรณ์', '= a²+2ab+b²'],
    ['y=mx+c', 'สมการเส้นตรง', 'm คือความชัน'],
    ['F=ma', 'กฎข้อ 2 นิวตัน', 'แรง = มวล × ความเร่ง'],
    ['g=9.8', 'ค่า g', 'ความเร่งโน้มถ่วงโลก (m/s²)'],
    ['c=3×10⁸', 'ความเร็วแสง', 'หน่วย m/s'],
    ['v=fλ', 'สมการคลื่น', 'อัตราเร็ว = ความถี่ × ความยาวคลื่น'],
    ['E=mc²', 'ไอน์สไตน์', 'มวลกลายเป็นพลังงานได้'],
    ['W=Fs', 'งาน', 'แรง × ระยะทาง (จูล)'],
    ['P=IV', 'กำลังไฟฟ้า', 'กระแส × ความต่างศักย์ (วัตต์)'],
    ['Ek=½mv²', 'พลังงานจลน์', 'ของวัตถุที่กำลังเคลื่อนที่'],
    ['x²', 'พาราโบลา', 'กราฟฟังก์ชันกำลังสอง'],
    ['sinθ', 'ไซน์', 'ตรงข้าม / ด้านตรงข้ามมุมฉาก'],
    ['logₐx', 'ลอการิทึม', 'ผกผันของเลขยกกำลัง']
  ];

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function init() {
    var panel = document.querySelector('.brand-panel');
    if (!panel) return;
    var glyphs = [].slice.call(panel.querySelectorAll('.glyph'));
    if (!glyphs.length) return;

    // honor the variable-font choice set from the Landing Page tweak (default: friendly)
    var VAR_FONTS = {
      friendly: ['var(--font-display)', 'normal', '700'],
      hand:     ['"Caveat", cursive', 'normal', '700'],
      mono:     ['"JetBrains Mono", monospace', 'normal', '600'],
      latex:    ['"Computer Modern Serif", "Cambria Math", serif', 'italic', '400']
    };
    var vf = 'friendly';
    try { var s = localStorage.getItem('ming-var-font'); if (s && VAR_FONTS[s]) vf = s; } catch (e) {}
    var f = VAR_FONTS[vf];
    var rs = document.documentElement.style;
    rs.setProperty('--var-font', f[0]);
    rs.setProperty('--var-style', f[1]);
    rs.setProperty('--var-weight', f[2]);

    var pool = shuffle(POOL);

    glyphs.forEach(function (el, idx) {
      var v = pool[idx % pool.length];
      var sym = v[0], isFormula = sym.length > 2;
      // shrink formulas so they don't overflow the fixed slot
      var base = parseFloat(getComputedStyle(el).fontSize) || 34;
      var fs = isFormula ? Math.max(16, Math.round(base * 0.5)) : base;
      el.style.fontSize = fs + 'px';
      el.classList.toggle('is-formula', isFormula);

      el.setAttribute('aria-hidden', 'false');
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.innerHTML = '<span class="gsym">' + sym + '</span>' +
        '<i class="gtip"><b>' + v[1] + '</b> · ' + v[2] + '</i>';

      // edge-aware tooltip placement (recomputed on hover)
      function place() {
        var pr = panel.getBoundingClientRect();
        var er = el.getBoundingClientRect();
        el.classList.toggle('tip-below', (er.top - pr.top) < 90);
        el.classList.remove('tip-l', 'tip-r');
        if ((er.left - pr.left) < 130) el.classList.add('tip-l');
        else if ((pr.right - er.right) < 130) el.classList.add('tip-r');
      }
      el.addEventListener('pointerenter', place);
      el.addEventListener('focus', place);

      // drag — uses CSS `translate` so it stacks with the floaty rotate/animation
      var dx = 0, dy = 0, sx = 0, sy = 0, bx = 0, by = 0, dragging = false, moved = false;
      var lim = { x1: -1e4, x2: 1e4, y1: -1e4, y2: 1e4 };
      el.addEventListener('pointerdown', function (e) {
        dragging = true; moved = false;
        sx = e.clientX; sy = e.clientY; bx = dx; by = dy;
        var pr = panel.getBoundingClientRect(), er = el.getBoundingClientRect();
        lim.x1 = bx + (pr.left - er.left);
        lim.x2 = bx + (pr.right - er.right);
        lim.y1 = by + (pr.top - er.top);
        lim.y2 = by + (pr.bottom - er.bottom);
        el.classList.add('dragging');
        if (el.setPointerCapture) { try { el.setPointerCapture(e.pointerId); } catch (err) {} }
        e.preventDefault();
      });
      el.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        if (Math.abs(e.clientX - sx) > 2 || Math.abs(e.clientY - sy) > 2) moved = true;
        dx = Math.max(lim.x1, Math.min(lim.x2, bx + (e.clientX - sx)));
        dy = Math.max(lim.y1, Math.min(lim.y2, by + (e.clientY - sy)));
        el.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px';
      });
      function release() { dragging = false; el.classList.remove('dragging'); }
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
      // keyboard nudge for accessibility
      el.addEventListener('keydown', function (e) {
        var step = e.shiftKey ? 24 : 8, hit = true;
        if (e.key === 'ArrowLeft') dx -= step;
        else if (e.key === 'ArrowRight') dx += step;
        else if (e.key === 'ArrowUp') dy -= step;
        else if (e.key === 'ArrowDown') dy += step;
        else hit = false;
        if (hit) { e.preventDefault(); el.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px'; }
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
