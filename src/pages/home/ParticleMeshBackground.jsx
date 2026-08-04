import { useEffect, useRef } from "react";
import "./ParticleMeshBackground.css";

const RETURN_EASE = 0.145;
const FRICTION = 0.925;
const DESKTOP_PARTICLE_CAP = 12000;
const COMPACT_PARTICLE_CAP = 5200;
const COMET_CYCLE = 19000;

function seededUnit(column, row, salt = 0) {
  const value = Math.sin(column * 91.17 + row * 47.23 + salt * 13.91) * 43758.5453;
  return value - Math.floor(value);
}

function createParticle(x, y, column, row, gap) {
  const sizeSeed = seededUnit(column, row, 1);
  const toneSeed = seededUnit(column, row, 2);
  const depth = seededUnit(column, row, 3);
  const twinkleSeed = seededUnit(column, row, 4);
  const jitterX = (seededUnit(column, row, 5) - 0.5) * gap * 0.62;
  const jitterY = (seededUnit(column, row, 6) - 0.5) * gap * 0.62;
  const type = toneSeed > 0.992 ? "beacon" : toneSeed > 0.944 ? "star" : "mesh";
  const particleX = x + jitterX;
  const particleY = y + jitterY;

  return {
    originX: particleX,
    originY: particleY,
    x: particleX,
    y: particleY,
    vx: 0,
    vy: 0,
    size:
      type === "beacon"
        ? 3.1 + sizeSeed * 1.75
        : type === "star"
          ? 1.7 + sizeSeed * 1.85
          : 0.76 + sizeSeed * 1.24,
    tone: toneSeed,
    depth,
    type,
    twinkle: 0,
    twinklePhase: twinkleSeed * Math.PI * 2,
    twinkleSpeed: 0.00048 + seededUnit(column, row, 7) * 0.00105,
    driftPhase: seededUnit(column, row, 8) * Math.PI * 2,
    driftSpeed: 0.00012 + seededUnit(column, row, 9) * 0.00022,
    driftAmplitude: type === "mesh" ? 0 : 0.55 + depth * 1.35,
    linkRight: seededUnit(column, row, 10) > 0.86,
    linkDown: seededUnit(column, row, 11) > 0.9,
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
    let rows = 0;
    let frameId = 0;
    let rendering = false;
    let isVisible = true;
    let previousTime = performance.now();

    const getGap = () => {
      if (width <= 480) return 15;
      if (width <= 820) return 14.5;
      if (width <= 1280) return 13.5;
      return 12.8;
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
      rows = Math.ceil(height / gap) + 2;
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
              row,
              gap
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
      context.imageSmoothingEnabled = true;
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

    const drawConnections = () => {
      if (!particles.length || !rows) return;

      context.save();
      context.lineWidth = 0.52;
      context.strokeStyle = "rgba(91, 211, 204, 0.072)";
      context.beginPath();

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        const right = particle.linkRight ? particles[index + rows] : null;
        const down = particle.linkDown && (index + 1) % rows !== 0 ? particles[index + 1] : null;

        if (right) {
          context.moveTo(particle.x, particle.y);
          context.lineTo(right.x, right.y);
        }

        if (down) {
          context.moveTo(particle.x, particle.y);
          context.lineTo(down.x, down.y);
        }
      }

      context.stroke();

      if (pointer.active && !reducedMotionQuery.matches) {
        context.lineWidth = 0.72;
        context.strokeStyle = "rgba(117, 238, 230, 0.2)";
        context.beginPath();

        for (let index = 0; index < particles.length; index += 1) {
          const particle = particles[index];
          if (particle.proximity < 0.34) continue;

          const right = particle.linkRight ? particles[index + rows] : null;
          const down = particle.linkDown && (index + 1) % rows !== 0 ? particles[index + 1] : null;

          if (right) {
            context.moveTo(particle.x, particle.y);
            context.lineTo(right.x, right.y);
          }

          if (down) {
            context.moveTo(particle.x, particle.y);
            context.lineTo(down.x, down.y);
          }
        }

        context.stroke();
      }

      context.restore();
    };

    const drawComet = (time) => {
      if (width <= 820 || reducedMotionQuery.matches) return;

      const cycleProgress = (time % COMET_CYCLE) / COMET_CYCLE;
      if (cycleProgress < 0.84) return;

      const progress = (cycleProgress - 0.84) / 0.16;
      const alpha = Math.sin(progress * Math.PI) * 0.38;
      const x = width * (0.2 + progress * 0.56);
      const y = height * (0.17 + progress * 0.16);
      const tailX = x - width * 0.075;
      const tailY = y + height * 0.045;
      const streak = context.createLinearGradient(tailX, tailY, x, y);

      streak.addColorStop(0, "rgba(103, 204, 226, 0)");
      streak.addColorStop(0.7, `rgba(127, 239, 235, ${alpha * 0.54})`);
      streak.addColorStop(1, `rgba(246, 228, 181, ${alpha})`);

      context.save();
      context.lineCap = "round";
      context.lineWidth = 1.1;
      context.strokeStyle = streak;
      context.shadowBlur = 8;
      context.shadowColor = `rgba(116, 232, 235, ${alpha * 0.7})`;
      context.beginPath();
      context.moveTo(tailX, tailY);
      context.lineTo(x, y);
      context.stroke();
      context.restore();
    };

    const drawParticle = (particle) => {
      const boost = particle.proximity * 0.18;
      const pulse = 0.48 + particle.twinkle * 0.52;
      let fill;

      if (particle.type === "beacon") {
        fill = `rgba(244, 220, 160, ${Math.min(1, 0.72 + pulse * 0.25 + boost)})`;
      } else if (particle.type === "star" && particle.tone > 0.974) {
        fill = `rgba(181, 204, 255, ${Math.min(1, 0.62 + pulse * 0.3 + boost)})`;
      } else if (particle.tone > 0.82) {
        fill = `rgba(219, 255, 252, ${Math.min(1, 0.58 + pulse * 0.3 + boost)})`;
      } else {
        const baseAlpha = 0.38 + particle.depth * 0.3;
        fill = `rgba(125, 229, 223, ${Math.min(0.96, baseAlpha + boost)})`;
      }

      const renderSize =
        particle.size * (particle.type === "mesh" ? 0.92 + pulse * 0.16 : 0.78 + pulse * 0.42) +
        particle.proximity * 0.72;
      context.fillStyle = fill;

      if (particle.type === "mesh") {
        context.fillRect(
          Math.round(particle.x - renderSize / 2),
          Math.round(particle.y - renderSize / 2),
          renderSize,
          renderSize
        );
        return;
      }

      context.save();
      context.shadowBlur = particle.type === "beacon" ? 12 + pulse * 8 : 5 + pulse * 7;
      context.shadowColor =
        particle.type === "beacon"
          ? `rgba(226, 199, 126, ${0.28 + pulse * 0.34})`
          : `rgba(136, 232, 236, ${0.2 + pulse * 0.28})`;
      context.beginPath();
      context.arc(particle.x, particle.y, renderSize / 2, 0, Math.PI * 2);
      context.fill();
      context.restore();
    };

    const updateParticle = (particle, delta, time) => {
      particle.proximity = 0;
      particle.twinkle = 0.5 + Math.sin(time * particle.twinkleSpeed + particle.twinklePhase) * 0.5;

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
      const drift =
        particle.driftAmplitude > 0 && !reducedMotionQuery.matches
          ? Math.sin(time * particle.driftSpeed + particle.driftPhase) * particle.driftAmplitude
          : 0;
      const targetX = particle.originX + drift;
      const targetY = particle.originY + drift * 0.56;
      particle.x += particle.vx + (targetX - particle.x) * RETURN_EASE * delta;
      particle.y += particle.vy + (targetY - particle.y) * RETURN_EASE * delta;
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
        updateParticle(particle, delta, time);
      }

      drawConnections();
      drawComet(time);

      for (const particle of particles) {
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
    <div className="particle-mesh-shell particle-mesh-shell--stellar" aria-hidden="true">
      <canvas ref={canvasRef} className="particle-mesh-canvas" data-particle-field="stellar-mesh" />
      <div className="particle-mesh-vignette" />
      <div className="particle-mesh-scan" />
    </div>
  );
}
