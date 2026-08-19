import React, { useEffect, useId, useRef, useState } from "react";
import "./AtlasAIOrb.css";

const STATE_INDEX = {
  idle: 0,
  focus: 1,
  active: 1,
  listening: 2,
  thinking: 3,
  speaking: 4,
  success: 5,
  offline: 6,
  error: 7
};

const STATE_INTENSITY = {
  idle: 0.85,
  focus: 0.95,
  active: 0.95,
  listening: 1.0,
  thinking: 1.0,
  speaking: 1.0,
  success: 0.9,
  offline: 0.65,
  error: 0.8
};

const VERTEX_SHADER = `
  attribute vec2 a_position;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_state;
  uniform float u_intensity;

  const float PI = 3.141592653589793;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    float shortestSide = min(u_resolution.x, u_resolution.y);
    vec2 p = (gl_FragCoord.xy - u_resolution * 0.5) / (shortestSide * 0.5);
    float radius = length(p);
    float edgeSoftness = max(0.006, 2.0 / shortestSide);
    float sphereMask = 1.0 - smoothstep(0.985 - edgeSoftness, 1.0, radius);

    if (sphereMask <= 0.001) {
      gl_FragColor = vec4(0.0);
      return;
    }

    float z = sqrt(max(0.0, 1.0 - radius * radius));
    float fresnel = pow(1.0 - z, 2.8);
    float energyLevel = clamp(u_intensity, 0.0, 1.0);

    // Speed and state reactivity
    float speed = 1.15;
    if (u_state > 0.5 && u_state < 1.5) speed = 1.45;
    if (u_state > 1.5 && u_state < 2.5) speed = 1.85;
    if (u_state > 2.5 && u_state < 3.5) speed = 2.25;
    if (u_state > 3.5 && u_state < 4.5) speed = 2.05;

    float t = u_time * speed;

    // 1. Siddhant Mehta Official Orb Vertical Multi-Gradient
    // Bottom: Mint/Cyan -> Middle: Azure/Purple -> Top: Coral/Pink
    vec3 cMint   = vec3(0.18, 0.96, 0.72); // #2ef0b8
    vec3 cCyan   = vec3(0.00, 0.82, 1.00); // #00d2ff
    vec3 cBlue   = vec3(0.00, 0.48, 1.00); // #007aff
    vec3 cPurple = vec3(0.58, 0.28, 0.98); // #9446fa
    vec3 cPink   = vec3(1.00, 0.25, 0.55); // #ff408d

    // Vertical gradient coordinates with gentle fluid distortion
    float yGrad = (p.y + 1.0) * 0.5;
    float fluidDistort = 0.08 * sin(p.x * 3.4 + t * 1.2) + 0.04 * cos(p.y * 4.2 - t * 0.9);
    yGrad = clamp(yGrad + fluidDistort, 0.0, 1.0);

    vec3 baseColor;
    if (yGrad < 0.25) {
      baseColor = mix(cMint, cCyan, yGrad / 0.25);
    } else if (yGrad < 0.5) {
      baseColor = mix(cCyan, cBlue, (yGrad - 0.25) / 0.25);
    } else if (yGrad < 0.75) {
      baseColor = mix(cBlue, cPurple, (yGrad - 0.5) / 0.25);
    } else {
      baseColor = mix(cPurple, cPink, (yGrad - 0.75) / 0.25);
    }

    // 2. Wavy Blob Views & Rotating Core Glows (from WavyBlobView & RotatingGlowView)
    float angle = atan(p.y, p.x);
    float blob1 = sin(angle * 3.0 + t * 1.75 + length(p) * 2.5);
    float blob2 = cos(angle * 4.0 - t * 1.35 + length(p) * 3.2);
    float internalBlob = smoothstep(-0.2, 0.8, blob1 * 0.6 + blob2 * 0.5);

    vec3 blobGlow = mix(baseColor, vec3(1.0), 0.55) * internalBlob * (0.45 + 0.4 * energyLevel);

    // 3. Floating Sparkle Particles (from ParticlesView)
    float particles = 0.0;
    for (int i = 0; i < 8; i++) {
      float fi = float(i);
      vec2 partPos = vec2(
        sin(fi * 1.73 + t * 0.38 + hash(vec2(fi, 1.0)) * 6.28) * 0.62,
        cos(fi * 2.41 + t * 0.44 + hash(vec2(fi, 2.0)) * 6.28) * 0.62
      );
      float d = length(p - partPos);
      float twinkle = 0.5 + 0.5 * sin(t * 3.2 + fi * 2.1);
      particles += exp(-d * 42.0) * twinkle * (0.7 + 0.3 * energyLevel);
      // Diamond flare spike
      float spike = exp(-abs(p.x - partPos.x) * 60.0) * exp(-abs(p.y - partPos.y) * 12.0) +
                    exp(-abs(p.y - partPos.y) * 60.0) * exp(-abs(p.x - partPos.x) * 12.0);
      particles += spike * twinkle * 0.45;
    }

    // 4. Glossy Specular Glass Reflection (Upper Crescent Highlight)
    vec2 specPos = p - vec2(-0.28, 0.28);
    float specDist = length(vec2(specPos.x * 1.35, specPos.y * 0.95));
    float glassGloss = smoothstep(0.48, 0.04, specDist) * smoothstep(0.96, 0.35, length(p));
    vec3 glossHighlight = vec3(1.0, 1.0, 1.0) * glassGloss * 0.92;

    // Secondary subtle lower rim reflection
    vec2 subSpecPos = p - vec2(0.35, -0.42);
    float subSpecDist = length(vec2(subSpecPos.x * 1.2, subSpecPos.y * 1.5));
    float subGloss = smoothstep(0.32, 0.05, subSpecDist);
    vec3 subHighlight = mix(cMint, vec3(1.0), 0.7) * subGloss * 0.35;

    // Outer Rim Fresnel Lighting
    float rimLight = pow(fresnel, 2.2) * (0.55 + 0.35 * energyLevel);
    vec3 rimColor = mix(vec3(1.0), baseColor, 0.3) * rimLight;

    // Composition
    vec3 finalColor = baseColor + blobGlow + vec3(particles) + glossHighlight + subHighlight + rimColor;
    finalColor = clamp(finalColor, 0.0, 1.0);

    float alpha = sphereMask;
    gl_FragColor = vec4(finalColor * alpha, alpha);
  }
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(error || "Falha ao compilar o material do Atlas AI.");
  }

  return shader;
}

function createProgram(gl) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(error || "Falha ao preparar o material do Atlas AI.");
  }

  return program;
}

function clampVal(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export default function AtlasAIOrb({
  onClick,
  state = "idle",
  size = "md",
  intensity,
  className = ""
}) {
  const canvasRef = useRef(null);
  const reactId = useId();
  const refractionFilterId = `atlas-ai-orb-refraction-${reactId.replace(/:/g, "")}`;
  const visualStateRef = useRef({
    state: STATE_INDEX.idle,
    intensity: STATE_INTENSITY.idle
  });
  const requestDrawRef = useRef(() => {});
  const [renderer, setRenderer] = useState("pending");
  const normalizedState = Object.prototype.hasOwnProperty.call(STATE_INDEX, state)
    ? state
    : "idle";
  const normalizedIntensity = clampVal(
    Number.isFinite(intensity) ? intensity : STATE_INTENSITY[normalizedState],
    0,
    1
  );

  useEffect(() => {
    visualStateRef.current = {
      state: STATE_INDEX[normalizedState] ?? STATE_INDEX.idle,
      intensity: normalizedIntensity
    };
    requestDrawRef.current();
  }, [normalizedIntensity, normalizedState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let gl;
    let program;
    let positionBuffer;
    let animationFrame = 0;
    let disposed = false;

    const handleContextLost = (event) => {
      event.preventDefault();
      setRenderer("fallback");
    };

    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false
      });

      if (!gl) {
        setRenderer("fallback");
        return undefined;
      }

      canvas.addEventListener("webglcontextlost", handleContextLost, false);
      program = createProgram(gl);
      positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -1, -1,
           1, -1,
          -1,  1,
          -1,  1,
           1, -1,
           1,  1
        ]),
        gl.STATIC_DRAW
      );
    } catch (error) {
      console.error(error);
      setRenderer("fallback");
      return undefined;
    }

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const stateLocation = gl.getUniformLocation(program, "u_state");
    const intensityLocation = gl.getUniformLocation(program, "u_intensity");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = reducedMotionQuery.matches;
    let isIntersecting = true;

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const resizeCanvas = () => {
      if (disposed || !canvas) return;
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(bounds.width * pixelRatio));
      const height = Math.max(1, Math.round(bounds.height * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    };

    resizeCanvas();

    const draw = (timestamp = 0) => {
      animationFrame = 0;
      if (disposed) return;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, reducedMotion ? 2.1 : timestamp * 0.001);
      gl.uniform1f(stateLocation, visualStateRef.current.state);
      gl.uniform1f(intensityLocation, visualStateRef.current.intensity);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!reducedMotion && isIntersecting && !document.hidden) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const requestDraw = () => {
      if (!animationFrame && !disposed) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };
    requestDrawRef.current = requestDraw;

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      requestDraw();
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isIntersecting = entry?.isIntersecting ?? true;
      if (isIntersecting) requestDraw();
    }, { rootMargin: "80px" });
    intersectionObserver.observe(canvas);

    const handleVisibilityChange = () => {
      if (!document.hidden) requestDraw();
    };
    const handleReducedMotionChange = (event) => {
      reducedMotion = event.matches;
      requestDraw();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    reducedMotionQuery.addEventListener?.("change", handleReducedMotionChange);
    setRenderer("webgl");
    requestDraw();

    return () => {
      disposed = true;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reducedMotionQuery.removeEventListener?.("change", handleReducedMotionChange);
      requestDrawRef.current = () => {};
      try {
        gl.deleteBuffer(positionBuffer);
        gl.deleteProgram(program);
      } catch {
        // Teardown
      }
    };
  }, [size]);

  return (
    <span
      className={[
        "aeternum-ai-orb-root",
        `state-${normalizedState}`,
        `size-${size}`,
        className
      ].filter(Boolean).join(" ")}
      data-renderer={renderer}
      data-state={normalizedState}
      onClick={onClick}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="atlas-ai-orb__canvas" />
      <span className="atlas-ai-orb__lens" />
      <span className="atlas-ai-orb__rim" />
    </span>
  );
}
