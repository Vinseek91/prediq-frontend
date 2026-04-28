import { useEffect, useState, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://prediq-time-machine-production.up.railway.app";

type VerifyResult = {
  label: string;
  status: "VERIFIED" | "WARNING" | "ERROR" | "FALLBACK" | "NO_TICKER" | "NO_REF";
  our_price: number;
  ref_price?: number;
  diff_pct?: number;
  verified_at?: string;
  error?: string;
};

type VerifyResponse = {
  verification_log: Record<string, VerifyResult>;
  total_checked: number;
  verified: number;
  warnings: number;
  errors: number;
  fallbacks: number;
  timestamp: string;
};

const KEY_ASSETS = [
  "NIFTY50","SENSEX","NIFTYBANK","TCS","INFY","RELIANCE","HDFC","WIPRO","HAL",
  "AAPL","MSFT","GOOGL","AMZN","NVIDIA","TSLA","META","SPX","DOW","NASDAQ",
  "GOLD","SILVER","BTC/USD","ETH/USD","WTI","BRENT",
  "SQM","FALABELLA","IPSA","LATAM",
  "RY","SHOP","TSX","TD","ENB",
];

const STATUS_COLOR: Record<string, string> = {
  VERIFIED: "#00ff88",
  WARNING:  "#FFD166",
  ERROR:    "#ff4466",
  FALLBACK: "#aa66ff",
  NO_TICKER:"#3a6080",
  NO_REF:   "#3a6080",
};

const STATUS_BG: Record<string, string> = {
  VERIFIED: "rgba(0,255,136,0.08)",
  WARNING:  "rgba(255,209,102,0.08)",
  ERROR:    "rgba(255,68,102,0.08)",
  FALLBACK: "rgba(170,102,255,0.08)",
  NO_TICKER:"rgba(58,96,128,0.08)",
  NO_REF:   "rgba(58,96,128,0.08)",
};

export default function VerifyPage() {
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [individual, setIndividual] = useState<Record<string, VerifyResult>>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("");
  const [filter, setFilter] = useState<"all"|"VERIFIED"|"WARNING"|"ERROR"|"FALLBACK">("all");

  const runScan = useCallback(async () => {
    setScanning(true);
    try {
      // Trigger bulk scan
      const res = await fetch(`${API}/api/verify`);
      const d = await res.json();
      setData(d);

      // Also individually verify key assets
      const results: Record<string, VerifyResult> = { ...d.verification_log };
      await Promise.all(KEY_ASSETS.map(async (label) => {
        if (!results[label]) {
          try {
            const r = await fetch(`${API}/api/verify/${label}`);
            const v = await r.json();
            results[label] = v;
          } catch {}
        }
      }));
      setIndividual(results);
      setUpdatedAt(new Date().toLocaleTimeString());
    } catch (e) {}
    setScanning(false);
    setLoading(false);
  }, []);

  useEffect(() => { runScan(); }, [runScan]);

  const allResults = Object.values(individual);
  const filtered = filter === "all" ? allResults : allResults.filter(r => r.status === filter);
  const verified = allResults.filter(r => r.status === "VERIFIED").length;
  const warnings = allResults.filter(r => r.status === "WARNING").length;
  const errors   = allResults.filter(r => r.status === "ERROR").length;
  const fallbacks= allResults.filter(r => r.status === "FALLBACK" || r.status === "NO_TICKER").length;
  const total    = allResults.length;
  const accuracy = total > 0 ? Math.round((verified / total) * 100) : 0;

  const S: Record<string, React.CSSProperties> = {
    page:  { background:"#02070c", minHeight:"100vh", fontFamily:"SF Mono,Fira Code,monospace", color:"#e0e8f0", padding:20 },
    nav:   { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, paddingBottom:12, borderBottom:"1px solid #0d2035" },
    logo:  { fontSize:14, fontWeight:700, color:"#FFD166", letterSpacing:3 },
    back:  { fontSize:9, color:"#3a6080", textDecoration:"none", border:"1px solid #0d2035", padding:"4px 10px", borderRadius:3 },
    cards: { display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginBottom:16 },
    card:  { background:"#060d18", border:"1px solid #0d2035", borderRadius:8, padding:"12px 14px" },
    clbl:  { fontSize:9, color:"#3a6080", letterSpacing:1, marginBottom:4 },
    cval:  { fontSize:20, fontWeight:700, lineHeight:1 },
    tabs:  { display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" as const },
    hdr:   { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 },
    table: { width:"100%", borderCollapse:"collapse" as const, fontSize:11 },
    th:    { padding:"8px 10px", textAlign:"left" as const, fontSize:9, color:"#3a6080", letterSpacing:1, borderBottom:"1px solid #0d2035", fontWeight:400 },
    td:    { padding:"7px 10px", borderBottom:"1px solid #060d18", verticalAlign:"middle" as const },
    wrap:  { border:"1px solid #0d2035", borderRadius:8, overflow:"hidden" },
  };

  const TABS = ["all","VERIFIED","WARNING","ERROR","FALLBACK"];

  return (
    <div style={S.page}>
      {/* Nav */}
      <div style={S.nav}>
        <div style={S.logo}>PREDIQ<span style={{color:"#E63946"}}>.</span> <span style={{fontSize:10,color:"#3a6080",fontWeight:400}}>AI VERIFICATION ENGINE</span></div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          {updatedAt && <span style={{fontSize:9,color:"#3a6080"}}>last scan {updatedAt}</span>}
          <a href="/" style={S.back}>← HOME</a>
        </div>
      </div>

      {/* Summary cards */}
      <div style={S.cards}>
        <div style={S.card}>
          <div style={S.clbl}>DATA ACCURACY</div>
          <div style={{...S.cval, color: accuracy>=90?"#00ff88":accuracy>=70?"#FFD166":"#ff4466"}}>{loading?"--":accuracy+"%"}</div>
          <div style={{fontSize:10,color:"#3a6080",marginTop:3}}>{total} assets checked</div>
        </div>
        <div style={S.card}>
          <div style={S.clbl}>✅ VERIFIED</div>
          <div style={{...S.cval, color:"#00ff88"}}>{loading?"--":verified}</div>
          <div style={{fontSize:10,color:"#3a6080",marginTop:3}}>within 1% of exchange</div>
        </div>
        <div style={S.card}>
          <div style={S.clbl}>⚠️ WARNING</div>
          <div style={{...S.cval, color:"#FFD166"}}>{loading?"--":warnings}</div>
          <div style={{fontSize:10,color:"#3a6080",marginTop:3}}>1-3% discrepancy</div>
        </div>
        <div style={S.card}>
          <div style={S.clbl}>❌ ERROR</div>
          <div style={{...S.cval, color:"#ff4466"}}>{loading?"--":errors}</div>
          <div style={{fontSize:10,color:"#3a6080",marginTop:3}}>&gt;3% discrepancy</div>
        </div>
        <div style={S.card}>
          <div style={S.clbl}>🔄 FALLBACK</div>
          <div style={{...S.cval, color:"#aa66ff"}}>{loading?"--":fallbacks}</div>
          <div style={{fontSize:10,color:"#3a6080",marginTop:3}}>using static data</div>
        </div>
      </div>

      {/* Tabs + scan button */}
      <div style={S.hdr}>
        <div style={S.tabs}>
          {TABS.map(t => (
            <button key={t} onClick={() => setFilter(t as typeof filter)} style={{
              fontFamily:"inherit", fontSize:9, letterSpacing:1,
              padding:"4px 12px", borderRadius:20, cursor:"pointer",
              background: filter===t ? "#e0e8f0" : "transparent",
              color: filter===t ? "#02070c" : "#3a6080",
              border: "1px solid " + (filter===t ? "#e0e8f0" : "#0d2035"),
              fontWeight: filter===t ? 700 : 400,
            }}>{t.toUpperCase()}</button>
          ))}
        </div>
        <button onClick={runScan} disabled={scanning} style={{
          fontFamily:"inherit", fontSize:9, padding:"4px 14px",
          background: scanning?"transparent":"rgba(0,255,136,0.1)",
          border:"1px solid " + (scanning?"#0d2035":"#00ff88"),
          color: scanning?"#3a6080":"#00ff88",
          borderRadius:4, cursor:scanning?"not-allowed":"pointer",
        }}>
          {scanning ? "⟳ SCANNING..." : "⟳ RUN AI SCAN"}
        </button>
      </div>

      {/* Table */}
      <div style={S.wrap}>
        <table style={S.table}>
          <thead>
            <tr style={{background:"#060d18"}}>
              <th style={S.th}>ASSET</th>
              <th style={S.th}>STATUS</th>
              <th style={S.th}>PREDIQ PRICE</th>
              <th style={S.th}>EXCHANGE PRICE</th>
              <th style={S.th}>DIFFERENCE</th>
              <th style={S.th}>VERIFIED AT</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{...S.td, textAlign:"center", color:"#3a6080", padding:32}}>
                🤖 AI scanning {KEY_ASSETS.length} assets against exchange data...
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{...S.td, textAlign:"center", color:"#3a6080", padding:32}}>
                No results for this filter
              </td></tr>
            ) : filtered.map((r, i) => (
              <tr key={i} style={{background: i%2===0?"#02070c":"#040b14"}}>
                <td style={{...S.td, fontWeight:700, color:"#e0e8f0"}}>{r.label}</td>
                <td style={S.td}>
                  <span style={{
                    fontSize:9, padding:"2px 8px", borderRadius:4, fontWeight:700,
                    background: STATUS_BG[r.status]||"transparent",
                    color: STATUS_COLOR[r.status]||"#3a6080",
                    border:`1px solid ${STATUS_COLOR[r.status]||"#3a6080"}`,
                  }}>{r.status}</span>
                </td>
                <td style={{...S.td, color:"#e0e8f0"}}>{r.our_price > 0 ? r.our_price.toLocaleString() : "--"}</td>
                <td style={{...S.td, color:"#8ab0cc"}}>{r.ref_price ? r.ref_price.toLocaleString() : "--"}</td>
                <td style={{...S.td, color: r.diff_pct === undefined ? "#3a6080" : r.diff_pct < 1 ? "#00ff88" : r.diff_pct < 3 ? "#FFD166" : "#ff4466"}}>
                  {r.diff_pct !== undefined ? r.diff_pct.toFixed(3)+"%" : "--"}
                </td>
                <td style={{...S.td, color:"#3a6080", fontSize:9}}>
                  {r.verified_at ? new Date(r.verified_at).toLocaleTimeString() : "--"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{fontSize:9,color:"#1a3a5c",marginTop:12,textAlign:"center"}}>
        PREDIQ AI Verification Engine · Cross-checks prices against Yahoo Finance exchange data · Runs automatically every 30 min
      </div>
    </div>
  );
}
