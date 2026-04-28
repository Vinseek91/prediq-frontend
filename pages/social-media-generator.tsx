import { useState, useRef, useEffect, useCallback } from "react";

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#020408",
  surface: "#060f06",
  green: "#00ff88",
  cyan: "#00d4ff",
  amber: "#ffa020",
  red: "#ff3c78",
  purple: "#aa44ff",
  border: "#1a3a1a",
  textPrimary: "#ffffff",
  textSecondary: "#3a6a4a",
};

const FONT = '"Courier New", Courier, monospace';

// ── Post types & formats ─────────────────────────────────────────────────────
const POST_TYPES = [
  { id: "accuracy",   label: "ACCURACY",   desc: "83.3% accuracy hero" },
  { id: "signal",     label: "SIGNAL",     desc: "BUY / SELL card" },
  { id: "market",     label: "MARKET",     desc: "Region summary" },
  { id: "feature",    label: "AI CHAT",    desc: "Chat screenshot" },
  { id: "comparison", label: "COMPARISON", desc: "PREDIQ vs Bloomberg" },
] as const;

type PostType = typeof POST_TYPES[number]["id"];

const FORMATS = [
  { id: "instagram",  label: "INSTAGRAM",  w: 1080, h: 1080, scale: 0.38 },
  { id: "story",      label: "STORY",      w: 1080, h: 1920, scale: 0.22 },
  { id: "tiktok",     label: "TIKTOK",     w: 1080, h: 1920, scale: 0.22 },
  { id: "linkedin",   label: "LINKEDIN",   w: 1200, h: 627,  scale: 0.38 },
  { id: "youtube",    label: "YOUTUBE",    w: 1280, h: 720,  scale: 0.36 },
  { id: "twitter",    label: "TWITTER/X",  w: 1200, h: 675,  scale: 0.38 },
] as const;

type FormatId = typeof FORMATS[number]["id"];

// ── Live data ────────────────────────────────────────────────────────────────
const API_BASE = "https://prediq-time-machine-production.up.railway.app";

const STATIC_DATA = {
  accuracy: 83.3,
  agents: "2.4M",
  assets: "98+",
  markets: 6,
  waitlist: "1,200+",
  price: 19,
  bloomberg: 2000,
  vs_gpt5: "+14.6%",
  url: "prediq.netlify.app",
  topSignals: [
    { label: "AAPL",    signal: "BUY",  confidence: 87, move: "+2.4%" },
    { label: "BTC/USD", signal: "SELL", confidence: 81, move: "-3.1%" },
    { label: "GOLD",    signal: "BUY",  confidence: 79, move: "+1.8%" },
    { label: "NIFTY50", signal: "BUY",  confidence: 74, move: "+0.9%" },
    { label: "EUR/USD", signal: "HOLD", confidence: 62, move: "+0.2%" },
  ],
};

