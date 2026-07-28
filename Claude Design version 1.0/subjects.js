/* ==========================================================================
   Mingsmileyface · Subjects — SOURCE OF TRUTH ของ 4 วิชา
   --------------------------------------------------------------------------
   กฎ (ดู CLAUDE.md):
     • มี 4 วิชาเท่านั้น ห้ามเพิ่ม ห้ามแยก "A-Level คณิต" ออกจาก "คณิต"
     • ลำดับแสดงผลทุกที่: คณิต -> ฟิสิกส์ -> TPAT3 -> TGAT2
     • เฉพาะ math / phys มี level filter (ม.4 ม.5 ม.6 + A-Level)

   คำศัพท์ที่ต้องแยกให้ขาด:
     id     = คีย์ในโค้ด/DB/URL/data-attr  -> ตัวเล็กเสมอ: math phys tpat3 tgat2
     label  = ข้อความที่นักเรียนเห็นบนจอ   -> คณิต ฟิสิกส์ TPAT3 TGAT2

   ห้ามเขียนคีย์วิชาแบบ hard-code ในหน้าใหม่ ให้อ่านจากไฟล์นี้เท่านั้น
     Subjects.LIST          -> array เรียงตามลำดับแบรนด์แล้ว
     Subjects.byId('tpat3') -> object ของวิชานั้น
     Subjects.label('tpat3')-> 'TPAT3'
     Subjects.IDS           -> ['math','phys','tpat3','tgat2']
   ========================================================================== */
(function (global) {
  'use strict';

  var LIST = [
    {
      id: 'math',
      label: 'คณิต',
      full: 'คณิตศาสตร์',
      tagline: 'ครบทุกระดับ ม.ปลาย + A-Level',
      hasLevels: true,
      color: 'var(--subj-math)',
      fg: 'var(--subj-math-fg)',
      grad: 'var(--subj-math-grad)',
      glyph: '∫'
    },
    {
      id: 'phys',
      label: 'ฟิสิกส์',
      full: 'ฟิสิกส์',
      tagline: 'ครบทุกระดับ ม.ปลาย + A-Level',
      hasLevels: true,
      color: 'var(--subj-phys)',
      fg: 'var(--subj-phys-fg)',
      grad: 'var(--subj-phys-grad)',
      glyph: '⚛'
    },
    {
      id: 'tpat3',
      label: 'TPAT3',
      full: 'TPAT3 ความถนัดวิทยาศาสตร์ เทคโนโลยี วิศวกรรมศาสตร์',
      tagline: 'ความถนัดวิทย์ · เทคโนฯ · วิศวะ',
      hasLevels: false,
      color: 'var(--subj-tpat3)',
      fg: 'var(--subj-tpat3-fg)',
      grad: 'var(--subj-tpat3-grad)',
      glyph: '⌬'
    },
    {
      id: 'tgat2',
      label: 'TGAT2',
      full: 'TGAT2 การคิดอย่างมีเหตุผล',
      tagline: 'การคิดอย่างมีเหตุผล',
      hasLevels: false,
      color: 'var(--subj-tgat2)',
      fg: 'var(--subj-tgat2-fg)',
      grad: 'var(--subj-tgat2-grad)',
      glyph: '∑'
    }
  ];

  /* level filter — ใช้ได้เฉพาะวิชาที่ hasLevels = true */
  var LEVELS = [
    { id: 'm4',     label: 'ม.4' },
    { id: 'm5',     label: 'ม.5' },
    { id: 'm6',     label: 'ม.6' },
    { id: 'alevel', label: 'A-Level' }
  ];

  var byIdMap = {};
  LIST.forEach(function (s) { byIdMap[s.id] = s; });

  function byId(id) { return byIdMap[id] || null; }
  function label(id) { var s = byIdMap[id]; return s ? s.label : id; }

  /* เรียง array ของ id ตามลำดับแบรนด์ */
  function sort(ids) {
    var order = LIST.map(function (s) { return s.id; });
    return ids.slice().sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
  }

  /* ตรวจว่า id ที่ส่งมาถูกต้องไหม — ใช้กัน typo/คีย์เก่าหลุดเข้ามา */
  function isValid(id) { return Object.prototype.hasOwnProperty.call(byIdMap, id); }

  global.Subjects = {
    LIST: LIST,
    LEVELS: LEVELS,
    IDS: LIST.map(function (s) { return s.id; }),
    byId: byId,
    label: label,
    sort: sort,
    isValid: isValid
  };
})(window);
