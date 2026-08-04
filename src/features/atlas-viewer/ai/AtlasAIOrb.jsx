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
  idle: 0.72,
  focus: 0.86,
  active: 0.86,
  listening: 0.98,
  thinking: 1,
  speaking: 0.96,
  success: 0.9,
  offline: 0.72,
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

  vec3 hsv2rgb(vec3 c) {
    vec3 rgb = clamp(
      abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0,
      0.0,
      1.0
    );
    rgb = rgb * rgb * (3.0 - 2.0 * rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
  }

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float softOrb(vec2 p, vec2 center, float density) {
    vec2 delta = p - center;
    return exp(-dot(delta, delta) * density);
  }

  void main() {
    float shortestSide = min(u_resolution.x, u_resolution.y);
    vec2 p = (gl_FragCoord.xy - u_resolution * 0.5) / (shortestSide * 0.5);
    float radius = length(p);
    float edgeSoftness = max(0.007, 2.0 / shortestSide);
    float sphereMask = 1.0 - smoothstep(0.982 - edgeSoftness, 1.0, radius);

    if (sphereMask <= 0.001) {
      gl_FragColor = vec4(0.0);
      return;
    }

    float z = sqrt(max(0.0, 1.0 - radius * radius));
    float fresnel = pow(1.0 - z, 2.55);
    float energyLevel = clamp(u_intensity, 0.0, 1.0);

    float speed = 1.52;
    if (u_state > 0.5 && u_state < 1.5) speed = 1.78;
    if (u_state > 1.5 && u_state < 2.5) speed = 2.12;
    if (u_state > 2.5 && u_state < 3.5) speed = 2.55;
    if (u_state > 3.5 && u_state < 4.5) speed = 2.32;
    if (u_state > 4.5 && u_state < 5.5) speed = 1.86;
    if (u_state > 5.5 && u_state < 6.5) speed = 1.28;
    if (u_state > 6.5) speed = 1.62;

    float phase = u_time * speed;
    float slowPhase = u_time * 0.47;
    float phaseA = phase * 1.18 + 0.32 * sin(slowPhase * 1.1);
    float phaseB = phase * 1.63 + 0.38 * sin(slowPhase * 0.73 + 1.7);
    float phaseC = phase * 1.05 + 0.29 * sin(slowPhase * 1.34 + 3.0);
    float phaseD = phase * 1.92 + 0.35 * sin(slowPhase * 0.91 + 4.2);
    float breath = 0.82 + 0.18 * sin(phase * 0.88);
    float voicePulse = 1.0;
    if (u_state > 1.5 && u_state < 2.5) {
      voicePulse = 0.86 + 0.14 * sin(phase * 5.4);
    }
    if (u_state > 3.5 && u_state < 4.5) {
      voicePulse = 0.82 + 0.18 * sin(phase * 6.8);
    }

    float flowX =
      p.x +
      0.065 * sin(p.y * 3.2 + phaseC * 0.74) +
      0.026 * sin(p.y * 7.1 - phaseD * 0.48);
    float flowY =
      p.y +
      0.018 * sin(p.x * 5.4 - phaseB * 0.68) +
      0.012 * cos(p.x * 9.2 + phaseA * 0.42);

    float primaryWave =
      0.016 * sin(slowPhase * 1.7) +
      0.118 * sin(flowX * 2.45 + phaseA * 1.06) +
      0.019 * sin(flowX * 6.2 - phaseC * 0.62);
    float secondaryWave =
      -0.096 +
      0.112 * sin(flowX * 2.08 - phaseB * 0.92 + 1.48) +
      0.016 * sin(flowX * 5.8 + phaseD * 0.4) +
      0.018 * flowX * sin(slowPhase * 1.4);
    float tertiaryWave =
      0.098 +
      0.106 * sin(flowX * 2.72 + phaseC * 0.98 + 2.18) +
      0.015 * cos(flowX * 6.7 - phaseA * 0.5) -
      0.017 * flowX * cos(slowPhase * 1.1);
    float fourthWave =
      -0.018 +
      0.09 * sin(flowX * 3.18 - phaseD * 0.86 + 4.05) +
      0.014 * cos(flowX * 7.2 + phaseB * 0.48) +
      0.015 * sin(slowPhase * 2.2);

    float primaryDistance = abs(flowY - primaryWave);
    float secondaryDistance = abs(flowY - secondaryWave);
    float tertiaryDistance = abs(flowY - tertiaryWave);
    float fourthDistance = abs(flowY - fourthWave);
    float coreWidth = mix(0.023, 0.04, energyLevel) * voicePulse;
    float primaryCore = exp(-pow(primaryDistance / coreWidth, 2.0));
    float secondaryCore = exp(-pow(secondaryDistance / (coreWidth * 0.92), 2.0));
    float tertiaryCore = exp(-pow(tertiaryDistance / (coreWidth * 0.78), 2.0));
    float fourthCore = exp(-pow(fourthDistance / (coreWidth * 0.7), 2.0));
    float primaryGlow = exp(-pow(primaryDistance / mix(0.16, 0.245, energyLevel), 2.0));
    float secondaryGlow = exp(-pow(secondaryDistance / mix(0.145, 0.22, energyLevel), 2.0));
    float tertiaryGlow = exp(-pow(tertiaryDistance / mix(0.125, 0.195, energyLevel), 2.0));
    float fourthGlow = exp(-pow(fourthDistance / mix(0.11, 0.17, energyLevel), 2.0));

    float primaryHue = fract(0.01 + flowX * 0.035 + phaseA * 0.014);
    float secondaryHue = fract(0.09 - flowX * 0.025 - phaseB * 0.009);
    float tertiaryHue = fract(0.49 + flowX * 0.032 + phaseC * 0.012);
    float fourthHue = fract(0.64 - flowX * 0.028 + phaseD * 0.007);
    vec3 spectrum = hsv2rgb(vec3(primaryHue, 0.93, 1.0));
    vec3 secondSpectrum = hsv2rgb(vec3(secondaryHue, 0.91, 1.0));
    vec3 thirdSpectrum = hsv2rgb(vec3(tertiaryHue, 0.88, 1.0));
    vec3 fourthSpectrum = hsv2rgb(vec3(fourthHue, 0.9, 1.0));
    vec3 hotWhite = vec3(1.0, 0.985, 0.93);

    float travelA = 0.64 + 0.36 * sin(flowX * 8.7 - phaseA * 4.4);
    float travelB = 0.62 + 0.38 * sin(flowX * 7.2 + phaseB * 3.8 + 1.7);
    float travelC = 0.68 + 0.32 * sin(flowX * 10.4 - phaseC * 5.1 + 3.1);
    float travelD = 0.64 + 0.36 * sin(flowX * 12.1 + phaseD * 4.7 + 4.4);

    vec2 driftA = vec2(
      -0.32 + 0.19 * sin(phaseA * 0.76),
      -0.02 + 0.16 * cos(phaseC * 0.62)
    );
    vec2 driftB = vec2(
      0.33 + 0.17 * cos(phaseB * 0.58),
      0.03 + 0.15 * sin(phaseD * 0.71)
    );
    vec2 driftC = vec2(
      0.02 + 0.22 * sin(phaseC * 0.41 + 2.0),
      -0.2 + 0.12 * cos(phaseA * 0.53)
    );
    float auroraA = softOrb(p, driftA, 5.8);
    float auroraB = softOrb(p, driftB, 6.4);
    float auroraC = softOrb(p, driftC, 7.2);
    vec3 internalAurora =
       hsv2rgb(vec3(fract(primaryHue + 0.08), 0.92, 1.0)) * auroraA +
       hsv2rgb(vec3(fract(primaryHue + 0.45), 0.88, 1.0)) * auroraB +
       hsv2rgb(vec3(fract(primaryHue + 0.78), 0.84, 0.92)) * auroraC;
    internalAurora *= (0.1 + 0.165 * energyLevel) * breath;

    float lowerGlass = 1.0 - smoothstep(-0.9, 0.26, p.y);
    float upperGlass = smoothstep(-0.18, 0.92, p.y);
    vec3 upperTint = vec3(0.052, 0.068, 0.079);
    vec3 lowerTint = vec3(0.09, 0.102, 0.11);
    vec3 base = mix(upperTint, lowerTint, lowerGlass * 0.48);
    base *= mix(1.0, 0.88, upperGlass);
    base += vec3(0.052, 0.08, 0.1) * (1.0 - z);

    vec2 surfaceNormal = p / max(radius, 0.001);
    vec2 keyLight = normalize(vec2(-0.72, 0.69));
    vec2 anisotropicNormal = normalize(vec2(surfaceNormal.x * 0.82, surfaceNormal.y));
    float keyCatch = max(dot(anisotropicNormal, keyLight), 0.0);
    float kickCatch = max(dot(anisotropicNormal, -keyLight), 0.0);
    float key2 = keyCatch * keyCatch;
    float key4 = key2 * key2;
    float key8 = key4 * key4;
    float keySpecular = key8 * key8;
    float kick2 = kickCatch * kickCatch;
    float kick4 = kick2 * kick2;
    float kickSpecular = kick4 * kick4;
    float edgeFactor = smoothstep(0.56, 0.985, radius);
    float specularStrength = 1.45 + 0.35 * energyLevel;
    base += vec3(0.96, 0.99, 1.0) * keySpecular * edgeFactor * specularStrength;
    base += vec3(0.7, 0.88, 1.0) * kickSpecular * edgeFactor * 0.48;

    vec2 surfaceTangent = vec2(-surfaceNormal.y, surfaceNormal.x);
    float dispersionAxis = dot(surfaceTangent, keyLight);
    float dispersionEdge = pow(max(fresnel, 0.0), 0.72) * edgeFactor;
    vec3 dispersionColor = vec3(
      max(dispersionAxis, 0.0),
      0.12 * (1.0 - abs(dispersionAxis)),
      max(-dispersionAxis, 0.0)
    );
    base += dispersionColor * dispersionEdge * (0.16 + 0.08 * energyLevel);

    vec2 topHighlightPosition = p - vec2(-0.34, 0.55);
    float topHighlight = exp(-dot(topHighlightPosition, topHighlightPosition) * 29.0);
    float lowerReflection = exp(
      -pow((p.y + 0.5 + 0.055 * sin(p.x * 3.2 + phase * 0.36)) / 0.25, 2.0)
    );
    base += vec3(0.8, 0.9, 0.96) * topHighlight * 0.16;
    base += vec3(0.42, 0.34, 0.28) * lowerReflection * (0.028 + fresnel * 0.052);

    float interiorFade = smoothstep(1.0, 0.7, radius);
    vec3 energy =
      spectrum * primaryGlow * travelA * (0.92 + 1.52 * energyLevel) +
      secondSpectrum * secondaryGlow * travelB * (0.7 + 1.18 * energyLevel) +
      thirdSpectrum * tertiaryGlow * travelC * (0.5 + 0.92 * energyLevel) +
      fourthSpectrum * fourthGlow * travelD * (0.38 + 0.76 * energyLevel);
    energy += mix(spectrum, hotWhite, 0.44) * primaryCore * travelA * (2.2 + 1.8 * energyLevel);
    energy += mix(secondSpectrum, hotWhite, 0.36) * secondaryCore * travelB * (1.45 + 1.36 * energyLevel);
    energy += mix(thirdSpectrum, hotWhite, 0.3) * tertiaryCore * travelC * (0.96 + 1.02 * energyLevel);
    energy += mix(fourthSpectrum, hotWhite, 0.26) * fourthCore * travelD * (0.72 + 0.86 * energyLevel);

    float crossAB = sqrt(primaryCore * secondaryCore);
    float crossAC = sqrt(primaryCore * tertiaryCore);
    float crossAD = sqrt(primaryCore * fourthCore);
    float crossBC = sqrt(secondaryCore * tertiaryCore);
    float crossBD = sqrt(secondaryCore * fourthCore);
    float crossCD = sqrt(tertiaryCore * fourthCore);
    float strongestCross = max(
      max(max(crossAB, crossAC), max(crossAD, crossBC)),
      max(crossBD, crossCD)
    );
    float intersectionCore = smoothstep(0.26, 0.82, strongestCross);
    float haloAB = primaryGlow * secondaryGlow;
    float haloAC = primaryGlow * tertiaryGlow;
    float haloAD = primaryGlow * fourthGlow;
    float haloBC = secondaryGlow * tertiaryGlow;
    float haloBD = secondaryGlow * fourthGlow;
    float haloCD = tertiaryGlow * fourthGlow;
    float intersectionHalo = max(
      max(max(haloAB, haloAC), max(haloAD, haloBC)),
      max(haloBD, haloCD)
    );
    float crossWeight = crossAB + crossAC + crossAD + crossBC + crossBD + crossCD;
    float crossingPulse =
      0.68 +
      0.32 * sin(flowX * 11.5 - phaseB * 2.3 + phaseD * 0.74);
    vec3 interactionSpectrum = (
      mix(spectrum, secondSpectrum, 0.5) * crossAB +
      mix(spectrum, thirdSpectrum, 0.5) * crossAC +
      mix(spectrum, fourthSpectrum, 0.5) * crossAD +
      mix(secondSpectrum, thirdSpectrum, 0.5) * crossBC +
      mix(secondSpectrum, fourthSpectrum, 0.5) * crossBD +
      mix(thirdSpectrum, fourthSpectrum, 0.5) * crossCD
    ) / max(crossWeight, 0.001);
    energy +=
      interactionSpectrum *
      intersectionHalo *
      crossingPulse *
      (0.78 + 1.28 * energyLevel);
    energy +=
      hotWhite *
      intersectionCore *
      crossingPulse *
      (1.55 + 2.65 * energyLevel) *
      breath;
    energy = energy * interiorFade + internalAurora * interiorFade;

    if (u_state > 4.5 && u_state < 5.5) {
      energy += vec3(1.0, 0.79, 0.32) * primaryGlow * 0.22;
    }
    if (u_state > 5.5 && u_state < 6.5) {
      energy = mix(energy, energy + vec3(1.0, 0.62, 0.2) * primaryCore, 0.12);
    }
    if (u_state > 6.5) {
      energy = mix(energy, energy + vec3(1.0, 0.16, 0.28) * primaryGlow, 0.28);
    }

    float rimHue = fract(0.58 + atan(p.y, p.x) / (2.0 * PI) + phase * 0.04);
    vec3 rimSpectrum = hsv2rgb(vec3(rimHue, 0.62, 1.0));
    vec3 rim = mix(vec3(0.86, 0.94, 0.98), rimSpectrum, 0.3);
    base += rim * fresnel * (0.22 + 0.3 * energyLevel);
    base += vec3(0.98, 0.995, 1.0) * pow(fresnel, 5.0) * 0.28;

    float grain = hash21(gl_FragCoord.xy + floor(u_time * 10.0));
    vec3 color = base + energy;
    color += (grain - 0.5) * 0.008;
    color = 1.0 - exp(-color * 1.18);
    color = pow(max(color, 0.0), vec3(0.9));

    float strongestGlow = max(max(primaryGlow, secondaryGlow), max(tertiaryGlow, fourthGlow));
    float strongestCore = max(max(primaryCore, secondaryCore), max(tertiaryCore, fourthCore));
    float energyOpacity = clamp(
      strongestGlow * 0.18 +
      strongestCore * 0.25 +
      intersectionCore * 0.2,
      0.0,
      0.34
    );
    float glassOpacity = mix(0.16, 0.5, fresnel) + energyOpacity;
    glassOpacity = clamp(glassOpacity, 0.0, 0.8) * sphereMask;
    gl_FragColor = vec4(color * glassOpacity, glassOpacity);
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

function clamp(value, minimum, maximum) {
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
  const normalizedIntensity = clamp(
    Number.isFinite(intensity) ? intensity : STATE_INTENSITY[normalizedState],
    0,
    1
  );

  useEffect(() => {
    visualStateRef.current = {
      state: STATE_INDEX[normalizedState],
      intensity: normalizedIntensity
    };
    requestDrawRef.current();
  }, [normalizedIntensity, normalizedState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      depth: false,
      premultipliedAlpha: true,
      powerPreference: "high-performance"
    });

    if (!gl) {
      setRenderer("fallback");
      return undefined;
    }

    let program;
    try {
      program = createProgram(gl);
    } catch (error) {
      console.warn("[Atlas AI Orb] WebGL indisponível; usando fallback.", error);
      setRenderer("fallback");
      return undefined;
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const stateLocation = gl.getUniformLocation(program, "u_state");
    const intensityLocation = gl.getUniformLocation(program, "u_intensity");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = reducedMotionQuery.matches;
    let isIntersecting = true;
    let animationFrame = 0;
    let disposed = false;

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const resizeCanvas = () => {
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

    const draw = (timestamp = 0) => {
      animationFrame = 0;
      if (disposed) return;
      resizeCanvas();
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

    const resizeObserver = new ResizeObserver(requestDraw);
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
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      reducedMotionQuery.removeEventListener?.("change", handleReducedMotionChange);
      requestDrawRef.current = () => {};
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
    };
  }, []);

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
      style={{
        "--atlas-orb-refraction-filter": `url(#${refractionFilterId})`
      }}
      onClick={onClick}
      aria-hidden="true"
    >
      <svg
        className="atlas-ai-orb__filter-defs"
        aria-hidden="true"
        focusable="false"
      >
        <filter
          id={refractionFilterId}
          x="-35%"
          y="-35%"
          width="170%"
          height="170%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.019"
            numOctaves="2"
            seed="11"
            result="refractionNoise"
          >
            <animate
              attributeName="baseFrequency"
              dur="5.6s"
              values="0.012 0.019;0.019 0.011;0.012 0.019"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feGaussianBlur
            in="refractionNoise"
            stdDeviation="0.42"
            result="softRefractionNoise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softRefractionNoise"
            scale="16"
            xChannelSelector="R"
            yChannelSelector="B"
          />
        </filter>
      </svg>
      <span className="atlas-ai-orb__refraction" />
      <span className="atlas-ai-orb__fallback" />
      <canvas ref={canvasRef} className="atlas-ai-orb__canvas" />
      <span className="atlas-ai-orb__lens" />
      <span className="atlas-ai-orb__rim" />
    </span>
  );
}
