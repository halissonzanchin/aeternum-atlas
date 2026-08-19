import React from "react";
import { createPortal } from "react-dom";
import "./AeternumSiriScreenOverlay.css";

/**
 * Aeternum 26.1 Siri / Apple Intelligence Fullscreen Living Screen Overlay
 * Renders an organic multi-chromatic fluid edge glow across the entire viewport.
 */
export default function AeternumSiriScreenOverlay({
  active = false,
  state = "idle",
  isCharging = false
}) {
  if (typeof document === "undefined") return null;

  const isVisible = active || isCharging;
  if (!isVisible) return null;

  return createPortal(
    <div
      className={[
        "a26-siri-screen-overlay",
        active ? "is-active" : "",
        isCharging ? "is-charging" : "",
        `state-${state}`
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      <div className="a26-siri-screen__scrim" />
      <div className="a26-siri-screen__mesh" />
      <div className="a26-siri-screen__wave-border" />
    </div>,
    document.body
  );
}
