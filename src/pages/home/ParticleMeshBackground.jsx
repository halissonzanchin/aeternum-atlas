import { useEffect, useRef } from "react";
import "./ParticleMeshBackground.css";

const RETURN_EASE = 0.145;
const FRICTION = 0.925;
const DESKTOP_PARTICLE_CAP = 11500;
const COMPACT_PARTICLE_CAP = 6500;

function seededUnit(column, row, salt = 0) {
  const value = Math.sin(column * 91.17 + row * 47.23 + salt * 13.91) * 43758.5453;
  return value - Math.floor(value);
}

function createParticle(x, y, column, row) {
  const sizeSeed = seededUnit(column, row, 1);
  const toneSeed = seededUnit(column, row, 2);
  const depth = seededUnit(column, row, 3);
  const isHighlight = toneSeed > 0.972;

  return {
    originX: x,
    originY: y,
    x,
    y,
    vx: 0,
    vy: 0,
    size: isHighlight ? 1.9 + sizeSeed * 1.25 : 0.58 + sizeSeed * 1.35,
    tone: toneSeed,
    depth,
    proximity: 0
  };
}

export default function ParticleMeshBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true
    });
    if (!context) return undefined;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const pointer = {
      x: -10000,
      y: -10000,
      active: false,
      radius: 82
    };

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let frameId = 0;
    let rendering = false;
    let isVisible = true;
    let previousTime = performance.now();

    const getGap = () => {
      if (width <= 480) return 16;
      if (width <= 820) return 15.5;
      if (width <= 1280) return 15;
      return 14;
    };

    const getPointerRadius = () => {
      if (coarsePointerQuery.matches) return Math.max(54, Math.min(74, width * 0.14));
      return Math.max(76, Math.min(105, width * 0.055));
    };

    const buildField = () => {
      const preferredGap = getGap();
      const particleCap = width <= 820 ? COMPACT_PARTICLE_CAP : DESKTOP_PARTICLE_CAP;
      const adaptiveGap = Math.sqrt((width * height) / particleCap);
      const gap = Math.max(preferredGap, adaptiveGap);
      const columns = Math.ceil(width / gap) + 2;
      const rows = Math.ceil(height / gap) + 2;
      const offsetX = (width - (columns - 1) * gap) / 2;
      const offsetY = (height - (rows - 1) * gap) / 2;
      const nextParticles = [];

      for (let column = 0; column < columns; column += 1) {
        for (let row = 0; row < rows; row += 1) {
          nextParticles.push(
            createParticle(
              offsetX + column * gap,
              offsetY + row * gap,
              column,
              row
            )
          );
        }
      }

      particles = nextParticles;
      pointer.radius = getPointerRadius();
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = false;
      buildField();
    };

    const setPointer = (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active =
        pointer.x >= 0 &&
        pointer.x <= bounds.width &&
        pointer.y >= 0 &&
        pointer.y <= bounds.height;
    };

    const clearPointer = () => {
      pointer.active = false;
      pointer.x = -10000;
      pointer.y = -10000;
    };

    const drawPointerHalo = () => {
      if (!pointer.active || reducedMotionQuery.matches) return;

      const haloRadius = pointer.radius * 1.18;
      const halo = context.createRadialGradient(
        pointer.x,
        pointer.y,
        pointer.radius * 0.08,
        pointer.x,
        pointer.y,
        haloRadius
      );
      halo.addColorStop(0, "rgba(92, 232, 222, 0.07)");
      halo.addColorStop(0.32, "rgba(60, 196, 188, 0.032)");
      halo.addColorStop(1, "rgba(26, 119, 116, 0)");
      context.fillStyle = halo;
      context.fillRect(
        pointer.x - haloRadius,
        pointer.y - haloRadius,
        haloRadius * 2,
        haloRadius * 2
      );
    };

    const drawParticle = (particle) => {
      const boost = particle.proximity * 0.18;
      let fill;

      if (particle.tone > 0.972) {
        fill = `rgba(232, 204, 128, ${Math.min(1, 0.86 + boost)})`;
      } else if (particle.tone > 0.82) {
        fill = `rgba(210, 255, 251, ${Math.min(1, 0.78 + boost)})`;
      } else {
        const baseAlpha = 0.48 + particle.depth * 0.24;
        fill = `rgba(125, 229, 223, ${Math.min(0.96, baseAlpha + boost)})`;
      }

      const renderSize = particle.size + particle.proximity * 0.65;
      context.fillStyle = fill;
      context.fillRect(
        Math.round(particle.x - renderSize / 2),
        Math.round(particle.y - renderSize / 2),
        renderSize,
        renderSize
      );
    };

    const updateParticle = (particle, delta) => {
      particle.proximity = 0;

      if (pointer.active && !reducedMotionQuery.matches) {
        const dx = pointer.x - particle.x;
        const dy = pointer.y - particle.y;
        const distanceSquared = dx * dx + dy * dy;
        const radiusSquared = pointer.radius * pointer.radius;

        if (distanceSquared > 0.01 && distanceSquared < radiusSquared) {
          const distance = Math.sqrt(distanceSquared);
          const proximity = 1 - distance / pointer.radius;
          const force = proximity * proximity * 18 * delta;
          particle.proximity = proximity;
          particle.vx -= (dx / distance) * force;
          particle.vy -= (dy / distance) * force;
        }
      }

      particle.vx *= Math.pow(FRICTION, delta);
      particle.vy *= Math.pow(FRICTION, delta);
      particle.x += particle.vx + (particle.originX - particle.x) * RETURN_EASE * delta;
      particle.y += particle.vy + (particle.originY - particle.y) * RETURN_EASE * delta;
    };

    const render = (time) => {
      if (!isVisible || document.hidden) {
        rendering = false;
        frameId = 0;
        return;
      }

      const delta = Math.min(1.8, Math.max(0.55, (time - previousTime) / 16.67));
      previousTime = time;
      context.clearRect(0, 0, width, height);
      drawPointerHalo();

      for (const particle of particles) {
        updateParticle(particle, delta);
        drawParticle(particle);
      }

      if (reducedMotionQuery.matches) {
        rendering = false;
        frameId = 0;
        return;
      }

      frameId = window.requestAnimationFrame(render);
    };

    const stopRendering = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0;
      rendering = false;
    };

    const startRendering = () => {
      if (rendering || !isVisible || document.hidden) return;
      rendering = true;
      previousTime = performance.now();
      frameId = window.requestAnimationFrame(render);
    };

    const syncDocumentVisibility = () => {
      if (document.hidden) stopRendering();
      else startRendering();
    };

    const syncPreference = () => {
      stopRendering();
      resize();
      startRendering();
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      startRendering();
    });
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) startRendering();
        else stopRendering();
      },
      { rootMargin: "120px 0px", threshold: 0.01 }
    );

    resizeObserver.observe(canvas);
    visibilityObserver.observe(canvas);
    window.addEventListener("pointermove", setPointer, { passive: true });
    window.addEventListener("pointerdown", setPointer, { passive: true });
    window.addEventListener("pointerup", clearPointer, { passive: true });
    window.addEventListener("blur", clearPointer);
    document.addEventListener("visibilitychange", syncDocumentVisibility);
    document.documentElement.addEventListener("pointerleave", clearPointer);
    reducedMotionQuery.addEventListener("change", syncPreference);
    coarsePointerQuery.addEventListener("change", syncPreference);

    resize();
    startRendering();

    return () => {
      stopRendering();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener("pointermove", setPointer);
      window.removeEventListener("pointerdown", setPointer);
      window.removeEventListener("pointerup", clearPointer);
      window.removeEventListener("blur", clearPointer);
      document.removeEventListener("visibilitychange", syncDocumentVisibility);
      document.documentElement.removeEventListener("pointerleave", clearPointer);
      reducedMotionQuery.removeEventListener("change", syncPreference);
      coarsePointerQuery.removeEventListener("change", syncPreference);
    };
  }, []);

  return (
    <div className="particle-mesh-shell" aria-hidden="true">
      <canvas ref={canvasRef} className="particle-mesh-canvas" />
      <div className="particle-mesh-vignette" />
      <div className="particle-mesh-scan" />
    </div>
  );
}
