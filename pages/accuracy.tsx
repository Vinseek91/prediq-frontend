import { useCallback, useEffect, useState, type ReactNode } from "react";

const STATS_API = "https://prediq-time-machine-production.up.railway.app/api/validation/stats";

const BG = "#020408";
const GREEN = "#00ff88";
const GOLD = "#ffd166";
const MUTED = "#3a6080";
const PANEL = "#050d1a";
const BORDER = "#0d2035";
const TEXT = "#e0e8f0";

const DAY_OPTIONS = [7, 14, 30, 60, 90] as const;
const REGION_FILTERS = ["All", "US", "India", "Canada", "Chile", "Crypto", "Forex"] as const;

const CONF_BUCKETS = ["high(>70)", "mid(55-70)", "low(<55)"] as const;
const REGION_TABLE_ORDER = ["US", "India", "Canada", "Chile", "Crypto", "Forex"] as const;

type Summary = {
  total_predictions: number;
  wins: number;
  win_rate_pct: number;
  avg_magnitude_error_pct: number;
};

type ConfRow = { confidence_bucket: string; total: number; win_rate: number };
type RegionRow = { region: string; total: number; win_rate: number; avg_mag_error: number };
type SectorRow = { asset_class: string; total: number; win_rate: number; avg_mag_error: number };
type RecentCall = {
  label: string;
  signal: string;
  confidence: number;
  predicted_pct: number;
  actual_pct: number;
  direction_correct: number;
  date: string;
  magnitude_error?: number;
};

type StatsPayload = {
  summary: Summary;
  by_confidence: ConfRow[];
  by_region: RegionRow[];
  by_sector: SectorRow[];
  recent_calls: RecentCall[];
};

const MOCK_STATS: StatsPayload = {
  summary: {
    total_predictions: 186,
    wins: 124,
    win_rate_pct: 66.7,
    avg_magnitude_error_pct: 1.18,
  },
  by_confidence: [
    { confidence_bucket: "high(>70)", total: 52, win_rate: 80.8 },
    { confidence_bucket: "mid(55-70)", total: 71, win_rate: 64.8 },
    { confidence_bucket: "low(<55)", total: 63, win_rate: 52.4 },
  ],
  by_region: [
    { region: "US", total: 58, win_rate: 69.0, avg_mag_error: 1.05 },
    { region: "India", total: 42, win_rate: 64.3, avg_mag_error: 1.22 },
    { region: "Canada", total: 24, win_rate: 62.5, avg_mag_error: 1.11 },
    { region: "Chile", total: 18, win_rate: 61.1, avg_mag_error: 1.34 },
    { region: "Crypto", total: 22, win_rate: 59.1, avg_mag_error: 1.89 },
    { region: "Forex", total: 22, win_rate: 68.2, avg_mag_error: 0.92 },
  ],
  by_sector: [
    { asset_class: "large_cap", total: 72, win_rate: 68.1, avg_mag_error: 1.02 },
    { asset_class: "index", total: 38, win_rate: 65.8, avg_mag_error: 0.98 },
    { asset_class: "commodity", total: 28, win_rate: 64.3, avg_mag_error: 1.15 },
    { asset_class: "crypto", total: 22, win_rate: 59.1, avg_mag_error: 1.89 },
    { asset_class: "forex", total: 18, win_rate: 68.2, avg_mag_error: 0.92 },
    { asset_class: "mid_cap", total: 8, win_rate: 62.5, avg_mag_error: 1.28 },
  ],
  recent_calls: [
    { label: "AAPL", signal: "BUY", confidence: 78, predicted_pct: 1.2, actual_pct: 1.45, direction_correct: 1, date: "2026-04-08" },
    { label: "NIFTY50", signal: "BUY", confidence: 72, predicted_pct: 0.9, actual_pct: -0.3, direction_correct: 0, date: "2026-04-08" },
    { label: "BTC/USD", signal: "SELL", confidence: 81, predicted_pct: -2.1, actual_pct: -2.8, direction_correct: 1, date: "2026-04-07" },
    { label: "GOLD", signal: "BUY", confidence: 74, predicted_pct: 0.6, actual_pct: 0.55, direction_correct: 1, date: "2026-04-07" },
    { label: "USD/INR", signal: "SELL", confidence: 66, predicted_pct: -0.4, actual_pct: -0.35, direction_correct: 1, date: "2026-04-06" },
    { label: "TSX", signal: "BUY", confidence: 61, predicted_pct: 0.5, actual_pct: 0.22, direction_correct: 1, date: "2026-04-06" },
    { label: "SQM", signal: "BUY", confidence: 58, predicted_pct: 1.8, actual_pct: -0.2, direction_correct: 0, date: "2026-04-05" },
    { label: "MSFT", signal: "BUY", confidence: 83, predicted_pct: 1.1, actual_pct: 0.95, direction_correct: 1, date: "2026-04-05" },
    { label: "ETH/USD", signal: "BUY", confidence: 71, predicted_pct: 2.4, actual_pct: 3.1, direction_correct: 1, date: "2026-04-04" },
    { label: "CLP/USD", signal: "SELL", confidence: 63, predicted_pct: -0.5, actual_pct: 0.15, direction_correct: 0, date: "2026-04-04" },
  ],
};

