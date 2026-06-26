import { useState, useEffect, useRef } from "react";

// ── PALETTE ──────────────────────────────────────────────────────────────────
const C = {
  cream:    "#F5F0E8",
  creamDark:"#EDE7DA",
  sage:     "#688368",
  sageDark: "#405E40",
  umber:    "#422E1E",
  umbLight: "#66503F",
  terra:    "#BF6E3E",
  blush:    "#E8D5C4",
  white:    "#FDFAF6",
};

// ── GLOBAL STYLES ─────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'DM Sans', sans-serif;
      background: ${C.cream};
      color: ${C.umber};
      -webkit-font-smoothing: antialiased;
    }

    .serif { font-family: 'Playfair Display', Georgia, serif; }

    a { color: inherit; text-decoration: none; }

    button {
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      border: none;
      outline: none;
    }
    button:focus-visible { outline: 2px solid ${C.terra}; outline-offset: 3px; }

    .btn-primary {
      background: ${C.terra};
      color: #fff;
      padding: 14px 28px;
      border-radius: 40px;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: .3px;
      transition: background .25s, transform .2s;
      display: inline-block;
    }
    .btn-primary:hover { background: #a85c30; transform: translateY(-1px); }

    .btn-outline {
      background: transparent;
      color: ${C.umber};
      padding: 13px 27px;
      border-radius: 40px;
      border: 1.5px solid ${C.umber};
      font-size: 15px;
      font-weight: 500;
      letter-spacing: .3px;
      transition: background .25s, color .25s, transform .2s;
      display: inline-block;
    }
    .btn-outline:hover { background: ${C.umber}; color: #fff; transform: translateY(-1px); }

    .btn-sage {
      background: ${C.sage};
      color: #fff;
      padding: 14px 28px;
      border-radius: 40px;
      font-size: 15px;
      font-weight: 600;
      transition: background .25s, transform .2s;
      display: inline-block;
    }
    .btn-sage:hover { background: ${C.sageDark}; transform: translateY(-1px); }

    .btn-nav {
      background: ${C.terra};
      color: #fff;
      padding: 10px 22px;
      border-radius: 40px;
      font-size: 14px;
      font-weight: 600;
      transition: background .2s;
    }
    .btn-nav:hover { background: #a85c30; }

    section { padding: 80px 0; }

    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      padding: 5px 14px;
      border-radius: 20px;
      background: ${C.blush};
      color: ${C.umbLight};
    }

    .badge-sage {
      background: rgba(104,131,104,.12);
      color: ${C.sageDark};
    }
    .badge-terra {
      background: rgba(191,110,62,.12);
      color: ${C.terra};
    }

    .card {
      background: ${C.white};
      border-radius: 20px;
      padding: 32px;
      border: 1px solid rgba(66,46,30,.08);
      transition: box-shadow .25s, transform .25s;
    }
    .card:hover {
      box-shadow: 0 8px 32px rgba(66,46,30,.1);
      transform: translateY(-3px);
    }

    h1, h2, h3, h4 { font-family: 'Playfair Display', serif; color: ${C.umber}; }

    .terra { color: ${C.terra}; }
    .sage  { color: ${C.sage}; }

    .topo-bg {
      position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0;
    }

    /* Fade-in on scroll */
    .fade-in {
      opacity: 0;
      transform: translateY(24px);
      transition: opacity .6s ease, transform .6s ease;
    }
    .fade-in.visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* Mobile nav */
    .nav-links-mobile {
      display: none;
      flex-direction: column;
      gap: 20px;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: ${C.white};
      z-index: 200;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .nav-links-mobile.open { display: flex; }

    @media (max-width: 768px) {
      section { padding: 56px 0; }
      h1 { font-size: clamp(32px, 8vw, 56px) !important; }
    }

    /* Accordion */
    .acc-body {
      max-height: 0;
      overflow: hidden;
      transition: max-height .4s ease, padding .3s ease;
    }
    .acc-body.open { max-height: 400px; }

    /* Product card badge positions */
    .prod-badge {
      position: absolute;
      top: -1px; left: 24px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.4px;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 0 0 10px 10px;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: ${C.cream}; }
    ::-webkit-scrollbar-thumb { background: ${C.blush}; border-radius: 3px; }
  `}</style>
);

// ── SVG COMPONENTS ────────────────────────────────────────────────────────────

// Topographic heart — the HeartMapping signature icon
const HeartTopo = ({ size = 280, animate = false }) => (
  <svg
    width={size} height={size}
    viewBox="0 0 280 260"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="HeartMapping – inimă topografică"
    role="img"
  >
    <defs>
      <clipPath id="heart-clip">
        <path d="M140 230 C140 230 20 155 20 90 C20 55 47 30 80 30 C100 30 118 40 130 56 C135 63 140 72 140 72 C140 72 145 63 150 56 C162 40 180 30 200 30 C233 30 260 55 260 90 C260 155 140 230 140 230Z"/>
      </clipPath>
      <linearGradient id="sage-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={C.sage} stopOpacity=".25"/>
        <stop offset="100%" stopColor={C.sageDark} stopOpacity=".1"/>
      </linearGradient>
    </defs>

    {/* Background fill */}
    <path
      d="M140 230 C140 230 20 155 20 90 C20 55 47 30 80 30 C100 30 118 40 130 56 C135 63 140 72 140 72 C140 72 145 63 150 56 C162 40 180 30 200 30 C233 30 260 55 260 90 C260 155 140 230 140 230Z"
      fill="url(#sage-grad)"
    />

    {/* Topographic contour lines clipped to heart */}
    <g clipPath="url(#heart-clip)" opacity=".85">
      {/* Outer contours - sage */}
      {[0,8,16,24,32].map((d,i) => (
        <path
          key={`s${i}`}
          d={`M${140-d} ${230-d*0.3} C${140-d} ${230-d*0.3} ${20+d} ${155-d*0.5} ${20+d} ${90+d*0.4} C${20+d} ${55+d*0.4} ${47+d*0.3} ${30+d*0.4} ${80+d*0.5} ${30+d*0.4} C${100+d*0.3} ${30+d*0.4} ${118+d*0.2} ${40+d*0.3} ${130+d*0.15} ${56+d*0.2} C${135+d*0.07} ${63+d*0.15} ${140} ${72+d*0.1} ${140} ${72+d*0.1} C${140} ${72+d*0.1} ${145-d*0.07} ${63+d*0.15} ${150-d*0.15} ${56+d*0.2} C${162-d*0.2} ${40+d*0.3} ${180-d*0.3} ${30+d*0.4} ${200-d*0.5} ${30+d*0.4} C${233-d*0.3} ${30+d*0.4} ${260-d} ${55+d*0.4} ${260-d} ${90+d*0.4} C${260-d} ${155-d*0.5} ${140+d} ${230-d*0.3} ${140} ${230-d*0.3}Z`}
          stroke={i % 3 === 0 ? C.terra : C.sage}
          strokeWidth={i === 0 ? 1.8 : 1}
          fill="none"
          opacity={0.4 + i * 0.12}
          style={animate ? { strokeDasharray: 1200, strokeDashoffset: 1200, animation: `draw ${1.2 + i*0.3}s ease forwards ${i*0.15}s` } : {}}
        />
      ))}
      {/* Inner contours - terra */}
      {[40,50,60,70].map((d,i) => (
        <path
          key={`t${i}`}
          d={`M${140-d*0.3} ${230-d*0.4} C${140-d*0.3} ${230-d*0.4} ${20+d} ${155-d*0.6} ${20+d} ${90+d*0.5} C${20+d} ${55+d*0.5} ${47+d*0.4} ${30+d*0.5} ${80+d*0.6} ${30+d*0.5} C${100+d*0.4} ${30+d*0.5} ${118+d*0.2} ${40+d*0.4} ${130+d*0.1} ${56+d*0.25} C${135+d*0.05} ${63+d*0.2} ${140} ${72+d*0.15} ${140} ${72+d*0.15} C${140} ${72+d*0.15} ${145-d*0.05} ${63+d*0.2} ${150-d*0.1} ${56+d*0.25} C${162-d*0.2} ${40+d*0.4} ${180-d*0.4} ${30+d*0.5} ${200-d*0.6} ${30+d*0.5} C${233-d*0.4} ${30+d*0.5} ${260-d} ${55+d*0.5} ${260-d} ${90+d*0.5} C${260-d} ${155-d*0.6} ${140+d*0.3} ${230-d*0.4} ${140} ${230-d*0.4}Z`}
          stroke={i % 2 === 0 ? C.terra : C.sage}
          strokeWidth={.9}
          fill="none"
          opacity={0.3 + i * 0.1}
        />
      ))}
    </g>

    {/* Outline */}
    <path
      d="M140 230 C140 230 20 155 20 90 C20 55 47 30 80 30 C100 30 118 40 130 56 C135 63 140 72 140 72 C140 72 145 63 150 56 C162 40 180 30 200 30 C233 30 260 55 260 90 C260 155 140 230 140 230Z"
      stroke={C.sageDark}
      strokeWidth="2"
      fill="none"
    />

    {animate && (
      <style>{`
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    )}
  </svg>
);

