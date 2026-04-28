import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://prediq-time-machine-production.up.railway.app";

const ASSETS = [
  { label: "AAPL",  name: "Apple",           tv: "NASDAQ:AAPL",   type: "stock" },
  { label: "MSFT",  name: "Microsoft",       tv: "NASDAQ:MSFT",   type: "stock" },
  { label: "GOOGL", name: "Alphabet",        tv: "NASDAQ:GOOGL",  type: "stock" },
  { label: "AMZN",  name: "Amazon",          tv: "NASDAQ:AMZN",   type: "stock" },
  { label: "META",  name: "Meta",            tv: "NASDAQ:META",   type: "stock" },
  { label: "NVIDIA",name: "NVIDIA",          tv: "NASDAQ:NVDA",   type: "stock" },
  { label: "TSLA",  name: "Tesla",           tv: "NASDAQ:TSLA",   type: "stock" },
  { label: "SPX",   name: "S&P 500",         tv: "SP:SPX",        type: "index" },
  { label: "NASDAQ",name: "Nasdaq",          tv: "NASDAQ:QQQ",    type: "index" },
  { label: "JPM",   name: "JPMorgan",        tv: "NYSE:JPM",      type: "stock" },
  { label: "GOLD",  name: "Gold",            tv: "TVC:GOLD",      type: "commodity" },
  { label: "WTI",   name: "Crude Oil",       tv: "TVC:USOIL",     type: "commodity" },
  { label: "SILVER",name: "Silver",          tv: "TVC:SILVER",    type: "commodity" },
  { label: "BTC/USD",name: "Bitcoin",        tv: "BINANCE:BTCUSDT",type: "crypto" },
  { label: "ETH/USD",name: "Ethereum",       tv: "BINANCE:ETHUSDT",type: "crypto" },
  { label: "SOL/USD",name: "Solana",         tv: "BINANCE:SOLUSDT",type: "crypto" },
  { label: "NIFTY50",name: "Nifty 50",       tv: "NSE:NIFTY50",   type: "index" },
  { label: "SENSEX", name: "Sensex",         tv: "BSE:SENSEX",    type: "index" },
  { label: "TCS",    name: "TCS",            tv: "NSE:TCS",       type: "stock" },
  { label: "RELIANCE",name: "Reliance",      tv: "NSE:RELIANCE",  type: "stock" },
  { label: "TATAMOTORS",name: "Tata Motors", tv: "NSE:TATAMOTORS",type: "stock" },
  { label: "INFY",   name: "Infosys",        tv: "NSE:INFY",      type: "stock" },
  { label: "IPSA",   name: "IPSA Chile",     tv: "INDEX:IPSA",    type: "index" },
  { label: "SQM",    name: "SQM",            tv: "NYSE:SQM",      type: "stock" },
  { label: "USD/INR",name: "USD/INR",        tv: "FX:USDINR",     type: "forex" },
  { label: "CLP/USD",name: "CLP/USD",        tv: "FX_IDC:CLPUSD", type: "forex" },
  // More US
  { label: "BAC",   name: "Bank of America", tv: "NYSE:BAC",      type: "stock" },
  { label: "GS",    name: "Goldman Sachs",   tv: "NYSE:GS",       type: "stock" },
  { label: "XOM",   name: "ExxonMobil",      tv: "NYSE:XOM",      type: "stock" },
  { label: "WMT",   name: "Walmart",         tv: "NYSE:WMT",      type: "stock" },
  { label: "JNJ",   name: "Johnson & Johnson",tv: "NYSE:JNJ",     type: "stock" },
  { label: "NFLX",  name: "Netflix",         tv: "NASDAQ:NFLX",   type: "stock" },
  { label: "DOW",   name: "Dow Jones",       tv: "TVC:DJI",       type: "index" },
  // More India
  { label: "HDFCBANK",name: "HDFC Bank",     tv: "NSE:HDFCBANK",  type: "stock" },
  { label: "WIPRO",  name: "Wipro",          tv: "NSE:WIPRO",     type: "stock" },
  { label: "HAL",    name: "HAL",            tv: "NSE:HAL",       type: "stock" },
  { label: "ZOMATO", name: "Zomato",         tv: "NSE:ZOMATO",    type: "stock" },
  { label: "BEL",    name: "BEL",            tv: "NSE:BEL",       type: "stock" },
  // Canada
  { label: "TSX",    name: "TSX Index",      tv: "TVC:TSX60",       type: "index" },
  { label: "RY",     name: "Royal Bank",     tv: "TSX:RY",        type: "stock" },
  { label: "TD",     name: "TD Bank",        tv: "TSX:TD",        type: "stock" },
  { label: "SHOP",   name: "Shopify",        tv: "TSX:SHOP",      type: "stock" },
  // More Crypto
  { label: "XRP/USD",name: "XRP",            tv: "BINANCE:XRPUSDT",type: "crypto" },
  // More Commodities
  { label: "COPPER", name: "Copper",         tv: "COMEX:HG1!",    type: "commodity" },
  { label: "BRENT",  name: "Brent Oil",      tv: "TVC:UKOIL",     type: "commodity" },
  { label: "NATGAS", name: "Natural Gas",    tv: "TVC:NATURALGAS",type: "commodity" },
  // US Banks
  { label: "MS",       name: "Morgan Stanley",  tv: "NYSE:MS",        type: "stock" },
  // India Banks
  { label: "ICICIBANK",name: "ICICI Bank",      tv: "NSE:ICICIBANK",  type: "stock" },
  { label: "SBIN",     name: "State Bank",      tv: "NSE:SBIN",       type: "stock" },
  { label: "AXISBANK", name: "Axis Bank",       tv: "NSE:AXISBANK",   type: "stock" },
  { label: "KOTAKBANK",name: "Kotak Bank",      tv: "NSE:KOTAKBANK",  type: "stock" },
  // Chile Banks
  { label: "BCHILE",   name: "Banco Chile",     tv: "NYSE:BCH",       type: "stock" },
  { label: "BSANTANDER",name:"Santander CL",    tv: "NYSE:BSAC",      type: "stock" },
  // Canada Banks
  { label: "BMO",      name: "Bank of Montreal",tv: "TSX:BMO",        type: "stock" },
  { label: "BNS",      name: "Scotiabank",      tv: "TSX:BNS",        type: "stock" },
  // More Forex
  { label: "MXN/USD",name: "MXN/USD",        tv: "FX:USDMXN",     type: "forex" },
];

