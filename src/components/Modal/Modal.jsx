import { useEffect, useId, useRef } from "react";
import Button from "../Button/Button";
import AeternumGlassSurface from "../system/AeternumGlassSurface";

export default function Modal({ open, title, children, actions, onClose }) {
  const titleId = useId();
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleKeyDown);
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="atlas-crystal-overlay fixed inset-0 z-50 grid place-items-center bg-black/80 p-5 backdrop-blur-xl"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <AeternumGlassSurface
        as="section"
        className="atlas-crystal-dialog atlas-crystal-surface aog-dialog-surface w-full max-w-md rounded-3xl border border-agedGold/25 bg-gradient-to-br from-graphite/90 to-blackDeep/95 p-6 shadow-premium"
        variant="regular"
        depth="substantial"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-display text-2xl tracking-wide text-agedGold">{title}</h2>
          <Button ref={closeButtonRef} variant="ghost" className="min-h-9 px-3" aria-label="Fechar" onClick={onClose}>×</Button>
        </div>
        <div className="mt-4 text-sm leading-7 text-textMuted">{children}</div>
        {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
      </AeternumGlassSurface>
    </div>
  );
}
