/* ==========================================================================
   Admin · Coupons — table, status (active/full/expired), create modal,
   copy code, live add. Coupon math owned here (MING20=20%, WELCOME10=10%).
   ========================================================================== */
(function(){
  const TODAY = new Date('2026-05-31');
  const COUPONS = [
    { code:'MING20', type:'percent', value:20, used:124, max:200, expiry:'2026-08-31' },
    { code:'WELCOME10', type:'percent', value:10, used:62, max:0, expiry:'2026-12-31' },
    { code:'TCAS68', type:'baht', value:300, used:32, max:150, expiry:'2026-07-15' },
    { code:'EARLYBIRD', type:'baht', value:500, used:80, max:80, expiry:'2026-09-30' },
    { code:'SONGKRAN', type:'percent', value:25, used:45, max:100, expiry:'2026-04-20' }
  ];
  function statusOf(c){
    if(new Date(c.expiry) < TODAY) return 'expired';
    if(c.max>0 && c.used>=c.max) return 'full';
    return 'active';
  }
  function fmtDate(d){ const dt=new Date(d); return dt.getDate()+' '+['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][dt.getMonth()]+' '+(dt.getFullYear()+543-2500+2500); }

  const tbody=document.getElementById('tbody');
  const noResult=document.getElementById('no-result');
  let q='', fStatus='all';

  function row(c, idx){
    const st=statusOf(c);
    const disc = c.type==='percent' ? `<span class="disc-val"><span class="grad">${c.value}%</span></span>` : `<span class="disc-val">฿${c.value.toLocaleString()}</span>`;
    const pct = c.max>0 ? Math.min(100, Math.round(c.used/c.max*100)) : 0;
    const usage = c.max>0
      ? `<div class="usage"><div class="bar"><i class="${st==='full'?'full':''}" data-w="${pct}" style="width:0%"></i></div><span class="n">${c.used}/${c.max}</span></div>`
      : `<div class="usage"><span class="n">${c.used} · ไม่จำกัด</span></div>`;
    const stLabel={active:'ใช้งานได้', full:'เต็มสิทธิ์', expired:'หมดอายุ'};
    return `<tr class="coupon-row ${st}" data-i="${idx}">
      <td><div class="coupon-code"><code>${c.code}</code><button class="copy" data-copy="${c.code}" title="คัดลอก"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></div></td>
      <td>${disc}</td>
      <td>${usage}</td>
      <td class="muted">${fmtDate(c.expiry)}</td>
      <td><span class="cstatus ${st}"><span class="d"></span>${stLabel[st]}</span></td>
      <td class="right actions-cell"><div class="row-acts">
        <button class="ic-btn" data-edit="${idx}" title="แก้ไข"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
        <button class="ic-btn danger" data-del="${idx}" title="ลบ"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div></td>
    </tr>`;
  }

  function render(){
    const vis = COUPONS.map((c,i)=>({c,i})).filter(({c})=>{
      if(fStatus!=='all' && statusOf(c)!==fStatus) return false;
      if(q && !c.code.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    // summary
    document.getElementById('s-active').innerHTML = COUPONS.filter(c=>statusOf(c)==='active').length+'<span class="unit">โค้ด</span>';
    document.getElementById('s-dead').innerHTML = COUPONS.filter(c=>statusOf(c)!=='active').length+'<span class="unit">โค้ด</span>';

    if(!vis.length){
      document.querySelector('.dt-wrap').style.display='none'; noResult.style.display='block';
      noResult.innerHTML='<div class="adm-empty"><div class="eic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1-.6-1.4V4a2 2 0 0 1 2-2h7.6a2 2 0 0 1 1.4.6l6.8 6.8a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1"/></svg></div><h3>ยังไม่มีคูปอง</h3><p>สร้างโค้ดส่วนลดแรกของคุณ แล้วนักเรียนจะใช้ได้ตอน checkout</p></div>';
      return;
    }
    document.querySelector('.dt-wrap').style.display=''; noResult.style.display='none';
    tbody.innerHTML = vis.map(({c,i})=>row(c,i)).join('');
    tbody.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click', ()=>{
      navigator.clipboard?.writeText(b.dataset.copy).catch(()=>{});
      b.classList.add('done'); const orig=b.innerHTML;
      b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>';
      setTimeout(()=>{ b.classList.remove('done'); b.innerHTML=orig; }, 1400);
    }));
    tbody.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', ()=>{ COUPONS.splice(+b.dataset.del,1); render(); }));
    tbody.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click', ()=>openEdit(+b.dataset.edit)));
    // animate usage bars grow-in
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      tbody.querySelectorAll('.usage .bar i[data-w]').forEach(i=>{ i.style.width=i.dataset.w+'%'; });
    }));
  }

  document.getElementById('search').addEventListener('input', e=>{ q=e.target.value.trim(); render(); });
  document.getElementById('f-status').addEventListener('change', e=>{ fStatus=e.target.value; render(); });

  // ----- Create modal -----
  const modal=document.getElementById('create-modal');
  let cType='percent', editIdx=null;
  function setType(t){ cType=t; document.querySelectorAll('#c-type button').forEach(x=>x.setAttribute('aria-pressed', String(x.dataset.v===t))); document.getElementById('c-val-pfx').textContent = t==='percent'?'%':'฿'; }
  function openEdit(i){
    const c=COUPONS[i]; editIdx=i;
    document.querySelector('#create-modal .modal-head h3').textContent='แก้ไขคูปอง';
    document.getElementById('c-save').textContent='บันทึกการแก้ไข';
    document.getElementById('c-code').value=c.code;
    setType(c.type);
    document.getElementById('c-value').value=c.value;
    document.getElementById('c-max').value=c.max;
    document.getElementById('c-expiry').value=c.expiry;
    modal.classList.add('open'); setTimeout(()=>document.getElementById('c-code').focus(),50);
  }
  document.getElementById('open-create').addEventListener('click', ()=>{
    editIdx=null;
    document.querySelector('#create-modal .modal-head h3').textContent='สร้างคูปองใหม่';
    document.getElementById('c-save').textContent='สร้างคูปอง';
    document.getElementById('c-code').value=''; setType('percent');
    document.getElementById('c-value').value='20'; document.getElementById('c-max').value='100'; document.getElementById('c-expiry').value='2026-08-31';
    modal.classList.add('open'); setTimeout(()=>document.getElementById('c-code').focus(),50);
  });
  function close(){ modal.classList.remove('open'); }
  document.getElementById('c-cancel').addEventListener('click', close);
  modal.addEventListener('click', e=>{ if(e.target===modal) close(); });
  document.getElementById('c-code').addEventListener('input', e=>{ e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,''); });
  document.getElementById('c-gen').addEventListener('click', ()=>{
    const s='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let code=''; for(let i=0;i<7;i++) code+=s[Math.floor(Math.random()*s.length)];
    document.getElementById('c-code').value='MING'+code.slice(0,4);
  });
  document.querySelectorAll('#c-type button').forEach(b=>b.addEventListener('click', ()=>setType(b.dataset.v)));
  document.getElementById('c-save').addEventListener('click', ()=>{
    const code=document.getElementById('c-code').value.trim()||'NEWCODE';
    const value=parseInt(document.getElementById('c-value').value)||0;
    const max=parseInt(document.getElementById('c-max').value)||0;
    const expiry=document.getElementById('c-expiry').value||'2026-12-31';
    if(editIdx!==null){ Object.assign(COUPONS[editIdx], {code, type:cType, value, max, expiry}); close(); render(); }
    else { COUPONS.unshift({code, type:cType, value, used:0, max, expiry}); close(); render(); document.querySelector('.adm-scroll').scrollTo({top:0,behavior:'smooth'}); }
  });

  window.__onTweak=function(k,v){
    if(k==='view'){
      const blocks=document.querySelectorAll('.adm-toolbar,.dt-wrap'); const strip=document.querySelector('.sum-strip');
      let empty=document.getElementById('coupons-empty');
      if(v==='empty'){ blocks.forEach(b=>b.style.display='none'); noResult.style.display='none'; if(strip) strip.style.opacity='0.4';
        if(!empty){ empty=document.createElement('div'); empty.id='coupons-empty'; empty.className='adm-empty';
          empty.innerHTML='<div class="eic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1-.6-1.4V4a2 2 0 0 1 2-2h7.6a2 2 0 0 1 1.4.6l6.8 6.8a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1"/></svg></div><h3>ยังไม่มีคูปอง</h3><p>สร้างโค้ดส่วนลดแรก แล้วนักเรียนจะใช้ได้ตอน checkout</p><button class="btn btn-primary" style="margin-top:8px" onclick="document.getElementById(\'open-create\').click()">สร้างคูปอง →</button>';
          document.querySelector('.adm-page').appendChild(empty); }
        empty.style.display='flex';
      } else { blocks.forEach(b=>b.style.display=''); if(strip) strip.style.opacity=''; if(empty) empty.style.display='none'; render(); }
    }
  };

  render();

  // count-up summary numbers (safety-landed)
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.querySelectorAll('.sum-strip .sv').forEach(el=>{
      const node=[...el.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());
      if(!node) return; const raw=node.textContent.trim(); const target=parseFloat(raw.replace(/,/g,''));
      if(isNaN(target)) return; const comma=raw.includes(','); let start=null; const dur=850;
      function step(t){ if(start===null)start=t; const p=Math.min(1,(t-start)/dur); const e=1-Math.pow(1-p,3);
        const v=Math.round(target*e); node.textContent=comma?v.toLocaleString('en-US'):String(v);
        if(p<1) requestAnimationFrame(step); else node.textContent=raw; }
      requestAnimationFrame(step); setTimeout(()=>{node.textContent=raw;},dur+400);
    });
  }
})();
