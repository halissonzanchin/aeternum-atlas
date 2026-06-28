import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import "./SketchfabApiViewer.css";

const SKETCHFAB_API_URL = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";
const DEFAULT_HEART_UID = "fd61a9605f4148a9b5274463f7adbcb5";
const FALLBACK_NOTICE_MS = 8000;
const VIEWER_READY_TIMEOUT_MS = 60000;

function stripHtml(value = "") {
  return String(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeAnnotation(annotation, index) {
  const rawContent = annotation?.content?.raw || annotation?.content || "";
  const renderedContent = annotation?.content?.rendered || "";

  return {
    id: annotation?.uid || `sketchfab-annotation-${index + 1}`,
    uid: annotation?.uid || "",
    index,
    name: annotation?.name || `Annotation ${index + 1}`,
    description: stripHtml(rawContent || renderedContent)
  };
}

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

function callSketchfabApi(api, methodName, ...args) {
  if (typeof api?.[methodName] !== "function") return;

  try {
    api[methodName](...args);
  } catch {
    // External viewer API can be unavailable during iframe transitions.
  }
}

function hideAnnotationInfo(api, annotationIndex) {
  callSketchfabApi(api, "hideAnnotationTooltip", annotationIndex);
  callSketchfabApi(api, "unselectAnnotation");
}

export default function SketchfabApiViewer({
  modelUid = DEFAULT_HEART_UID,
  title,
  embedUrl,
  externalUrl,
  children,
  onViewerReady,
  onAnnotationSelect,
  onAnnotationsLoad,
  annotationNavigationRequest,
  annotationTooltipsHidden = false,
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
          ui_controls: 0,
          ui_annotations: 0,
          ui_hint: 0,
          ui_help: 0,
          ui_fullscreen: 0,
          ui_settings: 0,
          ui_vr: 0,
          ui_inspector: 0,
          ui_stop: 0,
          ui_watermark: 0,
          ui_watermark_link: 0,
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

              if (typeof api.getAnnotationList === "function") {
                api.getAnnotationList((errorOrAnnotations, maybeAnnotations) => {
                  if (!isMounted) return;

                  const annotations = Array.isArray(errorOrAnnotations)
                    ? errorOrAnnotations
                    : maybeAnnotations;

                  if (!Array.isArray(annotations)) return;

                  const normalizedAnnotations = annotations
                    .map(normalizeAnnotation)
                    .filter(annotation => annotation.name);

                  onAnnotationsLoad?.(normalizedAnnotations);
                  onEvent?.({
                    type: "annotation_list_loaded",
                    modelUid,
                    annotationCount: normalizedAnnotations.length,
                    timestamp: new Date().toISOString()
                  });
                });
              }
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

  useEffect(() => {
    const api = apiRef.current;
    const annotationIndex = annotationNavigationRequest?.index;
    const silent = Boolean(annotationNavigationRequest?.silent);

    if (
      status !== "ready" ||
      !api ||
      !Number.isInteger(annotationIndex) ||
      typeof api.gotoAnnotation !== "function"
    ) {
      return;
    }

    onEvent?.({
      type: "annotation_navigation_requested",
      modelUid,
      annotationIndex,
      timestamp: new Date().toISOString()
    });

    if (silent) {
      hideAnnotationInfo(api, annotationIndex);
    }

    api.gotoAnnotation(annotationIndex, { preventCameraAnimation: false }, error => {
      if (!error && silent) {
        window.setTimeout(() => hideAnnotationInfo(api, annotationIndex), 120);
        window.setTimeout(() => hideAnnotationInfo(api, annotationIndex), 420);
      }

      onEvent?.({
        type: error ? "annotation_navigation_failed" : "annotation_navigation_completed",
        modelUid,
        annotationIndex,
        metadata: { silent },
        error: error || undefined,
        timestamp: new Date().toISOString()
      });
    });
  }, [annotationNavigationRequest, modelUid, status]);

  useEffect(() => {
    const api = apiRef.current;

    if (status !== "ready" || !api) return;

    callSketchfabApi(api, annotationTooltipsHidden ? "hideAnnotationTooltips" : "showAnnotationTooltips");

    onEvent?.({
      type: annotationTooltipsHidden ? "annotation_tooltips_hidden" : "annotation_tooltips_visible",
      modelUid,
      timestamp: new Date().toISOString()
    });
  }, [annotationTooltipsHidden, modelUid, status]);

  return (
    <section className="aa-viewer-shell h-full w-full relative">
      <div className="absolute top-4 right-4 z-50 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 pointer-events-none">
        <span className={`w-2 h-2 rounded-full ${status === 'ready' ? 'bg-emerald-400' : status === 'error' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
        <span className="text-xs font-medium text-white/90">
          {status === "loading" && t("viewer.loadingModel")}
          {status === "ready" && t("viewer.sketchfabConnected")}
          {status === "error" && (fallbackMode ? t("viewer.fallbackActive") : t("viewer.viewerError"))}
        </span>
      </div>

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
          className="w-full h-full border-none absolute inset-0"
        />
        {children}
      </div>
    </section>
  );
}
