import { useState, useEffect, useCallback, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://prediq-time-machine-production.up.railway.app";
const PASSWORD = "VINAY2026";
const SESSION_KEY = "prediq_admin_auth";

const C = {
  bg:      "#020408",
  surface: "#060f06",
  surface2:"#040c04",
  green:   "#00ff88",
  cyan:    "#00d4ff",
  amber:   "#ffa020",
  red:     "#ff3c78",
  purple:  "#aa44ff",
  border:  "#0e2a0e",
  muted:   "#2a5a3a",
  dim:     "#1a3a2a",
};
const F = '"Courier New", Courier, monospace';

// ── Chile time clock ──────────────────────────────────────────────────────────
function useChileTime() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const chile = new Date(now.toLocaleString("en-US", { timeZone: "America/Santiago" }));
      setT(chile.toLocaleTimeString("en-US", { hour12: false }) + " CLT");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

// ── Market schedule ───────────────────────────────────────────────────────────
const MARKETS = [
  { name: "India (IST)",  open: "09:15", close: "15:30", tz: "Asia/Kolkata",       color: C.amber  },
  { name: "Chile (CLT)",  open: "09:30", close: "17:30", tz: "America/Santiago",   color: C.cyan   },
  { name: "US (EST)",     open: "09:30", close: "16:00", tz: "America/New_York",   color: C.green  },
  { name: "Crypto (UTC)", open: "00:00", close: "23:59", tz: "UTC",                color: C.purple },
];

function isMarketOpen(tz: string, open: string, close: string): boolean {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  const weekday = now.getDay();
  if (weekday === 0 || weekday === 6) return tz === "UTC"; // crypto always open
  return mins >= oh * 60 + om && mins < ch * 60 + cm;
}

// ── Data types ────────────────────────────────────────────────────────────────
type Health = {
  status: string; db_connected: boolean; db: string;
  predictions_count: number; predictions_today: number; outcomes_count: number;
  latest_prediction_date: string; latest_outcome_date: string;
  tables_exist: { predictions: boolean; outcomes: boolean };
  railway_uptime?: string; last_store_india?: string; last_store_us?: string;
  accuracy_current?: number; beating_benchmark?: boolean;
  services?: { railway: boolean; netlify: boolean; telegram: boolean; auto_store: boolean; monitor_bot: boolean };
  error?: string;
};
type Stats = {
  summary: { total_predictions: number; wins: number; win_rate_pct: number; avg_magnitude_error_pct: number };
  by_region: { region: string; total: number; win_rate: number; avg_mag_error: number }[];
  by_sector: { asset_class: string; total: number; win_rate: number }[];
  recent_calls: { label: string; signal: string; confidence: number; predicted_pct: number; actual_pct: number; direction_correct: number; date: string }[];
};
type LoginEntry = { id: number; code: string; tier: string; ip: string; user_agent: string; logged_at: string; device: string; region: string };
type LoginData  = { total_today: number; total_all_time: number; sessions_24h: number; sessions_7d: number; logins: LoginEntry[]; error?: string };

// ── Password gate ─────────────────────────────────────────────────────────────
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [val, setVal] = useState("");
  const [denied, setDenied] = useState(false);
  const [shake, setShake] = useState(false);

  function attempt() {
    if (val.trim().toUpperCase() === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      onAuth();
    } else {
      setDenied(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setVal("");
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:F, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
      <div style={{ textAlign:"center", padding:40, maxWidth:360, width:"100%" }}>
        {/* PREDIQ logo + header */}
        <div style={{ marginBottom:36 }}>
          <div style={{ fontSize:28, fontWeight:700, color:"#ffd166", letterSpacing:6, marginBottom:4, textShadow:"0 0 24px rgba(255,209,102,0.4)" }}>
            PREDIQ
          </div>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:5, marginBottom:20 }}>TIME MACHINE</div>
          <div style={{ width:48, height:1, background:C.green, margin:"0 auto 20px", boxShadow:`0 0 8px ${C.green}` }} />
          <div style={{ fontSize:11, color:C.green, letterSpacing:5, textShadow:`0 0 12px ${C.green}` }}>
            MISSION CONTROL
          </div>
        </div>

        <div style={{ animation: shake ? "shake 0.6s" : "none" }}>
          <input
            type="password"
            placeholder="ENTER ACCESS CODE"
            value={val}
            onChange={e => { setVal(e.target.value); setDenied(false); }}
            onKeyDown={e => e.key === "Enter" && attempt()}
            autoFocus
            style={{
              width:"100%", boxSizing:"border-box",
              background:"#030d03", border:`1px solid ${denied ? C.red : C.border}`,
              color: denied ? C.red : C.green, fontFamily:F, fontSize:13,
              padding:"12px 16px", borderRadius:6, letterSpacing:3,
              outline:"none", marginBottom:10, textAlign:"center",
              boxShadow: denied ? `0 0 12px rgba(255,60,120,0.3)` : "none",
            }}
          />
          {denied && (
            <div style={{ fontSize:11, color:C.red, letterSpacing:3, marginBottom:10 }}>
              ACCESS DENIED — INVALID CODE
            </div>
          )}
          <button onClick={attempt} style={{
            width:"100%", padding:"11px", background:"rgba(0,255,136,0.1)",
            border:`1px solid ${C.green}`, color:C.green, fontFamily:F,
            fontSize:12, fontWeight:700, letterSpacing:3, cursor:"pointer",
            borderRadius:6, boxShadow:`0 0 12px rgba(0,255,136,0.15)`,
          }}>
            AUTHENTICATE
          </button>
        </div>

        <div style={{ marginTop:24, fontSize:9, color:C.dim, letterSpacing:2 }}>
          PREDIQ COMMAND CENTER · RESTRICTED
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function MonitoringPage() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
  }, []);

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;
  return <Dashboard />;
}

