/* ==========================================================================
   Mingsmileyface · Batch 6 · Cluster B2 — Achievements
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

  /* ---- gem recipes (match ach.css) -------------------------------------- */
  var GEM = {
    violet:  { grad: "linear-gradient(160deg, oklch(0.72 0.18 295), oklch(0.55 0.22 320))", glow: "oklch(0.66 0.23 295 / 0.5)", inner: "linear-gradient(180deg, oklch(0.50 0.18 295 / 0.4), oklch(0.30 0.16 295 / 0.6))" },
    magenta: { grad: "linear-gradient(160deg, oklch(0.72 0.22 5), oklch(0.55 0.24 25))", glow: "oklch(0.68 0.25 5 / 0.5)", inner: "linear-gradient(180deg, oklch(0.50 0.20 5 / 0.4), oklch(0.30 0.18 10 / 0.6))" },
    coral:   { grad: "linear-gradient(160deg, oklch(0.80 0.18 50), oklch(0.62 0.20 35))", glow: "oklch(0.74 0.21 35 / 0.5)", inner: "linear-gradient(180deg, oklch(0.60 0.18 45 / 0.4), oklch(0.40 0.18 35 / 0.6))" },
    cyan:    { grad: "linear-gradient(160deg, oklch(0.84 0.14 205), oklch(0.62 0.16 220))", glow: "oklch(0.80 0.16 205 / 0.5)", inner: "linear-gradient(180deg, oklch(0.50 0.16 210 / 0.4), oklch(0.30 0.14 220 / 0.6))" },
    gold:    { grad: "linear-gradient(160deg, oklch(0.90 0.16 90), oklch(0.70 0.18 70))", glow: "oklch(0.78 0.18 80 / 0.5)", inner: "linear-gradient(180deg, oklch(0.70 0.18 80 / 0.4), oklch(0.50 0.18 70 / 0.6))" }
  };
  var TIER_LABEL = { common: "COMMON", rare: "RARE", epic: "EPIC", legend: "LEGEND" };

  /* ---- build registry from cards ---------------------------------------- */
  var registry = {};
  document.querySelectorAll(".ach[data-badge]").forEach(function (card) {
    var id = card.getAttribute("data-badge");
    registry[id] = {
      id: id,
      color: card.getAttribute("data-color"),
      tier: card.getAttribute("data-tier"),
      name: card.querySelector(".ach-name").textContent,
      svg: card.querySelector(".gem").querySelector("svg").outerHTML
    };
  });

  /* ---- showcase state --------------------------------------------------- */
  var MAX = 3;
  var pinned = [];
  document.querySelectorAll(".ach .ach-pin.pinned").forEach(function (btn) {
    pinned.push(btn.closest(".ach").getAttribute("data-badge"));
  });
  pinned = pinned.slice(0, MAX);

  var row = document.getElementById("showcase-row");
  var dragId = null;

  function renderShowcase() {
    row.innerHTML = "";
    pinned.forEach(function (id) {
      var b = registry[id]; if (!b) return;
      var g = GEM[b.color] || GEM.violet;
      var el = document.createElement("div");
      el.className = "showcase";
      el.setAttribute("draggable", "true");
      el.setAttribute("data-badge", id);
      el.setAttribute("data-tier", b.tier);
      el.style.setProperty("--show-grad", g.grad);
      el.style.setProperty("--show-glow", g.glow);
      el.innerHTML =
        '<span class="tier">' + (TIER_LABEL[b.tier] || "") + '</span>' +
        '<div class="badge-ring" style="--badge-inner:' + g.inner + '">' + b.svg + '</div>' +
        '<div class="b-name">' + b.name + '</div>';
      bindDrag(el);
      row.appendChild(el);
    });
    // empty slots
    for (var i = pinned.length; i < MAX; i++) {
      var slot = document.createElement("div");
      slot.className = "showcase empty-slot";
      slot.innerHTML = '<div class="slot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></div><div class="b-name">ปักเพิ่ม</div>';
      row.appendChild(slot);
    }
    syncPins();
  }

  function syncPins() {
    document.querySelectorAll(".ach[data-badge]").forEach(function (card) {
      var btn = card.querySelector(".ach-pin");
      if (!btn) return;
      btn.classList.toggle("pinned", pinned.indexOf(card.getAttribute("data-badge")) !== -1);
    });
  }

  function bindDrag(el) {
    el.addEventListener("dragstart", function (e) {
      dragId = el.getAttribute("data-badge");
      el.classList.add("dragging");
      if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", dragId); } catch (x) {} }
    });
    el.addEventListener("dragend", function () {
      dragId = null;
      el.classList.remove("dragging");
      row.querySelectorAll(".drop-target").forEach(function (x) { x.classList.remove("drop-target"); });
    });
    el.addEventListener("dragover", function (e) {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      if (el.getAttribute("data-badge") !== dragId) el.classList.add("drop-target");
    });
    el.addEventListener("dragleave", function () { el.classList.remove("drop-target"); });
    el.addEventListener("drop", function (e) {
      e.preventDefault();
      el.classList.remove("drop-target");
      var targetId = el.getAttribute("data-badge");
      if (!dragId || !targetId || dragId === targetId) return;
      var from = pinned.indexOf(dragId), to = pinned.indexOf(targetId);
      if (from === -1 || to === -1) return;
      pinned.splice(from, 1);
      pinned.splice(to, 0, dragId);
      renderShowcase();
    });
  }

  /* ---- pin / unpin from cards ------------------------------------------- */
  document.querySelectorAll(".ach .ach-pin").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var id = btn.closest(".ach").getAttribute("data-badge");
      var idx = pinned.indexOf(id);
      if (idx !== -1) { pinned.splice(idx, 1); }
      else if (pinned.length < MAX) { pinned.push(id); }
      else { flash(btn); return; }
      renderShowcase();
    });
  });
  function flash(btn) {
    btn.animate([{ transform: "translateX(0)" }, { transform: "translateX(-3px)" }, { transform: "translateX(3px)" }, { transform: "translateX(0)" }], { duration: 260 });
  }

  renderShowcase();

  /* ---- tab filter ------------------------------------------------------- */
  var tabs = document.getElementById("ach-tabs");
  tabs.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    tabs.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
    b.setAttribute("aria-pressed", "true");
    applyFilter(b.getAttribute("data-filter"));
  });
  function applyFilter(f) {
    document.querySelectorAll(".cat-sec").forEach(function (sec) {
      var shown = 0;
      sec.querySelectorAll(".ach").forEach(function (card) {
        var st = card.getAttribute("data-state");
        var ok = f === "all" || st === f;
        card.style.display = ok ? "" : "none";
        if (ok) shown++;
      });
      sec.style.display = shown ? "" : "none";
    });
  }

  /* ---- demo empty toggle ------------------------------------------------ */
  var page = document.getElementById("ach-page");
  document.getElementById("demo-seg").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    this.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
    b.setAttribute("aria-pressed", "true");
    page.classList.toggle("is-empty", b.getAttribute("data-state") === "empty");
  });

  /* ---- tweak API -------------------------------------------------------- */
  window.MingAch = {
    setTweaks: function (tw) {
      if (tw.vibe) document.documentElement.setAttribute("data-vibe", tw.vibe);
      if (tw.energy) document.documentElement.setAttribute("data-energy", tw.energy);
    }
  };
})();
