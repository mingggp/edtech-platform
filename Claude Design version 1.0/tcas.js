/* ============================================================
   TCAS Chance Checker — data, calc, render (mock data, ตัวอย่าง)
   weighted = Σ (score/max*100 * weight/100) → เทียบ stat_min ปีก่อน
   ============================================================ */
(function(){
'use strict';

/* ---------- reference subjects ---------- */
const SUBJECTS = [
  { code:'GPAX',  name:'GPAX',                         max:4,   group:'gpax', subj:null },
  { code:'TGAT1', name:'TGAT1', sub:'การสื่อสารภาษาอังกฤษ', max:100, group:'tgat', subj:'tgat2' },
  { code:'TGAT2', name:'TGAT2', sub:'การคิดอย่างมีเหตุผล',  max:100, group:'tgat', subj:'tgat2' },
  { code:'TGAT3', name:'TGAT3', sub:'สมรรถนะการทำงาน',      max:100, group:'tgat', subj:'tgat2' },
  { code:'TPAT1', name:'TPAT1', sub:'กสพท',                 max:100, group:'tpat', subj:'tpat3' },
  { code:'TPAT2', name:'TPAT2', sub:'ศิลปกรรมศาสตร์',        max:100, group:'tpat', subj:'tpat3' },
  { code:'TPAT3', name:'TPAT3', sub:'วิทย์ เทคโนโลยี วิศวกรรม', max:100, group:'tpat', subj:'tpat3' },
  { code:'TPAT4', name:'TPAT4', sub:'สถาปัตยกรรมศาสตร์',     max:100, group:'tpat', subj:'tpat3' },
  { code:'TPAT5', name:'TPAT5', sub:'ครุศาสตร์-ศึกษาศาสตร์', max:100, group:'tpat', subj:'tpat3' },
  { code:'AL_MATH1', name:'คณิต 1',  sub:'ประยุกต์',  max:100, group:'alevel', subj:'math' },
  { code:'AL_MATH2', name:'คณิต 2',  sub:'พื้นฐาน',   max:100, group:'alevel', subj:'math' },
  { code:'AL_PHYS',  name:'ฟิสิกส์',  max:100, group:'alevel', subj:'phys' },
  { code:'AL_CHEM',  name:'เคมี',    max:100, group:'alevel', subj:null },
  { code:'AL_BIO',   name:'ชีววิทยา', max:100, group:'alevel', subj:null },
  { code:'AL_SCI',   name:'วิทย์ประยุกต์', max:100, group:'alevel', subj:null },
  { code:'AL_THAI',  name:'ภาษาไทย', max:100, group:'alevel', subj:null },
  { code:'AL_SOC',   name:'สังคมศึกษา', max:100, group:'alevel', subj:null },
  { code:'AL_ENG',   name:'ภาษาอังกฤษ', max:100, group:'alevel', subj:null },
  { code:'AL_LANG',  name:'ภาษาต่างประเทศอื่น', sub:'ฝรั่งเศส เยอรมัน ญี่ปุ่น ฯลฯ', max:100, group:'alevel', subj:null },
];
const SUBJ_BY_CODE = Object.fromEntries(SUBJECTS.map(s => [s.code, s]));

const GROUPS = [
  { id:'gpax',   name:'GPAX',    subj:null,   open:true },
  { id:'tgat',   name:'TGAT',    subj:'tgat2', open:true },
  { id:'tpat',   name:'TPAT',    subj:'tpat3', open:false },
  { id:'alevel', name:'A-Level', subj:'math', open:true },
];

/* ---------- mock programs (ตัวอย่าง — เกณฑ์สมจริงแต่ไม่ใช่ข้อมูลจริง) ---------- */
const PROGRAMS = [
  { id:'cu-cpe', uni:'จุฬาลงกรณ์มหาวิทยาลัย', faculty:'วิศวกรรมศาสตร์', field:'คอมพิวเตอร์', round:'รอบ 3 Admission', quota:90, subj:'tpat3',
    criteria:[{code:'TGAT1',w:10},{code:'TGAT2',w:10},{code:'TPAT3',w:50},{code:'AL_MATH1',w:20},{code:'AL_PHYS',w:10}],
    gpaxMin:null, statMin:72.40, statMax:89.10, statYear:2568 },
  { id:'cu-eng', uni:'จุฬาลงกรณ์มหาวิทยาลัย', faculty:'วิศวกรรมศาสตร์', field:'รวมสาขา', round:'รอบ 3 Admission', quota:380, subj:'tpat3',
    criteria:[{code:'TGAT1',w:10},{code:'TGAT2',w:10},{code:'TPAT3',w:50},{code:'AL_MATH1',w:20},{code:'AL_PHYS',w:10}],
    gpaxMin:null, statMin:64.85, statMax:86.20, statYear:2568 },
  { id:'tu-ce', uni:'มหาวิทยาลัยธรรมศาสตร์', faculty:'วิศวกรรมศาสตร์', field:'โยธา', round:'รอบ 3 Admission', quota:60, subj:'tpat3',
    criteria:[{code:'TGAT2',w:20},{code:'TPAT3',w:40},{code:'AL_MATH1',w:25},{code:'AL_PHYS',w:15}],
    gpaxMin:2.75, statMin:48.60, statMax:71.30, statYear:2568 },
  { id:'mu-sci', uni:'มหาวิทยาลัยมหิดล', faculty:'วิทยาศาสตร์', field:'รวมสาขา', round:'รอบ 3 Admission', quota:240, subj:'phys',
    criteria:[{code:'TGAT1',w:10},{code:'TGAT2',w:10},{code:'AL_MATH1',w:25},{code:'AL_PHYS',w:20},{code:'AL_CHEM',w:20},{code:'AL_BIO',w:15}],
    gpaxMin:2.50, statMin:52.75, statMax:78.90, statYear:2568 },
  { id:'ku-eng', uni:'มหาวิทยาลัยเกษตรศาสตร์', faculty:'วิศวกรรมศาสตร์', field:'เครื่องกล', round:'รอบ 3 Admission', quota:110, subj:'tpat3',
    criteria:[{code:'TGAT2',w:20},{code:'TPAT3',w:40},{code:'AL_MATH1',w:20},{code:'AL_PHYS',w:20}],
    gpaxMin:null, statMin:45.30, statMax:68.75, statYear:2568 },
  { id:'kmitl-arch', uni:'สจล. (ลาดกระบัง)', faculty:'สถาปัตยกรรมศาสตร์', field:'สถาปัตยกรรมหลัก', round:'รอบ 3 Admission', quota:70, subj:'tgat2',
    criteria:[{code:'TGAT2',w:25},{code:'TPAT4',w:45},{code:'AL_MATH1',w:15},{code:'AL_PHYS',w:15}],
    gpaxMin:null, statMin:51.90, statMax:73.40, statYear:2568 },
  { id:'kmutt-cpe', uni:'มจธ. (บางมด)', faculty:'วิศวกรรมศาสตร์', field:'คอมพิวเตอร์', round:'รอบ 3 Admission', quota:85, subj:'math',
    criteria:[{code:'TGAT1',w:15},{code:'TGAT2',w:15},{code:'TPAT3',w:35},{code:'AL_MATH1',w:35}],
    gpaxMin:2.50, statMin:58.20, statMax:79.60, statYear:2568 },
  { id:'cu-acc', uni:'จุฬาลงกรณ์มหาวิทยาลัย', faculty:'พาณิชยศาสตร์และการบัญชี', field:'บัญชี', round:'รอบ 3 Admission', quota:150, subj:'tgat2',
    criteria:[{code:'GPAX',w:10},{code:'TGAT1',w:20},{code:'TGAT2',w:20},{code:'AL_MATH1',w:30},{code:'AL_ENG',w:20}],
    gpaxMin:3.00, statMin:66.10, statMax:82.45, statYear:2568 },
];
const POPULAR = ['cu-cpe','tu-ce','mu-sci','ku-eng','kmutt-cpe','kmitl-arch','cu-acc','cu-eng'];

/* สีประจำมหาวิทยาลัย + โลโก้ (แปะเพิ่มได้ใน assets/) */
const UNI_THEME = [
  { match:'จุฬา',      color:'#DE5C8E', logo:'assets/uni-chula.png' },
  { match:'ธรรมศาสตร์', color:'#E7B416', logo:'assets/uni-tu.png' },
  { match:'มหิดล',     color:'#1B4F9C', logo:'assets/uni-mahidol.png' },
  { match:'เกษตรศาสตร์', color:'#00794E', logo:'assets/uni-ku.png' },
  { match:'ลาดกระบัง',  color:'#E35205', logo:'assets/uni-kmitl.png' },
  { match:'บางมด',     color:'#EE7623', logo:'assets/uni-kmutt.png' },
];
function uniTheme(uni){ return UNI_THEME.find(t => uni.includes(t.match)) || null; }

/* ---------- state ---------- */
/* prefilled ตัวอย่าง so the page shows results immediately */
let scores = {
  GPAX: 3.45, TGAT1: 54, TGAT2: 63, TGAT3: 58,
  TPAT3: 47, AL_MATH1: 52, AL_PHYS: 55, AL_ENG: 60,
};
let added = [];            // program ids in compare list (custom programs pushed into PROGRAMS)
let targetId = null;       // program id in target mode
let tone = 'encourage';
let mockCount = 3;
let mockApplied = false;
let customSeq = 0;
let rank = [];             // [{id,name,uni}] — 10 อันดับเสมือนจริง
try { const r = JSON.parse(localStorage.getItem('ming-tcas-rank') || '[]'); if (Array.isArray(r)) rank = r.slice(0, 10); } catch(e){}
function saveRank(){ localStorage.setItem('ming-tcas-rank', JSON.stringify(rank)); }
let dragId = null;
let enterId = null;        // การ์ด/แถวที่เพิ่งเพิ่ม → เล่น animation ตอนโผล่
let rankEnterId = null;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
/* เล่น exit animation แล้วค่อยลบจริง */
function animateOut(el, done){
  if (!el || REDUCED){ done(); return; }
  el.classList.add('exit');
  el.style.height = el.offsetHeight + 'px';
  el.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    el.style.transition = 'height .3s cubic-bezier(.4,0,.8,.4) .12s, margin .3s cubic-bezier(.4,0,.8,.4) .12s, padding .3s cubic-bezier(.4,0,.8,.4) .12s';
    el.style.height = '0px'; el.style.marginTop = '-16px'; el.style.paddingTop = '0'; el.style.paddingBottom = '0';
  });
  setTimeout(done, 400);
}

