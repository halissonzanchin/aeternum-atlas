import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import "./SketchfabApiViewer.css";

const SKETCHFAB_API_URL = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";
const DEFAULT_HEART_UID = "fd61a9605f4148a9b5274463f7adbcb5";
const FALLBACK_NOTICE_MS = 8000;
const VIEWER_READY_TIMEOUT_MS = 60000;

function loadSketchfabScript() {
  return new Promise((resolve, reject) => {
    if (window.Sketchfab) {
      resolve(window.Sketchfab);
      return;
    }

    const existingScript = document.querySelector(`script[src="${SKETCHFAB_API_URL}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.Sketchfab), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = SKETCHFAB_API_URL;
    script.async = true;
    script.onload = () => resolve(window.Sketchfab);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function SketchfabApiViewer({
  modelUid = DEFAULT_HEART_UID,
  title,
  embedUrl,
  externalUrl,
  onViewerReady,
  onAnnotationSelect,
  onViewerError,
  onEvent
}) {
  const { t } = useLanguage();
  const viewerTitle = title || t("viewer.defaultModelTitle");
  const iframeRef = useRef(null);
  const apiRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [fallbackMode, setFallbackMode] = useState(false);
  const [showFallbackLink, setShowFallbackLink] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let apiInitialized = false;
    let viewerReady = false;
    let slowNoticeId = null;
    let readyTimeoutId = null;

    function clearTimers() {
      if (slowNoticeId) {
        window.clearTimeout(slowNoticeId);
        slowNoticeId = null;
      }

      if (readyTimeoutId) {
        window.clearTimeout(readyTimeoutId);
        readyTimeoutId = null;
      }
    }

    function handleViewerError(type, error) {
      clearTimers();
      setStatus("error");
      setFallbackMode(Boolean(embedUrl));

      const errorPayload = {
        type,
        modelUid,
        error,
        timestamp: new Date().toISOString()
      };

      onEvent?.(errorPayload);
      onViewerError?.(errorPayload);
    }

    async function initViewer() {
      if (!modelUid) {
        handleViewerError("viewer_error", "missing_model_uid");
        return;
      }

      try {
        setStatus("loading");
        setFallbackMode(false);
        setShowFallbackLink(false);

        slowNoticeId = window.setTimeout(() => {
          if (isMounted && !viewerReady) setShowFallbackLink(true);
        }, FALLBACK_NOTICE_MS);

        readyTimeoutId = window.setTimeout(() => {
          if (!isMounted || viewerReady) return;

          if (apiInitialized) {
            onEvent?.({
              type: "viewer_ready_timeout",
              modelUid,
              timestamp: new Date().toISOString()
            });
            return;
          }

          handleViewerError("viewer_timeout", "viewerready_timeout");
        }, VIEWER_READY_TIMEOUT_MS);

        const Sketchfab = await loadSketchfabScript();

        if (!iframeRef.current || !isMounted) return;

        const client = new Sketchfab("1.12.1", iframeRef.current);

        client.init(modelUid, {
          autostart: 1,
          preload: 1,
          ui_infos: 0,
          ui_controls: 1,
          ui_stop: 0,
          ui_watermark: 0,
          ui_watermark_link: 0,
          ui_annotations: 1,
          annotation: 0,
          success(api) {
            apiInitialized = true;
            apiRef.current = api;
            setStatus("ready");
            setShowFallbackLink(false);

            onEvent?.({
              type: "viewer_api_initialized",
              modelUid,
              timestamp: new Date().toISOString()
            });

            api.addEventListener("viewerready", () => {
              if (!isMounted) return;

              viewerReady = true;
              clearTimers();
              setStatus("ready");
              setShowFallbackLink(false);

              onEvent?.({
                type: "viewer_ready",
                modelUid,
                timestamp: new Date().toISOString()
              });

              onViewerReady?.(api);
            });

            api.addEventListener("annotationSelect", index => {
              if (!isMounted) return;

              onEvent?.({
                type: "annotation_selected",
                modelUid,
                annotationIndex: index,
                timestamp: new Date().toISOString()
              });

              onAnnotationSelect?.(index);
            });

            api.addEventListener("annotationFocus", index => {
              onEvent?.({
                type: "annotation_focused",
                modelUid,
                annotationIndex: index,
                timestamp: new Date().toISOString()
              });
            });

            api.addEventListener("click", info => {
              onEvent?.({
                type: "viewer_click",
                modelUid,
                metadata: info,
                timestamp: new Date().toISOString()
              });
            });

            api.start();
          },
          error() {
            if (!isMounted) return;
            handleViewerError("viewer_error");
          }
        });
      } catch (error) {
        if (!isMounted) return;
        handleViewerError("viewer_script_error", error?.message);
      }
    }

    initViewer();

    return () => {
      isMounted = false;
      clearTimers();

      try {
        apiRef.current?.stop?.();
      } catch {
        // Keep teardown silent if the external viewer is already gone.
      }
    };
  }, [modelUid]);

  return (
    <section className="aa-viewer-shell">
      <header className="aa-viewer-header">
        <div>
          <span className="aa-viewer-kicker">{t("viewer.academicViewer")}</span>
          <h2>{viewerTitle}</h2>
        </div>

        <div className="aa-viewer-status">
          <span className={`aa-status-dot aa-status-${status}`} />
          {status === "loading" && t("viewer.loadingModel")}
          {status === "ready" && t("viewer.sketchfabConnected")}
          {status === "error" && (fallbackMode ? t("viewer.fallbackActive") : t("viewer.viewerError"))}
        </div>
      </header>

      <div className="aa-sketchfab-stage">
        {status === "loading" && (
          <div className="aa-viewer-loading">
            <p>{t("viewer.preparing3dExperience")}</p>
            {showFallbackLink && externalUrl ? (
              <a href={externalUrl} target="_blank" rel="noreferrer">
                {t("viewer.openDirectlySketchfab")}
              </a>
            ) : null}
          </div>
        )}

        {status === "error" && !fallbackMode && (
          <div className="aa-viewer-error">
            <p>{t("viewer.modelLoadFailed")}</p>
            {externalUrl ? (
              <a href={externalUrl} target="_blank" rel="noreferrer">
                {t("viewer.openDirectlySketchfab")}
              </a>
            ) : null}
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={fallbackMode ? embedUrl : ""}
          title={viewerTitle}
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowFullScreen
          mozallowfullscreen="true"
          webkitallowfullscreen="true"
          xr-spatial-tracking="true"
          execution-while-out-of-viewport="true"
          execution-while-not-rendered="true"
          web-share="true"
          className="aa-sketchfab-iframe"
        />
      </div>
    </section>
  );
}
