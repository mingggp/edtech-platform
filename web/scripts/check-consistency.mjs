#!/usr/bin/env node
/**
 * ตรวจว่า "ความจริง" 3 ที่ยังตรงกัน — รันด้วย `npm run check`
 *
 *   1. web/src/config/subjects.ts          (Next.js)
 *   2. Claude Design version 1.0/subjects.js (ต้นแบบฝั่งดีไซน์)
 *   3. backend/app/schemas.py SUBJECTS      (ฐานข้อมูล)
 *
 * และตรวจว่าเมนูใน config/nav.ts มี route รองรับครบ
 *
 * ทำไมต้องมี: ปัญหาที่เจอในโปรเจกต์นี้เกือบทั้งหมดคือ "ข้อมูลชุดเดียวกัน
 * ถูกเขียนไว้หลายที่แล้วค่อย ๆ เพี้ยนกัน" — สคริปต์นี้ทำให้รู้ตัวตั้งแต่ยังไม่พัง
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB = resolve(HERE, '..');
const REPO = resolve(WEB, '..');
const DESIGN = join(REPO, 'Claude Design version 1.0');
const BACKEND = join(REPO, 'backend');

const problems = [];
const notes = [];
const fail = (m) => problems.push(m);
const note = (m) => notes.push(m);

/* ------------------------------------------------------------ 1. วิชา */
const EXPECTED = ['math', 'phys', 'tpat3', 'tgat2'];

const tsSrc = readFileSync(join(WEB, 'src/config/subjects.ts'), 'utf8');
const tsIds = [...tsSrc.matchAll(/^\s*id:\s*'([a-z0-9]+)'/gm)].map((m) => m[1]);
if (JSON.stringify(tsIds) !== JSON.stringify(EXPECTED)) {
  fail(`subjects.ts มีวิชา [${tsIds}] ควรเป็น [${EXPECTED}] (ลำดับสำคัญ)`);
}

if (existsSync(join(DESIGN, 'subjects.js'))) {
  const jsSrc = readFileSync(join(DESIGN, 'subjects.js'), 'utf8');
  const jsIds = [...jsSrc.matchAll(/^\s*id:\s*'([a-z0-9]+)'/gm)].map((m) => m[1]);
  if (JSON.stringify(jsIds) !== JSON.stringify(EXPECTED)) {
    fail(`subjects.js (ดีไซน์) มีวิชา [${jsIds}] ไม่ตรงกับ [${EXPECTED}]`);
  }
} else {
  note('ไม่เจอ subjects.js ฝั่งดีไซน์ — ข้ามการเทียบ');
}

if (existsSync(join(BACKEND, 'app/schemas.py'))) {
  const py = readFileSync(join(BACKEND, 'app/schemas.py'), 'utf8');
  const m = py.match(/^SUBJECTS\s*=\s*\(([^)]*)\)/m);
  if (!m) {
    fail('หา SUBJECTS ใน backend/app/schemas.py ไม่เจอ');
  } else {
    const pyIds = [...m[1].matchAll(/"([a-z0-9]+)"/g)].map((x) => x[1]);
    if (JSON.stringify(pyIds) !== JSON.stringify(EXPECTED)) {
      fail(`backend SUBJECTS = [${pyIds}] ไม่ตรงกับ [${EXPECTED}]`);
    }
  }
} else {
  note('ไม่เจอ backend/app/schemas.py — ข้ามการเทียบ');
}

/* --------------------------------------------------------- 1b. ระดับชั้น */
/* ระดับชั้นเป็นข้อมูลชุดเดียวกันที่เขียนไว้ 2 ที่แบบเดียวกับวิชา
   ถ้าไม่ตรงกัน leaderboard ที่กรองด้วย grade_level จะหาไม่เจอเงียบ ๆ */
const EXPECTED_GRADES = ['m4', 'm5', 'm6', 'other'];

const gradeTs = readFileSync(join(WEB, 'src/config/grades.ts'), 'utf8');
const gradeTsM = gradeTs.match(/GRADE_KEYS\s*=\s*\[([^\]]*)\]/);
if (!gradeTsM) {
  fail('หา GRADE_KEYS ใน web/src/config/grades.ts ไม่เจอ');
} else {
  const ids = [...gradeTsM[1].matchAll(/'([a-z0-9]+)'/g)].map((x) => x[1]);
  if (JSON.stringify(ids) !== JSON.stringify(EXPECTED_GRADES)) {
    fail(`grades.ts มีระดับชั้น [${ids}] ควรเป็น [${EXPECTED_GRADES}]`);
  }
}

