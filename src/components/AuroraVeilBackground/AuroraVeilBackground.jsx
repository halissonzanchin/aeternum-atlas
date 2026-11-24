/**
 * Aurora Veil Background · Aeternum Atlas
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
 * Art Direction & Customization for Aeternum Atlas:
 * - Deep Obsidian-Navy background (#010609)
 * - Luminous ribbons in Emerald, Teal, and Cyan with subtle celestial Gold reflections
 * - Tuned gentle speed (0.16) and low luminous intensity (0.38) for reading comfort
 * - Battery-saving auto-pause via document.hidden and prefers-reduced-motion support
 * - Capped DPR (1.25) to protect GPU performance on 4K/retina displays
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

#define PI 3.14159265359
#define NUM_BG_STARS 90

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

float auroraRibbon(vec2 uv, float t, float ribbonX, float ribbonWidth, float waveFreq, float waveAmp, float phase) {
  float centerX = ribbonX + sin(t * 0.15 + phase) * 0.22;
  float wave1 = sin(uv.y * waveFreq + t * 0.75 + phase) * waveAmp;
  float wave2 = sin(uv.y * waveFreq * 2.2 + t * 1.1 + phase * 1.7) * waveAmp * 0.5;
  float wave3 = sin(uv.y * waveFreq * 0.45 + t * 0.3 + phase * 0.6) * waveAmp * 1.1;
  float waveOffset = wave1 + wave2 + wave3;

  float dx = uv.x - (centerX + waveOffset);
  float ribbon = exp(-dx * dx / (ribbonWidth * ribbonWidth));

  float brightBand = 0.5 + 0.5 * sin(uv.y * 2.5 + t * 0.6 + phase * 2.0);
  brightBand *= 0.5 + 0.5 * sin(uv.y * 4.8 - t * 0.75 + phase);

  float shimmer = 0.75 + 0.25 * sin(t * 2.2 + phase * 3.0 + uv.y * 7.0);
  shimmer *= 0.82 + 0.18 * sin(t * 1.5 + phase * 1.1 + uv.x * 5.5);

  float verticalFade = smoothstep(-0.35, -0.05, uv.y) * smoothstep(0.72, 0.32, uv.y);
  float detail = noise(vec2(uv.x * 5.5, uv.y * 9.0 + t * 0.4 + phase));
  detail = 0.65 + 0.35 * detail;

  return ribbon * brightBand * verticalFade * detail * shimmer;
}

float bgStars(vec2 uv, float t) {
  float stars = 0.0;
  for (int i = 0; i < NUM_BG_STARS; i++) {
    float fi = float(i);
    vec2 pos = vec2(
      hash1(fi * 17.31 + 100.0) * 2.8 - 1.4,
      hash1(fi * 11.97 + 200.0) * 1.4 - 0.3
    );
    float d = length(uv - pos);
    float twinkleSpeed = 0.4 + hash1(fi * 3.3 + 300.0) * 1.8;
    float twinkle = 0.3 + 0.7 * sin(t * twinkleSpeed + fi * 2.7);
    twinkle = max(twinkle, 0.0);
    twinkle *= twinkle;
    float size = 0.0007 + hash1(fi * 5.5 + 400.0) * 0.0018;
    float brightness = 0.35 + hash1(fi * 7.7 + 500.0) * 0.55;
    stars += smoothstep(size, 0.0, d) * twinkle * brightness;
  }
  return stars;
}

float hexDist(vec2 p) {
  p = abs(p);
  return max(p.x + p.y * 0.577350269, p.y * 1.154700538);
}

float crystalPattern(vec2 uv, float t) {
  float scale = 11.0;
  vec2 p = uv * scale;
  vec2 r = vec2(1.0, 1.732);
  vec2 h = r * 0.5;
  vec2 a = mod(p, r) - h;
  vec2 b = mod(p - h, r) - h;
  vec2 gv = (dot(a, a) < dot(b, b)) ? a : b;
  float hd = hexDist(gv);
  float edge = smoothstep(0.44, 0.39, hd) - smoothstep(0.39, 0.34, hd);
  float angle = atan(gv.y, gv.x);
  float branch = abs(sin(angle * 3.0));
  float branchLine = smoothstep(0.04, 0.0, abs(branch - 0.5) * hd);
  branchLine *= smoothstep(0.0, 0.15, hd) * smoothstep(0.44, 0.24, hd);
  float crystal = edge * 0.55 + branchLine * 0.35;
  float shimmer = 0.75 + 0.25 * sin(t * 0.18 + hash(floor(p / r)) * 6.28);
  return crystal * shimmer;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_res * 0.5) / min(u_res.x, u_res.y);
  float t = u_time * u_auroraSpeed;

  // 1. Deep Obsidian-Navy Void (#010609)
  vec3 col = vec3(0.004, 0.008, 0.015);
  col += vec3(0.006, 0.014, 0.022) * smoothstep(0.5, -0.3, uv.y);

  // 2. Background Stars
  float starField = bgStars(uv, u_time);
  vec3 starColor = vec3(0.85, 0.92, 0.95);
  col += starColor * starField;

  // 3. Aeternum Aurora Ribbons (Emerald, Teal, Cyan, Gold Accents)
  // Ribbon 1: Primary Cyan-Teal Curtain
  float r1 = auroraRibbon(uv, t, 0.0, 0.24, 2.4, 0.26, 0.0);
  vec3 r1color = mix(
    vec3(0.08, 0.85, 0.76), // vibrant cyan-teal
    vec3(0.06, 0.72, 0.54), // emerald-teal
    0.5 + 0.5 * sin(uv.y * 3.2 + t * 0.25)
  );

  // Ribbon 2: Secondary Vivid Emerald Curtain
  float r2 = auroraRibbon(uv, t * 0.88, 0.32, 0.19, 2.7, 0.22, 2.1);
  vec3 r2color = mix(
    vec3(0.07, 0.86, 0.48), // emerald green
    vec3(0.12, 0.78, 0.38), // jade green
    0.5 + 0.5 * sin(uv.y * 3.8 - t * 0.35 + 1.0)
  );

  // Ribbon 3: Celestial Gold & Amber Accent (Subtle horizon warmth)
  float r3 = auroraRibbon(uv, t * 0.72, -0.28, 0.15, 2.9, 0.20, 4.3);
  vec3 r3color = mix(
    vec3(0.82, 0.68, 0.32), // refined gold
    vec3(0.74, 0.54, 0.22), // warm amber
    0.5 + 0.5 * sin(uv.y * 4.5 + t * 0.2 + 2.0)
  );

  // Ribbon 4: Wide Deep Teal Background Veil
  float r4 = auroraRibbon(uv, t * 0.58, 0.14, 0.32, 1.7, 0.32, 1.0);
  vec3 r4color = mix(
    vec3(0.04, 0.52, 0.44), // deep teal
    vec3(0.03, 0.42, 0.32), // deep forest cyan
    0.5 + 0.5 * sin(uv.y * 2.0 + t * 0.12)
  );

  // Ribbon 5: Electric Cyan High-energy Streak
  float r5 = auroraRibbon(uv, t * 1.05, -0.08, 0.09, 3.4, 0.16, 5.7);
  vec3 r5color = mix(
    vec3(0.18, 0.92, 0.96), // electric cyan
    vec3(0.10, 0.75, 0.88), // sky cyan
    0.5 + 0.5 * sin(uv.y * 5.5 + t * 0.45 + 3.0)
  );

  // Intensity Layering (Calibrated for reading comfort)
  float i1 = r1 * 1.3 * u_auroraIntensity;
  float i2 = r2 * 1.0 * u_auroraIntensity;
  float i3 = r3 * 0.65 * u_auroraIntensity;
  float i4 = r4 * 0.45 * u_auroraIntensity;
  float i5 = r5 * 0.7 * u_auroraIntensity;

  vec3 auroraLight = r1color * i1 + r2color * i2 + r3color * i3 + r4color * i4 + r5color * i5;

  // Gentle Breathing Pulse
  float pulse = 0.88 + 0.12 * sin(t * 0.75) * sin(t * 0.48 + 1.0);
  auroraLight *= pulse;

  // Atmospheric Glow
  float glowY = smoothstep(-0.3, 0.0, uv.y) * smoothstep(0.72, 0.22, uv.y);
  float totalAurora = i1 + i2 + i3 + i4 + i5;
  vec3 atmosphericGlow = vec3(0.03, 0.12, 0.10) * glowY * min(totalAurora, 2.0) * 0.35;

  col += auroraLight + atmosphericGlow;

  // Dim stars under aurora light
  col -= starColor * starField * clamp(totalAurora * 0.45, 0.0, 1.0);

  // 4. Ground Ice Crystal Frost & Horizon Reflection
  float groundLine = -0.38;
  float groundFade = smoothstep(groundLine + 0.04, groundLine - 0.16, uv.y);

  if (groundFade > 0.001) {
    float perspY = max(0.001, groundLine - uv.y);
    vec2 crystalUV = vec2(uv.x / (perspY * 2.0 + 0.5), 1.0 / (perspY * 3.0));
    crystalUV.x += t * 0.015;
    float crystal = crystalPattern(crystalUV, u_time);
    vec3 iceColor = vec3(0.02, 0.04, 0.07);
    vec3 iceCrystalColor = vec3(0.08, 0.15, 0.20);
    vec3 iceSurface = mix(iceColor, iceCrystalColor, crystal * 0.45);

    vec2 reflUV = vec2(uv.x, -uv.y - groundLine * 2.0);
    float rr1 = auroraRibbon(reflUV, t, 0.0, 0.26, 2.4, 0.26, 0.0) * 0.25;
    float rr2 = auroraRibbon(reflUV, t * 0.88, 0.32, 0.20, 2.7, 0.22, 2.1) * 0.18;
    vec3 reflectionColor = (r1color * rr1 + r2color * rr2) * u_auroraIntensity * pulse;

    float reflStrength = smoothstep(0.25, 0.0, perspY) * 0.55;
    float sparkle = pow(crystal, 3.0) * reflStrength;
    vec3 sparkleColor = vec3(0.85, 0.78, 0.60) * sparkle * 0.25;

    iceSurface += reflectionColor * reflStrength + sparkleColor;
    col = mix(col, iceSurface, groundFade);
  }

  // 5. Subtle Vignette
  float dist = length(uv * vec2(0.68, 0.88));
  float vignette = 1.0 - smoothstep(0.48, 1.45, dist);
  col *= 0.72 + vignette * 0.28;

  col = max(col, vec3(0.0));
  col = pow(col, vec3(0.94, 0.96, 0.98));

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
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Initialize WebGL with alpha and low power consumption
    let gl = null;
    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: "low-power"
      }) || canvas.getContext("experimental-webgl");
    } catch (e) {
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
    const uAuroraSpeed = gl.getUniformLocation(program, "u_auroraSpeed");
    const uAuroraIntensity = gl.getUniformLocation(program, "u_auroraIntensity");

    // Tuned art parameters
    const auroraSpeed = 0.16;
    const auroraIntensity = 0.38;

    // Cap DPR to 1.25 for background atmosphere to preserve battery & GPU
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    let needsResize = true;
    let animFrameId = null;
    let isTabVisible = !document.hidden;

    function resize() {
      needsResize = false;
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uRes, canvas.width, canvas.height);
      }
    }

    function renderFrame(now) {
      if (needsResize) resize();

      const timeVal = prefersReduced ? 1.2 : now * 0.001;
      gl.uniform1f(uTime, timeVal);
      gl.uniform1f(uAuroraSpeed, auroraSpeed);
      gl.uniform1f(uAuroraIntensity, auroraIntensity);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // If reduced motion is requested, render once and stop loop
      if (!prefersReduced && isTabVisible) {
        animFrameId = requestAnimationFrame(renderFrame);
      }
    }

    const handleResize = () => {
      needsResize = true;
    };

    const handleVisibility = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible && !prefersReduced && !animFrameId) {
        animFrameId = requestAnimationFrame(renderFrame);
      } else if (!isTabVisible && animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibility);

    resize();
    animFrameId = requestAnimationFrame(renderFrame);

    return () => {
      window.removeEventListener("resize", handleResize);
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
