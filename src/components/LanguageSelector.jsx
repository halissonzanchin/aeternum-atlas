import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { A26Surface } from "./aeternum-26";
import "./LanguageSelector.css";

export default function LanguageSelector({ compact = false, onOpen }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const { language, setLanguage, availableLanguages, t } = useLanguage();
  const currentLanguage = availableLanguages.find(item => item.code === language) || availableLanguages[0];

  useEffect(() => {
    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => {
      const activeItem = menuRef.current?.querySelector(".is-active");
      const firstItem = menuRef.current?.querySelector('[role="menuitem"]');
      (activeItem || firstItem)?.focus();
    });
  }, [open]);

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
      return;
    }

    if (!open || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const items = [...(menuRef.current?.querySelectorAll('[role="menuitem"]') || [])];
    if (!items.length) return;
    event.preventDefault();
    const currentIndex = Math.max(0, items.indexOf(document.activeElement));
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? items.length - 1
        : event.key === "ArrowDown"
          ? (currentIndex + 1) % items.length
          : (currentIndex - 1 + items.length) % items.length;
    items[nextIndex]?.focus();
  }

  return (
    <div className={`language-selector ${compact ? "language-selector--compact" : ""}`} ref={wrapperRef} onKeyDown={handleKeyDown}>
      <A26Surface
        ref={triggerRef}
        as="button"
        type="button"
        material="clear"
        interactive
        className="language-selector__button"
        onClick={() => {
          const nextOpen = !open;
          if (nextOpen) onOpen?.();
          setOpen(nextOpen);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("language.changeLanguage")}
      >
        <span className="language-selector__code" aria-hidden="true">
          {currentLanguage.code.toUpperCase()}
        </span>
        <span className="language-selector__current">{currentLanguage.nativeName}</span>
      </A26Surface>

      {open ? (
        <A26Surface
          ref={menuRef}
          material="regular"
          className="language-selector__menu"
          role="menu"
          aria-label={t("language.changeLanguage")}
          data-testid="a26-language-menu"
        >
          {availableLanguages.map(item => (
            <button
              key={item.code}
              type="button"
              role="menuitem"
              className={`language-selector__option ${item.code === language ? "is-active" : ""}`}
              onClick={() => {
                setLanguage(item.code);
                setOpen(false);
              }}
            >
              <span className="language-selector__code" aria-hidden="true">
                {item.code.toUpperCase()}
              </span>
              <span>{item.nativeName}</span>
            </button>
          ))}
        </A26Surface>
      ) : null}
    </div>
  );
}