// Topographic background watermark
const TopoBg = ({ color = C.sageDark, opacity = .04 }) => (
  <svg
    style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
  >
    {[0,40,80,120,160,200,240,280,320].map((y,i) => (
      <path
        key={y}
        d={`M-100 ${y} Q200 ${y-30+i*8} 500 ${y+15} T1200 ${y-10}`}
        stroke={color}
        strokeWidth="1"
        fill="none"
        opacity={opacity}
      />
    ))}
    {[360,400,440,480,520,560,600].map((y,i) => (
      <path
        key={y}
        d={`M-100 ${y} Q300 ${y+20-i*5} 700 ${y-10} T1400 ${y+8}`}
        stroke={color}
        strokeWidth=".8"
        fill="none"
        opacity={opacity * .7}
      />
    ))}
  </svg>
);

// Person placeholder avatar
const AvatarPlaceholder = ({ size = 320 }) => (
  <svg
    width={size} height={size}
    viewBox="0 0 320 320"
    xmlns="http://www.w3.org/2000/svg"
    style={{ borderRadius: 20 }}
    aria-label="Fotografie Vasi Ciolpan"
    role="img"
  >
    <rect width="320" height="320" fill={C.blush} rx="20"/>
    <rect width="320" height="320" fill="none" rx="20" stroke={C.sage} strokeWidth="1.5" strokeOpacity=".3"/>
    {/* Topo lines as background */}
    {[60,90,120,150,180,210,240].map((y,i) => (
      <path key={y}
        d={`M0 ${y} Q80 ${y-20+i*4} 160 ${y+10} T320 ${y-5}`}
        stroke={C.sage} strokeWidth=".8" fill="none" opacity=".15"
      />
    ))}
    {/* Silhouette */}
    <ellipse cx="160" cy="120" rx="52" ry="56" fill={C.sage} opacity=".25"/>
    <ellipse cx="160" cy="120" rx="36" ry="40" fill={C.umbLight} opacity=".3"/>
    <path d="M72 260 Q90 200 160 192 Q230 200 248 260" fill={C.sage} opacity=".22"/>
    <path d="M80 268 Q100 210 160 202 Q220 210 240 268" fill={C.umbLight} opacity=".25"/>
    {/* Decorative heart */}
    <g transform="translate(148,96) scale(.28)">
      <path
        d="M40 65 C40 65 6 46 6 27 C6 16 14 9 24 9 C30 9 35 12 39 17 C40 19 41 21 41 21 C41 21 42 19 43 17 C47 12 52 9 58 9 C68 9 76 16 76 27 C76 46 42 65 41 65Z"
        fill={C.terra}
        opacity=".6"
      />
    </g>
    {/* Label */}
    <text x="160" y="290" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="12" fill={C.umbLight} opacity=".6">
      Vasi Ciolpan
    </text>
    <text x="160" y="306" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="10" fill={C.sage} opacity=".6">
      Coach Relațional
    </text>
  </svg>
);

// ── SCROLL OBSERVER ───────────────────────────────────────────────────────────
const useFadeIn = () => {
  useEffect(() => {
    const els = document.querySelectorAll('.fade-in');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
    }, { threshold: .12 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  });
};

