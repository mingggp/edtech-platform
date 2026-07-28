/* ==========================================================================
   Mingsmileyface · Shared people roster (single source of truth)
   Used by Leaderboard, Dashboard, Public Profile + the floating profile peek.
   Subjects stay within the allowed 6 (CLAUDE.md). No new base colors.
   ========================================================================== */
(function () {
  "use strict";

  var AV = [
    "linear-gradient(160deg,oklch(0.66 0.23 295),oklch(0.55 0.22 320))",
    "linear-gradient(160deg,oklch(0.80 0.18 50),oklch(0.62 0.20 35))",
    "linear-gradient(160deg,oklch(0.78 0.16 145),oklch(0.60 0.18 160))",
    "linear-gradient(160deg,oklch(0.84 0.14 205),oklch(0.60 0.16 220))",
    "linear-gradient(160deg,oklch(0.72 0.22 5),oklch(0.55 0.24 25))",
    "linear-gradient(160deg,oklch(0.74 0.18 320),oklch(0.55 0.20 300))"
  ];

  // grade → default bio fragment
  var GBIO = {
    m4: "นักเรียน ม.4 ที่เพิ่งเริ่มเส้นทางติว — ค่อย ๆ สะสมวันละนิด",
    m5: "เด็ก ม.5 กำลังปูพื้นแน่น ๆ ก่อนขึ้นสนามจริงปีหน้า",
    m6: "เด็ก ม.6 สาย DEK68 ลุยเต็มที่ช่วงโค้งสุดท้ายก่อนสอบ"
  };

  // ---- raw roster --------------------------------------------------------
  // lb:true → appears on the leaderboard (has week/month/all + prev rank).
  var R = [
    { id:"palm", me:true, name:"น้องปาล์ม", full:"ลภัสรดา", handle:"@palm_dek68", ini:"ปม", grade:"m6", lv:14, xp:2840, streak:12, badges:6, subj:"A-Level คณิต", since:"พ.ค. 68", lb:true, week:312, month:1180, all:7200, prev:9, courses:7, lessons:142, hours:120, bio:"เด็ก ม.6 ที่ฝันอยากเข้าวิศวะ จุฬาฯ ติวกับพี่หมิงตั้งแต่ ม.5 — คณิตคืออาวุธ ฟิสิกส์คือเพื่อนสนิท" },
    { id:"thanakorn", name:"ธนกร ว.", full:"ธนกร วงศ์...", handle:"@thanakorn_phys", ini:"ธน", grade:"m6", lv:19, xp:5120, streak:24, badges:11, subj:"A-Level ฟิสิกส์", since:"ก.ค. 68", lb:true, week:540, month:1980, all:14200, prev:1 },
    { id:"baifern", name:"ใบเฟิร์น ส.", handle:"@baifern_math", ini:"ใบ", grade:"m6", lv:21, xp:6380, streak:41, badges:13, subj:"A-Level คณิต", since:"มิ.ย. 68", lb:true, week:498, month:2120, all:15800, prev:3 },
    { id:"phakin", name:"ภคิน ร.", handle:"@phakin", ini:"ภค", grade:"m5", lv:16, xp:3900, streak:12, badges:8, subj:"tpat3", since:"ส.ค. 68", priv:true, lb:true, week:472, month:1760, all:9800, prev:2 },
    { id:"preeya", name:"ปรียา ค.", handle:"@preeya_tgat", ini:"ปร", grade:"m6", lv:17, xp:4300, streak:19, badges:9, subj:"tgat2", since:"ก.ค. 68", lb:true, week:430, month:1620, all:11200, prev:4 },
    { id:"krittamet", name:"กฤตเมธ พ.", handle:"@krittamet", ini:"กฤ", grade:"m5", lv:14, xp:2760, streak:9, badges:6, subj:"ฟิสิกส์ (ม.ปลาย)", since:"ก.ย. 68", lb:true, week:388, month:1450, all:8600, prev:6 },
    { id:"meena", name:"มีนา ท.", handle:"@meena", ini:"มี", grade:"m4", lv:12, xp:2100, streak:15, badges:5, subj:"คณิต (ม.ปลาย)", since:"ต.ค. 68", lb:true, week:350, month:1280, all:5400, prev:5 },
    { id:"warin", name:"วรินทร์ ก.", handle:"@warin", ini:"วร", grade:"m6", lv:13, xp:2480, streak:7, badges:6, subj:"tpat3", since:"ก.ย. 68", priv:true, lb:true, week:286, month:1090, all:6800, prev:7 },
    { id:"naphat", name:"ณภัทร อ.", handle:"@naphat", ini:"ณภ", grade:"m4", lv:11, xp:1840, streak:5, badges:4, subj:"ฟิสิกส์ (ม.ปลาย)", since:"ต.ค. 68", lb:true, week:254, month:980, all:4200, prev:8 },
    { id:"supitcha", name:"สุพิชฌาย์ ม.", handle:"@supitcha", ini:"สุ", grade:"m5", lv:12, xp:2020, streak:8, badges:5, subj:"tgat2", since:"ก.ย. 68", lb:true, week:232, month:870, all:5100, prev:11 },
    { id:"pimchanok", name:"พิมพ์ชนก ด.", handle:"@pim", ini:"พิ", grade:"m4", lv:10, xp:1560, streak:4, badges:3, subj:"คณิต (ม.ปลาย)", since:"พ.ย. 68", lb:true, week:208, month:760, all:3600, prev:10 },
    { id:"arisa", name:"อริสา น.", handle:"@arisa", ini:"อร", grade:"m6", lv:12, xp:2180, streak:6, badges:5, subj:"A-Level ฟิสิกส์", since:"ส.ค. 68", lb:true, week:184, month:690, all:4800, prev:12 },
    { id:"chanakan", name:"ชนกันต์ ภ.", handle:"@chanakan", ini:"ชน", grade:"m5", lv:10, xp:1490, streak:3, badges:3, subj:"tpat3", since:"พ.ย. 68", lb:true, week:156, month:600, all:3100, prev:13 },
    { id:"theeraphat", name:"ธีรภัทร ว.", handle:"@theeraphat", ini:"ธี", grade:"m4", lv:9, xp:1180, streak:5, badges:2, subj:"ฟิสิกส์ (ม.ปลาย)", since:"ธ.ค. 68", lb:true, week:132, month:520, all:2400, prev:15 },
    { id:"naphasorn", name:"นภสร จ.", handle:"@naphasorn", ini:"นภ", grade:"m6", lv:11, xp:1920, streak:2, badges:4, subj:"A-Level คณิต", since:"ต.ค. 68", lb:true, week:98, month:410, all:2900, prev:14 },

    // ---- Dashboard friends (not on the leaderboard) ----
    { id:"nok", name:"น้องนก", handle:"@nok_calc", ini:"นก", grade:"m6", lv:22, xp:6900, streak:31, badges:14, subj:"A-Level คณิต", since:"พ.ค. 68", week:520, status:"กำลังเรียน · A-Level คณิต บทที่ 3", avBg:"linear-gradient(135deg,oklch(0.55 0.22 295),oklch(0.68 0.25 5))" },
    { id:"toon", name:"น้องตูน", handle:"@toon_tpat3", ini:"ตน", grade:"m6", lv:18, xp:4600, streak:16, badges:9, subj:"tpat3", since:"ก.ค. 68", week:410, status:"กำลังทำข้อสอบ · ฟิสิกส์ TPAT3", avBg:"linear-gradient(135deg,oklch(0.74 0.21 35),oklch(0.86 0.20 130))" },
    { id:"mew", name:"น้องมิว", handle:"@mew_phys", ini:"มน", grade:"m5", lv:19, xp:4950, streak:21, badges:10, subj:"ฟิสิกส์ (ม.ปลาย)", since:"มิ.ย. 68", week:445, status:"Live · ติวฟิสิกส์ก่อนสอบ", avBg:"linear-gradient(135deg,oklch(0.80 0.16 205),oklch(0.55 0.22 295))" },
    { id:"jay", name:"น้องเจ", handle:"@jay", ini:"จร", grade:"m6", lv:24, xp:7600, streak:38, badges:16, subj:"A-Level ฟิสิกส์", since:"เม.ย. 68", week:560, status:"ออนไลน์ · พักอยู่", avBg:"linear-gradient(135deg,oklch(0.66 0.23 295),oklch(0.80 0.16 205))" },
    { id:"vee", name:"น้องวี", handle:"@vee", ini:"วน", grade:"m5", lv:31, xp:11200, streak:54, badges:19, subj:"tgat2", since:"ก.พ. 68", week:610, status:"ออนไลน์ · ดูคอร์สอยู่", avBg:"linear-gradient(135deg,oklch(0.78 0.20 50),oklch(0.86 0.20 130))" },
    { id:"boss", name:"น้องบอส", handle:"@boss", ini:"บส", grade:"m4", lv:12, xp:2050, streak:6, badges:5, subj:"คณิต (ม.ปลาย)", since:"ต.ค. 68", week:190, status:"ออนไลน์ครั้งสุดท้าย 2 ชม.", avBg:"linear-gradient(135deg,oklch(0.45 0.18 145),oklch(0.55 0.20 130))" },
    { id:"peach", name:"น้องพีช", handle:"@peach", ini:"พช", grade:"m5", lv:15, xp:3200, streak:11, badges:7, subj:"ฟิสิกส์ (ม.ปลาย)", since:"ส.ค. 68", priv:true, week:240, status:"ออนไลน์ครั้งสุดท้ายเมื่อวาน", avBg:"linear-gradient(135deg,oklch(0.55 0.22 295),oklch(0.66 0.23 295))" },
    { id:"koff", name:"น้องกอฟ", full:"กฤษฎา", handle:"@koff", ini:"กฟ", grade:"m6", lv:16, xp:3180, streak:13, badges:8, subj:"A-Level ฟิสิกส์", since:"ก.ค. 68", week:300, avBg:"linear-gradient(135deg,oklch(0.80 0.16 205),oklch(0.86 0.20 130))" },
    { id:"lily", name:"น้องลิลลี่", full:"ลฎาภา", handle:"@lily", ini:"ลล", grade:"m5", lv:15, xp:3020, streak:9, badges:7, subj:"tgat2", since:"ก.ย. 68", week:270, avBg:"linear-gradient(135deg,oklch(0.74 0.21 35),oklch(0.78 0.20 50))" },
    { id:"fluke", name:"น้องฟลุ๊ค", full:"ฟลุ๊ค", handle:"@fluke", ini:"ฟล", grade:"m4", lv:14, xp:2940, streak:7, badges:6, subj:"คณิต (ม.ปลาย)", since:"ต.ค. 68", week:255, avBg:"linear-gradient(135deg,oklch(0.55 0.22 295),oklch(0.80 0.16 205))" }
  ];

  // ---- normalize: fill derived fields ------------------------------------
  var byId = {};
  R.forEach(function (p, i) {
    if (!p.avBg) p.avBg = AV[i % AV.length];
    if (p.hours == null) p.hours = Math.round((p.all || (p.week || 120) * 9) / 60);
    if (p.courses == null) p.courses = 3 + (p.lv % 6);
    if (p.lessons == null) p.lessons = p.lv * 8 + p.badges * 4;
    /* p.subj เก็บ "คีย์" (math/phys/tpat3/tgat2) — เวลาแสดงผลต้องแปลงเป็น label
       ผ่าน subjects.js เสมอ ห้ามเอาคีย์ไปโชว์ตรงๆ */
    p.subjLabel = (window.Subjects ? window.Subjects.label(p.subj) : p.subj);
    if (!p.bio) p.bio = GBIO[p.grade] + " — วิชาเด่นคือ " + p.subjLabel;
    if (!p.handle) p.handle = "@" + p.id;
    p.gradeLabel = { m4:"ม.4", m5:"ม.5", m6:"ม.6" }[p.grade];
    byId[p.id] = p;
  });

  // weekly rank across the leaderboard cohort (for peek rank chip outside LB)
  var lbList = R.filter(function (p) { return p.lb; }).slice().sort(function (a, b) { return b.week - a.week; });
  lbList.forEach(function (p, i) { p.rankWeek = i + 1; });

  window.MingPeople = {
    get: function (id) { return byId[id] || null; },
    all: function () { return R.slice(); },
    lb: function () { return R.filter(function (p) { return p.lb; }).map(function (p) { return p; }); }
  };
})();
