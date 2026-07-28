/* ==========================================================================
   Admin · Users — filter bar, sortable table, pagination, row actions
   (mirrors backend filter/sort/pagination capability)
   ========================================================================== */
(function(){
  const AV=['oklch(0.6 0.2 145)','oklch(0.58 0.22 5)','oklch(0.66 0.2 50)','oklch(0.5 0.18 210)','oklch(0.55 0.2 295)','oklch(0.62 0.2 230)','oklch(0.7 0.18 165)','oklch(0.66 0.22 320)'];
  const FIRST=['ธนกร','ณัฐริกา','ศุภวิชญ์','พิมพ์มาดา','ภูริณัฐ','สุพิชญา','จิรายุ','ชนิกานต์','วรินทร','เมธาสิทธิ์','ปาริชาติ','กิตติพงศ์','อชิรญา','ธีรภัทร','ณภัทร','ปุณยวีร์','กันต์','ธัญชนก','รวิภา','สิรวิชญ์'];
  const LAST=['พงษ์ไพบูลย์','บุญมี','ใจเย็น','ศรีสุข','ตันติวงศ์','คงทอง','เพชรน้ำหนึ่ง','มีสุข','พูนผล','ทองดี','แสงทอง','วัฒนา','โชติกุล','อุดมสุข','สุข','เจริญพร','ภักดี','รุ่งเรือง','สมบูรณ์','วงศ์ทอง'];
  const GRADES=['ม.4','ม.5','ม.6'];
  function genInit(n){ const p=n.split(' '); return (p[0][0]||'')+(p[1]?p[1][0]:''); }
  function mkUsers(){
    const out=[]; const seed=12345; let r=seed;
    const rnd=()=>{ r=(r*1103515245+12345)&0x7fffffff; return r/0x7fffffff; };
    for(let i=0;i<58;i++){
      const fn=FIRST[Math.floor(rnd()*FIRST.length)], ln=LAST[Math.floor(rnd()*LAST.length)];
      const name=fn+' '+ln;
      const grade=GRADES[Math.floor(rnd()*GRADES.length)];
      const dek = grade==='ม.6'?'DEK70':grade==='ม.5'?'DEK71':'DEK72';
      const online=rnd()<0.12;
      const role = i<2 ? 'admin' : 'student';
      const month=Math.floor(rnd()*5)+1, day=Math.floor(rnd()*28)+1;
      out.push({ name, email:'student'+(1000+i)+'@gmail.com', init:genInit(name), av:AV[i%AV.length],
        role, grade, dek, online,
        joinedTs: new Date(2026, month, day).getTime(),
        joined: day+' '+['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.'][month]+' 2026',
        seenTs: online ? Date.now() : Date.now()-Math.floor(rnd()*30*864e5),
        seen: online ? 'ออนไลน์' : (['2 นาทีที่แล้ว','1 ชั่วโมงที่แล้ว','เมื่อวาน','3 วันก่อน','1 สัปดาห์ก่อน','2 สัปดาห์ก่อน'][Math.floor(rnd()*6)]) });
    }
    return out;
  }
  const USERS = mkUsers();

  /* ===== Activity / monitoring data ====================================== */
  const COURSES=[
    {name:'A-Level ฟิสิกส์ พิชิตข้อสอบ TCAS68', short:'A-Level ฟิสิกส์', color:'oklch(0.64 0.26 335)', chapters:[
      {t:'บทที่ 1 · กลศาสตร์', lessons:['การกระจัดและความเร็ว','ความเร่งและกราฟ v–t','การตกอิสระ']},
      {t:'บทที่ 2 · งานและพลังงาน', lessons:['งานและกำลัง','พลังงานจลน์–ศักย์','การอนุรักษ์พลังงาน']},
      {t:'บทที่ 3 · ไฟฟ้าและแม่เหล็ก', lessons:['สนามไฟฟ้า','ศักย์ไฟฟ้า','วงจร RC']}]},
    {name:'A-Level คณิต ประยุกต์ ครบทุกบท', short:'A-Level คณิต', color:'oklch(0.60 0.19 255)', chapters:[
      {t:'บทที่ 1 · ฟังก์ชัน', lessons:['โดเมน–เรนจ์','ฟังก์ชันประกอบ','ฟังก์ชันผกผัน']},
      {t:'บทที่ 2 · แคลคูลัส', lessons:['ลิมิตและความต่อเนื่อง','อนุพันธ์','ปริพันธ์']},
      {t:'บทที่ 3 · เวกเตอร์', lessons:['ผลคูณเชิงสเกลาร์','ผลคูณเชิงเวกเตอร์']}]},
    {name:'TPAT3 ความถนัด วิทย์–เทคโน–วิศวะ', short:'TPAT3', color:'oklch(0.54 0.20 18)', chapters:[
      {t:'ตอนที่ 1 · คณิตประยุกต์', lessons:['อัตราส่วนและร้อยละ','ความน่าจะเป็น']},
      {t:'ตอนที่ 2 · วิทย์ประยุกต์', lessons:['กลศาสตร์เชิงวิศวะ','พลังงานและสิ่งแวดล้อม']}]},
    {name:'TGAT2 การคิดอย่างมีเหตุผล', short:'TGAT2', color:'oklch(0.72 0.16 84)', chapters:[
      {t:'ตอนที่ 1 · ตรรกศาสตร์', lessons:['เงื่อนไขและข้อสรุป','อุปมาอุปไมย']},
      {t:'ตอนที่ 2 · อนุกรม', lessons:['อนุกรมตัวเลข','อนุกรมรูปภาพ']}]},
    {name:'คณิต ม.ปลาย เนื้อหาครบทุกเทอม', short:'คณิต ม.ปลาย', color:'oklch(0.60 0.19 255)', chapters:[
      {t:'บทที่ 1 · ลำดับและอนุกรม', lessons:['ลำดับเลขคณิต','ลำดับเรขาคณิต','อนุกรมอนันต์']},
      {t:'บทที่ 2 · ตรีโกณมิติ', lessons:['อัตราส่วนตรีโกณ','กราฟฟังก์ชันตรีโกณ']}]},
    {name:'ฟิสิกส์ ม.ปลาย เนื้อหาครบทุกเทอม', short:'ฟิสิกส์ ม.ปลาย', color:'oklch(0.64 0.26 335)', chapters:[
      {t:'บทที่ 1 · การเคลื่อนที่', lessons:['การเคลื่อนที่แนวตรง','การเคลื่อนที่แบบโพรเจกไทล์']},
      {t:'บทที่ 2 · แรงและกฎนิวตัน', lessons:['กฎการเคลื่อนที่ข้อ 1–3','แรงเสียดทาน']}]}
  ];
  (function assignActivity(){
    let r=98765; const rnd=()=>{ r=(r*1103515245+12345)&0x7fffffff; return r/0x7fffffff; };
    const ACTS=['เริ่มดูบทเรียน','ดูจบบทเรียน','ทำแบบฝึกหัด','ทำข้อสอบ','ดาวน์โหลดเอกสาร'];
    USERS.forEach(u=>{
      const c=COURSES[Math.floor(rnd()*COURSES.length)];
      const chIdx=Math.floor(rnd()*c.chapters.length), ch=c.chapters[chIdx];
      const lesson=ch.lessons[Math.floor(rnd()*ch.lessons.length)];
      u.course=c; u.chapter=ch; u.lesson=lesson; u.progress=Math.floor(rnd()*78)+12;
      if(u.online){ u.startTs = Date.now() - Math.floor(rnd()*42*60000) - 30000; const rr=rnd(); u.live = rr<0.6?'learning':rr<0.85?'online':'afk'; }
      // enrolled courses w/ progress
      const pool=[...COURSES], enr=[]; const nE=1+Math.floor(rnd()*3);
      for(let i=0;i<nE && pool.length;i++){ const cc=pool.splice(Math.floor(rnd()*pool.length),1)[0]; enr.push({course:cc, prog:(cc===c?u.progress:Math.floor(rnd()*88)+6)}); }
      if(!enr.some(e=>e.course===c)) enr.unshift({course:c, prog:u.progress});
      u.enrolled=enr;
      // recent timeline
      const tl=[]; let t = u.online ? u.startTs : u.seenTs;
      for(let i=0;i<6;i++){ const cc=enr[Math.floor(rnd()*enr.length)].course; const cch=cc.chapters[Math.floor(rnd()*cc.chapters.length)];
        tl.push({ts:t, course:cc, chapter:cch, lesson:cch.lessons[Math.floor(rnd()*cch.lessons.length)], act:ACTS[Math.floor(rnd()*ACTS.length)], dur:Math.floor(rnd()*26)+4});
        t -= (Math.floor(rnd()*170)+18)*60000; }
      u.timeline=tl;
    });
  })();
  function fmtElapsed(ms){ if(ms<0)ms=0; const s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60),ss=s%60; return (h?h+':':'')+String(m).padStart(h?2:1,'0')+':'+String(ss).padStart(2,'0'); }
  function fmtAgo(ts){ const d=Date.now()-ts,m=Math.floor(d/60000); if(m<1)return'เมื่อสักครู่'; if(m<60)return m+' นาทีที่แล้ว'; const h=Math.floor(m/60); if(h<24)return h+' ชม.ที่แล้ว'; const day=Math.floor(h/24); return day===1?'เมื่อวาน':day+' วันก่อน'; }
  function actCell(u){
    if(u.online) return `<div class="act-live"><span class="pulse"></span><div class="act-tx"><b>${u.lesson}</b><span class="act-sub" style="--cc:${u.course.color}"><span class="cdot"></span>${u.course.short} · ${u.chapter.t.split(' · ')[0]}</span></div><span class="act-timer" data-start="${u.startTs}">${fmtElapsed(Date.now()-u.startTs)}</span></div>`;
    return `<div class="act-idle"><b>${u.lesson}</b><span class="act-sub">หยุดเมื่อ ${u.online?'':fmtAgo(u.seenTs)}</span></div>`;
  }

  const tbody=document.getElementById('tbody');
  const noResult=document.getElementById('no-result');
  let q='', filters={role:'all', grade:'all', online:'all'}, sortKey='joined', sortDir=-1, page=1, pageSize=10;
  const FLABEL={role:'บทบาท', grade:'ระดับชั้น', online:'สถานะ'};
  const VLABEL={student:'นักเรียน', admin:'ผู้ดูแล', online:'ออนไลน์', offline:'ออฟไลน์'};

  function filtered(){
    let list=USERS.filter(u=>{
      if(filters.role!=='all' && u.role!==filters.role) return false;
      if(filters.grade!=='all' && u.grade!==filters.grade) return false;
      if(filters.online==='online' && !u.online) return false;
      if(filters.online==='offline' && u.online) return false;
      if(q){ const s=q.toLowerCase(); if(!u.name.toLowerCase().includes(s) && !u.email.toLowerCase().includes(s)) return false; }
      return true;
    });
    list.sort((a,b)=>{
      let x,y;
      if(sortKey==='joined'){x=a.joinedTs;y=b.joinedTs;}
      else if(sortKey==='seen'){x=a.seenTs;y=b.seenTs;}
      else {x=a[sortKey]||'';y=b[sortKey]||''; return sortDir*x.localeCompare(y,'th');}      return sortDir*(x-y);
    });
    return list;
  }

  function render(){
    const list=filtered();
    const total=list.length, pages=Math.max(1,Math.ceil(total/pageSize));
    if(page>pages) page=pages;
    const start=(page-1)*pageSize, slice=list.slice(start, start+pageSize);

    if(total===0){
      document.querySelector('.dt-wrap').style.display='none'; noResult.style.display='block';
      noResult.innerHTML='<div class="adm-empty"><div class="eic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></div><h3>ไม่พบนักเรียนตามเงื่อนไข</h3><p>ลองล้างตัวกรองหรือเปลี่ยนคำค้นหา</p></div>';
      renderActiveFilters(); return;
    }
    document.querySelector('.dt-wrap').style.display=''; noResult.style.display='none';

    tbody.innerHTML = slice.map(u=>`<tr data-uid="${u.email}" class="dt-row-click">
      <td><div class="u-cell"><div class="av" style="background:linear-gradient(135deg,${u.av},oklch(from ${u.av} calc(l + 0.08) c calc(h + 20)))">${u.init}<span class="${u.online?'on':'off'}"></span></div><div><b>${u.name}</b><span>${u.email}</span></div></div></td>
      <td>${u.role==='admin'?'<span class="role-badge admin"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 2 4 5v6c0 5 4 9 8 11 4-2 8-6 8-11V5z"/></svg>ผู้ดูแล</span>':'<span class="role-badge student">นักเรียน</span>'}</td>
      <td><span class="grade-tag">${u.grade}</span></td>
      <td><span class="dek-tag">${u.dek}</span></td>
      <td>${actCell(u)}</td>
      <td class="muted">${u.joined}</td>
      <td>${u.online?'<span class="livepill" style="--sc:'+((({learning:'var(--success)',online:'var(--brand-cyan)',afk:'var(--warning)'})[u.live])||'var(--success)')+'"><span class="d"></span>'+(({learning:'กำลังเรียน',online:'ออนไลน์',afk:'AFK'})[u.live]||'ออนไลน์')+'</span>':'<span class="muted">'+u.seen+'</span>'}</td>
      <td class="right"><div class="row-acts">
        <button class="ic-btn" title="ดูกิจกรรม" data-act="watch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>
        <button class="ic-btn" data-act="role" title="${u.role==='admin'?'ลดเป็นนักเรียน':'เลื่อนเป็นผู้ดูแล'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 4 9 8 11 4-2 8-6 8-11V5z"/></svg></button>
        <button class="ic-btn" data-act="courses" title="คอร์สที่ลงทะเบียน"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></button>
      </div></td>
    </tr>`).join('');
    tbody.querySelectorAll('tr[data-uid]').forEach(tr=>tr.addEventListener('click', e=>{ if(e.target.closest('.row-acts') && !e.target.closest('[data-act=watch]')) return; openDrawer(tr.dataset.uid); }));
    tbody.querySelectorAll('[data-act=role]').forEach(b=>b.addEventListener('click', e=>{ e.stopPropagation(); const u=USERS.find(x=>x.email===b.closest('tr').dataset.uid); if(!u) return; u.role = u.role==='admin'?'student':'admin'; render(); }));
    tbody.querySelectorAll('[data-act=courses]').forEach(b=>b.addEventListener('click', e=>{ e.stopPropagation(); openDrawer(b.closest('tr').dataset.uid, 'courses'); }));

    document.getElementById('range-info').innerHTML = `แสดง <b>${start+1}–${Math.min(start+pageSize,total)}</b> จาก <b>${total.toLocaleString()}</b> คน`;
    renderPager(pages);
    document.querySelectorAll('#table thead th[data-sort]').forEach(th=>th.classList.toggle('sorted', th.dataset.sort===sortKey));
    renderActiveFilters();
  }

  function renderPager(pages){
    const el=document.getElementById('pager');
    const chev=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
    let h=`<button data-p="${page-1}" ${page<=1?'disabled':''}>${chev('m15 18-6-6 6-6')}</button>`;
    const win=[]; for(let p=1;p<=pages;p++){ if(p===1||p===pages||Math.abs(p-page)<=1) win.push(p); else if(win[win.length-1]!=='…') win.push('…'); }
    win.forEach(p=>{ h += p==='…' ? '<span class="dots">…</span>' : `<button data-p="${p}" ${p===page?'aria-current="true"':''}>${p}</button>`; });
    h+=`<button data-p="${page+1}" ${page>=pages?'disabled':''}>${chev('m9 18 6-6-6-6')}</button>`;
    el.innerHTML=h;
    el.querySelectorAll('button[data-p]').forEach(b=>b.addEventListener('click', ()=>{ if(b.disabled) return; page=+b.dataset.p; render(); document.querySelector('.adm-scroll').scrollTo({top:0,behavior:'smooth'}); }));
  }

  function renderActiveFilters(){
    const el=document.getElementById('active-filters');
    const active=Object.keys(filters).filter(k=>filters[k]!=='all');
    if(!active.length){ el.innerHTML=''; return; }
    el.innerHTML = active.map(k=>`<span class="afilter">${FLABEL[k]}: ${VLABEL[filters[k]]||filters[k]}<button data-clear="${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></span>`).join('') + '<button class="clear-all" id="clear-all">ล้างทั้งหมด</button>';
    el.querySelectorAll('[data-clear]').forEach(b=>b.addEventListener('click', ()=>{ filters[b.dataset.clear]='all'; syncChips(); page=1; render(); }));
    const ca=document.getElementById('clear-all'); if(ca) ca.addEventListener('click', ()=>{ Object.keys(filters).forEach(k=>filters[k]='all'); syncChips(); page=1; render(); });
  }

  function syncChips(){
    document.querySelectorAll('.fdrop').forEach(fd=>{
      const key=fd.dataset.filter, chip=fd.querySelector('.chip-filter');
      chip.classList.toggle('on', filters[key]!=='all');
      fd.querySelectorAll('.fdrop-menu button').forEach(b=>b.classList.toggle('sel', b.dataset.v===filters[key]));
    });
  }

  // dropdowns
  document.querySelectorAll('.fdrop').forEach(fd=>{
    const key=fd.dataset.filter, chip=fd.querySelector('[data-toggle]'), menu=fd.querySelector('.fdrop-menu');
    chip.addEventListener('click', e=>{ e.stopPropagation(); document.querySelectorAll('.fdrop-menu').forEach(m=>{ if(m!==menu) m.classList.remove('open'); }); menu.classList.toggle('open'); });
    menu.querySelectorAll('button').forEach(b=>b.addEventListener('click', ()=>{ filters[key]=b.dataset.v; menu.classList.remove('open'); syncChips(); page=1; render(); }));
  });
  document.addEventListener('click', ()=>document.querySelectorAll('.fdrop-menu').forEach(m=>m.classList.remove('open')));

  document.getElementById('search').addEventListener('input', e=>{ q=e.target.value.trim(); page=1; render(); });
  document.querySelectorAll('#table thead th[data-sort]').forEach(th=>th.addEventListener('click', ()=>{
    const k=th.dataset.sort; if(sortKey===k) sortDir*=-1; else { sortKey=k; sortDir = (k==='joined'||k==='seen')?-1:1; } render();
  }));
  document.getElementById('page-size').addEventListener('change', e=>{ pageSize=+e.target.value; page=1; render(); });

  window.__onTweak=function(k,v){
    if(k==='view'){
      const blocks=document.querySelectorAll('.filterbar,.dt-wrap'); const strip=document.querySelector('.sum-strip');
      if(v==='empty'){ q='zzz_no_match'; render(); }
      else { q=''; document.getElementById('search').value=''; render(); }
    }
  };

  /* ===== Live-now panel ================================================== */
  const LIVE={learning:{t:'กำลังเรียน',c:'var(--success)'},online:{t:'ออนไลน์',c:'var(--brand-cyan)'},afk:{t:'AFK',c:'var(--warning)'}};
  let liveExpanded=false;
  function renderLiveNow(){
    const online = USERS.filter(u=>u.online);
    const order={learning:0,online:1,afk:2};
    online.sort((a,b)=>(order[a.live]-order[b.live]) || (b.startTs-a.startTs));
    document.getElementById('live-count').textContent = online.length;
    const bd=document.getElementById('online-breakdown');
    if(bd){ const L=online.filter(u=>u.live==='learning').length, A=online.filter(u=>u.live==='afk').length;
      bd.innerHTML=`<span class="learn">กำลังเรียน <b>${L}</b></span><span class="afk">AFK <b>${A}</b></span>`; }
    const grid=document.getElementById('live-grid');
    if(!online.length){ grid.innerHTML='<div class="live-empty">ยังไม่มีนักเรียนออนไลน์ตอนนี้</div>'; return; }
    const LIMIT=4; const show=liveExpanded?online:online.slice(0,LIMIT); const rest=online.length-LIMIT;
    grid.innerHTML = show.map(u=>{
      const st=LIVE[u.live]||LIVE.online;
      const pill=`<span class="lc-timer" style="--sc:${st.c}">${u.live==='learning'?'<span class="pulse"></span>':''}${st.t}${u.live==='learning'?' · <span data-start="'+u.startTs+'">'+fmtElapsed(Date.now()-u.startTs)+'</span>':''}</span>`;
      const body = u.live==='learning'
        ? `<div class="lc-lesson"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>${u.lesson}<span class="lc-ch">${u.chapter.t.split(' · ')[0]}</span></div>
           <div class="lc-prog"><i style="width:${u.progress}%;background:${u.course.color}"></i></div>
           <div class="lc-progtx">เรียนคืบ ${u.progress}% ของบทนี้</div>`
        : `<div class="lc-lesson" style="color:var(--fg-3)">ค้างไว้ที่: ${u.lesson}</div>
           <div class="lc-progtx">${u.live==='afk'?'ไม่มีกิจกรรมสักครู่':'เปิดหน้าเว็บไว้ — ยังไม่เริ่มเรียน'}</div>`;
      return `<div class="live-card" data-uid="${u.email}">
        <div class="lc-top">
          <div class="av" style="background:linear-gradient(135deg,${u.av},oklch(from ${u.av} calc(l + 0.08) c calc(h + 20)))">${u.init}<span class="on"></span></div>
          <div class="lc-who"><b>${u.name}</b><span>${u.grade}</span></div>
          ${pill}
        </div>
        <div class="lc-course" style="--cc:${u.course.color}"><span class="cdot"></span>${u.course.short}</div>
        ${body}
      </div>`;
    }).join('');
    if(!liveExpanded && rest>0){
      const more=document.createElement('button'); more.className='live-more'; more.innerHTML=`ดูเพิ่มเติม (+${rest})<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
      more.addEventListener('click',()=>{ liveExpanded=true; renderLiveNow(); }); grid.appendChild(more);
    } else if(liveExpanded && online.length>LIMIT){
      const less=document.createElement('button'); less.className='live-more'; less.innerHTML=`ย่อลง<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`;
      less.addEventListener('click',()=>{ liveExpanded=false; renderLiveNow(); }); grid.appendChild(less);
    }
    grid.querySelectorAll('.live-card').forEach(c=>c.addEventListener('click', ()=>openDrawer(c.dataset.uid)));
  }

  /* ===== Drawer (student activity detail) ================================ */
  const drawer=document.getElementById('drawer'), drawerOv=document.getElementById('drawer-ov');
  function openDrawer(uid, focus){
    const u=USERS.find(x=>x.email===uid); if(!u) return;
    const statusBlock = u.online
      ? `<div class="dw-status online"><div class="dw-st-head"><span class="pulse"></span>กำลังเรียนอยู่ตอนนี้<span class="dw-timer" data-start="${u.startTs}">${fmtElapsed(Date.now()-u.startTs)}</span></div>
          <div class="dw-now"><div class="dw-now-lesson"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><b>${u.lesson}</b></div><div class="dw-now-meta" style="--cc:${u.course.color}"><span class="cdot"></span>${u.course.short} · ${u.chapter.t}</div>
          <div class="lc-prog" style="margin-top:10px"><i style="width:${u.progress}%;background:${u.course.color}"></i></div><div class="lc-progtx">เรียนคืบ ${u.progress}% ของบทนี้</div></div></div>`
      : `<div class="dw-status offline"><div class="dw-st-head">ออฟไลน์ · ออนไลน์ล่าสุด ${u.seen}</div>
          <div class="dw-now"><div class="dw-now-lesson"><b>หยุดที่: ${u.lesson}</b></div><div class="dw-now-meta" style="--cc:${u.course.color}"><span class="cdot"></span>${u.course.short} · ${u.chapter.t}</div></div></div>`;
    const enrolled = u.enrolled.map(e=>`<div class="dw-enr"><div class="dw-enr-top"><span class="dw-enr-name" style="--cc:${e.course.color}"><span class="cdot"></span>${e.course.short}</span><b>${e.prog}%</b></div><div class="lc-prog"><i style="width:${e.prog}%;background:${e.course.color}"></i></div></div>`).join('');
    const ACTIC={'เริ่มดูบทเรียน':'<path d="M8 5v14l11-7z"/>','ดูจบบทเรียน':'<path d="M20 6 9 17l-5-5"/>','ทำแบบฝึกหัด':'<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>','ทำข้อสอบ':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>','ดาวน์โหลดเอกสาร':'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'};
    const timeline = u.timeline.map((e,i)=>`<div class="dw-tl-item"><div class="dw-tl-dot" style="--cc:${e.course.color}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ACTIC[e.act]||ACTIC['เริ่มดูบทเรียน']}</svg></div>
      <div class="dw-tl-body"><div class="dw-tl-line"><b>${e.act}</b> · ${e.lesson}</div><div class="dw-tl-meta"><span style="--cc:${e.course.color}" class="dw-tl-course"><span class="cdot"></span>${e.course.short}</span> · ${e.chapter.t.split(' · ')[0]} · ดู ${e.dur} นาที</div><div class="dw-tl-time">${i===0&&u.online?'กำลังเรียน':fmtAgo(e.ts)}</div></div></div>`).join('');
    drawer.querySelector('.dw-body').innerHTML = `
      <div class="dw-id"><div class="av" style="background:linear-gradient(135deg,${u.av},oklch(from ${u.av} calc(l + 0.08) c calc(h + 20)))">${u.init}<span class="${u.online?'on':'off'}"></span></div>
        <div><b>${u.name}</b><span>${u.email}</span><div class="dw-tags"><span class="grade-tag">${u.grade}</span>${u.role==='admin'?'<span class="role-badge admin">ผู้ดูแล</span>':'<span class="role-badge student">นักเรียน</span>'}</div></div></div>
      ${statusBlock}
      <div class="dw-sec"><div class="dw-sec-h">คอร์สที่ลงทะเบียน <span>${u.enrolled.length} คอร์ส</span></div>${enrolled}</div>
      <div class="dw-sec"><div class="dw-sec-h">กิจกรรมล่าสุด</div><div class="dw-tl">${timeline}</div></div>`;
    drawer.classList.add('open'); drawerOv.classList.add('open');
    drawer.style.transform='translateX(0)';
    const body=drawer.querySelector('.dw-body'); body.scrollTop=0;
    if(focus==='courses'){ const secs=body.querySelectorAll('.dw-sec'); if(secs[0]) body.scrollTop=secs[0].offsetTop-80; }
  }
  function closeDrawer(){ drawer.classList.remove('open'); drawerOv.classList.remove('open'); drawer.style.transform='translateX(100%)'; }
  drawerOv.addEventListener('click', closeDrawer);
  document.getElementById('dw-close').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeDrawer(); });

  /* ===== Live timers tick ================================================ */
  function tick(){ document.querySelectorAll('[data-start]').forEach(el=>{ const t=+el.dataset.start; const lbl=el.querySelector('.pulse')?el.childNodes[el.childNodes.length-1]:el; if(el.classList.contains('lc-timer')||el.classList.contains('act-timer')||el.classList.contains('dw-timer')){ const pulse=el.querySelector('.pulse'); el.textContent=fmtElapsed(Date.now()-t); if(pulse) el.prepend(pulse); } else { el.textContent=fmtElapsed(Date.now()-t); } }); }
  setInterval(tick,1000);

  renderLiveNow();
  syncChips(); render();
})();
