import React, { useState, useEffect } from "react";
import LineIcon from "../../../components/icons/LineIcon";
import { useLanguage } from "../../../context/LanguageContext";
import { resolveSpatialGuidance } from "../../../services/spatial/spatialModelResolver";
import { fetchPublishedSpatialCatalog, getSpatialCatalog } from "../../../services/spatial/spatialCatalogService";

export default function SpatialAIGuidanceCard({
  text = "",
  userQuery = "",
  currentPath = "",
  activeModel = null,
  catalog: initialCatalog = null,
  user = null
}) {
  const { t } = useLanguage();

  // Estado do catálogo espacial ativo no ciclo de vida do componente React
  const [activeCatalog, setActiveCatalog] = useState(() => {
    if (Array.isArray(initialCatalog) && initialCatalog.length > 0) {
      return initialCatalog;
    }
    // Consulta o estado síncrono inicial
    return getSpatialCatalog({ user });
  });

  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // Integração efetiva ao ciclo de vida React: busca o catálogo do Supabase antes de recomendar
  useEffect(() => {
    if (initialCatalog && initialCatalog.length > 0) {
      setActiveCatalog(initialCatalog);
      return;
    }

    let isMounted = true;
    setIsLoadingCatalog(true);

    fetchPublishedSpatialCatalog({ user })
      .then((models) => {
        if (!isMounted) return;
        // FAIL-CLOSED: Se a consulta retornar vazia ou falhar, activeCatalog é setado como vazio
        setActiveCatalog(Array.isArray(models) ? models : []);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("[SpatialAIGuidanceCard] FAIL-CLOSED: Erro ao consultar catálogo 3D do Supabase:", err);
        setActiveCatalog([]);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCatalog(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user, initialCatalog]);

  // Se o catálogo estiver carregando ou vazio (FAIL-CLOSED), não emite nenhum elemento na UI
  if (isLoadingCatalog || !activeCatalog || activeCatalog.length === 0) {
    return null;
  }

  // Executa resolução determinística estrita
  const resolution = resolveSpatialGuidance({
    userQuery: userQuery || text,
    aiResponseText: text,
    currentPath,
    activeModel,
    catalog: activeCatalog,
    user
  });

  // LINHA DE CORTE: Se a estrutura não existe no catálogo ou não tem modelo 3D correspondente,
  // retorna rigorosamente null sem emitir nenhum card, badge ou botão fantasma.
  if (!resolution.hasMatch || !resolution.model) {
    return null;
  }

  const { model, matchedMarker } = resolution;

  // Validação real da rota: não presume validade sem rota canônica verificada
  const isValidViewerRoute = Boolean(
    model.isNavigable !== false &&
    model.viewerUrl &&
    typeof model.viewerUrl === "string" &&
    model.viewerUrl.startsWith("/viewer/") &&
    model.slug
  );

  const targetUrl = isValidViewerRoute ? model.viewerUrl : null;
  const isAlreadyInTargetViewer = Boolean(
    currentPath && (
      (model.slug && currentPath.includes(model.slug)) ||
      (model.id && currentPath.includes(model.id))
    )
  );

  const handleOpenViewer = () => {
    if (!targetUrl) return;
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", targetUrl);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleFocusMarker = (marker) => {
    if (!marker || typeof marker !== "object") return;

    // Verificação estrita de integridade antes do foco espacial:
    // 1. UUID do modelo deve corresponder
    const belongsToModel = (!marker.modelId || marker.modelId === model.id || (model.legacyIds && model.legacyIds.includes(marker.modelId)));
    if (!belongsToModel) {
      console.warn("[SpatialGuidance] Foco abortado: marcador não pertence ao modelo carregado", marker, model);
      return;
    }

    // 2. Índice numérico da anotação deve ser inteiro >= 0
    const markerIndex = marker.annotationIndex ?? marker.index;
    if (!Number.isInteger(markerIndex) || markerIndex < 0) {
      console.warn("[SpatialGuidance] Foco abortado: annotationIndex inválido", markerIndex);
      return;
    }

    // 3. Identificador Sketchfab UID deve ser válido
    const targetSketchfabUid = marker.sketchfabUid || model.sketchfabUid;
    if (!targetSketchfabUid) {
      console.warn("[SpatialGuidance] Foco abortado: sketchfabUid ausente");
      return;
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("aeternum:select-marker", {
          detail: {
            markerId: marker.id,
            markerLabel: marker.label,
            markerIndex,
            annotationIndex: markerIndex,
            sketchfabUid: targetSketchfabUid,
            modelSlug: model.slug,
            modelId: model.id
          }
        })
      );
    }
  };

  return (
    <div className="a26-spatial-guidance-card my-2.5 p-3 bg-gradient-to-r from-teal-950/60 to-blackDeep/80 border border-teal-500/40 rounded-xl backdrop-blur-md text-clinicalWhite shadow-lg space-y-2.5">
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
        {targetUrl && !isAlreadyInTargetViewer ? (
          <button
            type="button"
            onClick={handleOpenViewer}
            className="a26-spatial-guidance-card__guide-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-teal-500 to-teal-600 text-blackDeep hover:brightness-110 transition-all flex items-center gap-1.5 shadow-md"
          >
            <LineIcon name="play" className="w-3.5 h-3.5" />
            <span>{t("spatialAI.guideToViewer", { defaultValue: "Orientar Visualizador 3D" })}</span>
          </button>
        ) : isAlreadyInTargetViewer ? (
          <span className="text-[11px] text-teal-300 font-medium flex items-center gap-1 bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-500/20">
            <span>👁️</span> {t("spatialAI.alreadyInViewer", { defaultValue: "Modelo ativo no visualizador" })}
          </span>
        ) : null}

        {/* Marcadores Reais Homologados */}
        {Array.isArray(model.markers) && model.markers.length > 0 && (
          <div className="w-full pt-1">
            <span className="a26-spatial-guidance-card__marker-label text-[10px] uppercase tracking-wider text-textMuted block mb-1.5 font-semibold">
              {t("spatialAI.selectMarker", { defaultValue: "Selecionar Marcador para Destacar (Spatial Focus):" })}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {model.markers.map((marker) => {
                const isSelected = matchedMarker && (
                  matchedMarker.id === marker.id ||
                  matchedMarker.annotationIndex === marker.annotationIndex
                );
                return (
                  <button
                    key={marker.id || `marker-${marker.annotationIndex}`}
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
