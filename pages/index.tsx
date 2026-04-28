import { useEffect, useRef, useState } from "react";

const WEB3FORMS_KEY = "1da1663f-084f-4777-ab36-619c76981bcd";

function SwarmLogo() {
  return (
    <svg viewBox="0 0 440 100" width="396" height="90" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="82" r="4" fill="#00ff88" opacity="0.25"/>
      <circle cx="22" cy="74" r="5" fill="#00ff88" opacity="0.35"/>
      <circle cx="18" cy="64" r="3" fill="#00ff88" opacity="0.3"/>
      <circle cx="32" cy="68" r="6" fill="#00ff88" opacity="0.45"/>
      <circle cx="28" cy="56" r="4" fill="#00ff88" opacity="0.4"/>
      <circle cx="42" cy="60" r="5" fill="#00ff88" opacity="0.55"/>
      <circle cx="38" cy="48" r="4" fill="#00ff88" opacity="0.5"/>
      <circle cx="52" cy="50" r="7" fill="#00ff88" opacity="0.65"/>
      <circle cx="48" cy="38" r="4" fill="#00ff88" opacity="0.55"/>
      <circle cx="62" cy="40" r="6" fill="#00ff88" opacity="0.7"/>
      <circle cx="58" cy="28" r="4" fill="#00ff88" opacity="0.65"/>
      <circle cx="72" cy="28" r="8" fill="#00ff88" opacity="0.85"/>
      <circle cx="68" cy="16" r="5" fill="#00ff88" opacity="0.75"/>
      <circle cx="82" cy="18" r="6" fill="#00ff88" opacity="0.9"/>
      <circle cx="78" cy="8"  r="4" fill="#00ff88" opacity="0.8"/>
      <circle cx="90" cy="10" r="9" fill="#00ff88" opacity="1"/>
      <circle cx="86" cy="4"  r="3" fill="#00ff88" opacity="0.7"/>
      <image href="/prediq-logo.png" x="8" y="10" width="60" height="60"/>
      <text x="108" y="68" fontFamily="SF Mono,Fira Code,monospace" fontSize="48" fontWeight="700" fill="#FFD166" letterSpacing="4">PREDIQ</text>
      <text x="110" y="86" fontFamily="SF Mono,Fira Code,monospace" fontSize="12" fill="#3a6080" letterSpacing="6">TIME MACHINE</text>
    </svg>
  );
}

