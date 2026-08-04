import React, { forwardRef, useCallback, useRef } from "react";

const AeternumGlassSurface = forwardRef(function AeternumGlassSurface({
  as: Component = "div",
  children,
  className = "",
  variant = "regular",
  depth = "standard",
  interactive = false,
  onPointerMove,
  onPointerLeave,
  ...props
}, forwardedRef) {
  const surfaceRef = useRef(null);

  const assignRef = useCallback((node) => {
    surfaceRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }, [forwardedRef]);

  const updateOpticalFocus = useCallback((event) => {
    const surface = surfaceRef.current;
    if (surface && interactive) {
      const bounds = surface.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / Math.max(bounds.width, 1)) * 100;
      const y = ((event.clientY - bounds.top) / Math.max(bounds.height, 1)) * 100;
      surface.style.setProperty("--aog-pointer-x", `${Math.max(0, Math.min(100, x))}%`);
      surface.style.setProperty("--aog-pointer-y", `${Math.max(0, Math.min(100, y))}%`);
    }
    onPointerMove?.(event);
  }, [interactive, onPointerMove]);

  const resetOpticalFocus = useCallback((event) => {
    const surface = surfaceRef.current;
    if (surface) {
      surface.style.removeProperty("--aog-pointer-x");
      surface.style.removeProperty("--aog-pointer-y");
    }
    onPointerLeave?.(event);
  }, [onPointerLeave]);

  return (
    <Component
      ref={assignRef}
      className={[
        "aog-surface",
        `aog-surface--${variant}`,
        `aog-surface--${depth}`,
        interactive ? "aog-surface--interactive" : "",
        className
      ].filter(Boolean).join(" ")}
      data-aog-variant={variant}
      data-aog-depth={depth}
      data-aog-interactive={interactive ? "true" : "false"}
      onPointerMove={updateOpticalFocus}
      onPointerLeave={resetOpticalFocus}
      {...props}
    >
      <span className="aog-surface__lens" aria-hidden="true" />
      <span className="aog-surface__specular" aria-hidden="true" />
      <span className="aog-surface__grain" aria-hidden="true" />
      {children}
    </Component>
  );
});

export default AeternumGlassSurface;