function isPayloadEmpty(p: StatsPayload | null): boolean {
  if (!p?.summary) return true;
  return (
    (p.summary.total_predictions ?? 0) === 0 &&
    (!p.by_region || p.by_region.length === 0) &&
    (!p.by_confidence || p.by_confidence.length === 0) &&
    (!p.recent_calls || p.recent_calls.length === 0)
  );
}

function normalizePayload(raw: unknown): StatsPayload | null {
  if (!raw || typeof raw !== "object" || (raw as { error?: string }).error) return null;
  const o = raw as Record<string, unknown>;
  const s = o.summary as Summary | undefined;
  if (!s) return null;
  return {
    summary: {
      total_predictions: Number(s.total_predictions) || 0,
      wins: Number(s.wins) || 0,
      win_rate_pct: Number(s.win_rate_pct) || 0,
      avg_magnitude_error_pct: Number(s.avg_magnitude_error_pct) || 0,
    },
    by_confidence: Array.isArray(o.by_confidence) ? (o.by_confidence as ConfRow[]) : [],
    by_region: Array.isArray(o.by_region) ? (o.by_region as RegionRow[]) : [],
    by_sector: Array.isArray(o.by_sector) ? (o.by_sector as SectorRow[]) : [],
    recent_calls: Array.isArray(o.recent_calls) ? (o.recent_calls as RecentCall[]) : [],
  };
}

function mergeConfidence(rows: ConfRow[]): { bucket: string; total: number; win_rate: number }[] {
  const m = new Map(rows.map((r) => [r.confidence_bucket, r]));
  return CONF_BUCKETS.map((b) => {
    const r = m.get(b);
    return { bucket: b, total: r?.total ?? 0, win_rate: r?.win_rate ?? 0 };
  });
}

function mergeRegions(rows: RegionRow[]): RegionRow[] {
  const m = new Map(rows.map((r) => [r.region, r]));
  return REGION_TABLE_ORDER.map((region) => {
    const r = m.get(region);
    return r ?? { region, total: 0, win_rate: 0, avg_mag_error: 0 };
  });
}

function pctFmt(n: number): string {
  const s = n >= 0 ? "+" : "";
  return `${s}${n.toFixed(2)}%`;
}

function filterBtn(active: boolean, onClick: () => void, children: ReactNode) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: "inherit",
        fontSize: 10,
        cursor: "pointer",
        padding: "5px 12px",
        borderRadius: 4,
        border: active ? `1px solid ${GREEN}` : `1px solid ${BORDER}`,
        background: active ? "#002a18" : "transparent",
        color: active ? GREEN : MUTED,
        fontWeight: active ? 700 : 400,
      }}
    >
      {children}
    </button>
  );
}

