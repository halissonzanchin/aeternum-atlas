import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./AeternumSiriScreenOverlay.css";

/**
 * Aeternum 26.1 Apple Intelligence Screen Glow
 * Direct high-performance implementation of AppleIntelligenceForSwiftUI (Alessio Rubicini)
 * Mathematical conic gradient angle oscillation and dynamic harmonic color spectrum.
 */
export default function AeternumSiriScreenOverlay({
  active = false,
  state = "idle"
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const opacityRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };

    resize();
    window.addEventListener("resize", resize);

    const drawRoundedRect = (context, x, y, width, height, radius) => {
      context.beginPath();
      context.moveTo(x + radius, y);
      context.lineTo(x + width - radius, y);
      context.quadraticCurveTo(x + width, y, x + width, y + radius);
      context.lineTo(x + width, y + height - radius);
      context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      context.lineTo(x + radius, y + height);
      context.quadraticCurveTo(x, y + height, x, y + height - radius);
      context.lineTo(x, y + radius);
      context.quadraticCurveTo(x, y, x + radius, y);
      context.closePath();
    };

    const render = () => {
      if (!isRunning) return;

      const targetOpacity = active ? 1.0 : 0.0;
      opacityRef.current += (targetOpacity - opacityRef.current) * 0.14;

      const currentOpacity = opacityRef.current;

      if (currentOpacity > 0.005) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        const t = (Date.now() - startTimeRef.current) * 0.001;
        const phase = t * (state === "thinking" ? 1.4 : state === "speaking" ? 1.1 : 0.85);

        // Sweeping angle oscillation from AppleIntelligenceForSwiftUI
        const angleDeg = Math.sin(phase * 1.2) * 120 + 180;
        const angleRad = (angleDeg * Math.PI) / 180;

        // Dynamic 7-color harmonic spectrum from AppleIntelligenceForSwiftUI
        const colors = [0, 1, 2, 3, 4, 5, 6].map((i) => {
          const base = i / 6.0;
          const hue = ((base + Math.sin(phase * 0.9 + base * Math.PI * 2) * 0.08) % 1 + 1) % 1;
          const sat = (0.82 + 0.15 * Math.sin(phase * 0.7 + base * Math.PI)) * 100;
          return `hsl(${hue * 360}, ${sat}%, 62%)`;
        });

        // Create Conic Gradient with dynamic angle
        let gradient;
        if (ctx.createConicGradient) {
          gradient = ctx.createConicGradient(angleRad, cx, cy);
          colors.forEach((c, idx) => {
            gradient.addColorStop(idx / 6, c);
          });
          gradient.addColorStop(1, colors[0]);
        } else {
          gradient = ctx.createLinearGradient(0, 0, w, h);
          colors.forEach((c, idx) => {
            gradient.addColorStop(idx / 6, c);
          });
        }

        const margin = 6 * dpr;
        const cornerRadius = Math.max(16 * dpr, Math.min(w, h) * 0.035);
        const rw = w - margin * 2;
        const rh = h - margin * 2;

        ctx.strokeStyle = gradient;

        // Layer 3: Tertiary Wide Diffusion Glow
        ctx.save();
        ctx.filter = `blur(${28 * dpr}px)`;
        ctx.lineWidth = 42 * dpr;
        ctx.globalAlpha = (0.28 + 0.08 * Math.sin(phase * 0.7)) * currentOpacity;
        drawRoundedRect(ctx, margin, margin, rw, rh, cornerRadius);
        ctx.stroke();
        ctx.restore();

        // Layer 2: Secondary Caustic Glow
        ctx.save();
        ctx.filter = `blur(${10 * dpr}px)`;
        ctx.lineWidth = 18 * dpr;
        ctx.globalAlpha = (0.55 + 0.12 * Math.sin(phase * 0.9)) * currentOpacity;
        drawRoundedRect(ctx, margin, margin, rw, rh, cornerRadius);
        ctx.stroke();
        ctx.restore();

        // Layer 1: Primary Colored Border
        ctx.save();
        ctx.filter = `blur(${4 * dpr}px)`;
        ctx.lineWidth = 8 * dpr;
        ctx.globalAlpha = (0.85 + 0.15 * Math.sin(phase * 1.1)) * currentOpacity;
        drawRoundedRect(ctx, margin, margin, rw, rh, cornerRadius);
        ctx.stroke();
        ctx.restore();

        // Layer 0: Sharp Crisp Laser Edge
        ctx.save();
        ctx.filter = "none";
        ctx.lineWidth = 2.5 * dpr;
        ctx.globalAlpha = 0.95 * currentOpacity;
        drawRoundedRect(ctx, margin, margin, rw, rh, cornerRadius);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      window.removeEventListener("resize", resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [active, state]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`a26-siri-screen-overlay ${active ? "is-active" : ""}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="a26-siri-canvas" />
    </div>,
    document.body
  );
}
