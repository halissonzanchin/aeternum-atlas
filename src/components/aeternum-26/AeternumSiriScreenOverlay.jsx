import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./AeternumSiriScreenOverlay.css";

/**
 * Aeternum 26.1 Apple Intelligence Screen Glow
 * Official AppleIntelligenceForSwiftUI (Alessio Rubicini) Soft-Diffusion Architecture.
 * Subtle, ethereal, feather-soft pastel perimeter glow with zero hard lines.
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
      opacityRef.current += (targetOpacity - opacityRef.current) * 0.12;

      const currentOpacity = opacityRef.current;

      if (currentOpacity > 0.003) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        const t = (Date.now() - startTimeRef.current) * 0.001;
        const phase = t * (state === "thinking" ? 0.95 : state === "speaking" ? 0.75 : 0.55);

        // Sweeping angle oscillation from AppleIntelligenceForSwiftUI
        const angleDeg = Math.sin(phase * 1.2) * 120 + 180;
        const angleRad = (angleDeg * Math.PI) / 180;

        // Subtle Pastel Apple Intelligence Color Spectrum
        const baseHues = [275, 320, 345, 38, 235, 192, 290];
        const colors = baseHues.map((baseHue, i) => {
          const shift = Math.sin(phase * 0.8 + (i / 7.0) * Math.PI * 2) * 14;
          const hue = (baseHue + shift + 360) % 360;
          const sat = 78 + 12 * Math.sin(phase * 0.6 + i);
          const light = 68 + 6 * Math.sin(phase * 0.5 + i * 0.7);
          return `hsla(${hue}, ${sat}%, ${light}%, 0.95)`;
        });

        // Create Conic Gradient with dynamic angle
        let gradient;
        if (ctx.createConicGradient) {
          gradient = ctx.createConicGradient(angleRad, cx, cy);
          colors.forEach((c, idx) => {
            gradient.addColorStop(idx / (colors.length - 1), c);
          });
          gradient.addColorStop(1, colors[0]);
        } else {
          gradient = ctx.createLinearGradient(0, 0, w, h);
          colors.forEach((c, idx) => {
            gradient.addColorStop(idx / (colors.length - 1), c);
          });
        }

        const margin = 2 * dpr;
        const cornerRadius = Math.max(20 * dpr, Math.min(w, h) * 0.038);
        const rw = w - margin * 2;
        const rh = h - margin * 2;

        ctx.strokeStyle = gradient;

        // Layer 3: Ambient Deep Bloom (Very soft wide diffusion)
        ctx.save();
        ctx.filter = `blur(${38 * dpr}px)`;
        ctx.lineWidth = 50 * dpr;
        ctx.globalAlpha = (0.22 + 0.06 * Math.sin(phase * 0.7)) * currentOpacity;
        drawRoundedRect(ctx, margin, margin, rw, rh, cornerRadius);
        ctx.stroke();
        ctx.restore();

        // Layer 2: Secondary Caustic Diffusion
        ctx.save();
        ctx.filter = `blur(${16 * dpr}px)`;
        ctx.lineWidth = 24 * dpr;
        ctx.globalAlpha = (0.36 + 0.08 * Math.sin(phase * 0.9)) * currentOpacity;
        drawRoundedRect(ctx, margin, margin, rw, rh, cornerRadius);
        ctx.stroke();
        ctx.restore();

        // Layer 1: Primary Soft Inner Glow (Gentle feathered border)
        ctx.save();
        ctx.filter = `blur(${7 * dpr}px)`;
        ctx.lineWidth = 12 * dpr;
        ctx.globalAlpha = (0.52 + 0.1 * Math.sin(phase * 1.1)) * currentOpacity;
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