/* ---------- helpers ---------- */
const $ = (s, el=document) => el.querySelector(s);
const fmt = (n, d=2) => (Math.round(n * 10**d) / 10**d).toLocaleString('th-TH', { maximumFractionDigits: d });
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function norm(code){
  const v = scores[code];
  if (v == null || v === '') return null;
  return Math.max(0, Math.min(100, v / SUBJ_BY_CODE[code].max * 100));
}
function evalProgram(p){
  let weighted = 0, missing = [], rows = [];
  for (const c of p.criteria){
    const n = norm(c.code);
    const contrib = n == null ? 0 : n * c.w / 100;
    weighted += contrib;
    if (n == null) missing.push(c.code);
    rows.push({ ...c, norm: n, contrib });
  }
  const gap = weighted - p.statMin;
  const BAND = 3;
  let status = 'none';
  const anyFilled = rows.some(r => r.norm != null);
  if (anyFilled) status = gap >= BAND ? 'safe' : gap >= -BAND ? 'edge' : 'far';
  /* chance estimate — ฟังก์ชันของระยะห่างจาก min/max ปีก่อน (ประมาณการเท่านั้น) */
  const span = Math.max(6, p.statMax - p.statMin);
  let chance = 50 + (gap / span) * 55;
  chance = Math.max(5, Math.min(95, Math.round(chance / 5) * 5));
  /* best push subject = มี headroom × น้ำหนักมากสุด */
  let push = null, bestScore = -1;
  for (const r of rows){
    const headroom = r.norm == null ? 100 : 100 - r.norm;
    const sc = headroom * r.w;
    if (sc > bestScore && headroom > 1){ bestScore = sc; push = r; }
  }
  return { weighted, gap, status, chance, rows, missing, push, anyFilled };
}

