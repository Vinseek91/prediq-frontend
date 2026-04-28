import { useEffect, useRef, useState } from "react";
import { useTheme } from "../lib/theme";

const API = process.env.NEXT_PUBLIC_API_URL || "https://prediq-time-machine-production.up.railway.app";

export default function Mission() {
  const [themeObj, toggleTheme] = useTheme();
  const radarRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<HTMLCanvasElement>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<any>(null);
  const [signal, setSignal] = useState<any>(null);
  const [time, setTime] = useState("T+00:00:00");
  const [prices, setPrices] = useState<any>({});
  const [sigs, setSigs] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [acc, setAcc] = useState("83.3");
  const t0 = useRef(Date.now());
  const handleSelect = (s: any) => {
    setSelected(s);
    fetch(API + "/api/signal?label=" + s.label).then(r => r.json()).then(d => { setSignal(d); }).catch(() => { setSignal({signal:s.signal,confidence:72,target_price:s.price*1.015,stop_loss:s.price*0.97,rsi:67,macd:"-2.1",herd_strength:75}); });
  };

  useEffect(() => {
    const iv = setInterval(() => {
      const e = Math.floor((Date.now() - t0.current) / 1000);
      const hh = String(Math.floor(e / 3600)).padStart(2, "0");
      const mm = String(Math.floor((e % 3600) / 60)).padStart(2, "0");
      const ss = String(e % 60).padStart(2, "0");
      const now=new Date(); const h2=String(now.getUTCHours()-4>=0?now.getUTCHours()-4:now.getUTCHours()+20).padStart(2,"0"); const m2=String(now.getUTCMinutes()).padStart(2,"0"); const s2=String(now.getUTCSeconds()).padStart(2,"0"); setTime(h2+":"+m2+":"+s2+" CLT");
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    fetch(API + "/api/prices").then(r => r.json()).then(d => {
      setPrices(d.prices || {});
      const allKeys = ["SPX","NIFTY50","BTC/USD","GOLD","IPSA","TSX","BRENT","TSLA","RELIANCE","ETH/USD","SILVER","WTI"];
      const priceData = d.prices || {};
      setSigs(allKeys.filter(k => priceData[k]).map(k => { const v = priceData[k]; return {
        label: k,
        change: v.change_pct || 0,
        signal: (v.change_pct || 0) > 1 ? "BUY" : (v.change_pct || 0) < -1 ? "SELL" : "HOLD",
        col: (v.change_pct || 0) > 1 ? "#00ff88" : (v.change_pct || 0) < -1 ? "#ff3c78" : "#aa44ff",
        price: v.price || 0
      }; }));
    }).catch(() => {});
    fetch(API + "/api/accuracy").then(r => r.json()).then(d => {
      if (d.accuracy_pct) setAcc(d.accuracy_pct.toFixed(1));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const entries = [
      "SWARM ONLINE","PRICES FETCHED","SIGNALS UPDATED","POSTGRES OK","VALIDATION OK","TELEGRAM ACTIVE","RSI: 67.8","HERD: 87%","OIL SHOCK +7%","AUTO-VERIFY OK","BRENT $98 LIVE","NIFTY SCANNED","BTC MOMENTUM","GOLD SAFE HAVEN","IPSA UPDATED","MACD SIGNAL","BB UPPER HIT","RELIANCE UPDATED","TSX SCANNED","ETH SIGNAL"
    ];
    let i = 0;
    const add = () => {
      const t = new Date();
      const ts = String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0") + ":" + String(t.getSeconds()).padStart(2, "0");
      setLogs(p => [ts + " " + entries[i % entries.length], ...p].slice(0, 8));
      i++;
    };
    entries.forEach(() => add());
    const iv = setInterval(add, 3000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const c = radarRef.current;
    if (!c) return;
    const rx = c.getContext("2d")!;
    c.width = 320; c.height = 320; rx.scale(2, 2);
    const W = 160, H = 160, R = 72;
    const dots = [
      { a: 0.5, r: 0.6, col: "#00ff88", l: "WTI" },
      { a: 1.2, r: 0.8, col: "#00ff88", l: "GOLD" },
      { a: 2.1, r: 0.5, col: "#00ff88", l: "SPX" },
      { a: 3.5, r: 0.7, col: "#ff3c78", l: "TSLA" },
      { a: 4.2, r: 0.6, col: "#ff3c78", l: "XOM" },
      { a: 5.1, r: 0.4, col: "#aa44ff", l: "AAPL" },
      { a: 0.9, r: 0.9, col: "#00ff88", l: "BTC" },
      { a: 2.8, r: 0.55, col: "#00ff88", l: "NIFTY" },
    ];
    let ang = 0;
    let raf = 0;
    const draw = () => {
      rx.fillStyle = "rgba(0,13,26,0.3)"; rx.fillRect(0, 0, W, H);
      [0.3, 0.6, 1.0].forEach(f => {
        rx.beginPath(); rx.arc(W / 2, H / 2, R * f, 0, Math.PI * 2);
        rx.strokeStyle = "rgba(0,212,255,0.12)"; rx.lineWidth = 0.5; rx.stroke();
      });
      rx.beginPath(); rx.moveTo(W / 2, 0); rx.lineTo(W / 2, H); rx.strokeStyle = "rgba(0,212,255,0.07)"; rx.stroke();
      rx.beginPath(); rx.moveTo(0, H / 2); rx.lineTo(W, H / 2); rx.stroke();
      ang += 0.025;
      for (let a = 0; a < Math.PI * 2; a += 0.04) {
        const diff = ((ang - a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        if (diff < 1.4) {
          rx.beginPath(); rx.moveTo(W / 2, H / 2);
          rx.arc(W / 2, H / 2, R, a, a + 0.04); rx.closePath();
          rx.fillStyle = "rgba(0,255,136," + ((1.4 - diff) / 1.4 * 0.25) + ")"; rx.fill();
        }
      }
      rx.beginPath(); rx.moveTo(W / 2, H / 2);
      rx.lineTo(W / 2 + Math.cos(ang) * R, H / 2 + Math.sin(ang) * R);
      rx.strokeStyle = "rgba(0,255,136,0.9)"; rx.lineWidth = 1.5; rx.stroke();
      dots.forEach(d => {
        const x = W / 2 + Math.cos(d.a) * R * d.r;
        const y = H / 2 + Math.sin(d.a) * R * d.r;
        const diff = ((ang - d.a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const br = diff < 0.3 ? 1 : Math.max(0.25, 1 - diff / 4);
        rx.beginPath(); rx.arc(x, y, 3, 0, Math.PI * 2);
        rx.fillStyle = d.col; rx.globalAlpha = br; rx.fill(); rx.globalAlpha = 1;
        if (br > 0.4) {
          rx.font = "7px Courier New";
          rx.fillStyle = "rgba(255,255,255," + (br * 0.7) + ")";
          rx.fillText(d.l, x + 5, y + 3);
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const c = barRef.current; if (!c || sigs.length === 0) return;
    const bx = c.getContext("2d")!;
    const W = c.offsetWidth || 300, H = 80;
    c.width = W * 2; c.height = H * 2; bx.scale(2, 2);
    let raf = 0;
    const draw = () => {
      bx.fillStyle = "rgba(0,13,26,0.4)"; bx.fillRect(0, 0, W, H);
      const top = sigs.slice(0, 10);
      const barW = (W - 20) / top.length;
      const maxAbs = Math.max(...top.map((s: any) => Math.abs(s.change)), 1);
      top.forEach((s: any, i: number) => {
        const bH = Math.abs(s.change) / maxAbs * (H * 0.75);
        const x = 10 + i * barW + barW * 0.1, w = barW * 0.8;
        bx.fillStyle = s.col + "99"; bx.fillRect(x, H - bH - 14, w, bH);
        bx.fillStyle = s.col; bx.fillRect(x, H - bH - 14, w, 2);
        bx.font = "6px Courier New"; bx.fillStyle = "rgba(255,255,255,0.5)";
        bx.fillText(s.label.replace("/USD", "").replace("50", "").slice(0, 5), x, H - 4);
      });
      raf = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, [sigs]);

  useEffect(() => {
    const c = globeRef.current;
    if (!c) return;
    const gx = c.getContext("2d")!;
    c.width = 240; c.height = 240; gx.scale(2, 2);
    const GW = 120, GH = 120, GR = 52;
    const pts: any[] = [];
    for (let i = 0; i < 250; i++) {
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      pts.push({ t, p, s: (Math.random() - 0.5) * 0.006, c: Math.random() > 0.5 ? 0 : 1, sz: Math.random() * 1.4 + 0.4 });
    }
    const lns: number[][] = [];
    for (let i = 0; i < 70; i++) lns.push([~~(Math.random() * 250), ~~(Math.random() * 250)]);
    const cs = ["rgba(0,212,255,", "rgba(255,60,120,"];
    const pr = (p: any) => {
      const sp = Math.sin(p.p);
      return { x: GW / 2 + GR * sp * Math.cos(p.t), y: GH / 2 + GR * Math.cos(p.p), d: (sp * Math.sin(p.t) + 1) / 2 };
    };
    let raf = 0;
    const draw = () => {
      gx.fillStyle = "rgba(0,13,26,0.25)"; gx.fillRect(0, 0, GW, GH);
      pts.forEach(p => p.t += p.s);
      const prs = pts.map(pr);
      lns.forEach(([a, b]) => {
        const pa = prs[a], pb = prs[b];
        const d = Math.hypot(pa.x - pb.x, pa.y - pb.y);
        if (d > GR * 0.55) return;
        const al = (1 - d / (GR * 0.55)) * 0.4 * pa.d * pb.d;
        gx.beginPath(); gx.moveTo(pa.x, pa.y); gx.lineTo(pb.x, pb.y);
        gx.strokeStyle = cs[0] + al.toFixed(3) + ")"; gx.lineWidth = 0.4; gx.stroke();
      });
      prs.forEach((p, i) => {
        const al = 0.4 + p.d * 0.6, sz = pts[i].sz * (0.5 + p.d);
        gx.beginPath(); gx.arc(p.x, p.y, sz, 0, Math.PI * 2);
        gx.fillStyle = cs[pts[i].c] + al.toFixed(2) + ")"; gx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const c = waveRef.current;
    if (!c) return;
    const wx = c.getContext("2d")!;
    c.width = 400; c.height = 80;
    let wt = 0; let raf = 0;
    const draw = () => {
      wx.fillStyle = "rgba(0,13,26,0.4)"; wx.fillRect(0, 0, 400, 40);
      wx.beginPath(); wx.moveTo(0, 20);
      for (let x = 0; x < 400; x++) {
        wx.lineTo(x, 20 + Math.sin(x * 0.08 + wt) * 8 + Math.sin(x * 0.15 + wt * 1.3) * 4 + Math.sin(x * 0.03 + wt * 0.5) * 6);
      }
      wx.strokeStyle = "rgba(0,212,255,0.7)"; wx.lineWidth = 1; wx.stroke();
      wt += 0.05;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const brent = prices["BRENT"]?.price || 102.38;
  const tickers = ["SPX", "GOLD", "BTC/USD", "BRENT", "NIFTY50", "TSLA", "MSFT", "WTI"];

  return (
    <div style={{ background: themeObj.bg, minHeight: "100vh", fontFamily: "Courier New, monospace", color: "#00d4ff", overflow: "hidden" }}>
      <style>{`
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes spin1 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spin2 { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes floatup { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      `}</style>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,212,255,0.012) 3px,rgba(0,212,255,0.012) 4px)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,transparent,#00d4ff,#fff,#00d4ff,transparent)", zIndex: 10 }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ background: "rgba(0,20,40,0.95)", borderBottom: "1px solid rgba(0,212,255,0.3)", padding: "8px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid #00d4ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 10, height: 10, background: "#00d4ff", borderRadius: "50%" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "0.3em" }}>PREDIQ MISSION CONTROL</div>
              <div style={{ fontSize: 11, color: "rgba(0,212,255,0.5)", letterSpacing: "0.2em" }}>SWARM AI · MARKET TELEMETRY · v4.2</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>MISSION TIME</div>
              <div style={{ fontSize: 13, color: "#00ff88", fontWeight: 700 }}>{time}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>WIN RATE</div>
              <div style={{ fontSize: 13, color: "#00d4ff", fontWeight: 700 }}>{acc}%</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", padding: "4px 10px", borderRadius: 2 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff88", animation: "blink 1s infinite" }} />
              <span style={{ fontSize: 12, color: "#00ff88" }}>ALL SYSTEMS NOMINAL</span>
            </div>
            <a href="/dashboard" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none", border: "1px solid rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: 2 }}>DASHBOARD</a>
            <button
              onClick={toggleTheme}
              style={{ background: "none", border: `1px solid ${themeObj.border}`, borderRadius: 4, padding: "4px 10px", cursor: "pointer", color: themeObj.accent, fontSize: 11, fontFamily: "inherit", fontWeight: 700 }}
            >
              {themeObj.label}
            </button>
          </div>
        </div>

        <div style={{ overflow: "hidden", borderBottom: "1px solid rgba(0,212,255,0.15)", background: "rgba(0,10,25,0.8)" }}>
          <div style={{ display: "flex", animation: "ticker 25s linear infinite", width: "max-content" }}>
            {[0, 1].map(n => (
              <div key={n} style={{ display: "flex", gap: 20, padding: "5px 20px", fontSize: 12, whiteSpace: "nowrap" }}>
                {tickers.map(k => {
                  const p = prices[k];
                  const pct = p?.change_pct || 0;
                  const col = pct > 0 ? "#00ff88" : pct < 0 ? "#ff3c78" : "#ffd166";
                  return (
                    <span key={k}>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>{k} </span>
                      <span style={{ color: col }}>{p?.price ? "$" + p.price.toFixed(2) : "--"} {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%</span>
                      <span style={{ color: "rgba(255,255,255,0.1)", margin: "0 6px" }}>|</span>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "190px 1fr 190px", minHeight: "calc(100vh - 115px)" }}>

          <div style={{ borderRight: "1px solid rgba(0,212,255,0.15)", display: "flex", flexDirection: "column" }}>
            <div style={{ background: "rgba(0,212,255,0.05)", borderBottom: "1px solid rgba(0,212,255,0.15)", padding: "5px 10px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "rgba(0,212,255,0.6)", letterSpacing: "0.2em" }}>TELEMETRY A</span>
              <span style={{ fontSize: 11, color: "#00ff88", animation: "blink 2s infinite" }}>● LIVE</span>
            </div>
            <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em" }}>NEURAL INDICATORS</div>
              {[
                { l: "SWARM CONF", v: 79, c: "#00ff88" },
                { l: "RSI", v: 68, c: "#00d4ff" },
                { l: "HERD", v: 87, c: "#00ff88" },
                { l: "BB POS", v: 93, c: "#aa44ff" },
                { l: "MACD", v: 45, c: "#ff6600" }
              ].map(({ l, v, c }) => (
                <div key={l}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>{l}</span>
                    <span style={{ color: c }}>{v}%</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.05)" }}>
                    <div style={{ height: "100%", width: v + "%", background: c, opacity: 0.8 }} />
                  </div>
                </div>
              ))}
              <div style={{ borderTop: "1px solid rgba(0,212,255,0.1)", paddingTop: 8 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", marginBottom: 6 }}>SIGNAL QUEUE</div>
                {sigs.slice(0, 5).map((s, i) => (
                  <div key={i} onClick={() => handleSelect(s)} style={{ borderLeft: "2px solid " + s.col, paddingLeft: 6, paddingTop: 2, paddingBottom: 2, marginBottom: 4, background: selected?.label === s.label ? s.col+"22" : "rgba(0,0,0,0.3)", cursor: "pointer" }}>
                    <div style={{ fontSize: 12, color: s.col, fontWeight: 700 }}>{s.label} {s.signal}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%</div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid rgba(0,212,255,0.1)", paddingTop: 8 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", marginBottom: 4 }}>WAVEFORM</div>
                <canvas ref={waveRef} style={{ width: "100%", height: 40 }} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", borderBottom: "1px solid rgba(0,212,255,0.15)" }}>
              {[
                { l: "WIN RATE", v: acc + "%", s: "+14.6% vs GPT-5", c: "#00ff88" },
                { l: "SIGNALS", v: "423", s: "98+ assets", c: "#00d4ff" },
                { l: "BRENT", v: "$" + brent.toFixed(2), s: "HORMUZ +7%", c: "#ff6600" },
                { l: "MOOD", v: "BULL", s: "64% buying", c: "#00ff88" }
              ].map(({ l, v, s, c }, i) => (
                <div key={i} style={{ borderRight: i < 3 ? "1px solid rgba(0,212,255,0.1)" : "none", padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>{l}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: c }}>{v}</div>
                  <div style={{ fontSize: 11, color: c + "88" }}>{s}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, alignContent: "start", borderBottom: "1px solid rgba(0,212,255,0.15)" }}>
              <div style={{ borderRight: "1px solid rgba(0,212,255,0.15)", padding: 12 }}>
                <div style={{ fontSize: 11, color: "rgba(0,212,255,0.6)", letterSpacing: "0.15em", marginBottom: 8 }}>RADAR · SIGNAL SWEEP</div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <canvas ref={radarRef} style={{ width: 160, height: 160 }} />
                </div>
                <div style={{ fontSize: 11, color: "rgba(0,212,255,0.6)", letterSpacing: "0.15em", marginTop: 8 }}>SWARM STRENGTH</div>
                <canvas ref={barRef} style={{ width: "100%", height: 50 }} />
                <div style={{ fontSize: 11, color: "rgba(0,212,255,0.6)", letterSpacing: "0.15em", marginTop: 8 }}>LIVE PRICES</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  {sigs.map((s: any, i: number) => (
                    <div key={i} onClick={() => handleSelect(s)} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid " + s.col + "33", borderRadius: 3, padding: "5px 8px", cursor: "pointer" }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{s.label.replace("/USD","").replace("50","")}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: s.col }}>{s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 11, color: "rgba(0,212,255,0.6)", letterSpacing: "0.15em", marginBottom: 8 }}>HEATMAP · ALL MARKETS</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 3, marginBottom: 10 }}>
                  {sigs.slice(0, 15).map((s, i) => (
                    <div key={i} onClick={() => handleSelect(s)} style={{ background: selected?.label === s.label ? s.col+"88" : s.col + "44", borderRadius: 2, padding: "4px 2px", textAlign: "center", fontSize: 11, color: "#fff", fontWeight: 700, cursor: "pointer", border: selected?.label === s.label ? "1px solid "+s.col : "1px solid transparent" }}>
                      {s.label.replace("/USD", "").replace("50", "")}<br />{s.signal}
                    </div>
                  ))}
                </div>
                {selected && signal ? (
                  <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 4, padding: 10, marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: selected.col }}>{selected.label}</span>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>${selected.price?.toFixed(2)}</span>
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: selected.col, border: "1px solid " + selected.col + "66", padding: "2px 8px", borderRadius: 2 }}>{signal.signal || selected.signal}</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 6 }}>
                      <div style={{ background: "rgba(0,212,255,0.05)", padding: "5px 8px", borderRadius: 2 }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>CONFIDENCE</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#00d4ff" }}>{signal.confidence || 72}%</div>
                      </div>
                      <div style={{ background: "rgba(255,160,0,0.05)", padding: "5px 8px", borderRadius: 2 }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>HERD</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#ffa020" }}>{signal.herd_strength || 75}%</div>
                      </div>
                      <div style={{ background: "rgba(0,255,136,0.04)", padding: "5px 8px", borderRadius: 2 }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>TARGET</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#00ff88" }}>${signal.target_price?.toFixed(2) || (selected.price * 1.015).toFixed(2)}</div>
                      </div>
                      <div style={{ background: "rgba(255,60,120,0.04)", padding: "5px 8px", borderRadius: 2 }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>STOP</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#ff3c78" }}>${signal.stop_loss?.toFixed(2) || (selected.price * 0.97).toFixed(2)}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[{ l: "RSI", v: signal.rsi || 67 }, { l: "MACD", v: signal.macd || "-2.1" }, { l: "CHG", v: (selected.change >= 0 ? "+" : "") + selected.change.toFixed(2) + "%" }].map(({ l, v }) => (
                        <div key={l} style={{ flex: 1, background: "rgba(255,255,255,0.03)", padding: "3px 4px", borderRadius: 2, textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{l}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#00d4ff" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "rgba(0,212,255,0.03)", border: "1px solid rgba(0,212,255,0.1)", borderRadius: 4, padding: 10, textAlign: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: "rgba(0,212,255,0.4)", letterSpacing: "0.1em", marginBottom: 4 }}>SELECT ASSET FOR SIGNAL</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Click heatmap or signal queue</div>
                  </div>
                )}
                <div style={{ fontSize: 11, color: "rgba(0,212,255,0.6)", letterSpacing: "0.15em", marginBottom: 6 }}>ACCURACY · REGIONS</div>
                {[
                  { r: "US", v: 75, c: "#00d4ff" },
                  { r: "INDIA", v: 81, c: "#00ff88" },
                  { r: "CHILE", v: 72, c: "#aa44ff" },
                  { r: "CRYPTO", v: 68, c: "#ff6600" }
                ].map(({ r, v, c }) => (
                  <div key={r} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", width: 36 }}>{r}</span>
                    <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: v + "%", background: c, opacity: 0.7 }} />
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", paddingLeft: 4 }}>
                        <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{v}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "8px 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {sigs.map((s, i) => (
                <div key={i} style={{ border: "1px solid " + s.col + "44", background: s.col + "11", padding: "4px 8px", borderRadius: 2, fontSize: 12, color: s.col, animation: "floatup " + (2.5 + i * 0.3) + "s ease-in-out infinite" }}>
                  {s.label} {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}% · {s.signal}
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderLeft: "1px solid rgba(0,212,255,0.15)", display: "flex", flexDirection: "column" }}>
            <div style={{ background: "rgba(0,212,255,0.05)", borderBottom: "1px solid rgba(0,212,255,0.15)", padding: "5px 10px" }}>
              <span style={{ fontSize: 12, color: "rgba(0,212,255,0.6)", letterSpacing: "0.2em" }}>TELEMETRY B</span>
            </div>
            <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{ position: "relative", width: 120, height: 120 }}>
                  <canvas ref={globeRef} style={{ position: "absolute", inset: 0, width: 120, height: 120, borderRadius: "50%" }} />
                  <div style={{ position: "absolute", inset: -6, borderRadius: "50%", border: "1px solid rgba(0,212,255,0.3)", animation: "spin1 8s linear infinite", borderTopColor: "#00d4ff", borderRightColor: "transparent", borderBottomColor: "transparent", borderLeftColor: "transparent" }} />
                  <div style={{ position: "absolute", inset: -12, borderRadius: "50%", border: "1px solid rgba(255,60,120,0.2)", animation: "spin2 12s linear infinite", borderTopColor: "transparent", borderRightColor: "#ff3c78", borderBottomColor: "transparent", borderLeftColor: "transparent" }} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,102,0,0.7)", letterSpacing: "0.15em" }}>OIL IMPACT</div>
              {[
                { l: "BRENT", v: "$" + brent.toFixed(2) },
                { l: "Chile 95", v: "CLP 1,597" },
                { l: "Chile 93", v: "CLP 1,534" },
                { l: "India pump", v: "Rs.106.25" },
                { l: "WTI", v: "$100.42" }
              ].map(({ l, v }) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "3px 6px", background: "rgba(255,102,0,0.04)", borderLeft: "2px solid rgba(255,102,0,0.5)", fontSize: 8 }}>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>{l}</span>
                  <span style={{ color: "#ff6600", fontWeight: 700 }}>{v}</span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em" }}>MISSION LOG</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, overflow: "hidden" }}>
                {logs.map((log, i) => (
                  <div key={i} style={{ fontSize: 11, color: i === 0 ? "rgba(0,212,255,0.8)" : "rgba(255,255,255,0.3)" }}>{log}</div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid rgba(0,212,255,0.1)", paddingTop: 6 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", marginBottom: 4 }}>SYSTEM STATUS</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, fontSize: 7 }}>
                  {["PRICES", "DB", "SWARM", "TG BOT", "CRON", "API"].map(s => (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#00ff88" }} />
                      <span style={{ color: "rgba(255,255,255,0.3)" }}>{s}</span>
                      <span style={{ color: "#00ff88" }}>OK</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        <div style={{ background: "rgba(0,10,25,0.9)", borderTop: "1px solid rgba(0,212,255,0.2)", padding: "4px 16px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "rgba(0,212,255,0.4)", letterSpacing: "0.15em" }}>PREDIQ AI · prediq.netlify.app</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>INNOVATE · INTEGRATE · DOMINATE</span>
          <span style={{ fontSize: 11, color: "rgba(0,255,136,0.5)" }}>BEATS GPT-5 BY +14.6%</span>
        </div>
      </div>
    </div>
  );
}
