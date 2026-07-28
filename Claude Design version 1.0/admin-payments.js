/* ==========================================================================
   Admin · การเงิน (read-only reconciliation)
   master-detail · 2-state (paid / failed) · keyboard nav · search
   ========================================================================== */
(function(){
  const AV = ['oklch(0.6 0.2 145)','oklch(0.58 0.22 5)','oklch(0.66 0.2 50)','oklch(0.5 0.18 210)','oklch(0.55 0.2 295)','oklch(0.62 0.2 230)','oklch(0.7 0.18 165)','oklch(0.66 0.22 320)'];
  const COURSE_ICON = {
    'A-Level ฟิสิกส์ พิชิตข้อสอบ TCAS68':'<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5"/>',
    'A-Level คณิต ประยุกต์ ครบทุกบท':'<path d="m12 20 9-9M3 11l9-9M3 11v6.5A2.5 2.5 0 0 0 5.5 20H12"/>',
    'TPAT3 ความถนัด วิทย์–เทคโน–วิศวะ':'<path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4"/>',
    'TGAT2 การคิดอย่างมีเหตุผล':'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    'คณิต ม.ปลาย เนื้อหาครบทุกเทอม':'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    'ฟิสิกส์ ม.ปลาย เนื้อหาครบทุกเทอม':'<path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4"/>'
  };
  const TX = [
    {id:'MNG-19A3D0', name:'ธนกร พงษ์ไพบูลย์', init:'ธพ', email:'thanakorn.p@gmail.com', phone:'08x-xxx-4821', course:'A-Level ฟิสิกส์ พิชิตข้อสอบ TCAS68', amount:1800, status:'paid', time:'30 พ.ค. 2026 · 09:48', rel:'2 นาทีที่แล้ว', coupon:null, charge:'chrg_5f8Aq2Lp'},
    {id:'MNG-7C0918', name:'ศุภวิชญ์ ใจเย็น', init:'ศจ', email:'supawit.jy@gmail.com', phone:'06x-xxx-1190', course:'TPAT3 ความถนัด วิทย์–เทคโน–วิศวะ', amount:1900, status:'paid', time:'30 พ.ค. 2026 · 09:12', rel:'38 นาทีที่แล้ว', coupon:null, charge:'chrg_5f8Ak0Rd'},
    {id:'MNG-2B5E70', name:'อชิรญา โชติกุล', init:'อช', email:'achiraya.ch@gmail.com', phone:'09x-xxx-7733', course:'TGAT2 การคิดอย่างมีเหตุผล', amount:1600, status:'paid', time:'30 พ.ค. 2026 · 08:30', rel:'2 ชั่วโมงที่แล้ว', coupon:{code:'MING20', off:400}, charge:'chrg_5f89zX2m'},
    {id:'MNG-7B22E9', name:'กิตติพงศ์ วัฒนา', init:'กว', email:'kittipong.w@gmail.com', phone:'08x-xxx-2055', course:'A-Level คณิต ประยุกต์ ครบทุกบท', amount:1500, status:'failed', reason:'หมดอายุ', time:'30 พ.ค. 2026 · 08:02', rel:'3 ชั่วโมงที่แล้ว', coupon:null, charge:'chrg_5f89tQ7v'},
    {id:'MNG-19A3C1', name:'ณัฐริกา บุญมี', init:'ณบ', email:'nattharika.b@gmail.com', phone:'06x-xxx-9921', course:'A-Level ฟิสิกส์ พิชิตข้อสอบ TCAS68', amount:1800, status:'paid', time:'29 พ.ค. 2026 · 21:14', rel:'เมื่อวาน', coupon:null, charge:'chrg_5f7Rd1Kp'},
    {id:'MNG-4D8A22', name:'พิมพ์มาดา ศรีสุข', init:'พศ', email:'pimmada.s@gmail.com', phone:'09x-xxx-3380', course:'คณิต ม.ปลาย เนื้อหาครบทุกเทอม', amount:1900, status:'paid', time:'29 พ.ค. 2026 · 18:40', rel:'เมื่อวาน', coupon:{code:'MING20', off:380}, charge:'chrg_5f7Pb8Lq'},
    {id:'MNG-6F1B09', name:'ภูริณัฐ ตันติวงศ์', init:'ภต', email:'phurinat.t@gmail.com', phone:'08x-xxx-5512', course:'TPAT3 ความถนัด วิทย์–เทคโน–วิศวะ', amount:1900, status:'paid', time:'29 พ.ค. 2026 · 15:22', rel:'เมื่อวาน', coupon:null, charge:'chrg_5f7Mk3Rt'},
    {id:'MNG-3E90C2', name:'จิรายุ เพชรน้ำหนึ่ง', init:'จพ', email:'jirayu.p@gmail.com', phone:'06x-xxx-8847', course:'ฟิสิกส์ ม.ปลาย เนื้อหาครบทุกเทอม', amount:2000, status:'paid', time:'28 พ.ค. 2026 · 20:05', rel:'2 วันก่อน', coupon:null, charge:'chrg_5f6Wq9Lz'},
    {id:'MNG-0F71B5', name:'สุพิชญา คงทอง', init:'สค', email:'supichaya.k@gmail.com', phone:'09x-xxx-1276', course:'TGAT2 การคิดอย่างมีเหตุผล', amount:2000, status:'paid', time:'28 พ.ค. 2026 · 12:30', rel:'2 วันก่อน', coupon:{code:'EARLY15', off:300}, charge:'chrg_5f6Td2Kp'},
    {id:'MNG-8A4419', name:'ธีรภัทร อุดมสุข', init:'ธอ', email:'teerapat.u@gmail.com', phone:'08x-xxx-6603', course:'A-Level คณิต ประยุกต์ ครบทุกบท', amount:1500, status:'failed', reason:'ยกเลิก', time:'27 พ.ค. 2026 · 22:48', rel:'3 วันก่อน', coupon:null, charge:'chrg_5f5Rb0Qm'},
    {id:'MNG-55C1A8', name:'ชนิกานต์ มีสุข', init:'ชม', email:'chanikan.m@gmail.com', phone:'06x-xxx-4419', course:'A-Level ฟิสิกส์ พิชิตข้อสอบ TCAS68', amount:1800, status:'paid', time:'27 พ.ค. 2026 · 10:15', rel:'3 วันก่อน', coupon:null, charge:'chrg_5f5Kp7Lt'},
    {id:'MNG-9C30D4', name:'วรินทร พูนผล', init:'วพ', email:'warintorn.p@gmail.com', phone:'09x-xxx-2088', course:'TPAT3 ความถนัด วิทย์–เทคโน–วิศวะ', amount:1900, status:'paid', time:'26 พ.ค. 2026 · 19:30', rel:'4 วันก่อน', coupon:{code:'WELCOME10', off:190}, charge:'chrg_5f4Wd5Rp'}
  ];
  TX.forEach((t,i)=>{ t.av = AV[i % AV.length]; t.icon = COURSE_ICON[t.course] || COURSE_ICON['TGAT2 การคิดอย่างมีเหตุผล']; t.fee = t.status==='paid' ? Math.round(t.amount*0.0165) : 0; t.net = t.amount - t.fee; const dm = t.time.match(/^(\d+)/); t.daysAgo = dm ? (30 - parseInt(dm[1],10)) : 0; t.dayMs = Date.UTC(2026,4,30 - t.daysAgo); });

  const rowsEl = document.getElementById('rows');
  const detailEl = document.getElementById('detail');
  let filter='all', query='', selId=TX[0].id, fSubject='all', fSort='recent', fCoupon=false, rangeStart=null, rangeEnd=null;

  function visible(){ let list = TX.filter(t=>{
    if(filter!=='all' && t.status!==filter) return false;
    if(rangeStart!==null && (t.dayMs < rangeStart || t.dayMs > rangeEnd)) return false;
    if(fSubject!=='all' && !t.course.includes(fSubject)) return false;
    if(fCoupon && !t.coupon) return false;
    if(query){ const q=query.toLowerCase(); return (t.name+t.course+t.id+t.email).toLowerCase().includes(q); }
    return true;
  });
    if(fSort==='amount-hi') list=list.slice().sort((a,b)=>b.amount-a.amount);
    else if(fSort==='amount-lo') list=list.slice().sort((a,b)=>a.amount-b.amount);
    return list;
  }

  function rowHTML(t){
    const amtCls = t.status==='failed' ? 'mr-amt void' : 'mr-amt';
    const pst = t.status==='paid' ? '<span class="pst paid"><span class="d"></span>สำเร็จ</span>' : '<span class="pst failed"><span class="d"></span>'+t.reason+'</span>';
    return `<div class="md-row${t.id===selId?' sel':''}" data-id="${t.id}" tabindex="0">
      <div class="av" style="background:linear-gradient(135deg,${t.av},oklch(from ${t.av} calc(l + 0.08) c calc(h + 20)))">${t.init}</div>
      <div class="mr-info"><b>${t.name}</b><div class="mr-sub">${t.course}</div></div>
      <div class="mr-right"><div class="${amtCls}">฿${t.amount.toLocaleString()}</div><div class="mr-time">${t.rel}</div></div>
    </div>`;
  }

  function renderList(){
    const vis = visible();
    if(vis.length===0){ rowsEl.innerHTML = '<div class="md-empty"><div class="ei"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></div><b>ไม่พบรายการ</b><span>ลองเปลี่ยนคำค้นหรือตัวกรอง</span></div>'; return; }
    if(!vis.some(t=>t.id===selId)) selId = vis[0].id;
    rowsEl.innerHTML = vis.map(rowHTML).join('');
    rowsEl.querySelectorAll('.md-row').forEach(r=>r.addEventListener('click', ()=>select(r.dataset.id)));
    renderDetail();
  }

  function renderDetail(){
    const t = TX.find(x=>x.id===selId);
    if(!t){ detailEl.innerHTML=''; return; }
    const paid = t.status==='paid';
    const couponRow = t.coupon ? `<div class="dt-row"><span class="k">โค้ดส่วนลด</span><span class="v">${t.coupon.code} · −฿${t.coupon.off}</span></div>` : '';
    const failNote = paid ? '' : `<div class="dt-fail-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg><p>${t.reason==='หมดอายุ'?'QR หมดอายุก่อนชำระ':'ผู้ซื้อยกเลิกก่อนชำระ'} — เกตเวย์ไม่ตัดเงิน ไม่มีรายรับจากรายการนี้ ผู้ซื้อสร้างรายการใหม่ได้เอง</p></div>`;
    const netBlock = paid ? `<div class="dt-net">
        <div class="nr"><span class="k">ยอดเรียกเก็บ</span><span class="nv">฿${t.amount.toLocaleString()}.00</span></div>
        <div class="nr"><span class="k">ค่าธรรมเนียมเกตเวย์ (1.65%)</span><span class="nv">−฿${t.fee}.00</span></div>
        <div class="nr tot"><span class="k">รายได้สุทธิ</span><span class="nv">฿${t.net.toLocaleString()}.00</span></div>
      </div>` : '';
    const acts = paid ? `<div class="dt-acts">
        <button class="btn btn-primary btn-sm"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>ใบเสร็จ PDF</button>
        <button class="btn btn-ghost btn-sm"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 12 0v1"/></svg>ดูโปรไฟล์</button>
        <button class="btn btn-ghost btn-sm"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Line</button>
      </div>` : `<div class="dt-acts">
        <button class="btn btn-ghost btn-sm"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>ติดต่อผู้ซื้อ</button>
      </div>`;
    detailEl.innerHTML = `
      <div class="dt-top">
        <div class="dt-buyer">
          <div class="av" style="background:linear-gradient(135deg,${t.av},oklch(from ${t.av} calc(l + 0.08) c calc(h + 20)))">${t.init}</div>
          <div class="bi"><b>${t.name}</b><span>${t.email}</span></div>
        </div>
        <div class="dt-amt${paid?'':' void'}"><span class="cur">฿</span>${t.amount.toLocaleString()}.00</div>
        <div class="dt-meta">
          ${paid?'<span class="pst paid"><span class="d"></span>ชำระสำเร็จ</span>':'<span class="pst failed"><span class="d"></span>'+t.reason+'</span>'}
          <span class="recon-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>ยืนยันโดยเกตเวย์</span>
        </div>
      </div>
      <div class="dt-body">
        ${failNote}
        <div class="dt-row"><span class="k">คอร์ส</span><span class="v">${t.course}</span></div>
        <div class="dt-row"><span class="k">วิธีชำระเงิน</span><span class="v"><span class="pp">PromptPay</span> QR · พร้อมเพย์</span></div>
        <div class="dt-row"><span class="k">ผู้ให้บริการ</span><span class="v">Opn Payments</span></div>
        ${couponRow}
        <div class="dt-row"><span class="k">เลขอ้างอิง</span><span class="v mono">${t.id}</span></div>
        <div class="dt-row"><span class="k">Charge ID</span><span class="v mono">${t.charge}</span></div>
        <div class="dt-row"><span class="k">${paid?'ชำระเมื่อ':'รายการเมื่อ'}</span><span class="v">${t.time}</span></div>
        <div class="dt-row"><span class="k">เบอร์ติดต่อ</span><span class="v">${t.phone}</span></div>
        ${netBlock}
        ${acts}
      </div>`;
  }

  function select(id){ selId=id; rowsEl.querySelectorAll('.md-row').forEach(r=>r.classList.toggle('sel', r.dataset.id===id)); renderDetail(); const el=rowsEl.querySelector('.md-row.sel'); if(el) el.scrollIntoView({block:'nearest'}); }

  // tabs
  document.querySelectorAll('#tabs button').forEach(b=>b.addEventListener('click', ()=>{
    document.querySelectorAll('#tabs button').forEach(x=>x.setAttribute('aria-pressed','false'));
    b.setAttribute('aria-pressed','true'); filter=b.dataset.filter; renderList();
  }));
  // search
  document.getElementById('search').addEventListener('input', e=>{ query=e.target.value.trim(); renderList(); });
  // receipt filters
  document.getElementById('f-subject').addEventListener('change', e=>{ fSubject=e.target.value; renderList(); });

  // ===== calendar range picker =====
  (function(){
    const btn=document.getElementById('f-date-btn'), pop=document.getElementById('cal-pop'), grid=document.getElementById('cal-grid'),
          title=document.getElementById('cal-title'), lbl=document.getElementById('f-date-lbl'), hint=document.getElementById('cal-hint');
    const TH=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    const txDays=new Set(TX.map(t=>t.dayMs));
    let vY=2026, vM=4, pick=null; // pick=first click ms
    function fmt(ms){ const d=new Date(ms); return d.getUTCDate()+' '+TH[d.getUTCMonth()]; }
    function draw(){
      title.textContent=TH[vM]+' '+(vY+543);
      const first=new Date(Date.UTC(vY,vM,1)), lead=(first.getUTCDay()+6)%7, dim=new Date(Date.UTC(vY,vM+1,0)).getUTCDate();
      let h='';
      for(let i=0;i<lead;i++) h+='<button class="cal-cell empty"></button>';
      for(let d=1;d<=dim;d++){ const ms=Date.UTC(vY,vM,d); let c='cal-cell';
        if(txDays.has(ms)) c+=' has-tx';
        if(rangeStart!==null && ms>=rangeStart && ms<=rangeEnd){ c+=(rangeStart===rangeEnd)?' edge single':(ms===rangeStart?' edge start':ms===rangeEnd?' edge end':' in-range'); }
        h+=`<button class="${c}" data-ms="${ms}">${d}</button>`;
      }
      grid.innerHTML=h;
      grid.querySelectorAll('.cal-cell:not(.empty)').forEach(b=>b.addEventListener('click',()=>onPick(+b.dataset.ms)));
    }
    function onPick(ms){
      // click the same day again to cancel the selection
      if(pick===null && rangeStart!==null && ms===rangeStart && ms===rangeEnd){ rangeStart=rangeEnd=null; hint.textContent='เลือกวันเริ่ม'; sync(); draw(); renderList(); return; }
      if(pick!==null && ms===pick){ pick=null; rangeStart=rangeEnd=null; hint.textContent='เลือกวันเริ่ม'; sync(); draw(); renderList(); return; }
      if(pick===null){ pick=ms; rangeStart=ms; rangeEnd=ms; hint.textContent='เลือกอีกวันเพื่อทำเป็นช่วง · กดวันเดิมซ้ำเพื่อยกเลิก'; }
      else { if(ms<pick){ rangeStart=ms; rangeEnd=pick; } else { rangeStart=pick; rangeEnd=ms; } pick=null; hint.textContent='เลือกวันเริ่ม'; }
      sync(); draw(); renderList();
    }
    function sync(){
      if(rangeStart===null){ lbl.textContent='ทุกช่วงเวลา'; btn.dataset.active='0'; }
      else { lbl.textContent = rangeStart===rangeEnd ? fmt(rangeStart) : fmt(rangeStart)+' – '+fmt(rangeEnd); btn.dataset.active='1'; }
    }
    btn.addEventListener('click',e=>{ e.stopPropagation(); const o=pop.classList.toggle('open'); btn.setAttribute('aria-expanded',String(o)); if(o) draw(); });
    pop.addEventListener('click',e=>e.stopPropagation());
    document.addEventListener('click',()=>{ pop.classList.remove('open'); btn.setAttribute('aria-expanded','false'); });
    document.getElementById('cal-prev').addEventListener('click',()=>{ vM--; if(vM<0){vM=11;vY--;} draw(); });
    document.getElementById('cal-next').addEventListener('click',()=>{ vM++; if(vM>11){vM=0;vY++;} draw(); });
    document.getElementById('cal-clear').addEventListener('click',()=>{ rangeStart=rangeEnd=pick=null; hint.textContent='เลือกวันเริ่ม'; sync(); draw(); renderList(); });
  })();
  document.getElementById('f-sort').addEventListener('change', e=>{ fSort=e.target.value; renderList(); });
  document.getElementById('f-coupon').addEventListener('click', function(){ fCoupon=!fCoupon; this.setAttribute('aria-pressed', String(fCoupon)); renderList(); });
  // range (cosmetic toggle)
  document.querySelectorAll('#range-sel button').forEach(b=>b.addEventListener('click', ()=>{
    document.querySelectorAll('#range-sel button').forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true');
  }));
  // keyboard ↑↓
  document.addEventListener('keydown', e=>{
    if(e.target.tagName==='INPUT') return;
    if(e.key!=='ArrowDown' && e.key!=='ArrowUp') return;
    const vis = visible(); if(!vis.length) return;
    e.preventDefault();
    let idx = vis.findIndex(t=>t.id===selId);
    idx = e.key==='ArrowDown' ? Math.min(vis.length-1, idx+1) : Math.max(0, idx-1);
    select(vis[idx].id);
  });

  // zebra via attribute (CSS hook)
  const style = document.createElement('style');
  style.textContent = ':root[data-zebra="on"] .md-row:nth-child(even){ background: oklch(from var(--bg-1) calc(l + 0.012) c h); } :root[data-zebra="on"] .md-row:nth-child(even):hover, :root[data-zebra="on"] .md-row.sel{ background: var(--bg-2); }';
  document.head.appendChild(style);

  // demo empty state via tweak
  window.__onTweak = function(k,v){
    if(k==='view'){
      const md = document.querySelector('.md'), strip=document.querySelector('.sum-strip'), tabs=document.querySelector('.tabs').parentElement;
      let empty = document.getElementById('pay-empty');
      if(v==='empty'){
        md.style.display='none'; if(strip) strip.style.opacity='0.4'; tabs.style.display='none';
        if(!empty){ empty=document.createElement('div'); empty.id='pay-empty'; empty.className='adm-empty';
          empty.innerHTML='<div class="eic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/></svg></div><h3>ยังไม่มีธุรกรรม</h3><p>เมื่อมีนักเรียนชำระเงินผ่าน PromptPay รายการจะเข้ามาที่นี่โดยอัตโนมัติ</p>';
          document.querySelector('.adm-page').appendChild(empty);
        }
        empty.style.display='flex';
      } else {
        md.style.display=''; if(strip) strip.style.opacity=''; tabs.style.display='flex';
        if(empty) empty.style.display='none';
      }
    }
  };

  renderList();

  // ===== coupon impact (derived from paid TX) =====
  (function(){
    const paid = TX.filter(t=>t.status==='paid' && t.coupon);
    const paidAll = TX.filter(t=>t.status==='paid');
    const byCode = {};
    let totalOff = 0;
    paid.forEach(t=>{ totalOff += t.coupon.off; (byCode[t.coupon.code] = byCode[t.coupon.code] || {code:t.coupon.code, off:0, n:0}); byCode[t.coupon.code].off += t.coupon.off; byCode[t.coupon.code].n++; });
    const codes = Object.values(byCode).sort((a,b)=>b.off-a.off);
    const maxOff = codes.length ? codes[0].off : 1;
    document.getElementById('cpn-total').innerHTML = '<span class="cur">฿</span>'+totalOff.toLocaleString();
    document.getElementById('cpn-uses').textContent = paid.length;
    document.getElementById('cpn-rate').textContent = Math.round(paid.length/paidAll.length*100)+'%';
    document.getElementById('cpn-list').innerHTML = codes.map(c=>`
      <div class="cpn-item">
        <span class="cpn-code">${c.code}</span>
        <div class="cpn-meta"><b>−฿${c.off.toLocaleString()}</b><span>ใช้ ${c.n} ครั้ง</span><div class="cpn-bar"><i style="width:${Math.round(c.off/maxOff*100)}%"></i></div></div>
      </div>`).join('');
  })();
})();

