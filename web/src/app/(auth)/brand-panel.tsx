'use client';

/**
 * แผงแบรนด์ฝั่งซ้ายของหน้า auth
 *
 * ย้ายมาจาก 'Claude Design version 1.0/auth-vars.js' — สัญลักษณ์คณิต/ฟิสิกส์
 * ที่ลากได้และมีเกร็ดความรู้ตอนชี้ ตรงกับแนวทาง Visualize Learning ของคอร์ส
 *
 * ข้อควรรู้ 2 อย่าง:
 *
 * 1. สัญลักษณ์สุ่มจาก POOL ทุกครั้งที่โหลด แต่ต้องสุ่มใน useEffect เท่านั้น
 *    ห้ามสุ่มตอน render เพราะ Next.js render ทั้งฝั่งเซิร์ฟเวอร์และเบราว์เซอร์
 *    ถ้าสุ่มคนละค่าจะเกิด hydration mismatch (React จะเตือนแล้วทิ้ง DOM ทั้งก้อน)
 *
 * 2. การลากใช้ CSS `translate` ไม่ใช่ `transform` เพราะ .glyph มี transform
 *    เป็น rotate อยู่แล้วจาก CSS ถ้าไปเขียนทับจะหมุนหาย
 */
import { useEffect, useRef } from 'react';

/** [สัญลักษณ์, ชื่อ, คำอธิบายสั้น] */
const POOL: [string, string, string][] = [
  ['∫', 'อินทิเกรต', 'หาพื้นที่ใต้กราฟ'],
  ['Σ', 'ซิกมา', 'ผลรวมของทุกพจน์'],
  ['π', 'พาย', '≈ 3.14159'],
  ['√', 'สแควร์รูท', 'รากที่สอง'],
  ['Δ', 'เดลตา', 'การเปลี่ยนแปลง'],
  ['∞', 'อินฟินิตี้', 'ค่าอนันต์'],
  ['θ', 'ทีตา', 'มุมในตรีโกณ'],
  ['λ', 'แลมบ์ดา', 'ความยาวคลื่น'],
  ['Ω', 'โอห์ม', 'ความต้านทานไฟฟ้า'],
  ['φ', 'ฟี', 'อัตราส่วนทอง ≈ 1.618'],
  ['ω', 'โอเมกา', 'ความเร็วเชิงมุม'],
  ['μ', 'มิว', 'สัมประสิทธิ์เสียดทาน'],
  ['ρ', 'โร', 'ความหนาแน่น'],
  ['e', 'ออยเลอร์', '≈ 2.71828'],
  ['∴', 'เพราะฉะนั้น', 'ใช้สรุปผลพิสูจน์'],
  ['∂', 'พาเชียล', 'อนุพันธ์ย่อย'],
  ['a²+b²=c²', 'พีทาโกรัส', 'ด้านสามเหลี่ยมมุมฉาก'],
  ['(a+b)²', 'กำลังสองสมบูรณ์', '= a²+2ab+b²'],
  ['y=mx+c', 'สมการเส้นตรง', 'm คือความชัน'],
  ['F=ma', 'กฎข้อ 2 นิวตัน', 'แรง = มวล × ความเร่ง'],
  ['g=9.8', 'ค่า g', 'ความเร่งโน้มถ่วงโลก (m/s²)'],
  ['c=3×10⁸', 'ความเร็วแสง', 'หน่วย m/s'],
  ['v=fλ', 'สมการคลื่น', 'อัตราเร็ว = ความถี่ × ความยาวคลื่น'],
  ['E=mc²', 'ไอน์สไตน์', 'มวลกลายเป็นพลังงานได้'],
  ['W=Fs', 'งาน', 'แรง × ระยะทาง (จูล)'],
  ['P=IV', 'กำลังไฟฟ้า', 'กระแส × ความต่างศักย์ (วัตต์)'],
  ['Ek=½mv²', 'พลังงานจลน์', 'ของวัตถุที่กำลังเคลื่อนที่'],
  ['x²', 'พาราโบลา', 'กราฟฟังก์ชันกำลังสอง'],
  ['sinθ', 'ไซน์', 'ตรงข้าม / ด้านตรงข้ามมุมฉาก'],
  ['logₐx', 'ลอการิทึม', 'ผกผันของเลขยกกำลัง'],
];

const SLOTS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8'] as const;

