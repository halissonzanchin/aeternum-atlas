import React, { useEffect, useId, useRef, useState } from "react";
import "./AtlasAIOrb.css";

const STATE_INTENSITY = {
  idle: 0.7,
  focus: 0.85,
  active: 0.85,
  listening: 0.95,
  thinking: 1.0,
  speaking: 0.95,
  success: 0.85,
  offline: 0.4,
  error: 0.75
};

/**
 * Aeternum 26.1 — Liquid Glass Crystal Orb with iOS 9 Siri Light Ribbons
 * True transparent liquid glass refraction (Aeternum 26 standard)
 * housing elongated, smooth, harmonic iOS 9 Siri flowing light ribbons.
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

    // 4 Elongated Harmonic iOS 9 Wave Ribbons (Cyan/Blue, Magenta, Mint, Orchid)
    const waves = [
      {
        color: "0, 150, 255",   // Electric Azure Blue
        speed: 1.1,
        frequency: 2.2,
        phase: 0.0,
        amp: 0.85,
        verse: 1
      },
      {
        color: "255, 50, 130",  // Ruby Magenta Pink
        speed: 1.35,
        frequency: 2.6,
        phase: 1.4,
        amp: 0.75,
        verse: -1
      },
      {
        color: "40, 230, 175",  // Turquoise Mint
        speed: 0.95,
        frequency: 1.9,
        phase: 2.8,
        amp: 0.8,
        verse: 1
      },
      {
        color: "180, 85, 255",  // Royal Orchid Violet
        speed: 1.2,
        frequency: 2.4,
        phase: 4.1,
        amp: 0.65,
        verse: -1
      }
    ];

    // Cauchy Global Attenuation Envelope: (K / (K + x^2))^2.5
    const ATT_K = 3.2;
    const attenuation = (x) => {
      const d = ATT_K + x * x;
      return Math.pow(ATT_K / d, 2.5);
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

      let speedMult = 1.0;
      let ampMult = 1.0;

      if (currentState === "listening") {
        speedMult = 1.5;
        ampMult = 1.2;
      } else if (currentState === "thinking") {
        speedMult = 2.2;
        ampMult = 1.05;
      } else if (currentState === "speaking") {
        speedMult = 1.7;
        ampMult = 1.3;
      }

      time += 0.022 * speedMult;

      ctx.save();

      // Circular clipping for the liquid glass sphere
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      // 1. Transparent Liquid Glass Substrate (Aeternum 26 - Translucent Refractive Core)
      const liquidGlassGrad = ctx.createRadialGradient(
        cx - radius * 0.25,
        cy - radius * 0.3,
        radius * 0.05,
        cx,
        cy,
        radius
      );
      liquidGlassGrad.addColorStop(0, "rgba(255, 255, 255, 0.08)");
      liquidGlassGrad.addColorStop(0.65, "rgba(40, 180, 200, 0.03)");
      liquidGlassGrad.addColorStop(0.92, "rgba(100, 200, 230, 0.08)");
      liquidGlassGrad.addColorStop(1, "rgba(200, 240, 255, 0.16)");

      ctx.fillStyle = liquidGlassGrad;
      ctx.fill();

      // 2. Harmonic iOS 9 Siri Light Ribbons (Flowing Horizontally across the Sphere)
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      const GRAPH_STEPS = 64;
      const waveSpan = radius * 1.88;
      const maxAmplitude = radius * 0.36 * ampMult * currentIntensity;

      waves.forEach((wave) => {
        const currentPhase = time * wave.speed + wave.phase;

        // Draw symmetrical flowing ribbon (top and bottom lobes)
        for (const sign of [1, -1]) {
          ctx.beginPath();

          for (let i = -GRAPH_STEPS; i <= GRAPH_STEPS; i++) {
            const normX = (i / GRAPH_STEPS) * 3.0; // range -3 to +3
            const x = cx + (i / GRAPH_STEPS) * (waveSpan / 2);

            const s1 = Math.sin(wave.verse * normX * wave.frequency - currentPhase);
            const s2 = 0.3 * Math.sin(normX * 4.2 + time * 1.5);
            const att = attenuation(normX * 1.3);

            const yOffset = (s1 + s2) * att * maxAmplitude * wave.amp;
            const y = cy - sign * yOffset;

            if (i === -GRAPH_STEPS) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.closePath();

          // Smooth horizontal fade for natural light feathering
          const ribbonGrad = ctx.createLinearGradient(
            cx - waveSpan / 2,
            cy,
            cx + waveSpan / 2,
            cy
          );
          ribbonGrad.addColorStop(0, `rgba(${wave.color}, 0)`);
          ribbonGrad.addColorStop(0.2, `rgba(${wave.color}, 0.35)`);
          ribbonGrad.addColorStop(0.5, `rgba(${wave.color}, 0.65)`);
          ribbonGrad.addColorStop(0.8, `rgba(${wave.color}, 0.35)`);
          ribbonGrad.addColorStop(1, `rgba(${wave.color}, 0)`);

          ctx.fillStyle = ribbonGrad;
          ctx.fill();
        }
      });

      // 3. Central Fine White Laser Beam
      const coreLaserGrad = ctx.createLinearGradient(
        cx - waveSpan / 2,
        cy,
        cx + waveSpan / 2,
        cy
      );
      coreLaserGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
      coreLaserGrad.addColorStop(0.25, "rgba(255, 255, 255, 0.45)");
      coreLaserGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.85)");
      coreLaserGrad.addColorStop(0.75, "rgba(255, 255, 255, 0.45)");
      coreLaserGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.beginPath();
      for (let i = -GRAPH_STEPS; i <= GRAPH_STEPS; i++) {
        const normX = (i / GRAPH_STEPS) * 3.0;
        const x = cx + (i / GRAPH_STEPS) * (waveSpan / 2);
        const wave = 0.08 * maxAmplitude * Math.sin(normX * 3.4 - time * 2.2) * attenuation(normX * 1.5);
        const y = cy + wave;

        if (i === -GRAPH_STEPS) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = coreLaserGrad;
      ctx.lineWidth = Math.max(1.0, radius * 0.035);
      ctx.stroke();

      ctx.restore(); // Restore from screen compositeOperation

      // 4. Specular Crescent Glass Reflection (Liquid Glass Optic Crescent)
      const specularGrad = ctx.createRadialGradient(
        cx - radius * 0.3,
        cy - radius * 0.32,
        0,
        cx - radius * 0.3,
        cy - radius * 0.32,
        radius * 0.75
      );
      specularGrad.addColorStop(0, "rgba(255, 255, 255, 0.65)");
      specularGrad.addColorStop(0.2, "rgba(255, 255, 255, 0.2)");
      specularGrad.addColorStop(0.52, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = specularGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // 5. Delicate Crystal Edge Stroke
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = Math.max(0.8, radius * 0.025);
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
        "is-liquid-glass",
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
