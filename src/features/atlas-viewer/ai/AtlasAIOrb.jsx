import React, { useEffect, useId, useRef, useState } from "react";
import "./AtlasAIOrb.css";

const STATE_INTENSITY = {
  idle: 0.75,
  focus: 0.9,
  active: 0.9,
  listening: 1.0,
  thinking: 1.0,
  speaking: 1.0,
  success: 0.9,
  offline: 0.5,
  error: 0.8
};

/**
 * Aeternum 26.1 — Crystal Minimal Orb with iOS 9 Siri Light Waves
 * Combines the crystal glass aesthetics of Minimal Orb (metasidd/Orb)
 * with the mathematical harmonic ribbon waveforms of iOS 9 (kopiro/siriwave).
 */
export default function AtlasAIOrb({
  onClick,
  state = "idle",
  size = "md",
  intensity,
  className = ""
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const reactId = useId();

  const normalizedState = Object.prototype.hasOwnProperty.call(STATE_INTENSITY, state)
    ? state
    : "idle";

  const targetIntensity = clampVal(
    Number.isFinite(intensity) ? intensity : STATE_INTENSITY[normalizedState],
    0,
    1
  );

  const stateRef = useRef({
    state: normalizedState,
    intensity: targetIntensity
  });

  useEffect(() => {
    stateRef.current = {
      state: normalizedState,
      intensity: targetIntensity
    };
  }, [normalizedState, targetIntensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;
    let time = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round((bounds.width || 56) * dpr));
      const h = Math.max(1, Math.round((bounds.height || 56) * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    resize();
    window.addEventListener("resize", resize);

    // iOS 9 Ribbon Definitions: Blue, Red/Magenta, Green/Mint, and White Support Line
    const ribbons = [
      {
        // Cyan / Blue Ribbon
        color: "0, 130, 255",
        speed: 1.0,
        width: 1.8,
        offset: 0.0,
        phase: 0.0,
        verse: 1
      },
      {
        // Rose / Magenta Ribbon
        color: "255, 45, 110",
        speed: 1.25,
        width: 2.2,
        offset: 1.4,
        phase: 1.2,
        verse: -1
      },
      {
        // Mint / Turquoise Ribbon
        color: "46, 230, 168",
        speed: 0.85,
        width: 1.6,
        offset: -1.2,
        phase: 2.4,
        verse: 1
      }
    ];

    // Cauchy Global Attenuation Function: (K / (K + x^2))^K
    const ATT_K = 4.0;
    const globalAtt = (x) => {
      const denom = ATT_K + x * x;
      return Math.pow(ATT_K / denom, ATT_K);
    };

    const render = () => {
      if (!isRunning) return;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.47;

      ctx.clearRect(0, 0, w, h);

      const currentState = stateRef.current.state;
      const currentIntensity = stateRef.current.intensity;

      // Speed modulation according to state
      let speedMult = 1.0;
      let ampMult = 1.0;

      if (currentState === "listening") {
        speedMult = 1.6;
        ampMult = 1.25;
      } else if (currentState === "thinking") {
        speedMult = 2.4;
        ampMult = 1.1;
      } else if (currentState === "speaking") {
        speedMult = 1.8;
        ampMult = 1.35;
      }

      time += 0.024 * speedMult;

      ctx.save();

      // Circular clipping for the crystal sphere
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      // 1. Crystal Translucent Volumetric Base (Minimal Crystal Style)
      const baseGrad = ctx.createRadialGradient(
        cx - radius * 0.25,
        cy - radius * 0.3,
        radius * 0.05,
        cx,
        cy,
        radius
      );
      baseGrad.addColorStop(0, "rgba(255, 255, 255, 0.18)");
      baseGrad.addColorStop(0.55, "rgba(220, 240, 255, 0.06)");
      baseGrad.addColorStop(0.88, "rgba(180, 215, 245, 0.12)");
      baseGrad.addColorStop(1, "rgba(160, 200, 235, 0.22)");

      ctx.fillStyle = baseGrad;
      ctx.fill();

      // 2. iOS 9 Harmonic Light Ribbons (siriwave)
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      const GRAPH_POINTS = 48;
      const waveWidth = radius * 1.85;
      const maxWaveHeight = radius * 0.42 * ampMult * currentIntensity;

      // Draw each colored wave ribbon
      ribbons.forEach((ribbon, rIdx) => {
        const ribbonPhase = time * ribbon.speed + ribbon.phase;

        // Draw upper and lower wave lobes
        for (const sign of [1, -1]) {
          ctx.beginPath();

          for (let i = -GRAPH_POINTS; i <= GRAPH_POINTS; i++) {
            const normalizedX = (i / GRAPH_POINTS) * 2.8; // range approx -2.8 to 2.8
            const screenX = cx + (i / GRAPH_POINTS) * (waveWidth / 2);

            const harmonicX = (normalizedX / ribbon.width) - ribbon.offset;
            const sineWave = Math.sin(ribbon.verse * harmonicX * 2.4 - ribbonPhase);
            const secondaryHarmonic = 0.25 * Math.sin(harmonicX * 4.8 + time * 1.4);
            const envelope = globalAtt(normalizedX * 1.4);

            const waveY = (sineWave + secondaryHarmonic) * envelope * maxWaveHeight * 0.95;
            const screenY = cy - sign * waveY;

            if (i === -GRAPH_POINTS) {
              ctx.moveTo(screenX, screenY);
            } else {
              ctx.lineTo(screenX, screenY);
            }
          }

          ctx.closePath();

          // Smooth gradient fill for each feather
          const featherGrad = ctx.createLinearGradient(cx - waveWidth / 2, cy, cx + waveWidth / 2, cy);
          featherGrad.addColorStop(0, `rgba(${ribbon.color}, 0)`);
          featherGrad.addColorStop(0.2, `rgba(${ribbon.color}, 0.55)`);
          featherGrad.addColorStop(0.5, `rgba(${ribbon.color}, 0.85)`);
          featherGrad.addColorStop(0.8, `rgba(${ribbon.color}, 0.55)`);
          featherGrad.addColorStop(1, `rgba(${ribbon.color}, 0)`);

          ctx.fillStyle = featherGrad;
          ctx.fill();
        }
      });

      // 3. Central White Laser Support Beam
      const beamGrad = ctx.createLinearGradient(cx - waveWidth / 2, cy, cx + waveWidth / 2, cy);
      beamGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
      beamGrad.addColorStop(0.25, "rgba(255, 255, 255, 0.75)");
      beamGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
      beamGrad.addColorStop(0.75, "rgba(255, 255, 255, 0.75)");
      beamGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.beginPath();
      for (let i = -GRAPH_POINTS; i <= GRAPH_POINTS; i++) {
        const normalizedX = (i / GRAPH_POINTS) * 2.8;
        const screenX = cx + (i / GRAPH_POINTS) * (waveWidth / 2);
        const centerWave = 0.12 * maxWaveHeight * Math.sin(normalizedX * 3.2 - time * 2.0) * globalAtt(normalizedX * 1.6);
        const screenY = cy + centerWave;

        if (i === -GRAPH_POINTS) {
          ctx.moveTo(screenX, screenY);
        } else {
          ctx.lineTo(screenX, screenY);
        }
      }
      ctx.strokeStyle = beamGrad;
      ctx.lineWidth = Math.max(1.2, radius * 0.04);
      ctx.stroke();

      ctx.restore(); // Restore from compositeOperation

      // 4. Glossy Specular Crescent Glass Reflection (Minimal Orb)
      const glossGrad = ctx.createRadialGradient(
        cx - radius * 0.32,
        cy - radius * 0.35,
        0,
        cx - radius * 0.32,
        cy - radius * 0.35,
        radius * 0.8
      );
      glossGrad.addColorStop(0, "rgba(255, 255, 255, 0.92)");
      glossGrad.addColorStop(0.22, "rgba(255, 255, 255, 0.38)");
      glossGrad.addColorStop(0.55, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = glossGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // 5. Crystal Rim Glow (Fresnel Caustic Stroke)
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = Math.max(1, radius * 0.035);
      ctx.stroke();

      ctx.restore(); // Restore clipping

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      window.removeEventListener("resize", resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [size]);

  return (
    <span
      className={[
        "aeternum-ai-orb-root",
        "is-crystal-minimal",
        `state-${normalizedState}`,
        `size-${size}`,
        className
      ].filter(Boolean).join(" ")}
      onClick={onClick}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="atlas-ai-orb__canvas" />
      <span className="atlas-ai-orb__lens" />
      <span className="atlas-ai-orb__rim" />
    </span>
  );
}

function clampVal(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}
