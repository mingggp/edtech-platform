/* ==========================================================================
   Admin · shared sidebar generator (prevents sidebar drift)
   Set window.__ADMIN_ACTIVE = 'overview'|'payments'|'courses'|'exams'|
   'users'|'coupons'|'settings'|'reports'|'audit' before this loads.
   ========================================================================== */
(function(){
  const active = window.__ADMIN_ACTIVE || (function(){
    const f = (location.pathname.split('/').pop()||'').toLowerCase();
    if(f.includes('payment')) return 'payments';
    if(f.includes('course')) return 'courses';
    if(f.includes('exam')) return 'exams';
    if(f.includes('user')) return 'users';
    if(f.includes('coupon')) return 'coupons';
    if(f.includes('site')) return 'site';
    if(f.includes('setting')) return 'settings';
    if(f.includes('report')) return 'reports';
    if(f.includes('audit')) return 'audit';
    return 'overview';
  })();

  const I = {
    overview:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    payments:'<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/>',
    courses:'<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    exams:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13l2 2 4-4"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    coupons:'<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1-.6-1.4V4a2 2 0 0 1 2-2h7.6a2 2 0 0 1 1.4.6l6.8 6.8a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    site:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    reports:'<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
    audit:'<path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>'
  };
  const NAV = [
    { group:'ดำเนินงาน', items:[
      { id:'overview', label:'ภาพรวม', href:'Admin Overview.html' },
      { id:'payments', label:'การเงิน', href:'Admin Payments.html', ct:'47' },
      { id:'courses', label:'คอร์ส', href:'Admin Courses.html', ct:'6' },
      { id:'exams', label:'ข้อสอบ', href:'Admin Exams.html' },
      { id:'users', label:'นักเรียน', href:'Admin Users.html' },
      { id:'coupons', label:'คูปอง', href:'Admin Coupons.html' }
    ]},
    { group:'ระบบ', items:[
      { id:'site', label:'หน้าเว็บ & เมนู', href:'Admin Site.html' },
      { id:'settings', label:'ตั้งค่าเว็บ', href:'Admin Settings.html' },
      { id:'reports', label:'รายงาน', href:'Admin Reports.html' },
      { id:'audit', label:'Audit log', href:'Admin Audit.html' }
    ]}
  ];

  const item = it => `<a class="adm-item${it.id===active?' active':''}" href="${it.href}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${I[it.id]}</svg><span>${it.label}</span>${it.ct?`<span class="ct">${it.ct}</span>`:''}</a>`;
  const navHTML = NAV.map(g=>`<nav class="adm-nav"><div class="head">${g.group}</div>${g.items.map(item).join('')}</nav>`).join('');

  const sb = document.getElementById('adm-sb');
  if(sb) sb.innerHTML = `
    <button class="adm-sb-toggle" id="sb-toggle" aria-label="พับเมนู"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
    <a href="Admin Overview.html" class="adm-logo">
      <span class="mark" aria-hidden="true"><svg viewBox="0 0 120 120" fill="none"><path d="M40 50 Q40 38 50 38 Q60 38 60 50" stroke="#fff" stroke-width="9" stroke-linecap="round"/><path d="M68 50 Q68 38 78 38 Q88 38 88 50" stroke="#fff" stroke-width="9" stroke-linecap="round"/><path d="M34 72 Q60 100 94 72" stroke="#fff" stroke-width="10" stroke-linecap="round"/></svg></span>
      <span class="word">Ming Studio<small>หลังบ้าน</small></span>
    </a>
    ${navHTML}
    <div class="adm-sb-foot">
      <a class="adm-exit" href="Dashboard.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m12 16-4-4 4-4M8 12h12"/></svg><span>กลับหน้านักเรียน</span></a>
      <div class="adm-op"><div class="av">ห</div><div class="info"><b>หมิง</b><span>ติวเตอร์ · เจ้าของ</span></div></div>
    </div>`;
})();
