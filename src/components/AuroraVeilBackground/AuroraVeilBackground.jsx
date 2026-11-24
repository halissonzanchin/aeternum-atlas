/**
 * Aurora Veil Background · Aeternum Atlas (Expansão Total P0.21-UI.4)
 * 
 * Based on Radiant Shaders: Aurora Veil by Paul Bakaus (MIT License)
 * Source: https://github.com/pbakaus/radiant / https://radiant-shaders.com/shader/aurora-veil
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * Art Direction & Customization for Aeternum Atlas (P0.21-UI.4 Total Expansion):
 * - Deep Obsidian-Navy cosmos (#010609)
 * - Panoramic 7-ribbon cosmic curtain spanning the full viewport width and height
 * - Luminous Emerald, Cyan-Teal, Electric Cyan, and refined Celestial Gold reflections
 * - Volumetric ambient plasma mist ensuring zero dark empty voids in the periphery
 * - Scroll parallax integration (u_scroll) providing majestic atmospheric continuity
 * - Zero artificial ice ground cutoffs: continuous full-viewport draping
 * - Tuned gentle speed (0.16) and calibrated luminous intensity (0.42) for reading comfort
 * - Battery-saving auto-pause via visibilitychange and prefers-reduced-motion support
 * - Capped DPR (1.25) protecting GPU performance on 4K / Retina displays
 * - pointer-events: none ensuring zero interference with form fields
 */

import { useEffect, useRef, useState } from "react";
import "./AuroraVeilBackground.css";

