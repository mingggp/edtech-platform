/* ==========================================================================
   Mingsmileyface · Batch 6 · Cluster B1 — XP / Level + level-up modal
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

  /* ---- tweak state ------------------------------------------------------ */
  var ENERGY = "calm";

  /* ---- level-up modal --------------------------------------------------- */
  var back = document.getElementById("lvup-back");
  var bar = document.getElementById("lvup-bar");
  var CIRC = 540.4;
  var ringRAF;

  function fillRing() {
    // Source of truth: full ring lands synchronously (rAF can't be relied on here).
    bar.style.strokeDashoffset = "0";
    // Enhancement: animate from empty in real browsers.
    cancelAnimationFrame(ringRAF);
    var start = CIRC, t0 = performance.now(), dur = 1100;
    bar.style.strokeDashoffset = String(CIRC);
    function step(t) {
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      bar.style.strokeDashoffset = (start * (1 - e)).toFixed(2);
      if (p < 1) ringRAF = requestAnimationFrame(step);
      else bar.style.strokeDashoffset = "0";
    }
    ringRAF = requestAnimationFrame(step);
    // guard: if rAF never advances (preview engine), ensure final state next tick
    setTimeout(function () { bar.style.strokeDashoffset = "0"; }, 60);
  }

  function openLvup() {
    back.classList.add("open");
    back.setAttribute("aria-hidden", "false");
    fillRing();
    var r = back.querySelector(".ring-wrap").getBoundingClientRect();
    setTimeout(function () { fireConfetti(r); fireSparkles(r); }, 120);
  }
  function closeLvup() {
    back.classList.remove("open");
    back.setAttribute("aria-hidden", "true");
  }
  document.getElementById("lvup-demo").addEventListener("click", openLvup);
  document.getElementById("lvup-close").addEventListener("click", closeLvup);
  document.getElementById("lvup-ok").addEventListener("click", closeLvup);
  back.addEventListener("click", function (e) { if (e.target === back) closeLvup(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLvup(); });

  /* ---- celebration: confetti + sparkles (reused recipe) ----------------- */
  function brandColors() {
    var cs = getComputedStyle(document.documentElement);
    return ["--brand-violet", "--brand-magenta", "--brand-coral", "--brand-cyan", "--brand-lime", "--success"]
      .map(function (v) { return (cs.getPropertyValue(v) || "").trim(); })
      .filter(Boolean);
  }
  function fireConfetti(rect) {
    var COLORS = brandColors();
    if (!COLORS.length) COLORS = ["oklch(0.66 0.23 295)", "oklch(0.68 0.25 5)"];
    var N = ENERGY === "calm" ? 18 : ENERGY === "vivid" ? 42 : 28;
    var c = document.createElement("div");
    c.style.cssText = "position:fixed;left:" + (rect.left + rect.width / 2) + "px;top:" + (rect.top + rect.height / 2) + "px;pointer-events:none;z-index:9999;";
    document.body.appendChild(c);
    for (var i = 0; i < N; i++) {
      var p = document.createElement("div");
      var ang = (Math.PI * 2 * i) / N + (Math.random() - 0.5) * 0.5;
      var dist = 100 + Math.random() * 120;
      var size = 6 + Math.random() * 6;
      p.style.cssText = "position:absolute;width:" + size + "px;height:" + size + "px;background:" + COLORS[i % COLORS.length] +
        ";border-radius:" + (Math.random() > 0.5 ? "50%" : "2px") + ";--tx:" + (Math.cos(ang) * dist) + "px;--ty:" + (Math.sin(ang) * dist - 24) +
        "px;animation:confettiBurst " + (750 + Math.random() * 450) + "ms cubic-bezier(.2,.7,.4,1) forwards;animation-delay:" + (Math.random() * 80) + "ms;";
      c.appendChild(p);
    }
    setTimeout(function () { c.remove(); }, 1600);
  }
  function fireSparkles(rect) {
    var c = document.createElement("div");
    c.style.cssText = "position:fixed;left:" + (rect.left + rect.width / 2) + "px;top:" + (rect.top + rect.height / 2) + "px;pointer-events:none;z-index:9999;";
    document.body.appendChild(c);
    for (var i = 0; i < 14; i++) {
      var p = document.createElement("div");
      var ang = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.4;
      var dist = 80 + Math.random() * 110;
      var size = 5 + Math.random() * 4;
      p.style.cssText = "position:absolute;width:" + size + "px;height:" + size + "px;background:var(--brand-lime);border-radius:50%;box-shadow:0 0 8px var(--brand-cyan);--tx:" +
        (Math.cos(ang) * dist) + "px;--ty:" + (Math.sin(ang) * dist - 16) + "px;animation:confettiBurst " + (800 + Math.random() * 400) + "ms ease-out forwards;animation-delay:" + (Math.random() * 60) + "ms;";
      c.appendChild(p);
    }
    setTimeout(function () { c.remove(); }, 1400);
  }

  /* ---- tweak API -------------------------------------------------------- */
  function applyVibe(v) {
    document.documentElement.setAttribute("data-vibe", v);
  }
  window.MingXP = {
    setTweaks: function (tw) {
      if (tw.vibe) applyVibe(tw.vibe);
      if (tw.energy) { ENERGY = tw.energy; document.documentElement.setAttribute("data-energy", tw.energy); }
    }
  };
})();
