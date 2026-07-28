/* ==========================================================================
   Mingsmileyface · Courses — SOURCE OF TRUTH ของคอร์สทั้งหมด
   --------------------------------------------------------------------------
   เดิมรายชื่อคอร์สถูก copy ไว้ 3 ที่ (Courses.html / Browse Courses.html /
   Course Detail.html) แล้วเริ่มไม่ตรงกัน — ตอนนี้รวมมาไว้ที่ไฟล์นี้ที่เดียว
   แก้ราคา/ชื่อ/จำนวนบท ที่นี่แล้วทุกหน้าเปลี่ยนตาม

   โครงสร้าง 1 คอร์ส (ตรงกับตาราง Course ที่จะทำใน backend):
     id        คีย์คอร์ส (ใช้ใน URL: Course Detail.html?c=<id>)
     subj      คีย์วิชา — math | phys | tpat3 | tgat2  (ดู subjects.js)
     level     ระดับ — m4 | m5 | m6 | alevel | null (tpat3/tgat2 ไม่มีระดับ)
     name      ชื่อคอร์สแบบสั้น (การ์ด)
     meta      บรรทัดย่อยบนการ์ด
     glyph     สัญลักษณ์บนปกคอร์ส
     ribbon    hot | new | rec | free | (ไม่ใส่ = ไม่มีริบบิ้น)
     free      true = คอร์สฟรี
     rating    ตัวเลข เช่น 4.9  — เวลาแสดงใช้ .toFixed(1)
     reviews   จำนวนรีวิว (ตัวเลขล้วน) — หน้า detail เติมคำว่า "รีวิว" เอง
     students  จำนวนนักเรียน (string มีลูกน้ำ)
     hours     '18 ชม.'      lessons  '24 บท'
     priceNow  ราคาปัจจุบัน   priceOld ราคาก่อนลด (null = ไม่มี)
     detail    ข้อมูลเฉพาะหน้ารายละเอียด
       subject      หัวข้อเหนือชื่อคอร์ส เช่น 'คณิต · A-LEVEL'
       badge        ป้าย เช่น 'BESTSELLER' ('' = ไม่มี)
       title        ชื่อเต็มแบบมี HTML (<br/> / <span class="grad">)
       tagline      ย่อหน้าแนะนำคอร์ส
       lessonsLong  '24 บทเรียน'
       levelText    ข้อความระดับ เช่น 'ม.6 · เตรียมสอบ'
       statLevel    ระดับแบบสั้นในแถบสถิติ เช่น 'ม.6'

   วิธีใช้:
     Courses.LIST                 array เรียงตามลำดับที่จะโชว์
     Courses.byId('math-trig')    คอร์สเดียว
     Courses.bySubject('math')    กรองตามวิชา
   ========================================================================== */