if (existsSync(join(BACKEND, 'app/grades.py'))) {
  const py = readFileSync(join(BACKEND, 'app/grades.py'), 'utf8');
  const m = py.match(/GRADES:\s*dict\[str,\s*str\]\s*=\s*\{([\s\S]*?)\}/);
  if (!m) {
    fail('หา GRADES ใน backend/app/grades.py ไม่เจอ');
  } else {
    const ids = [...m[1].matchAll(/"([a-z0-9]+)":/g)].map((x) => x[1]);
    if (JSON.stringify(ids) !== JSON.stringify(EXPECTED_GRADES)) {
      fail(`backend GRADES = [${ids}] ไม่ตรงกับ [${EXPECTED_GRADES}]`);
    }
  }
} else {
  note('ไม่เจอ backend/app/grades.py — ข้ามการเทียบระดับชั้น');
}

/* ---------------------------------------------- 2. คีย์เก่าต้องไม่กลับมา */
const DEAD = ['tpat3'].length ? [`'tpat'`, `'tgat'`, `'amath'`, `'aphys'`] : [];
const walk = (dir, out = []) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(f)) out.push(p);
  }
  return out;
};
for (const file of walk(join(WEB, 'src'))) {
  const src = readFileSync(file, 'utf8');
  for (const dead of DEAD) {
    if (src.includes(`: ${dead}`) || src.includes(`=== ${dead}`)) {
      fail(`${file.replace(WEB + '/', '')} ยังใช้คีย์วิชาแบบเก่า ${dead}`);
    }
  }
}

/* --------------------------------------- 2b. ปุ่มออกจากระบบต้องล้าง token */
/* บั๊กจริง: ปุ่ม "ออกจากระบบ" เคยเป็นแค่ <Link href="/login"> ไม่ได้ล้าง token
   กดแล้วไปหน้า login จริงแต่ยังล็อกอินอยู่ -> หน้า login เห็นว่ามีผู้ใช้
   ก็เด้งกลับ dashboard = ออกจากบัญชีไม่ได้เลยทั้งเว็บ
   เป็นบั๊กที่เทสต์ backend จับไม่ได้เพราะไม่มีอะไรผิดฝั่งเซิร์ฟเวอร์ */
for (const file of walk(join(WEB, 'src'))) {
  const src = readFileSync(file, 'utf8');
  const rel = file.replace(WEB + '/', '');
  if (!src.includes('ออกจากระบบ')) continue;
  // เอาคอมเมนต์ออกก่อน ไม่งั้นคำอธิบายบั๊กเก่าจะถูกนับเป็นโค้ด
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  if (!code.includes('ออกจากระบบ')) continue;
  if (!/logout\s*\(/.test(code)) {
    fail(`${rel} มีปุ่ม "ออกจากระบบ" แต่ไม่ได้เรียก logout() — token จะไม่ถูกล้าง`);
  }
  // ปุ่มนี้ต้องไม่ใช่ลิงก์เปล่า ๆ
  if (/<Link[^>]*>\s*(?:\{[^}]*\}|<[^>]*\/>)?\s*ออกจากระบบ/.test(code)) {
    fail(`${rel} ใช้ <Link> เป็นปุ่มออกจากระบบ — ต้องเป็น <button> ที่เรียก logout()`);
  }
}

/* ------------------------ 2c. endpoint ที่ตอบต่างกันตามผู้ใช้ ห้าม anonymous */
/* บั๊กจริง: /courses/{id}/chapters เดิมเป็น endpoint สาธารณะ ฝั่งเว็บจึงเรียกด้วย
   anonymous: true (ไม่แนบ token)  พอเพิ่มกำแพงจ่ายเงินทีหลัง — backend เริ่มตอบ
   ไม่เท่ากันระหว่างคนซื้อแล้วกับยังไม่ซื้อ — แต่ลืมเอา anonymous ออก
   ผลคือ backend เห็นเป็นคนแปลกหน้าเสมอ -> คนที่จ่ายเงินไปแล้วเข้าห้องเรียนไม่ได้

   วิธีตรวจ: หา endpoint ที่ backend ใช้ get_current_user_optional
   แล้วดูว่าฝั่งเว็บเรียกแบบ anonymous หรือเปล่า */
const normPath = (p) => p.replace(/\$\{[^}]*\}/g, '*').replace(/\{[^}]*\}/g, '*').split('?')[0];

