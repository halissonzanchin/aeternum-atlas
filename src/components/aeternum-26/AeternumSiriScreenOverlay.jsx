import React from "react";
import { createPortal } from "react-dom";
import "./AeternumSiriScreenOverlay.css";

/**
 * Aeternum 26.1 Apple Intelligence Glow Effect
 * Implements Jacob Amobin's 4-Layer Angular Composite Glow Architecture.
 * Hardware-accelerated 120 FPS fluid perimeter glow.
 */
export default function AeternumSiriScreenOverlay({
  active = false,
  state = "idle",
  onDeactivate
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`a26-siri-screen-overlay ${active ? "is-active" : ""} state-${state}`}
      aria-hidden={!active}
    >
      {/* Ambient Darkened Scrim */}
      <div className="a26-siri-screen__scrim" onClick={active ? onDeactivate : undefined} />

      {/* 4 Composite Angular Gradient Glow Layers */}
      <div className="a26-siri-screen__frame-container">
        {/* Layer 1: Sharp Core Laser Beam (No Blur) */}
        <div className="a26-apple-glow-layer a26-apple-glow-layer--core" />

        {/* Layer 2: Tight Caustic Aura (Blur 4px) */}
        <div className="a26-apple-glow-layer a26-apple-glow-layer--tight" />

        {/* Layer 3: Medium Radiant Dispersion (Blur 14px) */}
        <div className="a26-apple-glow-layer a26-apple-glow-layer--medium" />

        {/* Layer 4: Deep Ambient Bloom (Blur 28px) */}
        <div className="a26-apple-glow-layer a26-apple-glow-layer--bloom" />
      </div>

      {/* Center Living Prompt HUD */}
      {active && (
        <div className="a26-siri-center-prompt" onClick={onDeactivate}>
          <span>Tutor IA Ativo</span>
          <p>Ouvindo sua dúvida clínica e anatômica…</p>
          <div className="a26-siri-dismiss-badge">
            <span>Toque para encerrar</span>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