(function (global) {
  'use strict';

  var LIST = [
  {
    id: 'amath-calculus',
    subj: 'math',
    level: 'alevel',
    name: 'แคลคูลัส · ขั้นเทพ',
    meta: '24 บท · ม.6 · พี่หมิง',
    glyph: '∫',
    ribbon: 'hot',
    rating: 4.9,
    reviews: 412,
    students: '1,820',
    hours: '18 ชม.',
    lessons: '24 บท',
    priceNow: 2490,
    priceOld: 3990,
    detail: {
      subject: 'คณิต · A-LEVEL',
      badge: 'BESTSELLER',
      title: 'แคลคูลัส<br/>ฉบับเข้าใจ <span class="grad">ภายใน 30 วัน</span>',
      tagline: 'เริ่มจากศูนย์ — ไล่ขั้นจาก ลิมิต → อนุพันธ์ → ปริพันธ์ → โจทย์รวมแนวข้อสอบ. คอร์สที่นักเรียนพี่หมิงสอบติด <b style="color:#fff;font-weight:600">วิศวะ จุฬาฯ</b> มากที่สุดในปีที่ผ่านมา.',
      lessonsLong: '24 บทเรียน',
      levelText: 'ม.6 · เตรียมสอบ',
      statLevel: 'ม.6'
    }
  },
  {
    id: 'amath-alevel1',
    subj: 'math',
    level: 'alevel',
    name: 'A-Level คณิต 1 · ฉบับเก็บคะแนน',
    meta: '22 บท · เตรียมสอบ · พี่หมิง',
    glyph: '∫',
    ribbon: 'rec',
    rating: 4.9,
    reviews: 564,
    students: '1,640',
    hours: '20 ชม.',
    lessons: '22 บท',
    priceNow: 1990,
    priceOld: 2990,
    detail: {
      subject: 'คณิต · A-LEVEL คณิต 1',
      badge: 'แนะนำ',
      title: 'A-Level คณิต 1<br/><span class="grad">ฉบับเก็บคะแนน</span>',
      tagline: 'ครบทุกบทที่ออกใน A-Level คณิตประยุกต์ 1 — เน้นโจทย์เก็บคะแนนและเทคนิคทำเร็ว.',
      lessonsLong: '22 บทเรียน',
      levelText: 'เตรียมสอบ · TCAS',
      statLevel: 'เตรียมสอบ'
    }
  },
  {
    id: 'math-trig',
    subj: 'math',
    level: 'm5',
    name: 'ตรีโกณมิติ ม.5 เทอม 1',
    meta: '10 บท · ม.5 · พี่หมิง',
    glyph: 'π',
    ribbon: 'free',
    free: true,
    rating: 5,
    reviews: 682,
    students: '3,140',
    hours: '7 ชม.',
    lessons: '10 บท',
    priceNow: 0,
    priceOld: null,
    detail: {
      subject: 'คณิต · ม.5',
      badge: 'ฟรี',
      title: 'ตรีโกณมิติ<br/>ม.5 <span class="grad">เทอม 1</span>',
      tagline: 'ปูพื้นตรีโกณมิติให้แน่นตั้งแต่ในห้องเรียน — คอร์สฟรีให้ลองสัมผัสวิธีสอนของพี่หมิงก่อน.',
      lessonsLong: '10 บทเรียน',
      levelText: 'ม.5 · ในเทอม',
      statLevel: 'ม.5'
    }
  },
  {
    id: 'math-func',
    subj: 'math',
    level: 'm4',
    name: 'ฟังก์ชัน & ลอการิทึม',
    meta: '12 บท · ม.4 · พี่หมิง',
    glyph: '∫',
    ribbon: 'rec',
    rating: 4.9,
    reviews: 204,
    students: '1,360',
    hours: '9 ชม.',
    lessons: '12 บท',
    priceNow: 1190,
    priceOld: null,
    detail: {
      subject: 'คณิต · ม.4',
      badge: '',
      title: 'ฟังก์ชัน &amp; <span class="grad">ลอการิทึม</span>',
      tagline: 'ปูพื้นฟังก์ชัน เอกซ์โพเนนเชียล และลอการิทึมสำหรับ ม.4 — เข้าใจนิยาม กราฟ และการแก้สมการก่อนขึ้นบทยาก.',
      lessonsLong: '12 บทเรียน',
      levelText: 'ม.4',
      statLevel: 'ม.4'
    }
  },
  {
    id: 'math-stats',
    subj: 'math',
    level: 'm6',
    name: 'ความน่าจะเป็นและสถิติ',
    meta: '14 บท · ม.6 · พี่หมิง',
    glyph: 'π',
    rating: 4.8,
    reviews: 312,
    students: '1,124',
    hours: '11 ชม.',
    lessons: '14 บท',
    priceNow: 1790,
    priceOld: null,
    detail: {
      subject: 'คณิต · ม.6',
      badge: '',
      title: 'ความน่าจะเป็น<br/>และ<span class="grad">สถิติ</span>',
      tagline: 'เก็บครบความน่าจะเป็นและสถิติ ม.6 — เข้าใจคอนเซปต์ ไม่ใช่ท่องสูตร พร้อมโจทย์หลากหลาย.',
      lessonsLong: '14 บทเรียน',
      levelText: 'ม.6 · ในเทอม',
      statLevel: 'ม.6'
    }
  },
  {
    id: 'aphys-full',
    subj: 'phys',
    level: 'alevel',
    name: 'A-Level ฟิสิกส์ · ครบสนามสอบ',
    meta: '24 บท · เตรียมสอบ · พี่หมิง',
    glyph: 'Φ',
    ribbon: 'hot',
    rating: 4.9,
    reviews: 498,
    students: '1,510',
    hours: '21 ชม.',
    lessons: '24 บท',
    priceNow: 2290,
    priceOld: 3490,
    detail: {
      subject: 'ฟิสิกส์ · A-LEVEL',
      badge: 'BESTSELLER',
      title: 'A-Level ฟิสิกส์<br/>ครบ<span class="grad">สนามสอบ</span>',
      tagline: 'ครบทุกบทของ A-Level ฟิสิกส์ — กลศาสตร์ ไฟฟ้า คลื่น ความร้อน ฟิสิกส์ยุคใหม่ พร้อมโจทย์ข้อสอบจริง.',
      lessonsLong: '24 บทเรียน',
      levelText: 'เตรียมสอบ · TCAS',
      statLevel: 'เตรียมสอบ'
    }
  },
  {
    id: 'aphys-mechanics',
    subj: 'phys',
    level: 'alevel',
    name: 'กลศาสตร์ & โมเมนตัม · A-Level',
    meta: '18 บท · เตรียมสอบ · พี่หมิง',
    glyph: 'Φ',
    rating: 4.8,
    reviews: 276,
    students: '928',
    hours: '15 ชม.',
    lessons: '18 บท',
    priceNow: 1990,
    priceOld: null,
    detail: {
      subject: 'ฟิสิกส์ · A-LEVEL',
      badge: '',
      title: 'กลศาสตร์ &amp; โมเมนตัม<br/><span class="grad">A-Level</span>',
      tagline: 'เจาะลึกกลศาสตร์และโมเมนตัมสำหรับ A-Level ฟิสิกส์ — เข้าใจหลักการ ทำโจทย์ยากได้.',
      lessonsLong: '18 บทเรียน',
      levelText: 'เตรียมสอบ · TCAS',
      statLevel: 'เตรียมสอบ'
    }
  },
  {
    id: 'phys-kinematics',
    subj: 'phys',
    level: 'm4',
    name: 'จลนศาสตร์เบื้องต้น',
    meta: '12 บท · ม.4 · พี่หมิง',
    glyph: 'Φ',
    ribbon: 'rec',
    rating: 4.8,
    reviews: 168,
    students: '742',
    hours: '9 ชม.',
    lessons: '12 บท',
    priceNow: 1290,
    priceOld: null,
    detail: {
      subject: 'ฟิสิกส์ · ม.4',
      badge: '',
      title: 'จลนศาสตร์<br/><span class="grad">เบื้องต้น</span>',
      tagline: 'เริ่มต้นฟิสิกส์ ม.4 ด้วยการเคลื่อนที่แนวตรง ความเร็ว ความเร่ง และกราฟการเคลื่อนที่ — พื้นฐานที่ใช้ต่อทุกบท.',
      lessonsLong: '12 บทเรียน',
      levelText: 'ม.4',
      statLevel: 'ม.4'
    }
  },
  {
    id: 'phys-electric',
    subj: 'phys',
    level: 'm5',
    name: 'ไฟฟ้าสถิตและกระแส',
    meta: '16 บท · ม.5 · พี่หมิง',
    glyph: 'g',
    rating: 4.7,
    reviews: 238,
    students: '962',
    hours: '12 ชม.',
    lessons: '16 บท',
    priceNow: 1790,
    priceOld: 2490,
    detail: {
      subject: 'ฟิสิกส์ · ม.5',
      badge: '',
      title: 'ไฟฟ้าสถิต<br/>และ<span class="grad">กระแส</span>',
      tagline: 'เข้าใจไฟฟ้าสถิตและไฟฟ้ากระแสแบบเห็นภาพ — ปูพื้นแน่นก่อนต่อ A-Level และ TPAT3.',
      lessonsLong: '16 บทเรียน',
      levelText: 'ม.5 · ในเทอม',
      statLevel: 'ม.5'
    }
  },
  {
    id: 'phys-wave',
    subj: 'phys',
    level: 'm6',
    name: 'คลื่นและเสียง · เต็มรูป',
    meta: '14 บท · ม.6 · พี่หมิง',
    glyph: 'g',
    rating: 4.8,
    reviews: 204,
    students: '786',
    hours: '12 ชม.',
    lessons: '14 บท',
    priceNow: 1890,
    priceOld: null,
    detail: {
      subject: 'ฟิสิกส์ · ม.6',
      badge: '',
      title: 'คลื่นและเสียง<br/><span class="grad">เต็มรูป</span>',
      tagline: 'ครบเรื่องคลื่นกล คลื่นเสียง และปรากฏการณ์ที่ออกสอบบ่อย — เข้าใจตั้งแต่ในห้องเรียน.',
      lessonsLong: '14 บทเรียน',
      levelText: 'ม.6 · ในเทอม',
      statLevel: 'ม.6'
    }
  },
  {
    id: 'tpat3-latest',
    subj: 'tpat3',
    level: null,
    name: 'ตะลุย TPAT3 ปีล่าสุด',
    meta: '20 บท · เตรียมสอบ · พี่หมิง',
    glyph: '∂',
    ribbon: 'hot',
    rating: 4.9,
    reviews: 722,
    students: '2,180',
    hours: '22 ชม.',
    lessons: '20 บท',
    priceNow: 2290,
    priceOld: 3490,
    detail: {
      subject: 'TPAT3 · ความถนัดวิทย์',
      badge: 'BESTSELLER',
      title: 'ตะลุย TPAT3<br/><span class="grad">ปีล่าสุด</span>',
      tagline: 'รวมแนวข้อสอบ TPAT3 ปีล่าสุดทุกพาร์ต — ฟิสิกส์ เคมีพื้นฐานการคำนวณ ตรรกะ และมิติสัมพันธ์ พร้อมเฉลยละเอียด.',
      lessonsLong: '20 บทเรียน',
      levelText: 'เตรียมสอบ · TCAS',
      statLevel: 'เตรียมสอบ'
    }
  },
  {
    id: 'tpat3-logic',
    subj: 'tpat3',
    level: null,
    name: 'TPAT3 · ตรรกะวิศวกร',
    meta: '14 บท · เตรียมสอบ · พี่หมิง',
    glyph: '⌬',
    rating: 4.9,
    reviews: 388,
    students: '1,420',
    hours: '12 ชม.',
    lessons: '14 บท',
    priceNow: 1890,
    priceOld: null,
    detail: {
      subject: 'TPAT3 · ตรรกะ',
      badge: 'แนะนำ',
      title: 'TPAT3<br/>ตรรกะ<span class="grad">วิศวกร</span>',
      tagline: 'ฝึกการคิดเชิงตรรกะและมิติสัมพันธ์แบบที่ TPAT3 ชอบออก — เห็นโจทย์ปุ๊บรู้วิธีคิดปั๊บ.',
      lessonsLong: '14 บทเรียน',
      levelText: 'เตรียมสอบ · TCAS',
      statLevel: 'เตรียมสอบ'
    }
  },
  {
    id: 'tpat3-mock',
    subj: 'tpat3',
    level: null,
    name: 'ข้อสอบจำลอง TPAT3 · 5 ชุด',
    meta: '5 ชุด · เตรียมสอบ · พี่หมิง',
    glyph: '⊕',
    ribbon: 'new',
    rating: 4.8,
    reviews: 212,
    students: '684',
    hours: '16 ชม.',
    lessons: '5 ชุด',
    priceNow: 1490,
    priceOld: null,
    detail: {
      subject: 'TPAT3 · MOCK',
      badge: 'NEW',
      title: 'ข้อสอบจำลอง<br/>TPAT3 · <span class="grad">5 ชุด</span>',
      tagline: 'ซ้อมจริงด้วยชุดข้อสอบจำลอง 5 ชุด จับเวลาเหมือนสนามจริง พร้อมเฉลยรายข้อและวิเคราะห์จุดอ่อน.',
      lessonsLong: '5 ชุดข้อสอบ',
      levelText: 'เตรียมสอบ · TCAS',
      statLevel: 'เตรียมสอบ'
    }
  },
  {
    id: 'tgat2-logic',
    subj: 'tgat2',
    level: null,
    name: 'TGAT2 · การคิดอย่างมีเหตุผล',
    meta: '20 บท · เตรียมสอบ · พี่หมิง',
    glyph: '∑',
    ribbon: 'rec',
    rating: 4.9,
    reviews: 528,
    students: '1,580',
    hours: '16 ชม.',
    lessons: '20 บท',
    priceNow: 1990,
    priceOld: 2890,
    detail: {
      subject: 'TGAT2 · การคิดอย่างมีเหตุผล',
      badge: 'แนะนำ',
      title: 'TGAT2<br/>การคิดอย่าง<span class="grad">มีเหตุผล</span>',
      tagline: 'เจาะ TGAT2 ส่วนการคิดอย่างมีตรรกะและตัวเลข — จับแพตเทิร์นข้อสอบจริง ทำทันเวลา ทุกพาร์ต.',
      lessonsLong: '20 บทเรียน',
      levelText: 'เตรียมสอบ · TCAS',
      statLevel: 'เตรียมสอบ'
    }
  }
  ];

  var byIdMap = {};
  LIST.forEach(function (c) { byIdMap[c.id] = c; });

  global.Courses = {
    LIST: LIST,
    byId: function (id) { return byIdMap[id] || null; },
    bySubject: function (subj) {
      return subj && subj !== 'all' ? LIST.filter(function (c) { return c.subj === subj; }) : LIST.slice();
    },
    /* นับจำนวนคอร์สต่อวิชา — ใช้กับตัวเลขบนชิปกรอง */
    countBySubject: function () {
      var n = { all: LIST.length };
      LIST.forEach(function (c) { n[c.subj] = (n[c.subj] || 0) + 1; });
      return n;
    }
  };
})(window);
