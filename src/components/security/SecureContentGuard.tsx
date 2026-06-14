import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { logSecurityEvent, securityEventTypes } from "../../services/securityEventService";
import "./SecureContentGuard.css";

type SecureContentGuardProps = {
  children: React.ReactNode;
  user?: any;
  model?: any;
  enabled?: boolean;
  className?: string;
};

type WatermarkOffset = {
  x: number;
  y: number;
};

const THROTTLED_EVENTS = new Set([
  securityEventTypes.tabBlur,
  securityEventTypes.devtoolsAttempt,
  securityEventTypes.shortcutBlocked
]);

function createSessionId() {
  const random = crypto.randomUUID?.().slice(0, 8) || Date.now().toString(36);
  return `AET-${random.toUpperCase()}`;
}

function resolveUserDisplay(user: any, fallback: string) {
  return user?.name || user?.fullName || user?.email?.split("@")[0] || fallback;
}

function resolveInstitutionDisplay(user: any, fallback: string) {
  return (
    user?.institutionName ||
    user?.institution_name ||
    user?.institution?.name ||
    user?.institution ||
    user?.institutionId ||
    user?.institution_id ||
    fallback
  );
}

export default function SecureContentGuard({
  children,
  user,
  model,
  enabled = true,
  className = ""
}: SecureContentGuardProps) {
  const { t } = useLanguage();
  const guardRef = useRef<HTMLDivElement | null>(null);
  const sessionIdRef = useRef(createSessionId());
  const lastEventAtRef = useRef<Map<string, number>>(new Map());
  const screenOverlayTimeoutRef = useRef<number | null>(null);

  const [watermarkOffset, setWatermarkOffset] = useState<WatermarkOffset>({ x: 0, y: 0 });
  const [watermarkTime, setWatermarkTime] = useState(() => new Date());
  const [screenOverlayVisible, setScreenOverlayVisible] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  const reportSecurityEvent = useCallback(
    (eventType: string, metadata: Record<string, any> = {}, force = false) => {
      if (!enabled) return;

      const now = Date.now();
      const last = lastEventAtRef.current.get(eventType) || 0;
      const minInterval = THROTTLED_EVENTS.has(eventType) ? 10_000 : 1_200;

      if (!force && now - last < minInterval) return;
      lastEventAtRef.current.set(eventType, now);

      void logSecurityEvent({
        user,
        model,
        eventType,
        metadata,
        sessionId: sessionIdRef.current
      });
    },
    [enabled, model, user]
  );

  useEffect(() => {
    if (!enabled) return;

    const watermarkTimer = window.setInterval(() => {
      setWatermarkTime(new Date());
      setWatermarkOffset({
        x: Math.round(Math.random() * 96),
        y: Math.round(Math.random() * 72)
      });
    }, 31_000);

    return () => window.clearInterval(watermarkTimer);
  }, [enabled]);

  const watermarkText = useMemo(() => {
    const name = resolveUserDisplay(user, t("viewer.security.unknownUser"));
    const email = user?.email || t("viewer.security.noEmail");
    const institution = resolveInstitutionDisplay(user, t("viewer.security.institutionalAccess"));
    const userId = user?.id || t("viewer.security.noUserId");
    const formattedTime = new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(watermarkTime);

    return `${name} • ${institution} • ${email} • ${t("viewer.security.session")} #${sessionIdRef.current} • ${formattedTime} • ID ${userId}`;
  }, [t, user, watermarkTime]);

  useEffect(() => {
    if (!enabled) return;

    function showCaptureWarning(message: string) {
      setWatermarkTime(new Date());
      setWatermarkOffset({
        x: Math.round(Math.random() * 96),
        y: Math.round(Math.random() * 72)
      });
      setWarningMessage(message);
      setScreenOverlayVisible(true);

      if (screenOverlayTimeoutRef.current) {
        window.clearTimeout(screenOverlayTimeoutRef.current);
      }

      screenOverlayTimeoutRef.current = window.setTimeout(() => {
        setScreenOverlayVisible(false);
        setWarningMessage("");
      }, 1800);
    }

    function blockShortcut(event: KeyboardEvent, eventType: string, message: string, metadata = {}) {
      event.preventDefault();
      event.stopPropagation();
      setWarningMessage(message);
      reportSecurityEvent(eventType, metadata, eventType === securityEventTypes.printscreenAttempt);
    }

    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      const code = event.code.toLowerCase();
      const hasModifier = event.ctrlKey || event.metaKey;
      const isInspectionCombo =
        hasModifier &&
        event.shiftKey &&
        ["i", "j", "c"].includes(key);

      if (event.key === "PrintScreen" || code === "printscreen") {
        blockShortcut(event, securityEventTypes.printscreenAttempt, t("viewer.security.printWarning"), {
          key: event.key
        });
        showCaptureWarning(t("viewer.security.printWarning"));
        return;
      }

      if (
        event.key === "F12" ||
        isInspectionCombo ||
        (hasModifier && ["p", "s", "u"].includes(key))
      ) {
        blockShortcut(event, securityEventTypes.shortcutBlocked, t("viewer.security.shortcutWarning"), {
          key: event.key,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey
        });

        if (event.key === "F12" || isInspectionCombo) {
          reportSecurityEvent(securityEventTypes.devtoolsAttempt, { source: "keyboard_shortcut" });
        }
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        reportSecurityEvent(securityEventTypes.tabBlur, { source: "visibilitychange" });
      }
    }

    function handleBlur() {
      reportSecurityEvent(securityEventTypes.tabBlur, { source: "window_blur" });
    }

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (screenOverlayTimeoutRef.current) {
        window.clearTimeout(screenOverlayTimeoutRef.current);
      }
    };
  }, [enabled, reportSecurityEvent, t]);

  useEffect(() => {
    if (!enabled) return;

    const timer = window.setInterval(() => {
      const widthDelta = Math.abs(window.outerWidth - window.innerWidth);
      const heightDelta = Math.abs(window.outerHeight - window.innerHeight);
      const likelyDevtoolsOpen = widthDelta > 220 || heightDelta > 260;

      if (likelyDevtoolsOpen) {
        reportSecurityEvent(securityEventTypes.devtoolsAttempt, {
          source: "viewport_delta",
          widthDelta,
          heightDelta
        });
      }
    }, 2400);

    return () => window.clearInterval(timer);
  }, [enabled, reportSecurityEvent]);

  const watermarkCells = Array.from({ length: 42 }, (_, index) => index);

  return (
    <div
      ref={guardRef}
      className={`secure-content-guard ${className}`.trim()}
      data-secure-session={sessionIdRef.current}
      style={
        {
          "--secure-wm-x": `${watermarkOffset.x}px`,
          "--secure-wm-y": `${watermarkOffset.y}px`
        } as React.CSSProperties
      }
    >
      <div className="secure-content-guard__body">{children}</div>

      {enabled && screenOverlayVisible ? (
        <>
          <div className="secure-watermark secure-watermark--capture" aria-hidden="true">
            {watermarkCells.map(index => (
              <span key={index}>{watermarkText}</span>
            ))}
          </div>

          <div className="secure-capture-overlay" role="alert">
            <div>
              <strong>{t("viewer.security.warningTitle")}</strong>
              <p>{warningMessage || t("viewer.security.printWarning")}</p>
            </div>
          </div>
        </>
      ) : null}

      {warningMessage && !screenOverlayVisible ? (
        <div className="secure-warning-toast" role="status" aria-live="polite">
          {warningMessage}
        </div>
      ) : null}

    </div>
  );
}
