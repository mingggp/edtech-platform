/* ==========================================================================
   Admin · Course editor — tabs, curriculum (collapse/expand), autosave,
   danger-zone type-to-confirm, students table
   ========================================================================== */
(function(){
  // ----- Tabs -----
  document.querySelectorAll('.ed-tab').forEach(tab=>tab.addEventListener('click', ()=>{
    document.querySelectorAll('.ed-tab').forEach(t=>t.setAttribute('aria-selected','false'));
    tab.setAttribute('aria-selected','true');
    const id = tab.dataset.tab;
    document.querySelectorAll('.ed-panel').forEach(p=>p.classList.toggle('active', p.dataset.panel===id));
  }));
  // deep-link: #reviews / #curriculum / #students opens that tab
  if(location.hash){
    const t = document.querySelector('.ed-tab[data-tab="'+location.hash.slice(1)+'"]');
    if(t) t.click();
  }

  // ----- Status toggle -----
  const ht = document.getElementById('head-toggle');
  ht.addEventListener('click', ()=>{ const on = ht.getAttribute('aria-pressed')!=='true'; ht.setAttribute('aria-pressed', String(on)); ht.querySelector('.lbl').textContent = on?'เผยแพร่':'ฉบับร่าง'; });

  // ----- Curriculum -----
  const CUR = [
    { title:'บทที่ 1 · กลศาสตร์ (Mechanics)', secDoc:'เอกสารรวมบทที่ 1 · กลศาสตร์.pdf', lessons:[
      {t:'แนะนำคอร์ส + แผนการเรียน', type:'video', dur:'08:24', free:true},
      {t:'การเคลื่อนที่แนวตรง', type:'video', dur:'22:10'},
      {t:'กฎการเคลื่อนที่ของนิวตัน', type:'video', dur:'28:45'},
      {t:'งาน พลังงาน และกำลัง', type:'video', dur:'24:30'},
      {t:'สรุปสูตร + เอกสารประกอบ', type:'doc', dur:'PDF 12 หน้า'},
      {t:'แบบฝึกหัดท้ายบท', type:'quiz', dur:'15 ข้อ'}
    ]},
    { title:'บทที่ 2 · ไฟฟ้าและแม่เหล็ก', lessons:[
      {t:'สนามไฟฟ้าและศักย์ไฟฟ้า', type:'video', dur:'26:12'},
      {t:'วงจรไฟฟ้ากระแสตรง', type:'video', dur:'30:05'},
      {t:'สนามแม่เหล็กไฟฟ้า', type:'video', dur:'27:40'},
      {t:'เอกสารสรุปไฟฟ้า', type:'doc', dur:'PDF 18 หน้า'},
      {t:'แบบทดสอบบทที่ 2', type:'quiz', dur:'20 ข้อ'}
    ]},
    { title:'บทที่ 3 · คลื่นและเสียง', lessons:[
      {t:'คลื่นกลและสมบัติของคลื่น', type:'video', dur:'23:18'},
      {t:'เสียงและการได้ยิน', type:'video', dur:'21:50'},
      {t:'แสงและทัศนศาสตร์', type:'video', dur:'25:33'},
      {t:'แบบฝึกหัดคลื่น', type:'quiz', dur:'18 ข้อ'}
    ]},
    { title:'บทที่ 4 · ความร้อนและอุณหพลศาสตร์', lessons:[
      {t:'อุณหภูมิและความร้อน', type:'video', dur:'19:42'},
      {t:'กฎของแก๊สและอุณหพลศาสตร์', type:'video', dur:'28:15'},
      {t:'เอกสารสรุปความร้อน', type:'doc', dur:'PDF 10 หน้า'}
    ]},
    { title:'บทที่ 5 · ตะลุยโจทย์ TCAS70', lessons:[
      {t:'เทคนิคทำข้อสอบให้ทันเวลา', type:'video', dur:'18:00', free:true},
      {t:'ข้อสอบเสมือนจริง ชุดที่ 1', type:'quiz', dur:'30 ข้อ'},
      {t:'เฉลยละเอียด ชุดที่ 1', type:'video', dur:'42:20'},
      {t:'ข้อสอบเสมือนจริง ชุดที่ 2', type:'quiz', dur:'30 ข้อ'}
    ]}
  ];
  const TYPE_ICON = {
    video:'<path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    doc:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    quiz:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'
  };
  const TYPE_LABEL = { video:'วิดีโอ', doc:'เอกสาร', quiz:'แบบทดสอบ' };
  const dragSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>';

  const curEl = document.getElementById('curriculum');
  function renderCur(){
    curEl.innerHTML = CUR.map((sec,si)=>{
      const lessons = sec.lessons.map((l,li)=>`
        <div class="cur-lesson" data-lesson="${si}-${li}" draggable="true">
          <span class="drag">${dragSvg}</span>
          <span class="l-ic ${l.type}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${TYPE_ICON[l.type]}</svg></span>
          <div class="l-info"><b>${l.t}</b><span>${TYPE_LABEL[l.type]} · ${l.dur}</span></div>
          ${l.free?'<span class="l-free">ดูฟรี</span>':''}
          <div class="l-acts">
            <button class="ic-btn" title="แก้ไข" data-edit-lesson="${si}-${li}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
            <button class="ic-btn danger" title="ลบ" data-del-lesson="${si}-${li}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </div>
        </div>`).join('');
      return `<div class="cur-section" data-sec="${si}">
        <div class="cur-sec-head" data-collapse="${si}">
          <span class="drag" onclick="event.stopPropagation()">${dragSvg}</span>
          <span class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>
          <span class="sec-title">${sec.title}</span>
          <span class="sec-meta">${sec.lessons.length} บทเรียน</span>
          <button class="ic-btn" title="แก้ชื่อบท" data-edit-sec="${si}" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
        </div>
        <div class="cur-lessons">${lessons}
          <div class="sec-doc">
            <span class="sd-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3"/></svg></span>
            <div class="sd-tx">
              <b>เอกสารรวมทั้งบท (ฉบับเดียว)</b>
              <span>${sec.secDoc ? sec.secDoc : 'ยังไม่ได้แนบ — ผู้เรียนจะเห็นปุ่มโหลดเด่นที่หัวบท'}</span>
            </div>
            <label class="btn btn-ghost btn-sm" style="cursor:pointer;flex-shrink:0" onclick="event.stopPropagation()">
              ${sec.secDoc ? 'เปลี่ยนไฟล์' : 'แนบไฟล์'}
              <input type="file" accept=".pdf" hidden data-sec-doc="${si}" />
            </label>
          </div>
          <button class="add-lesson"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>เพิ่มบทเรียน</button>
        </div>
      </div>`;
    }).join('');
    // collapse wiring (CSS caps open height — no scrollHeight measurement)
    curEl.querySelectorAll('[data-collapse]').forEach(h=>h.addEventListener('click', ()=>{
      h.closest('.cur-section').classList.toggle('collapsed');
    }));
    curEl.querySelectorAll('[data-del-lesson]').forEach(b=>b.addEventListener('click', ()=>{
      const [si,li]=b.dataset.delLesson.split('-').map(Number); CUR[si].lessons.splice(li,1); renderCur(); updateCounts();
    }));
    curEl.querySelectorAll('.add-lesson').forEach((b,si)=>b.addEventListener('click', ()=>{
      CUR[si].lessons.push({t:'บทเรียนใหม่', type:'video', dur:'00:00'}); renderCur(); updateCounts();
    }));
    curEl.querySelectorAll('[data-sec-doc]').forEach(inp=>inp.addEventListener('change', ()=>{
      if(inp.files[0]){ CUR[+inp.dataset.secDoc].secDoc = inp.files[0].name; renderCur(); updateCounts(); }
    }));

    /* ---- inline edit: section title ---- */
    curEl.querySelectorAll('[data-edit-sec]').forEach(b=>b.addEventListener('click', ()=>{
      const si = +b.dataset.editSec;
      const head = b.closest('.cur-sec-head');
      const titleEl = head.querySelector('.sec-title');
      if(head.querySelector('input')) return;
      const inp = document.createElement('input');
      inp.className = 'ed-inline';
      inp.value = CUR[si].title;
      inp.addEventListener('click', e=>e.stopPropagation());
      inp.addEventListener('keydown', e=>{
        if(e.key==='Enter') inp.blur();
        if(e.key==='Escape'){ inp.value = CUR[si].title; inp.blur(); }
      });
      inp.addEventListener('blur', ()=>{
        const v = inp.value.trim();
        if(v) CUR[si].title = v;
        renderCur(); updateCounts();
      });
      titleEl.replaceWith(inp);
      inp.focus(); inp.select();
    }));

    /* ---- drag & drop reorder: lessons (within/between sections) ---- */
    let dragSrc = null; // {si, li}
    curEl.querySelectorAll('.cur-lesson').forEach(row=>{
      row.addEventListener('dragstart', e=>{
        const [si,li] = row.dataset.lesson.split('-').map(Number);
        dragSrc = { si, li };
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', row.dataset.lesson); } catch(_) {}
      });
      row.addEventListener('dragend', ()=>{ row.classList.remove('dragging'); curEl.querySelectorAll('.drop-above,.drop-below').forEach(x=>x.classList.remove('drop-above','drop-below')); dragSrc = null; });
      row.addEventListener('dragover', e=>{
        if(!dragSrc) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const r = row.getBoundingClientRect();
        const below = (e.clientY - r.top) > r.height/2;
        row.classList.toggle('drop-below', below);
        row.classList.toggle('drop-above', !below);
      });
      row.addEventListener('dragleave', ()=>row.classList.remove('drop-above','drop-below'));
      row.addEventListener('drop', e=>{
        if(!dragSrc) return;
        e.preventDefault();
        const [ti,tl] = row.dataset.lesson.split('-').map(Number);
        const r = row.getBoundingClientRect();
        const below = (e.clientY - r.top) > r.height/2;
        const item = CUR[dragSrc.si].lessons.splice(dragSrc.li, 1)[0];
        let insertAt = tl + (below ? 1 : 0);
        if(dragSrc.si === ti && dragSrc.li < insertAt) insertAt--;
        CUR[ti].lessons.splice(insertAt, 0, item);
        dragSrc = null;
        renderCur(); updateCounts();
      });
    });
    // allow dropping into an empty/end zone of a section
    curEl.querySelectorAll('.cur-lessons').forEach((zone)=>{
      zone.addEventListener('dragover', e=>{ if(dragSrc && e.target === zone){ e.preventDefault(); } });
      zone.addEventListener('drop', e=>{
        if(!dragSrc || e.target !== zone) return;
        e.preventDefault();
        const si = +zone.closest('.cur-section').dataset.sec;
        const item = CUR[dragSrc.si].lessons.splice(dragSrc.li, 1)[0];
        CUR[si].lessons.push(item);
        dragSrc = null;
        renderCur(); updateCounts();
      });
    });

    /* ---- drag & drop reorder: sections (by header handle) ---- */
    let secSrc = null;
    curEl.querySelectorAll('.cur-section').forEach(sec=>{
      const handle = sec.querySelector('.cur-sec-head .drag');
      handle.addEventListener('mousedown', ()=>sec.setAttribute('draggable','true'));
      sec.addEventListener('dragstart', e=>{
        if(!sec.getAttribute('draggable')) return;
        if(e.target.closest('.cur-lesson')) return; // lesson drag takes precedence
        secSrc = +sec.dataset.sec;
        sec.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      sec.addEventListener('dragend', ()=>{ sec.classList.remove('dragging'); sec.removeAttribute('draggable'); curEl.querySelectorAll('.sec-drop-above,.sec-drop-below').forEach(x=>x.classList.remove('sec-drop-above','sec-drop-below')); secSrc = null; });
      sec.addEventListener('dragover', e=>{
        if(secSrc === null || dragSrc) return;
        e.preventDefault();
        const r = sec.getBoundingClientRect();
        const below = (e.clientY - r.top) > r.height/2;
        sec.classList.toggle('sec-drop-below', below);
        sec.classList.toggle('sec-drop-above', !below);
      });
      sec.addEventListener('dragleave', ()=>sec.classList.remove('sec-drop-above','sec-drop-below'));
      sec.addEventListener('drop', e=>{
        if(secSrc === null || dragSrc) return;
        e.preventDefault();
        const ti = +sec.dataset.sec;
        if(ti === secSrc) return;
        const r = sec.getBoundingClientRect();
        const below = (e.clientY - r.top) > r.height/2;
        const item = CUR.splice(secSrc, 1)[0];
        let insertAt = ti + (below ? 1 : 0);
        if(secSrc < insertAt) insertAt--;
        CUR.splice(insertAt, 0, item);
        secSrc = null;
        renderCur(); updateCounts();
      });
    });

    /* ---- lesson edit → popup modal ---- */
    curEl.querySelectorAll('[data-edit-lesson]').forEach(b=>b.addEventListener('click', ()=>{
      const [si,li] = b.dataset.editLesson.split('-').map(Number);
      openLessonModal(si, li);
    }));
  }
  function updateCounts(){
    const secs=CUR.length, lessons=CUR.reduce((a,s)=>a+s.lessons.length,0);
    document.getElementById('cur-secs').textContent=secs;
    document.getElementById('cur-lessons').textContent=lessons;
    document.getElementById('lesson-count').textContent=lessons;
  }
  renderCur(); updateCounts();

  /* ---- lesson edit modal ---- */
  const lmScrim = document.getElementById('lesson-modal');
  const lmName = document.getElementById('lm-name');
  const lmType = document.getElementById('lm-type');
  const lmDur = document.getElementById('lm-dur');
  const lmDurLabel = document.getElementById('lm-dur-label');
  const lmUrlField = document.getElementById('lm-url-field');
  const lmUrl = document.getElementById('lm-url');
  const lmFree = document.getElementById('lm-free');
  const lmFiles = document.getElementById('lm-files');
  const lmFileInput = document.getElementById('lm-file-input');
  let lmTarget = null, lmFileList = [];

  const DUR_LABEL = { video:'ความยาวคลิป', doc:'ชื่อไฟล์/จำนวนหน้า', quiz:'จำนวนข้อ' };
  function lmSyncType(){
    lmDurLabel.textContent = DUR_LABEL[lmType.value];
    lmUrlField.style.display = lmType.value==='video' ? '' : 'none';
    // เอกสาร: ไม่ต้องใส่เวลา — ซ่อนช่อง duration ทั้งก้อน
    lmDur.closest('.field').style.display = lmType.value==='doc' ? 'none' : '';
  }
  lmType.addEventListener('change', lmSyncType);

  /* auto-detect clip duration from YouTube link (simulated; production = YouTube Data API) */
  const lmDurAuto = document.getElementById('lm-dur-auto');
  function fakeDurationFor(url){
    // deterministic pseudo-duration from url so it feels real
    let h = 0; for(const c of url) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const mins = 12 + (h % 34), secs = h % 60;
    return String(mins).padStart(2,'0') + ':' + String(secs).padStart(2,'0');
  }
  lmUrl.addEventListener('change', ()=>{
    const u = lmUrl.value.trim();
    lmDurAuto.style.display = 'none';
    if(!/(?:youtu\.be\/|youtube\.com\/)\S+/.test(u)) return;
    lmDur.value = '';
    lmDur.placeholder = 'กำลังตรวจจับ...';
    setTimeout(()=>{
      lmDur.value = fakeDurationFor(u);
      lmDur.placeholder = 'เช่น 22:10';
      lmDurAuto.style.display = '';
    }, 700);
  });
  lmDur.addEventListener('input', ()=>{ lmDurAuto.style.display = 'none'; });

  /* clip preview for testing */
  const lmPreview = document.getElementById('lm-preview');
  const lmPreviewFrame = document.getElementById('lm-preview-frame');
  function ytId(u){
    const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{6,})/);
    return m ? m[1] : null;
  }
  function syncPreview(){
    const id = ytId(lmUrl.value.trim());
    if(id){
      const src = 'https://www.youtube.com/embed/' + id;
      if(lmPreviewFrame.src !== src) lmPreviewFrame.src = src;
      lmPreview.style.display = '';
    } else {
      lmPreviewFrame.src = '';
      lmPreview.style.display = 'none';
    }
  }
  lmUrl.addEventListener('change', syncPreview);
  lmUrl.addEventListener('blur', syncPreview);

  function renderLmFiles(){
    lmFiles.innerHTML = lmFileList.length
      ? lmFileList.map((f,i)=>`<div style="display:flex;align-items:center;gap:9px;font-size:12.5px;color:var(--fg-1);background:var(--bg-2);border:1px solid var(--line-soft);border-radius:9px;padding:7px 11px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
          <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f}</span>
          <button data-rm-file="${i}" style="border:0;background:transparent;color:var(--fg-3);cursor:pointer;padding:2px;display:flex"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        </div>`).join('')
      : '<div style="font-size:12px;color:var(--fg-3)">ยังไม่มีไฟล์แนบ</div>';
    lmFiles.querySelectorAll('[data-rm-file]').forEach(x=>x.addEventListener('click', ()=>{
      lmFileList.splice(+x.dataset.rmFile,1); renderLmFiles();
    }));
  }
  lmFileInput.addEventListener('change', ()=>{
    [...lmFileInput.files].forEach(f=>lmFileList.push(f.name));
    lmFileInput.value = '';
    renderLmFiles();
  });

  function openLessonModal(si, li){
    const l = CUR[si].lessons[li];
    lmTarget = { si, li };
    lmName.value = l.t;
    lmType.value = l.type;
    lmDur.value = l.dur;
    lmUrl.value = l.url || '';
    lmFree.checked = !!l.free;
    lmFileList = (l.files || []).slice();
    lmSyncType(); renderLmFiles(); syncPreview();
    lmScrim.classList.add('open');
    setTimeout(()=>lmName.focus(), 50);
  }

  function closeLessonModal(){ lmScrim.classList.remove('open'); lmTarget = null; lmPreviewFrame.src = ''; }
  document.getElementById('lm-cancel').addEventListener('click', closeLessonModal);
  lmScrim.addEventListener('click', e=>{ if(e.target===lmScrim) closeLessonModal(); });
  document.getElementById('lm-save').addEventListener('click', ()=>{
    if(!lmTarget) return;
    const l = CUR[lmTarget.si].lessons[lmTarget.li];
    const t = lmName.value.trim();
    if(t) l.t = t;
    l.type = lmType.value;
    const d = lmDur.value.trim(); if(d) l.dur = d;
    l.url = lmUrl.value.trim();
    l.free = lmFree.checked;
    l.files = lmFileList.slice();
    closeLessonModal(); renderCur(); updateCounts();
  });

  /* ================= REVIEWS TAB ================= */
  const REVS = [
    {n:'ณัฐริกา บุญมี', i:'ณบ', av:'oklch(0.62 0.19 255)', clip:'สนามแม่เหล็กไฟฟ้า', stars:5, when:'2 ชม.ที่แล้ว', txt:'อาจารย์อธิบายเห็นภาพมากค่ะ แต่ตรงนาทีที่ 14:20 อยากให้ขยายวิธีหาทิศทางของแรงอีกนิดนึง 🙏', st:'pending'},
    {n:'ธนกร พงษ์ไพบูลย์', i:'ธพ', av:'oklch(0.62 0.22 340)', clip:'กฎของแก๊สและอุณหพลศาสตร์', stars:4, when:'5 ชม.ที่แล้ว', txt:'ข้อ 3 ในแบบฝึกหัดท้ายคลิป เฉลยเป็น ข. ไม่ใช่ ค. หรือเปล่าครับ?', st:'pending'},
    {n:'ชนิกานต์ มีสุข', i:'ชม', av:'oklch(0.66 0.16 160)', clip:'เทคนิคทำข้อสอบให้ทันเวลา', stars:5, when:'เมื่อวาน', txt:'คลิปนี้ช่วยชีวิตมาก สอบ mock รอบล่าสุดทำทันทุกข้อเป็นครั้งแรก!', st:'answered', reply:'ยินดีด้วยนะครับ เก่งมาก! ฝึกจับเวลาแบบนี้ต่อเนื่องถึงวันสอบจริงเลย 💪'},
    {n:'ภูริณัฐ ตันติวงศ์', i:'ภต', av:'oklch(0.72 0.15 80)', clip:'คลื่นกลและสมบัติของคลื่น', stars:2, when:'2 วันก่อน', txt:'เสียงคลิปนี้เบากว่าคลิปอื่นมากครับ ต้องเปิดสุดถึงได้ยิน', st:'pending'},
    {n:'สุพิชญา คงทอง', i:'สค', av:'oklch(0.6 0.2 300)', clip:'อนุพันธ์คือความชัน', stars:1, when:'3 วันก่อน', txt:'สแปมลิงก์ขายของ...', st:'hidden'}
  ];
  const revList = document.getElementById('rev-list');
  let revF = 'all';
  function starStr(n){ return '★'.repeat(n) + '☆'.repeat(5-n); }
  function renderRevs(){
    const vis = REVS.filter(r => revF==='all' ? r.st!=='hidden' : r.st===revF);
    document.getElementById('rev-count').textContent = 'แสดง ' + vis.length + ' จาก ' + REVS.length + ' รายการ';
    document.getElementById('rev-pending').textContent = REVS.filter(r=>r.st==='pending').length;
    revList.innerHTML = vis.map((r,idx)=>{
      const i = REVS.indexOf(r);
      return `<div class="rev-item${r.st==='hidden'?' hidden-c':''}">
        <div class="rv-head">
          <div class="av" style="background:${r.av}">${r.i}</div>
          <div class="who"><b>${r.n}</b><span>${r.when}</span></div>
          <span class="stars">${starStr(r.stars)}</span>
        </div>
        <span class="rv-clip"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>${r.clip}</span>
        <p>${r.txt}</p>
        ${r.reply ? `<div class="rv-reply"><b>ครูมิ่ง:</b> ${r.reply}</div>` : ''}
        <div class="rv-acts" style="margin-top:10px">
          ${r.st==='pending' ? '<span class="badge-pending">รอตอบ</span>' : ''}
          ${!r.reply && r.st!=='hidden' ? `<button class="btn btn-ghost btn-sm" data-rev-reply="${i}">ตอบกลับ</button>` : ''}
          ${r.st!=='hidden' ? `<button class="btn btn-ghost btn-sm" data-rev-hide="${i}">ซ่อน</button>` : `<button class="btn btn-ghost btn-sm" data-rev-show="${i}">เลิกซ่อน</button>`}
        </div>
      </div>`;
    }).join('') || '<div style="text-align:center;color:var(--fg-3);padding:30px;font-size:13px">ไม่มีรายการในหมวดนี้</div>';

    revList.querySelectorAll('[data-rev-hide]').forEach(b=>b.addEventListener('click', ()=>{ REVS[+b.dataset.revHide].st='hidden'; renderRevs(); }));
    revList.querySelectorAll('[data-rev-show]').forEach(b=>b.addEventListener('click', ()=>{ REVS[+b.dataset.revShow].st='pending'; renderRevs(); }));
    revList.querySelectorAll('[data-rev-reply]').forEach(b=>b.addEventListener('click', ()=>{
      const r = REVS[+b.dataset.revReply];
      const item = b.closest('.rev-item');
      if(item.querySelector('.rv-reply-box')) return;
      const box = document.createElement('div');
      box.className = 'rv-reply-box';
      box.style.cssText = 'display:flex;gap:8px;margin-top:10px';
      box.innerHTML = '<input class="inp" style="flex:1;height:38px;font-size:13px" placeholder="พิมพ์คำตอบในนามครูมิ่ง..." /><button class="btn btn-primary btn-sm">ส่ง</button>';
      item.appendChild(box);
      const inp = box.querySelector('input');
      inp.focus();
      const send = ()=>{ const v = inp.value.trim(); if(!v) return; r.reply = v; r.st='answered'; renderRevs(); };
      box.querySelector('button').addEventListener('click', send);
      inp.addEventListener('keydown', e=>{ if(e.key==='Enter') send(); });
    }));
  }
  document.querySelectorAll('#rev-filter button').forEach(b=>b.addEventListener('click', ()=>{
    document.querySelectorAll('#rev-filter button').forEach(x=>x.setAttribute('aria-pressed','false'));
    b.setAttribute('aria-pressed','true');
    revF = b.dataset.v; renderRevs();
  }));
  renderRevs();

  // rating distribution bars
  const DIST = [ [5,112], [4,24], [3,7], [2,3], [1,2] ];
  document.getElementById('rev-bars').innerHTML = DIST.map(([s,n])=>
    `<div class="rev-bar"><span>${s}★</span><div class="tr"><i style="width:${Math.round(n/148*100)}%"></i></div><span>${n}</span></div>`).join('');

  // lowest rated clips
  document.getElementById('rev-low').innerHTML = [
    ['3.6','คลื่นกลและสมบัติของคลื่น'],
    ['4.1','กฎของแก๊สและอุณหพลศาสตร์'],
    ['4.3','ศักย์ไฟฟ้า']
  ].map(([sc,t])=>`<div class="rev-low-row"><span class="sc">${sc}★</span><span class="t">${t}</span></div>`).join('');

  document.getElementById('add-section').addEventListener('click', ()=>{
    CUR.push({title:'บทใหม่ · ตั้งชื่อบท', lessons:[]}); renderCur(); updateCounts();
    const last = curEl.lastElementChild;
    if(last){ const sc = document.querySelector('.adm-scroll'); sc.scrollTo({ top: last.offsetTop - 120, behavior: 'smooth' }); }
  });
  let allCollapsed=false;
  document.getElementById('expand-all').addEventListener('click', ()=>{
    allCollapsed=!allCollapsed;
    curEl.querySelectorAll('.cur-section').forEach(sec=>sec.classList.toggle('collapsed', allCollapsed));
  });

  // ----- Students table -----
  const AV=['oklch(0.6 0.2 145)','oklch(0.58 0.22 5)','oklch(0.66 0.2 50)','oklch(0.5 0.18 210)','oklch(0.55 0.2 295)','oklch(0.62 0.2 230)'];
  const STU=[
    {n:'ธนกร พงษ์ไพบูลย์', i:'ธพ', g:'ม.6', date:'30 พ.ค. 2026', prog:12, last:'2 นาทีที่แล้ว'},
    {n:'ณัฐริกา บุญมี', i:'ณบ', g:'ม.6', date:'29 พ.ค. 2026', prog:64, last:'1 ชั่วโมงที่แล้ว'},
    {n:'ชนิกานต์ มีสุข', i:'ชม', g:'ม.5', date:'27 พ.ค. 2026', prog:88, last:'เมื่อวาน'},
    {n:'ภูริณัฐ ตันติวงศ์', i:'ภต', g:'ม.6', date:'24 พ.ค. 2026', prog:45, last:'3 วันก่อน'},
    {n:'สุพิชญา คงทอง', i:'สค', g:'ม.4', date:'21 พ.ค. 2026', prog:100, last:'5 วันก่อน'},
    {n:'จิรายุ เพชรน้ำหนึ่ง', i:'จพ', g:'ม.5', date:'18 พ.ค. 2026', prog:33, last:'1 สัปดาห์ก่อน'},
    {n:'พิมพ์มาดา ศรีสุข', i:'พศ', g:'ม.6', date:'15 พ.ค. 2026', prog:72, last:'2 สัปดาห์ก่อน'}
  ];
  const tbody = document.querySelector('#stu-table tbody');
  let stuQ = '', stuF = 'all';
  function renderStu(){
    const vis = STU.filter(s=>{
      if(stuQ && !s.n.includes(stuQ)) return false;
      if(stuF!=='all' && s.g!==stuF) return false;
      return true;
    });
    const cnt = document.getElementById('stu-count');
    if(cnt) cnt.textContent = (stuQ||stuF!=='all') ? ('แสดง ' + vis.length + ' จาก 312 คน') : '312 คนในคอร์สนี้';
    if(!vis.length){ tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--fg-3);padding:26px">ไม่พบนักเรียนตามเงื่อนไข</td></tr>'; return; }
    if(!vis.length){ tbody.innerHTML='<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--fg-2)">ไม่พบนักเรียน</td></tr>'; return; }
    tbody.innerHTML = vis.map((s,i)=>`<tr>
      <td><div class="mt-user"><div class="av" style="background:linear-gradient(135deg,${AV[i%AV.length]},oklch(from ${AV[i%AV.length]} calc(l + 0.08) c calc(h + 20)))">${s.i}</div><div><b>${s.n}</b><span>นักเรียน</span></div></div></td>
      <td><span style="font-family:'JetBrains Mono';font-size:11.5px;color:var(--fg-1);background:var(--bg-2);border:1px solid var(--line-soft);padding:2px 9px;border-radius:99px">${s.g}</span></td>
      <td style="color:var(--fg-2)">${s.date}</td>
      <td><div class="prog-mini"><div class="bar"><i style="width:${s.prog}%"></i></div><span class="pct">${s.prog}%</span></div></td>
      <td style="color:var(--fg-2)">${s.last}</td>
    </tr>`).join('');
  }
  renderStu();
  document.getElementById('stu-search').addEventListener('input', e=>{ stuQ = e.target.value.trim(); renderStu(); });
  document.querySelectorAll('#stu-filter button').forEach(b=>b.addEventListener('click', ()=>{
    document.querySelectorAll('#stu-filter button').forEach(x=>x.setAttribute('aria-pressed','false'));
    b.setAttribute('aria-pressed','true');
    stuF = b.dataset.v; renderStu();
  }));

  // ----- Autosave -----
  const pill = document.getElementById('autosave');
  let saveT;
  document.querySelectorAll('[data-save]').forEach(el=>el.addEventListener('input', ()=>{
    clearTimeout(saveT);
    pill.classList.add('saving'); pill.innerHTML='<span class="d"></span>กำลังบันทึก...';
    saveT = setTimeout(()=>{
      pill.classList.remove('saving');
      const t=new Date(); const hh=String(t.getHours()).padStart(2,'0'), mm=String(t.getMinutes()).padStart(2,'0');
      pill.innerHTML='<span class="d"></span>บันทึกแล้ว · '+hh+':'+mm;
    }, 900);
  }));
  // live title sync
  const ti=document.getElementById('title-input');
  ti.addEventListener('input', ()=>{ document.getElementById('crumb-title').textContent = ti.value || 'คอร์สใหม่'; });

  // ----- Danger zone modal -----
  const modal=document.getElementById('del-modal'), confirmInp=document.getElementById('del-confirm'), goBtn=document.getElementById('del-go');
  document.getElementById('del-course').addEventListener('click', ()=>{ modal.classList.add('open'); confirmInp.value=''; goBtn.disabled=true; goBtn.style.opacity='.5'; setTimeout(()=>confirmInp.focus(),50); });
  function closeModal(){ modal.classList.remove('open'); }
  document.getElementById('del-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', e=>{ if(e.target===modal) closeModal(); });
  confirmInp.addEventListener('input', ()=>{ const ok=confirmInp.value.trim()==='ลบคอร์ส'; goBtn.disabled=!ok; goBtn.style.opacity=ok?'1':'.5'; });
  goBtn.addEventListener('click', ()=>{ if(goBtn.disabled) return; window.location.href='Admin Courses.html'; });

  // ----- New course mode (?id absent) -----
  const params=new URLSearchParams(location.search);
  if(!params.get('id') || params.get('id')==='new'){
    document.getElementById('page-title').innerHTML='สร้าง<span class="grad">คอร์สใหม่</span>';
    document.getElementById('crumb-title').textContent='คอร์สใหม่';
    document.querySelector('.adm-head .sub').textContent='กรอกข้อมูลคอร์ส แล้วเพิ่มเนื้อหา — บันทึกอัตโนมัติ';
  }
})();
