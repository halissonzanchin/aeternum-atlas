import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import "./LanguageSelector.css";

export default function LanguageSelector({ compact = false }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const { language, setLanguage, availableLanguages, t } = useLanguage();
  const currentLanguage = availableLanguages.find(item => item.code === language) || availableLanguages[0];

  useEffect(() => {
    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function handleKeyDown(event) {
    if (event.key === "Escape") setOpen(false);
  }

  return (
    <div className={`language-selector ${compact ? "language-selector--compact" : ""}`} ref={wrapperRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className="language-selector__button"
        onClick={() => setOpen(value => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("language.changeLanguage")}
        data-tooltip={t("language.changeLanguage")}
      >
        <span aria-hidden="true">{currentLanguage.flag}</span>
        <span className="language-selector__current">{currentLanguage.nativeName}</span>
      </button>

      {open ? (
        <div className="language-selector__menu" role="menu">
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
              <span aria-hidden="true">{item.flag}</span>
              <span>{item.nativeName}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
