/* ==========================================================================
   Admin · Overview revenue chart (smart, interactive)
   metric (รายได้/คำสั่งซื้อ/นักเรียนใหม่) · range (7/30/ปี) · area|bar ·
   compare-previous-period ghost · hover crosshair+tooltip · peak marker
   ========================================================================== */
(function(){
  const chart = document.getElementById('chart');
  const chartX = document.getElementById('chart-x');
  const tip = document.getElementById('chart-tip');
  if(!chart) return;

  const WD = ['จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์','อาทิตย์'];
  const DATA = {
    '7': {
      x:['จ','อ','พ','พฤ','ศ','ส','อา'],
      revenue:[9200,11800,8400,13600,10200,15800,15400],
      orders:[5,7,4,8,6,9,8],
      students:[8,11,7,13,9,15,14]
    },
    '30': {
      x:['1','','','','5','','','','','10','','','','','15','','','','','20','','','','','25','','','','','30'],
      revenue:[6300,8100,5400,9900,7200,11700,10800,9000,12600,10800,14400,13500,11700,16200,15300,13500,10800,17100,14400,18000,16200,19800,17100,15300,21600,18900,23400,20700,25200,27000],
      orders:[4,5,3,6,5,7,6,5,7,6,8,7,6,9,8,7,6,9,8,10,9,11,9,8,12,10,13,11,14,15],
      students:[6,7,5,9,7,10,9,7,10,9,12,10,9,13,12,10,9,13,12,15,13,16,13,12,18,15,19,16,21,22]
    },
    'year': {
      x:['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.'],
      revenue:[42000,38000,51000,47000,62000,58000,71000,68000,79000,74000,84200],
      orders:[24,21,29,27,35,33,40,38,44,41,47],
      students:[210,180,240,225,290,270,330,310,360,340,390]
    }
  };
  const METRICS = {
    revenue:  { label:'รายได้',       color:'var(--brand-violet)',  full:v=>'฿'+v.toLocaleString(), short:v=> v>=1000?'฿'+(v/1000).toFixed(v%1000?1:0)+'k':'฿'+v, total:v=>'฿'+v.toLocaleString() },
    orders:   { label:'คำสั่งซื้อ',    color:'var(--brand-magenta)', full:v=>v.toLocaleString()+' รายการ', short:v=>''+v, total:v=>v.toLocaleString()+' รายการ' },
    students: { label:'นักเรียนใหม่',  color:'var(--brand-cyan)',    full:v=>v.toLocaleString()+' คน',  short:v=>''+v, total:v=>v.toLocaleString()+' คน' }
  };
  const RANGE_LABEL = { '7':'7 วันล่าสุด', '30':'30 วันล่าสุด', 'year':'ปีนี้ (รายเดือน)' };

  let metric='revenue', range='7', type='area', compare=false, geom=null;

  const prevOf = arr => arr.map((v,i)=> Math.round(v*(0.86 + 0.09*Math.sin(i*1.2+0.5))));
  function niceMax(v){ v*=1.08; const p=Math.pow(10,Math.floor(Math.log10(v))); const f=v/p; let nf; if(f<=1)nf=1; else if(f<=2)nf=2; else if(f<=2.5)nf=2.5; else if(f<=5)nf=5; else nf=10; return nf*p; }
  function smooth(pts){ if(pts.length<2) return pts.length?`M${pts[0][0]} ${pts[0][1]}`:''; let d=`M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`; const t=0.16; for(let i=0;i<pts.length-1;i++){ const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2; const c1x=p1[0]+(p2[0]-p0[0])*t,c1y=p1[1]+(p2[1]-p0[1])*t,c2x=p2[0]-(p3[0]-p1[0])*t,c2y=p2[1]-(p3[1]-p1[1])*t; d+=`C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`; } return d; }

  function render(){
    const W = Math.max(320, Math.round(chart.clientWidth||760)), H=260;
    chart.setAttribute('viewBox',`0 0 ${W} ${H}`);
    const ML=48, MR=16, MT=18, MB=6, pW=W-ML-MR, pH=H-MT-MB, baseY=MT+pH;
    const m=METRICS[metric], d=DATA[range], arr=d[metric], prev=prevOf(arr), n=arr.length;
    const maxY = niceMax(compare ? Math.max(Math.max(...arr),Math.max(...prev)) : Math.max(...arr));
    const xAt = i => n>1 ? ML+(i/(n-1))*pW : ML+pW/2;
    const yAt = v => MT+pH-(v/maxY)*pH;
    let s='';
    for(let g=0; g<=4; g++){ const y=MT+pH-(g/4)*pH, val=Math.round(maxY*g/4);
      s+=`<line x1="${ML}" y1="${y.toFixed(1)}" x2="${W-MR}" y2="${y.toFixed(1)}" stroke="var(--line-soft)" stroke-width="1"${g?' stroke-dasharray="2 5"':''}/>`;
      s+=`<text x="${ML-9}" y="${(y+3.5).toFixed(1)}" text-anchor="end" fill="var(--fg-3)" font-size="10.5" font-family="JetBrains Mono">${m.short(val)}</text>`;
    }
    if(compare){ const g=prev.map((v,i)=>[xAt(i),yAt(v)]); s+=`<path d="${smooth(g)}" fill="none" stroke="var(--fg-3)" stroke-width="1.6" stroke-dasharray="4 4" opacity="0.55"/>`; }
    const pts=arr.map((v,i)=>[xAt(i),yAt(v)]);
    if(type==='area'){
      const line=smooth(pts);
      s+=`<path d="${line} L${xAt(n-1).toFixed(1)} ${baseY} L${ML} ${baseY} Z" fill="url(#cg)"/>`;
      s+=`<path d="${line}" fill="none" stroke="${m.color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>`;
    } else {
      const bw=Math.max(4, Math.min(34,(pW/n)*0.6));
      arr.forEach((v,i)=>{ const x=xAt(i),y=yAt(v),h=Math.max(0,baseY-y); s+=`<rect x="${(x-bw/2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(5,bw/2).toFixed(1)}" fill="url(#cg)" stroke="${m.color}" stroke-width="1.4"/>`; });
    }
    const peak=arr.indexOf(Math.max(...arr));
    s+=`<circle cx="${xAt(peak).toFixed(1)}" cy="${yAt(arr[peak]).toFixed(1)}" r="4.5" fill="${m.color}" stroke="var(--bg-1)" stroke-width="2.5" filter="url(#glow)"/>`;
    s+=`<circle class="peak-pulse" cx="${xAt(peak).toFixed(1)}" cy="${yAt(arr[peak]).toFixed(1)}" r="4.5" fill="none" stroke="${m.color}" stroke-width="2"/>`;
    s+=`<g id="ov" style="opacity:0"><line id="ov-l" x1="0" x2="0" y1="${MT}" y2="${baseY}" stroke="${m.color}" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.55"/><circle id="ov-d" r="5.5" fill="${m.color}" stroke="var(--bg-1)" stroke-width="2.5" filter="url(#glow)"/></g>`;
    chart.innerHTML=`<defs>
      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${m.color}" stop-opacity="${type==='area'?0.5:0.55}"/><stop offset="55%" stop-color="${m.color}" stop-opacity="${type==='area'?0.14:0.2}"/><stop offset="100%" stop-color="${m.color}" stop-opacity="0.015"/></linearGradient>
      <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>`+s;
    chartX.style.padding=`9px ${MR}px 0 ${ML}px`;
    chartX.innerHTML=d.x.map(l=>`<span>${l}</span>`).join('');

    // floating peak callout (mirrors the reference's "Max = 68" pill)
    const peakBadge = document.getElementById('chart-peak');
    if (peakBadge) {
      const px = (xAt(peak)/W)*100, py = (yAt(arr[peak])/H)*100;
      peakBadge.style.left = px + '%'; peakBadge.style.top = py + '%';
      peakBadge.style.setProperty('--pc', m.color);
      peakBadge.innerHTML = 'สูงสุด <b>' + m.short(arr[peak]) + '</b>';
    }

    geom={ML,MT,pW,pH,n,W,H,baseY,arr,prev, xAt, yAt};

    // summary + stats
    const sum=arr.reduce((a,b)=>a+b,0), prevSum=prev.reduce((a,b)=>a+b,0), mx=Math.max(...arr), avg=Math.round(sum/n);
    const delta = prevSum ? Math.round((sum-prevSum)/prevSum*100) : 0;
    document.getElementById('ch-label').textContent = m.label+' · '+RANGE_LABEL[range];
    document.getElementById('ch-total').textContent = m.total(sum);
    const dEl=document.getElementById('ch-delta'); dEl.textContent=(delta>=0?'↑ ':'↓ ')+Math.abs(delta)+'%'; dEl.className='ch-delta '+(delta>=0?'up':'down');
    document.getElementById('ch-cmp-note').textContent = 'เทียบช่วงก่อนหน้า';
    document.getElementById('st-sum').textContent = m.total(sum);
    document.getElementById('st-avg').textContent = m.total(avg);
    document.getElementById('st-max').textContent = m.total(mx);
    const avgLbl=document.querySelectorAll('.chart-stats span')[1]; if(avgLbl) avgLbl.textContent = 'เฉลี่ย/'+(range==='year'?'เดือน':'วัน');
  }

  function tipLabel(idx){ if(range==='7') return WD[idx]; if(range==='30') return 'วันที่ '+(idx+1); return DATA.year.x[idx]; }

  chart.addEventListener('mousemove', e=>{
    if(!geom) return;
    const r=chart.getBoundingClientRect();
    const mx=(e.clientX-r.left)/r.width*geom.W;
    let idx=Math.round((mx-geom.ML)/(geom.pW/Math.max(1,geom.n-1)));
    idx=Math.max(0,Math.min(geom.n-1,idx));
    const x=geom.xAt(idx), y=geom.yAt(geom.arr[idx]);
    const ov=chart.querySelector('#ov'); if(ov){ ov.style.opacity='1'; const l=chart.querySelector('#ov-l'); l.setAttribute('x1',x); l.setAttribute('x2',x); const dd=chart.querySelector('#ov-d'); dd.setAttribute('cx',x); dd.setAttribute('cy',y); }
    const m=METRICS[metric];
    let html=`<div class="tt-x">${tipLabel(idx)}</div><div class="tt-v"><span class="sw" style="background:${m.color}"></span>${m.full(geom.arr[idx])}</div>`;
    if(compare){ const pv=geom.prev[idx]; const dl=pv?Math.round((geom.arr[idx]-pv)/pv*100):0; html+=`<div class="tt-cmp">ช่วงก่อน ${m.full(pv)} · <b style="color:${dl>=0?'var(--success)':'var(--danger)'}">${dl>=0?'+':''}${dl}%</b></div>`; }
    tip.innerHTML=html;
    const px=(x/geom.W)*r.width, py=(y/geom.H)*r.height;
    tip.style.left=px+'px'; tip.style.top=(py-14)+'px';
    tip.classList.toggle('flip-left', px > r.width-120);
    tip.classList.add('show');
  });
  chart.addEventListener('mouseleave', ()=>{ tip.classList.remove('show'); const ov=chart.querySelector('#ov'); if(ov) ov.style.opacity='0'; });

  function bindSeg(id, cb){ document.querySelectorAll('#'+id+' button').forEach(b=>b.addEventListener('click', ()=>{ document.querySelectorAll('#'+id+' button').forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true'); cb(b.dataset.v); render(); })); }
  bindSeg('ch-metric', v=>metric=v);
  bindSeg('ch-range',  v=>range=v);
  bindSeg('ch-type',   v=>type=v);
  const cmp=document.getElementById('ch-cmp');
  cmp.addEventListener('click', ()=>{ compare=!compare; cmp.setAttribute('aria-pressed', String(compare)); render(); });

  let rt; window.addEventListener('resize', ()=>{ clearTimeout(rt); rt=setTimeout(render, 120); });
  render();
  requestAnimationFrame(render);
})();