/* copy tone */
function gapCopy(p, ev){
  const gapAbs = fmt(Math.abs(ev.gap));
  const pushName = ev.push ? SUBJ_BY_CODE[ev.push.code].name : '';
  if (!ev.anyFilled) return 'กรอกคะแนนทางซ้ายก่อน แล้วเราจะบอกว่าอยู่ตรงไหน';
  if (ev.status === 'safe'){
    if (tone === 'direct') return `สูงกว่าคะแนนต่ำสุดปี ${p.statYear} อยู่ <b>${gapAbs} คะแนน</b>`;
    if (tone === 'cheer')  return `ปังมาก! เกินคะแนนต่ำสุดปีก่อนถึง <b>${gapAbs} คะแนน</b> — รักษาฟอร์มนี้ไว้ ลุยเลย`;
    return `เกินคะแนนต่ำสุดปีก่อน <b>${gapAbs} คะแนน</b> — รักษาระดับนี้ไว้ให้ถึงวันสอบ`;
  }
  if (ev.status === 'edge'){
    if (tone === 'direct') return `ห่างจากคะแนนต่ำสุดปีก่อน <b>${fmt(ev.gap)} คะแนน</b> — อยู่ในช่วงต้องลุ้น`;
    if (tone === 'cheer')  return `ใกล้มากแล้ว! อีกนิดเดียวถึงเส้นปีก่อน — ดัน<b>${pushName}</b>อีกหน่อย ไปถึงแน่นอน`;
    return `อยู่ใกล้เส้นคะแนนต่ำสุดปีก่อนมาก — ดัน<b>${pushName}</b>เพิ่มอีกนิดเพื่อความชัวร์`;
  }
  if (tone === 'direct') return `ต่ำกว่าคะแนนต่ำสุดปีก่อน <b>${gapAbs} คะแนน</b> — วิชาที่คุ้มสุดที่ควรดัน: <b>${pushName}</b>`;
  if (tone === 'cheer')  return `ยังห่างอีก <b>${gapAbs} คะแนน</b> — แต่ยังมีเวลา! ดัน<b>${pushName}</b>ให้สุด แล้วเส้นนี้ไม่ไกลเกินเอื้อม`;
  return `ยังห่างอีก <b>${gapAbs} คะแนน</b> — ดัน<b>${pushName}</b>ได้! น้ำหนักเยอะสุดและยังมีที่ให้โต`;
}

const STATUS_LABEL = { safe:'ปลอดภัย', edge:'ต้องลุ้น', far:'ยังห่าง', none:'รอคะแนน' };
/* หน้ายิ้ม/นิ่ง/เศร้า ตามสถานะ */
const STATUS_FACE = {
  safe: '<svg class="face" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"></circle><path d="M8.5 14.5s1.2 1.8 3.5 1.8 3.5-1.8 3.5-1.8"></path><path d="M9 9.6h.01M15 9.6h.01" stroke-width="2.6"></path></svg>',
  edge: '<svg class="face" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"></circle><path d="M8.7 15h6.6"></path><path d="M9 9.6h.01M15 9.6h.01" stroke-width="2.6"></path></svg>',
  far:  '<svg class="face" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"></circle><path d="M8.5 15.8s1.2-1.8 3.5-1.8 3.5 1.8 3.5 1.8"></path><path d="M9 9.6h.01M15 9.6h.01" stroke-width="2.6"></path></svg>',
  none: ''
};