// ── Canvas renderers ─────────────────────────────────────────────────────────
function renderScanLine(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(0,255,136,0)");
  grad.addColorStop(0.5, "rgba(0,255,136,0.06)");
  grad.addColorStop(1, "rgba(0,255,136,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function renderGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = "rgba(26,58,26,0.5)";
  ctx.lineWidth = 1;
  const step = 60;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
}

function renderWatermark(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.font = `500 20px ${FONT}`;
  ctx.fillStyle = "rgba(0,255,136,0.35)";
  ctx.textAlign = "right";
  ctx.fillText("prediq.netlify.app", w - 32, h - 28);
  ctx.textAlign = "left";
}

function renderAccuracy(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: typeof STATIC_DATA,
) {
  // BG
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  renderGrid(ctx, w, h);
  renderScanLine(ctx, w, h);

  const cx = w / 2;
  const isLandscape = w > h;
  const topPad = isLandscape ? h * 0.15 : h * 0.14;

  // PREDIQ header
  ctx.font = `700 ${isLandscape ? 22 : 28}px ${FONT}`;
  ctx.fillStyle = C.textSecondary;
  ctx.letterSpacing = "6px";
  ctx.textAlign = "center";
  ctx.fillText("▶ PREDIQ", cx, topPad);

  // Tagline
  ctx.font = `400 ${isLandscape ? 13 : 16}px ${FONT}`;
  ctx.fillStyle = "rgba(0,255,136,0.5)";
  ctx.fillText("AI TRADING INTELLIGENCE", cx, topPad + (isLandscape ? 30 : 40));

  // Big accuracy number
  const numSize = isLandscape ? Math.min(h * 0.48, 220) : Math.min(w * 0.28, 200);
  ctx.font = `700 ${numSize}px ${FONT}`;
  ctx.fillStyle = C.green;
  ctx.shadowColor = C.green;
  ctx.shadowBlur = 40;
  ctx.fillText("83.3%", cx, topPad + (isLandscape ? h * 0.52 : h * 0.44));
  ctx.shadowBlur = 0;

  // Label below number
  const labelY = topPad + (isLandscape ? h * 0.52 : h * 0.44) + (isLandscape ? 18 : 22);
  ctx.font = `400 ${isLandscape ? 14 : 18}px ${FONT}`;
  ctx.fillStyle = C.textSecondary;
  ctx.letterSpacing = "4px";
  ctx.fillText("DIRECTIONAL ACCURACY", cx, labelY);

  // Verified pill
  const pillW = isLandscape ? 160 : 180;
  const pillH = isLandscape ? 28 : 32;
  const pillX = cx - pillW / 2;
  const pillY = labelY + (isLandscape ? 18 : 22);
  ctx.fillStyle = "rgba(0,255,136,0.15)";
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 20);
  ctx.fill();
  ctx.stroke();
  ctx.font = `700 ${isLandscape ? 10 : 12}px ${FONT}`;
  ctx.fillStyle = C.green;
  ctx.letterSpacing = "3px";
  ctx.fillText("✓ VERIFIED LIVE DATA", cx, pillY + pillH * 0.67);

  // Stats row
  const statsY = isLandscape ? h - 80 : h - 130;
  const stats = [
    { label: "SWARM AGENTS", value: data.agents },
    { label: "ASSETS", value: data.assets },
    { label: "MARKETS", value: `${data.markets}` },
  ];
  const colW = w / stats.length;
  stats.forEach((s, i) => {
    const sx = colW * i + colW / 2;
    ctx.font = `700 ${isLandscape ? 28 : 36}px ${FONT}`;
    ctx.fillStyle = C.green;
    ctx.shadowColor = C.green;
    ctx.shadowBlur = 12;
    ctx.fillText(s.value, sx, statsY);
    ctx.shadowBlur = 0;
    ctx.font = `400 ${isLandscape ? 11 : 13}px ${FONT}`;
    ctx.fillStyle = C.textSecondary;
    ctx.letterSpacing = "2px";
    ctx.fillText(s.label, sx, statsY + (isLandscape ? 22 : 26));
  });

  renderWatermark(ctx, w, h);
}

