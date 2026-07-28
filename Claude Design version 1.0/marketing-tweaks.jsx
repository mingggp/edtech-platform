/* Mingsmileyface · marketing-tweaks.jsx
   Mounts the shared Tweaks panel for marketing pages. Currently a single
   control: accent swap (signature / cool / warm) which remaps --grad-signature
   site-wide via <html data-accent>. Theme (dark/light) lives in the topbar.
   Requires React + Babel + tweaks-panel.jsx to be loaded first. */

const MK_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "signature",
  "courseCard": "row",
  "courseCols": "3",
  "bundleAlign": "center"
}/*EDITMODE-END*/;

const MK_ACCENT_OPTIONS = [
  { value: 'signature', label: 'Signature' },
  { value: 'cool', label: 'Cool' },
  { value: 'warm', label: 'Warm' }
];

const MK_CARD_OPTIONS = [
  { value: 'row', label: 'แถวแนวนอน' },
  { value: 'stack', label: 'ปกบน' }
];

const MK_COL_OPTIONS = [
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' }
];

const MK_BUNDLE_OPTIONS = [
  { value: 'center', label: 'กึ่งกลาง' },
  { value: 'left', label: 'ชิดซ้าย' }
];

function applyBundleAlign(v) {
  if (v === 'left') document.documentElement.setAttribute('data-bundle-align', 'left');
  else document.documentElement.removeAttribute('data-bundle-align');
  try { localStorage.setItem('ming-bundle-align', v || 'center'); } catch (e) {}
}

function applyCourseCols(v) {
  document.documentElement.setAttribute('data-course-cols', v || '3');
  try { localStorage.setItem('ming-course-cols', v || '3'); } catch (e) {}
}

function applyCourseCard(v) {
  if (v && v !== 'row') document.documentElement.setAttribute('data-course-card', v);
  else document.documentElement.removeAttribute('data-course-card');
  try { localStorage.setItem('ming-course-card', v || 'row'); } catch (e) {}
}

function applyAccent(a) {
  if (a && a !== 'signature') document.documentElement.setAttribute('data-accent', a);
  else document.documentElement.removeAttribute('data-accent');
  try { localStorage.setItem('ming-accent', a || 'signature'); } catch (e) {}
}

function MarketingTweaks() {
  const [t, setTweak] = useTweaks(MK_TWEAK_DEFAULTS);
  const onCourses = typeof document !== 'undefined' && !!document.getElementById('course-grid');

  // Restore persisted accent on mount (overrides the EDITMODE default if the
  // user changed it on another page this session), then keep DOM in sync.
  React.useEffect(() => {
    let initial = t.accent;
    try {
      const saved = localStorage.getItem('ming-accent');
      if (saved && saved !== t.accent) { initial = saved; setTweak('accent', saved); }
    } catch (e) {}
    applyAccent(initial);
    // course-card layout
    let card = t.courseCard;
    try {
      const sc = localStorage.getItem('ming-course-card');
      if (sc && sc !== t.courseCard) { card = sc; setTweak('courseCard', sc); }
    } catch (e) {}
    applyCourseCard(card);
    // course columns
    let cols = t.courseCols;
    try {
      const cc = localStorage.getItem('ming-course-cols');
      if (cc && cc !== t.courseCols) { cols = cc; setTweak('courseCols', cc); }
    } catch (e) {}
    applyCourseCols(cols);
    // bundle alignment
    let ba = t.bundleAlign;
    try {
      const sa = localStorage.getItem('ming-bundle-align');
      if (sa && sa !== t.bundleAlign) { ba = sa; setTweak('bundleAlign', sa); }
    } catch (e) {}
    applyBundleAlign(ba);
  }, []);
  React.useEffect(() => { applyAccent(t.accent); }, [t.accent]);
  React.useEffect(() => { applyCourseCard(t.courseCard); }, [t.courseCard]);
  React.useEffect(() => { applyCourseCols(t.courseCols); }, [t.courseCols]);
  React.useEffect(() => { applyBundleAlign(t.bundleAlign); }, [t.bundleAlign]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Brand accent" />
      <TweakRadio label="Gradient" value={t.accent} options={MK_ACCENT_OPTIONS}
                  onChange={(v) => setTweak('accent', v)} />
      <div style={{ fontSize: '10.5px', lineHeight: 1.45, color: 'rgba(41,38,27,.5)', paddingTop: '2px' }}>
        Recolors every gradient — logo, buttons, headings, score numbers. Dark / light stays in the top bar.
      </div>
      {onCourses && <TweakSection label="Course card" />}
      {onCourses && <TweakRadio label="เลย์เอาต์" value={t.courseCard} options={MK_CARD_OPTIONS}
                  onChange={(v) => setTweak('courseCard', v)} />}
      {onCourses && t.courseCard === 'stack' && <TweakRadio label="คอลัมน์" value={t.courseCols} options={MK_COL_OPTIONS}
                  onChange={(v) => setTweak('courseCols', v)} />}
      {onCourses && <div style={{ fontSize: '10.5px', lineHeight: 1.45, color: 'rgba(41,38,27,.5)', paddingTop: '2px' }}>
        แถวแนวนอน = ปกอยู่ซ้าย · ปกบน = ปกเต็มความกว้างด้านบน รายละเอียดอยู่ล่าง (ปรับจำนวนคอลัมน์ได้)
      </div>}
      {onCourses && <TweakSection label="แพ็กเกจเหมา" />}
      {onCourses && <TweakRadio label="จัดวาง" value={t.bundleAlign} options={MK_BUNDLE_OPTIONS}
                  onChange={(v) => setTweak('bundleAlign', v)} />}
      {onCourses && <div style={{ fontSize: '10.5px', lineHeight: 1.45, color: 'rgba(41,38,27,.5)', paddingTop: '2px' }}>
        แพ็กเกจจัดเป็น 3 แถว — ระดับชั้น (3) · วิชา (4) · เหมารวม (1) — จัดกึ่งกลางหรือชิดซ้ายได้
      </div>}
    </TweaksPanel>
  );
}

(function () {
  const mount = document.createElement('div');
  mount.id = 'mk-tweaks-root';
  document.body.appendChild(mount);
  ReactDOM.createRoot(mount).render(<MarketingTweaks />);
})();