const optionalAuthPaths = new Set();
const routersDir = join(BACKEND, 'app/routers');
if (existsSync(routersDir)) {
  for (const f of readdirSync(routersDir).filter((x) => x.endsWith('.py'))) {
    const src = readFileSync(join(routersDir, f), 'utf8');
    /* ตัดไฟล์เป็นก้อนละ 1 endpoint (ตั้งแต่ @router. ตัวนี้ ถึงตัวถัดไป)
       แล้วดูว่าก้อนนั้นมี get_current_user_optional ไหม
       เขียนแบบนี้แทน regex ก้อนเดียวยาว ๆ เพราะรูปแบบพารามิเตอร์หลากหลาย
       (ขึ้นบรรทัดใหม่บ้าง มี Depends ซ้อนบ้าง) regex เดียวจับไม่ครบ */
    for (const chunk of src.split(/(?=@router\.)/)) {
      const m = chunk.match(/^@router\.(?:get|post|put|patch|delete)\(\s*["']([^"']+)["']/);
      if (m && chunk.includes('get_current_user_optional')) {
        optionalAuthPaths.add(normPath(m[1]));
      }
    }
  }
}

const epSrc = readFileSync(join(WEB, 'src/lib/api/endpoints.ts'), 'utf8');
for (const m of epSrc.matchAll(/[`'"]([^`'"]*\/[^`'"]*)[`'"]\s*,\s*\{[^}]*anonymous:\s*true/g)) {
  const p = normPath(m[1]);
  if (optionalAuthPaths.has(p)) {
    fail(
      `endpoints.ts เรียก ${m[1]} แบบ anonymous แต่ backend ตอบไม่เท่ากันตามผู้ใช้ ` +
      `(ใช้ get_current_user_optional) — ต้องแนบ token ไปด้วย`,
    );
  }
}

/* --------------------- 2d. ตัวเล่นวิดีโอต้องใช้ callback ref ไม่ใช่ useRef */
/* บั๊กจริงที่ทำให้จอดำตลอด หาอยู่หลายรอบ:
   หน้าห้องเรียนมี early return หลายอัน (กำลังโหลด/ยังไม่ซื้อ/ไม่มีบทเรียน)
   กว่าจะ render <div> ของตัวเล่น  แต่ hook ต้องถูกเรียกก่อน early return
   -> รอบแรก ref ยังเป็น null, effect deps [] ทำงานรอบเดียวแล้วเลิก
   -> พอ <div> โผล่ทีหลัง ไม่มีอะไรปลุก effect -> ตัวเล่นไม่เคยถูกสร้าง
   callback ref + useState แก้ตรงนี้ เพราะ setState ปลุก effect ให้เอง */
const ytHook = join(WEB, 'src/app/(focus)/learn/[id]/use-youtube.ts');
if (existsSync(ytHook)) {
  const src = readFileSync(ytHook, 'utf8');
  if (/const containerRef = useRef</.test(src)) {
    fail(
      'use-youtube.ts กลับไปใช้ useRef กับ container แล้ว — ต้องเป็น callback ref + useState ' +
      'ไม่งั้นตัวเล่นจะไม่ถูกสร้างเมื่อ <div> โผล่ทีหลัง (จอดำ)',
    );
  }
  const m = src.match(/\/\* -+ สร้าง player[\s\S]*?\n  \}, \[([^\]]*)\]\);/);
  if (m && !m[1].includes('containerEl')) {
    fail(`effect ที่สร้าง player ต้องมี containerEl ใน deps (ตอนนี้เป็น [${m[1]}])`);
  }
}

/* ------------------------------------------------------ 3. เมนู ↔ route */
const appDir = join(WEB, 'src/app');
/** แปลงโครงโฟลเดอร์ App Router เป็นรายการ path ที่มีจริง */
function routes(dir, prefix = '', out = new Set()) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (!statSync(p).isDirectory()) {
      if (/^page\.(tsx|ts|jsx|js)$/.test(f)) out.add(prefix === '' ? '/' : prefix);
      continue;
    }
    // (group) ไม่นับเป็นส่วนหนึ่งของ URL
    const seg = /^\(.*\)$/.test(f) ? '' : `/${f}`;
    routes(p, prefix + seg, out);
  }
  return out;
}
const have = routes(appDir);
const navSrc = readFileSync(join(WEB, 'src/config/nav.ts'), 'utf8');
const hrefs = [...navSrc.matchAll(/href:\s*'([^']+)'/g)]
  .map((m) => m[1].split('#')[0])
  .filter((h) => h.startsWith('/'));
const missing = [...new Set(hrefs)].filter((h) => !have.has(h));
if (missing.length) {
  note(`เมนูที่ยังไม่มีหน้ารองรับ (${missing.length}): ${missing.join(', ')}`);
}

/* ------------------------------------------------------------- สรุปผล */
if (notes.length) {
  console.log('\nℹ️  หมายเหตุ');
  for (const n of notes) console.log('   -', n);
}
if (problems.length) {
  console.error('\n❌ เจอปัญหา', problems.length, 'จุด');
  for (const p of problems) console.error('   -', p);
  process.exit(1);
}
console.log(
  `\n✅ ผ่าน — วิชา 3 ที่ตรงกัน (${EXPECTED.join(' → ')})` +
  ` · ระดับชั้น 2 ที่ตรงกัน (${EXPECTED_GRADES.join(' → ')})` +
  ` · route ${have.size} หน้า`,
);