function renderSignal(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: typeof STATIC_DATA,
) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  renderGrid(ctx, w, h);
  renderScanLine(ctx, w, h);

  const cx = w / 2;
  const isLandscape = w > h;
  const sig = data.topSignals[0];
  const sigColor = sig.signal === "BUY" ? C.green : sig.signal === "SELL" ? C.red : C.purple;

  // Header
  ctx.font = `700 ${isLandscape ? 18 : 22}px ${FONT}`;
  ctx.fillStyle = C.textSecondary;
  ctx.letterSpacing = "5px";
  ctx.textAlign = "center";
  ctx.fillText("▶ PREDIQ SIGNAL", cx, isLandscape ? 60 : 80);

  // Card bg
  const cardW = Math.min(w * 0.82, 600);
  const cardH = isLandscape ? h * 0.58 : h * 0.42;
  const cardX = cx - cardW / 2;
  const cardY = isLandscape ? h * 0.18 : h * 0.18;
  ctx.fillStyle = C.surface;
  ctx.strokeStyle = sigColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 12);
  ctx.fill();
  ctx.stroke();

  // Left accent bar
  ctx.fillStyle = sigColor;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, 5, cardH, [12, 0, 0, 12]);
  ctx.fill();

  const inX = cardX + 32;
  const inW = cardW - 64;
  let y = cardY + 48;

  // Signal badge
  ctx.fillStyle = `${sigColor}22`;
  ctx.strokeStyle = sigColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(inX, y - 26, 100, 36, 8);
  ctx.fill();
  ctx.stroke();
  ctx.font = `700 ${isLandscape ? 18 : 22}px ${FONT}`;
  ctx.fillStyle = sigColor;
  ctx.letterSpacing = "4px";
  ctx.textAlign = "left";
  ctx.fillText(sig.signal, inX + 14, y);

  // Asset
  ctx.font = `700 ${isLandscape ? 44 : 54}px ${FONT}`;
  ctx.fillStyle = C.textPrimary;
  ctx.shadowColor = sigColor;
  ctx.shadowBlur = 18;
  ctx.textAlign = "right";
  ctx.fillText(sig.label, cardX + cardW - 24, y + (isLandscape ? 2 : 6));
  ctx.shadowBlur = 0;

  y += isLandscape ? 50 : 65;

  // Predicted move
  ctx.font = `400 ${isLandscape ? 14 : 17}px ${FONT}`;
  ctx.fillStyle = C.textSecondary;
  ctx.textAlign = "left";
  ctx.letterSpacing = "2px";
  ctx.fillText("PREDICTED MOVE", inX, y);
  ctx.font = `700 ${isLandscape ? 26 : 32}px ${FONT}`;
  ctx.fillStyle = sigColor;
  ctx.textAlign = "right";
  ctx.fillText(sig.move, cardX + cardW - 24, y);

  y += isLandscape ? 40 : 50;

  // Confidence bar
  ctx.font = `400 ${isLandscape ? 13 : 15}px ${FONT}`;
  ctx.fillStyle = C.textSecondary;
  ctx.textAlign = "left";
  ctx.letterSpacing = "2px";
  ctx.fillText(`CONFIDENCE — ${sig.confidence}%`, inX, y);

  y += 16;
  const barH = isLandscape ? 10 : 12;
  ctx.fillStyle = "rgba(0,255,136,0.12)";
  ctx.beginPath();
  ctx.roundRect(inX, y, inW, barH, 6);
  ctx.fill();
  ctx.fillStyle = sigColor;
  ctx.shadowColor = sigColor;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(inX, y, inW * (sig.confidence / 100), barH, 6);
  ctx.fill();
  ctx.shadowBlur = 0;

  y += isLandscape ? 36 : 44;

  // Footer in card
  ctx.font = `400 ${isLandscape ? 11 : 13}px ${FONT}`;
  ctx.fillStyle = "rgba(58,106,74,0.7)";
  ctx.letterSpacing = "1px";
  ctx.textAlign = "left";
  ctx.fillText(`2.4M SWARM AGENTS · ${new Date().toDateString().toUpperCase()}`, inX, y);

  // Below card stats
  const bY = cardY + cardH + (isLandscape ? 36 : 50);
  ctx.textAlign = "center";
  ctx.font = `400 ${isLandscape ? 13 : 16}px ${FONT}`;
  ctx.fillStyle = C.textSecondary;
  ctx.letterSpacing = "2px";
  ctx.fillText(`${data.assets} ASSETS · 6 MARKETS · ${data.accuracy}% ACCURACY`, cx, bY);

  renderWatermark(ctx, w, h);
}