export default function LandingPage() {
  const [email,      setEmail]      = useState("");
  const [code,       setCode]       = useState("");
  const [view,       setView]       = useState<"landing"|"waitlist"|"access"|"joined"|"entering">("landing");
  const [error,      setError]      = useState("");
  const [validating, setValidating] = useState(false);

  // Canvas declared in JSX so it exists in DOM before useEffect
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const heroRef        = useRef<HTMLDivElement>(null);
  const initialisedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero   = heroRef.current;
    if (!canvas || !hero) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const N   = 200;
    const px  = new Float32Array(N);
    const py  = new Float32Array(N);
    const pvx = new Float32Array(N);
    const pvy = new Float32Array(N);
    let W = 0, H = 0;

    // ── Size canvas to match hero pixel-perfectly ─────────
    const resize = () => {
      const dpr  = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.offsetWidth;
      H = hero.offsetHeight;
      if (W === 0 || H === 0) return;
      canvas.width  = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initParticles = () => {
      for (let i = 0; i < N; i++) {
        px[i]  = Math.random() * W;
        py[i]  = Math.random() * H;
        pvx[i] = (Math.random() - 0.5) * 3;
        pvy[i] = (Math.random() - 0.5) * 3;
      }
    };

    // ── Boids ─────────────────────────────────────────────
    const SEP_R2 = 48 * 48, ALI_R2 = 110 * 110, COH_R2 = 145 * 145;

    const stepBoids = () => {
      for (let i = 0; i < N; i++) {
        let sx=0,sy=0,sc=0, ax=0,ay=0,ac=0, cohx=0,cohy=0,cc=0;
        for (let j = 0; j < N; j++) {
          if (i === j) continue;
          const dx=px[i]-px[j], dy=py[i]-py[j], d2=dx*dx+dy*dy;
          if (d2 < SEP_R2 && d2 > 0) { const d=Math.sqrt(d2); sx+=dx/d; sy+=dy/d; sc++; }
          if (d2 < ALI_R2) { ax+=pvx[j]; ay+=pvy[j]; ac++; }
          if (d2 < COH_R2) { cohx+=px[j]; cohy+=py[j]; cc++; }
        }
        if (sc>0) { pvx[i]+=sx/sc*1.5; pvy[i]+=sy/sc*1.5; }
        if (ac>0) { pvx[i]+=(ax/ac-pvx[i])*0.04; pvy[i]+=(ay/ac-pvy[i])*0.04; }
        if (cc>0) { pvx[i]+=(cohx/cc-px[i])*0.002; pvy[i]+=(cohy/cc-py[i])*0.002; }
        pvx[i]+=(Math.random()-0.5)*0.4;
        pvy[i]+=(Math.random()-0.5)*0.4;
        const spd=Math.sqrt(pvx[i]*pvx[i]+pvy[i]*pvy[i]);
        if (spd>3.4) { pvx[i]=pvx[i]/spd*3.4; pvy[i]=pvy[i]/spd*3.4; }
        if (spd<0.7) { pvx[i]+=(Math.random()-0.5)*1.2; pvy[i]+=(Math.random()-0.5)*1.2; }
        px[i]+=pvx[i]; py[i]+=pvy[i];
        if (px[i]<-10) px[i]=W+10; if (px[i]>W+10) px[i]=-10;
        if (py[i]<-10) py[i]=H+10; if (py[i]>H+10) py[i]=-10;
      }
    };

    // ── Draw ──────────────────────────────────────────────
    const draw = () => {
      // Fill black first (handles first frame where trail hasn't built)
      if (!initialisedRef.current) {
        ctx.fillStyle = "#02070c";
        ctx.fillRect(0, 0, W, H);
        initialisedRef.current = true;
      }
      // Motion-blur trail
      ctx.fillStyle = "rgba(2,4,8,0.14)";
      ctx.fillRect(0, 0, W, H);

      ctx.save();

      // Outer glow halo (low opacity — atmospheric)
      ctx.shadowBlur = 0;
      for (let i = 0; i < N; i++) {
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = "#00ff88";
        ctx.beginPath();
        ctx.arc(px[i], py[i], 8 + (i%3)*2, 0, Math.PI*2);
        ctx.fill();
      }

      // Bright core with glow
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#00ff88";
      for (let i = 0; i < N; i++) {
        const spd = Math.sqrt(pvx[i]*pvx[i]+pvy[i]*pvy[i]);
        ctx.globalAlpha = 0.45 + Math.min(0.2, spd*0.06);
        ctx.fillStyle = i%7===0 ? "#55ffaa" : i%4===0 ? "#00ffaa" : "#00ff88";
        ctx.beginPath();
        ctx.arc(px[i], py[i], 3.5 + (i%3)*0.7, 0, Math.PI*2);
        ctx.fill();
      }

      ctx.restore();
      ctx.globalAlpha = 1;
    };

    // ── Loop ─────────────────────────────────────────────
    let raf: number;
    const tick = () => { stepBoids(); draw(); raf = requestAnimationFrame(tick); };

    // ResizeObserver keeps canvas sized to hero at all times
    const ro = new ResizeObserver(() => { resize(); });
    ro.observe(hero);

    resize();
    initParticles();
    raf = requestAnimationFrame(tick);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  // ── Auth handlers ────────────────────────────────────────
  const joinWaitlist = async () => {
    if (!email || !email.includes("@")) { setError("Enter a valid email"); return; }
    try {
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject: "PREDIQ Beta Waitlist", from_name: "PREDIQ Waitlist", email, message: "New signup: " + email }),
      });
    } catch {}
    setView("joined");
  };

  const enterCode = async () => {
    const trimmed = code.toUpperCase().trim();
    if (!trimmed) { setError("Enter your beta code"); return; }
    setValidating(true); setError("");
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://prediq-time-machine-production.up.railway.app"}/api/validate-code`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (data.valid) {
        localStorage.setItem("prediq_access_code", trimmed);
        localStorage.setItem("prediq_tier", data.tier || "free");
        localStorage.setItem("prediq_login_time", String(Date.now()));
        setView("entering");
        setTimeout(() => { window.location.href = "/dashboard"; }, 2000);
      } else { setError("Invalid code. Join the waitlist to request access."); }
    } catch { setError("Could not verify code. Please try again."); }
    setValidating(false);
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ background:"#02070c", fontFamily:"SF Mono,Fira Code,monospace", color:"#e0e8f0" }}>

      {/* ══ HERO — canvas is a real JSX element so it exists before useEffect ══ */}
      <div
        ref={heroRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",       // fixed height — canvas matches this exactly
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        {/* Layer 0 — swarm canvas fills the full hero */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0, left: 0,
            width: "100%",
            height: "100%",
            display: "block",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {/* Layer 1 — radial dark centre so text is readable */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          background: "radial-gradient(ellipse 75% 65% at 50% 50%, rgba(2,4,8,0.60) 0%, rgba(2,4,8,0.20) 65%, transparent 100%)",
        }} />

        {/* Layer 1b — top/bottom vignette */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          background: "linear-gradient(to bottom, rgba(2,4,8,0.55) 0%, transparent 20%, transparent 78%, rgba(2,4,8,0.65) 100%)",
        }} />

        {/* Layer 2 — all content */}
        <div style={{ position:"relative", zIndex:2, width:"100%", display:"flex", flexDirection:"column", alignItems:"center" }}>

          {/* Top badges */}
          <div style={{ position:"absolute", top:-8, left:0, display:"flex", gap:6 }}>
            <span style={{ fontSize:10, color:"#00ff88", border:"1px solid #00ff88", padding:"3px 10px", borderRadius:4 }}>EN</span>
            <a href="/es" style={{ fontSize:10, color:"#3a6080", textDecoration:"none", border:"1px solid #0d2035", padding:"3px 10px", borderRadius:4 }}>ES</a>
          </div>
          <div style={{ position:"absolute", top:-8, right:0, background:"#FFD16615", border:"1px solid #FFD166", borderRadius:4, padding:"4px 12px", fontSize:10, fontWeight:700, color:"#FFD166", letterSpacing:2 }}>PRIVATE BETA</div>

          {/* Logo */}
          <div style={{ marginBottom:24, marginTop:32 }}><SwarmLogo /></div>

          {/* Headline */}
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:16 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"#00ff88", boxShadow:"0 0 8px #00ff88" }}/>
              <span style={{ fontSize:11, color:"#00ff88", letterSpacing:1 }}>SWARM ENGINE LIVE</span>
              <div style={{ width:1, height:12, background:"#0d2035" }}/>
              <span style={{ fontSize:11, color:"#3a6080" }}>1200+ on waitlist</span>
            </div>
            <div style={{ maxWidth:520, margin:"0 auto 12px" }}>
              <h1 style={{ fontSize:20, fontWeight:700, color:"#e0e8f0", lineHeight:1.4, margin:0 }}>
                AI stock prediction powered by<br/>
                <span style={{ color:"#00ff88" }}>2.4 million swarm agents</span>
              </h1>
            </div>
            <div style={{ maxWidth:460, margin:"0 auto 20px", fontSize:12, color:"#8ab0cc", lineHeight:1.8 }}>
              Modelled on fish schooling behaviour. Each agent has its own risk appetite, mood and social influence. When the school turns — that is your signal.
            </div>

            {/* Stats */}
            <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
              {[["83.3%","LIVE ACCURACY"],["423","SIGNALS LOGGED"],["GPT-5 +14.6%","BEATS AI"],["166+","ASSETS"]].map(([v,l]) => (
                <div key={l} style={{ background:"rgba(5,13,26,0.80)", border:"1px solid #0d2035", borderRadius:8, padding:"10px 18px", textAlign:"center" }}>
                  <div style={{ fontSize:16, fontWeight:700, color:"#FFD166", marginBottom:2 }}>{v}</div>
                  <div style={{ fontSize:9, color:"#3a6080", letterSpacing:1 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Views ── */}
          {view === "landing" && (
            <div style={{ width:"100%", maxWidth:440 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                <button onClick={() => setView("waitlist")} style={{ padding:"14px", borderRadius:6, cursor:"pointer", background:"#00ff88", border:"none", color:"#030810", fontWeight:700, fontSize:12, letterSpacing:1, fontFamily:"inherit" }}>JOIN WAITLIST</button>
                <button onClick={() => setView("access")}   style={{ padding:"14px", borderRadius:6, cursor:"pointer", background:"transparent", border:"1px solid #00ff88", color:"#00ff88", fontWeight:700, fontSize:12, letterSpacing:1, fontFamily:"inherit" }}>I HAVE A CODE</button>
              </div>
              <div style={{ display:"flex", justifyContent:"center", gap:16, marginBottom:8, flexWrap:"wrap" }}>
                {[
                  ["/accuracy",    "#3a6080", "ACCURACY PROOF"],
                  ["/disclaimer",  "#3a6080", "DISCLAIMER"],
                  ["/network",     "#aa66ff", "AGENT NETWORK"],
                  ["/chart",       "#00ff88", "LIVE CHARTS"],
                  ["/compare",     "#FFD166", "TODAY VS YESTERDAY"],
                  ["/leaderboard", "#00aaff", "LEADERBOARD"],
                  ["/verify",      "#00ff88", "✅ DATA VERIFIED"],
                  ["/admin/monitoring", "#2a4a3a", "MONITORING"],
                  ["/backtest",         "#2a4a3a", "BACKTEST"],
                ].map(([href, color, label]) => (
                  <a key={label} href={href} style={{ fontSize:10, color, textDecoration:"none" }}>{label}</a>
                ))}
              </div>
              <div style={{ textAlign:"center", fontSize:10, color:"#1a3a5c" }}>Private beta — 20 active users — India + Chile</div>
            </div>
          )}

          {view === "waitlist" && (
            <div style={{ width:"100%", maxWidth:440, background:"rgba(5,13,26,0.90)", border:"1px solid #0d2035", borderRadius:10, padding:24 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#e0e8f0", letterSpacing:1, marginBottom:4 }}>JOIN THE WAITLIST</div>
              <div style={{ fontSize:10, color:"#3a6080", marginBottom:20 }}>We approve traders in batches of 20. You will receive a beta access code within 48 hours.</div>
              <input value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="your@email.com" style={{ width:"100%", background:"#030810", border:"1px solid #0d2035", borderRadius:4, padding:"10px 14px", color:"#e0e8f0", fontFamily:"inherit", fontSize:13, marginBottom:10, boxSizing:"border-box" as const }}/>
              {error && <div style={{ fontSize:10, color:"#ff4466", marginBottom:8 }}>{error}</div>}
              <button onClick={joinWaitlist} style={{ width:"100%", padding:"11px", borderRadius:4, cursor:"pointer", background:"#00ff88", border:"none", color:"#030810", fontWeight:700, fontSize:11, letterSpacing:2, fontFamily:"inherit", marginBottom:10 }}>REQUEST BETA ACCESS</button>
              <button onClick={() => setView("landing")} style={{ width:"100%", padding:"8px", borderRadius:4, cursor:"pointer", background:"transparent", border:"1px solid #0d2035", color:"#3a6080", fontSize:10, fontFamily:"inherit" }}>BACK</button>
            </div>
          )}

          {view === "joined" && (
            <div style={{ width:"100%", maxWidth:440, background:"rgba(0,42,24,0.92)", border:"1px solid #00ff88", borderRadius:10, padding:28, textAlign:"center" }}>
              <div style={{ width:12, height:12, borderRadius:"50%", background:"#00ff88", boxShadow:"0 0 12px #00ff88", margin:"0 auto 16px" }}/>
              <div style={{ fontSize:14, fontWeight:700, color:"#00ff88", letterSpacing:1, marginBottom:8 }}>YOU ARE ON THE LIST</div>
              <div style={{ fontSize:11, color:"#006644", lineHeight:1.8, marginBottom:16 }}>We will send your beta access code within 48 hours. India and Chile traders approved first.</div>
              <div style={{ fontSize:10, color:"#3a6080" }}>Follow Vinayraj George on LinkedIn for updates.</div>
            </div>
          )}

          {view === "access" && (
            <div style={{ width:"100%", maxWidth:440, background:"rgba(5,13,26,0.90)", border:"1px solid #0d2035", borderRadius:10, padding:24 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#e0e8f0", letterSpacing:1, marginBottom:4 }}>ENTER BETA CODE</div>
              <div style={{ fontSize:10, color:"#3a6080", marginBottom:20 }}>Enter the code received from Vinayraj to access the PREDIQ dashboard.</div>
              <input value={code} onChange={e => { setCode(e.target.value); setError(""); }} placeholder="XXXXXXXX" style={{ width:"100%", background:"#030810", border:"1px solid #0d2035", borderRadius:4, padding:"10px 14px", color:"#00ff88", fontFamily:"inherit", fontSize:16, fontWeight:700, letterSpacing:4, marginBottom:10, boxSizing:"border-box" as const, textTransform:"uppercase" as const }}/>
              {error && <div style={{ fontSize:10, color:"#ff4466", marginBottom:8 }}>{error}</div>}
              <button onClick={enterCode} disabled={validating} style={{ width:"100%", padding:"11px", borderRadius:4, cursor:"pointer", background:"transparent", border:"1px solid #00ff88", color:"#00ff88", fontWeight:700, fontSize:11, letterSpacing:2, fontFamily:"inherit", marginBottom:10, opacity: validating ? 0.6 : 1 }}>
                {validating ? "VERIFYING..." : "ENTER PREDIQ"}
              </button>
              <button onClick={() => setView("landing")} style={{ width:"100%", padding:"8px", borderRadius:4, cursor:"pointer", background:"transparent", border:"1px solid #0d2035", color:"#3a6080", fontSize:10, fontFamily:"inherit" }}>BACK</button>
            </div>
          )}

          {view === "entering" && (
            <div style={{ textAlign:"center" }}>
              <div style={{ width:12, height:12, borderRadius:"50%", background:"#00ff88", boxShadow:"0 0 16px #00ff88", margin:"0 auto 20px" }}/>
              <div style={{ fontSize:14, fontWeight:700, color:"#00ff88", letterSpacing:2, marginBottom:8 }}>CODE VERIFIED</div>
              <div style={{ fontSize:11, color:"#3a6080" }}>Entering the swarm...</div>
            </div>
          )}

        </div>{/* /content */}
      </div>{/* /hero */}

      {/* ── HIDDEN ADMIN LINK ── */}
      <div style={{ position:"fixed", bottom:28, right:8, zIndex:51 }}>
        <a href="/admin/monitoring" style={{ fontSize:9, color:"#1a3a1a", textDecoration:"none", opacity:0.6, letterSpacing:0 }} title="">©</a>
        <span style={{ fontSize:9, color:"#1a3a1a", opacity:0.4, letterSpacing:1, marginLeft:2 }}>PREDIQ</span>
      </div>

      {/* ── TICKER BAR ── */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#020609", borderTop:"1px solid #0d2035", padding:"5px 20px", display:"flex", gap:20, overflowX:"auto", zIndex:50 }}>
        {[["GOLD","$4,450","+0.28%",true],["WTI","$68.74","+2.69%",true],["HAL","Rs.3,842","+0.47%",true],["NIFTY50","Rs.22,483","+0.60%",true],["BTC","$87,340","+3.20%",true],["SILVER","$33.82","+3.68%",true]].map(([l,p,c,up]) => (
          <div key={l as string} style={{ display:"flex", gap:5, alignItems:"center", flexShrink:0, fontSize:10 }}>
            <span style={{ color:"#3a6080" }}>{l}</span>
            <span style={{ color:"#8ab0cc" }}>{p}</span>
            <span style={{ color:(up as boolean) ? "#00ff88" : "#ff4466" }}>{c}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
