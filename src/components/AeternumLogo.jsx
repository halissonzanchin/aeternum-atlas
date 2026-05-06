import { useEffect, useRef, useState } from "react";
import "./AeternumLogo.css";
import logoSvg from "../assets/logo-aeternum-atlas.svg";
import { useLanguage } from "../context/LanguageContext";

export default function AeternumLogo({
  variant = "horizontal",
  size = "md",
  theme = "dark",
  className = ""
}) {
  const { t } = useLanguage();
  const [active, setActive] = useState(false);
  const timerRef = useRef(null);
  const touchLockRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handlePointerDown = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    touchLockRef.current = true;
    setActive(true);
    timerRef.current = window.setTimeout(() => {
      touchLockRef.current = false;
      setActive(false);
    }, 1500);
  };

  const handlePointerLeave = () => {
    if (!touchLockRef.current) setActive(false);
  };

  const showText = variant === "horizontal" || variant === "full";
  const showSubtitle = variant === "full";

  return (
    <div
      className={[
        "aeternum-brand-logo",
        "aeternum-logo",
        `aeternum-logo--${variant}`,
        `aeternum-logo--${size}`,
        `aeternum-logo--${theme}`,
        active ? "is-active" : "",
        className
      ].filter(Boolean).join(" ")}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      role="img"
      aria-label={`${t("common.appName")} — ${t("common.appSubtitle")}`}
    >
      <div className="aeternum-logo__symbol-wrap">
        <span className="aeternum-logo__aura" />
        <span className="aeternum-logo__orbit-glow" />
        <img
          src={logoSvg}
          alt=""
          aria-hidden="true"
          className="aeternum-logo__symbol"
          draggable="false"
        />
      </div>

      {showText && (
        <div className="aeternum-logo__text">
          <div className="aeternum-logo__name">AETERNUM ATLAS</div>
          {showSubtitle && (
            <div className="aeternum-logo__subtitle">
              {t("common.appSubtitle").toUpperCase()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
