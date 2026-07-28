/* ==========================================================================
   Admin · Exams list — sortable table, filter, search, empty state
   ========================================================================== */
(function(){
  const SUBJ = {
    'tgat2':   {grad:'var(--subj-tgat2-grad)', chip:'oklch(0.78 0.15 82 / 0.16)', chipC:'var(--subj-tgat2-fg)'},
    'tpat3':   {grad:'var(--subj-tpat3-grad)', chip:'oklch(0.62 0.18 22 / 0.18)', chipC:'var(--subj-tpat3-fg)'},
    'math':    {grad:'var(--subj-math-grad)', chip:'oklch(0.58 0.16 250 / 0.18)', chipC:'var(--subj-math-fg)'},
    'phys':    {grad:'var(--subj-phys-grad)', chip:'oklch(0.62 0.22 340 / 0.16)', chipC:'var(--subj-phys-fg)'}
  };
  const ICON = '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13l2 2 4-4"/>';
  const EXAMS = [
    {id:'e1', name:'A-Level ฟิสิกส์ · ชุดเสมือนจริง #1', subject:'phys', level:'A-Level', questions:30, course:'A-Level ฟิสิกส์ พิชิตข้อสอบ TCAS68', attempts:842},
    {id:'e2', name:'A-Level ฟิสิกส์ · ชุดเสมือนจริง #2', subject:'phys', level:'A-Level', questions:30, course:'A-Level ฟิสิกส์ พิชิตข้อสอบ TCAS68', attempts:610},
    {id:'e3', name:'A-Level คณิต · ตะลุยโจทย์แคลคูลัส', subject:'math', level:'A-Level', questions:25, course:'A-Level คณิต ประยุกต์ ครบทุกบท', attempts:528},
    {id:'e4', free:true, name:'TGAT2 · การคิดอย่างมีเหตุผล ชุด 3', subject:'tgat2', level:null, questions:40, course:'TGAT2 การคิดอย่างมีเหตุผล', attempts:466},
    {id:'e5', name:'TPAT3 · ความถนัดวิทย์ ชุดรวม', subject:'tpat3', level:null, questions:35, course:'TPAT3 ความถนัด วิทย์–เทคโน–วิศวะ', attempts:391},
    {id:'e6', name:'คณิต ม.ปลาย · ลำดับและอนุกรม', subject:'math', level:'ม.ปลาย', questions:20, course:'คณิต ม.ปลาย เนื้อหาครบทุกเทอม', attempts:284},
    {id:'e7', free:true, name:'ฟิสิกส์ ม.ปลาย · กลศาสตร์เบื้องต้น', subject:'phys', level:'ม.ปลาย', questions:18, course:null, attempts:201},
    {id:'e8', name:'A-Level ฟิสิกส์ · ไฟฟ้าและแม่เหล็ก', subject:'phys', level:'A-Level', questions:16, course:'A-Level ฟิสิกส์ พิชิตข้อสอบ TCAS68', attempts:160}
  ];
  /* ---- premium confirm modal (แทน alert confirm) ---- */
  const CF_ICONS = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"/></svg>',
    danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>'
  };
  function admConfirm({ title, body, tone = 'pin', confirmLabel = 'ยืนยัน' }){
    return new Promise(resolve => {
      const veil = document.createElement('div');
      veil.className = 'adm-cf-veil';
      veil.innerHTML = '<div class="adm-cf" role="alertdialog" aria-modal="true" data-tone="' + tone + '">'
        + '<div class="cf-ico">' + (CF_ICONS[tone] || CF_ICONS.pin) + '</div>'
        + '<h3>' + title + '</h3>'
        + '<p>' + body + '</p>'
        + '<div class="cf-acts"><button class="cf-cancel" type="button">ยกเลิก</button><button class="cf-ok" type="button">' + confirmLabel + '</button></div>'
        + '</div>';
      document.body.appendChild(veil);
      let done = false;
      function close(val){
        if (done) return; done = true;
        veil.classList.add('closing');
        setTimeout(() => { veil.remove(); resolve(val); }, 200);
        document.removeEventListener('keydown', onKey);
      }
      function onKey(e){ if (e.key === 'Escape') close(false); if (e.key === 'Enter') close(true); }
      veil.querySelector('.cf-cancel').addEventListener('click', () => close(false));
      veil.querySelector('.cf-ok').addEventListener('click', () => close(true));
      veil.addEventListener('click', e => { if (e.target === veil) close(false); });
      document.addEventListener('keydown', onKey);
      veil.querySelector('.cf-ok').focus();
    });
  }

  /* ---- pinned exam (แสดงเป็นการ์ดใหญ่บนหน้าข้อสอบนักเรียน) ---- */
  const PIN_KEY = 'ming-pinned-exam';
  const PIN_META = {
    e1:{tag:'ฟิสิกส์ · A-Level', small:'Mock #1', big:'ฟิสิกส์<br>เสมือนจริง', mins:90, avg:'21 / 30'},
    e2:{tag:'ฟิสิกส์ · A-Level', small:'Mock #2', big:'ฟิสิกส์<br>เสมือนจริง', mins:90, avg:'19 / 30'},
    e3:{tag:'คณิต · A-Level', small:'ตะลุยโจทย์', big:'แคลคูลัส', mins:75, avg:'14 / 25'},
    e4:{tag:'TGAT2 · ฉบับล่าสุด', small:'Mock #04', big:'การคิด<br>อย่างมีเหตุผล', mins:60, avg:'18 / 30'},
    e5:{tag:'TPAT3', small:'ชุดรวม', big:'ความถนัด<br>วิทย์-วิศวะ', mins:75, avg:'20 / 35'},
    e6:{tag:'คณิต · ม.ปลาย', small:'เก็บคะแนน', big:'ลำดับ<br>และอนุกรม', mins:40, avg:'12 / 20'},
    e7:{tag:'ฟิสิกส์ · ม.ปลาย', small:'พื้นฐาน', big:'กลศาสตร์<br>เบื้องต้น', mins:35, avg:'11 / 18'},
    e8:{tag:'ฟิสิกส์ · A-Level', small:'เฉพาะบท', big:'ไฟฟ้า<br>แม่เหล็ก', mins:45, avg:'9 / 16'}
  };
  /* e.subject เป็นคีย์อยู่แล้ว (ดู subjects.js) — เก็บ helper ไว้แปลงเป็น label ตอนแสดงผล */
  const SL = (k) => (window.Subjects ? window.Subjects.label(k) : k);
  function getPin(){ try { const p = JSON.parse(localStorage.getItem(PIN_KEY) || 'null'); return p ? (p.id || null) : 'e4'; } catch(_) { return 'e4'; } }
  async function setPin(id){
    const e = EXAMS.find(x => x.id === id);
    if (getPin() === id){
      /* กดซ้ำ = ยกเลิกปักหมุด */
      if (!await admConfirm({ tone: 'pin', title: 'ยกเลิกปักหมุด?', confirmLabel: 'ยกเลิกปักหมุด',
        body: 'เอา <b>' + e.name + '</b> ออกจากการ์ดใหญ่บนหน้าข้อสอบของนักเรียน' })) return;
      try { localStorage.setItem(PIN_KEY, JSON.stringify({ id: null })); } catch(_){}
      render(); return;
    }
    if (!await admConfirm({ tone: 'pin', title: 'ปักหมุดชุดนี้?', confirmLabel: 'ปักหมุด',
      body: '<b>' + e.name + '</b> จะขึ้นเป็นการ์ดใหญ่บนหน้าข้อสอบของนักเรียน — ปักได้ทีละ 1 ชุด ชุดที่ปักอยู่เดิมจะถูกแทนที่' })) return;
    const m = PIN_META[id] || {};
    try { localStorage.setItem(PIN_KEY, JSON.stringify({
      id, name: e.name, subj: e.subject, tag: m.tag || SL(e.subject),
      small: m.small || '', big: m.big || e.name, mins: m.mins || 60,
      questions: e.questions, attempts: e.attempts, avg: m.avg || ''
    })); } catch(_){}
    render();
  }

  const tbody = document.getElementById('tbody');
  const noResult = document.getElementById('no-result');
  let q='', fSubject='all', sortKey='attempts', sortDir=-1, view='rows';

  const PIN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"/></svg>';
  function row(e){
    const s = SUBJ[e.subject];
    const pinned = getPin() === e.id;
    const access = e.free
      ? '<span class="acc-badge free">ฟรี · ทุกคนทำได้</span>'
      : '<span class="acc-badge subj">ปลดล็อกด้วยคอร์สวิชา ' + SL(e.subject) + '</span>';
    return `<tr data-id="${e.id}">
      <td><div class="ex-name"><div class="ic" style="background:${s.grad}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON}</svg></div><div><b>${e.name}${pinned ? ' <span class="pin-badge">ปักหมุด</span>' : ''}</b><span>แก้ไขล่าสุด ${e.id==='e1'?'วันนี้':'สัปดาห์นี้'}</span></div></div></td>
      <td><span class="subj-chip" style="background:${s.chip};color:${s.chipC}">${SL(e.subject)}${e.level ? ' · ' + e.level : ''}</span></td>
      <td><span class="num-cell">${e.questions}</span> <span style="font-size:11px;color:var(--fg-3)">ข้อ</span></td>
      <td>${access}</td>
      <td><span class="num-cell">${e.attempts.toLocaleString()}</span></td>
      <td><div class="row-acts">
        <button class="ic-btn pin-btn${pinned ? ' on' : ''}" title="${pinned ? 'ปักหมุดอยู่ · แสดงบนหน้าข้อสอบ' : 'ปักหมุดขึ้นหน้าข้อสอบ'}" data-pin="${e.id}" onclick="event.stopPropagation()">${PIN_SVG}</button>
        <a class="ic-btn" href="Admin Exam Editor.html?id=${e.id}" title="แต่งข้อสอบ" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></a>
        <button class="ic-btn" title="ทำซ้ำ" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
        <button class="ic-btn danger del-btn" title="ลบ" data-del="${e.id}" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div></td>
    </tr>`;
  }
  function card(e){
    const s = SUBJ[e.subject];
    const pinned = getPin() === e.id;
    const access = e.free
      ? '<span class="acc-badge free">ฟรี</span>'
      : '<span class="acc-badge subj">ปลดล็อกด้วยคอร์ส</span>';
    return `<article class="exc" data-id="${e.id}">
      <div class="top"><div class="ic" style="background:${s.grad}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON}</svg></div><h3>${e.name}</h3></div>
      <div class="meta"><span class="subj-chip" style="background:${s.chip};color:${s.chipC}">${SL(e.subject)}${e.level ? ' · ' + e.level : ''}</span>${access}${pinned ? '<span class="pin-badge">ปักหมุด</span>' : ''}</div>
      <div class="stat-row"><span><b>${e.questions}</b> ข้อ</span><span><b>${e.attempts.toLocaleString()}</b> ครั้งที่ทำ</span></div>
    </article>`;
  }

  const cardsEl = document.getElementById('exam-cards');
  function render(){
    let vis = EXAMS.filter(e=>{
      if(fSubject!=='all' && e.subject!==fSubject) return false;
      if(q && !e.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    vis.sort((a,b)=>{ let x=a[sortKey], y=b[sortKey]; if(typeof x==='string'){x=x||'';y=y||'';return sortDir*x.localeCompare(y);} return sortDir*((x||0)-(y||0)); });
    if(!vis.length){
      document.getElementById('table').style.display='none'; cardsEl.style.display='none'; noResult.style.display='block';
      noResult.innerHTML='<div class="adm-empty"><div class="eic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></div><h3>ไม่พบชุดข้อสอบ</h3><p>ลองเปลี่ยนคำค้นหรือตัวกรอง</p></div>';
      return;
    }
    noResult.style.display='none';
    if(view==='grid'){
      document.getElementById('table').style.display='none';
      cardsEl.style.display='';
      cardsEl.innerHTML = vis.map(card).join('');
      cardsEl.querySelectorAll('.exc').forEach(c=>c.addEventListener('click', ()=>{ window.location.href='Admin Exam Editor.html?id='+c.dataset.id; }));
      return;
    }
    cardsEl.style.display='none';
    document.getElementById('table').style.display='';
    tbody.innerHTML = vis.map(row).join('');
    tbody.querySelectorAll('tr').forEach(tr=>tr.addEventListener('click', ()=>{ window.location.href='Admin Exam Editor.html?id='+tr.dataset.id; }));
    tbody.querySelectorAll('.pin-btn').forEach(b=>b.addEventListener('click', ()=>setPin(b.dataset.pin)));
    tbody.querySelectorAll('.del-btn').forEach(b=>b.addEventListener('click', async ()=>{
      const e = EXAMS.find(x => x.id === b.dataset.del);
      if (!await admConfirm({ tone: 'danger', title: 'ลบชุดข้อสอบถาวร?', confirmLabel: 'ลบถาวร',
        body: '<b>' + e.name + '</b> จะหายจากระบบ นักเรียนจะไม่เห็นชุดนี้อีก และสถิติการทำ <b>' + e.attempts.toLocaleString() + ' ครั้ง</b> จะถูกลบด้วย' })) return;
      const i = EXAMS.findIndex(x => x.id === b.dataset.del);
      if (i >= 0) EXAMS.splice(i, 1);
      if (getPin() === b.dataset.del){ try { localStorage.setItem(PIN_KEY, JSON.stringify({ id: null })); } catch(_){} }
      render();
    }));
    document.querySelectorAll('#table thead th[data-sort]').forEach(th=>th.classList.toggle('sorted', th.dataset.sort===sortKey));
  }
  document.querySelectorAll('#table thead th[data-sort]').forEach(th=>th.addEventListener('click', ()=>{
    const k=th.dataset.sort; if(sortKey===k) sortDir*=-1; else { sortKey=k; sortDir = (k==='attempts'||k==='questions')?-1:1; } render();
  }));
  document.getElementById('search').addEventListener('input', e=>{ q=e.target.value.trim(); render(); });
  document.querySelectorAll('#f-subject button').forEach(b=>b.addEventListener('click', ()=>{
    document.querySelectorAll('#f-subject button').forEach(x=>x.setAttribute('aria-pressed','false'));
    b.setAttribute('aria-pressed','true');
    fSubject = b.dataset.v; render();
  }));
  document.querySelectorAll('#view-toggle button').forEach(b=>b.addEventListener('click', ()=>{
    document.querySelectorAll('#view-toggle button').forEach(x=>x.setAttribute('aria-pressed','false'));
    b.setAttribute('aria-pressed','true');
    view = b.dataset.view;
    try { localStorage.setItem('adm-exams-view', view); } catch(_){}
    render();
  }));
  try {
    const sv = localStorage.getItem('adm-exams-view');
    if(sv==='grid'){ view='grid'; document.querySelectorAll('#view-toggle button').forEach(x=>x.setAttribute('aria-pressed', String(x.dataset.view==='grid'))); }
  } catch(_){}

  window.__onTweak = function(k,v){
    if(k==='view'){
      const blocks=document.querySelectorAll('.sum-strip,.adm-toolbar,.exam-table-wrap,.exam-cards');
      let empty=document.getElementById('exams-empty');
      if(v==='empty'){ blocks.forEach(b=>b.style.display='none'); noResult.style.display='none';
        if(!empty){ empty=document.createElement('div'); empty.id='exams-empty'; empty.className='adm-empty';
          empty.innerHTML='<div class="eic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg></div><h3>ยังไม่มีชุดข้อสอบ</h3><p>สร้างชุดข้อสอบแรก แล้วผูกเข้ากับคอร์สเพื่อให้นักเรียนทำได้</p><a href="Admin Exam Editor.html" class="btn btn-primary" style="margin-top:8px">สร้างชุดข้อสอบ →</a>';
          document.querySelector('.adm-page').appendChild(empty); }
        empty.style.display='flex';
      } else { blocks.forEach(b=>b.style.display=''); if(empty) empty.style.display='none'; render(); }
    }
  };
  render();
})();
