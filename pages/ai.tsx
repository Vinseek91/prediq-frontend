import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useTheme, Theme } from "../lib/theme";

const API = process.env.NEXT_PUBLIC_API_URL || "https://prediq-time-machine-production.up.railway.app";

// ── Types ─────────────────────────────────────────────────────────────────────
type Msg = { role: "user" | "assistant"; content: string; ts: number };
type Outlook = {
  mood: string; breadth: { up: number; down: number; unchanged: number };
  opportunities: any[]; risks: any[]; accuracy: number; timestamp: string;
};
type ForecastDay = { date: string; day: number; direction: string; confidence: number; predicted_pct: number };

// ── Constants ─────────────────────────────────────────────────────────────────
const TRACKED_TICKERS = [
  "SPX","NASDAQ","DOW","AAPL","MSFT","GOOGL","AMZN","NVDA","TSLA","META","NFLX",
  "NIFTY50","SENSEX","RELIANCE","TCS","INFY","HDFC","WIPRO","HCLTECH","SBIN","ZOMATO",
  "BTC/USD","ETH/USD","SOL/USD","XRP/USD","BNB/USD",
  "GOLD","SILVER","WTI","BRENT","COPPER",
  "IPSA","SQM","LATAM","TSX","RY","SHOP",
];

const FORECAST_ASSETS = ["SPX", "NIFTY50", "BTC/USD", "GOLD", "IPSA", "TSX"];

const QUICK_PROMPTS = [
  { icon: "🌍", label: "Market Overview",     prompt: "Give me a complete market overview today — what's moving, key signals, overall mood." },
  { icon: "📊", label: "Top Opportunities",   prompt: "What are the top 3 trading opportunities right now based on PREDIQ signals?" },
  { icon: "⚠️", label: "Risk Report",         prompt: "What are the biggest risks to watch in markets today?" },
  { icon: "🇮🇳", label: "India Report",        prompt: "Full India market report: NIFTY50, top movers, signals and outlook." },
  { icon: "🇺🇸", label: "US Market",           prompt: "US market analysis: SPX, top stocks, signals and today's momentum." },
  { icon: "🪙", label: "Crypto Check",        prompt: "Crypto market update: BTC, ETH, SOL signals and momentum." },
  { icon: "⚗️", label: "Gold & Commodities",  prompt: "Gold and commodity outlook based on current prices and signals." },
  { icon: "🇨🇱", label: "Chile Market",        prompt: "Full Chile market report: IPSA, top movers CENCOSUD, FALABELLA, COPEC — signals and outlook." },
  { icon: "🇨🇦", label: "Canada Market",       prompt: "Canada market analysis: TSX index, top stocks SHOP, RY, TD — signals and today's momentum." },
  { icon: "📋", label: "AAPL Fundamentals",   prompt: "What are AAPL fundamentals? Is it overvalued? What do analysts say?" },
  { icon: "🎯", label: "Analyst Consensus",   prompt: "What is the analyst consensus on NIFTY50 and SPX right now?" },
  { icon: "📈", label: "7-Day Outlook",        prompt: "Give me the 7-day outlook for SPX, NIFTY50, BTC, GOLD, IPSA and TSX." },
];

const PRO_DAILY_LIMIT = 5;
const PRO_LIMIT_KEY   = `prediq_ai_pro_count_${new Date().toISOString().slice(0, 10)}`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function moodColor(mood: string, t: Theme) {
  if (mood.includes("BULLISH")) return t.accentBuy;
  if (mood.includes("BEARISH")) return t.accentSell;
  return t.accentHold;
}

function moodIcon(mood: string) {
  if (mood.includes("BULLISH")) return "📈";
  if (mood.includes("BEARISH")) return "📉";
  return "➡️";
}

function extractTickers(text: string): string[] {
  const found: string[] = [];
  const upper = text.toUpperCase();
  for (const t of TRACKED_TICKERS) {
    const safe = t.replace("/", "\\/");
    if (new RegExp(`\\b${safe}\\b`).test(upper)) found.push(t);
  }
  return [...new Set(found)].slice(0, 5);
}

function formatPrice(price: number, currency: string): string {
  const sym = currency === "INR" ? "₹" : currency === "CLP" ? "CL$" : "$";
  return `${sym}${price > 1000 ? price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : price.toFixed(2)}`;
}