const INTERVALS = ["1D","1W","1M","3M","6M","12M"];

export default function ChartPage() {
  const router = useRouter();
  const chartRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(ASSETS[0]);
  const [interval, setInterval] = useState("1D");
  const [signal, setSignal] = useState<any>(null);
  const [price, setPrice] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"chart"|"analysis">("chart");
  const widgetRef = useRef<any>(null);

  const filtered = ASSETS.filter(a =>
    a.label.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (router.query.asset) {
      const found = ASSETS.find(a => a.label === router.query.asset);
      if (found) setSelected(found);
    }
  }, [router.query]);

  useEffect(() => {
    loadChart();
    fetchSignal();
    fetchPrice();
  }, [selected, interval]);

  function loadChart() {
    if (!chartRef.current) return;
    chartRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if ((window as any).TradingView) {
        widgetRef.current = new (window as any).TradingView.widget({
          container_id: "tv-chart",
          symbol: selected.tv,
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#020408",
          enable_publishing: false,
          allow_symbol_change: false,
          save_image: false,
          backgroundColor: "#020408",
          gridColor: "rgba(255,255,255,0.04)",
          width: "100%",
          height: 480,
          studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
          hide_side_toolbar: false,
          withdateranges: true,
          range: interval === '1D' ? '3M' : interval,
        });
      }
    };
    document.head.appendChild(script);
  }

  async function fetchSignal() {
    setLoading(true);
    try {
      const p = await fetch(`${API_BASE}/api/prices/${selected.label}`).then(r => r.json());
      const change_pct = p.change_pct || 0;
      const res = await fetch(`${API_BASE}/api/signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: selected.label, asset_type: selected.type,
          price: p.price || 0, price_change_pct: change_pct,
          rsi: 50, volume_ratio: 1.0, news_sentiment: 0,
          social_buzz: 0, gold_correlation: 0,
        }),
      });
      const data = await res.json();
      setSignal(data);
    } catch {}
    setLoading(false);
  }

  async function fetchPrice() {
    try {
      const p = await fetch(`${API_BASE}/api/prices/${selected.label}`).then(r => r.json());
      setPrice(p);
    } catch {}
  }

  const sigColor = signal?.direction === "buy" ? "#00ff88" : signal?.direction === "sell" ? "#ff4466" : "#ffd166";
  const sigLabel = signal?.signal || "—";

  return (
    <div style={{ background: "#020408", minHeight: "100vh", color: "#fff", fontFamily: "monospace" }}>
      {/* Nav */}
      <div style={{ borderBottom: "1px solid rgba(255,209,102,0.12)", padding: "14px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, background: "#020408" }}>
        <a href="/" style={{ fontFamily: "'Cinzel',serif", fontSize: 18, fontWeight: 700, color: "#ffd166", textDecoration: "none", letterSpacing: "0.1em" }}>PREDIQ</a>
        <div style={{ display: "flex", gap: 12 }}>
          <a href="/" style={{ fontSize: 10, color: "#ffd166", textDecoration: "none", border: "1px solid rgba(255,209,102,0.3)", padding: "4px 12px", borderRadius: 3 }}>← HOME</a>
          <a href="/accuracy" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textDecoration: "none", border: "1px solid rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: 3 }}>ACCURACY</a>
        </div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 53px)" }}>
        {/* Sidebar */}
        <div style={{ width: 220, borderRight: "1px solid rgba(255,255,255,0.06)", overflowY: "auto", padding: "12px 0" }}>
          <div style={{ padding: "0 12px 10px" }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search..." style={{ width: "100%", background: "rgba(255,255,5,0.05)",
              border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "6px 10px",
              borderRadius: 4, fontSize: 11, outline: "none", boxSizing: "border-box" }} />
          </div>
          {filtered.map(a => (
            <div key={a.label} onClick={() => setSelected(a)}
              style={{ padding: "8px 16px", cursor: "pointer", borderLeft: selected.label === a.label ? "2px solid #ffd166" : "2px solid transparent",
                background: selected.label === a.label ? "rgba(255,209,102,0.06)" : "transparent" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: selected.label === a.label ? "#ffd166" : "#fff" }}>{a.label}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{a.name}</div>
            </div>
          ))}
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {/* Header */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#ffd166" }}>{selected.label}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{selected.name}</div>
            </div>
            {price && (
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{price.currency === "₹" ? "₹" : "$"}{price.price?.toLocaleString()}</div>
                <div style={{ fontSize: 14, color: price.change_pct >= 0 ? "#00ff88" : "#ff4466", fontWeight: 700 }}>
                  {price.change_pct >= 0 ? "+" : ""}{price.change_pct?.toFixed(2)}%
                </div>
              </div>
            )}
            {signal && (
              <div style={{ marginLeft: "auto", display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", marginBottom: 4 }}>PREDIQ SIGNAL</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: sigColor, border: `1px solid ${sigColor}`,
                    padding: "4px 16px", borderRadius: 3 }}>{sigLabel}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", marginBottom: 4 }}>CONFIDENCE</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: sigColor }}>{signal.confidence?.toFixed(1)}%</div>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px" }}>
            {(["chart","analysis"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "10px 20px", border: "none", background: "transparent",
                borderBottom: tab === t ? "2px solid #ffd166" : "2px solid transparent",
                color: tab === t ? "#ffd166" : "rgba(255,255,255,0.4)",
                fontSize: 11, cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase"
              }}>{t}</button>
            ))}
            {/* Interval selector */}
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
              {INTERVALS.map(i => (
                <button key={i} onClick={() => setInterval(i)} style={{
                  padding: "4px 8px", border: "1px solid",
                  borderColor: interval === i ? "#00ff88" : "rgba(255,255,255,0.1)",
                  background: interval === i ? "rgba(0,255,136,0.08)" : "transparent",
                  color: interval === i ? "#00ff88" : "rgba(255,255,255,0.4)",
                  fontSize: 10, cursor: "pointer", borderRadius: 3
                }}>{i}</button>
              ))}
            </div>
          </div>

          {tab === "chart" && (
            <div style={{ padding: "0" }}>
              <div id="tv-chart" ref={chartRef} style={{ width: "100%", height: 520 }} />
            </div>
          )}

          {tab === "analysis" && (
            <div style={{ padding: "24px" }}>
              {/* Signal breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "SIGNAL", value: sigLabel, color: sigColor },
                  { label: "CONFIDENCE", value: signal ? `${signal.confidence?.toFixed(1)}%` : "—", color: sigColor },
                  { label: "BUY AGENTS", value: signal ? `${signal.swarm?.buy_pct?.toFixed(1)}%` : "—", color: "#00ff88" },
                  { label: "SELL AGENTS", value: signal ? `${signal.swarm?.sell_pct?.toFixed(1)}%` : "—", color: "#ff4466" },
                  { label: "PRICE", value: price ? `${price.price?.toLocaleString()}` : "—", color: "#ffd166" },
                  { label: "24H CHANGE", value: price ? `${price.change_pct >= 0 ? "+" : ""}${price.change_pct?.toFixed(2)}%` : "—",
                    color: price?.change_pct >= 0 ? "#00ff88" : "#ff4466" },
                ].map(k => (
                  <div key={k.label} style={{ background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "16px 20px" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", marginBottom: 8 }}>{k.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* Swarm breakdown */}
              {signal?.swarm && (
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 8, padding: "20px 24px", marginBottom: 24 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", marginBottom: 16 }}>// SWARM BREAKDOWN</div>
                  {[
                    { label: "BUY", pct: signal.swarm.buy_pct, color: "#00ff88" },
                    { label: "HOLD", pct: signal.swarm.hold_pct, color: "#ffd166" },
                    { label: "SELL", pct: signal.swarm.sell_pct, color: "#ff4466" },
                  ].map(s => (
                    <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 40, fontSize: 11, color: s.color }}>{s.label}</div>
                      <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 8 }}>
                        <div style={{ height: "100%", width: `${s.pct}%`, background: s.color, borderRadius: 4, transition: "width 0.6s ease" }} />
                      </div>
                      <div style={{ width: 50, textAlign: "right", fontSize: 12, color: s.color }}>{s.pct?.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Refresh button */}
              <button onClick={() => { fetchSignal(); fetchPrice(); }} style={{
                padding: "10px 24px", background: "rgba(0,255,136,0.08)",
                border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88",
                fontFamily: "monospace", fontSize: 11, cursor: "pointer", borderRadius: 3,
                letterSpacing: "0.1em"
              }}>{loading ? "LOADING..." : "REFRESH SIGNAL"}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