/* ---------- render: score input panel ---------- */
function renderPanel(){
  const wrap = $('#score-groups');
  wrap.innerHTML = GROUPS.map(g => {
    const subs = SUBJECTS.filter(s => s.group === g.id);
    const rows = subs.map(s => {
      const v = scores[s.code];
      const step = s.max === 4 ? 0.01 : 0.5;
      return `<div class="frow" data-code="${s.code}">
        <div class="flabel">${esc(s.name)}${s.sub ? `<small>${esc(s.sub)}</small>` : ''}</div>
        <input type="number" min="0" max="${s.max}" step="${step}" placeholder="—" value="${v != null ? v : ''}" aria-label="${esc(s.name)}" />
        <span class="fmax">/ ${s.max}</span>
        <input type="range" min="0" max="${s.max}" step="${step}" value="${v != null ? v : 0}" aria-label="${esc(s.name)} slider" />
      </div>`;
    }).join('');
    const filled = subs.filter(s => scores[s.code] != null).length;
    return `<details class="sgroup" data-group="${g.id}" ${g.open ? 'open' : ''} ${g.subj ? `data-subj="${g.subj}"` : ''}>
      <summary>
        <span class="gdot"></span><b>${g.name}</b>
        <span class="filled">${filled}/${subs.length}</span>
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m6 9 6 6 6-6"></path></svg>
      </summary>
      <div class="rows">${rows}</div>
    </details>`;
  }).join('');

  wrap.querySelectorAll('.frow').forEach(row => {
    const code = row.dataset.code;
    const num = row.querySelector('input[type="number"]');
    const rng = row.querySelector('input[type="range"]');
    const syncFill = () => rng.style.setProperty('--p', (parseFloat(rng.value) || 0) / SUBJ_BY_CODE[code].max * 100);
    const set = (val, fromRange) => {
      if (val === '' || val == null || isNaN(val)) { delete scores[code]; }
      else {
        const s = SUBJ_BY_CODE[code];
        scores[code] = Math.max(0, Math.min(s.max, parseFloat(val)));
      }
      if (fromRange) num.value = scores[code] != null ? scores[code] : '';
      else rng.value = scores[code] != null ? scores[code] : 0;
      syncFill();
      updateCounts();
      renderResults();
    };
    num.addEventListener('input', () => set(num.value, false));
    rng.addEventListener('input', () => set(rng.value, true));
    syncFill();
  });
  updateCounts();
}
function updateCounts(){
  const n = SUBJECTS.filter(s => scores[s.code] != null).length;
  $('#filled-hint').textContent = `${n} วิชา`;
  document.querySelectorAll('.sgroup').forEach(d => {
    const subs = SUBJECTS.filter(s => s.group === d.dataset.group);
    const filled = subs.filter(s => scores[s.code] != null).length;
    d.querySelector('.filled').textContent = `${filled}/${subs.length}`;
  });
}

/* ---------- render: picker ---------- */
function shortUni(u){ return u.replace('มหาวิทยาลัย','ม.').replace('จุฬาลงกรณ์ม.','จุฬาฯ'); }
function renderChips(){
  const grid = $('#pop-grid');
  grid.innerHTML = '';
  POPULAR.forEach(id => {
    const p = PROGRAMS.find(x => x.id === id);
    const b = document.createElement('button');
    b.className = 'pchip'; b.type = 'button';
    b.setAttribute('data-subj', p.subj);
    b.disabled = added.includes(id);
    if (id === enterId) b.classList.add('added');
    b.innerHTML = `<span class="dot"></span>
      <span class="pt"><b>${esc(p.faculty)}${p.field ? ' · ' + esc(p.field) : ''}</b><small>${esc(shortUni(p.uni))} · ${esc(p.round)}</small></span>
      <span class="plus">${added.includes(id) ? 'เพิ่มแล้ว' : '+ เทียบ'}</span>`;
    b.addEventListener('click', () => addProgram(id));
    grid.appendChild(b);
  });
}
function setupSearch(){
  const inp = $('#prog-search'), drop = $('#search-drop');
  function show(){
    const q = inp.value.trim().toLowerCase();
    if (!q){ drop.classList.remove('open'); return; }
    const hits = PROGRAMS.filter(p => !added.includes(p.id) &&
      (p.uni + p.faculty + p.field).toLowerCase().includes(q)).slice(0, 8);
    drop.innerHTML = hits.length
      ? hits.map(p => `<button type="button" class="sd-item" data-id="${p.id}" data-subj="${p.subj}">
          <span class="dot"></span>
          <span class="t">${esc(p.faculty)} · ${esc(p.field)}<small>${esc(p.uni)} · ${esc(p.round)} · รับ ${p.quota} คน</small></span>
          <span class="add">+ เพิ่ม</span>
        </button>`).join('')
      : '<div class="sd-empty">ไม่พบในชุดตัวอย่าง — ลองโหมด "กรอกเกณฑ์เอง" ด้านล่าง</div>';
    drop.classList.add('open');
    drop.querySelectorAll('.sd-item').forEach(b => b.addEventListener('click', () => {
      addProgram(b.dataset.id); inp.value = ''; drop.classList.remove('open');
    }));
  }
  inp.addEventListener('input', show);
  inp.addEventListener('focus', show);
  document.addEventListener('click', e => { if (!e.target.closest('.searchwrap')) drop.classList.remove('open'); });
}