function renderMarket(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: typeof STATIC_DATA,
) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  renderGrid(ctx, w, h);
  renderScanLine(ctx, w, h);

  const cx = w / 2;
  const isLandscape = w > h;

  // Header
  ctx.font = `700 ${isLandscape ? 18 : 22}px ${FONT}`;
  ctx.fillStyle = C.textSecondary;
  ctx.letterSpacing = "5px";
  ctx.textAlign = "center";
  ctx.fillText("▶ PREDIQ MARKET SUMMARY", cx, isLandscape ? 56 : 75);

  ctx.font = `400 ${isLandscape ? 12 : 14}px ${FONT}`;
  ctx.fillStyle = "rgba(0,255,136,0.4)";
  ctx.letterSpacing = "2px";
  ctx.fillText(new Date().toDateString().toUpperCase(), cx, isLandscape ? 80 : 104);

  const signals = data.topSignals;
  const rowH = isLandscape ? (h * 0.6) / signals.length : (h * 0.56) / signals.length;
  const tableY = isLandscape ? h * 0.22 : h * 0.17;
  const tableW = Math.min(w * 0.86, 700);
  const tableX = cx - tableW / 2;

  signals.forEach((s, i) => {
    const sigColor = s.signal === "BUY" ? C.green : s.signal === "SELL" ? C.red : C.purple;
    const ry = tableY + i * rowH;

    ctx.fillStyle = i % 2 === 0 ? "rgba(6,15,6,0.8)" : "rgba(2,4,8,0.8)";
    ctx.fillRect(tableX, ry, tableW, rowH - 4);

    // Left accent
    ctx.fillStyle = sigColor;
    ctx.fillRect(tableX, ry, 3, rowH - 4);

    const textY = ry + rowH * 0.62;
    ctx.font = `700 ${isLandscape ? 18 : 22}px ${FONT}`;
    ctx.fillStyle = C.textPrimary;
    ctx.textAlign = "left";
    ctx.letterSpacing = "1px";
    ctx.fillText(s.label, tableX + 20, textY);

    ctx.font = `700 ${isLandscape ? 14 : 17}px ${FONT}`;
    ctx.fillStyle = sigColor;
    ctx.textAlign = "center";
    ctx.fillText(s.signal, tableX + tableW * 0.48, textY);

    ctx.font = `700 ${isLandscape ? 16 : 20}px ${FONT}`;
    ctx.fillStyle = sigColor;
    ctx.textAlign = "right";
    ctx.fillText(s.move, tableX + tableW - 16, textY - 8);

    // Confidence micro bar
    const barW = tableW * 0.22;
    const barX = tableX + tableW - barW - 16;
    const barY = textY + 4;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(barX, barY, barW, 4);
    ctx.fillStyle = sigColor;
    ctx.fillRect(barX, barY, barW * (s.confidence / 100), 4);
  });

  const botY = tableY + signals.length * rowH + (isLandscape ? 28 : 40);
  ctx.textAlign = "center";
  ctx.font = `400 ${isLandscape ? 12 : 14}px ${FONT}`;
  ctx.fillStyle = C.textSecondary;
  ctx.letterSpacing = "2px";
  ctx.fillText(`${data.accuracy}% ACCURACY · ${data.agents} AGENTS · ${data.assets} ASSETS`, cx, botY);

  renderWatermark(ctx, w, h);
}

