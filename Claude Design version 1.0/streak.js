/* ==========================================================================
   Mingsmileyface · Batch 6 · Cluster A — Streak / Daily Goal / Quests
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

  /* ---- icons for status pill ------------------------------------------- */
  var ICONS = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m20 6-11 11-5-5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    snow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1.2 4.2 5 5.2 5 10a5 5 0 1 1-10 0c0-3.2 2-4.2 2-7.2 0 2.2 1.1 3.2 3 3.2-1.1-2.2-1.1-4.2 0-6z"/></svg>'
  };

  /* ---- streak demo states ---------------------------------------------- */
  var TODAY = 3; // Thursday index in the week strip
  var STATES = {
    done: {
      cls: "is-done", count: 12, icon: "check", status: "เรียนวันนี้แล้ว · ไฟยังลุก",
      tagline: 'สุดยอด! รักษาความต่อเนื่องไว้แบบนี้ — อีก <b>1 วัน</b> ก็ครบ 13 วันติด',
      week: ["on", "on", "on", "on", "future", "future", "future"]
    },
    idle: {
      cls: "is-idle", count: 12, icon: "clock", status: "ยังไม่ได้เรียนวันนี้",
      tagline: 'ยังมีเวลาอีกเยอะ เปิดบทสั้น ๆ วันนี้ก็พอรักษาสตรีค <b>12 วัน</b> ไว้ได้',
      week: ["on", "on", "on", "idle", "future", "future", "future"]
    },
    warning: {
      cls: "is-warning", count: 12, icon: "alert", status: "เหลืออีก ~3 ชม. ก่อนหมดวัน",
      tagline: 'ใกล้หมดวันแล้ว เรียนนิดเดียวก็พอ ไม่ต้องรีบกดดันนะ — แค่ <b>5 นาที</b> ก็ช่วยได้',
      week: ["on", "on", "on", "idle", "future", "future", "future"]
    },
    freeze: {
      cls: "is-freeze", count: 12, icon: "snow", status: "ตัวกันหลุดทำงานเมื่อวาน",
      tagline: 'เมื่อวานพลาดไป แต่ <b>ตัวกันหลุด</b> ช่วยไว้ — สตรีคยังอยู่ที่ 12 วัน 💙',
      week: ["on", "on", "freeze", "idle", "future", "future", "future"]
    },
    empty: {
      cls: "is-empty", count: 0, icon: "flame", status: "ยังไม่เริ่มสตรีค",
      tagline: 'เริ่มเรียนวันนี้เพื่อจุดสตรีคแรกของคุณ 🔥 ทีละวัน ไม่ต้องรีบ',
      week: ["idle", "idle", "idle", "idle", "future", "future", "future"]
    }
  };

  // hype-tone copy overrides per state (motivation tone tweak)
  var HYPE = {
    done:    { status: "วันนี้จัดไป! ไฟลุกท่วม", tagline: 'มาแล้ว <b>12 วันติด</b>! รักษาโมเมนตัมไว้ ลุยอีกวันให้ครบ 13!' },
    idle:    { status: "ยังไม่เก็บแต้มวันนี้!", tagline: 'อย่าปล่อยให้ <b>12 วัน</b> หลุดมือ — เปิดบทเดียวก็พอ ไปเลย!' },
    warning: { status: "นาทีสุดท้าย! เหลือ ~3 ชม.", tagline: 'ใกล้หมดเวลาแล้ว! เก็บสตรีคให้ทันก่อนเที่ยงคืน — ลุยตอนนี้เลย!' },
    freeze:  { status: "ตัวกันหลุดเซฟไว้!", tagline: 'รอดหวุดหวิด! ❄️ กันหลุดช่วยไว้ — <b>12 วัน</b> ยังอยู่ครบ กลับมาซัดต่อ!' },
    empty:   { status: "ได้เวลาเริ่มลุย!", tagline: 'จุดไฟสตรีคแรกวันนี้เลย 🔥 วันแรกคือก้าวที่สำคัญที่สุด!' }
  };

  var hero = document.getElementById("streak-hero");
  var elCount = document.getElementById("sh-count");
  var elTag = document.getElementById("sh-tagline");
  var elStatusTxt = document.getElementById("sh-status-txt");
  var elStatusIco = document.getElementById("sh-status-ico");
  var weekDays = Array.prototype.slice.call(document.querySelectorAll("#sh-week .sh-day"));

  // ---- tweak state ----
  var currentState = "done";
  var TONE = "kind";     // kind | hype
  var ENERGY = "balanced"; // calm | balanced | vivid
  var VIBE = "aurora";  // aurora | cool | warm

  function applyState(name) {
    var s = STATES[name];
    if (!s) return;
    currentState = name;
    var status = s.status, tagline = s.tagline;
    if (TONE === "hype" && HYPE[name]) { status = HYPE[name].status; tagline = HYPE[name].tagline; }
    hero.className = "streak-hero " + s.cls;
    if (elTag) elTag.innerHTML = tagline;
    elStatusTxt.textContent = status;
    elStatusIco.innerHTML = ICONS[s.icon] || "";
    // count-up to target
    animateCount(elCount, s.count);
    // week dots
    weekDays.forEach(function (d, i) {
      d.classList.remove("on", "idle", "freeze", "future");
      var st = s.week[i];
      if (st && st !== "idle") d.classList.add(st);
      if (i === TODAY) d.classList.add("today");
    });
  }

  function animateCount(el, target) {
    var start = parseInt(el.textContent, 10) || 0;
    el.textContent = target; // source of truth (rAF may not run in preview engine)
    if (start === target) return;
    var t0 = performance.now(), dur = 600;
    function step(t) {
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(start + (target - start) * e);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  document.getElementById("demo-seg").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    this.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
    b.setAttribute("aria-pressed", "true");
    applyState(b.getAttribute("data-state"));
  });
  applyState("done");

  /* ---- daily goal ring -------------------------------------------------- */
  var DONE_MIN = 22;
  var CIRC = 527.8;
  var goalBar = document.getElementById("goal-bar");
  var goalTargetEl = document.getElementById("goal-target");
  var goalCard = document.getElementById("goal-card");
  var goalDoneEl = document.getElementById("goal-done");
  goalDoneEl.textContent = DONE_MIN;
  var ringRAF;

  function tweenRing(start, target, dur) {
    cancelAnimationFrame(ringRAF);
    var t0 = performance.now();
    function step(t) {
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      goalBar.style.strokeDashoffset = (start + (target - start) * e).toFixed(2);
      if (p < 1) ringRAF = requestAnimationFrame(step);
      else goalBar.style.strokeDashoffset = target.toFixed(2);
    }
    ringRAF = requestAnimationFrame(step);
  }

  function setGoal(min, animate) {
    goalTargetEl.textContent = min;
    var pct = Math.min(1, DONE_MIN / min);
    var target = CIRC * (1 - pct);
    var start = parseFloat(goalBar.style.strokeDashoffset);
    if (isNaN(start)) start = CIRC;
    // Source of truth: land the final offset synchronously (rAF/CSS transitions
    // can't be relied on to reach the end state in this preview engine).
    goalBar.style.strokeDashoffset = target.toFixed(2);
    // Enhancement: smooth tween where rAF actually runs (real browsers).
    if (animate && Math.abs(start - target) > 0.5) tweenRing(start, target, 900);
    var wasComplete = goalCard.classList.contains("complete");
    var isComplete = DONE_MIN >= min;
    goalCard.classList.toggle("complete", isComplete);
    if (animate && isComplete && !wasComplete) {
      var r = goalCard.querySelector(".ring-wrap").getBoundingClientRect();
      fireSparkles(r);
    }
  }
  var goalRange = document.getElementById("goal-range");
  var goalRangeVal = document.getElementById("goal-range-val");
  function syncGoalRange(animate) {
    var v = parseInt(goalRange.value, 10);
    goalRangeVal.textContent = v;
    var pct = (v - goalRange.min) / (goalRange.max - goalRange.min) * 100;
    goalRange.style.setProperty("--fill", pct + "%");
    setGoal(v, animate);
  }
  goalRange.addEventListener("input", function () { syncGoalRange(true); });

  /* ---- quests ----------------------------------------------------------- */
  var quests = Array.prototype.slice.call(document.querySelectorAll("#quest-row .quest"));
  var qbarFill = document.getElementById("qbar-fill");
  var questCount = document.getElementById("quest-count");
  var claim = document.getElementById("quest-claim");
  var claimBtn = document.getElementById("claim-btn");
  var qcTitle = document.getElementById("qc-title");
  var qcSub = document.getElementById("qc-sub");

  function refreshQuests() {
    var done = quests.filter(function (q) { return q.classList.contains("done"); }).length;
    questCount.textContent = done;
    qbarFill.style.width = (done / quests.length * 100) + "%";
    var all = done === quests.length;
    if (claim.classList.contains("claimed")) return;
    claim.classList.toggle("ready", all);
    claimBtn.disabled = !all;
    if (all) {
      qcTitle.textContent = "ครบทั้ง 3 ภารกิจแล้ว! 🎉";
      qcSub.textContent = "กดรับโบนัส +130 XP ของวันนี้ได้เลย";
    } else {
      var left = quests.length - done;
      qcTitle.textContent = "เหลืออีก " + left + " ภารกิจ";
      qcSub.textContent = "ทำครบ 3 ภารกิจวันนี้เพื่อรับโบนัส +130 XP";
    }
  }
  quests.forEach(function (q) {
    q.addEventListener("click", function () {
      if (claim.classList.contains("claimed")) return;
      var nowDone = !q.classList.contains("done");
      q.classList.toggle("done", nowDone);
      var mini = q.querySelector(".q-mini > i");
      var frac = q.querySelector(".q-frac");
      if (nowDone) { if (mini) mini.style.width = "100%"; if (frac) frac.textContent = frac.textContent.replace(/^0/, "1"); }
      else { if (mini) mini.style.width = "6%"; if (frac && frac.textContent === "1/1") frac.textContent = "0/1"; }
      refreshQuests();
    });
  });
  claimBtn.addEventListener("click", function () {
    if (claimBtn.disabled) return;
    claim.classList.add("claimed");
    claim.classList.remove("ready");
    claimBtn.textContent = "รับแล้ว · +130 XP";
    claimBtn.disabled = true;
    qcTitle.textContent = "รับโบนัสเรียบร้อย! +130 XP";
    qcSub.textContent = "เก่งมาก เจอกันใหม่พรุ่งนี้นะ";
    fireConfetti(claimBtn.getBoundingClientRect());
  });

  /* ---- calendar heatmap ------------------------------------------------- */
  // May 2026. levels → hours tiers: 1 = 0–1 ชม. (จาง), 2 = 1–2 ชม. (กลาง), 3-4 = 2+ ชม. (เข้ม), 'f' freeze.
  var LEVELS = {
    1: 2, 2: 0, 3: 1, 4: 3, 5: 2, 6: 0, 7: 1,
    8: 2, 9: 3, 10: 1, 11: 0, 12: 2, 13: 4, 14: 2,
    15: 3, 16: 1, 17: 0, 18: 2, 19: "f",
    20: 2, 21: 3, 22: 2, 23: 4, 24: 3, 25: 2, 26: 3, 27: 4, 28: 2, 29: 3, 30: 2, 31: 3
  };
  var HOURS_TXT = { 1: "45 นาที", 2: "1 ชม. 20 นาที", 3: "2 ชม. 15 นาที", 4: "3 ชม. 5 นาที" };
  var calMonth = document.getElementById("cal-month");
  var firstDow = new Date(2026, 4, 1).getDay(); // 0=Sun..6=Sat
  var lead = (firstDow + 6) % 7;                // Monday-first offset
  var frag = document.createDocumentFragment();
  for (var i = 0; i < lead; i++) {
    var e = document.createElement("div"); e.className = "cal-cell empty"; frag.appendChild(e);
  }
  var cellIdx = 0;
  for (var d = 1; d <= 31; d++) {
    var c = document.createElement("div");
    c.className = "cal-cell pop";
    var lv = LEVELS[d];
    if (lv === "f") { c.classList.add("freeze"); c.setAttribute("data-tip", "พ.ค. " + d + " · ตัวกันหลุดทำงาน"); }
    else if (lv > 0) { c.classList.add("t" + (lv >= 3 ? 3 : lv)); c.setAttribute("data-tip", "พ.ค. " + d + " · เรียน " + HOURS_TXT[lv]); }
    else { c.setAttribute("data-tip", "พ.ค. " + d + " · ไม่ได้เรียน"); }
    if (d === 31) c.classList.add("today");
    c.textContent = (lv === "f") ? "" : d;
    c.style.animationDelay = (cellIdx++ * 14) + "ms";
    frag.appendChild(c);
  }
  calMonth.appendChild(frag);
  // safety landing: strip entrance animation after it should have finished,
  // so suspended animations (hidden tab / print) can't leave cells invisible
  setTimeout(function () {
    calMonth.querySelectorAll(".cal-cell.pop").forEach(function (c) { c.classList.remove("pop"); c.style.animationDelay = ""; });
  }, 1400);

  /* ---- celebration: confetti + sparkles (reused recipe) ----------------- */
  function fireConfetti(rect) {
    var COLORS = ["oklch(0.66 0.23 295)", "oklch(0.68 0.25 5)", "oklch(0.78 0.20 50)", "oklch(0.80 0.16 205)", "oklch(0.86 0.20 130)", "oklch(0.96 0.18 80)"];
    var N = ENERGY === "calm" ? 16 : ENERGY === "vivid" ? 40 : 26;
    var c = document.createElement("div");
    c.style.cssText = "position:fixed;left:" + (rect.left + rect.width / 2) + "px;top:" + (rect.top + rect.height / 2) + "px;pointer-events:none;z-index:9999;";
    document.body.appendChild(c);
    for (var i = 0; i < N; i++) {
      var p = document.createElement("div");
      var ang = (Math.PI * 2 * i) / N + (Math.random() - 0.5) * 0.5;
      var dist = 90 + Math.random() * 110;
      var size = 6 + Math.random() * 5;
      p.style.cssText = "position:absolute;width:" + size + "px;height:" + size + "px;background:" + COLORS[i % COLORS.length] +
        ";border-radius:" + (Math.random() > 0.5 ? "50%" : "2px") + ";--tx:" + (Math.cos(ang) * dist) + "px;--ty:" + (Math.sin(ang) * dist - 20) +
        "px;animation:confettiBurst " + (700 + Math.random() * 400) + "ms cubic-bezier(.2,.7,.4,1) forwards;animation-delay:" + (Math.random() * 60) + "ms;";
      c.appendChild(p);
    }
    setTimeout(function () { c.remove(); }, 1500);
  }
  function fireSparkles(rect) {
    var c = document.createElement("div");
    c.style.cssText = "position:fixed;left:" + (rect.left + rect.width / 2) + "px;top:" + (rect.top + rect.height / 2) + "px;pointer-events:none;z-index:9999;";
    document.body.appendChild(c);
    for (var i = 0; i < 16; i++) {
      var p = document.createElement("div");
      var ang = (Math.PI * 2 * i) / 16 + (Math.random() - 0.5) * 0.4;
      var dist = 90 + Math.random() * 120;
      var size = 5 + Math.random() * 4;
      p.style.cssText = "position:absolute;width:" + size + "px;height:" + size + "px;background:oklch(0.80 0.16 205);border-radius:50%;box-shadow:0 0 8px oklch(0.80 0.16 205);--tx:" +
        (Math.cos(ang) * dist) + "px;--ty:" + (Math.sin(ang) * dist - 16) + "px;animation:confettiBurst " + (800 + Math.random() * 400) + "ms ease-out forwards;animation-delay:" + (Math.random() * 60) + "ms;";
      c.appendChild(p);
    }
    setTimeout(function () { c.remove(); }, 1400);
  }

  /* ---- tweak API (called by the Tweaks panel) -------------------------- */
  var RING_STOPS = {
    aurora: ["oklch(0.66 0.23 295)", "oklch(0.68 0.25 5)", "oklch(0.78 0.20 50)"],
    cool:   ["oklch(0.66 0.23 295)", "oklch(0.72 0.18 250)", "oklch(0.80 0.16 205)"],
    warm:   ["oklch(0.68 0.25 5)", "oklch(0.76 0.20 40)", "oklch(0.86 0.20 130)"]
  };
  function applyVibe(v) {
    VIBE = v;
    document.documentElement.setAttribute("data-vibe", v);
    var stops = RING_STOPS[v] || RING_STOPS.aurora;
    var gs = document.querySelectorAll("#goalGrad stop");
    if (gs.length === 3) { gs[0].setAttribute("stop-color", stops[0]); gs[1].setAttribute("stop-color", stops[1]); gs[2].setAttribute("stop-color", stops[2]); }
  }
  window.MingStreak = {
    setTweaks: function (tw) {
      if (tw.vibe) applyVibe(tw.vibe);
      if (tw.energy) { ENERGY = tw.energy; document.documentElement.setAttribute("data-energy", tw.energy); }
      if (tw.tone) TONE = tw.tone;
      applyState(currentState);
    }
  };

  /* ---- milestone fill entrance (transition-based, with safety landing) -- */
  var msFill = document.querySelector(".ms-track .ms-fill");
  if (msFill) {
    var msTarget = msFill.style.width || "31%";
    msFill.style.width = "0";
    requestAnimationFrame(function () { requestAnimationFrame(function () { msFill.style.width = msTarget; }); });
    setTimeout(function () { msFill.style.width = msTarget; }, 500); // safety landing
  }

  /* ---- init goal ring -------------------------------------------------- */
  refreshQuests();
  syncGoalRange(false);
})();