/* ---------- custom criteria form ---------- */
function cfRow(code='', w=''){
  const opts = SUBJECTS.map(s => `<option value="${s.code}" ${s.code===code?'selected':''}>${esc(s.name)}${s.sub?` (${esc(s.sub)})`:''}</option>`).join('');
  const div = document.createElement('div');
  div.className = 'cf-crit-row';
  div.innerHTML = `<select aria-label="วิชา">${opts}</select>
    <input type="number" min="1" max="100" step="1" placeholder="%" value="${w}" aria-label="น้ำหนัก %" />
    <button type="button" class="rm" aria-label="ลบวิชา">×</button>`;
  div.querySelector('.rm').addEventListener('click', () => { div.remove(); cfSum(); });
  div.querySelector('input').addEventListener('input', cfSum);
  return div;
}
function cfSum(){
  const tot = [...document.querySelectorAll('#cf-crit input')].reduce((a,i) => a + (parseFloat(i.value)||0), 0);
  const el = $('#cf-sum');
  el.innerHTML = `น้ำหนักรวม <b>${tot}%</b> / 100%`;
  el.classList.toggle('err', tot !== 100);
  return tot;
}
function setupCustomForm(){
  const form = $('#custom-form');
  $('#btn-custom-toggle').addEventListener('click', () => {
    form.classList.toggle('open');
    if (form.classList.contains('open') && !$('#cf-crit').children.length){
      $('#cf-crit').append(cfRow('TGAT2', 30), cfRow('AL_MATH1', 40), cfRow('AL_PHYS', 30));
      cfSum();
    }
  });
  $('#cf-cancel').addEventListener('click', () => form.classList.remove('open'));
  $('#cf-add-row').addEventListener('click', () => { $('#cf-crit').append(cfRow()); cfSum(); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#cf-name').value.trim() || 'คณะที่กรอกเอง';
    const uni = $('#cf-uni').value.trim() || 'กรอกเอง';
    const min = parseFloat($('#cf-min').value);
    const crit = [...document.querySelectorAll('#cf-crit .cf-crit-row')].map(r => ({
      code: r.querySelector('select').value, w: parseFloat(r.querySelector('input').value) || 0
    })).filter(c => c.w > 0);
    if (!crit.length || cfSum() !== 100){ cfSum(); return; }
    const id = 'custom-' + (++customSeq);
    PROGRAMS.push({ id, uni, faculty:name, field:'', round:'กรอกเกณฑ์เอง', quota:null, subj:'math',
      criteria:crit, gpaxMin:null,
      statMin: isNaN(min) ? null : min, statMax: isNaN(min) ? null : min + 15, statYear:2568, custom:true });
    addProgram(id);
    form.classList.remove('open');
    $('#cf-name').value = ''; $('#cf-uni').value = ''; $('#cf-min').value = ''; $('#cf-crit').innerHTML = '';
  });
}

/* ---------- results ---------- */
function addProgram(id){
  if (!added.includes(id)){ added.push(id); enterId = id; }
  renderChips(); renderResults();
}
function removeProgram(id){
  const card = document.querySelector(`.rescard[data-id="${CSS.escape(id)}"]`);
  animateOut(card, () => {
    added = added.filter(x => x !== id);
    if (targetId === id) targetId = null;
    renderChips(); renderResults();
  });
}