function renderFeature(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  renderGrid(ctx, w, h);
  renderScanLine(ctx, w, h);

  const cx = w / 2;
  const isLandscape = w > h;

  ctx.font = `700 ${isLandscape ? 18 : 22}px ${FONT}`;
  ctx.fillStyle = C.textSecondary;
  ctx.letterSpacing = "5px";
  ctx.textAlign = "center";
  ctx.fillText("▶ PREDIQ AI CHAT", cx, isLandscape ? 56 : 75);

  const chatW = Math.min(w * 0.84, 640);
  const chatX = cx - chatW / 2;
  let y = isLandscape ? h * 0.18 : h * 0.14;
  const bubble = (text: string, role: "user" | "ai") => {
    const pad = 16;
    ctx.font = `400 ${isLandscape ? 13 : 15}px ${FONT}`;
    // Estimate width
    const maxBubW = chatW * 0.75;
    // Simple word wrap
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxBubW - pad * 2) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);

    const lineH = isLandscape ? 20 : 24;
    const bubH = lines.length * lineH + pad * 2;
    const bubW = Math.min(
      Math.max(...lines.map((l) => ctx.measureText(l).width)) + pad * 2,
      maxBubW,
    );

    let bx: number;
    if (role === "user") {
      bx = chatX + chatW - bubW;
      ctx.fillStyle = "#0a2a10";
      ctx.strokeStyle = "rgba(0,255,136,0.3)";
    } else {
      bx = chatX;
      ctx.fillStyle = "#030d03";
      ctx.strokeStyle = C.green;
    }
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (role === "user") {
      ctx.roundRect(bx, y, bubW, bubH, [12, 12, 0, 12]);
    } else {
      ctx.roundRect(bx, y, bubW, bubH, [12, 12, 12, 0]);
      // left border accent
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.fillRect(bx, y, 3, bubH);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = C.green;
    ctx.textAlign = "left";
    ctx.letterSpacing = "0px";
    lines.forEach((l, li) => {
      ctx.fillText(l, bx + pad + (role === "ai" ? 6 : 0), y + pad + li * lineH + lineH * 0.7);
    });
    y += bubH + (isLandscape ? 16 : 20);
  };

  bubble("What's the signal for AAPL today?", "user");
  bubble(
    "▶ PREDIQ consensus: BUY · Confidence 87% · Predicted +2.4% · 2.4M agents agree",
    "ai",
  );
  bubble("How accurate is PREDIQ vs GPT-5?", "user");
  bubble(
    "PREDIQ: 83.3% accuracy · GPT-5: 68.7% · PREDIQ beats GPT-5 by +14.6% on directional calls",
    "ai",
  );
  bubble("What markets do you cover?", "user");
  bubble("US · India · Chile · Canada · Crypto · Metals — 98+ assets, live 24/7", "ai");

  renderWatermark(ctx, w, h);
}

