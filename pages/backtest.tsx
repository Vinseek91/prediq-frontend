import { useEffect, useState } from "react";
import { useTheme, Theme } from "../lib/theme";

const API = "https://prediq-time-machine-production.up.railway.app";

const ASSETS = [
  { label: "SPX",      name: "S&P 500",    flag: "🇺🇸" },
  { label: "NIFTY50",  name: "Nifty 50",   flag: "🇮🇳" },
  { label: "INFY",     name: "Infosys",    flag: "🇮🇳" },
  { label: "TCS",      name: "TCS",        flag: "🇮🇳" },
  { label: "RELIANCE", name: "Reliance",   flag: "🇮🇳" },
  { label: "BTC/USD",  name: "Bitcoin",    flag: "🪙" },
  { label: "GOLD",     name: "Gold",       flag: "⚗️" },
  { label: "IPSA",     name: "IPSA Chile", flag: "🇨🇱" },
];

type MonthRow = {
  month: string;
  accuracy: number;
  signals: number;
  correct: number;
};

type BacktestResult = {
  label: string;
  ticker: string;
  days: number;
  total_signals: number;
  correct: number;
  accuracy_pct: number;
  by_month: MonthRow[];
  best_month: string | null;
  worst_month: string | null;
  error?: string;
};

function AccuracyBar({ pct, t }: { pct: number; t: Theme }) {
  const color = pct >= 60 ? t.accentBuy : pct >= 50 ? t.accentHold : t.accentSell;
  return (
    <div style={{ width: "100%", background: t.mutedDark, borderRadius: 4, height: 8, margin: "4px 0" }}>
      <div
        style={{
          width: `${Math.min(pct, 100)}%`,
          height: "100%",
          background: color,
          borderRadius: 4,
          transition: "width 0.8s ease",
        }}
      />
    </div>
  );
}

function MiniChart({ months, t }: { months: MonthRow[]; t: Theme }) {
  if (!months || months.length === 0) return null;
  const max = 100;
  const h = 60;
  const w = 260;
  const barW = Math.max(4, Math.floor((w - months.length * 2) / months.length));
  const gap  = Math.floor((w - months.length * barW) / Math.max(months.length - 1, 1));

  return (
    <svg width={w} height={h + 20} style={{ overflow: "visible" }}>
      {months.map((m, i) => {
        const barH = Math.round((m.accuracy / max) * h);
        const x    = i * (barW + gap);
        const y    = h - barH;
        const color = m.accuracy >= 60 ? t.accentBuy : m.accuracy >= 50 ? t.accentHold : t.accentSell;
        return (
          <g key={m.month}>
            <rect x={x} y={y} width={barW} height={barH} fill={color} opacity={0.85} rx={2} />
            {i % 2 === 0 && (
              <text x={x + barW / 2} y={h + 14} textAnchor="middle" fontSize={8} fill={t.muted}>
                {m.month.slice(5)}
              </text>
            )}
          </g>
        );
      })}
      {/* 50% line */}
      <line x1={0} y1={h * 0.5} x2={w} y2={h * 0.5} stroke={t.muted} strokeDasharray="3 3" strokeWidth={0.5} />
    </svg>
  );
}