function renderResults(){
  const list = $('#res-list');
  $('#res-empty').classList.toggle('show', !added.length);
  $('#res-cnt').textContent = added.length ? `${added.length} คณะ · อ้างอิงคะแนนต่ำสุดปี 2568 (ตัวอย่าง)` : '';
  list.innerHTML = added.map(id => {
    const p = PROGRAMS.find(x => x.id === id);
    const ev = evalProgram(p);
    const hasStat = p.statMin != null;
    const status = hasStat ? ev.status : 'none';
    const w100 = Math.min(100, ev.weighted);
    const brkRows = ev.rows.map(r => {
      const s = SUBJ_BY_CODE[r.code];
      const missing = r.norm == null;
      return `<div class="brow ${missing ? 'missing' : ''}" ${s.subj ? `data-subj="${s.subj}"` : ''}>
        <div class="bn">${esc(s.name)}<small>${r.w}%</small></div>
        <div class="btrack"><i style="--w:${missing ? 0 : (r.contrib / r.w * 100)}"></i></div>
        <div class="bv">${missing ? 'ยังไม่กรอก' : `<b>${fmt(r.contrib)}</b> / ${r.w}`}</div>
      </div>`;
    }).join('');
    const gpaxNote = p.gpaxMin != null ? `<span>GPAX ขั้นต่ำ <b>${p.gpaxMin.toFixed(2)}</b>${scores.GPAX != null && scores.GPAX < p.gpaxMin ? ' ⚠' : ''}</span>` : '';
    return `<article class="rescard ${p.id === enterId ? 'enter' : ''}" data-status="${status}" data-id="${p.id}" data-comment-anchor="tcas-card-${p.id}">
      <div class="rc-top">
        <div class="gauge" style="--pc:${hasStat && ev.anyFilled ? ev.chance : 0}">
          <div class="pcv">${hasStat && ev.anyFilled ? '~' + ev.chance + '%' : '—'}<small>ประมาณการ</small></div>
        </div>
        <div class="rc-title">
          <h3>${esc(p.faculty)}${p.field ? ' · ' + esc(p.field) : ''}</h3>
          <div class="uni">${esc(p.uni)}</div>
          <div class="meta">
            <span>${esc(p.round)}</span>
            ${p.quota ? `<span>รับ <b>${p.quota}</b> คน</span>` : ''}
            ${hasStat ? `<span>ต่ำสุดปี ${p.statYear} <b>${fmt(p.statMin)}</b></span>` : '<span>ไม่มีสถิติปีก่อน</span>'}
            ${gpaxNote}
          </div>
        </div>
        <div class="rc-side">
          <span class="st-chip">${STATUS_FACE[status]}${STATUS_LABEL[status]}</span>
          <span class="est-tag">ประมาณการ · ปี ${p.statYear}</span>
        </div>
      </div>

      <div class="cbar-wrap">
        <div class="cbar-lab"><span>คะแนนถ่วงน้ำหนักของเรา <b>${ev.anyFilled ? fmt(ev.weighted) : '—'}</b> / 100</span>${hasStat ? `<span>สูงสุดปีก่อน ${fmt(p.statMax)}</span>` : ''}</div>
        <div class="cbar">
          <div class="fill" style="--w:${ev.anyFilled ? w100 : 0}"></div>
          ${hasStat ? `<div class="mark" style="--x:${Math.min(99, p.statMin)}" data-lab="ต่ำสุดปี ${p.statYear} · ${fmt(p.statMin)}"></div>` : ''}
        </div>
      </div>

      <div class="gapline">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${status === 'safe' ? '<path d="M20 6 9 17l-5-5"></path>' : '<path d="M12 20V10M18 20V4M6 20v-4"></path>'}</svg>
        <span>${hasStat ? gapCopy(p, ev) : 'ใส่คะแนนต่ำสุดปีก่อนในโหมดกรอกเกณฑ์เอง เพื่อดูสถานะ'}</span>
      </div>

      <div class="brk">
        <div class="brk-head"><span>องค์ประกอบคะแนน (โปร่งใส คิดจากอะไรบ้าง)</span><span>ได้ / เต็ม</span></div>
        ${brkRows}
      </div>

      <div class="rc-actions">
        <button class="btn btn-secondary btn-sm" data-act="target">ตั้งเป็นเป้าหมาย</button>
        ${(() => { const ri = rank.findIndex(r => r.id === p.id);
          if (ri >= 0) return `<button class="btn btn-ghost btn-sm" data-act="unrank">อันดับ ${ri + 1} ✓ นำออก</button>`;
          if (rank.length >= 10) return '<button class="btn btn-ghost btn-sm" disabled>อันดับเต็ม 10 แล้ว</button>';
          return '<button class="btn btn-ghost btn-sm" data-act="rank">+ เพิ่มเข้า 10 อันดับ</button>'; })()}
        <button class="rc-remove" data-act="remove"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>นำออกจากรายการ</button>
        <span class="src">ตัวอย่างข้อมูล · ตรวจจริงที่ <a href="https://www.mytcas.com" target="_blank" rel="noopener">mytcas.com</a></span>
      </div>
    </article>`;
  }).join('');

  list.querySelectorAll('[data-act="remove"]').forEach(b =>
    b.addEventListener('click', () => removeProgram(b.closest('.rescard').dataset.id)));
  list.querySelectorAll('[data-act="rank"]').forEach(b =>
    b.addEventListener('click', () => {
      const p = PROGRAMS.find(x => x.id === b.closest('.rescard').dataset.id);
      if (rank.length < 10 && !rank.some(r => r.id === p.id)){
        rank.push({ id: p.id, name: p.faculty + (p.field ? ' · ' + p.field : ''), uni: p.uni });
        rankEnterId = p.id;
        saveRank(); renderResults();
      }
    }));
  list.querySelectorAll('[data-act="unrank"]').forEach(b =>
    b.addEventListener('click', () => {
      const id = b.closest('.rescard').dataset.id;
      const rrow = document.querySelector(`.rrow[data-id="${CSS.escape(id)}"]`);
      animateOut(rrow, () => { rank = rank.filter(r => r.id !== id); saveRank(); renderResults(); });
    }));
  list.querySelectorAll('[data-act="target"]').forEach(b =>
    b.addEventListener('click', () => {
      targetId = b.closest('.rescard').dataset.id;
      renderTarget();
      const sc = document.querySelector('.scroll'), tp = document.getElementById('target-panel');
      if (sc && tp) sc.scrollTo({ top: tp.offsetTop - 84, behavior: 'smooth' });
    }));

  /* stagger เฉพาะ render แรก — กันเด้งซ้ำตอนพิมพ์คะแนน */
  if (!list.classList.contains('settled')) setTimeout(() => list.classList.add('settled'), 900);
  if (enterId){
    const card = list.querySelector(`.rescard[data-id="${CSS.escape(enterId)}"]`);
    if (card){
      const sc = document.querySelector('.scroll');
      if (sc){ const top = card.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 90; sc.scrollTo({ top, behavior: REDUCED ? 'auto' : 'smooth' }); }
    }
    enterId = null;
  }
  renderTarget();
  renderRank();
}

