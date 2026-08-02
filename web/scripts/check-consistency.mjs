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