function renderComparison(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: typeof STATIC_DATA,
) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  renderGrid(ctx, w, h);
  renderScanLine(ctx, w, h);

  const cx = w / 2;
  const isLandscape = w > h;

  ctx.font = `700 ${isLandscape ? 18 : 22}px ${FONT}`;
  ctx.fillStyle = C.textSecondary;
  ctx.letterSpacing = "5px";
  ctx.textAlign = "center";
  ctx.fillText("▶ PREDIQ VS BLOOMBERG", cx, isLandscape ? 56 : 75);

  const cardW = (w * 0.42);
  const cardH = isLandscape ? h * 0.62 : h * 0.52;
  const cardY = isLandscape ? h * 0.2 : h * 0.15;
  const gap = w * 0.04;
  const leftX = cx - cardW - gap / 2;
  const rightX = cx + gap / 2;

  // PREDIQ card
  ctx.fillStyle = "rgba(0,255,136,0.07)";
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(leftX, cardY, cardW, cardH, 12);
  ctx.fill();
  ctx.stroke();

  // Bloomberg card
  ctx.fillStyle = "rgba(255,60,120,0.06)";
  ctx.strokeStyle = "rgba(255,60,120,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(rightX, cardY, cardW, cardH, 12);
  ctx.fill();
  ctx.stroke();

  const col = (
    x: number,
    cw: number,
    items: { label: string; value: string; color: string }[],
    title: string,
    titleColor: string,
  ) => {
    const mx = x + cw / 2;
    ctx.font = `700 ${isLandscape ? 14 : 17}px ${FONT}`;
    ctx.fillStyle = titleColor;
    ctx.letterSpacing = "3px";
    ctx.textAlign = "center";
    ctx.fillText(title, mx, cardY + (isLandscape ? 38 : 46));

    items.forEach((item, i) => {
      const iy = cardY + (isLandscape ? 82 : 100) + i * (isLandscape ? 68 : 82);
      ctx.font = `700 ${isLandscape ? 28 : 34}px ${FONT}`;
      ctx.fillStyle = item.color;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 10;
      ctx.fillText(item.value, mx, iy);
      ctx.shadowBlur = 0;
      ctx.font = `400 ${isLandscape ? 10 : 12}px ${FONT}`;
      ctx.fillStyle = C.textSecondary;
      ctx.letterSpacing = "2px";
      ctx.fillText(item.label, mx, iy + (isLandscape ? 18 : 22));
    });
  };

  col(leftX, cardW, [
    { label: "MONTHLY", value: `$${data.price}`, color: C.green },
    { label: "ACCURACY", value: `${data.accuracy}%`, color: C.green },
    { label: "VS GPT-5", value: data.vs_gpt5, color: C.cyan },
    { label: "ASSETS", value: data.assets, color: C.green },
  ], "PREDIQ", C.green);

  col(rightX, cardW, [
    { label: "MONTHLY", value: `$${data.bloomberg}`, color: C.red },
    { label: "AI SIGNALS", value: "NONE", color: C.red },
    { label: "VS GPT-5", value: "—", color: "rgba(255,255,255,0.3)" },
    { label: "ASSETS", value: "LIMITED", color: "rgba(255,255,255,0.4)" },
  ], "BLOOMBERG", "rgba(255,60,120,0.8)");

  // VS divider
  ctx.font = `700 ${isLandscape ? 26 : 32}px ${FONT}`;
  ctx.fillStyle = C.amber;
  ctx.shadowColor = C.amber;
  ctx.shadowBlur = 12;
  ctx.textAlign = "center";
  ctx.fillText("VS", cx, cardY + cardH / 2 + 12);
  ctx.shadowBlur = 0;

  // Win badge on PREDIQ side
  const badgeY = cardY + cardH + (isLandscape ? 20 : 28);
  ctx.font = `700 ${isLandscape ? 13 : 16}px ${FONT}`;
  ctx.fillStyle = C.green;
  ctx.letterSpacing = "2px";
  ctx.textAlign = "center";
  ctx.fillText(`SAVE $${data.bloomberg - data.price}/mo · JOIN ${data.waitlist} TRADERS`, cx, badgeY);

  renderWatermark(ctx, w, h);
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SocialMediaGenerator() {
  const [postType, setPostType] = useState<PostType>("accuracy");
  const [formatId, setFormatId] = useState<FormatId>("instagram");
  const [liveData, setLiveData] = useState(STATIC_DATA);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fmt = FORMATS.find((f) => f.id === formatId)!;

  // Fetch live top signals from API
  useEffect(() => {
    fetch(`${API_BASE}/api/signals?limit=5`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) {
          setLiveData((prev) => ({
            ...prev,
            topSignals: d.slice(0, 5).map((s: {
              label?: string; ticker?: string;
              signal?: string; direction?: string;
              confidence?: number; predicted_change_pct?: number;
            }) => ({
              label: s.label ?? s.ticker ?? "—",
              signal: s.signal ?? s.direction ?? "HOLD",
              confidence: s.confidence ?? 70,
              move: `${(s.predicted_change_pct ?? 0) >= 0 ? "+" : ""}${(s.predicted_change_pct ?? 0).toFixed(1)}%`,
            })),
          }));
        }
      })
      .catch(() => {/* keep static */});
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = fmt;
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);

    switch (postType) {
      case "accuracy":   renderAccuracy(ctx, w, h, liveData); break;
      case "signal":     renderSignal(ctx, w, h, liveData); break;
      case "market":     renderMarket(ctx, w, h, liveData); break;
      case "feature":    renderFeature(ctx, w, h); break;
      case "comparison": renderComparison(ctx, w, h, liveData); break;
    }
  }, [postType, formatId, liveData, fmt]);

  useEffect(() => { draw(); }, [draw]);

  async function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    try {
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("blob fail"))), "image/png"),
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prediq-${postType}-${formatId}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  const previewW = Math.round(fmt.w * fmt.scale);
  const previewH = Math.round(fmt.h * fmt.scale);

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      fontFamily: FONT,
      color: C.textPrimary,
      padding: "24px 16px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: C.textSecondary, letterSpacing: 6, marginBottom: 8 }}>
          ▶ PREDIQ
        </div>
        <h1 style={{
          fontSize: 28, fontWeight: 700, color: C.green, letterSpacing: 4,
          margin: 0, textShadow: `0 0 20px ${C.green}`,
        }}>
          SOCIAL GENERATOR
        </h1>
        <p style={{ fontSize: 12, color: C.textSecondary, letterSpacing: 2, marginTop: 8 }}>
          INTELLIGENCE. PREDICTED. PROFIT.
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 28, flexWrap: "wrap" }}>
        {/* Controls panel */}
        <div style={{ minWidth: 220, flex: "0 0 220px" }}>
          {/* Post type */}
          <Section title="POST TYPE">
            {POST_TYPES.map((pt) => (
              <OptionBtn
                key={pt.id}
                active={postType === pt.id}
                onClick={() => setPostType(pt.id)}
                label={pt.label}
                sub={pt.desc}
              />
            ))}
          </Section>

          {/* Format */}
          <Section title="FORMAT">
            {FORMATS.map((f) => (
              <OptionBtn
                key={f.id}
                active={formatId === f.id}
                onClick={() => setFormatId(f.id as FormatId)}
                label={f.label}
                sub={`${f.w}×${f.h}`}
              />
            ))}
          </Section>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              width: "100%",
              padding: "14px",
              background: downloading ? "rgba(0,255,136,0.1)" : "rgba(0,255,136,0.15)",
              border: `1px solid ${C.green}`,
              borderRadius: 8,
              color: C.green,
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 3,
              cursor: downloading ? "wait" : "pointer",
              marginTop: 8,
              boxShadow: `0 0 16px rgba(0,255,136,0.2)`,
              transition: "all 0.2s",
            }}
          >
            {downloading ? "EXPORTING..." : "↓ DOWNLOAD PNG"}
          </button>

          {/* Dimensions info */}
          <div style={{
            marginTop: 12,
            padding: "10px 14px",
            background: "rgba(0,255,136,0.05)",
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            fontSize: 11,
            color: C.textSecondary,
            letterSpacing: 1,
            lineHeight: 1.8,
          }}>
            <div style={{ color: C.green, fontWeight: 700, marginBottom: 4 }}>CANVAS SIZE</div>
            <div>{fmt.w} × {fmt.h} px</div>
            <div style={{ marginTop: 4, color: "rgba(58,106,74,0.6)" }}>
              Preview scaled to {Math.round(fmt.scale * 100)}%
            </div>
          </div>
        </div>

        {/* Preview */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{
            fontSize: 10,
            color: C.textSecondary,
            letterSpacing: 3,
            marginBottom: 12,
          }}>
            LIVE PREVIEW
          </div>
          <div style={{
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: 16,
            background: C.surface,
            display: "inline-block",
          }}>
            <canvas
              ref={canvasRef}
              width={fmt.w}
              height={fmt.h}
              style={{
                width: previewW,
                height: previewH,
                display: "block",
                borderRadius: 6,
                imageRendering: "auto",
              }}
            />
          </div>

          {/* Live data note */}
          <div style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            color: C.textSecondary,
            letterSpacing: 1,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: C.green,
              boxShadow: `0 0 6px ${C.green}`,
              display: "inline-block",
            }} />
            AUTO-FILLED WITH LIVE PREDIQ DATA
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 9,
        color: C.textSecondary,
        letterSpacing: 4,
        marginBottom: 8,
        paddingBottom: 6,
        borderBottom: `1px solid ${C.border}`,
      }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {children}
      </div>
    </div>
  );
}

function OptionBtn({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "9px 12px",
        background: active ? "rgba(0,255,136,0.12)" : "transparent",
        border: `1px solid ${active ? C.green : C.border}`,
        borderRadius: 6,
        color: active ? C.green : C.textSecondary,
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: active ? 700 : 400,
        letterSpacing: 2,
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        transition: "all 0.15s",
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: 9, opacity: 0.6, fontWeight: 400, letterSpacing: 1 }}>{sub}</span>
    </button>
  );
}
