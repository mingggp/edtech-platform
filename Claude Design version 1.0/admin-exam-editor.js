/* ==========================================================================
   Admin · Exam editor — question authoring + correct picker + preview mode
   ========================================================================== */
(function(){
  const QS = [
    { text:'วัตถุมวล 2 kg เคลื่อนที่ด้วยความเร็ว 4 m/s ชนกับวัตถุมวล 3 kg ที่อยู่นิ่ง หากการชนเป็นแบบไม่ยืดหยุ่นสมบูรณ์ ความเร็วร่วมหลังชนมีค่าเท่าใด',
      img:false, choices:['1.2 m/s','1.6 m/s','2.0 m/s','2.4 m/s'], correct:1,
      explain:'ใช้กฎอนุรักษ์โมเมนตัม: (2×4)+(3×0) = (2+3)×v → 8 = 5v → v = 1.6 m/s' },
    { text:'ประจุไฟฟ้า +q สองตัววางห่างกัน r เกิดแรงผลัก F หากเพิ่มระยะห่างเป็น 2r แรงระหว่างประจุจะเป็นเท่าใด',
      img:true, choices:['F/4','F/2','2F','4F'], correct:0,
      explain:'จากกฎของคูลอมบ์ F ∝ 1/r² เมื่อ r เพิ่มเป็น 2 เท่า แรงจะลดลง 4 เท่า → F/4' },
    { text:'คลื่นเสียงความถี่ 340 Hz เคลื่อนที่ในอากาศด้วยอัตราเร็ว 340 m/s ความยาวคลื่นมีค่าเท่าใด',
      img:false, choices:['0.5 m','1.0 m','1.5 m','2.0 m'], correct:1,
      explain:'λ = v/f = 340/340 = 1.0 m' },
    { text:'แก๊สอุดมคติในภาชนะปิดถูกทำให้อุณหภูมิเพิ่มจาก 27°C เป็น 327°C ที่ปริมาตรคงที่ ความดันจะเปลี่ยนไปอย่างไร',
      img:false, choices:['เพิ่มขึ้น 2 เท่า','เพิ่มขึ้น 12 เท่า','ลดลงครึ่งหนึ่ง','ไม่เปลี่ยนแปลง'], correct:0,
      explain:'แปลงเป็นเคลวิน: 300 K → 600 K ที่ V คงที่ P ∝ T → ความดันเพิ่มขึ้น 2 เท่า' },
    { text:'แสงเดินทางจากตัวกลางที่มีดรรชนีหักเห 1.0 เข้าสู่ตัวกลางดรรชนีหักเห 1.5 มุมตกกระทบ 30° มุมหักเหมีค่าประมาณเท่าใด',
      img:true, choices:['19.5°','30°','41.8°','48.6°'], correct:0,
      explain:'ใช้กฎของสเนล: n₁sinθ₁ = n₂sinθ₂ → 1.0×sin30° = 1.5×sinθ₂ → sinθ₂ = 0.333 → θ₂ ≈ 19.5°' }
  ];
  const LETTERS = ['ก','ข','ค','ง','จ'];
  let sel = 0, mode='edit';

  const rowsEl = document.getElementById('q-rows');
  const choicesEl = document.getElementById('choices');
  const qe = document.getElementById('qe');

  function renderList(){
    document.getElementById('q-count').textContent = QS.length+' ข้อ';
    const tabC = document.getElementById('tab-q-count'); if(tabC) tabC.textContent = QS.length;
    rowsEl.innerHTML = QS.map((q,i)=>{
      const complete = q.type==='sa'
        ? !!(q.text.trim() && (q.answer||'').trim())
        : !!(q.text.trim() && q.choices.filter(c=>c.trim()).length>=2 && q.correct>=0) || q.choiceImg && q.text.trim();
      const flag = complete
        ? '<span class="qok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg></span>'
        : '<span class="qwarn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v5M12 17h.01"/></svg></span>';
      const img = q.img ? '<span class="qimg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg></span>' : '';
      const ty = q.type==='sa' ? '<span class="qimg" title="อัตนัย" style="font-family:JetBrains Mono;font-size:9px;font-weight:700">อ</span>' : '';
      return `<div class="qa-row${i===sel?' sel':''}" data-i="${i}">
        <span class="qnum">${i+1}</span>
        <span class="qtext">${q.text || '<i style="color:var(--fg-3)">ยังไม่มีโจทย์</i>'}</span>
        <span class="qflags">${flag}${ty}${img}</span>
      </div>`;
    }).join('');
    rowsEl.querySelectorAll('.qa-row').forEach(r=>r.addEventListener('click', ()=>{ sel=+r.dataset.i; renderEditor(); renderList(); }));
  }

  function renderEditor(){
    const q = QS[sel];
    q.type = q.type || 'mc';
    document.getElementById('qe-num').textContent = 'ข้อ '+(sel+1);
    document.getElementById('qe-of').textContent = 'จาก '+QS.length;
    document.getElementById('foot-pos').textContent = (sel+1)+' / '+QS.length;
    document.getElementById('q-text').value = q.text;
    document.getElementById('q-explain').value = q.explain;
    // type segmented + section visibility
    document.querySelectorAll('#q-type button').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.v===q.type)));
    document.getElementById('mc-sec').style.display = q.type==='mc' ? '' : 'none';
    document.getElementById('sa-sec').style.display = q.type==='sa' ? '' : 'none';
    setAnsGrid(q.answer || '');
    const cit = document.getElementById('choice-img-toggle');
    cit.checked = !!q.choiceImg;
    // image attach chip reflect + toggle
    const drop = document.getElementById('q-img-drop');
    drop.querySelector('.tx b').textContent = q.img ? 'มีรูปแล้ว · กดเพื่อลบ' : 'แนบรูป';
    drop.classList.toggle('filled', !!q.img);
    drop.onclick = ()=>{ q.img = !q.img; renderEditor(); renderList(); markSave(); };
    // explanation image chip
    const exDrop = document.getElementById('ex-img-drop');
    exDrop.querySelector('.tx b').textContent = q.explainImg ? 'มีรูปเฉลยแล้ว · กดเพื่อลบ' : 'แนบรูปเฉลย';
    exDrop.classList.toggle('filled', !!q.explainImg);
    exDrop.onclick = ()=>{ q.explainImg = !q.explainImg; renderEditor(); markSave(); };
    // choices
    choicesEl.innerHTML = q.choices.map((c,ci)=>{
      const body = q.choiceImg
        ? `<span class="c-imgslot${c?' filled':''}" data-cimg="${ci}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>${c ? 'รูปตัวเลือก '+LETTERS[ci]+' · กดเพื่อเปลี่ยน' : 'แนบรูปตัวเลือก '+LETTERS[ci]}</span>`
        : `<input class="c-inp" data-cinp="${ci}" value="${c.replace(/"/g,'&quot;')}" placeholder="ตัวเลือก ${LETTERS[ci]}" />`;
      return `
      <div class="choice${ci===q.correct?' correct':''}" data-ci="${ci}">
        <button class="pick" data-pick="${ci}" title="ตั้งเป็นข้อที่ถูก">${LETTERS[ci]}</button>
        ${body}
        <span class="c-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>ข้อที่ถูก</span>
        <button class="ic-btn danger c-del" data-cdel="${ci}" title="ลบตัวเลือก"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      </div>`;
    }).join('');
    choicesEl.querySelectorAll('[data-cimg]').forEach(s=>s.addEventListener('click', ()=>{
      const ci=+s.dataset.cimg;
      q.choices[ci] = q.choices[ci] ? '' : 'img:choice-'+(ci+1)+'.png';
      renderEditor(); renderList(); markSave();
    }));
    choicesEl.querySelectorAll('[data-pick]').forEach(b=>b.addEventListener('click', ()=>{ q.correct=+b.dataset.pick; renderEditor(); renderList(); markSave(); }));
    choicesEl.querySelectorAll('[data-cinp]').forEach(inp=>inp.addEventListener('input', ()=>{ q.choices[+inp.dataset.cinp]=inp.value; markSave(); }));
    choicesEl.querySelectorAll('[data-cdel]').forEach(b=>b.addEventListener('click', ()=>{
      const ci=+b.dataset.cdel; if(q.choices.length<=2) return;
      q.choices.splice(ci,1); if(q.correct===ci) q.correct=0; else if(q.correct>ci) q.correct--;
      renderEditor(); renderList(); markSave();
    }));
    if(mode==='preview') renderPreview();
  }

  function renderPreview(){
    const q = QS[sel];
    const imgBlock = q.img ? '<div class="pv-img"><div class="dz-stripe"></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--fg-3);font-family:JetBrains Mono;font-size:12px">[ รูปประกอบโจทย์ ]</div></div>' : '';
    let body;
    if(q.type==='sa'){
      body = `<div class="pv-choices"><div style="padding:14px 16px;border:1.5px dashed var(--line);border-radius:12px;color:var(--fg-3);font-size:13.5px">ช่องเติมคำตอบ — นักเรียนพิมพ์คำตอบเอง · คำตอบที่ถูก: <b style="color:var(--fg-1)">${(q.answer||'—')}</b></div></div>`;
    } else {
      body = '<div class="pv-choices">' + q.choices.map((c,ci)=>`
      <div class="pv-choice${ci===q.correct?' reveal-correct':''}">
        <span class="radio"></span>
        <span class="letter">${LETTERS[ci]}.</span>
        ${q.choiceImg ? '<span class="pv-cimg">'+(c?'[ รูป ]':'[ ว่าง ]')+'</span>' : '<span class="txt">'+(c||'<i style="color:var(--fg-3)">(ว่าง)</i>')+'</span>'}
      </div>`).join('') + '</div>';
    }
    document.getElementById('qe-preview').innerHTML = `
      <div class="pv-q">${(sel+1)}. ${q.text||'<i style="color:var(--fg-3)">ยังไม่มีโจทย์</i>'}</div>
      ${imgBlock}
      ${body}
      <div class="pv-explain"><div class="pe-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z"/></svg>เฉลย${q.type==='sa'?'':' · ข้อ '+LETTERS[q.correct]}</div><p>${q.explain||(q.explainImg?'':'<i style="color:var(--fg-3)">ยังไม่มีคำอธิบาย</i>')}</p>${q.explainImg?'<div class="pv-img" style="margin-top:10px"><div class="dz-stripe"></div><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--fg-3);font-family:JetBrains Mono;font-size:12px">[ รูปเฉลย/วิธีทำ ]</div></div>':''}</div>`;
  }

  // mode toggle
  document.querySelectorAll('#mode button').forEach(b=>b.addEventListener('click', ()=>{
    document.querySelectorAll('#mode button').forEach(x=>x.setAttribute('aria-pressed','false'));
    b.setAttribute('aria-pressed','true'); mode=b.dataset.v;
    qe.classList.toggle('preview', mode==='preview');
    if(mode==='preview') renderPreview();
  }));

  // text/explain edits
  document.getElementById('q-text').addEventListener('input', e=>{ QS[sel].text=e.target.value; renderList(); markSave(); });
  document.getElementById('q-explain').addEventListener('input', e=>{ QS[sel].explain=e.target.value; markSave(); });
  // SA answer digit grid — xxxx.xx
  const agCells = [...document.querySelectorAll('.ag-cell')];
  const agEcho = document.getElementById('ans-echo');
  function agValue(){
    if(!agCells.some(c=>c.value)) return '';
    const d = agCells.map(c=>c.value || '0');
    return d[0]+d[1]+d[2]+d[3]+'.'+d[4]+d[5];
  }
  function setAnsGrid(v){
    const m = /^(\d{4})\.(\d{2})$/.exec(v || '');
    const digits = m ? (m[1]+m[2]).split('') : ['','','','','',''];
    agCells.forEach((c,i)=>{ c.value = digits[i] || ''; c.classList.toggle('filled', !!c.value); });
    agEcho.textContent = v || '—';
  }
  function agSync(){
    agCells.forEach(c=>c.classList.toggle('filled', !!c.value));
    const v = agValue();
    QS[sel].answer = v;
    agEcho.textContent = v || '—';
    renderList(); markSave();
  }
  agCells.forEach((c,i)=>{
    c.addEventListener('input', ()=>{
      c.value = c.value.replace(/[^0-9]/g,'').slice(-1);
      if(c.value && i < agCells.length-1) agCells[i+1].focus();
      agSync();
    });
    c.addEventListener('keydown', e=>{
      if(e.key==='Backspace' && !c.value && i>0){ agCells[i-1].focus(); agCells[i-1].value=''; agSync(); e.preventDefault(); }
      if(e.key==='ArrowLeft' && i>0) agCells[i-1].focus();
      if(e.key==='ArrowRight' && i<agCells.length-1) agCells[i+1].focus();
    });
  });
  document.querySelectorAll('#q-type button').forEach(b=>b.addEventListener('click', ()=>{
    QS[sel].type = b.dataset.v; renderEditor(); renderList(); markSave();
  }));
  document.getElementById('choice-img-toggle').addEventListener('change', e=>{
    const q=QS[sel];
    q.choiceImg = e.target.checked;
    if(q.choiceImg) q.choices = q.choices.map(()=>'' );
    renderEditor(); renderList(); markSave();
  });

  // add / dup / del question
  document.getElementById('add-q').addEventListener('click', ()=>{
    QS.push({text:'', img:false, type:'mc', choiceImg:false, answer:'', choices:['','','',''], correct:0, explain:''}); sel=QS.length-1; renderList(); renderEditor();
    rowsEl.lastElementChild.scrollIntoView?.({block:'nearest'});
  });
  document.getElementById('add-choice').addEventListener('click', ()=>{
    const q=QS[sel]; if(q.choices.length>=5) return; q.choices.push(''); renderEditor(); markSave();
  });
  document.getElementById('dup-q').addEventListener('click', ()=>{
    const c=JSON.parse(JSON.stringify(QS[sel])); QS.splice(sel+1,0,c); sel++; renderList(); renderEditor(); markSave();
  });
  document.getElementById('del-q').addEventListener('click', ()=>{
    if(QS.length<=1) return; QS.splice(sel,1); if(sel>=QS.length) sel=QS.length-1; renderList(); renderEditor(); markSave();
  });
  document.getElementById('prev-q').addEventListener('click', ()=>{ if(sel>0){ sel--; renderList(); renderEditor(); } });
  document.getElementById('next-q').addEventListener('click', ()=>{ if(sel<QS.length-1){ sel++; renderList(); renderEditor(); } });

  // autosave
  const pill=document.getElementById('autosave'); let saveT;
  function markSave(){
    clearTimeout(saveT); pill.classList.add('saving'); pill.innerHTML='<span class="d"></span>กำลังบันทึก...';
    saveT=setTimeout(()=>{ pill.classList.remove('saving'); const t=new Date(); pill.innerHTML='<span class="d"></span>บันทึกแล้ว · '+String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0'); }, 900);
  }

  // new exam mode
  const params=new URLSearchParams(location.search);
  if(!params.get('id')||params.get('id')==='new'){
    QS.length=0; QS.push({text:'', img:false, type:'mc', choiceImg:false, answer:'', choices:['','','',''], correct:0, explain:''});
    document.getElementById('page-title').innerHTML='สร้าง<span class="grad">ชุดข้อสอบใหม่</span>';
    document.getElementById('crumb-title').textContent='ชุดข้อสอบใหม่';
    document.getElementById('head-sub').textContent='เพิ่มคำถามทีละข้อ — เลือกข้อที่ถูกด้วยการกดวงกลม · บันทึกอัตโนมัติ';
    // create mode: start settings fields empty
    const exName = document.getElementById('ex-name');
    const exDesc = document.getElementById('ex-desc');
    if(exName){ exName.value=''; exName.placeholder='เช่น A-Level คณิต · ชุดเสมือนจริง #1'; }
    if(exDesc){ exDesc.value=''; exDesc.placeholder='อธิบายสั้นๆ ว่าชุดนี้ครอบคลุมอะไร — จะโชว์ในหน้าเตรียมสอบของนักเรียน'; }
  }

  renderList(); renderEditor();
})();