/* ---------- 10-อันดับ ranker (เสมือนระบบยื่นจริง) ---------- */
function renderRank(){
  const box = $('#rankbox');
  box.classList.toggle('show', rank.length > 0);
  if (!rank.length){ box.innerHTML = ''; return; }
  const rows = rank.map((r, i) => {
    const p = PROGRAMS.find(x => x.id === r.id);
    let status = 'none';
    if (p && p.statMin != null){ const ev = evalProgram(p); status = ev.anyFilled ? ev.status : 'none'; }
    const th = uniTheme(r.uni);
    return `<div class="rrow ${i < 3 ? 'top' : ''} ${r.id === rankEnterId ? 'enter' : ''}" data-status="${status}" data-id="${esc(r.id)}" draggable="true" ${th ? `style="--uni-c:${th.color}"` : ''}>
      ${th && th.logo ? `<img class="wm" src="${th.logo}" alt="" aria-hidden="true" draggable="false" />` : ''}
      <span class="grip" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg></span>
      <span class="no">${i + 1}</span>
      <span class="nm"><b>${esc(r.name)}</b><small>${esc(r.uni)}</small></span>
      <span class="rst">${STATUS_FACE[status]}${STATUS_LABEL[status]}</span>
      <span class="ops">
        <button data-op="rm" class="rx" aria-label="นำออก"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"></path></svg></button>
      </span>
    </div>`;
  }).join('');
  box.innerHTML = `
    <div class="rank-head">
      <h2>จัด 10 อันดับเสมือนจริง</h2>
      <span class="rk-cnt">${rank.length}/10 อันดับ</span>
    </div>
    <p class="rank-note">ระบบยื่นจริงให้เลือกได้สูงสุด 10 อันดับ — เรียงจาก<b style="color:var(--fg-0);">อยากเข้าที่สุด</b>ไว้บนสุด · <b style="color:var(--fg-0);">ลากแถวเพื่อสลับอันดับ</b>หรือใช้ปุ่มลูกศร</p>
    <div class="rank-rows">${rows}</div>`;
  rankEnterId = null;
  if (!box.classList.contains('settled')) setTimeout(() => box.classList.add('settled'), 800);
  box.querySelectorAll('.rrow').forEach(row => {
    const id = row.dataset.id;
    row.querySelectorAll('[data-op]').forEach(btn => btn.addEventListener('click', () => {
      const i = rank.findIndex(r => r.id === id);
      if (btn.dataset.op === 'rm'){ animateOut(row, () => { const j = rank.findIndex(r => r.id === id); if (j >= 0) rank.splice(j, 1); flashReorder(); saveRank(); renderResults(); }); }
    }));
    /* drag-to-reorder — แถวอื่นเลื่อนหลบทันทีระหว่างลาก (FLIP), commit ตอนปล่อย */
    row.addEventListener('dragstart', e => {
      dragId = id; row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', id); } catch(err){}
    });
    row.addEventListener('dragend', () => commitDragOrder(box));
    row.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const dragging = box.querySelector('.rrow.dragging');
      if (!dragging || dragging === row) return;
      /* FLIP: จำตำแหน่งเดิม → ย้าย DOM → animate ส่วนต่าง */
      const rows = [...box.querySelectorAll('.rrow')];
      const first = new Map(rows.map(x => [x, x.getBoundingClientRect().top]));
      const rect = row.getBoundingClientRect();
      const after = e.clientY > rect.top + rect.height / 2;
      row.parentNode.insertBefore(dragging, after ? row.nextSibling : row);
      rows.forEach(x => {
        if (x === dragging) return;
        const dy = first.get(x) - x.getBoundingClientRect().top;
        if (!dy) return;
        x.style.transition = 'none'; x.style.transform = `translateY(${dy}px)`;
        requestAnimationFrame(() => { x.style.transition = 'transform .22s cubic-bezier(.2,.8,.2,1)'; x.style.transform = ''; });
      });
    });
    row.addEventListener('drop', e => { e.preventDefault(); commitDragOrder(box); });
  });
}
function commitDragOrder(box){
  if (!dragId) return;
  dragId = null;
  const order = [...box.querySelectorAll('.rrow')].map(x => x.dataset.id);
  rank.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  flashReorder(); saveRank(); renderResults();
}
/* เด้งเลขอันดับหลังลากสลับ/ลบ */
function flashReorder(){
  const box = $('#rankbox');
  box.classList.add('reorder');
  setTimeout(() => box.classList.remove('reorder'), 420);
}