// ── Forecast mini-chart ───────────────────────────────────────────────────────
function ForecastBar({ label, forecast, t }: { label: string; forecast: ForecastDay[]; t: Theme }) {
  if (!forecast?.length) return null;
  return (
    <div style={{ flex: "1 1 160px", background: t.bg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 10, color: t.muted, marginBottom: 6, letterSpacing: 1 }}>{label}</div>
      <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 36 }}>
        {forecast.map((d) => {
          const h   = Math.max(4, Math.min(36, Math.abs(d.predicted_pct) * 8 + 8));
          const col = d.direction === "BUY" ? t.accentBuy : d.direction === "SELL" ? t.accentSell : t.accentHold;
          return (
            <div key={d.day} title={`${d.date}: ${d.direction} ${d.predicted_pct > 0 ? "+" : ""}${d.predicted_pct?.toFixed(2)}%`}
              style={{ flex: 1, height: h, background: col, opacity: 0.7 + d.confidence / 333, borderRadius: 2 }} />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 8, color: t.muted }}>
        <span>Today</span><span>+7d</span>
      </div>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg, t }: { msg: Msg; t: Theme }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display:       "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom:  12,
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%", background: `${t.accent}22`,
          border: `1px solid ${t.accent}44`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 13, flexShrink: 0, marginRight: 8, marginTop: 2,
        }}>🤖</div>
      )}
      <div style={{
        maxWidth:     "72%",
        background:   isUser ? t.panelAlt : t.panel,
        border:       `1px solid ${isUser ? t.borderLight : t.border}`,
        borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
        padding:      "10px 14px",
        fontSize:     13,
        lineHeight:   1.6,
        color:        t.text,
        whiteSpace:   "pre-wrap",
        wordBreak:    "break-word" as const,
      }}>
        {msg.content}
        <div style={{ fontSize: 9, color: t.muted, marginTop: 4, textAlign: "right" }}>
          {new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
      {isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%", background: t.panelAlt,
          border: `1px solid ${t.borderLight}`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 13, flexShrink: 0, marginLeft: 8, marginTop: 2,
        }}>👤</div>
      )}
    </div>
  );
}

