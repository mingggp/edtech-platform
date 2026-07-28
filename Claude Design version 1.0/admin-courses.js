/* ==========================================================================
   Admin · Courses list — card grid, publish toggle, filters, view toggle
   Subjects locked to project rule (exactly 4): TGAT2 · TPAT3 · คณิต · ฟิสิกส์
   คณิต/ฟิสิกส์ may carry a level: 'ม.ปลาย' (in-term) or 'A-Level'.
   ========================================================================== */
(function(){
  const ICON = {
    physics:'<path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4"/>',
    math:'<path d="m12 20 9-9M3 11l9-9M3 11v6.5A2.5 2.5 0 0 0 5.5 20H12"/>',
    tgat:'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    grad:'<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5"/>'
  };
  const COURSES = [
    { id:'c1', title:'A-Level ฟิสิกส์ พิชิตข้อสอบ TCAS70', subject:'ฟิสิกส์', level:'A-Level', grade:'ม.6 · เตรียมสอบ', price:1800, was:2490, students:312, lessons:48, hours:18, status:'published', grad:'var(--subj-phys-grad)', icon:ICON.grad },
    { id:'c2', title:'A-Level คณิต ประยุกต์ ครบทุกบท', subject:'คณิต', level:'A-Level', grade:'ม.6 · เตรียมสอบ', price:1500, was:2290, students:248, lessons:52, hours:20, status:'published', grad:'var(--subj-math-grad)', icon:ICON.math },
    { id:'c3', title:'TPAT3 ความถนัด วิทย์–เทคโน–วิศวะ', subject:'TPAT3', level:null, grade:'ม.5–ม.6', price:1900, was:null, students:204, lessons:36, hours:15, status:'published', grad:'var(--subj-tpat-grad)', icon:ICON.physics },
    { id:'c4', title:'TGAT2 การคิดอย่างมีเหตุผล', subject:'TGAT2', level:null, grade:'ม.6 · เตรียมสอบ', price:2000, was:2890, students:186, lessons:30, hours:12, status:'published', grad:'var(--subj-tgat-grad)', icon:ICON.tgat },
    { id:'c5', title:'คณิต ม.ปลาย เนื้อหาครบทุกเทอม', subject:'คณิต', level:'ม.ปลาย', grade:'ม.4–ม.6', price:1900, was:null, students:171, lessons:64, hours:26, status:'published', grad:'var(--subj-math-grad)', icon:ICON.math },
    { id:'c6', title:'ฟิสิกส์ ม.ปลาย เนื้อหาครบทุกเทอม', subject:'ฟิสิกส์', level:'ม.ปลาย', grade:'ม.4–ม.6', price:2000, was:null, students:0, lessons:12, hours:5, status:'draft', grad:'var(--subj-phys-grad)', icon:ICON.physics }
  ];

  const grid = document.getElementById('grid');
  const noResult = document.getElementById('no-result');
  let q='', fSubject='all', fStatus='all', fGrades=[];

  /* levels each course serves (ม.4/ม.5/ม.6/A-Level) */
  const LEVELS = {
    c1:['ม.6','A-Level'], c2:['ม.6','A-Level'], c3:['ม.5','ม.6'],
    c4:['ม.6'], c5:['ม.4','ม.5','ม.6'], c6:['ม.4','ม.5','ม.6']
  };

  function card(c){
    const pill = c.status==='published'
      ? '<span class="pub-pill published"><span class="d"></span>เผยแพร่</span>'
      : '<span class="pub-pill draft"><span class="d"></span>ฉบับร่าง</span>';
    const price = c.was
      ? `<span style="font-size:11px;color:var(--fg-3);text-decoration:line-through;margin-right:5px">฿${c.was.toLocaleString()}</span>฿${c.price.toLocaleString()}`
      : `฿${c.price.toLocaleString()}`;
    return `<article class="cc ${c.status}" data-id="${c.id}">
      <div class="cc-cover" style="background:${c.grad}">
        <span class="cc-status">${pill}</span>
        <span class="cover-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${c.icon}</svg></span>
        <span class="badge-subj">${c.subject}${c.level ? ' · ' + c.level : ''}</span>
      </div>
      <div class="cc-body">
        <h3>${c.title}</h3>
        <div class="cc-tags"><span class="cc-tag">${c.grade}</span><span class="cc-tag">${c.lessons} บทเรียน</span><span class="cc-tag">${c.hours} ชม.</span></div>
        <div class="cc-stats">
          <div class="cc-stat"><span class="v price">${price}</span><span class="l">ราคา</span></div>
          <div class="cc-stat"><span class="v">${c.students.toLocaleString()}</span><span class="l">นักเรียน</span></div>
        </div>
      </div>
      <div class="cc-foot">
        <button class="stoggle" data-toggle="${c.id}" aria-pressed="${c.status==='published'}"><span class="track"></span><span class="lbl">${c.status==='published'?'เผยแพร่':'ร่าง'}</span></button>
        <a class="edit-link" href="Admin Course Editor.html?id=${c.id}">แก้ไข<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></a>
      </div>
    </article>`;
  }

  function render(){
    const vis = COURSES.filter(c=>{
      if(fSubject!=='all' && c.subject!==fSubject) return false;
      if(fStatus!=='all' && c.status!==fStatus) return false;
      if(fGrades.length && !(LEVELS[c.id]||[]).some(lv=>fGrades.includes(lv))) return false;
      if(q && !c.title.toLowerCase().includes(q.toLowerCase()) && !c.subject.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    if(vis.length===0){
      grid.style.display='none';
      noResult.style.display='block';
      noResult.innerHTML = '<div class="adm-empty"><div class="eic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></div><h3>ไม่พบคอร์ส</h3><p>ลองเปลี่ยนคำค้นหรือตัวกรอง หรือสร้างคอร์สใหม่</p></div>';
      return;
    }
    grid.style.display='';
    noResult.style.display='none';
    grid.innerHTML = vis.map(card).join('');
    // whole-card click → editor (except the publish toggle)
    grid.querySelectorAll('.cc').forEach(el=>{
      el.style.cursor = 'pointer';
      el.addEventListener('click', e=>{
        if(e.target.closest('.stoggle') || e.target.closest('.edit-link')) return;
        location.href = 'Admin Course Editor.html?id=' + el.dataset.id;
      });
    });
    grid.querySelectorAll('[data-toggle]').forEach(btn=>btn.addEventListener('click', e=>{
      e.preventDefault(); e.stopPropagation();
      const c = COURSES.find(x=>x.id===btn.dataset.toggle);
      c.status = c.status==='published' ? 'draft' : 'published';
      render();
    }));
  }

  document.getElementById('search').addEventListener('input', e=>{ q=e.target.value.trim(); render(); });
  document.querySelectorAll('#f-subject button').forEach(b=>b.addEventListener('click', ()=>{
    document.querySelectorAll('#f-subject button').forEach(x=>x.setAttribute('aria-pressed','false'));
    b.setAttribute('aria-pressed','true');
    fSubject = b.dataset.v; render();
  }));
  document.getElementById('f-status').addEventListener('change', e=>{ fStatus=e.target.value; render(); });
  document.querySelectorAll('#f-grade input').forEach(cb=>cb.addEventListener('change', ()=>{
    fGrades = [...document.querySelectorAll('#f-grade input:checked')].map(x=>x.value);
    render();
  }));
  document.querySelectorAll('#view-toggle button').forEach(b=>b.addEventListener('click', ()=>{
    document.querySelectorAll('#view-toggle button').forEach(x=>x.setAttribute('aria-pressed','false'));
    b.setAttribute('aria-pressed','true');
    grid.classList.toggle('list-view', b.dataset.v==='list');
  }));

  window.__onTweak = function(k,v){
    if(k==='defaultview'){
      grid.classList.toggle('list-view', v==='list');
      document.querySelectorAll('#view-toggle button').forEach(x=>x.setAttribute('aria-pressed', String(x.dataset.v===v)));
    }
    if(k==='view'){
      const page = document.querySelector('.adm-page');
      const blocks = page.querySelectorAll('.sum-strip, .adm-toolbar, .course-grid');
      let empty = document.getElementById('courses-empty');
      if(v==='empty'){
        blocks.forEach(b=>b.style.display='none'); noResult.style.display='none';
        if(!empty){ empty=document.createElement('div'); empty.id='courses-empty'; empty.className='adm-empty';
          empty.innerHTML='<div class="eic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div><h3>ยังไม่มีคอร์ส</h3><p>เริ่มสร้างคอร์สแรกของคุณ แล้วนักเรียนจะเห็นในหน้าร้านทันทีที่กดเผยแพร่</p><a href="Admin Course Editor.html" class="btn btn-primary" style="margin-top:8px">สร้างคอร์สแรก →</a>';
          page.appendChild(empty);
        }
        empty.style.display='flex';
      } else {
        blocks.forEach(b=>b.style.display=''); if(empty) empty.style.display='none'; render();
      }
    }
  };

  render();
})();