/* ---------- target mode (reverse calc) ---------- */
function renderTarget(){
  const panel = $('#target-panel');
  const p = PROGRAMS.find(x => x.id === targetId);
  if (!p || p.statMin == null){
    panel.classList.remove('open'); panel.innerHTML = '';
    localStorage.removeItem('ming-tcas-target');
    return;
  }
  const ev = evalProgram(p);
  const BUFFER = 2; // เผื่อความปลอดภัยเล็กน้อย
  const need = Math.max(0, (p.statMin + BUFFER) - ev.weighted); // จุดที่ normalized ทุกวิชาต้องเพิ่ม (น้ำหนักรวม 100%)
  const rows = ev.rows.map(r => {
    const s = SUBJ_BY_CODE[r.code];
    const curNorm = r.norm ?? 0;
    const needNorm = Math.min(100, curNorm + need);
    const curRaw = scores[r.code] != null ? scores[r.code] : null;
    const needRaw = needNorm * s.max / 100;
    const done = need <= 0 || (curNorm >= needNorm - 0.01);
    const pct = needRaw > 0 ? Math.min(100, (curRaw ?? 0) / needRaw * 100) : 100;
    return `<div class="tprow ${done ? 'done' : ''}">
      <span class="tn">${esc(s.name)} <small style="font-family:'JetBrains Mono';font-size:9.5px;color:var(--fg-3);">${r.w}%</small></span>
      <span class="tbar"><i style="--w:${pct}"></i></span>
      <span class="now">${curRaw != null ? fmt(curRaw) : '—'}<small>ตอนนี้</small></span>
      <span class="need">≥ ${fmt(needRaw)}<small>ต้องได้</small></span>
      <span class="delta ${done ? 'ok' : 'up'}">${done ? 'ถึงแล้ว' : '+' + fmt(needRaw - (curRaw ?? 0))}</span>
    </div>`;
  }).join('');
  panel.innerHTML = `
    <div class="tp-head">
      <div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg></div>
      <div>
        <h2>เป้าหมาย: ${esc(p.faculty)}${p.field ? ' · ' + esc(p.field) : ''} — ${esc(p.uni)}</h2>
        <p>คำนวณย้อนกลับจากคะแนนต่ำสุดปี ${p.statYear} (${fmt(p.statMin)}) + เผื่อ ${BUFFER} คะแนน · ถ้าดันทุกวิชาขึ้นเท่าๆ กัน ต้องได้ประมาณนี้</p>
      </div>
      <button class="btn btn-ghost btn-sm close" id="tp-close">ปิด</button>
    </div>
    <div class="tp-rows">${rows}</div>
    <p class="tp-note">${need <= 0
      ? 'คะแนนตอนนี้ถึงเป้าแล้ว — รักษาระดับไว้ และเผื่อใจว่าเกณฑ์ปีนี้อาจขยับขึ้นได้'
      : `ทั้งหมดนี้คือ<b style="color:var(--fg-0);">หนึ่งในหลายทาง</b> — จะดันเฉพาะวิชาที่ถนัด (เช่นวิชาน้ำหนักเยอะ) แทนก็ได้ ตัวเลขเป็นประมาณการจากสถิติปีก่อนเท่านั้น`}</p>`;
  panel.classList.add('open');
  localStorage.setItem('ming-tcas-target', JSON.stringify({
    id: p.id, name: p.faculty + (p.field ? ' · ' + p.field : ''), uni: p.uni,
    statMin: p.statMin, statYear: p.statYear,
    round: p.round || null, quota: p.quota || null,
    weighted: Math.round(ev.weighted * 100) / 100,
    gap: Math.round(ev.gap * 100) / 100,
    status: ev.anyFilled ? ev.status : 'none',
    push: ev.push ? SUBJ_BY_CODE[ev.push.code].name : null,
    criteria: ev.rows.map(r => {
      const s = SUBJ_BY_CODE[r.code];
      const curNorm = r.norm ?? 0;
      const needNorm = Math.min(100, curNorm + Math.max(0, (p.statMin + 2) - ev.weighted));
      return { name: s.name, w: r.w,
        now: scores[r.code] != null ? Math.round(scores[r.code] * 100) / 100 : null,
        need: Math.round(needNorm * s.max) / 100 };
    })
  }));
  $('#tp-close').addEventListener('click', () => { targetId = null; renderTarget(); });
}

/* ---------- tweaks bridge ---------- */
window.TCAS = {
  setTweaks({ copyTone, mockCount: mc }){
    let dirty = false;
    if (copyTone && copyTone !== tone){ tone = copyTone; dirty = true; }
    if (mc != null && (mc !== mockCount || !mockApplied)){
      mockCount = mc; mockApplied = true;
      const customs = added.filter(id => id.startsWith('custom-'));
      added = POPULAR.slice(0, mockCount).concat(customs);
      if (targetId && !added.includes(targetId)) targetId = null;
      renderChips();
      dirty = true;
    }
    if (dirty) renderResults();
  }
};

/* ---------- init ---------- */
added = POPULAR.slice(0, mockCount);
mockApplied = true;
try { const t = JSON.parse(localStorage.getItem('ming-tcas-target') || 'null');
  if (t && PROGRAMS.some(p => p.id === t.id)){ targetId = t.id; if (!added.includes(t.id)) added.push(t.id); } } catch(e){}
renderPanel();
renderChips();
setupSearch();
setupCustomForm();
renderResults();
})();
