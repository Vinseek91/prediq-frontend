/**
 * PREDIQ Swarm Animation — 1080×1920 (TikTok / Instagram Reels)
 * Screen-record: open /swarm-animation → F11 full-screen → OBS @ 60fps
 */

import { useEffect, useRef } from "react";
import Head from "next/head";

const CW = 1080;
const CH = 1920;
const N  = 240;

// Text formation y-centre
const TEXT_Y = CH * 0.44;

export default function SwarmAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    // ── Phase sequence ────────────────────────────────────────
    type Phase =
      | "school"
      | "scat0" | "form0" | "hold0"   // → "PREDIQ"
      | "scat1" | "form1" | "hold1"   // → "83.3%"
      | "scat2" | "form2" | "hold2";  // → "BEATS GPT-5"

    const DURATIONS: Record<Phase, number> = {
      school: 2800,
      scat0:   600, form0: 2000, hold0: 2800,
      scat1:   600, form1: 2000, hold1: 2800,
      scat2:   600, form2: 2000, hold2: 2800,
    };
    const NEXT: Record<Phase, Phase> = {
      school: "scat0",
      scat0: "form0", form0: "hold0", hold0: "scat1",
      scat1: "form1", form1: "hold1", hold1: "scat2",
      scat2: "form2", form2: "hold2", hold2: "school",
    };

    // ── Sample text pixels ────────────────────────────────────
    function sampleText(
      lines: { text: string; y: number; size: number }[],
      count: number,
    ): { x: number; y: number }[] {
      const off = document.createElement("canvas");
      off.width = CW; off.height = CH;
      const c = off.getContext("2d")!;
      c.clearRect(0, 0, CW, CH);
      c.fillStyle = "#fff";
      c.textAlign = "center";
      c.textBaseline = "middle";
      for (const { text, y, size } of lines) {
        c.font = `900 ${size}px "Courier New", monospace`;
        c.fillText(text, CW / 2, y);
      }
      const { data } = c.getImageData(0, 0, CW, CH);
      const pts: { x: number; y: number }[] = [];
      for (let y = 0; y < CH; y += 5) {
        for (let x = 0; x < CW; x += 5) {
          if (data[(y * CW + x) * 4 + 3] > 120) pts.push({ x, y });
        }
      }
      for (let i = pts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pts[i], pts[j]] = [pts[j], pts[i]];
      }
      while (pts.length < count) {
        pts.push({ x: CW / 2 + (Math.random() - 0.5) * 500, y: TEXT_Y + (Math.random() - 0.5) * 200 });
      }
      return pts.slice(0, count);
    }

    const tgt0 = sampleText([{ text: "PREDIQ",   y: TEXT_Y, size: 290 }], N);
    const tgt1 = sampleText([{ text: "83.3%",    y: TEXT_Y, size: 300 }], N);
    const tgt2 = sampleText([
      { text: "BEATS",  y: TEXT_Y - 115, size: 215 },
      { text: "GPT-5",  y: TEXT_Y + 115, size: 215 },
    ], N);

    // Store targets as flat Float32Arrays for perf
    function toF32(arr: {x:number;y:number}[]) {
      const tx = new Float32Array(N), ty = new Float32Array(N);
      for (let i = 0; i < N; i++) { tx[i] = arr[i].x; ty[i] = arr[i].y; }
      return [tx, ty] as const;
    }
    const [ptx0, pty0] = toF32(tgt0);
    const [ptx1, pty1] = toF32(tgt1);
    const [ptx2, pty2] = toF32(tgt2);

    const TX: Record<string, Float32Array> = { form0: ptx0, form1: ptx1, form2: ptx2, hold0: ptx0, hold1: ptx1, hold2: ptx2 };
    const TY: Record<string, Float32Array> = { form0: pty0, form1: pty1, form2: pty2, hold0: pty0, hold1: pty1, hold2: pty2 };

    // ── Particle buffers ──────────────────────────────────────
    const px  = new Float32Array(N);
    const py  = new Float32Array(N);
    const pvx = new Float32Array(N);
    const pvy = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      px[i]  = Math.random() * CW;
      py[i]  = Math.random() * CH;
      pvx[i] = (Math.random() - 0.5) * 4;
      pvy[i] = (Math.random() - 0.5) * 4;
    }

    // ── Boids (school) ────────────────────────────────────────
    const SEP_R2 = 55 * 55, ALI_R2 = 120 * 120, COH_R2 = 155 * 155;
    function stepSchool() {
      for (let i = 0; i < N; i++) {
        let sx = 0, sy = 0, sc = 0;
        let ax = 0, ay = 0, ac = 0;
        let cx = 0, cy = 0, cc = 0;
        for (let j = 0; j < N; j++) {
          if (i === j) continue;
          const dx = px[i]-px[j], dy = py[i]-py[j], d2 = dx*dx+dy*dy;
          if (d2 < SEP_R2 && d2 > 0) { const d = Math.sqrt(d2); sx += dx/d; sy += dy/d; sc++; }
          if (d2 < ALI_R2) { ax += pvx[j]; ay += pvy[j]; ac++; }
          if (d2 < COH_R2) { cx += px[j];  cy += py[j];  cc++; }
        }
        if (sc > 0) { pvx[i] += sx/sc*1.7;  pvy[i] += sy/sc*1.7; }
        if (ac > 0) { pvx[i] += (ax/ac-pvx[i])*0.05; pvy[i] += (ay/ac-pvy[i])*0.05; }
        if (cc > 0) { pvx[i] += (cx/cc-px[i])*0.002; pvy[i] += (cy/cc-py[i])*0.002; }
        pvx[i] += (Math.random()-0.5)*0.4; pvy[i] += (Math.random()-0.5)*0.4;
        const spd = Math.sqrt(pvx[i]*pvx[i]+pvy[i]*pvy[i]);
        if (spd > 3.6) { pvx[i] = pvx[i]/spd*3.6; pvy[i] = pvy[i]/spd*3.6; }
        if (spd < 0.7) { pvx[i] += (Math.random()-0.5)*1.4; pvy[i] += (Math.random()-0.5)*1.4; }
        px[i] += pvx[i]; py[i] += pvy[i];
        if (px[i] < -20) px[i] = CW+20; if (px[i] > CW+20) px[i] = -20;
        if (py[i] < -20) py[i] = CH+20; if (py[i] > CH+20) py[i] = -20;
      }
    }

    // ── Forming (pull toward targets) ─────────────────────────
    function stepForming(tx: Float32Array, ty: Float32Array, t: number) {
      // Faster pull: starts strong, finishes tight
      const pull   = 0.06 + t * 0.22;
      const maxSpd = 26 - t * 18;
      for (let i = 0; i < N; i++) {
        pvx[i] += (tx[i]-px[i])*pull + (Math.random()-0.5)*0.8;
        pvy[i] += (ty[i]-py[i])*pull + (Math.random()-0.5)*0.8;
        const spd = Math.sqrt(pvx[i]*pvx[i]+pvy[i]*pvy[i]);
        if (spd > maxSpd) { pvx[i] = pvx[i]/spd*maxSpd; pvy[i] = pvy[i]/spd*maxSpd; }
        px[i] += pvx[i]; py[i] += pvy[i];
      }
    }

    // ── Hold (tight spring) ───────────────────────────────────
    function stepHold(tx: Float32Array, ty: Float32Array) {
      for (let i = 0; i < N; i++) {
        pvx[i] += (tx[i]-px[i])*0.22 + (Math.random()-0.5)*0.45;
        pvy[i] += (ty[i]-py[i])*0.22 + (Math.random()-0.5)*0.45;
        pvx[i] *= 0.68; pvy[i] *= 0.68;
        px[i] += pvx[i]; py[i] += pvy[i];
      }
    }

    // ── Scatter ───────────────────────────────────────────────
    function stepScatter() {
      for (let i = 0; i < N; i++) {
        const a = Math.random()*Math.PI*2;
        pvx[i] += Math.cos(a)*9; pvy[i] += Math.sin(a)*9;
        pvx[i] *= 0.85; pvy[i] *= 0.85;
        px[i] += pvx[i]; py[i] += pvy[i];
        if (px[i] < -20) px[i] = CW+20; if (px[i] > CW+20) px[i] = -20;
        if (py[i] < -20) py[i] = CH+20; if (py[i] > CH+20) py[i] = -20;
      }
    }

    // ── Draw particles (bright, double-pass glow) ─────────────
    function drawParticles(trailAlpha: number) {
      ctx.fillStyle = `rgba(2,4,8,${trailAlpha})`;
      ctx.fillRect(0, 0, CW, CH);

      ctx.save();

      // Pass 1: soft outer glow ring
      ctx.shadowBlur = 0;
      for (let i = 0; i < N; i++) {
        const spd = Math.sqrt(pvx[i]*pvx[i]+pvy[i]*pvy[i]);
        const a   = 0.18 + Math.min(0.22, spd * 0.04);
        ctx.globalAlpha = a;
        ctx.fillStyle = "#00ff88";
        ctx.beginPath();
        ctx.arc(px[i], py[i], 7 + (i%3)*1.5, 0, Math.PI*2);
        ctx.fill();
      }

      // Pass 2: bright core with glow
      ctx.shadowBlur = 18;
      ctx.shadowColor = "#00ff88";
      for (let i = 0; i < N; i++) {
        const spd = Math.sqrt(pvx[i]*pvx[i]+pvy[i]*pvy[i]);
        ctx.globalAlpha = 0.82 + Math.min(0.18, spd * 0.05);
        ctx.fillStyle = i%7===0 ? "#66ffbb"
                       : i%4===0 ? "#00ffaa"
                       : "#00ff88";
        const r = 4 + (i%3)*0.8;   // 4 – 5.6 px core
        ctx.beginPath();
        ctx.arc(px[i], py[i], r, 0, Math.PI*2);
        ctx.fill();
      }

      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // ── Sound wave bars at bottom ─────────────────────────────
    let waveT = 0;
    function drawSoundWave() {
      const baseY  = CH * 0.957;
      const maxH   = CH * 0.045;
      const barW   = 12;
      const gap    = 7;
      const count  = Math.floor(CW / (barW + gap));
      const startX = (CW - count * (barW + gap)) / 2;

      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#00ff88";

      for (let i = 0; i < count; i++) {
        const x = startX + i * (barW + gap);
        // Layered sine waves → organic waveform
        const norm = (
          Math.sin(i * 0.28 + waveT * 2.2) * 0.40 +
          Math.sin(i * 0.65 + waveT * 3.7) * 0.30 +
          Math.sin(i * 0.12 + waveT * 1.4) * 0.30
        ) * 0.5 + 0.52;   // 0..1
        const h   = Math.max(5, norm * maxH);
        ctx.globalAlpha = 0.25 + norm * 0.65;
        ctx.fillStyle = "#00ff88";
        // Mirror: bar grows upward and downward from baseline
        ctx.fillRect(x, baseY - h * 0.6, barW, h * 0.6);
        ctx.globalAlpha = (0.25 + norm * 0.65) * 0.4;
        ctx.fillRect(x, baseY, barW, h * 0.35);
      }

      ctx.restore();
      ctx.globalAlpha = 1;
      waveT += 0.038;
    }

    // ── Subtitle copy per hold phase ──────────────────────────
    const HOLD_SUBTITLES: Partial<Record<Phase, string>> = {
      hold0: "AI MARKET SIGNAL PLATFORM",
      hold1: "VERIFIED  ·  DUPLICATE-FREE",
      hold2: "+ 1 4 . 6 %  O V E R  G P T - 5",
    };

    // ── HUD ───────────────────────────────────────────────────
    function drawHUD(phase: Phase, t: number) {
      ctx.save();
      ctx.textAlign = "center";

      // Top PREDIQ wordmark
      ctx.shadowBlur = 28;
      ctx.shadowColor = "#00ff88";
      ctx.fillStyle = "#00ff88";
      ctx.font = `900 96px "Courier New", monospace`;
      ctx.fillText("PREDIQ", CW / 2, CH * 0.11);
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#1e4a3a";
      ctx.font = `400 30px "Courier New", monospace`;
      ctx.fillText("AI-POWERED MARKET SIGNAL PLATFORM", CW / 2, CH * 0.11 + 72);

      // Divider
      ctx.strokeStyle = "#0d2035";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(CW * 0.14, CH * 0.11 + 96);
      ctx.lineTo(CW * 0.86, CH * 0.11 + 96);
      ctx.stroke();

      // Subtitle fades in during hold
      const sub = HOLD_SUBTITLES[phase];
      if (sub) {
        const a = Math.min(1, t * 3.5);
        ctx.globalAlpha = a;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00ff8866";
        ctx.fillStyle = "#00cc77";
        ctx.font = `700 38px "Courier New", monospace`;
        ctx.fillText(sub, CW / 2, TEXT_Y + 230);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      // Stats block
      const SY = CH * 0.695;
      const stats: [string, string, string][] = [
        ["ACCURACY", "83.3%",  "#00ff88"],
        ["SIGNALS",  "423+",   "#c0d8f0"],
        ["VS GPT-5", "+14.6%", "#00ff88"],
      ];
      stats.forEach(([label, value, color], i) => {
        const x = CW * (0.20 + i * 0.30);
        ctx.fillStyle = "#1a3a5c";
        ctx.font = `400 26px "Courier New", monospace`;
        ctx.fillText(label, x, SY);
        ctx.shadowBlur = color === "#00ff88" ? 12 : 0;
        ctx.shadowColor = "#00ff88";
        ctx.fillStyle = color;
        ctx.font = `700 54px "Courier New", monospace`;
        ctx.fillText(value, x, SY + 64);
        ctx.shadowBlur = 0;
      });

      // Dividers between stats
      ctx.strokeStyle = "#0d2035";
      ctx.lineWidth = 1.5;
      for (const xd of [CW * 0.365, CW * 0.665]) {
        ctx.beginPath(); ctx.moveTo(xd, SY-16); ctx.lineTo(xd, SY+80); ctx.stroke();
      }

      // Verified badge
      const bW = 570, bH = 50, bX = (CW-bW)/2;
      ctx.fillStyle = "#071a10";
      ctx.strokeStyle = "#00ff8833";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bX, SY+94, bW, bH, 25);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#00aa55";
      ctx.font = `400 25px "Courier New", monospace`;
      ctx.fillText("✓ Verified  ·  Real trades  ·  Duplicate-free", CW/2, SY+125);

      // URL
      ctx.shadowBlur = 16;
      ctx.shadowColor = "#00ff8866";
      ctx.fillStyle = "#00dd77";
      ctx.font = `700 44px "Courier New", monospace`;
      ctx.fillText("prediq.netlify.app", CW/2, CH * 0.864);
      ctx.shadowBlur = 0;

      // Hashtags
      ctx.fillStyle = "#2a5a40";
      ctx.font = `400 28px "Courier New", monospace`;
      ctx.fillText("#PREDIQ  #AITrading  #StockMarket  #TrinovionAI", CW/2, CH * 0.900);

      // Corner brackets
      const bSize = 28, bOff = 36;
      ctx.strokeStyle = "#0d2035";
      ctx.lineWidth = 2;
      for (const [cx2, cy2, sx2, sy2] of [
        [bOff, bOff, 1, 1], [CW-bOff, bOff, -1, 1],
        [bOff, CH-bOff, 1, -1], [CW-bOff, CH-bOff, -1, -1],
      ] as [number,number,number,number][]) {
        ctx.beginPath();
        ctx.moveTo(cx2, cy2 + sy2 * bSize);
        ctx.lineTo(cx2, cy2);
        ctx.lineTo(cx2 + sx2 * bSize, cy2);
        ctx.stroke();
      }

      ctx.restore();
    }

    // ── Animation loop ────────────────────────────────────────
    let phase: Phase = "school";
    let phaseStart   = performance.now();
    let raf: number;

    function tick(now: number) {
      const elapsed = now - phaseStart;
      const dur     = DURATIONS[phase];
      const t       = Math.min(1, elapsed / dur);

      const isHold  = phase === "hold0" || phase === "hold1" || phase === "hold2";
      const trailAlpha = isHold ? 0.42 : 0.14;

      const txArr = TX[phase];
      const tyArr = TY[phase];

      if      (phase === "school")                           stepSchool();
      else if (phase.startsWith("form") && txArr && tyArr)  stepForming(txArr, tyArr, t);
      else if (phase.startsWith("hold") && txArr && tyArr)  stepHold(txArr, tyArr);
      else if (phase.startsWith("scat"))                    stepScatter();

      drawParticles(trailAlpha);
      drawSoundWave();
      drawHUD(phase, t);

      if (elapsed >= dur) {
        phase      = NEXT[phase];
        phaseStart = now;
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <Head>
        <title>PREDIQ — Swarm Animation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <style>{`
          *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            background: #020408;
            width: 100%; height: 100%;
            overflow: hidden;
            touch-action: none;
          }
          #wrap {
            width: 100vw; height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #020408;
          }
          canvas {
            display: block;
            /* Fill viewport on mobile, letterbox on desktop */
            width: 100vw;
            height: 100vh;
            object-fit: contain;
          }
          @media (max-width: 600px) {
            canvas {
              /* On portrait phone, stretch to fill the screen */
              width: 100vw;
              height: 100svh;
              object-fit: cover;
            }
          }
        `}</style>
      </Head>
      <div id="wrap">
        <canvas ref={canvasRef} width={CW} height={CH} />
      </div>
    </>
  );
}