/* ===== Revenue dashboard: 30-day chart + subject donut ===== */
(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // deterministic 30-day daily net revenue (weekends lower, upward trend)
  const DAYS = 30;
  const gross = [], net = [];
  for(let i=0;i<DAYS;i++){
    const dow = (i+2)%7, wk = (dow===5||dow===6)?0.55:1;
    const trend = 1 + i/DAYS*0.5;
    const wob = 0.7 + ((i*37+13)%23)/23*0.7;
    const g = Math.round((1500+ i*40)*wk*trend*wob/100)*100;
    gross.push(g); net.push(Math.round(g*0.9835/100)*100);
  }
  const W=720,H=240,pad=8, max=Math.max(...gross)*1.12, bw=(W-pad*2)/DAYS;
  const svg=document.getElementById('rc-svg');
  const y=v=>H-(v/max)*H;
  // area path from net
  const line=net.map((v,i)=>`${pad+bw*i+bw/2},${y(v)}`);
  const areaD=`M ${pad+bw/2},${H} L `+line.join(' L ')+` L ${pad+bw*(DAYS-1)+bw/2},${H} Z`;
  const lineD='M '+line.join(' L ');
  let bars='';
  gross.forEach((g,i)=>{
    const x=pad+bw*i, gh=(g/max)*H, nh=(net[i]/max)*H;
    bars+=`<rect class="rc-bar" data-i="${i}" x="${x+bw*0.16}" y="${H-gh}" width="${bw*0.68}" height="${gh}" rx="3" fill="oklch(from var(--brand-violet) l c h / 0.28)"/>`;
    bars+=`<rect class="rc-bar" data-i="${i}" x="${x+bw*0.16}" y="${H-nh}" width="${bw*0.68}" height="${nh}" rx="3" fill="var(--success)"/>`;
  });
  svg.innerHTML=`<defs><linearGradient id="rcArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="oklch(from var(--success) l c h / 0.28)"/><stop offset="100%" stop-color="oklch(from var(--success) l c h / 0)"/></linearGradient></defs>`
    +`<path class="rc-area-path" d="${areaD}" fill="url(#rcArea)"/>`
    +`<path d="${lineD}" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${reduce?'':'style="stroke-dasharray:2600;stroke-dashoffset:2600;animation:rcDraw 1.3s cubic-bezier(.2,.8,.2,1) .2s forwards"'}/>`
    +bars;
  if(!document.getElementById('rc-kf')){ const s=document.createElement('style'); s.id='rc-kf'; s.textContent='@keyframes rcDraw{to{stroke-dashoffset:0}}@keyframes rcBarUp{from{transform:scaleY(0)}}'; document.head.appendChild(s); }
  if(!reduce) svg.querySelectorAll('.rc-bar').forEach((b,i)=>{ b.style.transformBox='fill-box'; b.style.transformOrigin='bottom'; b.style.animation=`rcBarUp .5s cubic-bezier(.2,.8,.2,1) ${i*0.012}s both`; });

  // axis (weekly ticks)
  const axis=document.getElementById('rc-axis');
  axis.innerHTML=['30 วันก่อน','3 สัปดาห์','2 สัปดาห์','สัปดาห์ก่อน','วันนี้'].map(t=>`<span>${t}</span>`).join('');

  // hover interaction
  const plot=document.getElementById('rc-plot'), cur=document.getElementById('rc-cursor'), tip=document.getElementById('rc-tip');
  plot.addEventListener('mousemove', e=>{
    const r=plot.getBoundingClientRect(), rx=e.clientX-r.left;
    let i=Math.floor((rx/r.width*W-pad)/bw); i=Math.max(0,Math.min(DAYS-1,i));
    const cx=(pad+bw*i+bw/2)/W*r.width;
    plot.classList.add('hovering');
    svg.querySelectorAll('.rc-bar').forEach(b=>b.classList.toggle('on', +b.dataset.i===i));
    cur.style.left=cx+'px'; cur.style.opacity='1';
    tip.style.left=cx+'px'; tip.style.opacity='1';
    tip.innerHTML=`<b>฿${net[i].toLocaleString()}</b><span class="d">สุทธิ · ${DAYS-i} วันก่อน · เก็บ ฿${gross[i].toLocaleString()}</span>`;
  });
  plot.addEventListener('mouseleave', ()=>{ plot.classList.remove('hovering'); cur.style.opacity='0'; tip.style.opacity='0'; });

  // subject donut — canonical colors, priority order คณิต→ฟิสิกส์→TPAT3→TGAT2
  const MIX=[
    {nm:'คณิต', v:26800, c:'var(--subj-math)'},
    {nm:'ฟิสิกส์', v:24300, c:'var(--subj-phys)'},
    {nm:'TPAT3', v:18900, c:'var(--subj-tpat)'},
    {nm:'TGAT2', v:12810, c:'var(--subj-tgat)'}
  ];
  const totV=MIX.reduce((s,m)=>s+m.v,0);
  const ring=document.getElementById('rmx-ring'), C=2*Math.PI*46; let off=0;
  ring.innerHTML=`<circle r="46" cx="60" cy="60" stroke="var(--bg-3)" stroke-width="13" fill="none"/>`+
    MIX.map(m=>{ const frac=m.v/totV, len=frac*C; const el=`<circle class="seg" r="46" cx="60" cy="60" stroke="${m.c}" style="color:${m.c};stroke-dasharray:${len} ${C-len};stroke-dashoffset:${-off}"/>`; off+=len; return el; }).join('');
  document.getElementById('rmx-c-val').textContent='฿'+(totV/1000).toFixed(1)+'K';
  document.getElementById('rmx-list').innerHTML=MIX.map(m=>`<div class="rmx-row"><span class="dt" style="background:${m.c}"></span><span class="nm">${m.nm}</span><span class="vl">฿${m.v.toLocaleString()} · ${Math.round(m.v/totV*100)}%</span></div>`).join('');
})();
