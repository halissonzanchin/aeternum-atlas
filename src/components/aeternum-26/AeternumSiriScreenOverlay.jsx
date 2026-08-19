import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./AeternumSiriScreenOverlay.css";

/**
 * Aeternum 26.1 Siri / Apple Intelligence Fullscreen Living Screen Overlay
 * Exact WebGL Mesh Gradient & Harmonic Undulating Wave Border from Siddhant Mehta's prototype.
 */
const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = (a_position + 1.0) * 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 v_uv;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_opacity;
  uniform float u_state; // 0: listening, 1: thinking, 2: speaking

  // 9 Colors from iOS 18 Siri Mesh Gradient
  // Yellow, Purple, Indigo
  // Orange, Red, Blue
  // Indigo, Green, Mint
  const vec3 C00 = vec3(1.0, 0.80, 0.0);   // Yellow
  const vec3 C10 = vec3(0.68, 0.32, 0.87);  // Purple
  const vec3 C20 = vec3(0.34, 0.33, 0.84);  // Indigo

  const vec3 C01 = vec3(1.0, 0.58, 0.0);   // Orange
  const vec3 C11 = vec3(1.0, 0.23, 0.19);  // Red
  const vec3 C21 = vec3(0.0, 0.48, 1.0);   // Blue

  const vec3 C02 = vec3(0.34, 0.33, 0.84);  // Indigo
  const vec3 C12 = vec3(0.20, 0.78, 0.35);  // Green
  const vec3 C22 = vec3(0.0, 0.78, 0.74);   // Mint

  float sinInRange(float minVal, float maxVal, float offset, float timeScale, float t) {
    float amp = (maxVal - minVal) * 0.5;
    float mid = (maxVal + minVal) * 0.5;
    return mid + amp * sin(timeScale * t + offset);
  }

  void main() {
    vec2 uv = v_uv;
    float t = u_time * 1.6;

    // Control point oscillation matching Swift MeshGradientView
    vec2 p00 = vec2(0.0, 0.0);
    vec2 p10 = vec2(sinInRange(0.3, 0.7, 3.42, 0.984, t), 0.0);
    vec2 p20 = vec2(1.0, 0.0);

    vec2 p01 = vec2(0.0, sinInRange(0.3, 0.7, 1.439, 0.442, t));
    vec2 p11 = vec2(sinInRange(0.1, 0.8, 0.239, 0.084, t), sinInRange(0.2, 0.8, 5.21, 0.242, t));
    vec2 p21 = vec2(1.0, sinInRange(0.4, 0.8, 0.25, 0.642, t));

    vec2 p02 = vec2(0.0, 1.0);
    vec2 p12 = vec2(sinInRange(0.3, 0.6, 0.339, 0.784, t), 1.0);
    vec2 p22 = vec2(1.0, 1.0);

    // Calculate distance-weighted 9-point color interpolation
    float w00 = 1.0 / (pow(distance(uv, p00), 2.2) + 0.008);
    float w10 = 1.0 / (pow(distance(uv, p10), 2.2) + 0.008);
    float w20 = 1.0 / (pow(distance(uv, p20), 2.2) + 0.008);

    float w01 = 1.0 / (pow(distance(uv, p01), 2.2) + 0.008);
    float w11 = 1.0 / (pow(distance(uv, p11), 2.2) + 0.008);
    float w21 = 1.0 / (pow(distance(uv, p21), 2.2) + 0.008);

    float w02 = 1.0 / (pow(distance(uv, p02), 2.2) + 0.008);
    float w12 = 1.0 / (pow(distance(uv, p12), 2.2) + 0.008);
    float w22 = 1.0 / (pow(distance(uv, p22), 2.2) + 0.008);

    float totalWeight = w00 + w10 + w20 + w01 + w11 + w21 + w02 + w12 + w22;
    vec3 meshColor = (C00 * w00 + C10 * w10 + C20 * w20 +
                      C01 * w01 + C11 * w11 + C21 * w21 +
                      C02 * w02 + C12 * w12 + C22 * w22) / totalWeight;

    // Harmonic Undulating Wave Border (from AnimatedPath.swift)
    float pxX = min(uv.x, 1.0 - uv.x) * u_resolution.x;
    float pxY = min(uv.y, 1.0 - uv.y) * u_resolution.y;

    float waveSpeed = 3.2;
    float waveAmp = 12.0;
    if (u_state > 0.5 && u_state < 1.5) {
      waveSpeed = 4.6;
      waveAmp = 16.0;
    } else if (u_state > 1.5) {
      waveSpeed = 5.2;
      waveAmp = 18.0;
    }

    float wave = waveAmp * sin(u_time * waveSpeed + uv.y * 14.0) + waveAmp * sin(u_time * (waveSpeed * 0.8) + uv.x * 14.0);
    float edgeDist = min(pxX, pxY) + wave;

    // Border Glow Mask (soft 0 to 72px edge gradient)
    float borderGlow = 1.0 - smoothstep(0.0, 76.0, edgeDist);
    
    // Thin bright white laser rim at the outer edge
    float whiteRim = smoothstep(0.0, 5.0, edgeDist) * (1.0 - smoothstep(5.0, 18.0, edgeDist));

    // Center Scrim Vignette
    float centerVignette = smoothstep(0.1, 0.85, distance(uv, vec2(0.5)));

    vec3 finalColor = meshColor + vec3(0.95, 0.95, 1.0) * whiteRim * 1.8;
    float finalAlpha = clamp((borderGlow * 1.35 + whiteRim * 0.8 + centerVignette * 0.45) * u_opacity, 0.0, 1.0);

    gl_FragColor = vec4(finalColor * finalAlpha, finalAlpha);
  }
`;

export default function AeternumSiriScreenOverlay({
  active = false,
  state = "idle",
  onDeactivate
}) {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const animFrameRef = useRef(null);
  const opacityRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true });
    if (!gl) return;
    glRef.current = gl;

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, VERTEX_SHADER);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, FRAGMENT_SHADER);
    gl.compileShader(fs);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);
    programRef.current = program;

    // Screen quad buffer
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    const resLoc = gl.getUniformLocation(program, "u_resolution");
    const timeLoc = gl.getUniformLocation(program, "u_time");
    const opLoc = gl.getUniformLocation(program, "u_opacity");
    const stateLoc = gl.getUniformLocation(program, "u_state");

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const targetOpacity = active ? 1.0 : 0.0;
      opacityRef.current += (targetOpacity - opacityRef.current) * 0.12;

      if (opacityRef.current > 0.005) {
        gl.useProgram(program);
        gl.uniform2f(resLoc, canvas.width, canvas.height);
        gl.uniform1f(timeLoc, (Date.now() - startTimeRef.current) * 0.001);
        gl.uniform1f(opLoc, opacityRef.current);

        let stateVal = 0.0;
        if (state === "thinking") stateVal = 1.0;
        if (state === "speaking") stateVal = 2.0;
        gl.uniform1f(stateLoc, stateVal);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
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
      onClick={active ? onDeactivate : undefined}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="a26-siri-canvas" />
      {active && (
        <div className="a26-siri-center-prompt" onClick={onDeactivate}>
          <span>Tutor IA Ativo</span>
          <p>Ouvindo sua dúvida clínica e anatômica…</p>
        </div>
      )}
    </div>,
    document.body
  );
}
