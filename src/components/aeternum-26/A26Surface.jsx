/* eslint-disable no-unused-vars -- o parser ESLint atual não contabiliza identificadores usados apenas em JSX */
import { forwardRef, useCallback, useRef } from "react";

const MATERIALS = new Set(["clear", "regular", "substantial", "opaque"]);
const TONES = new Set(["neutral", "teal", "gold", "danger"]);

const A26Surface = forwardRef(function A26Surface({
  as: Component = "div",
  material = "opaque",
  tone = "neutral",
  interactive = false,
  className = "",
  children,
  onPointerMove,
  onPointerLeave,
  ...props
}, forwardedRef) {
  const localRef = useRef(null);
  const resolvedMaterial = MATERIALS.has(material) ? material : "opaque";
  const resolvedTone = TONES.has(tone) ? tone : "neutral";
  const hasBlur = resolvedMaterial !== "opaque";

  const assignRef = useCallback((node) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }, [forwardedRef]);

  const updateOpticalFocus = useCallback((event) => {
    const surface = localRef.current;
    if (surface && interactive) {
      const bounds = surface.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 100;
      const y = ((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 100;
      surface.style.setProperty("--a26-pointer-x", `${Math.max(0, Math.min(100, x))}%`);
      surface.style.setProperty("--a26-pointer-y", `${Math.max(0, Math.min(100, y))}%`);
    }
    onPointerMove?.(event);
  }, [interactive, onPointerMove]);

  const resetOpticalFocus = useCallback((event) => {
    const surface = localRef.current;
    if (surface) {
      surface.style.removeProperty("--a26-pointer-x");
      surface.style.removeProperty("--a26-pointer-y");
    }
    onPointerLeave?.(event);
  }, [onPointerLeave]);

  return (
    <Component
      ref={assignRef}
      className={[
        "a26-surface",
        `a26-material-${resolvedMaterial}`,
        `a26-tone-${resolvedTone}`,
        interactive ? "a26-surface--interactive" : "",
        className
      ].filter(Boolean).join(" ")}
      data-a26-surface=""
      data-a26-material={resolvedMaterial}
      data-a26-tone={resolvedTone}
      data-a26-blur={hasBlur ? "true" : "false"}
      onPointerMove={updateOpticalFocus}
      onPointerLeave={resetOpticalFocus}
      {...props}
    >
      <span className="a26-surface__refract" aria-hidden="true" />
      <span className="a26-surface__spectrum" aria-hidden="true" />
      <span className="a26-surface__specular" aria-hidden="true" />
      <span className="a26-surface__grain" aria-hidden="true" />
      {children}
    </Component>
  );
});

export default A26Surface;
