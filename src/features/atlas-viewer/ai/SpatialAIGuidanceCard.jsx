import React from "react";
import LineIcon from "../../../components/icons/LineIcon";
import { useLanguage } from "../../../context/LanguageContext";
import { resolveSpatialGuidance } from "../../../services/spatial/spatialModelResolver";
import { sketchfabBridge } from "../../../services/sketchfabAnnotationBridge";

export default function SpatialAIGuidanceCard({
  text = "",
  userQuery = "",
  currentPath = "",
  activeModel = null
}) {
  const { t } = useLanguage();

  const guidance = resolveSpatialGuidance({
    userQuery,
    aiResponseText: text,
    currentPath: currentPath || (typeof window !== "undefined" ? window.location.pathname : ""),
    activeModel
  });

  if (!guidance.hasMatch || !guidance.model) {
    return null;
  }

  const { model, matchedMarker } = guidance;
  const targetUrl = model.viewerUrl || `/viewer/${model.slug}`;
  const isAlreadyInTargetViewer = Boolean(
    (currentPath && currentPath.includes(model.slug)) ||
    (typeof window !== "undefined" && window.location.pathname.includes(model.slug))
  );

  const handleOpenViewer = () => {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", targetUrl);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleFocusMarker = (marker) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("aeternum:select-marker", {
          detail: { markerLabel: marker.label, markerIndex: marker.index, modelSlug: model.slug }
        })
      );
      if (sketchfabBridge && typeof sketchfabBridge.goToSketchfabAnnotation === "function") {
        sketchfabBridge.goToSketchfabAnnotation(marker.index);
      }
    }
  };

  return (
    <div
      className="a26-spatial-guidance-card my-2.5 p-3 bg-gradient-to-r from-teal-950/60 to-blackDeep/80 border border-teal-500/40 rounded-xl backdrop-blur-md text-clinicalWhite shadow-lg space-y-2.5"
      data-testid="spatial-ai-guidance-card"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold text-xs text-teal-300 a26-spatial-guidance-card__title">
          <span className="text-sm">🧊</span>
          <span>{t("spatialAI.title", { defaultValue: "Controle Espacial Spatial AI" })}</span>
        </div>
        <span className="a26-spatial-guidance-card__badge text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-500/30">
          {t("spatialAI.badge", { defaultValue: "Modelo 3D Mapeado" })}
        </span>
      </div>

      <p className="a26-spatial-guidance-card__model-title text-xs text-teal-100/90 font-medium">
        {model.title}
      </p>

      {/* Botões de Ação Espacial */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {!isAlreadyInTargetViewer ? (
          <button
            type="button"
            onClick={handleOpenViewer}
            className="a26-spatial-guidance-card__guide-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-teal-500 to-teal-600 text-blackDeep hover:brightness-110 transition-all flex items-center gap-1.5 shadow-md"
          >
            <LineIcon name="play" className="w-3.5 h-3.5" />
            <span>{t("spatialAI.guideToViewer", { defaultValue: "Guiar para o Modelo 3D" })}</span>
          </button>
        ) : (
          <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
            <span>👁️</span> {t("spatialAI.openedInSession", { defaultValue: "Modelo 3D aberto nesta sessão" })}
          </span>
        )}

        {/* Lista de Marcadores Anatômicos Interativos */}
        {Array.isArray(model.markers) && model.markers.length > 0 && (
          <div className="w-full pt-1">
            <span className="a26-spatial-guidance-card__marker-label text-[10px] uppercase tracking-wider text-textMuted block mb-1.5 font-semibold">
              {t("spatialAI.selectMarker", { defaultValue: "Selecionar Marcador para Destacar (Spatial Focus):" })}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {model.markers.map((marker) => {
                const isSelected = matchedMarker && matchedMarker.index === marker.index;
                return (
                  <button
                    key={marker.id || marker.index}
                    type="button"
                    onClick={() => handleFocusMarker(marker)}
                    className={`a26-spatial-guidance-card__marker-btn px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
                      isSelected
                        ? "bg-amber-500/30 border border-amber-400 text-amber-200 font-bold shadow-sm"
                        : "bg-surfaceDark/80 border border-glassBorder/50 text-teal-200 hover:border-teal-400 hover:text-white hover:bg-teal-500/20"
                    }`}
                  >
                    📍 {marker.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
