/* ==========================================================================
   Mingsmileyface · Batch 7 · Cluster B — Notifications (shared)
   In-app only (per brief). Single source of truth + bell badge + dropdown
   panel that auto-injects into ANY page and binds [data-notif-bell].
   Reads MingPeople (people.js) for social-notification avatars.
   Fixed popover shown via display-toggle + transform-only keyframe (opacity
   kept solid) — this engine stalls opacity transitions on fixed/high-z nodes.
   --------------------------------------------------------------------------
   DATA CONTRACT (backend ⚠️ to add — no manual states, mirrors CLAUDE.md):
     Notification {
       id      : string
       type    : 'lesson'|'exam'|'payment'|'streak'|'achievement'|'social'|'system'
       title   : string
       body    : string
       ts      : ISO-8601           // server time
       read    : boolean
       href    : string             // deep-link to the relevant page
       actorId?: string             // people.js id (type='social') → avatar
       meta?   : object             // type-specific: {score}, {amount}, {badge}, {level}
     }
     GET  /api/notifications?cursor=&filter=all|unread   → { items, nextCursor }
     GET  /api/notifications/unread-count                → { count }   (poll/SSE → bell)
     POST /api/notifications/read   { ids:[...] | all:true }
     Payment notifications only ever reflect สำเร็จ / หมดอายุ — never a
     manual-review "pending" state.
   ========================================================================== */