// ── NAVIGATION ────────────────────────────────────────────────────────────────
const Nav = ({ page, setPage }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const links = ['Acasă','Despre','HeartMapping','Oferte','Contact'];
  const pageKeys = ['home','about','heartmapping','oferte','contact'];

  const nav = (p) => { setPage(p); setOpen(false); window.scrollTo(0,0); };

  return (
    <>
      <header style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background: scrolled ? 'rgba(253,250,246,.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid rgba(66,46,30,.08)` : 'none',
        transition: 'all .3s',
      }}>
        <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:72 }}>
          {/* Logo */}
          <button onClick={() => nav('home')} style={{ background:'none', display:'flex', flexDirection:'column', alignItems:'flex-start', lineHeight:1 }}>
            <span className="serif" style={{ fontSize:22, fontWeight:700, color:C.umber, letterSpacing:'-.3px' }}>Vasi Ciolpan</span>
            <span style={{ fontSize:9, fontWeight:600, letterSpacing:'2.5px', color:C.sage, textTransform:'uppercase', marginTop:1 }}>Coach Relațional</span>
          </button>

          {/* Desktop links */}
          <nav aria-label="Navigație principală" style={{ display:'flex', alignItems:'center', gap:32, '@media(max-width:768px)':{display:'none'} }}>
            <div style={{ display:'flex', gap:28 }} className="desktop-nav">
              {links.map((l,i) => (
                <button key={l} onClick={() => nav(pageKeys[i])}
                  style={{
                    background:'none', fontSize:14, fontWeight:500,
                    color: page === pageKeys[i] ? C.terra : C.umbLight,
                    borderBottom: page === pageKeys[i] ? `1.5px solid ${C.terra}` : '1.5px solid transparent',
                    paddingBottom: 2, transition:'color .2s',
                  }}>
                  {l}
                </button>
              ))}
            </div>
            <button className="btn-nav" onClick={() => nav('heartmapping')}>Începe acum</button>
          </nav>

          {/* Hamburger */}
          <button
            onClick={() => setOpen(o=>!o)}
            aria-label={open ? 'Închide meniu' : 'Deschide meniu'}
            style={{ background:'none', display:'none' }}
            className="hamburger"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.umber} strokeWidth="2">
              {open
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              }
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile nav overlay */}
      <div className={`nav-links-mobile ${open ? 'open' : ''}`}>
        <button onClick={() => setOpen(false)} aria-label="Închide meniu"
          style={{ position:'absolute', top:24, right:24, background:'none' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.umber} strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        {links.map((l,i) => (
          <button key={l} onClick={() => nav(pageKeys[i])}
            style={{ background:'none', fontSize:22, fontWeight:600, fontFamily:'Playfair Display,serif', color: page===pageKeys[i] ? C.terra : C.umber }}>
            {l}
          </button>
        ))}
        <button className="btn-nav" style={{ marginTop:12 }} onClick={() => nav('heartmapping')}>Începe acum</button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
          .btn-nav { display: none; }
        }
      `}</style>
    </>
  );
};

// ── FOOTER ────────────────────────────────────────────────────────────────────
const Footer = ({ setPage }) => {
  const nav = (p) => { setPage(p); window.scrollTo(0,0); };
  return (
    <footer style={{ background: C.umber, color: C.blush, paddingTop:60, paddingBottom:32 }}>
      <div className="container">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:40, marginBottom:48 }}>
          {/* Brand */}
          <div>
            <div className="serif" style={{ fontSize:22, fontWeight:700, color:C.white, marginBottom:8 }}>Vasi Ciolpan</div>
            <p style={{ fontSize:14, lineHeight:1.75, color:C.blush, opacity:.8, maxWidth:260, marginBottom:20 }}>
              Coaching relațional și HeartMapping™ pentru oameni care vor claritate emoțională, alegeri mai bune și relații conștiente.
            </p>
            <div style={{ display:'flex', gap:14 }}>
              {[
                { label:'Email', href:'mailto:contact@vasiciolpan.coach', icon:(
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 6 10-6"/></svg>
                )},
                { label:'Instagram', href:'#', icon:(
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                )},
              ].map(s => (
                <a key={s.label} href={s.href} aria-label={s.label}
                  style={{ width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center', color:C.blush, transition:'background .2s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(191,110,62,.5)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:C.terra, marginBottom:16 }}>Navigare</div>
            {[['home','Acasă'],['about','Despre'],['heartmapping','HeartMapping'],['oferte','Oferte'],['contact','Contact']].map(([p,l]) => (
              <button key={p} onClick={() => nav(p)}
                style={{ display:'block', background:'none', color:C.blush, opacity:.75, fontSize:14, marginBottom:10, transition:'opacity .2s' }}
                onMouseEnter={e=>e.currentTarget.style.opacity='1'}
                onMouseLeave={e=>e.currentTarget.style.opacity='.75'}
              >{l}</button>
            ))}
          </div>

          {/* Services */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:C.terra, marginBottom:16 }}>Servicii</div>
            {['Produse digitale','Workshop-uri','Coaching 1:1','HeartMapping™ Premium','Coaching pentru cupluri'].map(s => (
              <div key={s} style={{ fontSize:14, color:C.blush, opacity:.75, marginBottom:10 }}>{s}</div>
            ))}
          </div>

          {/* Contact quick */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:C.terra, marginBottom:16 }}>Contact</div>
            <a href="mailto:contact@vasiciolpan.coach" style={{ fontSize:14, color:C.blush, opacity:.85, display:'block', marginBottom:10 }}>
              contact@vasiciolpan.coach
            </a>
            <p style={{ fontSize:13, color:C.blush, opacity:.55, lineHeight:1.6, marginTop:16 }}>
              Disponibilă pentru sesiuni online și colaborări.
            </p>
          </div>
        </div>

        <div style={{ borderTop:`1px solid rgba(255,255,255,.1)`, paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <span style={{ fontSize:13, color:C.blush, opacity:.5 }}>© 2026 Vasi Ciolpan. Toate drepturile rezervate.</span>
          <span style={{ fontSize:13, color:C.blush, opacity:.5 }}>HeartMapping™ — Metodă protejată</span>
        </div>
      </div>
    </footer>
  );
};

// ── PAGE: HOME ─────────────────────────────────────────────────────────────────
const PageHome = ({ setPage }) => {
  useFadeIn();
  const nav = (p) => { setPage(p); window.scrollTo(0,0); };

  return (
    <main>
      {/* HERO */}
      <section style={{ paddingTop:140, paddingBottom:80, position:'relative', overflow:'hidden', background:C.cream }}>
        <div className="topo-bg"><TopoBg/></div>
        <div className="container" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:48, alignItems:'center' }}>
            <div style={{ maxWidth:600 }}>
              <div className="badge fade-in" style={{ marginBottom:24 }}>Coaching relațional & HeartMapping™</div>
              <h1 className="serif fade-in" style={{ fontSize:'clamp(38px,5.5vw,68px)', lineHeight:1.12, fontWeight:700, marginBottom:24, letterSpacing:'-.5px' }}>
                Înțelege cum <span className="terra">iubești.</span><br/>
                Alege mai bine.<br/>
                Construiește o relație<br/>conștientă.
              </h1>
              <p className="fade-in" style={{ fontSize:18, lineHeight:1.75, color:C.umbLight, maxWidth:480, marginBottom:36, fontWeight:300 }}>
                HeartMapping™ este un sistem de orientare emoțională care te ajută să înțelegi ce te conduce în relații — și să alegi diferit.
              </p>
              <div className="fade-in" style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                <button className="btn-primary" onClick={() => nav('heartmapping')}>Descoperă HeartMapping™</button>
                <button className="btn-outline" onClick={() => nav('oferte')}>Vezi produsele digitale</button>
              </div>
            </div>

            {/* Hero visual */}
            <div className="fade-in" style={{
              background: C.white,
              borderRadius: 28,
              padding: 36,
              border:`1px solid rgba(66,46,30,.07)`,
              boxShadow:'0 20px 60px rgba(66,46,30,.1)',
              display:'flex', flexDirection:'column', alignItems:'center',
              minWidth:280,
            }}>
              <HeartTopo size={220} animate={true}/>
              <div className="serif" style={{ fontSize:15, fontWeight:600, color:C.sage, marginTop:16, letterSpacing:'.5px' }}>HeartMapping™</div>
              <div style={{ fontSize:12, color:C.umbLight, opacity:.6, marginTop:4 }}>Harta ta emoțională</div>
            </div>
          </div>
        </div>
      </section>

      {/* EMPATHY */}
      <section style={{ background:C.white }}>
        <div className="container">
          <div className="fade-in" style={{ textAlign:'center', marginBottom:52 }}>
            <div className="badge badge-sage" style={{ marginBottom:16 }}>Recunoști ceva din asta?</div>
            <h2 className="serif" style={{ fontSize:'clamp(28px,4vw,44px)', lineHeight:1.2 }}>
              Nu ești <span className="terra">singur/ă</span> în asta.
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:20 }}>
            {[
              { icon:'🔄', text:'Repeți aceleași tipare în dating și nu înțelegi de ce.' },
              { icon:'🎯', text:'Vrei o relație împlinitoare, nu doar atenție de moment.' },
              { icon:'💬', text:'Ești deja într-o relație și vrei mai multă claritate și conectare.' },
              { icon:'🧭', text:'Vrei să înțelegi de ce simți, alegi și reacționezi cum o faci.' },
            ].map((it,i) => (
              <div key={i} className="card fade-in" style={{ animationDelay:`${i*0.1}s` }}>
                <div style={{ fontSize:28, marginBottom:14 }}>{it.icon}</div>
                <p style={{ fontSize:16, lineHeight:1.65, color:C.umbLight, fontWeight:300 }}>{it.text}</p>
              </div>
            ))}
          </div>
          <div className="fade-in" style={{ textAlign:'center', marginTop:40 }}>
            <button className="btn-sage" onClick={() => nav('about')}>Vezi cum te pot ajuta</button>
          </div>
        </div>
      </section>

      {/* HEARTMAPPING METHOD */}
      <section style={{ background:C.cream, position:'relative', overflow:'hidden' }}>
        <div className="topo-bg"><TopoBg color={C.sage} opacity={.05}/></div>
        <div className="container" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
            <div className="fade-in">
              <div className="badge badge-terra" style={{ marginBottom:20 }}>Metoda</div>
              <h2 className="serif" style={{ fontSize:'clamp(28px,4vw,44px)', lineHeight:1.2, marginBottom:24 }}>
                Ce este <span className="terra">HeartMapping™</span>
              </h2>
              <p style={{ fontSize:16, lineHeight:1.75, color:C.umbLight, marginBottom:32, fontWeight:300 }}>
                Un cadru de lucru prin care explorăm trei zone esențiale ale vieții tale relaționale — ca să trecem de la reactivitate la alegeri conștiente.
              </p>
              {[
                { n:'01', title:'Emoția dominantă', desc:'Identificăm emoția care îți conduce reacțiile — frica de abandon, nevoia de control, rușinea. Odată ce o vezi clar, nu te mai conduce din umbră.' },
                { n:'02', title:'Valorile personale', desc:'Descoperim ce contează cu adevărat pentru tine într-o relație — nu ce crezi că ar trebui, ci ce simți la nivel profund.' },
                { n:'03', title:'Adaptările', desc:'Înțelegem mecanismele prin care te protejezi — evitare, people-pleasing, supracontrol — și cum te sabotează fără să vrei.' },
              ].map((it,i) => (
                <div key={i} className="fade-in" style={{ display:'flex', gap:16, marginBottom:24 }}>
                  <div style={{ flexShrink:0, width:40, height:40, borderRadius:'50%', background:C.blush, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span className="serif" style={{ fontSize:12, fontWeight:700, color:C.terra }}>{it.n}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:15, color:C.umber, marginBottom:4 }}>{it.title}</div>
                    <div style={{ fontSize:14, lineHeight:1.65, color:C.umbLight, fontWeight:300 }}>{it.desc}</div>
                  </div>
                </div>
              ))}
              <blockquote className="fade-in" style={{
                borderLeft:`3px solid ${C.terra}`,
                paddingLeft:20, margin:'28px 0',
                fontFamily:'Playfair Display,serif',
                fontStyle:'italic', fontSize:18, color:C.umbLight, lineHeight:1.6,
              }}>
                „Scopul nu este doar să te înțelegi mai bine, ci să știi concret ce să schimbi în relații."
              </blockquote>
              <button className="btn-primary" onClick={() => nav('heartmapping')}>Vezi sesiunea HeartMapping™</button>
            </div>
            <div className="fade-in" style={{ display:'flex', justifyContent:'center' }}>
              <div style={{
                background:C.white, borderRadius:24, padding:32,
                border:`1px solid rgba(66,46,30,.07)`,
                boxShadow:'0 16px 48px rgba(66,46,30,.09)',
                textAlign:'center',
              }}>
                <HeartTopo size={260}/>
                <div style={{ marginTop:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, textAlign:'left' }}>
                  {[['Nord','Valori'],['Est','Acțiuni'],['Sud','Emoție dominantă'],['Vest','Adaptări']].map(([d,l]) => (
                    <div key={d} style={{ background:C.cream, borderRadius:10, padding:'8px 12px' }}>
                      <div style={{ fontSize:9, fontWeight:700, letterSpacing:'1.2px', color:C.terra, textTransform:'uppercase' }}>{d}</div>
                      <div style={{ fontSize:13, fontWeight:500, color:C.umber }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:11, color:C.umbLight, opacity:.5, marginTop:12, fontStyle:'italic' }}>GPS-ul Emoțional HeartMapping™</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW WE WORK */}
      <section style={{ background:C.white }}>
        <div className="container">
          <div className="fade-in" style={{ textAlign:'center', marginBottom:52 }}>
            <div className="badge" style={{ marginBottom:16 }}>Trei căi de lucru</div>
            <h2 className="serif" style={{ fontSize:'clamp(28px,4vw,44px)' }}>Cum lucrezi cu mine</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
            {[
              { n:'01', title:'Produse digitale', desc:'eBook-uri și ghiduri aplicate pentru dating, comunicare și relații. Primul pas, la propriul tău ritm.', icon:(
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.sage} strokeWidth="1.8"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
              )},
              { n:'02', title:'Workshop-uri', desc:'Experiențe de grup pentru claritate, insight și pași practici. Comunitate și practică împreună.', icon:(
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.sage} strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              )},
              { n:'03', title:'Coaching 1:1', desc:'Lucru personalizat în profunzime, pentru schimbare reală și decizii mai bune în viața ta relațională.', icon:(
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.sage} strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              )},
            ].map((it,i) => (
              <div key={i} className="card fade-in" style={{ position:'relative', borderTop:`3px solid ${i===1?C.terra:C.sage}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:C.cream, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {it.icon}
                  </div>
                  <span className="serif" style={{ fontSize:32, fontWeight:700, color:C.blush }}>{it.n}</span>
                </div>
                <h3 className="serif" style={{ fontSize:22, marginBottom:10 }}>{it.title}</h3>
                <p style={{ fontSize:15, lineHeight:1.65, color:C.umbLight, fontWeight:300 }}>{it.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section style={{ background:C.creamDark }}>
        <div className="container">
          <div className="fade-in" style={{ textAlign:'center', marginBottom:52 }}>
            <div className="badge badge-terra" style={{ marginBottom:16 }}>Recomandate</div>
            <h2 className="serif" style={{ fontSize:'clamp(28px,4vw,44px)' }}>Produse în prim-plan</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:24 }}>
            {[
              { badge:'eBook', badgeC:C.sage, title:'Prima întâlnire', desc:'Ghid practic pentru cei care vor să intre în dating cu mai multă claritate, prezență și direcție.', price:'49–69 lei', cta:'Cumpără acum', featured:false },
              { badge:'Cel mai popular', badgeC:C.terra, title:'Pachetul Relația Conștientă', desc:'Set complet de resurse pentru a construi și menține o relație bazată pe conștientizare și comunicare autentică.', price:'149–199 lei', cta:'Cumpără acum', featured:true },
              { badge:'Premium', badgeC:C.umber, title:'HeartMapping™ Premium 1:1', desc:'Proces personalizat în 3 sesiuni pentru clarificarea tiparelor, resetarea alegerilor și construirea unei direcții relaționale sănătoase.', price:'1.200–1.800 lei', cta:'Aplică acum', featured:false },
            ].map((p,i) => (
              <div key={i} className="fade-in" style={{ position:'relative' }}>
                <div className="prod-badge" style={{ background:p.badgeC, color:'#fff' }}>{p.badge}</div>
                <div className="card" style={{ paddingTop:40, border: p.featured ? `2px solid ${C.terra}` : undefined }}>
                  <h3 className="serif" style={{ fontSize:22, marginBottom:10 }}>{p.title}</h3>
                  <p style={{ fontSize:14, lineHeight:1.65, color:C.umbLight, marginBottom:20, fontWeight:300 }}>{p.desc}</p>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                    <span className="serif" style={{ fontSize:22, fontWeight:700, color:C.terra }}>{p.price}</span>
                    <button className={p.featured ? 'btn-primary' : 'btn-outline'} onClick={() => nav('oferte')}>{p.cta}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="fade-in" style={{ textAlign:'center', marginTop:36 }}>
            <button className="btn-outline" onClick={() => nav('oferte')}>→ Vezi toate ofertele</button>
          </div>
        </div>
      </section>

      {/* OUTCOMES */}
      <section style={{ background: C.sageDark, position:'relative', overflow:'hidden' }}>
        <div className="topo-bg"><TopoBg color={C.white} opacity={.04}/></div>
        <div className="container" style={{ position:'relative', zIndex:1 }}>
          <div className="fade-in" style={{ textAlign:'center', marginBottom:48 }}>
            <h2 className="serif" style={{ fontSize:'clamp(28px,4vw,44px)', color:C.white }}>Ce obții, de fapt</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
            {[
              'Mai multă claritate emoțională',
              'Mai puțină autosabotare',
              'Standarde mai sănătoase',
              'Comunicare mai conștientă',
              'Decizii mai bune în dating',
              'Alegeri libere, nu reactive',
            ].map((b,i) => (
              <div key={i} className="fade-in" style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,.08)', borderRadius:14, padding:'16px 18px' }}>
                <div style={{ flexShrink:0, width:28, height:28, borderRadius:'50%', background:C.terra, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize:15, color:C.white, opacity:.9, fontWeight:400 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT PREVIEW */}
      <section style={{ background:C.white }}>
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:56, alignItems:'center' }}>
            <div className="fade-in">
              <AvatarPlaceholder size={280}/>
            </div>
            <div className="fade-in">
              <div className="badge" style={{ marginBottom:20 }}>Despre mine</div>
              <h2 className="serif" style={{ fontSize:'clamp(22px,3.5vw,38px)', lineHeight:1.25, marginBottom:20 }}>
                Te ajut să înțelegi cum iubești, ca să nu mai alegi din <span className="terra">confuzie.</span>
              </h2>
              <p style={{ fontSize:16, lineHeight:1.8, color:C.umbLight, marginBottom:16, fontWeight:300 }}>
                Sunt Vasi Ciolpan, coach relațional și creatoarea metodei HeartMapping™. Lucrez cu oameni care vor să iasă din tipare repetitive și să construiască relații bazate pe claritate, nu pe reactivitate.
              </p>
              <p style={{ fontSize:16, lineHeight:1.8, color:C.umbLight, marginBottom:28, fontWeight:300 }}>
                Cred că fiecare om are dreptul la o relație în care se simte văzut, înțeles și liber să fie autentic. Și cred că drumul spre asta începe cu tine.
              </p>
              <button className="btn-sage" onClick={() => nav('heartmapping')}>Descoperă metoda mea</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ background:C.terra, position:'relative', overflow:'hidden' }}>
        <div className="topo-bg"><TopoBg color={C.white} opacity={.06}/></div>
        <div className="container" style={{ position:'relative', zIndex:1, textAlign:'center' }}>
          <h2 className="serif fade-in" style={{ fontSize:'clamp(28px,4vw,48px)', color:C.white, marginBottom:16, lineHeight:1.2 }}>
            Nu ai nevoie de mai multă teorie.
          </h2>
          <p className="fade-in" style={{ fontSize:20, color:'rgba(255,255,255,.85)', marginBottom:36, fontWeight:300 }}>
            Ai nevoie de claritate. Fă primul pas spre o relație conștientă.
          </p>
          <div className="fade-in" style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <button style={{ background:C.white, color:C.terra, padding:'14px 28px', borderRadius:40, fontSize:15, fontWeight:700, transition:'all .2s' }}
              onClick={() => nav('heartmapping')}
              onMouseEnter={e=>e.currentTarget.style.background=C.cream}
              onMouseLeave={e=>e.currentTarget.style.background=C.white}
            >Începe cu HeartMapping™</button>
            <button style={{ background:'transparent', color:C.white, padding:'13px 27px', borderRadius:40, border:`1.5px solid rgba(255,255,255,.7)`, fontSize:15, fontWeight:500, transition:'all .2s' }}
              onClick={() => nav('oferte')}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >Alege primul tău produs</button>
          </div>
        </div>
      </section>

      {/* CONTACT SNIPPET */}
      <section style={{ background:C.cream }}>
        <div className="container" style={{ textAlign:'center' }}>
          <div className="fade-in">
            <HeartTopo size={72}/>
            <h2 className="serif" style={{ fontSize:32, margin:'16px 0 8px' }}>Hai să vorbim</h2>
            <p style={{ fontSize:16, color:C.umbLight, marginBottom:20, fontWeight:300 }}>
              Dacă ai întrebări sau vrei să afli ce ți se potrivește, scrie-mi un mesaj.
            </p>
            <a href="mailto:contact@vasiciolpan.coach" style={{ fontSize:18, fontWeight:600, color:C.terra, borderBottom:`1.5px solid ${C.terra}`, paddingBottom:2 }}>
              contact@vasiciolpan.coach
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

// ── PAGE: HEARTMAPPING ────────────────────────────────────────────────────────
const PageHeartMapping = ({ setPage }) => {
  useFadeIn();
  const nav = (p) => { setPage(p); window.scrollTo(0,0); };
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    { q:'Este pentru single sau și pentru cupluri?', a:'HeartMapping™ este construit pentru ambele situații. Există variante dedicate persoanelor singure care vor claritate înainte de a intra într-o relație, și variante pentru cupluri care vor să înțeleagă mai bine cum funcționează împreună.' },
    { q:'Cât durează o sesiune?', a:'O sesiune standard durează 90–120 minute. Pachetele includ mai multe sesiuni structurate, spațiate pentru a permite integrarea și reflecția între întâlniri.' },
    { q:'Primesc materiale după sesiune?', a:'Da. Fiecare sesiune include resurse scrise — o hartă personalizată, concluzii aplicate și recomandări concrete pe care le poți folosi imediat.' },
    { q:'Este terapie?', a:'Nu. HeartMapping™ este coaching relațional, nu terapie clinică sau psihoterapie. Lucrăm cu resurse, valori, tipare și acțiuni concrete — nu cu traumă profundă sau diagnostic psihiatric. Dacă ai nevoie de suport terapeutic, îți pot recomanda profesioniști potriviți.' },
    { q:'Cum știu ce variantă mi se potrivește?', a:'Dacă ești la început și vrei să înțelegi cum funcționezi în relații, HeartMapping™ Intro este punctul de plecare. Dacă vrei lucru mai aprofundat și un plan concret, variantele 1:1 sunt potrivite. Poți oricând să-mi scrii și îți răspund ce se potrivește cel mai bine situației tale.' },
  ];

  return (
    <main>
      {/* HERO */}
      <section style={{ paddingTop:140, paddingBottom:80, background:C.sageDark, position:'relative', overflow:'hidden' }}>
        <div className="topo-bg"><TopoBg color={C.white} opacity={.05}/></div>
        <div className="container" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:48, alignItems:'center' }}>
            <div>
              <div className="badge fade-in" style={{ marginBottom:20, background:'rgba(255,255,255,.15)', color:C.white }}>Metoda</div>
              <h1 className="serif fade-in" style={{ fontSize:'clamp(40px,6vw,72px)', color:C.white, lineHeight:1.08, fontWeight:700, marginBottom:20 }}>
                Heart<span style={{ color:C.terra }}>Mapping™</span>
              </h1>
              <p className="fade-in" style={{ fontSize:20, color:'rgba(255,255,255,.8)', fontStyle:'italic', marginBottom:16, fontFamily:'Playfair Display,serif', fontWeight:400 }}>
                Înțelegi ce te blochează în relații și pleci cu o hartă clară pentru ce ai de schimbat.
              </p>
              <p className="fade-in" style={{ fontSize:16, color:'rgba(255,255,255,.7)', lineHeight:1.75, maxWidth:480, marginBottom:32, fontWeight:300 }}>
                Un diagnostic emoțional + o hartă de compatibilitate + un protocol de decizie relațională. Construit pentru oameni care vor claritate, nu doar confort.
              </p>
              <div className="fade-in" style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                <button style={{ background:C.terra, color:'#fff', padding:'14px 28px', borderRadius:40, fontSize:15, fontWeight:700, transition:'background .2s' }}
                  onClick={() => nav('oferte')}>Vreau HeartMapping™</button>
                <button style={{ background:'transparent', color:C.white, padding:'13px 27px', borderRadius:40, border:`1.5px solid rgba(255,255,255,.5)`, fontSize:15, fontWeight:500 }}
                  onClick={() => nav('contact')}>Programează o conversație</button>
              </div>
            </div>
            <div className="fade-in">
              <div style={{ background:'rgba(255,255,255,.08)', borderRadius:24, padding:28 }}>
                <HeartTopo size={220}/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 ZONES */}
      <section style={{ background:C.white }}>
        <div className="container">
          <div className="fade-in" style={{ textAlign:'center', marginBottom:52 }}>
            <div className="badge" style={{ marginBottom:16 }}>Cele 3 zone</div>
            <h2 className="serif" style={{ fontSize:'clamp(26px,4vw,42px)' }}>Ce explorăm împreună</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
            {[
              { n:'01', title:'Emoția dominantă', color:C.terra, desc:'Identificăm emoția care îți conduce reacțiile în relații — frica de abandon, nevoia de control, rușinea, anxietatea. Odată ce o vezi clar, nu te mai conduce din umbră.' },
              { n:'02', title:'Valorile personale', color:C.sage, desc:'Descoperim ce contează cu adevărat pentru tine într-o relație — nu ce crezi că ar trebui să conteze, ci ce simți tu la nivel profund. Valorile clare duc la alegeri clare.' },
              { n:'03', title:'Adaptările', color:C.sageDark, desc:'Înțelegem mecanismele prin care te protejezi — evitare, people-pleasing, supracontrol — și cum acestea, deși utile cândva, acum te sabotează în relații.' },
            ].map((it,i) => (
              <div key={i} className="card fade-in" style={{ borderTop:`4px solid ${it.color}` }}>
                <span className="serif" style={{ fontSize:40, fontWeight:700, color:it.color, opacity:.25 }}>{it.n}</span>
                <h3 className="serif" style={{ fontSize:24, margin:'8px 0 12px' }}>{it.title}</h3>
                <p style={{ fontSize:15, lineHeight:1.7, color:C.umbLight, fontWeight:300 }}>{it.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR WHOM */}
      <section style={{ background:C.cream }}>
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>
            <div className="fade-in">
              <div className="badge badge-terra" style={{ marginBottom:20 }}>Potrivit pentru tine dacă…</div>
              <h2 className="serif" style={{ fontSize:'clamp(24px,3.5vw,38px)', marginBottom:28, lineHeight:1.25 }}>
                HeartMapping™ este pentru tine dacă…
              </h2>
              {[
                'Te simți blocat/ă în aceleași tipare și nu înțelegi de ce.',
                'Alegi oameni nepotriviți, deși îți dai seama după.',
                'Îți este greu să separi emoția de realitate.',
                'Vrei claritate înainte să intri sau să rămâi într-o relație.',
                'Vrei să înțelegi de ce reacționezi cum reacționezi.',
              ].map((it,i) => (
                <div key={i} className="fade-in" style={{ display:'flex', gap:14, marginBottom:16, alignItems:'flex-start' }}>
                  <div style={{ flexShrink:0, marginTop:3, width:22, height:22, borderRadius:'50%', background:C.terra, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p style={{ fontSize:16, lineHeight:1.6, color:C.umbLight, fontWeight:300 }}>{it}</p>
                </div>
              ))}
            </div>
            <div className="fade-in">
              <div className="card" style={{ background:C.white }}>
                <div className="badge badge-sage" style={{ marginBottom:20 }}>Ce include sesiunea</div>
                <h3 className="serif" style={{ fontSize:22, marginBottom:20 }}>Ce primești</h3>
                {[
                  'Sesiuni de lucru structurate, la ritmul tău',
                  'Interpretare a tiparelor emoționale',
                  'Lucru pe valori personale profunde',
                  'Lucru pe emoții și reacții specifice',
                  'Concluzii aplicate cu limbaj clar',
                  'Recomandări concrete și acționabile',
                ].map((it,i) => (
                  <div key={i} style={{ display:'flex', gap:12, marginBottom:12, alignItems:'center' }}>
                    <div style={{ flexShrink:0, width:20, height:20, borderRadius:'50%', background:C.blush, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.sage} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span style={{ fontSize:15, color:C.umbLight }}>{it}</span>
                  </div>
                ))}
                <div style={{ marginTop:24, borderTop:`1px solid rgba(66,46,30,.08)`, paddingTop:20 }}>
                  <div className="badge badge-terra" style={{ marginBottom:12 }}>Ce obții</div>
                  {['Claritate emoțională reală','O direcție concretă','Limbaj pentru ceea ce trăiești','Pași practici, nu teorie'].map((it,i) => (
                    <div key={i} style={{ fontSize:14, color:C.umbLight, marginBottom:6, display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ color:C.terra }}>→</span> {it}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ background:C.white }}>
        <div className="container">
          <div className="fade-in" style={{ textAlign:'center', marginBottom:52 }}>
            <div className="badge" style={{ marginBottom:16 }}>Opțiuni</div>
            <h2 className="serif" style={{ fontSize:'clamp(26px,4vw,42px)' }}>Alege varianta ta</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
            {[
              { badge:'Intrare', badgeC:C.sage, title:'HeartMapping™ Intro', subtitle:'Diagnostic inițial', desc:'Primul pas în înțelegerea tiparelor tale emoționale. Un diagnostic ușor cu concluzii clare și recomandări de direcție.', price:'99 lei', cta:'Vreau Intro', featured:false },
              { badge:'Recomandat', badgeC:C.terra, title:'HeartMapping™ Basic 1:1', subtitle:'Sesiune individuală completă', desc:'Prima ta hartă emoțională completă, cu interpretare detaliată și recomandări personalizate pentru dating și relații.', price:'450–600 lei', cta:'Vreau Basic', featured:true },
              { badge:'Premium', badgeC:C.umber, title:'HeartMapping™ Premium 1:1', subtitle:'Proces personalizat în 3 sesiuni', desc:'Transformare relațională profundă — de la diagnostic la plan de acțiune complet, cu suport și follow-up dedicat.', price:'1.200–1.800 lei', cta:'Aplică', featured:false },
            ].map((p,i) => (
              <div key={i} className="fade-in" style={{ position:'relative' }}>
                <div className="prod-badge" style={{ background:p.badgeC, color:'#fff' }}>{p.badge}</div>
                <div className="card" style={{ paddingTop:44, height:'100%', border: p.featured ? `2px solid ${C.terra}` : undefined, display:'flex', flexDirection:'column' }}>
                  <h3 className="serif" style={{ fontSize:22, marginBottom:4 }}>{p.title}</h3>
                  <p style={{ fontSize:13, color:C.sage, fontWeight:600, marginBottom:14 }}>{p.subtitle}</p>
                  <p style={{ fontSize:14, lineHeight:1.65, color:C.umbLight, marginBottom:24, fontWeight:300, flex:1 }}>{p.desc}</p>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                    <span className="serif" style={{ fontSize:24, fontWeight:700, color:C.terra }}>{p.price}</span>
                    <button className={p.featured ? 'btn-primary' : 'btn-outline'} onClick={() => nav('oferte')}>{p.cta}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background:C.cream }}>
        <div className="container" style={{ maxWidth:720 }}>
          <div className="fade-in" style={{ textAlign:'center', marginBottom:48 }}>
            <h2 className="serif" style={{ fontSize:'clamp(26px,4vw,40px)' }}>Întrebări frecvente</h2>
          </div>
          {faqs.map((f,i) => (
            <div key={i} className="fade-in" style={{ borderBottom:`1px solid rgba(66,46,30,.1)`, marginBottom:0 }}>
              <button
                onClick={() => setOpenFaq(openFaq===i ? null : i)}
                style={{ width:'100%', background:'none', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 0', textAlign:'left', gap:20 }}
                aria-expanded={openFaq===i}
              >
                <span className="serif" style={{ fontSize:17, fontWeight:600, color:C.umber }}>{f.q}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.terra} strokeWidth="2"
                  style={{ flexShrink:0, transition:'transform .3s', transform: openFaq===i ? 'rotate(180deg)' : 'rotate(0)' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <div className={`acc-body ${openFaq===i?'open':''}`}>
                <p style={{ fontSize:15, lineHeight:1.75, color:C.umbLight, paddingBottom:20, fontWeight:300 }}>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background:C.umber, position:'relative', overflow:'hidden' }}>
        <div className="topo-bg"><TopoBg color={C.white} opacity={.04}/></div>
        <div className="container" style={{ position:'relative', zIndex:1, textAlign:'center' }}>
          <HeartTopo size={80}/>
          <h2 className="serif fade-in" style={{ fontSize:'clamp(26px,4vw,44px)', color:C.white, margin:'20px 0 12px', lineHeight:1.2 }}>
            Ești gata să-ți descoperi harta emoțională?
          </h2>
          <p className="fade-in" style={{ fontSize:17, color:'rgba(255,255,255,.7)', marginBottom:32, fontWeight:300 }}>
            Primul pas este să decizi că vrei claritate. Restul îl facem împreună.
          </p>
          <div className="fade-in" style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <button className="btn-primary" onClick={() => nav('oferte')}>Vreau HeartMapping™</button>
            <button style={{ background:'transparent', color:C.white, padding:'13px 27px', borderRadius:40, border:`1.5px solid rgba(255,255,255,.5)`, fontSize:15, fontWeight:500 }}
              onClick={() => nav('contact')}>Programează o conversație</button>
          </div>
        </div>
      </section>
    </main>
  );
};

// ── PAGE: OFERTE ──────────────────────────────────────────────────────────────
const PageOferte = ({ setPage }) => {
  useFadeIn();
  const nav = (p) => { setPage(p); window.scrollTo(0,0); };

  const tiers = [
    {
      label:'Nivel de intrare', sublabel:'Începe de aici', color:C.sage,
      products:[
        { title:'Prima întâlnire', desc:'Intră în dating cu claritate, nu cu speranțe vagi.', price:'49–69 lei', type:'eBook' },
        { title:'Prezența care seduce', desc:'Seducția reală vine din prezență, nu din strategie.', price:'49–69 lei', type:'eBook' },
        { title:'Vocea care îl face să rămână', desc:'Comunicarea care creează conexiune reală, nu doar atracție.', price:'49–69 lei', type:'eBook' },
        { title:'Pachetul Relația Conștientă', desc:'Tot ce ai nevoie pentru a construi o relație bazată pe conștientizare.', price:'149–199 lei', type:'Pachet' },
        { title:'HeartMapping™ Intro', desc:'Primul pas în înțelegerea tiparelor tale emoționale.', price:'99 lei', type:'Diagnostic' },
      ],
    },
    {
      label:'Nivel mediu', sublabel:'Lucrează ghidat', color:C.terra,
      products:[
        { title:'Workshop HeartMapping™ de grup', desc:'Înțelege-ți tiparele relaționale într-un spațiu de grup sigur.', price:'249–390 lei', type:'Workshop' },
        { title:'HeartMapping™ Basic 1:1', desc:'Prima ta hartă emoțională completă, într-o sesiune dedicată.', price:'450–600 lei', type:'Sesiune 1:1' },
      ],
    },
    {
      label:'Premium', sublabel:'Transformare profundă', color:C.umber,
      products:[
        { title:'HeartMapping™ Premium 1:1', desc:'Transformare relațională profundă în 3 sesiuni personalizate.', price:'1.200–1.800 lei', type:'Program 1:1' },
        { title:'HeartMapping™ pentru Cupluri', desc:'Înțelegeți-vă reciproc la un nivel la care nu ați ajuns singuri.', price:'1.500–2.200 lei', type:'Cupluri' },
        { title:'Program intensiv de coaching relațional', desc:'Transformare relațională completă cu suport continuu și planificare strategică.', price:'2.500–3.500 lei', type:'Intensiv' },
      ],
    },
  ];

  return (
    <main>
      <section style={{ paddingTop:140, paddingBottom:60, background:C.cream, position:'relative', overflow:'hidden' }}>
        <div className="topo-bg"><TopoBg/></div>
        <div className="container" style={{ position:'relative', zIndex:1, textAlign:'center' }}>
          <div className="badge fade-in" style={{ marginBottom:20 }}>Catalog complet</div>
          <h1 className="serif fade-in" style={{ fontSize:'clamp(32px,5vw,60px)', lineHeight:1.15, marginBottom:16 }}>
            Alege ce ți se <span className="terra">potrivește</span>
          </h1>
          <p className="fade-in" style={{ fontSize:18, color:C.umbLight, maxWidth:560, margin:'0 auto', lineHeight:1.7, fontWeight:300 }}>
            De la ghiduri practice la coaching premium — fiecare produs este construit să te ducă mai aproape de claritate și relații conștiente.
          </p>
        </div>
      </section>

      {tiers.map((tier, ti) => (
        <section key={ti} style={{ background: ti%2===0 ? C.white : C.creamDark }}>
          <div className="container">
            <div className="fade-in" style={{ display:'flex', alignItems:'center', gap:16, marginBottom:36 }}>
              <div style={{ width:4, height:40, borderRadius:2, background:tier.color }}/>
              <div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:tier.color, marginBottom:2 }}>{tier.sublabel}</div>
                <h2 className="serif" style={{ fontSize:'clamp(22px,3vw,34px)' }}>{tier.label}</h2>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:20 }}>
              {tier.products.map((p,pi) => (
                <div key={pi} className="card fade-in" style={{ position:'relative' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                    <span style={{ fontSize:10, fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase', padding:'4px 10px', borderRadius:20, background:tier.color==='#422E1E'?'rgba(66,46,30,.1)':tier.color==='#BF6E3E'?'rgba(191,110,62,.1)':'rgba(104,131,104,.1)', color:tier.color }}>{p.type}</span>
                  </div>
                  <h3 className="serif" style={{ fontSize:20, marginBottom:8 }}>{p.title}</h3>
                  <p style={{ fontSize:14, lineHeight:1.65, color:C.umbLight, marginBottom:20, flex:1, fontWeight:300 }}>{p.desc}</p>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                    <span className="serif" style={{ fontSize:20, fontWeight:700, color:tier.color }}>{p.price}</span>
                    <button className="btn-outline" style={{ padding:'9px 18px', fontSize:13 }} onClick={() => nav('contact')}>
                      {tier.label==='Premium' ? 'Aplică acum' : 'Cumpără acum'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section style={{ background:C.terra }}>
        <div className="container" style={{ textAlign:'center' }}>
          <h2 className="serif fade-in" style={{ fontSize:'clamp(22px,3.5vw,38px)', color:C.white, marginBottom:14 }}>
            Nu știi de unde să începi?
          </h2>
          <p className="fade-in" style={{ fontSize:17, color:'rgba(255,255,255,.8)', marginBottom:28, fontWeight:300 }}>
            Scrie-mi un mesaj și te ajut să alegi ce ți se potrivește.
          </p>
          <button className="fade-in"
            style={{ background:C.white, color:C.terra, padding:'14px 32px', borderRadius:40, fontSize:15, fontWeight:700 }}
            onClick={() => nav('contact')}>Contactează-mă</button>
        </div>
      </section>
    </main>
  );
};

// ── PAGE: ABOUT ───────────────────────────────────────────────────────────────
const PageAbout = ({ setPage }) => {
  useFadeIn();
  const nav = (p) => { setPage(p); window.scrollTo(0,0); };

  return (
    <main>
      <section style={{ paddingTop:140, paddingBottom:80, background:C.cream, position:'relative', overflow:'hidden' }}>
        <div className="topo-bg"><TopoBg/></div>
        <div className="container" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:60, alignItems:'start' }}>
            <div className="fade-in">
              <AvatarPlaceholder size={320}/>
              <div style={{ marginTop:20, display:'flex', gap:12, justifyContent:'center' }}>
                <a href="mailto:contact@vasiciolpan.coach" className="btn-sage" style={{ fontSize:13, padding:'9px 18px' }}>Scrie-mi</a>
                <button className="btn-outline" style={{ fontSize:13, padding:'8px 17px' }} onClick={() => nav('heartmapping')}>Metoda mea</button>
              </div>
            </div>
            <div>
              <div className="badge fade-in" style={{ marginBottom:20 }}>Despre</div>
              <h1 className="serif fade-in" style={{ fontSize:'clamp(30px,4.5vw,54px)', lineHeight:1.18, marginBottom:20 }}>
                Te ajut să înțelegi cum iubești,<br/>ca să nu mai alegi din <span className="terra">confuzie.</span>
              </h1>
              <p className="fade-in" style={{ fontSize:17, lineHeight:1.8, color:C.umbLight, marginBottom:16, fontWeight:300 }}>
                Sunt Vasi Ciolpan, coach relațional și creatoarea metodei HeartMapping™. Lucrez cu oameni care vor să iasă din tipare repetitive și să construiască relații bazate pe claritate, nu pe reactivitate.
              </p>
              <p className="fade-in" style={{ fontSize:17, lineHeight:1.8, color:C.umbLight, marginBottom:16, fontWeight:300 }}>
                Cred că fiecare om are dreptul la o relație în care se simte văzut, înțeles și liber să fie autentic. Și cred că drumul spre asta începe cu tine — cu înțelegerea tiparelor, a valorilor și a emoțiilor care îți ghidează alegerile.
              </p>
              <p className="fade-in" style={{ fontSize:17, lineHeight:1.8, color:C.umbLight, marginBottom:28, fontWeight:300 }}>
                HeartMapping™ este răspunsul meu la o întrebare simplă: de ce repetăm aceleași greșeli în relații, chiar și atunci când știm că nu ne fac bine? Și mai ales — cum facem altfel?
              </p>
              <blockquote className="fade-in" style={{ borderLeft:`3px solid ${C.terra}`, paddingLeft:20, marginBottom:32, fontFamily:'Playfair Display,serif', fontStyle:'italic', fontSize:20, color:C.umbLight, lineHeight:1.6 }}>
                „Relația împlinitoare începe cu harta emoțiilor tale."
              </blockquote>
              <button className="btn-primary fade-in" onClick={() => nav('heartmapping')}>Descoperă metoda HeartMapping™</button>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section style={{ background:C.white }}>
        <div className="container">
          <div className="fade-in" style={{ textAlign:'center', marginBottom:48 }}>
            <h2 className="serif" style={{ fontSize:'clamp(26px,4vw,42px)' }}>Principiile de lucru</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20 }}>
            {[
              { title:'Relația împlinitoare', desc:'Obiectivul nu este validarea, ci o relație aleasă conștient.' },
              { title:'Tiparul înaintea tehnicii', desc:'Nu „ce replică folosesc?", ci „ce mecanism repet?" — acesta este punctul de plecare.' },
              { title:'Emoția ca busolă', desc:'Frica, rușinea, furia sau dorința de control indică nevoi reale și protecții. Ele sunt informație, nu defecte.' },
              { title:'Claritate înainte de chimie', desc:'Atracția e importantă, dar nu suficientă pentru compatibilitate pe termen lung.' },
              { title:'Singurătate asumată', desc:'Mai bună decât compromisuri repetate și auto-abandon. Alegerea conștientă include și alegerea de a rămâne singur/ă.' },
              { title:'Acțiuni mici, repetabile', desc:'Limite clare, întrebări bune, observații oneste, ritualuri de reflecție. Schimbarea vine din comportament, nu din intenție.' },
            ].map((it,i) => (
              <div key={i} className="card fade-in">
                <div style={{ width:36, height:36, borderRadius:'50%', background:C.blush, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                  <HeartTopo size={22}/>
                </div>
                <h3 className="serif" style={{ fontSize:19, marginBottom:8 }}>{it.title}</h3>
                <p style={{ fontSize:14, lineHeight:1.65, color:C.umbLight, fontWeight:300 }}>{it.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background:C.sageDark }}>
        <div className="container" style={{ textAlign:'center' }}>
          <h2 className="serif fade-in" style={{ fontSize:'clamp(24px,3.5vw,40px)', color:C.white, marginBottom:14 }}>
            Lucrăm împreună?
          </h2>
          <p className="fade-in" style={{ color:'rgba(255,255,255,.75)', fontSize:16, marginBottom:28, fontWeight:300 }}>
            Scrie-mi un mesaj sau explorează metoda HeartMapping™.
          </p>
          <div className="fade-in" style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <button className="btn-primary" onClick={() => nav('heartmapping')}>Descoperă HeartMapping™</button>
            <button style={{ background:'transparent', color:C.white, padding:'13px 27px', borderRadius:40, border:`1.5px solid rgba(255,255,255,.5)`, fontSize:15, fontWeight:500 }}
              onClick={() => nav('contact')}>Contactează-mă</button>
          </div>
        </div>
      </section>
    </main>
  );
};

// ── PAGE: CONTACT ─────────────────────────────────────────────────────────────
const PageContact = ({ setPage }) => {
  useFadeIn();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', message:'' });

  return (
    <main>
      <section style={{ paddingTop:140, paddingBottom:80, background:C.cream, position:'relative', overflow:'hidden' }}>
        <div className="topo-bg"><TopoBg/></div>
        <div className="container" style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'start' }}>
            <div>
              <div className="badge fade-in" style={{ marginBottom:20 }}>Contact</div>
              <h1 className="serif fade-in" style={{ fontSize:'clamp(30px,4.5vw,52px)', lineHeight:1.18, marginBottom:20 }}>
                Hai să <span className="terra">vorbim</span>
              </h1>
              <p className="fade-in" style={{ fontSize:17, lineHeight:1.8, color:C.umbLight, marginBottom:36, fontWeight:300 }}>
                Dacă ai întrebări sau vrei să afli ce ți se potrivește cel mai bine, scrie-mi un mesaj. Îți răspund în 24–48 de ore.
              </p>

              <div className="fade-in" style={{ display:'flex', flexDirection:'column', gap:20 }}>
                {[
                  { label:'Email', val:'contact@vasiciolpan.coach', href:'mailto:contact@vasiciolpan.coach', icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.sage} strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 6 10-6"/></svg> },
                  { label:'Instagram', val:'@vasiciolpan', href:'#', icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.sage} strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill={C.sage} stroke="none"/></svg> },
                ].map(it => (
                  <a key={it.label} href={it.href} style={{ display:'flex', alignItems:'center', gap:16, background:C.white, borderRadius:14, padding:'16px 20px', border:`1px solid rgba(66,46,30,.07)`, transition:'box-shadow .2s' }}
                    onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(66,46,30,.08)'}
                    onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
                  >
                    <div style={{ width:42, height:42, borderRadius:'50%', background:C.cream, display:'flex', alignItems:'center', justifyContent:'center' }}>{it.icon}</div>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:C.umbLight, opacity:.5, marginBottom:2 }}>{it.label}</div>
                      <div style={{ fontSize:15, fontWeight:600, color:C.umber }}>{it.val}</div>
                    </div>
                  </a>
                ))}
              </div>

              <div className="fade-in" style={{ marginTop:36, background:C.white, borderRadius:16, padding:24, border:`1px solid rgba(66,46,30,.07)` }}>
                <HeartTopo size={48}/>
                <p style={{ fontFamily:'Playfair Display,serif', fontStyle:'italic', fontSize:17, color:C.umbLight, lineHeight:1.6, marginTop:10 }}>
                  „Busola emoțiilor tale."
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="fade-in">
              <div className="card" style={{ background:C.white }}>
                {sent ? (
                  <div style={{ textAlign:'center', padding:'20px 0' }}>
                    <div style={{ fontSize:48, marginBottom:16 }}>✉️</div>
                    <h3 className="serif" style={{ fontSize:26, marginBottom:12 }}>Mesaj trimis!</h3>
                    <p style={{ color:C.umbLight, fontWeight:300 }}>Îți voi răspunde în 24–48 de ore. Mulțumesc că ai făcut primul pas.</p>
                  </div>
                ) : (
                  <>
                    <h2 className="serif" style={{ fontSize:26, marginBottom:24 }}>Trimite un mesaj</h2>
                    {[
                      { id:'name', label:'Numele tău', type:'text', placeholder:'Andrei / Andreea' },
                      { id:'email', label:'Adresa de email', type:'email', placeholder:'email@exemplu.ro' },
                    ].map(f => (
                      <div key={f.id} style={{ marginBottom:20 }}>
                        <label htmlFor={f.id} style={{ display:'block', fontSize:13, fontWeight:600, color:C.umbLight, marginBottom:6 }}>{f.label}</label>
                        <input id={f.id} type={f.type} placeholder={f.placeholder} value={form[f.id]}
                          onChange={e => setForm(prev => ({...prev,[f.id]:e.target.value}))}
                          style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:`1.5px solid rgba(66,46,30,.15)`, fontSize:15, background:C.cream, color:C.umber, outline:'none', fontFamily:'DM Sans,sans-serif' }}
                          onFocus={e=>e.target.style.borderColor=C.terra}
                          onBlur={e=>e.target.style.borderColor='rgba(66,46,30,.15)'}
                        />
                      </div>
                    ))}
                    <div style={{ marginBottom:24 }}>
                      <label htmlFor="message" style={{ display:'block', fontSize:13, fontWeight:600, color:C.umbLight, marginBottom:6 }}>Mesajul tău</label>
                      <textarea id="message" rows={5} placeholder="Spune-mi cu ce pot să te ajut sau ce ai vrea să explorăm împreună..." value={form.message}
                        onChange={e=>setForm(prev=>({...prev,message:e.target.value}))}
                        style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:`1.5px solid rgba(66,46,30,.15)`, fontSize:15, background:C.cream, color:C.umber, outline:'none', fontFamily:'DM Sans,sans-serif', resize:'vertical' }}
                        onFocus={e=>e.target.style.borderColor=C.terra}
                        onBlur={e=>e.target.style.borderColor='rgba(66,46,30,.15)'}
                      />
                    </div>
                    <button className="btn-primary" style={{ width:'100%', textAlign:'center' }} onClick={() => setSent(true)}>
                      Trimite mesajul
                    </button>
                    <p style={{ fontSize:12, color:C.umbLight, opacity:.5, textAlign:'center', marginTop:12 }}>
                      Datele tale sunt confidențiale și nu vor fi partajate cu terți.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

// ── NEWSLETTER SECTION ───────────────────────────────────────────────────────
const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | success | error

  const submit = () => {
    if (!email.includes('@')) { setStatus('error'); return; }
    setStatus('success');
    setEmail('');
  };

  return (
    <section style={{
      background: C.creamDark,
      position: 'relative',
      overflow: 'hidden',
      padding: '72px 0',
    }}>
      <div className="topo-bg"><TopoBg color={C.terra} opacity={.04}/></div>

      <div className="container" style={{ position:'relative', zIndex:1 }}>
        <div style={{
          maxWidth: 780,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 56,
          alignItems: 'center',
        }}>
          {/* Left — copy */}
          <div className="fade-in">
            {/* Decorative lead-magnet tag */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: C.white, borderRadius: 40,
              padding: '6px 16px 6px 10px',
              marginBottom: 24,
              border: `1px solid rgba(66,46,30,.08)`,
            }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:C.terra, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <span style={{ fontSize:12, fontWeight:700, letterSpacing:'.8px', color:C.terra, textTransform:'uppercase' }}>Resursă gratuită</span>
            </div>

            <h2 className="serif" style={{ fontSize:'clamp(24px,3.5vw,38px)', lineHeight:1.22, marginBottom:14 }}>
              5 tipare care<br/><span className="terra">sabotează</span> relația ta
            </h2>
            <p style={{ fontSize:15, lineHeight:1.75, color:C.umbLight, fontWeight:300, marginBottom:0 }}>
              Un ghid scurt și sincer despre mecanismele pe care le repetăm fără să știm — și primul pas concret pentru a ieși din ele.
            </p>

            {/* What's inside teaser */}
            <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:10 }}>
              {[
                'Emoția dominantă care îți conduce alegerile',
                'De ce atracția intensă nu înseamnă compatibilitate',
                'Cum recunoști people-pleasing-ul în relație',
              ].map((it,i) => (
                <div key={i} style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <div style={{ flexShrink:0, width:18, height:18, borderRadius:'50%', background:C.blush, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.sage} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span style={{ fontSize:13, color:C.umbLight }}>{it}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — form card */}
          <div className="fade-in">
            <div style={{
              background: C.white,
              borderRadius: 24,
              padding: 32,
              border: `1px solid rgba(66,46,30,.07)`,
              boxShadow: '0 12px 40px rgba(66,46,30,.08)',
            }}>
              {status === 'success' ? (
                <div style={{ textAlign:'center', padding:'16px 0' }}>
                  <div style={{ marginBottom:16 }}>
                    <HeartTopo size={72}/>
                  </div>
                  <h3 className="serif" style={{ fontSize:22, marginBottom:10 }}>Bine ai venit!</h3>
                  <p style={{ fontSize:15, lineHeight:1.7, color:C.umbLight, fontWeight:300 }}>
                    Ghidul tău este pe drum. Verifică inbox-ul (și folderul spam, uneori se ascunde acolo).
                  </p>
                </div>
              ) : (
                <>
                  <div className="serif" style={{ fontSize:15, fontWeight:600, color:C.sage, marginBottom:4 }}>
                    Primești ghidul gratuit →
                  </div>
                  <p style={{ fontSize:13, color:C.umbLight, opacity:.65, marginBottom:22, lineHeight:1.6 }}>
                    Abonează-te la newsletter și primești imediat ghidul „5 tipare care sabotează relația".
                  </p>

                  <div style={{ marginBottom:14 }}>
                    <label htmlFor="nl-email" style={{ display:'block', fontSize:12, fontWeight:600, color:C.umbLight, marginBottom:6, letterSpacing:'.3px' }}>
                      Adresa de email
                    </label>
                    <input
                      id="nl-email"
                      type="email"
                      placeholder="email@exemplu.ro"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setStatus('idle'); }}
                      style={{
                        width:'100%', padding:'12px 16px',
                        borderRadius:12,
                        border: `1.5px solid ${status==='error' ? C.terra : 'rgba(66,46,30,.15)'}`,
                        fontSize:15, background:C.cream, color:C.umber,
                        outline:'none', fontFamily:'DM Sans,sans-serif',
                        transition:'border-color .2s',
                      }}
                      onFocus={e=>e.target.style.borderColor=C.sage}
                      onBlur={e=>e.target.style.borderColor=status==='error'?C.terra:'rgba(66,46,30,.15)'}
                      onKeyDown={e => e.key==='Enter' && submit()}
                    />
                    {status==='error' && (
                      <p style={{ fontSize:12, color:C.terra, marginTop:6 }}>Introdu o adresă de email validă.</p>
                    )}
                  </div>

                  <button
                    className="btn-primary"
                    style={{ width:'100%', textAlign:'center', fontSize:15 }}
                    onClick={submit}
                  >
                    Vreau ghidul gratuit
                  </button>

                  <p style={{ fontSize:11, color:C.umbLight, opacity:.45, textAlign:'center', marginTop:14, lineHeight:1.6 }}>
                    Fără spam. Te poți dezabona oricând.<br/>Datele tale sunt tratate cu respect.
                  </p>

                  {/* Social proof micro-line */}
                  <div style={{ marginTop:20, paddingTop:16, borderTop:`1px solid rgba(66,46,30,.07)`, display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ display:'flex' }}>
                      {['#688368','#BF6E3E','#66503F'].map((c,i) => (
                        <div key={i} style={{ width:24, height:24, borderRadius:'50%', background:c, border:`2px solid ${C.white}`, marginLeft: i>0 ? -8 : 0, opacity:.7 }}/>
                      ))}
                    </div>
                    <span style={{ fontSize:12, color:C.umbLight, opacity:.6 }}>
                      Alătură-te celor care aleg claritatea.
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .nl-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
};

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('home');

  const pages = {
    home:        <PageHome setPage={setPage}/>,
    about:       <PageAbout setPage={setPage}/>,
    heartmapping:<PageHeartMapping setPage={setPage}/>,
    oferte:      <PageOferte setPage={setPage}/>,
    contact:     <PageContact setPage={setPage}/>,
  };

  return (
    <>
      <GlobalStyle/>
      <Nav page={page} setPage={setPage}/>
      {pages[page] || pages['home']}
      <NewsletterSection/>
      <Footer setPage={setPage}/>
    </>
  );
}
