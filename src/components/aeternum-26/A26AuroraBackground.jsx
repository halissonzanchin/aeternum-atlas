/* ==========================================================================
   A26AuroraBackground.jsx — GPU Atmospheric Aurora Veil Component
   ==========================================================================
   Adapted from Radiant Shaders (Paul Bakaus) — Aurora Veil
   Original Source: https://radiant-shaders.com/shader/aurora-veil
   License: MIT License (https://opensource.org/licenses/MIT)

   Copyright (c) 2024 Paul Bakaus
   Adapted for Aeternum Atlas 26 Liquid Glass Architecture (Wave 4I-A).
   ========================================================================== */

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../context/ThemeContext";
import "./A26AuroraBackground.css";

const VERT_SRC = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform float u_auroraSpeed;
uniform float u_auroraIntensity;
uniform float u_isLight;

#define PI 3.14159265359
#define NUM_BG_STARS 35

// ── Hash & Noise ──
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hash1(float n) {
  return fract(sin(n) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// ── Aurora ribbon with organic waving and vertical shimmer ──
float auroraRibbon(vec2 uv, float t, float ribbonX, float ribbonWidth, float waveFreq, float waveAmp, float phase) {
  float centerX = ribbonX + sin(t * 0.15 + phase) * 0.28;

  float wave1 = sin(uv.y * waveFreq + t * 0.85 + phase) * waveAmp;
  float wave2 = sin(uv.y * waveFreq * 2.2 + t * 1.25 + phase * 1.6) * waveAmp * 0.5;
  float wave3 = sin(uv.y * waveFreq * 0.4 + t * 0.32 + phase * 0.5) * waveAmp * 1.1;
  float waveOffset = wave1 + wave2 + wave3;

  float dx = uv.x - (centerX + waveOffset);
  float ribbon = exp(-dx * dx / (ribbonWidth * ribbonWidth));

  float brightBand = 0.6 + 0.4 * sin(uv.y * 2.4 + t * 0.65 + phase * 1.8);
  brightBand *= 0.6 + 0.4 * sin(uv.y * 4.8 - t * 0.8 + phase);

  float shimmer = 0.80 + 0.20 * sin(t * 2.2 + phase * 2.5 + uv.y * 7.0);

  // Smooth vertical fade
  float verticalFade = smoothstep(-0.65, -0.10, uv.y) * (1.0 - smoothstep(0.30, 0.85, uv.y));

  float detail = 0.75 + 0.25 * noise(vec2(uv.x * 5.0, uv.y * 8.0 + t * 0.45 + phase));

  return ribbon * brightBand * verticalFade * detail * shimmer;
}

// ── Background faint stars (restrained, 35 stars max) ──
float bgStars(vec2 uv, float t) {
  float stars = 0.0;
  for (int i = 0; i < NUM_BG_STARS; i++) {
    float fi = float(i);
    vec2 pos = vec2(
      hash1(fi * 17.31 + 100.0) * 2.8 - 1.4,
      hash1(fi * 11.97 + 200.0) * 1.4 - 0.2
    );
    float d = length(uv - pos);
    float twinkleSpeed = 0.4 + hash1(fi * 3.3 + 300.0) * 1.5;
    float twinkle = 0.30 + 0.70 * sin(t * twinkleSpeed + fi * 2.7);
    twinkle = max(twinkle, 0.0);
    float size = 0.001;
    float brightness = 0.30 + hash1(fi * 7.7 + 500.0) * 0.50;
    stars += smoothstep(size, 0.0, d) * twinkle * brightness;
  }
  return stars;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_res * 0.5) / max(min(u_res.x, u_res.y), 1.0);
  float t = u_time * u_auroraSpeed;

  // ── Ribbon Geometry (Evaluated once for optimal GPU performance) ──
  float r1 = auroraRibbon(uv, t, 0.0, 0.28, 2.3, 0.26, 0.0);
  float r2 = auroraRibbon(uv, t * 0.88, 0.32, 0.24, 2.6, 0.22, 2.1);
  float r3 = auroraRibbon(uv, t * 0.72, -0.28, 0.22, 2.8, 0.20, 4.3);
  float r4 = auroraRibbon(uv, t * 0.55, 0.12, 0.36, 1.6, 0.30, 1.0);
  float r5 = auroraRibbon(uv, t * 1.05, -0.08, 0.16, 3.2, 0.16, 5.7);
  float r6 = auroraRibbon(uv, t * 0.60, 0.48, 0.20, 2.0, 0.18, 3.5);
  float r7 = auroraRibbon(uv, t * 0.48, -0.18, 0.40, 1.4, 0.26, 6.2);

  // Calm breathing pulse and vertical atmosphere glow
  float pulse = 0.92 + 0.08 * sin(t * 0.65) * sin(t * 0.42 + 1.0);
  float glowY = smoothstep(-0.5, 0.0, uv.y) * (1.0 - smoothstep(0.25, 0.85, uv.y));
  float dist = length(uv * vec2(0.75, 0.95));
  float vignette = 1.0 - smoothstep(0.55, 1.6, dist);

  // =========================================================================
  // 1. DARK MODE SYNTHESIS (Canonical Aeternum Obsidian + Clinical Gem Veils)
  // =========================================================================
  vec3 darkBase = vec3(0.012, 0.024, 0.034);
  darkBase += vec3(0.014, 0.022, 0.030) * smoothstep(0.5, -0.4, uv.y);

  float starField = bgStars(uv, u_time) * (1.0 - u_isLight);
  vec3 starColor = vec3(0.70, 0.85, 0.90) * 0.6;

  // Dark Ribbon Palettes
  vec3 r1c_d = mix(vec3(0.08, 0.72, 0.68), vec3(0.12, 0.88, 0.82), 0.5 + 0.5 * sin(uv.y * 3.0 + t * 0.25));
  r1c_d = mix(r1c_d, vec3(0.85, 0.68, 0.30), smoothstep(0.20, 0.60, uv.y) * 0.25);
  vec3 r2c_d = mix(vec3(0.08, 0.65, 0.58), vec3(0.05, 0.58, 0.42), 0.5 + 0.5 * sin(uv.y * 3.8 - t * 0.35 + 1.0));
  vec3 r3c_d = mix(vec3(0.04, 0.40, 0.56), vec3(0.06, 0.52, 0.64), 0.5 + 0.5 * sin(uv.y * 4.2 + t * 0.2 + 2.0));
  vec3 r4c_d = mix(vec3(0.03, 0.45, 0.42), vec3(0.04, 0.55, 0.48), 0.5 + 0.5 * sin(uv.y * 2.0 + t * 0.12));
  vec3 r5c_d = mix(vec3(0.15, 0.88, 0.90), vec3(0.08, 0.72, 0.80), 0.5 + 0.5 * sin(uv.y * 5.0 + t * 0.4 + 3.0));
  vec3 r6c_d = mix(vec3(0.80, 0.62, 0.28) * 0.5, vec3(0.05, 0.50, 0.55), 0.5 + 0.5 * sin(uv.y * 2.8 - t * 0.25 + 1.5));
  vec3 r7c_d = mix(vec3(0.03, 0.32, 0.35), vec3(0.04, 0.40, 0.42), 0.5 + 0.5 * sin(uv.y * 2.2 + t * 0.1 + 4.0));

  float i1_d = r1 * 2.8 * u_auroraIntensity;
  float i2_d = r2 * 2.2 * u_auroraIntensity;
  float i3_d = r3 * 1.8 * u_auroraIntensity;
  float i4_d = r4 * 1.4 * u_auroraIntensity;
  float i5_d = r5 * 1.9 * u_auroraIntensity;
  float i6_d = r6 * 1.5 * u_auroraIntensity;
  float i7_d = r7 * 1.1 * u_auroraIntensity;

  vec3 darkRibbonLight = r1c_d * i1_d + r2c_d * i2_d + r3c_d * i3_d
                       + r4c_d * i4_d + r5c_d * i5_d + r6c_d * i6_d + r7c_d * i7_d;
  darkRibbonLight *= pulse;

  float totalDarkAurora = i1_d + i2_d + i3_d + i4_d + i5_d + i6_d + i7_d;
  vec3 darkGlow = vec3(0.04, 0.22, 0.25) * glowY * min(totalDarkAurora, 2.5) * 0.5;

  vec3 darkCol = darkBase + starColor * starField + (darkRibbonLight + darkGlow);
  darkCol -= starColor * starField * clamp(totalDarkAurora * 0.6, 0.0, 1.0);
  darkCol *= 0.85 + vignette * 0.15;

  // =========================================================================
  // 2. LIGHT MODE SYNTHESIS (Canonical Luminous Pearlescent A26 Light Atmosphere)
  // =========================================================================
  // Luminous A26 Light canvas base (#e8eef3 -> #f1f5f8)
  vec3 lightBase = vec3(0.910, 0.933, 0.953);
  lightBase += vec3(0.025, 0.020, 0.015) * smoothstep(-0.6, 0.6, uv.y);

  // Delicate, airy, pearlescent pastel ribbons (soft sheen without darkening)
  vec3 r1c_l = mix(vec3(0.72, 0.90, 0.89), vec3(0.78, 0.94, 0.92), 0.5 + 0.5 * sin(uv.y * 3.0 + t * 0.25));
  r1c_l = mix(r1c_l, vec3(0.95, 0.91, 0.82), smoothstep(0.20, 0.60, uv.y) * 0.35);
  vec3 r2c_l = mix(vec3(0.76, 0.92, 0.87), vec3(0.80, 0.94, 0.90), 0.5 + 0.5 * sin(uv.y * 3.8 - t * 0.35 + 1.0));
  vec3 r3c_l = mix(vec3(0.78, 0.88, 0.95), vec3(0.82, 0.91, 0.96), 0.5 + 0.5 * sin(uv.y * 4.2 + t * 0.2 + 2.0));
  vec3 r4c_l = mix(vec3(0.80, 0.91, 0.88), vec3(0.83, 0.93, 0.90), 0.5 + 0.5 * sin(uv.y * 2.0 + t * 0.12));
  vec3 r5c_l = mix(vec3(0.74, 0.92, 0.95), vec3(0.79, 0.90, 0.94), 0.5 + 0.5 * sin(uv.y * 5.0 + t * 0.4 + 3.0));
  vec3 r6c_l = mix(vec3(0.96, 0.92, 0.84), vec3(0.80, 0.90, 0.93), 0.5 + 0.5 * sin(uv.y * 2.8 - t * 0.25 + 1.5));
  vec3 r7c_l = mix(vec3(0.82, 0.89, 0.92), vec3(0.85, 0.92, 0.94), 0.5 + 0.5 * sin(uv.y * 2.2 + t * 0.1 + 4.0));

  // Modulated intensity for subtle, non-distracting pearlescent iridescence
  float lIntensity = u_auroraIntensity * 0.32;
  float i1_l = r1 * 1.8 * lIntensity;
  float i2_l = r2 * 1.5 * lIntensity;
  float i3_l = r3 * 1.2 * lIntensity;
  float i4_l = r4 * 1.0 * lIntensity;
  float i5_l = r5 * 1.4 * lIntensity;
  float i6_l = r6 * 1.1 * lIntensity;
  float i7_l = r7 * 0.9 * lIntensity;

  float totalLightAurora = i1_l + i2_l + i3_l + i4_l + i5_l + i6_l + i7_l;
  vec3 lightRibbonWeighted = (r1c_l * i1_l + r2c_l * i2_l + r3c_l * i3_l
                            + r4c_l * i4_l + r5c_l * i5_l + r6c_l * i6_l + r7c_l * i7_l)
                            / max(totalLightAurora, 0.001);
  lightRibbonWeighted *= (0.95 + 0.05 * sin(t * 0.65) * sin(t * 0.42 + 1.0));

  // Soft pearlescent modulation: smoothly tints canvas base without reducing lightness
  float lightBlend = clamp(totalLightAurora * 0.55, 0.0, 0.45);
  vec3 lightCol = mix(lightBase, lightRibbonWeighted, lightBlend);
  // Extremely gentle luminous atmospheric sheen
  lightCol += vec3(0.015, 0.020, 0.022) * glowY * min(totalLightAurora, 1.2) * 0.25;
  lightCol *= 0.985 + vignette * 0.015;

  // =========================================================================
  // 3. FINAL NATIVE SHADER RESOLUTION (True GPU-level Theme Lerp)
  // =========================================================================
  vec3 finalColor = mix(darkCol, lightCol, u_isLight);
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

function compileShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation failure: ${info}`);
  }
  return shader;
}

function createProgram(gl, vertSrc, fragSrc) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(`Program link failure: ${info}`);
  }
  return { prog, vs, fs };
}

let auroraMountCount = 0;
let releaseTimeout = null;

function acquireAuroraContract() {
  if (releaseTimeout) {
    clearTimeout(releaseTimeout);
    releaseTimeout = null;
  }
  auroraMountCount++;
  if (typeof document !== "undefined" && document.body) {
    document.body.dataset.atmosphere = "aurora";
    if (!document.body.classList.contains("has-a26-aurora")) {
      document.body.classList.add("has-a26-aurora");
    }
  }
}

function releaseAuroraContract() {
  auroraMountCount = Math.max(0, auroraMountCount - 1);
  if (auroraMountCount === 0) {
    releaseTimeout = setTimeout(() => {
      if (auroraMountCount === 0 && typeof document !== "undefined" && document.body) {
        delete document.body.dataset.atmosphere;
        document.body.classList.remove("has-a26-aurora");
      }
      releaseTimeout = null;
    }, 50);
  }
}

const SEMANTIC_INTENSITIES = Object.freeze({
  standard: 0.45,
  quiet: 0.38,
  veryQuiet: 0.32,
  // backwards compatibility:
  aeternum: 0.45,
  subtle: 0.45,
  medium: 0.55,
  pronounced: 0.65
});

export default function A26AuroraBackground({
  variant = "standard",
  intensity = "subtle",
  className = ""
}) {
  const [portalTarget, setPortalTarget] = useState(() => {
    if (typeof document === "undefined") return null;
    const host = document.getElementById("a26-shell-atmosphere");
    return (host && host.isConnected) ? host : null;
  });

  useLayoutEffect(() => {
    const host = document.getElementById("a26-shell-atmosphere");
    if (host && host.isConnected && portalTarget !== host) {
      setPortalTarget(host);
    }
  });

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const { isLight } = useTheme();
  const [useFallback, setUseFallback] = useState(false);

  // Atmospheric background contract lifecycle
  useEffect(() => {
    acquireAuroraContract();
    return () => {
      releaseAuroraContract();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas) return undefined;

    // Check reduced motion
    const prefersReducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReduced = prefersReducedMotionQuery.matches;

    // DPR Cap <= 1.5
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let gl = null;
    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false
      });
    } catch (e) {
      gl = null;
    }

    if (!gl) {
      setUseFallback(true);
      return undefined;
    }

    let programBundle = null;
    let buffer = null;
    let aPos = null;
    let uTime = null;
    let uRes = null;
    let uAuroraSpeed = null;
    let uAuroraIntensity = null;
    let uIsLight = null;

    function initGL() {
      try {
        programBundle = createProgram(gl, VERT_SRC, FRAG_SRC);
        gl.useProgram(programBundle.prog);

        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

        aPos = gl.getAttribLocation(programBundle.prog, "a_pos");
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        uTime = gl.getUniformLocation(programBundle.prog, "u_time");
        uRes = gl.getUniformLocation(programBundle.prog, "u_res");
        uAuroraSpeed = gl.getUniformLocation(programBundle.prog, "u_auroraSpeed");
        uAuroraIntensity = gl.getUniformLocation(programBundle.prog, "u_auroraIntensity");
        uIsLight = gl.getUniformLocation(programBundle.prog, "u_isLight");

        return true;
      } catch (err) {
        console.warn("[A26AuroraBackground] WebGL initialization error:", err.message);
        setUseFallback(true);
        return false;
      }
    }

    if (!initGL()) return undefined;

    // Calibrated speed & intensity
    const speedVal = 0.16; // ~30% of showcase speed
    let intensityVal = 0.45;
    if (variant && SEMANTIC_INTENSITIES[variant] !== undefined) {
      intensityVal = SEMANTIC_INTENSITIES[variant];
    } else if (intensity && SEMANTIC_INTENSITIES[intensity] !== undefined) {
      intensityVal = SEMANTIC_INTENSITIES[intensity];
    } else if (typeof intensity === "number") {
      intensityVal = intensity;
    }

    let rafId = null;
    let needsResize = true;
    let hasValidResolution = false;
    let isPaused = false;

    // Telemetry tracking for Section 3 Initial Render Contract
    const mountTime = performance.now();
    const initialClientW = canvas.clientWidth || 0;
    const initialClientH = canvas.clientHeight || 0;
    let firstNonZeroW = 0;
    let firstNonZeroH = 0;
    let timeToFirstValidResolution = null;
    let timeToFirstVisibleFrame = null;

    if (typeof window !== "undefined") {
      window.__a26_aurora_lifecycle = {
        initialClientWidth: initialClientW,
        initialClientHeight: initialClientH,
        firstNonZeroWidth: 0,
        firstNonZeroHeight: 0,
        uResBefore: [0, 0],
        uResAfter: [0, 0],
        timeToFirstValidResolutionMs: null,
        timeToFirstVisibleAuroraFrameMs: null
      };
    }

    function applyResize(explicitW, explicitH) {
      const containerEl = containerRef.current;
      const clientW = explicitW !== undefined ? explicitW : (canvas.clientWidth || containerEl?.clientWidth || 0);
      const clientH = explicitH !== undefined ? explicitH : (canvas.clientHeight || containerEl?.clientHeight || 0);

      const targetW = Math.round(clientW * dpr);
      const targetH = Math.round(clientH * dpr);

      // Section 1.A: Initial zero dimensions tolerated; do NOT permanently mark resize as complete
      if (targetW <= 0 || targetH <= 0) {
        needsResize = true;
        return false;
      }

      // Record first non-zero layout resolution
      if (firstNonZeroW === 0) {
        firstNonZeroW = targetW;
        firstNonZeroH = targetH;
        timeToFirstValidResolution = parseFloat((performance.now() - mountTime).toFixed(2));
        if (typeof window !== "undefined" && window.__a26_aurora_lifecycle) {
          window.__a26_aurora_lifecycle.firstNonZeroWidth = targetW;
          window.__a26_aurora_lifecycle.firstNonZeroHeight = targetH;
          window.__a26_aurora_lifecycle.timeToFirstValidResolutionMs = timeToFirstValidResolution;
        }
      }

      // Section 1.B: Update canvas dimensions, viewport, and u_res
      if (canvas.width !== targetW || canvas.height !== targetH || !hasValidResolution) {
        canvas.width = targetW;
        canvas.height = targetH;
        gl.viewport(0, 0, targetW, targetH);
        gl.useProgram(programBundle.prog);
        gl.uniform2f(uRes, targetW, targetH);
        hasValidResolution = true;
        needsResize = false;

        if (typeof window !== "undefined" && window.__a26_aurora_lifecycle) {
          window.__a26_aurora_lifecycle.uResAfter = [targetW, targetH];
        }
        return true;
      }

      needsResize = false;
      return true;
    }

    // Try initial sizing
    applyResize();

    // Section 1.C: ResizeObserver on Aurora container where supported
    let resizeObserver = null;
    const containerEl = containerRef.current;
    if (typeof ResizeObserver !== "undefined" && containerEl) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            applyResize(width, height);
          } else {
            needsResize = true;
          }
        }
      });
      resizeObserver.observe(containerEl);
    }

    // Section 1.D: Window resize fallback
    function handleResize() {
      needsResize = true;
    }

    function render(now) {
      if (isPaused) return;

      const containerEl = containerRef.current;
      const clientW = canvas.clientWidth || containerEl?.clientWidth || 0;
      const clientH = canvas.clientHeight || containerEl?.clientHeight || 0;
      const targetW = Math.round(clientW * dpr);
      const targetH = Math.round(clientH * dpr);

      // Section 1.E: Stale/missing resolution detection in render loop
      if (
        targetW > 0 &&
        targetH > 0 &&
        (canvas.width !== targetW || canvas.height !== targetH || !hasValidResolution || needsResize)
      ) {
        applyResize(clientW, clientH);
      }

      // Do not render frame until layout dimensions and resolution are valid
      if (!hasValidResolution) {
        if (!prefersReduced) {
          rafId = window.requestAnimationFrame(render);
        }
        return;
      }

      gl.useProgram(programBundle.prog);
      const timeVal = prefersReduced ? 12.0 : now * 0.001;
      const effectiveTime = (typeof window !== "undefined" && window.__a26_aurora_freeze_time !== undefined)
        ? window.__a26_aurora_freeze_time
        : timeVal;
      const effectiveIntensity = (typeof window !== "undefined" && window.__a26_aurora_intensity !== undefined)
        ? window.__a26_aurora_intensity
        : intensityVal;

      gl.uniform1f(uTime, effectiveTime);
      gl.uniform1f(uAuroraSpeed, speedVal);
      gl.uniform1f(uAuroraIntensity, effectiveIntensity);
      gl.uniform1f(uIsLight, isLight ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (timeToFirstVisibleFrame === null) {
        timeToFirstVisibleFrame = parseFloat((performance.now() - mountTime).toFixed(2));
        if (typeof window !== "undefined" && window.__a26_aurora_lifecycle) {
          window.__a26_aurora_lifecycle.timeToFirstVisibleAuroraFrameMs = timeToFirstVisibleFrame;
        }
      }

      if (!prefersReduced) {
        rafId = window.requestAnimationFrame(render);
      }
    }

    // Initial render trigger
    rafId = window.requestAnimationFrame(render);

    // Document Visibility Listener (Pause when hidden)
    function handleVisibilityChange() {
      if (document.hidden) {
        isPaused = true;
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
      } else {
        isPaused = false;
        if (!prefersReduced && !rafId) {
          rafId = window.requestAnimationFrame(render);
        }
      }
    }

    // Reduced Motion Listener
    function handleReducedMotionChange(e) {
      prefersReduced = e.matches;
      if (prefersReduced) {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
        render(12000); // Draw single static frame
      } else if (!rafId && !document.hidden) {
        rafId = window.requestAnimationFrame(render);
      }
    }

    // WebGL Context Lost / Restored Handlers
    function handleContextLost(e) {
      e.preventDefault();
      isPaused = true;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function handleContextRestored() {
      if (initGL()) {
        isPaused = false;
        hasValidResolution = false;
        applyResize();
        if (!prefersReduced && !document.hidden) {
          rafId = window.requestAnimationFrame(render);
        }
      }
    }

    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    prefersReducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      prefersReducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);

      if (gl) {
        try {
          if (buffer) gl.deleteBuffer(buffer);
          if (programBundle?.vs) gl.deleteShader(programBundle.vs);
          if (programBundle?.fs) gl.deleteShader(programBundle.fs);
          if (programBundle?.prog) gl.deleteProgram(programBundle.prog);
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, [variant, intensity, isLight, portalTarget]);

  const containerContent = (
    <div
      ref={containerRef}
      className={`a26-aurora-container ${isLight ? "a26-aurora-container--light" : "a26-aurora-container--dark"} ${className}`.trim()}
      aria-hidden="true"
    >
      {useFallback ? (
        <div className="a26-aurora-fallback" />
      ) : (
        <canvas ref={canvasRef} className="a26-aurora-canvas" />
      )}
    </div>
  );

  if (portalTarget && portalTarget.isConnected) {
    return createPortal(containerContent, portalTarget);
  }

  if (typeof document !== "undefined" && document.getElementById("a26-shell-atmosphere")) {
    return null;
  }

  return containerContent;
}