export default function AccuracyPage() {
  const [days, setDays] = useState<number>(30);
  const [region, setRegion] = useState<(typeof REGION_FILTERS)[number]>("All");
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [data, setData] = useState<StatsPayload>(MOCK_STATS);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ days: String(days) });
    if (region !== "All") q.set("region", region);
    try {
      const res = await fetch(`${STATS_API}?${q.toString()}`);
      const json = await res.json();
      const parsed = normalizePayload(json);
      if (parsed && !isPayloadEmpty(parsed)) {
        setData(parsed);
        setUsingMock(false);
      } else {
        setData(MOCK_STATS);
        setUsingMock(true);
      }
    } catch {
      setData(MOCK_STATS);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }, [days, region]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const confMerged = mergeConfidence(data.by_confidence || []);
  const regionsMerged = mergeRegions(data.by_region || []);

  const s = data.summary;

  return (
    <div
      style={{
        background: BG,
        minHeight: "100vh",
        fontFamily: "'SF Mono','Fira Code',monospace",
        color: TEXT,
        paddingBottom: 48,
      }}
    >
      <div
        style={{
          background: PANEL,
          borderBottom: `1px solid ${BORDER}`,
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <a href="/" style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, color: GREEN, textDecoration: "none" }}>
          PREDIQ
        </a>
        <a
          href="/"
          style={{
            fontSize: 10,
            color: MUTED,
            textDecoration: "none",
            border: `1px solid ${BORDER}`,
            padding: "4px 12px",
            borderRadius: 4,
          }}
        >
          ← HOME
        </a>
      </div>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ fontSize: 9, color: MUTED, letterSpacing: 2, marginBottom: 6 }}>VALIDATION STATS</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Accuracy &amp; verification</div>
        <div style={{ fontSize: 11, color: MUTED, marginBottom: 16 }}>
          Live outcomes from the Time Machine validation engine. Filters refetch the API; demo data fills in when the dataset is empty.
        </div>

        {usingMock && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              borderRadius: 8,
              border: `1px solid ${GOLD}44`,
              background: `${GOLD}10`,
              fontSize: 10,
              color: GOLD,
            }}
          >
            Showing sample demo data — connect predictions and daily verify to populate live stats.
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginRight: 4 }}>DAYS</span>
          {DAY_OPTIONS.map((d) => filterBtn(days === d, () => setDays(d), d))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 22 }}>
          <span style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginRight: 4 }}>REGION</span>
          {REGION_FILTERS.map((r) => filterBtn(region === r, () => setRegion(r), r))}
        </div>

        {loading && (
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 12 }}>Loading stats…</div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 22 }}>
          {[
            { label: "OVERALL WIN RATE", value: `${s.win_rate_pct.toFixed(1)}%`, sub: "directional" },
            { label: "TOTAL VERIFIED", value: String(s.total_predictions), sub: "closed outcomes" },
            { label: "TOTAL WINS", value: String(s.wins), sub: "correct direction" },
            { label: "AVG MAGNITUDE ERROR", value: `${s.avg_magnitude_error_pct.toFixed(2)}%`, sub: "predicted vs actual" },
          ].map((k) => (
            <div key={k.label} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "14px" }}>
              <div style={{ fontSize: 9, color: MUTED, letterSpacing: 2, marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: GREEN, marginBottom: 3 }}>{k.value}</div>
              <div style={{ fontSize: 10, color: MUTED }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 9, color: MUTED, letterSpacing: 2, marginBottom: 10 }}>CONFIDENCE BANDS</div>
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "16px 18px", marginBottom: 22 }}>
          {confMerged.map(({ bucket, total, win_rate }) => (
            <div key={bucket} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: GOLD, fontWeight: 600 }}>{bucket}</span>
                <span style={{ fontSize: 10, color: MUTED }}>
                  {win_rate.toFixed(1)}% win · {total} samples
                </span>
              </div>
              <div style={{ height: 8, background: BORDER, borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, win_rate))}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${GREEN}aa, ${GREEN})`,
                    borderRadius: 4,
                    transition: "width 0.35s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 9, color: MUTED, letterSpacing: 2, marginBottom: 10 }}>BY REGION</div>
        <div style={{ overflowX: "auto", marginBottom: 22 }}>
          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden", minWidth: 520 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 120px 90px",
                background: BORDER,
                padding: "8px 14px",
                gap: 8,
              }}
            >
              {["REGION", "WIN RATE", "MAG ERROR", "SAMPLES"].map((h) => (
                <div key={h} style={{ fontSize: 9, color: MUTED, letterSpacing: 1, fontWeight: 700 }}>
                  {h}
                </div>
              ))}
            </div>
            {regionsMerged.map((row, i) => (
              <div
                key={row.region}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 100px 120px 90px",
                  padding: "8px 14px",
                  gap: 8,
                  background: i % 2 === 0 ? PANEL : "#040c18",
                  borderTop: `1px solid ${BORDER}`,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>{row.region}</div>
                <div style={{ fontSize: 11, color: GREEN }}>{row.total ? `${row.win_rate.toFixed(1)}%` : "—"}</div>
                <div style={{ fontSize: 11, color: TEXT }}>{row.total ? `${row.avg_mag_error.toFixed(2)}%` : "—"}</div>
                <div style={{ fontSize: 11, color: MUTED }}>{row.total || "—"}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 9, color: MUTED, letterSpacing: 2, marginBottom: 10 }}>BY SECTOR (ASSET CLASS)</div>
        <div style={{ overflowX: "auto", marginBottom: 22 }}>
          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden", minWidth: 520 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 120px 90px",
                background: BORDER,
                padding: "8px 14px",
                gap: 8,
              }}
            >
              {["ASSET CLASS", "WIN RATE", "MAG ERROR", "SAMPLES"].map((h) => (
                <div key={h} style={{ fontSize: 9, color: MUTED, letterSpacing: 1, fontWeight: 700 }}>
                  {h}
                </div>
              ))}
            </div>
            {(data.by_sector || []).length === 0 ? (
              <div style={{ padding: "14px", fontSize: 11, color: MUTED }}>No sector breakdown yet.</div>
            ) : (
              (data.by_sector || []).map((row, i) => (
                <div
                  key={row.asset_class}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 120px 90px",
                    padding: "8px 14px",
                    gap: 8,
                    background: i % 2 === 0 ? PANEL : "#040c18",
                    borderTop: `1px solid ${BORDER}`,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>{row.asset_class}</div>
                  <div style={{ fontSize: 11, color: GREEN }}>{`${row.win_rate.toFixed(1)}%`}</div>
                  <div style={{ fontSize: 11, color: TEXT }}>{`${row.avg_mag_error.toFixed(2)}%`}</div>
                  <div style={{ fontSize: 11, color: MUTED }}>{row.total}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ fontSize: 9, color: MUTED, letterSpacing: 2, marginBottom: 10 }}>RECENT CALLS</div>
        <div style={{ overflowX: "auto", marginBottom: 16 }}>
          <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden", minWidth: 720 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "72px 64px 72px 96px 96px 48px 88px",
                background: BORDER,
                padding: "8px 12px",
                gap: 6,
              }}
            >
              {["LABEL", "SIGNAL", "CONF", "PRED %", "ACTUAL %", "RESULT", "DATE"].map((h) => (
                <div key={h} style={{ fontSize: 9, color: MUTED, letterSpacing: 1, fontWeight: 700 }}>
                  {h}
                </div>
              ))}
            </div>
            {(data.recent_calls || []).map((c, i) => {
              const ok = c.direction_correct === 1;
              return (
                <div
                  key={`${c.label}-${c.date}-${i}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "72px 64px 72px 96px 96px 48px 88px",
                    padding: "8px 12px",
                    gap: 6,
                    alignItems: "center",
                    background: i % 2 === 0 ? PANEL : "#040c18",
                    borderTop: `1px solid ${BORDER}`,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>{c.label}</div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textAlign: "center",
                      padding: "2px 6px",
                      borderRadius: 3,
                      background: c.signal === "BUY" ? `${GREEN}22` : "#ff446622",
                      border: `1px solid ${c.signal === "BUY" ? GREEN : "#ff4466"}`,
                      color: c.signal === "BUY" ? GREEN : "#ff4466",
                    }}
                  >
                    {c.signal}
                  </div>
                  <div style={{ fontSize: 11, color: GOLD }}>{Number(c.confidence).toFixed(0)}%</div>
                  <div style={{ fontSize: 11, color: TEXT }}>{pctFmt(Number(c.predicted_pct))}</div>
                  <div style={{ fontSize: 11, color: MUTED }}>{pctFmt(Number(c.actual_pct))}</div>
                  <div style={{ fontSize: 16, color: ok ? GREEN : "#ff4466", textAlign: "center" }}>{ok ? "✓" : "✗"}</div>
                  <div style={{ fontSize: 10, color: MUTED }}>{c.date}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
