import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useTheme, Theme } from "../lib/theme";

const API = "https://prediq-time-machine-production.up.railway.app";

type Asset = {
  label:         string;
  price:         number;
  change_pct:    number;
  signal:        string;
  confidence:    number;
  predicted_pct: number;
  region:        string;
  asset_class:   string;
  currency:      string;
};

type SortKey = keyof Asset;

const REGIONS      = ["All", "us", "india", "chile", "canada", "crypto", "metals", "latam"];
const SIGNALS      = ["All", "BUY", "SELL", "HOLD"];
const CONFIDENCES  = [
  { label: "Any",  value: 0 },
  { label: ">60%", value: 60 },
  { label: ">70%", value: 70 },
  { label: ">80%", value: 80 },
];
const CHANGES      = [
  { label: "Any",  value: 0 },
  { label: ">1%",  value: 1 },
  { label: ">2%",  value: 2 },
  { label: ">5%",  value: 5 },
];
const ASSET_CLASSES = ["All", "index", "large_cap", "mid_cap", "crypto", "commodity", "unknown"];

const REGION_FLAG: Record<string, string> = {
  us: "🇺🇸", india: "🇮🇳", chile: "🇨🇱", canada: "🇨🇦",
  crypto: "🪙", metals: "⚗️", latam: "🌎",
};

function signalColor(s: string, t: Theme) {
  if (s === "BUY")  return t.accentBuy;
  if (s === "SELL") return t.accentSell;
  return t.muted;
}

