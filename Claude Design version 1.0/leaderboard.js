/* ==========================================================================
   Mingsmileyface · Batch 6 · Cluster C1 — Leaderboard
   ========================================================================== */
(function () {
  "use strict";

  /* ---- theme toggle ----------------------------------------------------- */
  var root = document.documentElement;
  var sv0 = localStorage.getItem("ming-theme") || "petronas-light";
  var saved = sv0 === "dark" ? "petronas" : sv0 === "light" ? "petronas-light" : sv0 === "classic-dark" ? "dark" : sv0 === "classic-light" ? "light" : sv0;
  root.setAttribute("data-theme", saved);
  function syncTheme() {
    var t = root.getAttribute("data-theme");
    var d = document.getElementById("btn-dark"), l = document.getElementById("btn-light");
    if (d) d.setAttribute("aria-pressed", String(t === "petronas" || t === "dark"));
    if (l) l.setAttribute("aria-pressed", String(t === "petronas-light" || t === "light"));
  }
  document.querySelectorAll(".theme-toggle button").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = b.getAttribute("data-set") === "dark" ? "petronas" : "petronas-light";
      root.setAttribute("data-theme", t);
      localStorage.setItem("ming-theme", t);
      syncTheme();
    });
  });
  syncTheme();

  /* ---- sidebar collapse ------------------------------------------------- */
  var app = document.querySelector(".app");
  if (localStorage.getItem("ming-sidebar") === "collapsed") app.classList.add("collapsed");
  var sbToggle = document.getElementById("sb-toggle");
  if (sbToggle) sbToggle.addEventListener("click", function () {
    app.classList.toggle("collapsed");
    localStorage.setItem("ming-sidebar", app.classList.contains("collapsed") ? "collapsed" : "expanded");
  });

  /* ---- roster (shared single source of truth) --------------------------- */
  function avFor(s) { return s.avBg; }

  var STUDENTS = (window.MingPeople ? window.MingPeople.lb() : []);
  STUDENTS.forEach(function (s, i) {
    s.idx = i;
    // derived daily minutes (deterministic per person, ranking differs from week)
    s.day = Math.max(8, Math.round(s.week * (0.08 + ((i * 7 + 3) % 11) / 55)));
  });

  var GRADE_LABEL = { m4: "ม.4", m5: "ม.5", m6: "ม.6" };
  var PERIOD_TITLE = { day: "วันนี้", week: "สัปดาห์นี้", month: "เดือนนี้", all: "ตลอดกาล" };
  var PERIOD_DETAIL = { day: "เรียนวันนี้", week: "เรียนสัปดาห์นี้", month: "เรียนเดือนนี้", all: "เรียนสะสมทั้งหมด" };

  var state = { period: "week", grade: "all" };

  function fmt(n) { return n.toLocaleString("en-US"); }

  function computeBoard(period) {
    var list = STUDENTS.filter(function (s) { return state.grade === "all" || s.grade === state.grade; });
    list = list.slice().sort(function (a, b) { return b[period] - a[period]; });
    var ranks = {};
    list.forEach(function (s, i) { ranks[s.id] = i + 1; });
    return { list: list, ranks: ranks };
  }

  /* ---- count-up with safety landing ------------------------------------- */
  function countUp(el, target, suffix) {
    el.textContent = fmt(target) + (suffix || "");
    var t0 = performance.now(), dur = 800;
    function step(t) {
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * e)) + (suffix || "");
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(target) + (suffix || "");
    }
    requestAnimationFrame(step);
  }

  /* ---- render one podium ------------------------------------------------- */
  function renderPodium(podium, board, period) {
    var top3 = board.list.slice(0, 3);
    var order = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd
    var cls = ["second", "first", "third"];
    podium.innerHTML = "";
    order.forEach(function (s, i) {
      if (!s) return;
      var rk = board.ranks[s.id];
      var el = document.createElement("div");
      el.className = "pod " + cls[i];
      el.style.setProperty("--av-bg", avFor(s));
      el.setAttribute("data-peek", s.id);
      el.setAttribute("data-rank", rk);
      el.setAttribute("data-period", period);
      var crown = rk === 1 ? '<div class="crown"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17h18l-1.5-9-4.5 4-3.5-6-3.5 6L3.5 8z"/></svg></div>' : "";
      el.innerHTML =
        '<div class="pd-top">' + crown + '<div class="av">' + s.ini + '</div><span class="rank">' + rk + '</span></div>' +
        '<div class="nm">' + s.name + '</div>' +
        '<div class="gr">' + GRADE_LABEL[s.grade] + '</div>' +
        '<div class="mins" data-v="' + s[period] + '">' + fmt(s[period]) + '</div>' +
        '<div class="shaft"><i></i></div>';
      podium.appendChild(el);
    });
    // entrance: shaft rise + count-up (safety landed)
    var shafts = podium.querySelectorAll(".shaft > i");
    shafts.forEach(function (sh, i) {
      sh.style.height = "0%";
      requestAnimationFrame(function () { requestAnimationFrame(function () { sh.style.height = "100%"; }); });
    });
    setTimeout(function () { shafts.forEach(function (sh) { sh.style.height = "100%"; }); }, 700);
    podium.querySelectorAll(".mins").forEach(function (m) { countUp(m, +m.getAttribute("data-v")); });
  }

  /* ---- render one rank list ---------------------------------------------- */
  function moveArrow(s, board, period) {
    if (period !== "week") return '<span class="mv same">•</span>';
    var diff = s.prev - board.ranks[s.id];
    if (diff > 0) return '<span class="mv up">▲</span>';
    if (diff < 0) return '<span class="mv down">▼</span>';
    return '<span class="mv same">•</span>';
  }
  function renderList(rankList, board, period) {
    var max = board.list.length ? board.list[0][period] : 1;
    rankList.innerHTML = "";
    board.list.slice(3).forEach(function (s) {
      var el = document.createElement("div");
      el.className = "rank-row" + (s.me ? " me" : "");
      el.style.setProperty("--av-bg", avFor(s));
      el.setAttribute("data-peek", s.id);
      el.setAttribute("data-rank", board.ranks[s.id]);
      el.setAttribute("data-period", period);
      var pct = Math.round(s[period] / max * 100);
      var privEye = (s.priv && !s.me) ? '<span class="priv-eye" title="ปิดการมองเห็นสู่สาธารณะ"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg></span>' : "";
      el.innerHTML =
        '<div class="num">' + board.ranks[s.id] + moveArrow(s, board, period) + '</div>' +
        '<div class="who"><div class="av">' + s.ini + '</div><div class="meta"><b>' + s.name + privEye + '</b><span>' + GRADE_LABEL[s.grade] + '</span></div></div>' +
        '<div class="score"><div class="v">' + fmt(s[period]) + '<span>นาที</span></div></div>' +
        '<div class="bar"><i style="width:' + pct + '%"></i></div>';
      rankList.appendChild(el);
    });
  }

  /* ---- render my-rank (uses right-board period) -------------------------- */
  var mrRank = document.getElementById("mr-rank");
  var mrScore = document.getElementById("mr-score");
  var mrGap = document.getElementById("mr-gap");
  var mrDetail = document.getElementById("mr-detail");
  function renderMyRank(board) {
    var meRow = board.list.filter(function (s) { return s.me; })[0];
    if (!meRow) {
      mrRank.textContent = "—";
      mrScore.innerHTML = "ไม่อยู่ในกลุ่มนี้";
      mrGap.textContent = "เลือก \"ทุกชั้น\" หรือ \"ม.6\" เพื่อดูอันดับคุณ";
      mrDetail.innerHTML = "ม.6 · กรองตามชั้นอื่นอยู่";
      return;
    }
    var rk = board.ranks[meRow.id];
    mrRank.textContent = "#" + rk;
    mrScore.innerHTML = fmt(meRow[state.period]) + '<span> นาที</span>';
    mrDetail.innerHTML = 'ม.6 · ' + PERIOD_DETAIL[state.period] + ' <span class="hl">' + fmt(meRow[state.period]) + ' นาที</span>';
    var above = board.list[rk - 2];
    if (above) {
      var gap = above[state.period] - meRow[state.period];
      mrGap.textContent = "↑ อีก " + fmt(gap) + " นาที แซงอันดับ " + (rk - 1);
      mrGap.style.color = "var(--brand-cyan)";
    } else {
      mrGap.textContent = "🏆 คุณคืออันดับหนึ่ง!";
      mrGap.style.color = "var(--brand-lime)";
    }
  }

  /* ---- full render -------------------------------------------------------- */
  var podDay = document.getElementById("podium-day");
  var rankDay = document.getElementById("rank-day");
  var podPeriod = document.getElementById("podium-period");
  var rankPeriod = document.getElementById("rank-period");

  function renderDay() {
    var b = computeBoard("day");
    renderPodium(podDay, b, "day");
    renderList(rankDay, b, "day");
  }
  function renderPeriod() {
    var b = computeBoard(state.period);
    renderPodium(podPeriod, b, state.period);
    renderList(rankPeriod, b, state.period);
    renderMyRank(b);
    document.getElementById("pd-title").textContent = PERIOD_TITLE[state.period];
  }
  function render() { renderDay(); renderPeriod(); }
  render();

  /* ---- controls ------------------------------------------------------------ */
  document.getElementById("period-seg").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    this.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
    b.setAttribute("aria-pressed", "true");
    state.period = b.getAttribute("data-period");
    var card = document.getElementById("board-period");
    card.classList.remove("switching"); void card.offsetWidth; card.classList.add("switching");
    renderPeriod();
  });
  document.getElementById("grade-seg").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    this.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
    b.setAttribute("aria-pressed", "true");
    state.grade = b.getAttribute("data-grade");
    render();
  });

  /* ---- privacy toggle --------------------------------------------------- */
  var privToggle = document.getElementById("privacy-toggle");
  privToggle.addEventListener("click", function () {
    var on = !document.body.classList.contains("priv-on");
    document.body.classList.toggle("priv-on", on);
    privToggle.classList.toggle("on", on);
  });

  /* ---- profile peek — handled by shared peek.js via [data-peek] attrs --- */

  /* ---- tweak API: vibe + self-focus ------------------------------------- */
  window.MingLb = {
    setTweaks: function (tw) {
      if (tw.vibe) document.documentElement.setAttribute("data-vibe", tw.vibe);
      if (tw.selffocus) {
        document.body.setAttribute("data-selffocus", tw.selffocus);
        var grid = document.querySelector(".lb-grid, .boards");
        if (!grid) return;
        if (tw.selffocus === "self") grid.style.gridTemplateColumns = "1fr 1.25fr";
        else if (tw.selffocus === "compete") grid.style.gridTemplateColumns = "1.25fr 1fr";
        else grid.style.gridTemplateColumns = "";
      }
    }
  };
})();