const VERT_SHADER_SRC = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG_SHADER_SRC = `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform float u_auroraSpeed;
uniform float u_auroraIntensity;
uniform float u_scroll;

#define PI 3.14159265359
#define NUM_BG_STARS 95

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

float auroraRibbon(vec2 uv, float t, float ribbonX, float ribbonWidth, float waveFreq, float waveAmp, float phase, float scrollDelta) {
  float centerX = ribbonX + sin(t * 0.14 + phase) * 0.22;
  float wave1 = sin(uv.y * waveFreq + t * 0.72 + phase + scrollDelta) * waveAmp;
  float wave2 = sin(uv.y * waveFreq * 2.1 + t * 1.05 + phase * 1.7 - scrollDelta * 0.5) * waveAmp * 0.5;
  float wave3 = sin(uv.y * waveFreq * 0.45 + t * 0.28 + phase * 0.6) * waveAmp * 1.1;
  float waveOffset = wave1 + wave2 + wave3;

  float dx = uv.x - (centerX + waveOffset);
  float ribbon = exp(-dx * dx / (ribbonWidth * ribbonWidth));

  float brightBand = 0.5 + 0.5 * sin(uv.y * 2.4 + t * 0.55 + phase * 2.0 + scrollDelta);
  brightBand *= 0.5 + 0.5 * sin(uv.y * 4.6 - t * 0.70 + phase);

  float shimmer = 0.76 + 0.24 * sin(t * 2.1 + phase * 3.0 + uv.y * 6.5);
  shimmer *= 0.82 + 0.18 * sin(t * 1.4 + phase * 1.1 + uv.x * 5.2);

  // Full-viewport vertical envelope with gentle, silky edge falloffs
  float verticalFade = smoothstep(-0.62, -0.42, uv.y) * smoothstep(0.62, 0.42, uv.y);
  float detail = noise(vec2(uv.x * 5.2, uv.y * 8.5 + t * 0.38 + phase));
  detail = 0.65 + 0.35 * detail;

  return ribbon * brightBand * verticalFade * detail * shimmer;
}

float bgStars(vec2 uv, float t) {
  float stars = 0.0;
  for (int i = 0; i < NUM_BG_STARS; i++) {
    float fi = float(i);
    vec2 pos = vec2(
      hash1(fi * 17.31 + 100.0) * 3.2 - 1.6,
      hash1(fi * 11.97 + 200.0) * 1.2 - 0.6
    );
    float d = length(uv - pos);
    float twinkleSpeed = 0.4 + hash1(fi * 3.3 + 300.0) * 1.8;
    float twinkle = 0.3 + 0.7 * sin(t * twinkleSpeed + fi * 2.7);
    twinkle = max(twinkle, 0.0);
    twinkle *= twinkle;
    float size = 0.0006 + hash1(fi * 5.5 + 400.0) * 0.0016;
    float brightness = 0.32 + hash1(fi * 7.7 + 500.0) * 0.55;
    stars += smoothstep(size, 0.0, d) * twinkle * brightness;
  }
  return stars;
}

void main() {
  vec2 st = gl_FragCoord.xy / u_res.xy;
  vec2 ndc = st * 2.0 - 1.0;
  float aspect = u_res.x / u_res.y;

  // Adaptive coordinates: responsive on widescreen and portrait without clipping
  vec2 uv = vec2(ndc.x * max(aspect * 0.5, 0.55), ndc.y * 0.5);
  float t = u_time * u_auroraSpeed;
  float scrollDelta = u_scroll * 0.00035;

  // 1. Deep Obsidian-Navy Void (#010609)
  vec3 col = vec3(0.004, 0.008, 0.015);
  col += vec3(0.006, 0.014, 0.022) * smoothstep(0.5, -0.4, uv.y);

  // 2. Cosmic Background Stars
  float starField = bgStars(uv, u_time);
  vec3 starColor = vec3(0.85, 0.92, 0.96);
  col += starColor * starField;

  // 3. Volumetric Ambient Plasma Mist (Eliminates dead voids anywhere on screen)
  float mistNoise = noise(vec2(uv.x * 2.2 + t * 0.12, uv.y * 1.8 - t * 0.08));
  vec3 ambientMist = mix(
    vec3(0.008, 0.045, 0.042),
    vec3(0.014, 0.038, 0.052),
    st.x
  ) * (0.65 + 0.35 * mistNoise) * (0.85 + 0.15 * sin(t * 0.45 + st.y * 2.5));
  col += ambientMist * u_auroraIntensity * 1.25;

  // 4. Panoramic 7-Ribbon Cosmic Curtain System (Full Width & Full Height)
  float span = max(aspect * 0.5, 0.65);

  // Ribbon 1: Far Left Curtain (Shines behind left institutional column)
  float r1 = auroraRibbon(uv, t, -span * 0.74, 0.28, 2.1, 0.28, 0.5, scrollDelta);
  vec3 r1color = mix(
    vec3(0.06, 0.78, 0.72), // cyan-teal
    vec3(0.04, 0.62, 0.52), // emerald-teal
    0.5 + 0.5 * sin(uv.y * 3.0 + t * 0.22)
  );

  // Ribbon 2: Left Core Curtain (Vibrant Emerald behind institutional story)
  float r2 = auroraRibbon(uv, t * 0.92, -span * 0.42, 0.22, 2.5, 0.24, 2.1, scrollDelta);
  vec3 r2color = mix(
    vec3(0.07, 0.88, 0.52), // vivid emerald
    vec3(0.12, 0.76, 0.40), // deep jade
    0.5 + 0.5 * sin(uv.y * 3.6 - t * 0.32 + 1.0)
  );

  // Ribbon 3: Left-Center Horizon Accent (Celestial Gold & Warm Amber)
  float r3 = auroraRibbon(uv, t * 0.76, -span * 0.14, 0.18, 2.7, 0.20, 3.8, scrollDelta);
  vec3 r3color = mix(
    vec3(0.84, 0.70, 0.34), // refined gold
    vec3(0.72, 0.52, 0.20), // warm amber
    0.5 + 0.5 * sin(uv.y * 4.2 + t * 0.2 + 2.0)
  );

  // Ribbon 4: Center-Right Curtain (Electric Cyan behind form core)
  float r4 = auroraRibbon(uv, t * 0.86, +span * 0.16, 0.25, 2.2, 0.26, 1.2, scrollDelta);
  vec3 r4color = mix(
    vec3(0.12, 0.88, 0.94), // electric cyan
    vec3(0.08, 0.72, 0.86), // sky cyan
    0.5 + 0.5 * sin(uv.y * 3.4 + t * 0.28)
  );

  // Ribbon 5: Right Core Curtain (Emerald-Cyan behind form fields)
  float r5 = auroraRibbon(uv, t * 1.04, +span * 0.46, 0.21, 2.6, 0.22, 4.7, scrollDelta);
  vec3 r5color = mix(
    vec3(0.06, 0.84, 0.56), // emerald green
    vec3(0.05, 0.68, 0.48), // mint teal
    0.5 + 0.5 * sin(uv.y * 4.0 - t * 0.38 + 2.5)
  );

  // Ribbon 6: Far Right Viewport Drape (Atmospheric frame)
  float r6 = auroraRibbon(uv, t * 0.66, +span * 0.76, 0.26, 1.9, 0.28, 5.9, scrollDelta);
  vec3 r6color = mix(
    vec3(0.09, 0.76, 0.82), // deep cyan
    vec3(0.05, 0.58, 0.65), // ocean teal
    0.5 + 0.5 * sin(uv.y * 2.8 + t * 0.18)
  );

  // Ribbon 7: Vast Broad Background Veil (Undulating bioluminescent depth)
  float r7 = auroraRibbon(uv, t * 0.52, 0.0, span * 0.88, 1.5, 0.32, 0.0, scrollDelta * 0.5);
  vec3 r7color = mix(
    vec3(0.03, 0.44, 0.40), // deep celestial teal
    vec3(0.02, 0.36, 0.30), // deep emerald void
    0.5 + 0.5 * sin(uv.y * 2.0 + t * 0.12)
  );

  // Layered Intensity Synthesis (Calibrated for premium comfort and optical transmission)
  float i1 = r1 * 1.25 * u_auroraIntensity;
  float i2 = r2 * 1.15 * u_auroraIntensity;
  float i3 = r3 * 0.70 * u_auroraIntensity;
  float i4 = r4 * 1.20 * u_auroraIntensity;
  float i5 = r5 * 1.05 * u_auroraIntensity;
  float i6 = r6 * 0.95 * u_auroraIntensity;
  float i7 = r7 * 0.55 * u_auroraIntensity;

  vec3 auroraLight = r1color * i1 +
                     r2color * i2 +
                     r3color * i3 +
                     r4color * i4 +
                     r5color * i5 +
                     r6color * i6 +
                     r7color * i7;

  // Gentle Organic Pulse
  float pulse = 0.90 + 0.10 * sin(t * 0.72) * sin(t * 0.45 + 1.0);
  auroraLight *= pulse;

  // Volumetric Atmospheric Glow across whole screen
  float totalAurora = i1 + i2 + i3 + i4 + i5 + i6 + i7;
  vec3 atmosphericGlow = vec3(0.035, 0.13, 0.12) * min(totalAurora, 2.5) * 0.38;

  col += auroraLight + atmosphericGlow;

  // Dim stars under intense aurora ribbons
  col -= starColor * starField * clamp(totalAurora * 0.45, 0.0, 1.0);

  // Subtle Peripheral Optical Falloff
  float dist = length(ndc * vec2(0.55, 0.75));
  float vignette = 1.0 - smoothstep(0.65, 1.45, dist);
  col *= 0.82 + vignette * 0.18;

  col = max(col, vec3(0.0));
  col = pow(col, vec3(0.95, 0.97, 0.98));

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function AuroraVeilBackground() {
  const canvasRef = useRef(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check prefers-reduced-motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = motionQuery.matches;

    // Cap DPR to 1.25 for peak performance and battery conservation
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);

    let gl = null;
    try {
      gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance"
      });
    } catch {
      gl = null;
    }

    if (!gl) {
      setWebglSupported(false);
      return;
    }

    function compileShader(type, src) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertShader = compileShader(gl.VERTEX_SHADER, VERT_SHADER_SRC);
    const fragShader = compileShader(gl.FRAGMENT_SHADER, FRAG_SHADER_SRC);

    if (!vertShader || !fragShader) {
      setWebglSupported(false);
      return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebglSupported(false);
      return;
    }

    gl.useProgram(program);

    // Fullscreen single triangle buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_res");
    const uSpeed = gl.getUniformLocation(program, "u_auroraSpeed");
    const uIntensity = gl.getUniformLocation(program, "u_auroraIntensity");
    const uScroll = gl.getUniformLocation(program, "u_scroll");

    // Calibrated atmospheric constants
    gl.uniform1f(uSpeed, 0.16);
    gl.uniform1f(uIntensity, 0.42);
    if (uScroll) gl.uniform1f(uScroll, 0.0);

    let animFrameId = null;
    let isPaused = false;
    let currentScroll = 0;
    const startTime = performance.now();

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    }

    function renderFrame(now) {
      if (isPaused) return;

      const elapsed = (now - startTime) * 0.001;
      gl.uniform1f(uTime, elapsed);
      if (uScroll) gl.uniform1f(uScroll, currentScroll);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!prefersReducedMotion) {
        animFrameId = requestAnimationFrame(renderFrame);
      }
    }

    function handleResize() {
      resize();
      if (prefersReducedMotion) {
        renderFrame(performance.now());
      }
    }

    function handleScroll() {
      currentScroll = window.scrollY || document.documentElement.scrollTop || 0;
      if (prefersReducedMotion) {
        renderFrame(performance.now());
      }
    }

    function handleVisibility() {
      if (document.hidden) {
        isPaused = true;
        if (animFrameId) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
      } else {
        isPaused = false;
        if (!prefersReducedMotion && !animFrameId) {
          animFrameId = requestAnimationFrame(renderFrame);
        }
      }
    }

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);

    resize();
    currentScroll = window.scrollY || document.documentElement.scrollTop || 0;
    animFrameId = requestAnimationFrame(renderFrame);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      if (vertShader) gl.deleteShader(vertShader);
      if (fragShader) gl.deleteShader(fragShader);
    };
  }, []);

  return (
    <div className="aurora-veil-wrapper" aria-hidden="true" data-testid="a26-aurora-veil">
      <div className="aurora-veil-fallback" />
      {webglSupported && (
        <canvas ref={canvasRef} className="aurora-veil-canvas" />
      )}
      <div className="aurora-veil-vignette" />
    </div>
  );
}
