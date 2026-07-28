/* ==========================================================================
   Mingsmileyface · Shared profile peek logic
   Requires people.js. Auto-binds [data-peek="<id>"]; optional data-rank /
   data-period on the trigger refine the stats shown. Exposes MingPeek.open.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.MingPeople) { console.warn("peek.js: MingPeople missing"); return; }

  var PERIOD_LABEL = { week: "เรียนสัปดาห์นี้", month: "เรียนเดือนนี้", all: "เรียนสะสมทั้งหมด" };
  function fmt(n) { return (n || 0).toLocaleString("en-US"); }

  /* ---- build DOM once --------------------------------------------------- */
  var catcher = document.createElement("div");
  catcher.className = "peek-catcher";
  var peek = document.createElement("div");
  peek.className = "peek";
  peek.innerHTML =
    '<div class="peek-hero">' +
      '<button class="pk-close" aria-label="ปิด"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '<div class="pk-av" id="pk-av"></div>' +
      '<div class="pk-id"><b id="pk-name"></b><div class="meta"><span class="chip" id="pk-grade"></span><span class="chip" id="pk-rank"></span></div></div>' +
    '</div>' +
    '<div class="peek-body">' +
      '<div class="peek-selfnote"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M1 1l22 22"/></svg> นี่คือมุมมองของคุณ — คุณกำลังซ่อนตัวเองจากสาธารณะอยู่</div>' +
      '<div class="pk-status" id="pk-status"><span class="dot"></span><span id="pk-status-txt"></span></div>' +
      '<div class="pk-stats">' +
        '<div class="pk-stat" style="--pk-c:var(--brand-cyan)"><div class="v" id="pk-min">0<span class="u">นาที</span></div><div class="l"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> <span id="pk-min-l">เรียนสัปดาห์นี้</span></div></div>' +
        '<div class="pk-stat" style="--pk-c:var(--brand-coral)"><div class="v" id="pk-streak">0<span class="u">วัน</span></div><div class="l"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1.2 4.2 5 5.2 5 10a5 5 0 1 1-10 0c0-3.2 2-4.2 2-7.2 0 2.2 1.1 3.2 3 3.2-1.1-2.2-1.1-4.2 0-6z"/></svg> สตรีค</div></div>' +
        '<div class="pk-stat" style="--pk-c:var(--brand-violet)"><div class="v" id="pk-lv">Lv 0</div><div class="l"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> เลเวล</div></div>' +
        '<div class="pk-stat" style="--pk-c:oklch(0.84 0.16 86)"><div class="v" id="pk-badges">0</div><div class="l"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/></svg> เหรียญ</div></div>' +
      '</div>' +
      '<div class="pk-subj"><span class="lab">เรียนเยอะสุด</span><span class="val" id="pk-subj"></span></div>' +
      '<div class="pk-foot"><a class="btn btn-secondary btn-sm" id="pk-msg" href="#">ทักทาย</a><a class="btn btn-primary btn-sm" id="pk-full" href="#">ดูโปรไฟล์เต็ม</a></div>' +
    '</div>' +
    '<div class="peek-private">' +
      '<div class="lk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></div>' +
      '<span class="tag">โปรไฟล์ส่วนตัว</span>' +
      '<h4 id="pk-priv-name">ผู้ใช้นี้ปิดการมองเห็น</h4>' +
      '<p>นักเรียนคนนี้เลือกซ่อนรายละเอียดการเรียนจากสาธารณะ — เห็นได้แค่ชื่อและอันดับเท่านั้น</p>' +
    '</div>';

  function mount() {
    if (catcher.parentNode) return;
    document.body.appendChild(catcher);
    document.body.appendChild(peek);
    peek.querySelector(".pk-close").addEventListener("click", close);
    catcher.addEventListener("click", close);
  }

  var E = {};
  ["pk-av", "pk-name", "pk-grade", "pk-rank", "pk-status", "pk-status-txt", "pk-min", "pk-min-l", "pk-streak", "pk-lv", "pk-badges", "pk-subj", "pk-priv-name", "pk-msg", "pk-full"].forEach(function (id) { E[id] = function () { return peek.querySelector("#" + id); }; });

  function place(rect) {
    var w = peek.offsetWidth, h = peek.offsetHeight, pad = 14, vw = innerWidth, vh = innerHeight;
    var left = rect.right + 12;
    if (left + w > vw - pad) left = rect.left - w - 12;
    if (left < pad) left = Math.max(pad, (vw - w) / 2);
    var top = rect.top + rect.height / 2 - h / 2;
    if (top < pad) top = pad;
    if (top + h > vh - pad) top = vh - h - pad;
    peek.style.left = left + "px";
    peek.style.top = top + "px";
  }

  function open(id, anchorEl, ctx) {
    var p = window.MingPeople.get(id); if (!p) return;
    ctx = ctx || {};
    mount();
    var period = ctx.period || "week";
    var rank = ctx.rank != null ? ctx.rank : (period === "week" ? p.rankWeek : null);
    var minutes = p[period] != null ? p[period] : p.week;
    var meHidden = !!(p.me && document.body.classList.contains("priv-on"));
    var locked = !!(p.priv && !p.me);

    peek.classList.toggle("is-private", locked);
    peek.classList.toggle("show-selfnote", meHidden);

    // hero
    E["pk-av"]().textContent = p.ini;
    E["pk-name"]().textContent = p.name + (p.me ? " (คุณ)" : "");
    E["pk-grade"]().textContent = p.gradeLabel;
    var rk = E["pk-rank"]();
    if (rank != null) { rk.textContent = "อันดับ #" + rank; rk.classList.remove("empty"); }
    else { rk.textContent = ""; rk.classList.add("empty"); }
    peek.style.setProperty("--peek-grad", p.me ? "var(--grad-signature)" : p.avBg);
    E["pk-priv-name"]().textContent = p.name + " ปิดการมองเห็น";

    // status (friends only)
    var st = E["pk-status"]();
    if (p.status && !p.me) { E["pk-status-txt"]().textContent = p.status; st.classList.remove("empty"); }
    else { st.classList.add("empty"); }

    // body stats
    E["pk-min"]().innerHTML = fmt(minutes) + '<span class="u">นาที</span>';
    E["pk-min-l"]().textContent = PERIOD_LABEL[period] || PERIOD_LABEL.week;
    E["pk-streak"]().innerHTML = (p.streak || 0) + '<span class="u">วัน</span>';
    E["pk-lv"]().textContent = "Lv " + p.lv;
    E["pk-badges"]().textContent = p.badges;
    E["pk-subj"]().textContent = p.subj;

    // footer links to THIS person
    var msg = E["pk-msg"](), full = E["pk-full"]();
    msg.style.display = p.me ? "none" : "";
    msg.href = "#chat-" + p.id;
    full.href = p.me ? "Public Profile.html?me=1" : ("Public Profile.html?u=" + encodeURIComponent(p.id));
    full.textContent = p.me ? "ดูโปรไฟล์ของฉัน" : "ดูโปรไฟล์เต็ม";

    // show + place
    catcher.classList.add("open");
    peek.classList.add("open");
    place(anchorEl.getBoundingClientRect());
  }
  function close() { peek.classList.remove("open"); catcher.classList.remove("open"); }

  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  window.addEventListener("resize", close);

  // auto-bind any [data-peek] click (refined by optional data-rank/data-period)
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-peek]"); if (!t) return;
    // let a genuine inner link/button (that isn't the trigger itself) work normally
    var inner = e.target.closest("a[href], button");
    if (inner && inner !== t && !inner.hasAttribute("data-peek")) return;
    e.preventDefault();
    open(t.getAttribute("data-peek"), t, {
      period: t.getAttribute("data-period") || undefined,
      rank: t.hasAttribute("data-rank") ? parseInt(t.getAttribute("data-rank"), 10) : undefined
    });
  });

  window.MingPeek = { open: open, close: close };
})();