function BacktestCard({ asset, days, t }: { asset: typeof ASSETS[0]; days: number; t: Theme }) {
  const [data, setData]       = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`${API}/api/backtest?label=${encodeURIComponent(asset.label)}&days=${days}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setData({ error: "Request failed" } as BacktestResult); setLoading(false); });
  }, [asset.label, days]);

  const insufficientData = data && !data.error && data.total_signals < 10;
  const accColor = data && !data.error && !insufficientData
    ? data.accuracy_pct >= 60 ? t.accentBuy : data.accuracy_pct >= 50 ? t.accentHold : t.accentSell
    : t.muted;

  return (
    <div style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: "20px 22px",
      minWidth: 280,
      flex: "1 1 280px",
      maxWidth: 340,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{asset.flag}</span>
        <div>
          <div style={{ color: t.text, fontWeight: 700, fontSize: 15 }}>{asset.name}</div>
          <div style={{ color: t.muted, fontSize: 11 }}>{asset.label}</div>
        </div>
      </div>

      {loading && (
        <div style={{ color: t.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
          Loading…
        </div>
      )}

      {!loading && data?.error && (
        <div style={{ color: t.accentSell, fontSize: 12 }}>Error: {data.error}</div>
      )}

      {!loading && data && !data.error && (
        <>
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            {insufficientData ? (
              <div style={{ fontSize: 15, fontWeight: 700, color: t.muted, lineHeight: 1.4 }}>
                Insufficient data
                <div style={{ fontSize: 11, fontWeight: 400, marginTop: 4 }}>
                  {data.total_signals} signal{data.total_signals !== 1 ? "s" : ""} — need ≥10
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 36, fontWeight: 800, color: accColor, lineHeight: 1 }}>
                {data.accuracy_pct}%
              </div>
            )}
            {!insufficientData && (
            <div style={{ color: t.muted, fontSize: 11, marginTop: 4 }}>
              {data.correct} / {data.total_signals} signals correct
            </div>
            )}
            <AccuracyBar pct={data.accuracy_pct} t={t} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <MiniChart months={data.by_month} t={t} />
          </div>

          <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
            {data.best_month && (
              <div style={{ background: t.accentBuy + "15", border: `1px solid ${t.accentBuy}33`, borderRadius: 6, padding: "4px 10px", flex: 1, textAlign: "center" }}>
                <div style={{ color: t.accentBuy, fontWeight: 700 }}>BEST</div>
                <div style={{ color: t.text }}>{data.best_month}</div>
              </div>
            )}
            {data.worst_month && (
              <div style={{ background: t.accentSell + "15", border: `1px solid ${t.accentSell}33`, borderRadius: 6, padding: "4px 10px", flex: 1, textAlign: "center" }}>
                <div style={{ color: t.accentSell, fontWeight: 700 }}>WORST</div>
                <div style={{ color: t.text }}>{data.worst_month}</div>
              </div>
            )}
          </div>

          {/* Monthly breakdown table */}
          <div style={{ marginTop: 14 }}>
            <div style={{ color: t.muted, fontSize: 10, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
              Monthly Breakdown
            </div>
            <div style={{ maxHeight: 140, overflowY: "auto" }}>
              {data.by_month.slice().reverse().map((m) => (
                <div key={m.month} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "3px 0",
                  borderBottom: `1px solid ${t.border}`,
                  fontSize: 12,
                }}>
                  <span style={{ color: t.muted }}>{m.month}</span>
                  <span style={{ color: m.accuracy >= 60 ? t.accentBuy : m.accuracy >= 50 ? t.accentHold : t.accentSell, fontWeight: 600 }}>
                    {m.accuracy}%
                  </span>
                  <span style={{ color: t.muted }}>{m.signals} signals</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const DAY_OPTIONS = [30, 60, 90, 180] as const;

export default function BacktestPage() {
  const [days, setDays] = useState<number>(180);
  const [t, toggleTheme] = useTheme();

  return (
    <div style={{ background: t.bg, minHeight: "100vh", padding: "32px 24px", fontFamily: "monospace" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center", position: "relative" }}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              position: "absolute", top: 0, right: 0,
              background: "none", border: `1px solid ${t.border}`,
              borderRadius: 6, padding: "4px 12px", cursor: "pointer",
              color: t.accent, fontSize: 11, fontFamily: "monospace", fontWeight: 700,
            }}
          >
            {t.label}
          </button>
          <div style={{ fontSize: 11, color: t.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
            PREDIQ AI
          </div>
          <h1 style={{ color: t.text, fontSize: 28, fontWeight: 800, margin: 0 }}>
            📊 Backtest Results
          </h1>
          <p style={{ color: t.muted, fontSize: 13, marginTop: 8 }}>
            Signal accuracy vs real market outcomes — yfinance verified
          </p>
        </div>

        {/* Day selector */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 32 }}>
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                background: days === d ? t.accent : "transparent",
                color: days === d ? t.bg : t.muted,
                border: `1px solid ${days === d ? t.accent : t.border}`,
                borderRadius: 6,
                padding: "6px 18px",
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: 13,
                fontWeight: days === d ? 700 : 400,
              }}
            >
              {d}d
            </button>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 28, fontSize: 11 }}>
          <span style={{ color: t.accentBuy }}>● ≥60% Strong</span>
          <span style={{ color: t.accentHold }}>● 50–60% Neutral</span>
          <span style={{ color: t.accentSell }}>● &lt;50% Weak</span>
        </div>

        {/* Cards */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center" }}>
          {ASSETS.map((a) => (
            <BacktestCard key={a.label} asset={a} days={days} t={t} />
          ))}
        </div>

        {/* Methodology note */}
        <div style={{
          marginTop: 40,
          background: t.panel,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          padding: "16px 20px",
          fontSize: 12,
          color: t.muted,
          maxWidth: 700,
          margin: "40px auto 0",
        }}>
          <div style={{ color: t.accentHold, fontWeight: 700, marginBottom: 6 }}>Methodology</div>
          <div>
            PREDIQ signal: <span style={{ color: t.text }}>if today change &gt; +0.1% → BUY, &lt; −0.1% → SELL, else HOLD</span>
          </div>
          <div style={{ marginTop: 4 }}>
            Outcome: <span style={{ color: t.text }}>if next-day close &gt; today close by &gt;0.1% → BUY wins, &lt; −0.1% → SELL wins</span>
          </div>
          <div style={{ marginTop: 4 }}>
            Data source: <span style={{ color: t.text }}>yfinance daily OHLC — adjusted closes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
