/* ==========================================================================
   Mingsmileyface · Admin shared behaviours
   theme · sidebar collapse · reveal · Tweaks (accent / density / view)
   Pages may define window.__onTweak(key, value) for page-specific tweaks.
   ========================================================================== */
(function(){
  const root = document.documentElement;

  /* ---- theme ---- */
  const bd = document.getElementById('btn-dark'), bl = document.getElementById('btn-light');
  function setTheme(t){ root.setAttribute('data-theme', t === 'classic-dark' ? 'dark' : t === 'classic-light' ? 'light' : t); if(bd) bd.setAttribute('aria-pressed', (t==='petronas'||t==='classic-dark'||t==='dark')); if(bl) bl.setAttribute('aria-pressed', (t==='petronas-light'||t==='classic-light'||t==='light')); try{ localStorage.setItem('ming-theme', t); }catch(e){} }
  if(bd) bd.addEventListener('click', ()=>setTheme('petronas'));
  if(bl) bl.addEventListener('click', ()=>setTheme('petronas-light'));
  try{ const s = localStorage.getItem('ming-theme'); setTheme(s === 'dark' ? 'petronas' : s === 'light' ? 'petronas-light' : (s || 'petronas-light')); }catch(e){}

  /* ---- sidebar collapse ---- */
  const tog = document.getElementById('sb-toggle');
  if(tog) tog.addEventListener('click', ()=>document.getElementById('adm').classList.toggle('collapsed'));

  /* ---- reveal handled by CSS animation (admIn) — no JS needed ---- */

  /* ---- command palette stub (focus feedback only) ---- */
  const cmd = document.getElementById('cmdk');
  function openCmd(){ if(cmd){ cmd.style.borderColor='var(--brand-magenta)'; setTimeout(()=>cmd.style.borderColor='', 400); } }
  if(cmd) cmd.addEventListener('click', openCmd);
  document.addEventListener('keydown', e=>{ if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); openCmd(); } });

  /* ---- Tweaks ---- */
  const TWEAKS = window.__TWEAKS_DEFAULTS || { accent:'signature', density:'comfortable', view:'data', zebra:'on' };
  function applyTweaks(){
    root.setAttribute('data-accent', TWEAKS.accent);
    root.setAttribute('data-density', TWEAKS.density);
    if('zebra' in TWEAKS) root.setAttribute('data-zebra', TWEAKS.zebra);
    document.querySelectorAll('[data-tweak]').forEach(grp=>{
      const key = grp.dataset.tweak;
      grp.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.v === String(TWEAKS[key]))));
    });
    Object.keys(TWEAKS).forEach(k=>{ if(typeof window.__onTweak==='function') window.__onTweak(k, TWEAKS[k]); });
  }
  function setTweak(k,v){ TWEAKS[k]=v; try{ window.parent.postMessage({type:'__edit_mode_set_keys', edits:{[k]:v}}, '*'); }catch(e){}
    root.setAttribute('data-accent', TWEAKS.accent); root.setAttribute('data-density', TWEAKS.density);
    if('zebra' in TWEAKS) root.setAttribute('data-zebra', TWEAKS.zebra);
    document.querySelectorAll('[data-tweak="'+k+'"] button').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.v===String(v))));
    if(typeof window.__onTweak==='function') window.__onTweak(k, v);
  }
  document.querySelectorAll('[data-tweak]').forEach(grp=>grp.querySelectorAll('button').forEach(b=>b.addEventListener('click', ()=>setTweak(grp.dataset.tweak, b.dataset.v))));

  const panel = document.getElementById('tweaks');
  if(panel){
    window.addEventListener('message', e=>{ const t=e?.data?.type; if(t==='__activate_edit_mode') panel.classList.add('open'); else if(t==='__deactivate_edit_mode') panel.classList.remove('open'); });
    try{ window.parent.postMessage({type:'__edit_mode_available'}, '*'); }catch(e){}
    const cl = document.getElementById('tweaks-close');
    if(cl) cl.addEventListener('click', ()=>{ panel.classList.remove('open'); try{ window.parent.postMessage({type:'__edit_mode_dismissed'}, '*'); }catch(e){} });
    const head = document.getElementById('tweaks-drag');
    if(head){ let sx,sy,ox,oy,drag=false;
      head.addEventListener('mousedown', e=>{ if(e.target.closest('.x')) return; drag=true; sx=e.clientX; sy=e.clientY; const r=panel.getBoundingClientRect(); ox=r.left; oy=r.top; panel.style.right='auto'; e.preventDefault(); });
      window.addEventListener('mousemove', e=>{ if(!drag) return; panel.style.left=(ox+e.clientX-sx)+'px'; panel.style.top=(oy+e.clientY-sy)+'px'; });
      window.addEventListener('mouseup', ()=>drag=false);
    }
  }

  applyTweaks();
})();