function shuffle<T>(a: readonly T[]): T[] {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function BrandPanel() {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const els = Array.from(panel.querySelectorAll<HTMLElement>('.glyph'));
    const pool = shuffle(POOL);
    const cleanups: (() => void)[] = [];

    els.forEach((el, idx) => {
      const [sym, name, desc] = pool[idx % pool.length];
      const isFormula = sym.length > 2;

      // สูตรยาวกว่าสัญลักษณ์เดี่ยว ย่อลงไม่ให้ล้นช่อง
      const base = parseFloat(getComputedStyle(el).fontSize) || 34;
      el.style.fontSize = `${isFormula ? Math.max(16, Math.round(base * 0.5)) : base}px`;
      el.classList.toggle('is-formula', isFormula);

      el.textContent = '';
      const gsym = document.createElement('span');
      gsym.className = 'gsym';
      gsym.textContent = sym;
      const tip = document.createElement('i');
      tip.className = 'gtip';
      const b = document.createElement('b');
      b.textContent = name;
      tip.append(b, document.createTextNode(` · ${desc}`));
      el.append(gsym, tip);
      el.setAttribute('aria-label', `${name} · ${desc}`);

      /* วางคำอธิบายไม่ให้ทะลุขอบแผง */
      const place = () => {
        const pr = panel.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        el.classList.toggle('tip-below', er.top - pr.top < 90);
        el.classList.remove('tip-l', 'tip-r');
        if (er.left - pr.left < 130) el.classList.add('tip-l');
        else if (pr.right - er.right < 130) el.classList.add('tip-r');
      };

      /* ลากได้ — ใช้ translate เพื่อไม่ทับ transform: rotate() ที่มาจาก CSS */
      let dx = 0, dy = 0, sx = 0, sy = 0, bx = 0, by = 0, dragging = false;
      let lim = { x1: -1e4, x2: 1e4, y1: -1e4, y2: 1e4 };
      const apply = () => { el.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`; };

      const onDown = (e: PointerEvent) => {
        dragging = true;
        sx = e.clientX; sy = e.clientY; bx = dx; by = dy;
        const pr = panel.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        lim = {
          x1: bx + (pr.left - er.left), x2: bx + (pr.right - er.right),
          y1: by + (pr.top - er.top), y2: by + (pr.bottom - er.bottom),
        };
        el.classList.add('dragging');
        try { el.setPointerCapture(e.pointerId); } catch { /* บางเบราว์เซอร์ไม่รองรับ */ }
        e.preventDefault();
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        dx = Math.max(lim.x1, Math.min(lim.x2, bx + (e.clientX - sx)));
        dy = Math.max(lim.y1, Math.min(lim.y2, by + (e.clientY - sy)));
        apply();
      };
      const release = () => { dragging = false; el.classList.remove('dragging'); };
      const onKey = (e: KeyboardEvent) => {
        const step = e.shiftKey ? 24 : 8;
        if (e.key === 'ArrowLeft') dx -= step;
        else if (e.key === 'ArrowRight') dx += step;
        else if (e.key === 'ArrowUp') dy -= step;
        else if (e.key === 'ArrowDown') dy += step;
        else return;
        e.preventDefault();
        apply();
      };

      el.addEventListener('pointerenter', place);
      el.addEventListener('focus', place);
      el.addEventListener('pointerdown', onDown);
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('keydown', onKey);

      cleanups.push(() => {
        el.removeEventListener('pointerenter', place);
        el.removeEventListener('focus', place);
        el.removeEventListener('pointerdown', onDown);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', release);
        el.removeEventListener('pointercancel', release);
        el.removeEventListener('keydown', onKey);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <section className="brand-panel" ref={panelRef}>
      <div className="mesh" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <span className="float ring" aria-hidden="true" />
      <span className="float orb o1" aria-hidden="true" />
      <span className="float orb o2" aria-hidden="true" />
      <span className="float sq s1" aria-hidden="true" />

      {/* ว่างไว้ก่อน — useEffect เติมสัญลักษณ์ให้ตอนอยู่ในเบราว์เซอร์แล้ว
          (ถ้าใส่ตอน render จะสุ่มคนละค่ากับฝั่งเซิร์ฟเวอร์แล้ว hydration พัง) */}
      {SLOTS.map((slot) => (
        <button key={slot} type="button" className={`glyph ${slot}`} tabIndex={0} />
      ))}

      <a href="/" className="bp-logo">
        <span className="mark" aria-hidden="true">
          <svg viewBox="0 0 120 120" fill="none">
            <path d="M40 50 Q40 38 50 38 Q60 38 60 50" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
            <path d="M68 50 Q68 38 78 38 Q88 38 88 50" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
            <path d="M34 72 Q60 100 94 72" stroke="#fff" strokeWidth={10} strokeLinecap="round" />
          </svg>
        </span>
        <span className="word">
          mingsmileyface<small>TCAS 70 · ม.ปลาย</small>
        </span>
      </a>

      <div className="bp-body">
        <span className="bp-eyebrow">
          <span className="dot" />
          ติวเตอร์ออนไลน์ · ม.4–ม.6
        </span>
        <h1 className="bp-tagline">
          พิชิต ม.ปลาย
          <br />
          สอบติด<span className="em">วิศวะฯ</span> กับพี่หมิง
        </h1>
        <div className="bp-subjects">
          <span className="bp-chip" style={{ '--c': 'var(--subj-math-grad)' } as React.CSSProperties}>คณิต</span>
          <span className="bp-chip" style={{ '--c': 'var(--subj-phys-grad)' } as React.CSSProperties}>ฟิสิกส์</span>
          <span className="bp-chip" style={{ '--c': 'var(--subj-tpat3-grad)' } as React.CSSProperties}>TPAT3</span>
          <span className="bp-chip" style={{ '--c': 'var(--subj-tgat2-grad)' } as React.CSSProperties}>TGAT2</span>
        </div>
      </div>
    </section>
  );
}
