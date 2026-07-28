/* ==========================================================================
   Mingsmileyface · Batch 7 · Shared sidebar upgrader
   Rolls the approved sidebar system onto EVERY page with a sidebar, uniformly
   and idempotently, so we don't hand-edit ~70 heterogeneous markups:
     • big centred house "logo" (replaces the หน้าหลัก list item)
     • merge บัญชี nav  →  single "ตั้งค่า" (Payments now lives in Settings)
     • bottom user card removed (identity shown in Dashboard hero); profile +
       logout live in the top-av avatar menu only
   Vibe + home glow come from sidebar.css via <html data-sb> / <html data-home>
   (set on the tag for no-FOUC; defaulted here as a backstop).
   Pages that already hand-built a piece (e.g. Settings.html) are detected and
   skipped — every block is guarded.
   ========================================================================== */
(function () {
  "use strict";
  function init() {
    /* ---- font mode (Bai Jamjuree) — จำไว้ทุกหน้า ---------------------- */
    try {
      var fm = localStorage.getItem('ming-font');
      if (fm) document.documentElement.setAttribute('data-font', fm);
    } catch (e) {}
    if (!document.getElementById('bai-jam-font')) {
      var bj = document.createElement('link');
      bj.id = 'bai-jam-font'; bj.rel = 'stylesheet';
      bj.href = 'https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@400;500;600;700&display=swap';
      document.head.appendChild(bj);
    }
    var root = document.documentElement;
    if (!root.getAttribute("data-sb"))   root.setAttribute("data-sb", "soft");
    if (!root.getAttribute("data-home")) root.setAttribute("data-home", "aura");

    var side = document.querySelector(".sidebar");
    if (!side) return;

    /* ---- CANONICAL NAV — 2 groups by importance (teammate redesign) ----- *
       Rebuilt identically on every page from one spec.
         • PRIMARY  → 3 big glass buttons: หน้าหลัก (most prominent) ·
                      คอร์สของฉัน · ข้อสอบ
         • SECONDARY→ mini icon dock, label shows on hover only:
                      อันดับ · เพื่อน · ความสำเร็จ · สตรีค
       Removed earlier: โน้ตของฉัน · คอร์สที่บันทึก · คอร์สใหม่ · การชำระเงิน.
       Settings lives behind the profile (avatar menu + bottom user card).
       "คอร์สของฉัน" → My Courses.html (คอร์สที่ซื้อแล้ว) — NOT the public
       Courses.html marketing page used by logged-out visitors. */
    var I = {
      home:    '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.2V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.2"/><path d="M9.5 21v-6.5h5V21"/>',
      courses: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
      exams:   '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13l2 2 4-4"/>',
      browse:  '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
      rank:    '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16M10 14.66V17c0 .55.47.98.97 1.21C12.15 18.75 13 19.95 13 21M14 14.66V17c0 .55-.47.98-.97 1.21C11.85 18.75 11 19.95 11 21M18 2H6v7a6 6 0 0 0 12 0z"/>',
      friends: '<circle cx="9" cy="7" r="4"/><path d="M16 11h6M19 8v6M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/>',
      achieve: '<path d="m12 2 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
      streak:  '<path d="M12 2c1.2 4.2 5 5.2 5 10a5 5 0 1 1-10 0c0-3.2 2-4.2 2-7.2 0 2.2 1.1 3.2 3 3.2-1.1-2.2-1.1-4.2 0-6z"/>',
      results: '<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/>',
      xp:      '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/>',
      tcas:    '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'
    };
    var PRIMARY = [
      { href: "Dashboard.html",  label: "หน้าหลัก",    sub: "ภาพรวมการเรียน",    icon: I.home, home: true },
      { href: "My Courses.html", label: "คอร์สของฉัน", sub: "7 คอร์สที่เรียนอยู่", icon: I.courses },
      { href: "Exams.html",      label: "ข้อสอบ",      sub: "3 ชุดใหม่",          icon: I.exams },
      { href: "TCAS.html",       label: "คำนวณ TCAS", sub: "เช็กโอกาสติดคณะที่เล็ง", icon: I.tcas }
    ];
    var MINI = [
      { href: "Browse Courses.html",      label: "คอร์สทั้งหมด", icon: I.browse },
      { href: "Exam Results.html",        label: "ผลสอบของฉัน", icon: I.results },
      { href: "XP & Level.html",          label: "เลเวล & แต้ม", icon: I.xp },
      { href: "Leaderboard.html",         label: "อันดับ",     icon: I.rank },
      { href: "Public Profile.html",      label: "เพื่อน",     icon: I.friends },
      { href: "Achievements.html",        label: "ความสำเร็จ", icon: I.achieve },
      { href: "Streak & Daily Goal.html", label: "สตรีค",      icon: I.streak }
    ];
    var here = "";
    try { here = decodeURIComponent((location.pathname.split("/").pop() || "")).toLowerCase(); } catch (e) { here = (location.pathname.split("/").pop() || "").toLowerCase(); }
    function isActive(href) {
      var h = href.toLowerCase();
      if (h === here) return true;
      if (h === "dashboard.html" && here === "") return true;
      return false;
    }
    function svg(inner) {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
    }

    // drop any house-logo block left by an older build
    var oldHome = side.querySelector(".sb-home");
    if (oldHome) oldHome.remove();

    var oldSecs = side.querySelectorAll(".sb-section, .sb-primary, .sb-mini, .sb-mini-sep");
    if (oldSecs.length && !side.querySelector("[data-canon]")) {
      var frag = document.createDocumentFragment();

      var prim = document.createElement("nav");
      prim.className = "sb-primary"; prim.setAttribute("data-canon", "1");
      prim.setAttribute("aria-label", "เมนูหลัก");
      PRIMARY.forEach(function (it) {
        var a = document.createElement("a");
        a.className = "sb-big" + (it.home ? " sb-big-home" : "") + (isActive(it.href) ? " active" : "");
        a.href = it.href;
        if (isActive(it.href)) a.setAttribute("aria-current", "page");
        a.innerHTML = '<span class="bi">' + svg(it.icon) + '</span>' +
          '<span class="bt"><b>' + it.label + '</b><span class="bs">' + it.sub + '</span></span>';
        prim.appendChild(a);
      });
      frag.appendChild(prim);

      var sep = document.createElement("div");
      sep.className = "sb-mini-sep"; sep.setAttribute("data-canon", "1"); sep.setAttribute("aria-hidden", "true");
      frag.appendChild(sep);

      var mini = document.createElement("nav");
      mini.className = "sb-mini"; mini.setAttribute("data-canon", "1");
      mini.setAttribute("aria-label", "เมนูเพิ่มเติม");
      MINI.forEach(function (it) {
        var a = document.createElement("a");
        a.className = "sb-dot" + (isActive(it.href) ? " active" : "");
        a.href = it.href;
        a.setAttribute("data-tip", it.label);
        a.setAttribute("aria-label", it.label);
        if (isActive(it.href)) a.setAttribute("aria-current", "page");
        a.innerHTML = svg(it.icon);
        mini.appendChild(a);
      });
      frag.appendChild(mini);

      var anchor = oldSecs[0];
      anchor.parentNode.insertBefore(frag, anchor);
      for (var k = 0; k < oldSecs.length; k++) oldSecs[k].remove();
    }

    /* ---- C · drop the bottom user card (duplicate of the top-av menu) -- */
    var user = side.querySelector(".sb-user");
    if (user) user.remove();

    /* ---- E · canonical topbar — same controls on EVERY page ----------- *
       search (working) · theme-toggle · notifications · avatar menu.
       Each block is guarded; pages that hand-built a piece (Dashboard) keep
       their own copy. Crumbs stay page-specific. */
    upgradeTopbar();

    /* ---- D · top-av avatar → profile menu ----------------------------- */
    var av = document.querySelector(".top-av");
    if (av && !document.getElementById("av-menu")) {
      var ini = (av.querySelector(".av") && av.querySelector(".av").textContent.trim()) || "ปม";
      var nm = (av.querySelector(".name") && av.querySelector(".name").textContent.trim()) || "น้องปาล์ม";
      av.style.position = "relative";
      av.setAttribute("aria-haspopup", "menu");
      av.setAttribute("aria-expanded", "false");

      var catcher = document.createElement("div"); catcher.className = "av-catcher"; catcher.id = "av-catcher";
      var menu = document.createElement("div"); menu.className = "av-menu"; menu.id = "av-menu"; menu.setAttribute("role", "menu");
      menu.innerHTML =
        '<div class="am-head"><span class="av">' + ini + '</span><div class="ai"><b>' + nm + '</b><span>@palm_dek68</span></div></div>' +
        '<a href="Public Profile.html?me=1" role="menuitem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 12 0v1"/></svg>ดูโปรไฟล์สาธารณะ</a>' +
        '<a href="Settings.html" role="menuitem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>ตั้งค่า</a>' +
        '<div class="am-sep"></div>' +
        '<a href="Login Signup.html" role="menuitem" class="danger"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>ออกจากระบบ</a>';
      av.appendChild(menu);
      document.body.appendChild(catcher);

      function open()  { menu.classList.add("open"); catcher.classList.add("open"); av.classList.add("menu-open"); av.setAttribute("aria-expanded", "true"); }
      function close() { menu.classList.remove("open"); catcher.classList.remove("open"); av.classList.remove("menu-open"); av.setAttribute("aria-expanded", "false"); }
      av.addEventListener("click", function (e) {
        if (e.target.closest(".av-menu")) return;          // let menu links work
        e.stopPropagation();
        menu.classList.contains("open") ? close() : open();
      });
      // outside-click: catcher sits behind the menu and above everything else
      catcher.addEventListener("click", close);
      window.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    }
  }

  function upgradeTopbar() {
    var bar = document.querySelector("header.topbar");
    if (!bar) return;
    var crumb = bar.querySelector(".crumb");
    var actions = bar.querySelector(".top-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "top-actions";
      bar.appendChild(actions);
    }

    /* shared styles (injected once) */
    if (!document.getElementById("tb-canon-css")) {
      var css = document.createElement("style");
      css.id = "tb-canon-css";
      css.textContent =
        '.search[data-tb-built]{position:relative;flex:1;max-width:420px;display:flex;align-items:center;gap:10px;height:40px;padding:0 12px;border-radius:12px;border:1px solid var(--line);background:var(--bg-1);color:var(--fg-2);}' +
        '.search[data-tb-built] .icon{display:flex;color:var(--fg-3);}' +
        '.search[data-tb-built] input{flex:1;min-width:0;border:0;background:transparent;color:var(--fg-0);font:inherit;font-size:13.5px;outline:none;}' +
        '.search[data-tb-built] input::placeholder{color:var(--fg-3);}' +
        '.search[data-tb-built] .kbd{font-family:"JetBrains Mono",monospace;font-size:10px;color:var(--fg-3);border:1px solid var(--line);border-radius:6px;padding:2px 6px;}' +
        '.search:not([data-tb-built]) .gs-drop{display:none !important;}' +
        '.gs-drop{position:absolute;top:calc(100% + 8px);left:0;right:0;min-width:320px;z-index:60;display:none;background:var(--bg-1);border:1px solid var(--glass-line-strong,var(--line));border-radius:14px;box-shadow:0 24px 60px -18px oklch(0 0 0 / 0.5);max-height:380px;overflow-y:auto;}' +
        '.gs-drop.open{display:block;}' +
        '.gs-drop .gs-cat{padding:9px 14px 4px;font-family:"JetBrains Mono",monospace;font-size:9.5px;letter-spacing:0.16em;text-transform:uppercase;color:var(--fg-3);}' +
        '.gs-drop a{display:flex;align-items:center;gap:11px;padding:9px 14px;text-decoration:none;color:var(--fg-0);}' +
        '.gs-drop a:hover,.gs-drop a.sel{background:var(--bg-2);}' +
        '.gs-drop a .gi{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;background:var(--gi-bg,var(--grad-signature));}' +
        '.gs-drop a .gi svg{width:14px;height:14px;}' +
        '.gs-drop a .gt{flex:1;min-width:0;line-height:1.3;}' +
        '.gs-drop a .gt b{display:block;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
        '.gs-drop a .gt small{font-size:11px;color:var(--fg-2);}' +
        '.gs-drop a .gt b mark{background:transparent;color:var(--brand-magenta);}' +
        '.gs-drop .gs-none{padding:16px 14px;font-size:13px;color:var(--fg-2);}' +
        '[data-tb-built].icon-btn,.top-pop[data-tb-built] .icon-btn{width:38px;height:38px;border-radius:10px;border:1px solid var(--line);background:var(--bg-1);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--fg-1);position:relative;}' +
        '.top-pop[data-tb-built] .icon-btn:hover{color:var(--fg-0);border-color:var(--fg-2);background:var(--bg-2);}' +
        '.top-pop[data-tb-built] .icon-btn .dot{position:absolute;top:8px;right:8px;width:8px;height:8px;border-radius:50%;background:var(--brand-magenta);border:2px solid var(--bg-1);}' +
        '.top-pop{position:relative;}' +
        '.top-pop .pop{position:absolute;top:calc(100% + 10px);right:0;width:330px;z-index:70;display:none;background:var(--bg-1);border:1px solid var(--glass-line-strong,var(--line));border-radius:16px;overflow:hidden;box-shadow:0 24px 60px -18px oklch(0 0 0 / 0.5);}' +
        '.top-pop.open .pop{display:block;}' +
        '.top-pop .pop-head{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid var(--line-soft,var(--line));}' +
        '.top-pop .pop-head b{font-size:13.5px;}' +
        '.top-pop .pop-head a{font-size:11.5px;color:var(--brand-magenta);text-decoration:none;}' +
        '.top-pop .pop-item{display:flex;gap:11px;padding:11px 14px;text-decoration:none;color:var(--fg-0);align-items:flex-start;}' +
        '.top-pop .pop-item:hover{background:var(--bg-2);}' +
        '.top-pop .pop-item.unread{background:oklch(from var(--brand-magenta) l c h / 0.05);}' +
        '.top-pop .pop-ic{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}' +
        '.top-pop .pop-ic svg{width:15px;height:15px;}' +
        '.top-pop .pop-body .t{font-size:12.5px;line-height:1.45;}' +
        '.top-pop .pop-body .when{font-family:"JetBrains Mono",monospace;font-size:10px;color:var(--fg-3);margin-top:3px;}' +
        '.pop-catcher{position:fixed;inset:0;z-index:65;display:none;}' +
        '.pop-catcher.open{display:block;}' +
        '.theme-toggle[data-tb-built]{display:inline-flex;padding:3px;background:var(--bg-1);border:1px solid var(--line);border-radius:10px;gap:2px;}' +
        '.theme-toggle[data-tb-built] button{appearance:none;border:0;background:transparent;color:var(--fg-2);width:30px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;cursor:pointer;}' +
        '.theme-toggle[data-tb-built] button[aria-pressed="true"]{background:var(--bg-3);color:var(--fg-0);}' +
        '.top-av[data-tb-built]{display:flex;align-items:center;gap:10px;cursor:pointer;padding:4px 10px 4px 4px;border-radius:999px;border:1px solid var(--line);background:var(--bg-1);}' +
        '.top-av[data-tb-built]:hover{background:var(--bg-2);}' +
        '.top-av[data-tb-built] .av{width:30px;height:30px;border-radius:50%;background:var(--grad-cool);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12.5px;color:#fff;}' +
        '.top-av[data-tb-built] .name{font-size:13px;font-weight:500;color:var(--fg-0);}';
      document.head.appendChild(css);
    }

    function svgIc(inner, w) {
      return '<svg width="' + (w || 16) + '" height="' + (w || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
    }

    /* --- search (working, shared index) --- */
    // drop old non-functional search triggers (duplicate search points)
    bar.querySelectorAll(".search-trigger").forEach(function (b) { b.remove(); });
    if (!bar.querySelector(".search")) {
      var sw = document.createElement("div");
      sw.className = "search"; sw.id = "gsearch";
      sw.setAttribute("data-tb-built", "1");
      sw.innerHTML = '<span class="icon">' + svgIc('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>') + '</span>' +
        '<input type="text" id="gsearch-input" placeholder="ค้นหาคอร์ส ข้อสอบ หรือหน้าต่างๆ..." autocomplete="off" role="combobox" aria-expanded="false" aria-controls="gsearch-drop" />' +
        '<span class="kbd">⌘K</span><div class="gs-drop" id="gsearch-drop" role="listbox"></div>';
      if (crumb && crumb.nextSibling) bar.insertBefore(sw, crumb.nextSibling);
      else bar.insertBefore(sw, actions);
      wireSearch(sw);
    }

    /* --- theme toggle --- */
    if (!actions.querySelector(".theme-toggle")) {
      var tt = document.createElement("div");
      tt.className = "theme-toggle"; tt.setAttribute("role", "tablist"); tt.setAttribute("aria-label", "Theme");
      tt.setAttribute("data-tb-built", "1");
      tt.innerHTML =
        '<button data-set="light" aria-pressed="false" id="btn-light" aria-label="Light">' + svgIc('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>', 14) + '</button>' +
        '<button data-set="dark" aria-pressed="true" id="btn-dark" aria-label="Dark">' + svgIc('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>', 14) + '</button>';
      actions.insertBefore(tt, actions.firstChild);
      var rootEl = document.documentElement;
      var btns = tt.querySelectorAll("button");
      function setTheme(t) {
        rootEl.setAttribute("data-theme", t);
        try { localStorage.setItem("ming-theme", t); } catch (e) {}
        sync(t);
      }
      function sync(t) {
        btns.forEach(function (b) {
          var dark = b.dataset.set === "dark";
          var isDark = t === "petronas" || t === "dark";
          b.setAttribute("aria-pressed", (dark ? isDark : !isDark) ? "true" : "false");
        });
      }
      btns.forEach(function (b) {
        b.addEventListener("click", function () { setTheme(b.dataset.set === "dark" ? "petronas" : "petronas-light"); });
      });
      sync(rootEl.getAttribute("data-theme") || "petronas-light");
    }

    /* --- notifications popover --- */
    // drop bare bell/message buttons left from older hand-built topbars
    actions.querySelectorAll('.icon-btn[aria-label="Notifications"], .icon-btn[aria-label="การแจ้งเตือน"], .icon-btn[aria-label="ข้อความ"], .icon-btn[aria-label="Messages"]').forEach(function (b) {
      if (!b.closest(".top-pop")) b.remove();
    });
    if (!actions.querySelector("#pop-notif")) {
      var np = document.createElement("div");
      np.className = "top-pop"; np.id = "pop-notif";
      np.setAttribute("data-tb-built", "1");
      np.innerHTML = '<button class="icon-btn" id="btn-notif" aria-label="การแจ้งเตือน" aria-haspopup="true" aria-expanded="false">' +
        svgIc('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>') + '<span class="dot"></span></button>';
      var avEl = actions.querySelector(".top-av");
      actions.insertBefore(np, avEl || null);
      var NOTIFS = [
        { ic: svgIc('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>').replace('currentColor', '#fff').replace('currentColor', '#fff'), bg: 'var(--subj-tpat3-grad)', t: 'ข้อสอบ <b>TPAT3 ชุดใหม่</b> ปล่อยแล้ว 3 ชุด', when: '5 นาทีที่แล้ว', unread: true },
        { ic: '<svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="m12 2 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>', bg: 'var(--subj-tgat2-grad)', t: 'ปลดล็อกเหรียญ <b>เรียนครบ 7 วันติด</b> 🔥', when: '2 ชม. ที่แล้ว', unread: true },
        { ic: svgIc('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>').replace('currentColor', '#fff').replace('currentColor', '#fff'), bg: 'var(--subj-phys-grad)', t: 'คลาสสด <b>ฟิสิกส์ กลศาสตร์</b> เริ่ม 20:00 คืนนี้', when: 'พรุ่งนี้' }
      ];
      var pop = document.createElement("div");
      pop.className = "pop"; pop.setAttribute("role", "menu");
      /* การแจ้งเตือนไม่มีหน้าแยกแล้ว — รวมอยู่ในแท็บ "การแจ้งเตือน" ของ Settings */
      pop.innerHTML = '<div class="pop-head"><b>การแจ้งเตือน</b><a href="Settings.html#notif">อ่านทั้งหมด</a></div>' +
        NOTIFS.map(function (n) {
          return '<a class="pop-item' + (n.unread ? ' unread' : '') + '" href="Settings.html#notif"><span class="pop-ic" style="background:' + n.bg + '">' + n.ic + '</span><div class="pop-body"><div class="t">' + n.t + '</div><div class="when">' + n.when + '</div></div></a>';
        }).join('');
      np.appendChild(pop);
      var catcher = document.createElement("div"); catcher.className = "pop-catcher";
      document.body.appendChild(catcher);
      function closeNp() { np.classList.remove("open"); catcher.classList.remove("open"); np.querySelector(".icon-btn").setAttribute("aria-expanded", "false"); }
      np.querySelector(".icon-btn").addEventListener("click", function (e) {
        e.stopPropagation();
        var opening = !np.classList.contains("open");
        closeNp();
        if (opening) { np.classList.add("open"); catcher.classList.add("open"); np.querySelector(".icon-btn").setAttribute("aria-expanded", "true"); }
      });
      catcher.addEventListener("click", closeNp);
      window.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNp(); });
    }

    /* --- avatar --- */
    if (!actions.querySelector(".top-av")) {
      var ta = document.createElement("div");
      ta.className = "top-av";
      ta.setAttribute("data-tb-built", "1");
      ta.innerHTML = '<div class="av">ปม</div><div class="name">น้องปาล์ม</div>' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--fg-3)"><path d="m6 9 6 6 6-6"/></svg>';
      actions.appendChild(ta);
    }
  }

  function wireSearch(sw) {
    sw.__gsWired = true;
    var input = sw.querySelector("input");
    var drop = sw.querySelector(".gs-drop");
    if (!input || !drop || input.__gsWired) return;
    input.__gsWired = true;
    var ICONS = {
      course: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
      exam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13l2 2 4-4"/></svg>',
      page: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'
    };
    var INDEX = [
      { cat: 'คอร์ส', t: 'คณิต ครูหมิง', s: 'A-Level · ม.4 ม.5 ม.6', href: 'Browse Courses.html', bg: 'var(--subj-math-grad)', ic: 'course', kw: 'math คณิตศาสตร์ a-level alevel' },
      { cat: 'คอร์ส', t: 'ฟิสิกส์ ครูหมิง', s: 'A-Level · ม.4 ม.5 ม.6', href: 'Browse Courses.html', bg: 'var(--subj-phys-grad)', ic: 'course', kw: 'physics ฟิสิกส์' },
      { cat: 'คอร์ส', t: 'TPAT3 ครูหมิง', s: 'วิทย์ เทคโนโลยี วิศวกรรม', href: 'Browse Courses.html', bg: 'var(--subj-tpat3-grad)', ic: 'course', kw: 'tpat3 tpat วิศวะ' },
      { cat: 'คอร์ส', t: 'TGAT2 ครูหมิง', s: 'การคิดอย่างมีเหตุผล', href: 'Browse Courses.html', bg: 'var(--subj-tgat2-grad)', ic: 'course', kw: 'tgat2 tgat เหตุผล' },
      { cat: 'ข้อสอบ', t: 'คลังข้อสอบ', s: 'ทำข้อสอบจับเวลา + เฉลยละเอียด', href: 'Exams.html', bg: 'var(--subj-tpat3-grad)', ic: 'exam', kw: 'exam ข้อสอบ เฉลย mock' },
      { cat: 'เครื่องมือ', t: 'คำนวณ TCAS', s: 'เช็กโอกาสติด + จัด 10 อันดับ', href: 'TCAS.html', bg: 'var(--grad-cool)', ic: 'page', kw: 'tcas โอกาสติด อันดับ คำนวณ' },
      { cat: 'หน้า', t: 'คอร์สของฉัน', s: '7 คอร์สที่เรียนอยู่', href: 'My Courses.html', bg: 'var(--grad-signature)', ic: 'page', kw: 'my courses เรียน' },
      { cat: 'หน้า', t: 'คอร์สทั้งหมด', s: 'ดูคอร์สทุกวิชา', href: 'Browse Courses.html', bg: 'var(--grad-signature)', ic: 'page', kw: 'browse ทั้งหมด สมัคร' },
      { cat: 'หน้า', t: 'อันดับ', s: 'Leaderboard ประจำสัปดาห์', href: 'Leaderboard.html', bg: 'var(--grad-signature)', ic: 'page', kw: 'leaderboard อันดับ แข่ง' },
      { cat: 'หน้า', t: 'ความสำเร็จ', s: 'เหรียญและความสำเร็จ', href: 'Achievements.html', bg: 'var(--grad-signature)', ic: 'page', kw: 'achievement เหรียญ badge' },
      { cat: 'หน้า', t: 'โปรไฟล์ & ตั้งค่า', s: 'บัญชี · การชำระเงิน', href: 'Settings.html', bg: 'var(--grad-signature)', ic: 'page', kw: 'settings ตั้งค่า โปรไฟล์ ชำระเงิน billing' }
    ];
    var sel = -1, items = [];
    function esc(s) { return s.replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
    function hi(t, q) {
      var i = t.toLowerCase().indexOf(q.toLowerCase());
      if (i < 0) return esc(t);
      return esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length));
    }
    function open() { drop.classList.add("open"); input.setAttribute("aria-expanded", "true"); }
    function close() { drop.classList.remove("open"); input.setAttribute("aria-expanded", "false"); sel = -1; }
    function render() {
      var q = input.value.trim();
      if (!q) { close(); return; }
      var hits = INDEX.filter(function (x) { return (x.t + ' ' + x.s + ' ' + x.kw).toLowerCase().indexOf(q.toLowerCase()) >= 0; }).slice(0, 8);
      if (!hits.length) { drop.innerHTML = '<div class="gs-none">ไม่พบ "' + esc(q) + '" — ลองคำอื่น เช่น ชื่อวิชา หรือ TCAS</div>'; open(); items = []; sel = -1; return; }
      var h = '', lastCat = '';
      hits.forEach(function (x) {
        if (x.cat !== lastCat) { h += '<div class="gs-cat">' + x.cat + '</div>'; lastCat = x.cat; }
        h += '<a href="' + x.href + '" style="--gi-bg:' + x.bg + '"><span class="gi">' + ICONS[x.ic] + '</span><span class="gt"><b>' + hi(x.t, q) + '</b><small>' + esc(x.s) + '</small></span></a>';
      });
      drop.innerHTML = h;
      items = [].slice.call(drop.querySelectorAll("a"));
      sel = -1; open();
    }
    input.addEventListener("input", render);
    input.addEventListener("focus", render);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { close(); input.blur(); return; }
      if (!items.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        sel = e.key === "ArrowDown" ? (sel + 1) % items.length : (sel - 1 + items.length) % items.length;
        items.forEach(function (a, i) { a.classList.toggle("sel", i === sel); });
      } else if (e.key === "Enter" && sel >= 0) { e.preventDefault(); items[sel].click(); }
    });
    document.addEventListener("click", function (e) { if (!e.target.closest("#gsearch") && !sw.contains(e.target)) close(); });
    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); input.focus(); input.select(); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