// ── Locked screen ─────────────────────────────────────────────────────────────
function LockedScreen({ isPro, t }: { isPro: boolean; t: Theme }) {
  const router = useRouter();
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: 40, textAlign: "center",
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: t.accentHold, marginBottom: 8 }}>
        {isPro ? "Daily Limit Reached" : "Elite Access Required"}
      </div>
      <div style={{ fontSize: 14, color: t.text, maxWidth: 380, lineHeight: 1.6, marginBottom: 28 }}>
        {isPro
          ? `Pro users get ${PRO_DAILY_LIMIT} AI messages per day. Come back tomorrow or upgrade to Elite for unlimited access.`
          : "PREDIQ AI Analyst is an Elite-tier feature. Get unlimited AI conversations, fundamentals, analyst data and 7-day forecasts."}
      </div>
      <button
        onClick={() => router.push("/")}
        style={{
          background: t.accentHold, color: t.bg, border: "none", borderRadius: 8,
          padding: "12px 32px", fontSize: 14, fontWeight: 800, cursor: "pointer",
          letterSpacing: 1,
        }}
      >
        {isPro ? "← BACK TO DASHBOARD" : "UPGRADE TO ELITE"}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AIPage() {
  const router = useRouter();
  const [t, toggleTheme] = useTheme();

  // Auth / tier
  const [tier,      setTier]      = useState<"free" | "pro" | "elite">("free");
  const [authReady, setAuthReady] = useState(false);
  const [proCount,  setProCount]  = useState(0);

  // Data
  const [outlook,    setOutlook]    = useState<Outlook | null>(null);
  const [forecasts,  setForecasts]  = useState<Record<string, ForecastDay[]>>({});
  const [prices,     setPrices]     = useState<Record<string, any>>({});
  const [accuracy,   setAccuracy]   = useState<string>("—");

  // Chat
  const [messages,   setMessages]   = useState<Msg[]>([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [selected,   setSelected]   = useState("SPX");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  // UI
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Tab
  const [tab,        setTab]        = useState<"analyst" | "ceo">("analyst");

  // CEO Agent
  const [ceoInput,   setCeoInput]   = useState("");
  const [ceoFeed,    setCeoFeed]    = useState<Array<{ type: string; content: string; id: number }>>([]);
  const [ceoLoading, setCeoLoading] = useState(false);
  const ceoEndRef = useRef<HTMLDivElement>(null);
  const [accessCode, setAccessCode] = useState("");

  // ── Auth check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = (localStorage.getItem("prediq_tier") || "free") as "free" | "pro" | "elite";
    setTier(t);
    setProCount(parseInt(localStorage.getItem(PRO_LIMIT_KEY) || "0", 10));
    setAccessCode(localStorage.getItem("prediq_access_code") || "");
    setAuthReady(true);
  }, []);

  // ── Load backdrop data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!authReady || tier === "free") return;

    // Prices
    fetch(`${API}/api/prices`).then(r => r.json()).then(d => setPrices(d.prices || {})).catch(() => {});

    // Accuracy
    fetch(`${API}/api/accuracy`).then(r => r.json()).then(d => {
      if (d.accuracy_pct) setAccuracy(`${d.accuracy_pct}%`);
    }).catch(() => {});

    // Market outlook
    fetch(`${API}/api/market-outlook`).then(r => r.json()).then(d => setOutlook(d)).catch(() => {});

    // Forecasts for 4 key assets
    Promise.all(
      FORECAST_ASSETS.map(lbl =>
        fetch(`${API}/api/forecast/${encodeURIComponent(lbl)}`)
          .then(r => r.json())
          .then(d => ({ lbl, data: d.forecast || [] }))
          .catch(() => ({ lbl, data: [] }))
      )
    ).then(results => {
      const map: Record<string, ForecastDay[]> = {};
      results.forEach(({ lbl, data }) => { map[lbl] = data; });
      setForecasts(map);
    });

    // Welcome message
    setMessages([{
      role: "assistant",
      content: "Hello! I'm PREDIQ AI Analyst — your elite market intelligence assistant.\n\nI have access to live prices, signals, fundamentals, analyst ratings and 7-day forecasts for 100+ assets. Ask me anything about markets, stocks, crypto or commodities.",
      ts: Date.now(),
    }]);
  }, [authReady, tier]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // CEO auto-scroll
  useEffect(() => {
    ceoEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ceoFeed, ceoLoading]);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    if (tier === "free") return;
    if (tier === "pro" && proCount >= PRO_DAILY_LIMIT) return;

    setInput("");
    const userMsg: Msg = { role: "user", content: msg, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Track pro usage
    if (tier === "pro") {
      const newCount = proCount + 1;
      setProCount(newCount);
      localStorage.setItem(PRO_LIMIT_KEY, String(newCount));
    }

    try {
      // ── Build rich context ────────────────────────────────────────────────
      const tickers = extractTickers(msg);
      if (selected && !tickers.includes(selected)) tickers.unshift(selected);

      // Fetch all context in parallel
      const [newsResults, fundResults, analResults] = await Promise.all([
        // News for each mentioned ticker
        Promise.all(tickers.slice(0, 3).map(t =>
          fetch(`${API}/api/news/${encodeURIComponent(t)}`).then(r => r.json()).catch(() => ({ headlines: [] }))
        )),
        // Fundamentals
        Promise.all(tickers.slice(0, 3).map(t =>
          fetch(`${API}/api/fundamentals/${encodeURIComponent(t)}`).then(r => r.json()).catch(() => null)
        )),
        // Analyst
        Promise.all(tickers.slice(0, 3).map(t =>
          fetch(`${API}/api/analyst/${encodeURIComponent(t)}`).then(r => r.json()).catch(() => null)
        )),
      ]);

      // ── Format price context ──────────────────────────────────────────────
      const priceLines = tickers.map(t => {
        const p = prices[t] || {};
        if (!p.price) return `  ${t}: price not available`;
        const chg = p.change_pct ?? 0;
        return `  ${t}: ${formatPrice(p.price, p.currency || "USD")} (${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%) signal=${p.signal || "?"} conf=${p.confidence || "?"}%`;
      }).join("\n");

      // ── Format news context ───────────────────────────────────────────────
      const newsLines = newsResults.flatMap((n, i) =>
        (n?.headlines || []).slice(0, 3).map((h: any) =>
          `  [${tickers[i]}] ${h.sentiment?.toUpperCase() || "?"}: ${h.title}`
        )
      ).join("\n");

      // ── Format fundamentals ───────────────────────────────────────────────
      const fundLines = fundResults.map((f, i) => {
        if (!f || f.error) return `  ${tickers[i]}: fundamentals unavailable`;
        return `  ${tickers[i]}: PE=${f.pe_ratio ?? "N/A"} MarketCap=${f.market_cap ? (f.market_cap / 1e9).toFixed(1) + "B" : "N/A"} EPS=${f.eps ?? "N/A"} Margin=${f.profit_margin ? (f.profit_margin * 100).toFixed(1) + "%" : "N/A"} NextEarnings=${f.next_earnings_date ?? "N/A"} Target=${f.analyst_target_price ?? "N/A"}`;
      }).join("\n");

      // ── Format analyst ────────────────────────────────────────────────────
      const analLines = analResults.map((a, i) => {
        if (!a || a.error) return `  ${tickers[i]}: analyst data unavailable`;
        return `  ${tickers[i]}: Consensus=${a.consensus} (${a.total_analysts} analysts) Target=${a.target_price ?? "N/A"} Upside=${a.upside_pct != null ? a.upside_pct + "%" : "N/A"} StrongBuy=${a.strong_buy} Buy=${a.buy} Hold=${a.hold} Sell=${a.sell}`;
      }).join("\n");

      // ── Market sessions (UTC-based) ───────────────────────────────────────
      const nowUtc     = new Date();
      const utcH       = nowUtc.getUTCHours();
      const utcM       = nowUtc.getUTCMinutes();
      const utcMins    = utcH * 60 + utcM;
      const isWeekday  = nowUtc.getUTCDay() >= 1 && nowUtc.getUTCDay() <= 5;
      const mktStatus  = (openMins: number, closeMins: number) =>
        isWeekday && utcMins >= openMins && utcMins < closeMins ? "OPEN" : "CLOSED";
      const sessions = {
        "India (NSE)":   mktStatus(3 * 60 + 45, 10 * 60),
        "US (NYSE)":     mktStatus(13 * 60 + 30, 21 * 60),
        "Chile (BCS)":   mktStatus(13 * 60 + 30, 21 * 60 + 30),
        "Canada (TSX)":  mktStatus(13 * 60 + 30, 21 * 60),
        "Crypto":        "24/7 OPEN",
      };
      const sessionsCtx = Object.entries(sessions)
        .map(([m, s]) => `  ${m}: ${s}`)
        .join("\n");

      // ── Chile + Canada regional movers ───────────────────────────────────
      const CHILE_ASSETS  = ["IPSA", "CENCOSUD", "FALABELLA", "COPEC", "SQM", "LATAM", "CAP", "ENELCHILE"];
      const CANADA_ASSETS = ["TSX", "SHOP", "RY", "TD", "ENB", "CNR", "ABX", "BCE", "CP", "MFC"];

      const fmtMover = (lbl: string) => {
        const p = prices[lbl];
        if (!p?.price) return null;
        const chg = p.change_pct ?? 0;
        return `${lbl} ${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%`;
      };

      const chileMovers  = CHILE_ASSETS.map(fmtMover).filter(Boolean).join(", ")  || "data loading";
      const canadaMovers = CANADA_ASSETS.map(fmtMover).filter(Boolean).join(", ") || "data loading";

      const chileGainers  = CHILE_ASSETS.filter(l => (prices[l]?.change_pct ?? 0) > 0)
        .sort((a, b) => (prices[b]?.change_pct ?? 0) - (prices[a]?.change_pct ?? 0)).slice(0, 3)
        .map(fmtMover).filter(Boolean).join(", ") || "none";
      const chileLosers   = CHILE_ASSETS.filter(l => (prices[l]?.change_pct ?? 0) < 0)
        .sort((a, b) => (prices[a]?.change_pct ?? 0) - (prices[b]?.change_pct ?? 0)).slice(0, 3)
        .map(fmtMover).filter(Boolean).join(", ") || "none";
      const canadaGainers = CANADA_ASSETS.filter(l => (prices[l]?.change_pct ?? 0) > 0)
        .sort((a, b) => (prices[b]?.change_pct ?? 0) - (prices[a]?.change_pct ?? 0)).slice(0, 3)
        .map(fmtMover).filter(Boolean).join(", ") || "none";
      const canadaLosers  = CANADA_ASSETS.filter(l => (prices[l]?.change_pct ?? 0) < 0)
        .sort((a, b) => (prices[a]?.change_pct ?? 0) - (prices[b]?.change_pct ?? 0)).slice(0, 3)
        .map(fmtMover).filter(Boolean).join(", ") || "none";

      // ── Outlook context ───────────────────────────────────────────────────
      const outlookCtx = outlook ? `
MARKET MOOD: ${outlook.mood} (${outlook.breadth.up} up / ${outlook.breadth.down} down)
TOP OPPORTUNITIES: ${outlook.opportunities.map(o => `${o.label} ${o.change_pct >= 0 ? "+" : ""}${o.change_pct}% [${o.signal}]`).join(", ")}
TOP RISKS: ${outlook.risks.map(r => `${r.label} ${r.change_pct}% [${r.signal}]`).join(", ")}` : "";

      const systemPrompt = `You are PREDIQ AI Analyst — an elite financial intelligence assistant with real-time market data access. You are currently focused on: ${selected}.

MARKET SESSIONS RIGHT NOW:
${sessionsCtx}

LIVE PRICE DATA (right now):
${priceLines || "  (loading)"}

LATEST NEWS:
${newsLines || "  (no recent news)"}

FUNDAMENTALS:
${fundLines}

ANALYST RATINGS:
${analLines}
${outlookCtx}

CHILE MARKET (BCS):
  Status: ${sessions["Chile (BCS)"]}
  All movers: ${chileMovers}
  Top gainers: ${chileGainers}
  Top losers:  ${chileLosers}

CANADA MARKET (TSX):
  Status: ${sessions["Canada (TSX)"]}
  All movers: ${canadaMovers}
  Top gainers: ${canadaGainers}
  Top losers:  ${canadaLosers}

PREDIQ SYSTEM:
- PREDIQ AI accuracy: ${accuracy} (verified, live trades)
- 100+ assets tracked: India, US, Chile, Canada, Crypto, Metals, Forex
- Swarm intelligence + ML fusion signals

INSTRUCTIONS:
- Always quote specific prices, changes, signals from the data above.
- When asked about Chile: cite IPSA, CENCOSUD, FALABELLA, COPEC prices and state the BCS market status.
- When asked about Canada: cite TSX, SHOP, RY, TD prices and state the TSX market status.
- When asked about fundamentals/valuation: quote P/E, target price, analyst consensus directly.
- When asked about news: cite specific headlines and their sentiment.
- State PREDIQ signal and confidence for any discussed asset.
- Be direct and analytical. Give a clear recommendation or view.
- 4–7 sentences. Plain text, no markdown, no asterisks.`;

      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API}/api/claude-proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model:      "claude-sonnet-4-6",
          max_tokens: 600,
          system:     systemPrompt,
          messages:   [...history, { role: "user", content: msg }],
        }),
      });
      const data  = await res.json();
      const reply = data?.content?.[0]?.text || data?.error?.message || "No response received.";
      setMessages(prev => [...prev, { role: "assistant", content: reply, ts: Date.now() }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: err?.name === "AbortError" ? "Request timed out." : `Error: ${err?.message || "Connection failed."}`,
        ts: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, tier, proCount, messages, prices, outlook, accuracy, selected]);

  // ── CEO Agent send ──────────────────────────────────────────────────────────
  const sendCeoInstruction = useCallback(async () => {
    const instruction = ceoInput.trim();
    if (!instruction || ceoLoading) return;
    setCeoInput("");
    setCeoFeed([]);
    setCeoLoading(true);
    let nextId = 0;
    try {
      const res = await fetch(`${API}/api/agent/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction, access_code: accessCode }),
      });
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;
      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop()!;
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const evt = JSON.parse(trimmed);
            if (evt.type === "done") { finished = true; break; }
            let content = "";
            if (evt.type === "tool_call") {
              const name = (evt.name || evt.tool || "tool").replace(/_/g, " ");
              content = `🔄 Research Agent: ${name}…`;
            } else if (evt.type === "tool_result") {
              content = "✅ done";
            } else if (evt.type === "text") {
              content = evt.text || evt.content || "";
            } else if (evt.type === "error") {
              content = evt.message || evt.error || "Unknown error";
            }
            if (content) setCeoFeed(prev => [...prev, { type: evt.type, content, id: nextId++ }]);
          } catch {}
        }
      }
    } catch (err: any) {
      setCeoFeed(prev => [...prev, { type: "error", content: `Error: ${err?.message || "Connection failed."}`, id: nextId++ }]);
    } finally {
      setCeoLoading(false);
    }
  }, [ceoInput, ceoLoading, accessCode]);

  // ── Key handler ─────────────────────────────────────────────────────────────
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!authReady) {
    return <div style={{ background: t.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: t.muted, fontFamily: "monospace" }}>Loading…</div>;
  }

  const isElite   = tier === "elite";
  const isPro     = tier === "pro";
  const isLocked  = tier === "free";
  const hitLimit  = isPro && proCount >= PRO_DAILY_LIMIT;

  return (
    <div style={{ background: t.bg, height: "100vh", display: "flex", flexDirection: "column", fontFamily: "monospace", overflow: "hidden" }}>

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", borderBottom: `1px solid ${t.border}`, background: t.panel, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSidebarOpen(v => !v)}
            style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.muted, borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontSize: 13 }}>
            ☰
          </button>
          <span style={{ color: t.accent, fontWeight: 800, fontSize: 14, letterSpacing: 2 }}>PREDIQ AI ANALYST</span>
          {isElite && <span style={{ background: `${t.accentHold}22`, border: `1px solid ${t.accentHold}44`, color: t.accentHold, fontSize: 9, padding: "2px 8px", borderRadius: 10, fontWeight: 700, letterSpacing: 1 }}>ELITE</span>}
          {isPro   && <span style={{ background: `${t.header}22`, border: `1px solid ${t.header}44`, color: t.header, fontSize: 9, padding: "2px 8px", borderRadius: 10, fontWeight: 700, letterSpacing: 1 }}>PRO {PRO_DAILY_LIMIT - proCount} left</span>}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {outlook && (
            <span style={{ fontSize: 11, color: moodColor(outlook.mood, t) }}>
              {moodIcon(outlook.mood)} {outlook.mood}
            </span>
          )}
          <span style={{ fontSize: 10, color: t.muted }}>ACC <span style={{ color: t.accent }}>{accuracy}</span></span>
          <a href="/dashboard" style={{ fontSize: 10, color: t.muted, textDecoration: "none", border: `1px solid ${t.border}`, padding: "3px 10px", borderRadius: 4 }}>DASHBOARD</a>
          <a href="/"          style={{ fontSize: 10, color: t.muted, textDecoration: "none", border: `1px solid ${t.border}`, padding: "3px 10px", borderRadius: 4 }}>← HOME</a>
          <button
            onClick={toggleTheme}
            style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 5, padding: "3px 10px", cursor: "pointer", color: t.accent, fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}
          >
            {t.label}
          </button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        {sidebarOpen && (
          <div style={{
            width: 240, background: t.panel, borderRight: `1px solid ${t.border}`,
            display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden",
          }}>
            {/* Asset selector */}
            <div style={{ padding: "12px 12px 8px", borderBottom: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 9, color: t.muted, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" as const }}>Focus Asset</div>
              <select
                value={selected}
                onChange={e => setSelected(e.target.value)}
                style={{
                  width: "100%", background: t.bg, border: `1px solid ${t.border}`, color: t.text,
                  borderRadius: 6, padding: "6px 10px", fontFamily: "monospace", fontSize: 12, cursor: "pointer",
                }}
              >
                {TRACKED_TICKERS.map(tk => <option key={tk} value={tk}>{tk}</option>)}
              </select>
              {prices[selected] && (
                <div style={{ marginTop: 8, fontSize: 11 }}>
                  <span style={{ color: t.text, fontWeight: 700 }}>
                    {formatPrice(prices[selected].price, prices[selected].currency || "USD")}
                  </span>
                  <span style={{ color: (prices[selected].change_pct ?? 0) >= 0 ? t.accentBuy : t.accentSell, marginLeft: 8 }}>
                    {(prices[selected].change_pct ?? 0) >= 0 ? "+" : ""}{(prices[selected].change_pct ?? 0).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>

            {/* Quick prompts */}
            <div style={{ padding: "10px 12px 8px", borderBottom: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 9, color: t.muted, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" as const }}>Quick Prompts</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {QUICK_PROMPTS.map(q => (
                  <button
                    key={q.label}
                    onClick={() => { setInput(q.prompt); inputRef.current?.focus(); }}
                    disabled={isLocked || hitLimit}
                    style={{
                      background:    "transparent",
                      border:        `1px solid ${t.border}`,
                      borderRadius:  5,
                      color:         isLocked || hitLimit ? t.muted : t.text,
                      fontSize:      11,
                      padding:       "5px 8px",
                      cursor:        isLocked || hitLimit ? "not-allowed" : "pointer",
                      textAlign:     "left" as const,
                      fontFamily:    "monospace",
                      transition:    "background 0.1s",
                    }}
                    onMouseEnter={e => { if (!isLocked && !hitLimit) (e.currentTarget.style.background = t.panelAlt); }}
                    onMouseLeave={e => { (e.currentTarget.style.background = "transparent"); }}
                  >
                    {q.icon} {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Market outlook mini */}
            <div style={{ padding: "10px 12px", flex: 1, overflow: "auto" }}>
              <div style={{ fontSize: 9, color: t.muted, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" as const }}>Market Breadth</div>
              {outlook ? (
                <>
                  <div style={{ fontSize: 11, color: moodColor(outlook.mood, t), fontWeight: 700, marginBottom: 6 }}>
                    {moodIcon(outlook.mood)} {outlook.mood}
                  </div>
                  <div style={{ display: "flex", gap: 8, fontSize: 10, marginBottom: 10 }}>
                    <span style={{ color: t.accentBuy }}>▲ {outlook.breadth.up}</span>
                    <span style={{ color: t.accentSell }}>▼ {outlook.breadth.down}</span>
                    <span style={{ color: t.muted }}>→ {outlook.breadth.unchanged}</span>
                  </div>
                  <div style={{ fontSize: 9, color: t.muted, marginBottom: 4 }}>TOP OPPORTUNITIES</div>
                  {outlook.opportunities.map(o => (
                    <div key={o.label} style={{ fontSize: 10, color: t.accentBuy, marginBottom: 2 }}>
                      ▲ {o.label} {o.change_pct >= 0 ? "+" : ""}{o.change_pct}%
                    </div>
                  ))}
                  <div style={{ fontSize: 9, color: t.muted, marginTop: 8, marginBottom: 4 }}>RISKS</div>
                  {outlook.risks.map(r => (
                    <div key={r.label} style={{ fontSize: 10, color: t.accentSell, marginBottom: 2 }}>
                      ▼ {r.label} {r.change_pct}%
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ color: t.muted, fontSize: 10 }}>Loading outlook…</div>
              )}
            </div>
          </div>
        )}

        {/* ── Main chat area ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {isLocked || hitLimit ? (
            <LockedScreen isPro={hitLimit} t={t} />
          ) : (
            <>
              {/* Tab switcher — Elite only */}
              {isElite && (
                <div style={{
                  display: "flex", gap: 2, padding: "8px 16px",
                  borderBottom: `1px solid ${t.border}`, background: t.panel, flexShrink: 0,
                }}>
                  {(["analyst", "ceo"] as const).map((id) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      style={{
                        background: tab === id ? t.accent : "transparent",
                        color: tab === id ? t.bg : t.muted,
                        border: `1px solid ${tab === id ? t.accent : t.border}`,
                        borderRadius: 6, padding: "5px 14px", cursor: "pointer",
                        fontFamily: "monospace", fontSize: 11, fontWeight: 700,
                        letterSpacing: 1, transition: "all 0.15s",
                      }}
                    >
                      {id === "analyst" ? "AI ANALYST" : "CEO AGENT ⚡"}
                    </button>
                  ))}
                </div>
              )}

              {/* ── AI Analyst panel ─────────────────────────────────────────── */}
              {tab === "analyst" && (
                <>
                  {/* 7-day forecast strip */}
                  {Object.keys(forecasts).length > 0 && (
                    <div style={{
                      padding: "10px 16px", borderBottom: `1px solid ${t.border}`,
                      background: t.bg, flexShrink: 0,
                    }}>
                      <div style={{ fontSize: 9, color: t.muted, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" as const }}>
                        7-Day Signal Forecast
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {FORECAST_ASSETS.map(lbl => (
                          <ForecastBar key={lbl} label={lbl} forecast={forecasts[lbl] || []} t={t} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                    {messages.map((m, i) => <Bubble key={i} msg={m} t={t} />)}
                    {loading && (
                      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%", background: `${t.accent}22`,
                          border: `1px solid ${t.accent}44`, display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: 13, flexShrink: 0,
                        }}>🤖</div>
                        <div style={{ background: t.panel, border: `1px solid ${t.border}`, borderRadius: "12px 12px 12px 2px", padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            {[0, 1, 2].map(i => (
                              <div key={i} style={{
                                width: 6, height: 6, borderRadius: "50%", background: t.accent,
                                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                                opacity: 0.7,
                              }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input area */}
                  <div style={{ padding: "12px 16px", borderTop: `1px solid ${t.border}`, background: t.panel, flexShrink: 0 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={onKey}
                        placeholder={`Ask about ${selected}, markets, signals, fundamentals…  (Enter to send)`}
                        rows={2}
                        style={{
                          flex:        1,
                          background:  t.bg,
                          border:      `1px solid ${t.border}`,
                          borderRadius: 8,
                          color:       t.text,
                          fontFamily:  "monospace",
                          fontSize:    13,
                          padding:     "10px 14px",
                          resize:      "none",
                          outline:     "none",
                          lineHeight:  1.5,
                        }}
                        onFocus={e  => { e.currentTarget.style.borderColor = t.accent; }}
                        onBlur={e   => { e.currentTarget.style.borderColor = t.border; }}
                      />
                      <button
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim()}
                        style={{
                          background:   loading || !input.trim() ? t.panelAlt : t.accent,
                          color:        loading || !input.trim() ? t.muted : t.bg,
                          border:       "none",
                          borderRadius: 8,
                          padding:      "14px 20px",
                          cursor:       loading || !input.trim() ? "not-allowed" : "pointer",
                          fontFamily:   "monospace",
                          fontWeight:   800,
                          fontSize:     14,
                          flexShrink:   0,
                          transition:   "background 0.15s",
                        }}
                      >
                        {loading ? "…" : "→"}
                      </button>
                    </div>
                    <div style={{ fontSize: 9, color: t.muted, marginTop: 6, textAlign: "center" }}>
                      {isElite ? "Unlimited Elite access" : `Pro: ${PRO_DAILY_LIMIT - proCount} messages remaining today`}
                      {" · "}Shift+Enter for new line · Context auto-attached
                    </div>
                  </div>
                </>
              )}

              {/* ── CEO Agent panel ──────────────────────────────────────────── */}
              {tab === "ceo" && isElite && (
                <>
                  {/* Feed */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                    {ceoFeed.length === 0 && !ceoLoading && (
                      <div style={{ color: t.muted, fontSize: 12, textAlign: "center", marginTop: 60 }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
                        <div style={{ fontWeight: 700, marginBottom: 8, color: t.text }}>CEO AGENT</div>
                        <div style={{ maxWidth: 360, margin: "0 auto", lineHeight: 1.7 }}>
                          Issue a high-level instruction and watch the agent research, screen assets, and synthesize a report.
                        </div>
                      </div>
                    )}
                    {ceoFeed.map(item => (
                      <div key={item.id} style={{
                        marginBottom: 8, fontSize: 12, padding: "8px 12px", borderRadius: 6,
                        background: item.type === "error" ? `${t.accentSell}11` : t.panel,
                        border: `1px solid ${item.type === "error" ? t.accentSell : t.border}`,
                        color: item.type === "error"       ? t.accentSell
                             : item.type === "text"        ? t.text
                             : item.type === "tool_call"   ? t.accentHold
                             : item.type === "tool_result" ? t.accentBuy
                             : t.muted,
                        whiteSpace: "pre-wrap",
                      }}>
                        {item.content}
                      </div>
                    ))}
                    {ceoLoading && (
                      <div style={{ display: "flex", gap: 4, alignItems: "center", color: t.muted, fontSize: 11, padding: "8px 0" }}>
                        <div style={{ display: "flex", gap: 3 }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} style={{
                              width: 5, height: 5, borderRadius: "50%", background: t.accent,
                              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`, opacity: 0.7,
                            }} />
                          ))}
                        </div>
                        Agent working…
                      </div>
                    )}
                    <div ref={ceoEndRef} />
                  </div>

                  {/* CEO input */}
                  <div style={{ padding: "12px 16px", borderTop: `1px solid ${t.border}`, background: t.panel, flexShrink: 0 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                      <textarea
                        value={ceoInput}
                        onChange={e => setCeoInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendCeoInstruction(); } }}
                        placeholder="Give the CEO Agent an instruction… (e.g. Screen top momentum stocks and give me 3 trade ideas)"
                        rows={2}
                        style={{
                          flex: 1, background: t.bg, border: `1px solid ${t.border}`,
                          borderRadius: 8, color: t.text, fontFamily: "monospace",
                          fontSize: 13, padding: "10px 14px", resize: "none",
                          outline: "none", lineHeight: 1.5,
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = t.accent; }}
                        onBlur={e  => { e.currentTarget.style.borderColor = t.border; }}
                      />
                      <button
                        onClick={sendCeoInstruction}
                        disabled={ceoLoading || !ceoInput.trim()}
                        style={{
                          background: ceoLoading || !ceoInput.trim() ? t.panelAlt : t.accent,
                          color: ceoLoading || !ceoInput.trim() ? t.muted : t.bg,
                          border: "none", borderRadius: 8, padding: "14px 20px",
                          cursor: ceoLoading || !ceoInput.trim() ? "not-allowed" : "pointer",
                          fontFamily: "monospace", fontWeight: 800, fontSize: 14,
                          flexShrink: 0, transition: "background 0.15s",
                        }}
                      >
                        {ceoLoading ? "…" : "⚡"}
                      </button>
                    </div>
                    <div style={{ fontSize: 9, color: t.muted, marginTop: 6, textAlign: "center" }}>
                      CEO Agent uses research tools · Elite only · Enter to run
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        textarea::-webkit-scrollbar { width: 4px; }
        textarea::-webkit-scrollbar-track { background: transparent; }
        textarea::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 2px; }
        *::-webkit-scrollbar { width: 5px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 3px; }
      `}</style>
    </div>
  );
}