function Chip({
  active, onClick, children, t,
}: { active: boolean; onClick: () => void; children: React.ReactNode; t: Theme }) {
  return (
    <button
      onClick={onClick}
      style={{
        background:  active ? t.accent : "transparent",
        color:       active ? t.bg    : t.muted,
        border:      `1px solid ${active ? t.accent : t.border}`,
        borderRadius: 5,
        padding:     "4px 12px",
        cursor:      "pointer",
        fontFamily:  "monospace",
        fontSize:    11,
        fontWeight:  active ? 700 : 400,
        whiteSpace:  "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function SortArrow({ col, sortKey, sortDir, t }: { col: string; sortKey: string; sortDir: 1 | -1; t: Theme }) {
  if (col !== sortKey) return <span style={{ color: t.border }}>  ↕</span>;
  return <span style={{ color: t.accent }}>{sortDir === 1 ? " ↑" : " ↓"}</span>;
}

export default function ScreenerPage() {
  const router = useRouter();
  const [t, toggleTheme] = useTheme();

  const [allResults, setAllResults] = useState<Asset[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  // Filters
  const [region,     setRegion]     = useState("All");
  const [signal,     setSignal]     = useState("All");
  const [minConf,    setMinConf]    = useState(0);
  const [minChange,  setMinChange]  = useState(0);
  const [assetClass, setAssetClass] = useState("All");
  const [search,     setSearch]     = useState("");

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("confidence");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  // Fetch all data once (no filters on server — filter client-side for instant UX)
  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/screener`)
      .then((r) => r.json())
      .then((d) => {
        setAllResults(d.results || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  // Client-side filtering + sorting
  const filtered = useMemo(() => {
    let rows = allResults.filter((a) => {
      if (region !== "All"     && a.region     !== region)     return false;
      if (signal !== "All"     && a.signal     !== signal)     return false;
      if (assetClass !== "All" && a.asset_class !== assetClass) return false;
      if (a.confidence  < minConf)                             return false;
      if (Math.abs(a.change_pct) < minChange)                  return false;
      if (search && !a.label.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    rows = [...rows].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === "string" && typeof bv === "string")
        return sortDir * av.localeCompare(bv);
      return sortDir * ((av as number) - (bv as number));
    });
    return rows;
  }, [allResults, region, signal, assetClass, minConf, minChange, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(-1); }
  }

  const buyCount  = filtered.filter((a) => a.signal === "BUY").length;
  const sellCount = filtered.filter((a) => a.signal === "SELL").length;

  const TH = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      onClick={() => toggleSort(col)}
      style={{
        padding:       "10px 12px",
        textAlign:     "left",
        color:         t.muted,
        fontSize:      10,
        fontWeight:    600,
        letterSpacing: 1,
        textTransform: "uppercase" as const,
        cursor:        "pointer",
        borderBottom:  `1px solid ${t.border}`,
        whiteSpace:    "nowrap",
        userSelect:    "none" as const,
      }}
    >
      {label}
      <SortArrow col={col} sortKey={sortKey} sortDir={sortDir} t={t} />
    </th>
  );

  return (
    <div style={{ background: t.bg, minHeight: "100vh", fontFamily: "monospace", color: t.text }}>

      {/* Top bar */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "12px 20px",
        borderBottom:   `1px solid ${t.border}`,
        background:     t.panel,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ color: t.muted, fontSize: 10, textDecoration: "none" }}>← HOME</a>
          <span style={{ color: t.accent, fontWeight: 700, fontSize: 13, letterSpacing: 2 }}>
            PREDIQ SCREENER
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="/dashboard" style={{ fontSize: 10, color: t.muted, textDecoration: "none", border: `1px solid ${t.border}`, padding: "3px 10px", borderRadius: 4 }}>DASHBOARD</a>
          <a href="/backtest"  style={{ fontSize: 10, color: t.muted, textDecoration: "none", border: `1px solid ${t.border}`, padding: "3px 10px", borderRadius: 4 }}>BACKTEST</a>
          <button
            onClick={toggleTheme}
            style={{
              background: "none", border: `1px solid ${t.border}`,
              borderRadius: 5, padding: "3px 10px", cursor: "pointer",
              color: t.accent, fontSize: 10, fontFamily: "monospace", fontWeight: 700,
            }}
          >
            {t.label}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>

        {/* Filters */}
        <div style={{
          background:   t.panel,
          border:       `1px solid ${t.border}`,
          borderRadius: 10,
          padding:      "16px 20px",
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 10, color: t.muted, letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>
            Filters
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {/* Search */}
            <div>
              <div style={{ fontSize: 9, color: t.muted, marginBottom: 4, letterSpacing: 1 }}>SEARCH</div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="AAPL, BTC…"
                style={{
                  background:   t.panelAlt,
                  border:       `1px solid ${t.border}`,
                  borderRadius: 5,
                  color:        t.text,
                  fontFamily:   "monospace",
                  fontSize:     12,
                  padding:      "5px 10px",
                  outline:      "none",
                  width:        110,
                }}
              />
            </div>

            {/* Region */}
            <div>
              <div style={{ fontSize: 9, color: t.muted, marginBottom: 4, letterSpacing: 1 }}>REGION</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {REGIONS.map((r) => (
                  <Chip key={r} active={region === r} onClick={() => setRegion(r)} t={t}>
                    {r === "All" ? "All" : `${REGION_FLAG[r] || ""} ${r.toUpperCase()}`}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Signal */}
            <div>
              <div style={{ fontSize: 9, color: t.muted, marginBottom: 4, letterSpacing: 1 }}>SIGNAL</div>
              <div style={{ display: "flex", gap: 4 }}>
                {SIGNALS.map((s) => (
                  <Chip key={s} active={signal === s} onClick={() => setSignal(s)} t={t}>
                    {s}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Confidence */}
            <div>
              <div style={{ fontSize: 9, color: t.muted, marginBottom: 4, letterSpacing: 1 }}>CONFIDENCE</div>
              <div style={{ display: "flex", gap: 4 }}>
                {CONFIDENCES.map((c) => (
                  <Chip key={c.label} active={minConf === c.value} onClick={() => setMinConf(c.value)} t={t}>
                    {c.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Change % */}
            <div>
              <div style={{ fontSize: 9, color: t.muted, marginBottom: 4, letterSpacing: 1 }}>CHANGE %</div>
              <div style={{ display: "flex", gap: 4 }}>
                {CHANGES.map((c) => (
                  <Chip key={c.label} active={minChange === c.value} onClick={() => setMinChange(c.value)} t={t}>
                    {c.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Asset Class */}
            <div>
              <div style={{ fontSize: 9, color: t.muted, marginBottom: 4, letterSpacing: 1 }}>ASSET CLASS</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {ASSET_CLASSES.map((c) => (
                  <Chip key={c} active={assetClass === c} onClick={() => setAssetClass(c)} t={t}>
                    {c}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary bar */}
        <div style={{ display: "flex", gap: 20, marginBottom: 14, fontSize: 11, alignItems: "center" }}>
          <span style={{ color: t.muted }}>{filtered.length} assets</span>
          <span style={{ color: t.accentBuy }}>▲ {buyCount} BUY</span>
          <span style={{ color: t.accentSell }}>▼ {sellCount} SELL</span>
          <span style={{ color: t.muted }}>{filtered.length - buyCount - sellCount} HOLD</span>
          {loading && <span style={{ color: t.accentHold }}>Loading…</span>}
          {error   && <span style={{ color: t.accentSell }}>Error: {error}</span>}
        </div>

        {/* Results table */}
        <div style={{
          background:   t.panel,
          border:       `1px solid ${t.border}`,
          borderRadius: 10,
          overflow:     "hidden",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: t.bg }}>
                  <TH col="label"         label="Asset"       />
                  <TH col="region"        label="Region"      />
                  <TH col="asset_class"   label="Class"       />
                  <TH col="price"         label="Price"       />
                  <TH col="change_pct"    label="Change %"    />
                  <TH col="signal"        label="Signal"      />
                  <TH col="confidence"    label="Confidence"  />
                  <TH col="predicted_pct" label="Predicted %" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} style={{ padding: 32, textAlign: "center", color: t.muted, fontSize: 12 }}>
                      No assets match your filters
                    </td>
                  </tr>
                )}
                {filtered.map((a, i) => (
                  <tr
                    key={a.label}
                    onClick={() => router.push(`/dashboard?asset=${a.label}`)}
                    style={{
                      borderTop:  i > 0 ? `1px solid ${t.border}` : "none",
                      cursor:     "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = t.panelAlt)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "11px 12px", fontWeight: 700, fontSize: 13, color: t.text }}>
                      {a.label}
                    </td>
                    <td style={{ padding: "11px 12px", fontSize: 11, color: t.muted }}>
                      {REGION_FLAG[a.region] || ""} {a.region.toUpperCase()}
                    </td>
                    <td style={{ padding: "11px 12px", fontSize: 10, color: t.muted }}>
                      {a.asset_class}
                    </td>
                    <td style={{ padding: "11px 12px", fontSize: 12, color: t.text }}>
                      {a.currency === "USD" ? "$" : a.currency === "INR" ? "₹" : a.currency === "CLP" ? "CL$" : ""}
                      {a.price > 1000
                        ? a.price.toLocaleString(undefined, { maximumFractionDigits: 0 })
                        : a.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td style={{
                      padding:    "11px 12px",
                      fontSize:   12,
                      fontWeight: 700,
                      color:      a.change_pct > 0 ? t.accentBuy : a.change_pct < 0 ? t.accentSell : t.muted,
                    }}>
                      {a.change_pct > 0 ? "+" : ""}{a.change_pct.toFixed(2)}%
                    </td>
                    <td style={{ padding: "11px 12px" }}>
                      <span style={{
                        background:    `${signalColor(a.signal, t)}20`,
                        color:         signalColor(a.signal, t),
                        border:        `1px solid ${signalColor(a.signal, t)}44`,
                        borderRadius:  4,
                        padding:       "2px 8px",
                        fontSize:      10,
                        fontWeight:    700,
                        letterSpacing: 1,
                      }}>
                        {a.signal}
                      </span>
                    </td>
                    <td style={{ padding: "11px 12px", fontSize: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width:        60,
                          height:       5,
                          background:   t.mutedDark,
                          borderRadius: 3,
                          overflow:     "hidden",
                        }}>
                          <div style={{
                            width:        `${Math.min(a.confidence, 100)}%`,
                            height:       "100%",
                            background:   a.confidence >= 70 ? t.accentBuy : a.confidence >= 60 ? t.accentHold : t.muted,
                            borderRadius: 3,
                          }} />
                        </div>
                        <span style={{ color: a.confidence >= 70 ? t.accentBuy : a.confidence >= 60 ? t.accentHold : t.muted }}>
                          {a.confidence > 0 ? `${a.confidence}%` : "—"}
                        </span>
                      </div>
                    </td>
                    <td style={{
                      padding:  "11px 12px",
                      fontSize: 12,
                      color:    a.predicted_pct > 0 ? t.accentBuy : a.predicted_pct < 0 ? t.accentSell : t.muted,
                    }}>
                      {a.predicted_pct !== 0
                        ? `${a.predicted_pct > 0 ? "+" : ""}${a.predicted_pct.toFixed(2)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer note */}
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 10, color: t.muted }}>
          Click any row to open in Dashboard · Signals refresh daily · Prices live via PREDIQ AI
        </div>
      </div>
    </div>
  );
}
