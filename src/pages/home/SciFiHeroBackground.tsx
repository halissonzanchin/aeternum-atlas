import { useMemo, type CSSProperties } from "react";
import "./SciFiHeroBackground.css";

type Star = {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  color: "gold" | "cyan" | "white";
};

function seededRandom(seed: number) {
  let value = seed;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export function SciFiHeroBackground() {
  const stars = useMemo<Star[]>(() => {
    const random = seededRandom(1937);

    return Array.from({ length: 120 }, (_, index) => {
      const colorRandom = random();

      return {
        id: index,
        x: random() * 100,
        y: random() * 72,
        size: random() * 2.2 + 0.6,
        opacity: random() * 0.65 + 0.18,
        duration: random() * 5 + 4,
        delay: random() * 6,
        color: colorRandom > 0.72 ? "gold" : colorRandom > 0.44 ? "cyan" : "white"
      };
    });
  }, []);

  return (
    <div className="sci-fi-bg" aria-hidden="true">
      <div className="sci-fi-base" />

      <div className="sci-fi-rings">
        <span className="ring ring-1" />
        <span className="ring ring-2" />
        <span className="ring ring-3" />
        <span className="ring ring-4" />
        <span className="ring ring-5" />
      </div>

      <div className="sci-fi-stars">
        {stars.map((star) => (
          <span
            key={star.id}
            className={`star star-${star.color}`}
            style={
              {
                "--x": `${star.x}%`,
                "--y": `${star.y}%`,
                "--size": `${star.size}px`,
                "--opacity": star.opacity,
                "--duration": `${star.duration}s`,
                "--delay": `${star.delay}s`
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="sci-fi-horizon">
        <span className="horizon-glow horizon-gold" />
        <span className="horizon-glow horizon-cyan" />
        <span className="horizon-line" />
      </div>

      <div className="sci-fi-grid">
        <div className="grid-plane" />
        <div className="grid-shine grid-shine-gold" />
        <div className="grid-shine grid-shine-cyan" />
      </div>

      <div className="sci-fi-fog sci-fi-fog-gold" />
      <div className="sci-fi-fog sci-fi-fog-cyan" />
      <div className="sci-fi-vignette" />
    </div>
  );
}

export default SciFiHeroBackground;
