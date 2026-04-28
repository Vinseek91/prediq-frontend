"use client";
import { useEffect, useRef, useState } from "react";

const MARKET_NODES = [
  { id: "OIL", label: "Brent Crude", x: 0.5, y: 0.12, color: "#ffaa00", r: 24, type: "Energy" },
  { id: "GOLD", label: "Gold", x: 0.15, y: 0.28, color: "#ffd700", r: 20, type: "Metal" },
  { id: "SILVER", label: "Silver", x: 0.08, y: 0.52, color: "#aaddff", r: 15, type: "Metal" },
  { id: "PLATINUM", label: "Platinum", x: 0.18, y: 0.72, color: "#ccccff", r: 14, type: "Metal" },
  { id: "COPPER", label: "Copper", x: 0.3, y: 0.85, color: "#cc7744", r: 14, type: "Metal" },
  { id: "USD", label: "USD Index", x: 0.84, y: 0.22, color: "#00aaff", r: 20, type: "Currency" },
  { id: "INR", label: "USD/INR", x: 0.92, y: 0.45, color: "#aa66ff", r: 15, type: "Currency" },
  { id: "CLP", label: "CLP/USD", x: 0.88, y: 0.68, color: "#aa66ff", r: 14, type: "Currency" },
  { id: "PETROL", label: "Petrol Price", x: 0.38, y: 0.35, color: "#ff8844", r: 17, type: "Consumer" },
  { id: "AIRLINE", label: "Airlines", x: 0.22, y: 0.55, color: "#ff4466", r: 15, type: "Stock" },
  { id: "HAL", label: "HAL Defence", x: 0.62, y: 0.42, color: "#00ff88", r: 17, type: "Defence" },
  { id: "LMT", label: "Lockheed", x: 0.74, y: 0.32, color: "#00ff88", r: 14, type: "Defence" },
  { id: "BAE", label: "BAE Systems", x: 0.82, y: 0.45, color: "#00ff88", r: 13, type: "Defence" },
  { id: "ONGC", label: "ONGC", x: 0.52, y: 0.52, color: "#00dd88", r: 14, type: "Stock" },
  { id: "RELIANCE", label: "Reliance", x: 0.4, y: 0.62, color: "#00dd88", r: 16, type: "Stock" },
  { id: "NIFTY", label: "NIFTY 50", x: 0.6, y: 0.72, color: "#5588ff", r: 18, type: "Index" },
  { id: "IPSA", label: "IPSA Chile", x: 0.48, y: 0.85, color: "#5588ff", r: 15, type: "Index" },
  { id: "SQM", label: "SQM Lithium", x: 0.72, y: 0.82, color: "#88ff44", r: 14, type: "Stock" },
  { id: "NATGAS", label: "Natural Gas", x: 0.66, y: 0.18, color: "#ffcc00", r: 14, type: "Energy" },
];

const MARKET_EDGES = [
  { from: "OIL", to: "PETROL", label: "IMPACTS", neg: false, strength: 0.9 },
  { from: "OIL", to: "ONGC", label: "BENEFITS", neg: false, strength: 0.8 },
  { from: "OIL", to: "RELIANCE", label: "BENEFITS", neg: false, strength: 0.7 },
  { from: "OIL", to: "AIRLINE", label: "HURTS", neg: true, strength: 0.85 },
  { from: "OIL", to: "HAL", label: "GEO RISK", neg: false, strength: 0.6 },
  { from: "OIL", to: "LMT", label: "GEO RISK", neg: false, strength: 0.55 },
  { from: "OIL", to: "NATGAS", label: "CORRELATES", neg: false, strength: 0.5 },
  { from: "USD", to: "INR", label: "DRIVES", neg: false, strength: 0.9 },
  { from: "USD", to: "GOLD", label: "INVERSE", neg: true, strength: 0.85 },
  { from: "USD", to: "OIL", label: "INVERSE", neg: true, strength: 0.7 },
  { from: "USD", to: "CLP", label: "DRIVES", neg: false, strength: 0.75 },
  { from: "GOLD", to: "SILVER", label: "LEADS", neg: false, strength: 0.88 },
  { from: "GOLD", to: "PLATINUM", label: "CORRELATES", neg: false, strength: 0.65 },
  { from: "GOLD", to: "COPPER", label: "MACRO LINK", neg: false, strength: 0.45 },
  { from: "PETROL", to: "AIRLINE", label: "COST HURT", neg: true, strength: 0.9 },
  { from: "PETROL", to: "RELIANCE", label: "MARGIN+", neg: false, strength: 0.5 },
  { from: "PETROL", to: "NIFTY", label: "MACRO DRAG", neg: true, strength: 0.4 },
  { from: "ONGC", to: "NIFTY", label: "WEIGHT", neg: false, strength: 0.6 },
  { from: "HAL", to: "NIFTY", label: "WEIGHT", neg: false, strength: 0.55 },
  { from: "RELIANCE", to: "NIFTY", label: "WEIGHT", neg: false, strength: 0.7 },
  { from: "CLP", to: "IPSA", label: "CORRELATES", neg: false, strength: 0.75 },
  { from: "COPPER", to: "IPSA", label: "DRIVES", neg: false, strength: 0.82 },
  { from: "SQM", to: "IPSA", label: "WEIGHT", neg: false, strength: 0.6 },
  { from: "COPPER", to: "SQM", label: "INPUT COST", neg: false, strength: 0.55 },
  { from: "BAE", to: "LMT", label: "SECTOR", neg: false, strength: 0.5 },
  { from: "HAL", to: "BAE", label: "SECTOR", neg: false, strength: 0.5 },
  { from: "NATGAS", to: "PETROL", label: "ENERGY MIX", neg: false, strength: 0.45 },
];