function Dashboard() {
  const chileTime = useChileTime();
  const [health, setHealth]     = useState<Health | null>(null);
  const [stats7,  setStats7]    = useState<Stats | null>(null);
  const [stats1,  setStats1]    = useState<Stats | null>(null);
  const [logins,  setLogins]    = useState<LoginData | null>(null);
  const [agentRuns, setAgentRuns] = useState<any[]>([]);
  const [agentOk,   setAgentOk]  = useState(false);
  const [loading, setLoading]   = useState(true);
  const [lastRefresh, setLast]  = useState<Date | null>(null);
  const [tick, setTick]         = useState(0);
  const timerRef                = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [h, s7, s1, lg, ar, ao] = await Promise.all([
        fetch(`${API}/api/admin/health`).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/validation/stats?days=7`).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/validation/stats?days=1`).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/admin/logins`, { headers: { "X-Admin-Secret": "prediq-admin-2026" } }).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/admin/agent-runs`, { headers: { "X-Admin-Secret": "prediq-admin-2026" } }).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/agent/health`).then(r => r.json()).then(d => d.status === "ok").catch(() => false),
      ]);
      if (h)  setHealth(h);
      if (s7) setStats7(s7);
      if (s1) setStats1(s1);
      if (lg) setLogins(lg);
      if (ar?.runs) setAgentRuns(ar.runs.slice(0, 10));
      setAgentOk(!!ao);
      setLast(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    timerRef.current = setInterval(() => { refresh(); setTick(t => t + 1); }, 30000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [refresh]);

  // Countdown to next refresh
  const [countdown, setCountdown] = useState(30);
  useEffect(() => {
    setCountdown(30);
    const id = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 30), 1000);
    return () => clearInterval(id);
  }, [tick, lastRefresh]);

  const dbOk      = health?.db_connected ?? false;
  const accuracy  = stats7?.summary?.win_rate_pct ?? 0;
  const today_n   = health?.predictions_today ?? 0;
  const total_n   = health?.predictions_count ?? 0;
  const services  = health?.services;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:F, color:"#fff", paddingBottom:40 }}>

      {/* ── TOP BAR ── */}
      <div style={{ background:C.surface2, borderBottom:`1px solid ${C.border}`, padding:"10px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <a href="/dashboard" style={{
            background:"rgba(0,255,136,0.06)", border:`1px solid ${C.border}`,
            color:C.muted, fontFamily:F, fontSize:10, fontWeight:700,
            letterSpacing:2, padding:"6px 12px", borderRadius:4, textDecoration:"none",
            whiteSpace:"nowrap",
          }}>← HOME</a>
          <div>
            <div style={{ fontSize:8, color:C.muted, letterSpacing:5 }}>▶ PREDIQ</div>
            <div style={{ fontSize:16, fontWeight:700, color:C.green, letterSpacing:4 }}>MISSION CONTROL</div>
          </div>
          <Dot color={dbOk ? C.green : C.red} pulse />
        </div>
        <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, color:C.muted, letterSpacing:2 }}>CHILE TIME</div>
            <div style={{ fontSize:14, fontWeight:700, color:C.cyan, letterSpacing:2 }}>{chileTime}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, color:C.muted, letterSpacing:2 }}>REFRESH IN</div>
            <div style={{ fontSize:14, fontWeight:700, color:C.amber }}>{countdown}s</div>
          </div>
          <button onClick={refresh} disabled={loading} style={{
            background:"rgba(0,255,136,0.08)", border:`1px solid ${C.green}`,
            color:C.green, fontFamily:F, fontSize:10, fontWeight:700,
            letterSpacing:2, padding:"6px 14px", borderRadius:4, cursor:loading?"wait":"pointer",
          }}>
            {loading ? "●●●" : "↺ SYNC"}
          </button>
        </div>
      </div>

      <div style={{ padding:"20px 24px", maxWidth:1280, margin:"0 auto" }}>

        {/* ── STATUS CARDS ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10, marginBottom:20 }}>
          <StatCard label="DB STATUS"          value={dbOk?"ONLINE":"ERROR"}         color={dbOk?C.green:C.red} />
          <StatCard label="PREDICTIONS TODAY"  value={String(today_n)}               color={today_n>=5?C.green:C.amber} />
          <StatCard label="TOTAL PREDICTIONS"  value={String(total_n)}               color={C.cyan} />
          <StatCard label="7-DAY ACCURACY"     value={accuracy?`${accuracy}%`:"—"}  color={accuracy>=70?C.green:accuracy>=60?C.amber:C.red} />
          <StatCard label="OUTCOMES"           value={String(health?.outcomes_count??0)} color={C.cyan} />
          <StatCard label="LATEST PRED DATE"   value={health?.latest_prediction_date?.slice(5)??"—"} color={C.muted} />
        </div>

        {/* ── ROW 1: Services + Market Schedule ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>

          {/* Services */}
          <Panel title="SERVICES STATUS">
            {[
              { name:"Railway API",  ok: dbOk,                          key:"railway"    },
              { name:"PostgreSQL",   ok: health?.db_connected??false,   key:"db"         },
              { name:"Auto-Store",   ok: today_n>0,                     key:"auto_store" },
              { name:"Monitor Bot",  ok: services?.monitor_bot??false,   key:"monitor_bot"},
              { name:"Telegram",     ok: services?.telegram??false,      key:"telegram"   },
              { name:"Netlify",      ok: true,                           key:"netlify"    },
              { name:"AI Analyst",   ok: services?.railway ?? false,      key:"ai_analyst" },
              { name:"CEO Agent",    ok: agentOk,                         key:"ceo_agent"  },
            ].map(s => (
              <div key={s.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:11, color:C.muted, letterSpacing:1 }}>{s.name}</span>
                <span style={{ fontSize:10, fontWeight:700, color:s.ok?C.green:C.red, letterSpacing:2 }}>
                  {s.ok ? "● ONLINE" : "● OFFLINE"}
                </span>
              </div>
            ))}
            {health?.error && <div style={{ marginTop:8, fontSize:10, color:C.red }}>ERR: {health.error}</div>}
          </Panel>

          {/* Market Schedule */}
          <Panel title="MARKET SCHEDULE">
            {MARKETS.map(m => {
              const open = isMarketOpen(m.tz, m.open, m.close);
              return (
                <div key={m.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize:11, color:"#fff", letterSpacing:1 }}>{m.name}</div>
                    <div style={{ fontSize:9, color:C.muted, letterSpacing:1 }}>{m.open} – {m.close}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <Dot color={open ? m.color : C.dim} pulse={open} />
                    <span style={{ fontSize:10, fontWeight:700, color:open?m.color:C.muted, letterSpacing:2 }}>
                      {open ? "OPEN" : "CLOSED"}
                    </span>
                  </div>
                </div>
              );
            })}
          </Panel>
        </div>

        {/* ── ROW 2: Accuracy by Region + Today's Pipeline ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>

          {/* Accuracy by region (7d) */}
          <Panel title="ACCURACY BY REGION · 7 DAYS">
            {stats7?.by_region?.length ? (
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                <thead>
                  <tr style={{ fontSize:9, color:C.muted, letterSpacing:2 }}>
                    <th style={{ textAlign:"left", paddingBottom:8 }}>REGION</th>
                    <th style={{ textAlign:"right", paddingBottom:8 }}>SIGNALS</th>
                    <th style={{ textAlign:"right", paddingBottom:8 }}>WIN RATE</th>
                    <th style={{ textAlign:"right", paddingBottom:8, width:80 }}>BAR</th>
                  </tr>
                </thead>
                <tbody>
                  {stats7.by_region.map(r => {
                    const pct = r.win_rate ?? 0;
                    const col = pct >= 70 ? C.green : pct >= 55 ? C.amber : C.red;
                    return (
                      <tr key={r.region} style={{ borderTop:`1px solid ${C.border}` }}>
                        <td style={{ padding:"5px 0", color:"#fff" }}>{r.region}</td>
                        <td style={{ textAlign:"right", color:C.muted }}>{r.total}</td>
                        <td style={{ textAlign:"right", color:col, fontWeight:700 }}>{pct}%</td>
                        <td style={{ textAlign:"right", paddingLeft:10 }}>
                          <div style={{ background:C.dim, borderRadius:2, height:6, width:70 }}>
                            <div style={{ width:`${Math.min(pct,100)}%`, height:"100%", background:col, borderRadius:2, boxShadow:`0 0 4px ${col}` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : <Placeholder />}
          </Panel>

          {/* Today's pipeline */}
          <Panel title="TODAY'S PREDICTION PIPELINE">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              {[
                { label:"India",  count: stats1?.by_region?.find(r=>r.region==="India")?.total ?? 0,  color:C.amber  },
                { label:"US",     count: stats1?.by_region?.find(r=>r.region==="US")?.total ?? 0,    color:C.green  },
                { label:"Chile",  count: stats1?.by_region?.find(r=>r.region==="Chile")?.total ?? 0, color:C.cyan   },
                { label:"Crypto", count: stats1?.by_region?.find(r=>r.region==="Crypto")?.total ?? 0,color:C.purple },
                { label:"Canada", count: stats1?.by_region?.find(r=>r.region==="Canada")?.total ?? 0,color:C.green  },
                { label:"Global", count: stats1?.by_region?.find(r=>r.region==="Global")?.total ?? 0,color:C.amber  },
              ].map(m => (
                <div key={m.label} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:6, padding:"8px 10px" }}>
                  <div style={{ fontSize:9, color:C.muted, letterSpacing:2, marginBottom:4 }}>{m.label}</div>
                  <div style={{ fontSize:22, fontWeight:700, color: m.count>0?m.color:C.dim }}>{m.count}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:10, color:C.muted, letterSpacing:1, borderTop:`1px solid ${C.border}`, paddingTop:8 }}>
              Total today: <span style={{ color:C.green, fontWeight:700 }}>{today_n}</span>
              {today_n < 5 && <span style={{ color:C.red, marginLeft:12 }}>⚠ LOW — force-store recommended</span>}
            </div>
          </Panel>
        </div>

        {/* ── ROW 3: Recent calls + DB health ── */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16, marginBottom:16 }}>

          {/* Recent calls */}
          <Panel title="RECENT VERIFIED CALLS · 7 DAYS">
            {stats7?.recent_calls?.length ? (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, whiteSpace:"nowrap" }}>
                  <thead>
                    <tr style={{ fontSize:9, color:C.muted, letterSpacing:2 }}>
                      {["DATE","ASSET","SIGNAL","CONF","PRED","ACTUAL","RESULT"].map(h => (
                        <th key={h} style={{ textAlign:"left", paddingBottom:8, paddingRight:12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats7.recent_calls.slice(0,10).map((c, i) => {
                      const ok = c.direction_correct === 1;
                      const sigCol = c.signal.includes("BUY") ? C.green : c.signal.includes("SELL") ? C.red : C.purple;
                      return (
                        <tr key={i} style={{ borderTop:`1px solid ${C.border}` }}>
                          <td style={{ padding:"4px 12px 4px 0", color:C.muted }}>{c.date?.slice(5)}</td>
                          <td style={{ paddingRight:12, color:"#fff", fontWeight:700 }}>{c.label}</td>
                          <td style={{ paddingRight:12, color:sigCol }}>{c.signal}</td>
                          <td style={{ paddingRight:12, color:C.muted }}>{c.confidence}%</td>
                          <td style={{ paddingRight:12, color:C.cyan }}>{c.predicted_pct > 0 ? "+" : ""}{c.predicted_pct?.toFixed(1)}%</td>
                          <td style={{ paddingRight:12, color: (c.actual_pct??0) >= 0 ? C.green : C.red }}>
                            {(c.actual_pct??0) >= 0 ? "+" : ""}{c.actual_pct?.toFixed(1)}%
                          </td>
                          <td style={{ color: ok ? C.green : C.red, fontWeight:700 }}>{ok ? "✓ WIN" : "✗ LOSS"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <Placeholder />}
          </Panel>

          {/* DB Health */}
          <Panel title="DATABASE">
            {[
              ["Engine",   health?.db ?? "—"],
              ["Connected",health?.db_connected ? "✓ YES" : "✗ NO"],
              ["Preds tbl",health?.tables_exist?.predictions ? "✓" : "✗ MISSING"],
              ["Out tbl",  health?.tables_exist?.outcomes    ? "✓" : "✗ MISSING"],
              ["Total rows",String(total_n)],
              ["Outcomes", String(health?.outcomes_count ?? 0)],
              ["Last pred", health?.latest_prediction_date ?? "—"],
              ["Last verify",health?.latest_outcome_date?.slice(0,10) ?? "—"],
            ].map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${C.border}`, fontSize:11 }}>
                <span style={{ color:C.muted, letterSpacing:1 }}>{k}</span>
                <span style={{ color: String(v).startsWith("✓") ? C.green : String(v).startsWith("✗") ? C.red : "#fff" }}>{v}</span>
              </div>
            ))}
          </Panel>
        </div>

        {/* ── ROW 4: 7d Summary banner ── */}
        <Panel title="7-DAY PERFORMANCE SUMMARY">
          <div style={{ display:"flex", gap:32, flexWrap:"wrap" }}>
            {[
              { label:"WIN RATE",      value: stats7?.summary?.win_rate_pct ? `${stats7.summary.win_rate_pct}%` : "—", color: (stats7?.summary?.win_rate_pct??0)>=70?C.green:C.amber },
              { label:"TOTAL SIGNALS", value: String(stats7?.summary?.total_predictions ?? 0), color: C.cyan },
              { label:"WINS",          value: String(stats7?.summary?.wins ?? 0),               color: C.green },
              { label:"AVG MAG ERR",   value: stats7?.summary?.avg_magnitude_error_pct ? `${stats7.summary.avg_magnitude_error_pct}%` : "—", color: C.amber },
              { label:"BEATS GPT-5",   value: (stats7?.summary?.win_rate_pct??0) > 68.7 ? "✓ YES" : "✗ NO",  color: (stats7?.summary?.win_rate_pct??0) > 68.7 ? C.green : C.red },
            ].map(s => (
              <div key={s.label} style={{ textAlign:"center", minWidth:90 }}>
                <div style={{ fontSize:8, color:C.muted, letterSpacing:3, marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:26, fontWeight:700, color:s.color, textShadow:`0 0 10px ${s.color}` }}>{s.value}</div>
              </div>
            ))}
          </div>
        </Panel>

        {/* ── USER LOGINS ── */}
        <Panel title="USER LOGINS">
          {logins?.error ? (
            <div style={{ fontSize:11, color:C.red }}>Error: {logins.error}</div>
          ) : (
            <>
              <div style={{ display:"flex", gap:24, marginBottom:14, flexWrap:"wrap" }}>
                {[
                  { label:"TODAY",     value: logins?.total_today,    color: C.green  },
                  { label:"LAST 24H",  value: logins?.sessions_24h,   color: C.amber  },
                  { label:"LAST 7D",   value: logins?.sessions_7d,    color: C.cyan   },
                  { label:"ALL TIME",  value: logins?.total_all_time, color: C.purple },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:"center", minWidth:80 }}>
                    <div style={{ fontSize:8, color:C.muted, letterSpacing:3, marginBottom:4 }}>{s.label}</div>
                    <div style={{ fontSize:28, fontWeight:700, color:s.color, textShadow:`0 0 10px ${s.color}` }}>
                      {s.value ?? "—"}
                    </div>
                  </div>
                ))}
              </div>
              {logins?.logins?.length ? (
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11, whiteSpace:"nowrap" }}>
                    <thead>
                      <tr style={{ fontSize:9, color:C.muted, letterSpacing:2 }}>
                        {["CODE","TIER","DEVICE","TIME","IP"].map(h => (
                          <th key={h} style={{ textAlign:"left", paddingBottom:8, paddingRight:16 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logins.logins.map((l, i) => (
                        <tr key={i} style={{ borderTop:`1px solid ${C.border}` }}>
                          <td style={{ padding:"5px 16px 5px 0", color:C.green, fontWeight:700 }}>{l.code}</td>
                          <td style={{ paddingRight:16, color:C.amber }}>{l.tier}</td>
                          <td style={{ paddingRight:16, color: l.device === "mobile" ? C.cyan : C.muted }}>
                            {l.device === "mobile" ? "📱 mobile" : "🖥 desktop"}
                          </td>
                          <td style={{ paddingRight:16, color:C.muted }}>
                            {l.logged_at ? new Date(l.logged_at).toLocaleString("en-US", { month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hour12:false }) : "—"}
                          </td>
                          <td style={{ color:C.dim, fontSize:10 }}>{l.ip || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Placeholder />
              )}
            </>
          )}
        </Panel>

        {/* ── CEO AGENT RUNS ── */}
        <Panel title="CEO AGENT RUNS">
          {agentRuns.length ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, whiteSpace: "nowrap" }}>
                <thead>
                  <tr style={{ fontSize: 9, color: C.muted, letterSpacing: 2 }}>
                    {["TIME", "INSTRUCTION", "MARKET", "DURATION", "STATUS"].map(h => (
                      <th key={h} style={{ textAlign: "left", paddingBottom: 8, paddingRight: 16 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agentRuns.map((r, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: "5px 16px 5px 0", color: C.muted }}>
                        {r.created_at ? new Date(r.created_at).toLocaleString("en-US", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }) : "—"}
                      </td>
                      <td style={{ paddingRight: 16, color: "#fff", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.instruction || "—"}
                      </td>
                      <td style={{ paddingRight: 16, color: C.cyan }}>{r.market || "—"}</td>
                      <td style={{ paddingRight: 16, color: C.amber }}>{r.duration_seconds != null ? `${r.duration_seconds}s` : "—"}</td>
                      <td style={{ fontWeight: 700, color: r.success ? C.green : C.red }}>
                        {r.success ? "✓ OK" : "✗ FAIL"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Placeholder />
          )}
        </Panel>

        {/* ── Footer ── */}
        <div style={{ marginTop:20, textAlign:"center", fontSize:9, color:C.dim, letterSpacing:3 }}>
          PREDIQ MISSION CONTROL · {lastRefresh ? `LAST SYNC ${lastRefresh.toLocaleTimeString()}` : "LOADING..."}
          &nbsp;·&nbsp;
          <span style={{ cursor:"pointer", color:C.muted }} onClick={() => { sessionStorage.removeItem(SESSION_KEY); location.reload(); }}>
            LOCK
          </span>
        </div>

      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label:string; value:string; color:string }) {
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px" }}>
      <div style={{ fontSize:8, color:C.muted, letterSpacing:3, marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, color, letterSpacing:1, textShadow:`0 0 8px ${color}` }}>{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:16 }}>
      <div style={{ fontSize:8, color:C.muted, letterSpacing:4, marginBottom:12, paddingBottom:8, borderBottom:`1px solid ${C.border}` }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Dot({ color, pulse }: { color:string; pulse?:boolean }) {
  return (
    <>
      <style>{`@keyframes pulseGlow{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.3)}}`}</style>
      <div style={{
        width:8, height:8, borderRadius:"50%", background:color,
        boxShadow:`0 0 6px ${color}`,
        animation: pulse ? "pulseGlow 2s ease-in-out infinite" : "none",
        flexShrink:0,
      }} />
    </>
  );
}

function Placeholder() {
  return <div style={{ color:C.muted, fontSize:11, letterSpacing:1, padding:"8px 0" }}>Loading...</div>;
}