(function () {
  "use strict";
  var P = window.MingPeople || null;
  var NOW = Date.now(), MIN = 60000, HR = 3600000, DAY = 86400000;

  /* ---- roster of notifications (newest first; mAgo = minutes ago) -------- */
  var RAW = [
    { id:"n1",  type:"social",      mAgo:4,            read:false, actorId:"thanakorn",
      title:"ธนกร แซงอันดับคุณแล้ว", body:"ขยับขึ้นมาอยู่อันดับ 8 ของสัปดาห์ — ไล่กลับให้ทันได้นะ", href:"Leaderboard.html" },
    { id:"n2",  type:"lesson",      mAgo:22,           read:false,
      title:"บทเรียนใหม่มาแล้ว", body:"พี่หมิงเพิ่งปล่อยคลิป “อนุพันธ์ขั้นสูง” ในคอร์ส A-Level คณิต 1", href:"Learn.html" },
    { id:"n3",  type:"exam",        mAgo:50,           read:false, meta:{ score:78 },
      title:"ตรวจข้อสอบเสร็จแล้ว", body:"TPAT3 ชุดที่ 3 — ได้ 78/100 ดูเฉลยแบบละเอียดได้เลย", href:"Exam Result.html" },
    { id:"n4",  type:"achievement", mAgo:135,          read:false, meta:{ badge:"สตรีค 7 วัน" },
      title:"ปลดล็อกเหรียญใหม่", body:"“สตรีค 7 วัน” — เรียนต่อเนื่องครบสัปดาห์แล้ว สุดยอด!", href:"Achievements.html" },
    { id:"n5",  type:"payment",     mAgo:185,          read:true,  meta:{ amount:1890, status:"paid" },
      title:"ชำระเงินสำเร็จ", body:"คอร์ส A-Level ฟิสิกส์ · ฿1,890 — เปิดเรียนให้แล้ว เริ่มได้เลย", href:"Settings.html#billing" },
    { id:"n6",  type:"streak",      mAgo:300,          read:true,
      title:"อย่าลืมรักษาสตรีค", body:"เหลืออีก 4 ชม. ก่อนสตรีค 12 วันจะหลุด — เรียนแค่ 30 นาทีก็พอ", href:"Streak & Daily Goal.html" },
    { id:"n7",  type:"social",      mAgo:480,          read:true,  actorId:"baifern",
      title:"ใบเฟิร์น ส่งกำลังใจให้คุณ", body:"“สู้ๆ นะ ใกล้สอบแล้ว เดี๋ยวเราไปด้วยกัน 💪”", href:"Public Profile.html?u=baifern" },
    { id:"n8",  type:"system",      mAgo:60*26,        read:true,
      title:"ประกาศจากทีมงาน", body:"ระบบจะปิดปรับปรุงสั้นๆ เวลา 02:00–03:00 คืนนี้ ขออภัยในความไม่สะดวก", href:"#" },
    { id:"n9",  type:"exam",        mAgo:60*30,        read:true,
      title:"ข้อสอบชุดใหม่เปิดแล้ว", body:"A-Level ฟิสิกส์ · Mock Exam #5 พร้อมให้ลองทำแล้ว", href:"Exams.html" },
    { id:"n10", type:"achievement", mAgo:60*49,        read:true,  meta:{ level:14 },
      title:"เลเวลอัป! ตอนนี้ LV 14", body:"ได้รับ 120 XP จากการเรียนสัปดาห์นี้ — เก่งขึ้นทุกวัน", href:"XP & Level.html" },
    { id:"n11", type:"lesson",      mAgo:60*51,        read:true,
      title:"พี่หมิงตอบคำถามของคุณแล้ว", body:"ในบท “การเคลื่อนที่แบบโพรเจกไทล์” — “คำถามดีมากเลย ลองดูตรงนี้…”", href:"Learn.html" },
    { id:"n12", type:"payment",     mAgo:60*74,        read:true,  meta:{ status:"expired" },
      title:"รายการชำระเงินหมดอายุ", body:"QR PromptPay สำหรับ TGAT2 หมดอายุแล้ว — กดสร้างใหม่ได้ทุกเมื่อ", href:"Settings.html#billing" },
    { id:"n13", type:"social",      mAgo:60*96,        read:true,  actorId:"vee",
      title:"น้องวี เริ่มติดตามคุณ", body:"ตอนนี้เป็นเพื่อนกันแล้ว — แวะไปทักทายกันได้เลย", href:"Public Profile.html?u=vee" }
  ];
  RAW.forEach(function (n) { n.ts = NOW - n.mAgo * MIN; });

  /* ---- type metadata: icon + accent var + label ------------------------- */
  var SVG = {
    lesson:      '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    exam:        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13l2 2 4-4"/>',
    payment:     '<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/>',
    streak:      '<path d="M12 2c1.2 4.2 5 5.2 5 10a5 5 0 1 1-10 0c0-3.2 2-4.2 2-7.2 0 2.2 1.1 3.2 3 3.2-1.1-2.2-1.1-4.2 0-6z"/>',
    achievement: '<path d="m12 2 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
    social:      '<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><path d="M16 11h6M19 8v6"/>',
    system:      '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'
  };
  var TLABEL = { lesson:"บทเรียน", exam:"ข้อสอบ", payment:"การชำระเงิน", streak:"สตรีค", achievement:"ความสำเร็จ", social:"เพื่อน", system:"ระบบ" };

  /* ---- helpers ---------------------------------------------------------- */
  function timeAgo(ts) {
    var d = NOW - ts;
    if (d < 2 * MIN)  return "เมื่อสักครู่";
    if (d < HR)       return Math.floor(d / MIN) + " นาทีที่แล้ว";
    if (d < DAY)      return Math.floor(d / HR) + " ชม.ที่แล้ว";
    if (d < 2 * DAY)  return "เมื่อวาน";
    if (d < 7 * DAY)  return Math.floor(d / DAY) + " วันที่แล้ว";
    return new Date(ts).toLocaleDateString("th-TH", { day:"numeric", month:"short" });
  }
  function bucket(ts) {
    var d = NOW - ts;
    if (d < DAY)     return "today";
    if (d < 2 * DAY) return "yesterday";
    if (d < 7 * DAY) return "week";
    return "earlier";
  }
  var BUCKET_LABEL = { today:"วันนี้", yesterday:"เมื่อวาน", week:"7 วันที่ผ่านมา", earlier:"ก่อนหน้านี้" };

  function avatarHTML(n) {
    if (n.type === "social" && P) {
      var p = P.get(n.actorId);
      if (p) return '<span class="nt-av" style="background:' + p.avBg + '">' + p.ini + '</span>';
    }
    return '<span class="nt-ico t-' + n.type + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (SVG[n.type] || SVG.system) + '</svg></span>';
  }
  function metaChipHTML(n) {
    if (!n.meta) return "";
    if (n.type === "payment" && n.meta.status === "paid")    return '<span class="nt-tag ok">สำเร็จ</span>';
    if (n.type === "payment" && n.meta.status === "expired") return '<span class="nt-tag warn">หมดอายุ</span>';
    if (n.type === "exam" && n.meta.score != null)           return '<span class="nt-tag score">' + n.meta.score + '/100</span>';
    return "";
  }
  /* shared row markup (panel + full page) */
  function rowHTML(n, opts) {
    opts = opts || {};
    return '<a class="nt-row' + (n.read ? "" : " unread") + '" href="' + n.href + '" data-id="' + n.id + '">' +
      avatarHTML(n) +
      '<span class="nt-main">' +
        '<span class="nt-top"><b>' + n.title + '</b>' + metaChipHTML(n) + '</span>' +
        '<span class="nt-body">' + n.body + '</span>' +
        '<span class="nt-time">' + (opts.showType ? '<span class="nt-type">' + TLABEL[n.type] + '</span> · ' : '') + timeAgo(n.ts) + '</span>' +
      '</span>' +
      '<span class="nt-dot" aria-hidden="true"></span>' +
    '</a>';
  }

  /* ---- state + observers ------------------------------------------------ */
  var subs = [];
  function emit() { subs.forEach(function (cb) { try { cb(); } catch (e) {} }); }
  function unread() { return RAW.filter(function (n) { return !n.read; }); }

  window.MingNotif = {
    all: function () { return RAW.slice(); },
    unread: unread,
    unreadCount: function () { return unread().length; },
    get: function (id) { return RAW.find(function (n) { return n.id === id; }) || null; },
    markRead: function (id) { var n = this.get(id); if (n && !n.read) { n.read = true; emit(); } },
    markAllRead: function () { RAW.forEach(function (n) { n.read = true; }); emit(); },
    rowHTML: rowHTML, timeAgo: timeAgo, bucket: bucket, bucketLabel: BUCKET_LABEL,
    typeLabel: TLABEL, onChange: function (cb) { subs.push(cb); }
  };

  /* ---- bell badge + dropdown panel (auto-inject) ------------------------ */
  function injectPanel() {
    if (document.getElementById("nt-panel")) return;
    var c = document.createElement("div"); c.className = "nt-catcher"; c.id = "nt-catcher";
    var panel = document.createElement("div"); panel.className = "nt-panel"; panel.id = "nt-panel";
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "การแจ้งเตือน");
    panel.innerHTML =
      '<div class="nt-head">' +
        '<div class="nt-h-title">การแจ้งเตือน<span class="nt-count" id="nt-count"></span></div>' +
        '<button class="nt-readall" id="nt-readall" type="button">อ่านทั้งหมด</button>' +
      '</div>' +
      '<div class="nt-list" id="nt-list"></div>';
    document.body.appendChild(c); document.body.appendChild(panel);

    c.addEventListener("click", closePanel);
    document.getElementById("nt-readall").addEventListener("click", function (e) { e.stopPropagation(); window.MingNotif.markAllRead(); });

    function renderPanel() {
      var list = document.getElementById("nt-list");
      var items = RAW.slice(0, 6);
      list.innerHTML = items.length ? items.map(function (n) { return rowHTML(n); }).join("") : '<div class="nt-empty-mini">ไม่มีการแจ้งเตือน</div>';
      var uc = unread().length;
      var cnt = document.getElementById("nt-count");
      cnt.textContent = uc ? uc + " ใหม่" : "";
      cnt.style.display = uc ? "" : "none";
      document.getElementById("nt-readall").style.display = uc ? "" : "none";
      bindRowReads(list);
    }
    window.__ntRenderPanel = renderPanel;
    renderPanel();
  }

  function bindRowReads(scope) {
    scope.querySelectorAll(".nt-row").forEach(function (row) {
      row.addEventListener("click", function () { window.MingNotif.markRead(row.dataset.id); });
    });
  }

  function openPanel(bell) {
    injectPanel();
    var panel = document.getElementById("nt-panel"), c = document.getElementById("nt-catcher");
    var r = bell.getBoundingClientRect();
    panel.style.top = (r.bottom + 10) + "px";
    panel.style.right = Math.max(12, window.innerWidth - r.right) + "px";
    c.classList.add("open"); panel.classList.add("open");
  }
  function closePanel() {
    var panel = document.getElementById("nt-panel"), c = document.getElementById("nt-catcher");
    if (panel) panel.classList.remove("open");
    if (c) c.classList.remove("open");
  }

  function updateBells() {
    var uc = unread().length;
    document.querySelectorAll("[data-notif-bell]").forEach(function (bell) {
      var dot = bell.querySelector(".dot");
      if (uc > 0) {
        if (!dot) { dot = document.createElement("span"); dot.className = "dot"; bell.appendChild(dot); }
        dot.classList.add("count"); dot.textContent = uc > 9 ? "9+" : uc;
      } else if (dot) { dot.remove(); }
    });
  }

  function initBells() {
    document.querySelectorAll("[data-notif-bell]").forEach(function (bell) {
      bell.addEventListener("click", function (e) {
        e.stopPropagation();
        var panel = document.getElementById("nt-panel");
        if (panel && panel.classList.contains("open")) closePanel();
        else openPanel(bell);
      });
    });
    updateBells();
    window.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(); });
  }

  window.MingNotif.onChange(function () { updateBells(); if (window.__ntRenderPanel) window.__ntRenderPanel(); });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initBells);
  else initBells();
})();