const TYPE_COLORS: Record<string, string> = {
  Energy: "#ffaa00", Metal: "#aaddff", Currency: "#aa66ff",
  Consumer: "#ff8844", Stock: "#00dd88", Defence: "#00ff88",
  Index: "#5588ff",
};

interface Node {
  id: string; label: string; x: number; y: number;
  color: string; r: number; type: string;
}

interface Edge {
  from: string; to: string; label: string; neg: boolean; strength: number;
}

export default function NetworkPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [mode, setMode] = useState<"agents" | "market" | "pulse">("market");
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [agentStats, setAgentStats] = useState({ buy: 60, hold: 25, sell: 15, signal: "STRONG BUY" });
  const [time, setTime] = useState("");
  const agentsRef = useRef<any[]>([]);
  const herdRef = useRef({ active: false, timer: 0 });
  const modeRef = useRef(mode);
  const selectedRef = useRef<Node | null>(null);
  const hoveredRef = useRef<Node | null>(null);

  modeRef.current = mode;
  selectedRef.current = selectedNode;
  hoveredRef.current = hoveredNode;

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = Math.min(500, Math.max(320, canvas.offsetWidth * 0.52));
    };
    resize();
    window.addEventListener("resize", resize);

    const N = 140;
    if (agentsRef.current.length === 0) {
      agentsRef.current = Array.from({ length: N }, (_, i) => {
        const isWhale = i < 10;
        return {
          id: i,
          x: 80 + Math.random() * (canvas.width - 160),
          y: 60 + Math.random() * (canvas.height - 120),
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          decision: Math.random() < 0.6 ? "buy" : Math.random() < 0.7 ? "hold" : "sell",
          influence: isWhale ? 0.9 : 0.2 + Math.random() * 0.5,
          mood: 0.4 + Math.random() * 0.3,
          isWhale,
          r: isWhale ? 11 : 4 + Math.random() * 4,
          connections: [] as number[],
          pulse: Math.random() * Math.PI * 2,
        };
      });
      agentsRef.current.forEach(a => {
        const others = agentsRef.current
          .filter(b => b.id !== a.id)
          .map(b => ({ id: b.id, d: Math.hypot(a.x - b.x, a.y - b.y) }))
          .sort((x, y) => x.d - y.d).slice(0, 3 + Math.floor(Math.random() * 2));
        a.connections = others.map(o => o.id);
      });
    }

    const pulseRings = Array.from({ length: 14 }, () => ({
      x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.7,
      r: Math.random() * 40, maxR: 60 + Math.random() * 90,
      speed: 0.5 + Math.random() * 0.7,
      color: Math.random() < 0.6 ? "#00ff88" : Math.random() < 0.6 ? "#ff4466" : "#ffaa00",
    }));

    const drawAgents = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const agents = agentsRef.current;

      agents.forEach(a => {
        a.connections.forEach((bid: number) => {
          const b = agents[bid];
          const same = a.decision === b.decision;
          const col = a.decision === "buy" ? "#00ff88" : a.decision === "sell" ? "#ff4466" : "#ffaa00";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = same ? col + "18" : "#ffffff06";
          ctx.lineWidth = same ? a.influence * 1.5 : 0.4;
          ctx.stroke();
        });
      });

      let buy = 0, hold = 0, sell = 0;
      agents.forEach(a => {
        a.vx += (Math.random() - 0.5) * 0.05;
        a.vy += (Math.random() - 0.5) * 0.05;
        a.vx += (W / 2 - a.x) * 0.0002;
        a.vy += (H / 2 - a.y) * 0.0002;
        const spd = Math.hypot(a.vx, a.vy);
        if (spd > 0.8) { a.vx = a.vx / spd * 0.8; a.vy = a.vy / spd * 0.8; }
        a.x += a.vx; a.y += a.vy;
        a.x = Math.max(a.r, Math.min(W - a.r, a.x));
        a.y = Math.max(a.r, Math.min(H - a.r, a.y));

        if (herdRef.current.active) {
          const nbrs = a.connections.map((id: number) => agents[id]);
          if (nbrs.filter((n: any) => n.decision === "buy").length >= 2 && Math.random() < 0.04) a.decision = "buy";
          herdRef.current.timer--;
          if (herdRef.current.timer <= 0) herdRef.current.active = false;
        }

        const nbrs = a.connections.map((id: number) => agents[id]);
        const avgMood = nbrs.reduce((s: number, n: any) => s + n.mood, 0) / (nbrs.length || 1);
        a.mood += (avgMood - a.mood) * a.influence * 0.01;
        a.mood = Math.max(0, Math.min(1, a.mood));
        if (a.mood > 0.68 && Math.random() < 0.005) a.decision = "buy";
        if (a.mood < 0.32 && Math.random() < 0.005) a.decision = "sell";

        const col = a.decision === "buy" ? "#00ff88" : a.decision === "sell" ? "#ff4466" : "#ffaa00";
        a.pulse += 0.05;

        if (a.isWhale) {
          ctx.beginPath(); ctx.arc(a.x, a.y, a.r * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = col + "15"; ctx.fill();
        }

        ctx.beginPath(); ctx.arc(a.x, a.y, a.r + Math.sin(a.pulse) * 2 + 3, 0, Math.PI * 2);
        ctx.strokeStyle = col + "25"; ctx.lineWidth = 1; ctx.stroke();

        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = col + (a.isWhale ? "ee" : "88");
        ctx.shadowBlur = a.isWhale ? 16 : 7;
        ctx.shadowColor = col; ctx.fill(); ctx.shadowBlur = 0;

        if (a.decision === "buy") buy++;
        else if (a.decision === "sell") sell++;
        else hold++;
      });

      const total = agents.length;
      const bp = Math.round(buy / total * 100);
      const hp = Math.round(hold / total * 100);
      const sp = Math.round(sell / total * 100);
      let sig = bp >= 60 ? "STRONG BUY" : bp >= 45 ? "BUY" : sp >= 60 ? "STRONG SELL" : sp >= 45 ? "SELL" : "HOLD";
      setAgentStats({ buy: bp, hold: hp, sell: sp, signal: sig });
    };

    const drawMarket = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const sel = selectedRef.current;
      const hov = hoveredRef.current;

      MARKET_EDGES.forEach(e => {
        const from = MARKET_NODES.find(n => n.id === e.from);
        const to = MARKET_NODES.find(n => n.id === e.to);
        if (!from || !to) return;
        const fx = from.x * W, fy = from.y * H;
        const tx = to.x * W, ty = to.y * H;
        const mx = (fx + tx) / 2 + (fy - ty) * 0.18;
        const my = (fy + ty) / 2 + (tx - fx) * 0.18;
        const isLit = sel && (sel.id === e.from || sel.id === e.to);
        const isHov = hov && (hov.id === e.from || hov.id === e.to);
        const col = e.neg ? "#ff4466" : "#00ff88";
        ctx.beginPath(); ctx.moveTo(fx, fy);
        ctx.quadraticCurveTo(mx, my, tx, ty);
        ctx.strokeStyle = isLit ? col + "cc" : isHov ? col + "55" : col + "22";
        ctx.lineWidth = isLit ? e.strength * 3 : isHov ? e.strength * 1.5 : e.strength * 0.8;
        ctx.stroke();

        if (isLit) {
          const angle = Math.atan2(ty - my, tx - mx);
          const ax = tx - Math.cos(angle) * (to.r + 5);
          const ay = ty - Math.sin(angle) * (to.r + 5);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax - Math.cos(angle - 0.4) * 9, ay - Math.sin(angle - 0.4) * 9);
          ctx.lineTo(ax - Math.cos(angle + 0.4) * 9, ay - Math.sin(angle + 0.4) * 9);
          ctx.closePath();
          ctx.fillStyle = col + "bb"; ctx.fill();
          const lx = (fx + tx) / 2;
          const ly = (fy + ty) / 2 - 8;
          ctx.fillStyle = "#e0e8f0dd";
          ctx.font = "bold 9px monospace";
          ctx.textAlign = "center";
          ctx.fillText(e.label, lx, ly);
          ctx.textAlign = "start";
        }
      });

      MARKET_NODES.forEach(n => {
        const nx = n.x * W, ny = n.y * H;
        const isSel = sel?.id === n.id;
        const isHov = hov?.id === n.id;

        ctx.beginPath(); ctx.arc(nx, ny, n.r * 2.8, 0, Math.PI * 2);
        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, n.r * 2.8);
        g.addColorStop(0, n.color + (isSel ? "50" : "25"));
        g.addColorStop(1, n.color + "00");
        ctx.fillStyle = g; ctx.fill();

        ctx.beginPath(); ctx.arc(nx, ny, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.color + (isSel ? "ff" : isHov ? "cc" : "77");
        ctx.shadowBlur = isSel ? 22 : isHov ? 14 : 8;
        ctx.shadowColor = n.color; ctx.fill(); ctx.shadowBlur = 0;

        ctx.beginPath(); ctx.arc(nx, ny, n.r, 0, Math.PI * 2);
        ctx.strokeStyle = n.color + (isSel ? "ff" : "55");
        ctx.lineWidth = isSel ? 2.5 : 1; ctx.stroke();

        ctx.fillStyle = isSel ? "#ffffff" : "#e0e8f0bb";
        ctx.font = (isSel ? "bold " : "") + "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(n.label, nx, ny + n.r + 15);
        if (isSel) {
          ctx.fillStyle = n.color + "99";
          ctx.font = "9px monospace";
          ctx.fillText(n.type, nx, ny + n.r + 27);
        }
        ctx.textAlign = "start";
      });

      if (!sel) {
        ctx.fillStyle = "#3a608066";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Click any node to explore market relationships", W / 2, H - 12);
        ctx.textAlign = "start";
      }
    };

    const drawPulse = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      pulseRings.forEach(ring => {
        ring.r += ring.speed;
        const alpha = Math.max(0, (1 - ring.r / ring.maxR) * 0.7);
        if (ring.r > ring.maxR) {
          ring.r = 0;
          ring.x = 0.12 + Math.random() * 0.76;
          ring.y = 0.12 + Math.random() * 0.76;
          ring.color = Math.random() < 0.6 ? "#00ff88" : Math.random() < 0.6 ? "#ff4466" : "#ffaa00";
        }
        ctx.beginPath(); ctx.arc(ring.x * W, ring.y * H, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(ring.x * W, ring.y * H, 3, 0, Math.PI * 2);
        ctx.fillStyle = ring.color;
        ctx.globalAlpha = Math.min(1, alpha * 2.5); ctx.fill();
      });
      ctx.globalAlpha = 1;

      const t = Date.now() / 1000;
      const p = Math.sin(t * 2) * 0.3 + 0.7;
      const cx = W / 2, cy = H / 2;
      [80, 55, 35].forEach((r, i) => {
        ctx.beginPath(); ctx.arc(cx, cy, r * p, 0, Math.PI * 2);
        ctx.strokeStyle = "#00ff88";
        ctx.globalAlpha = p * (0.5 - i * 0.15);
        ctx.lineWidth = 1.5 - i * 0.4; ctx.stroke();
      });
      ctx.globalAlpha = 1;

      ctx.font = "bold 13px monospace";
      ctx.fillStyle = "#00ff88";
      ctx.textAlign = "center";
      ctx.fillText("SENTIMENT CORE", cx, cy - 4);
      ctx.font = "9px monospace";
      ctx.fillStyle = "#3a6080";
      ctx.fillText("agent pulse propagation", cx, cy + 14);

      ctx.font = "bold 22px monospace";
      ctx.fillStyle = agentStats.buy >= 60 ? "#00ff88" : agentStats.sell >= 60 ? "#ff4466" : "#ffaa00";
      ctx.fillText(agentStats.buy + "% BUYING", cx, 36);
      ctx.textAlign = "start";
    };

    const tick = () => {
      const m = modeRef.current;
      if (m === "agents") drawAgents();
      else if (m === "market") drawMarket();
      else drawPulse();
      animRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== "market") return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = canvas.width, H = canvas.height;
    const clicked = MARKET_NODES.find(n => Math.hypot(mx - n.x * W, my - n.y * H) < n.r + 10);
    setSelectedNode(prev => prev?.id === clicked?.id ? null : clicked || null);
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== "market") return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = canvas.width, H = canvas.height;
    const hov = MARKET_NODES.find(n => Math.hypot(mx - n.x * W, my - n.y * H) < n.r + 10) || null;
    setHoveredNode(hov);
    canvas.style.cursor = hov ? "pointer" : "default";
  };

  const triggerHerd = () => {
    herdRef.current = { active: true, timer: 400 };
    agentsRef.current.forEach(a => {
      if (Math.random() < 0.65) { a.decision = "buy"; a.mood = Math.min(1, a.mood + 0.35); }
    });
  };

  const resetSim = () => {
    herdRef.current = { active: false, timer: 0 };
    agentsRef.current.forEach(a => {
      a.decision = Math.random() < 0.4 ? "buy" : Math.random() < 0.6 ? "hold" : "sell";
      a.mood = 0.4 + Math.random() * 0.2;
    });
  };

  const sigColor = agentStats.signal.includes("BUY") ? "#00ff88" : agentStats.signal.includes("SELL") ? "#ff4466" : "#ffaa00";

  const connectedEdges = selectedNode
    ? MARKET_EDGES.filter(e => e.from === selectedNode.id || e.to === selectedNode.id)
    : [];

  return (
    <div style={{ background: "#030810", minHeight: "100vh", fontFamily: "'SF Mono','Fira Code',monospace", color: "#e0e8f0", paddingBottom: 40 }}>

      {/* TOPBAR */}
      <div style={{ background: "#050d1a", borderBottom: "1px solid #0d2035", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, color: "#00ff88", textDecoration: "none" }}>PREDIQ</a>
          <div style={{ fontSize: 11, color: "#3a6080", letterSpacing: 1 }}>AGENT NETWORK</div>
          <div style={{ width: 1, height: 20, background: "#0d2035" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 8px #00ff88" }} />
            <span style={{ fontSize: 11, color: "#00ff88", letterSpacing: 1 }}>LIVE</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ fontSize: 10, color: "#3a6080", letterSpacing: 1, textDecoration: "none", border: "1px solid #0d2035", padding: "4px 12px", borderRadius: 4 }}>
            BACK TO SIGNALS
          </a>
          <span style={{ fontSize: 11, color: "#1a3a5c" }}>{time}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 20px" }}>

        {/* MODE CONTROLS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          {(["market", "agents", "pulse"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: "7px 16px", borderRadius: 4, fontSize: 10, fontWeight: 700,
              cursor: "pointer", letterSpacing: 1, fontFamily: "inherit",
              background: mode === m ? "#002a18" : "#050d1a",
              border: mode === m ? "1px solid #00ff88" : "1px solid #0d2035",
              color: mode === m ? "#00ff88" : "#3a6080",
            }}>
              {m === "market" ? "MARKET GRAPH" : m === "agents" ? "AGENT NETWORK" : "SENTIMENT PULSE"}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {mode === "agents" && (
            <>
              <button onClick={triggerHerd} style={{ padding: "7px 16px", borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: 1, fontFamily: "inherit", background: "#1a0020", border: "1px solid #aa44ff", color: "#aa44ff" }}>
                TRIGGER HERD EVENT
              </button>
              <button onClick={resetSim} style={{ padding: "7px 16px", borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: 1, fontFamily: "inherit", background: "#050d1a", border: "1px solid #0d2035", color: "#3a6080" }}>
                RESET
              </button>
            </>
          )}
        </div>

        {/* CANVAS */}
        <div style={{ background: "#030810", border: "1px solid #0d2035", borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
          <canvas
            ref={canvasRef}
            style={{ width: "100%", display: "block" }}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMove}
          />
        </div>

        {/* LEGEND */}
        <div style={{ background: "#050d1a", border: "1px solid #0d2035", borderRadius: 8, padding: "10px 16px", marginBottom: 12, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          {mode === "agents" ? (
            <>
              {[["#00ff88", "Buying"], ["#ff4466", "Selling"], ["#ffaa00", "Holding"], ["#00aaff", "Whale (high capital)"]].map(([col, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#3a6080" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: col, boxShadow: "0 0 5px " + col }} />
                  {label}
                </div>
              ))}
              <div style={{ fontSize: 10, color: "#1a3a5c" }}>── influence edge &nbsp; ━━ strong edge</div>
            </>
          ) : mode === "market" ? (
            <>
              {Object.entries(TYPE_COLORS).map(([type, col]) => (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#3a6080" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: col }} />
                  {type}
                </div>
              ))}
              <div style={{ fontSize: 10, color: "#00ff8866" }}>━━ benefits &nbsp;</div>
              <div style={{ fontSize: 10, color: "#ff446666" }}>━━ hurts</div>
            </>
          ) : (
            <div style={{ fontSize: 10, color: "#3a6080" }}>Each ring = one agent sentiment pulse radiating through the network. Green = buying, Red = selling, Amber = holding.</div>
          )}
        </div>

        {/* STATS / INFO PANELS */}
        <div style={{ display: "grid", gridTemplateColumns: mode === "market" && selectedNode ? "1fr 1fr" : "1fr", gap: 12 }}>

          {/* Agent stats or market node info */}
          {mode === "agents" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[
                ["BUYING", agentStats.buy + "%", "#00ff88"],
                ["HOLDING", agentStats.hold + "%", "#ffaa00"],
                ["SELLING", agentStats.sell + "%", "#ff4466"],
                ["SIGNAL", agentStats.signal, sigColor],
              ].map(([label, val, col]) => (
                <div key={label} style={{ background: "#050d1a", border: "1px solid #0d2035", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#3a6080", letterSpacing: 2, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: col }}>{val}</div>
                </div>
              ))}
            </div>
          )}

          {mode === "market" && !selectedNode && (
            <div style={{ background: "#050d1a", border: "1px solid #0d2035", borderRadius: 8, padding: "16px 20px" }}>
              <div style={{ fontSize: 10, color: "#3a6080", letterSpacing: 2, marginBottom: 12 }}>MARKET RELATIONSHIP GRAPH</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                {[
                  ["Nodes", MARKET_NODES.length.toString(), "#e0e8f0"],
                  ["Connections", MARKET_EDGES.length.toString(), "#e0e8f0"],
                  ["Asset classes", "7", "#e0e8f0"],
                  ["Positive links", MARKET_EDGES.filter(e => !e.neg).length.toString(), "#00ff88"],
                  ["Negative links", MARKET_EDGES.filter(e => e.neg).length.toString(), "#ff4466"],
                  ["Markets covered", "Global", "#ffaa00"],
                ].map(([label, val, col]) => (
                  <div key={label} style={{ background: "#030810", border: "1px solid #0d2035", borderRadius: 6, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9, color: "#3a6080", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: col }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === "market" && selectedNode && (
            <>
              <div style={{ background: "#050d1a", border: "1px solid " + selectedNode.color + "44", borderRadius: 8, padding: "16px 20px" }}>
                <div style={{ fontSize: 9, color: "#3a6080", letterSpacing: 2, marginBottom: 8 }}>SELECTED NODE</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: selectedNode.color, boxShadow: "0 0 10px " + selectedNode.color }} />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: selectedNode.color }}>{selectedNode.label}</div>
                    <div style={{ fontSize: 10, color: "#3a6080" }}>{selectedNode.type}</div>
                  </div>
                </div>
                <div style={{ fontSize: 9, color: "#3a6080", letterSpacing: 2, marginBottom: 8 }}>CONNECTIONS ({connectedEdges.length})</div>
                {connectedEdges.map(e => {
                  const other = MARKET_NODES.find(n => n.id === (e.from === selectedNode.id ? e.to : e.from));
                  return other ? (
                    <div key={e.from + e.to} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #0d2035", cursor: "pointer" }}
                      onClick={() => setSelectedNode(other)}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: other.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: 11, color: "#e0e8f0" }}>{other.label}</div>
                      <div style={{ fontSize: 9, color: e.neg ? "#ff4466" : "#00ff88", letterSpacing: 1 }}>{e.label}</div>
                      <div style={{ fontSize: 9, color: "#1a3a5c" }}>{Math.round(e.strength * 100)}%</div>
                    </div>
                  ) : null;
                })}
              </div>

              <div style={{ background: "#050d1a", border: "1px solid #0d2035", borderRadius: 8, padding: "16px 20px" }}>
                <div style={{ fontSize: 9, color: "#3a6080", letterSpacing: 2, marginBottom: 12 }}>IMPACT ANALYSIS</div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: "#00ff88", letterSpacing: 1, marginBottom: 6 }}>BENEFITS FROM</div>
                  {connectedEdges.filter(e => !e.neg && e.to === selectedNode.id).map(e => {
                    const from = MARKET_NODES.find(n => n.id === e.from);
                    return from ? (
                      <div key={e.from} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: from.color }} />
                        <span style={{ fontSize: 11, color: "#e0e8f0" }}>{from.label}</span>
                        <div style={{ flex: 1, height: 2, background: "#0d2035", borderRadius: 1, overflow: "hidden" }}>
                          <div style={{ width: Math.round(e.strength * 100) + "%", height: "100%", background: "#00ff88" }} />
                        </div>
                        <span style={{ fontSize: 9, color: "#00ff88" }}>{Math.round(e.strength * 100)}%</span>
                      </div>
                    ) : null;
                  })}
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#ff4466", letterSpacing: 1, marginBottom: 6 }}>HURT BY</div>
                  {connectedEdges.filter(e => e.neg && e.to === selectedNode.id).map(e => {
                    const from = MARKET_NODES.find(n => n.id === e.from);
                    return from ? (
                      <div key={e.from} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: from.color }} />
                        <span style={{ fontSize: 11, color: "#e0e8f0" }}>{from.label}</span>
                        <div style={{ flex: 1, height: 2, background: "#0d2035", borderRadius: 1, overflow: "hidden" }}>
                          <div style={{ width: Math.round(e.strength * 100) + "%", height: "100%", background: "#ff4466" }} />
                        </div>
                        <span style={{ fontSize: 9, color: "#ff4466" }}>{Math.round(e.strength * 100)}%</span>
                      </div>
                    ) : null;
                  })}
                  {connectedEdges.filter(e => e.neg && e.to === selectedNode.id).length === 0 && (
                    <div style={{ fontSize: 10, color: "#1a3a5c" }}>No direct negative dependencies</div>
                  )}
                </div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #0d2035" }}>
                  <a href="/" style={{ display: "block", textAlign: "center", padding: "8px", borderRadius: 4, background: "transparent", border: "1px solid " + selectedNode.color, color: selectedNode.color, fontSize: 10, fontWeight: 700, letterSpacing: 2, textDecoration: "none", fontFamily: "inherit" }}>
                    GET SWARM SIGNAL FOR {selectedNode.label}
                  </a>
                </div>
              </div>
            </>
          )}

          {mode === "pulse" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[
                ["BUYING PULSE", agentStats.buy + "%", "#00ff88"],
                ["HOLDING PULSE", agentStats.hold + "%", "#ffaa00"],
                ["SELLING PULSE", agentStats.sell + "%", "#ff4466"],
                ["NET SIGNAL", agentStats.signal, sigColor],
              ].map(([label, val, col]) => (
                <div key={label} style={{ background: "#050d1a", border: "1px solid #0d2035", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#3a6080", letterSpacing: 2, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: col }}>{val}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ marginTop: 12, background: "#050d1a", border: "1px solid #0d2035", borderRadius: 8, padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 10, color: "#3a6080" }}>PREDIQ Time Machine · Agent Network Visualiser · {MARKET_NODES.length} market nodes · {MARKET_EDGES.length} relationships mapped</div>
          <a href="/" style={{ fontSize: 10, color: "#00ff88", textDecoration: "none", letterSpacing: 1 }}>BACK TO SIGNALS →</a>
        </div>
      </div>
    </div>
  );
}
