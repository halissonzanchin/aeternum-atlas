import { useEffect, useState } from "react";
import ViewerContext from "./ViewerContext";
import { useViewerModel } from "./hooks/useViewerModel";
import { useViewerAnnotations } from "./hooks/useViewerAnnotations";
import { useViewerProgress } from "./hooks/useViewerProgress";
import { useViewerQuiz } from "./hooks/useViewerQuiz";

import ViewerSketchfab from "./ViewerSketchfab";
import AtlasViewerShell from "../atlas-viewer/components/ux/AtlasViewerShell";
import AtlasAIViewerPanel from "../atlas-viewer/ai/AtlasAIViewerPanel";
import AnatomyKnowledgePanel from "../atlas-knowledge-graph/AnatomyKnowledgePanel";
import AnatomyLayerPanel from "../atlas-layers/AnatomyLayerPanel";
import { atlasMarkersMock } from "../atlas-viewer/atlasMarkers.mock";
import ViewerAnnotations from "./ViewerAnnotations";
import ViewerQuiz from "./ViewerQuiz";
import ViewerControls from "./ViewerControls";
import ViewerSidebar from "./ViewerSidebar";

import LineIcon from "../../components/icons/LineIcon";
import LanguageSelector from "../../components/LanguageSelector";
import Card from "../../components/Card/Card";
import { useLanguage } from "../../context/LanguageContext";
import { trackEvent } from "../../services/analytics/analyticsService";
import { atlasAssetStorageService } from "../../services/atlasAssetStorageService";

function TopViewerBar({ model, structure, navigate, onToggleLeft }) {
  const { t } = useLanguage();
  const breadcrumb = structure?.breadcrumb?.length ? structure.breadcrumb : [model.system, model.region || model.category, structure?.name].filter(Boolean);

  return (
    <header className="viewer-topbar">
      <div className="flex min-w-0 items-center gap-2">
        <button className="viewer-soft-button" onClick={onToggleLeft} aria-label={t("viewer.togglePanel")} data-tooltip={t("viewer.togglePanel")}>
          <LineIcon name="menu" />
          <span className="hidden sm:inline">{t("viewer.panel")}</span>
        </button>
        <button className="viewer-soft-button" onClick={() => navigate("/dashboard")}>
          <LineIcon name="home" className="h-4 w-4" />
          <span>{t("viewer.home")}</span>
        </button>
        <button className="viewer-soft-button" onClick={() => navigate("/models")}>
          <LineIcon name="library" className="h-4 w-4" />
          <span>{t("viewer.library")}</span>
        </button>
        <span className="md:hidden"><LanguageSelector compact /></span>
      </div>

      <div className="min-w-0 flex-1 px-2">
        <div className="flex min-w-0 items-center gap-2 overflow-hidden text-xs uppercase tracking-[0.24em] text-textMuted">
          {breadcrumb.map((item, index) => (
            <span key={`${item}-${index}`} className="flex min-w-0 items-center gap-2">
              <span className={index === breadcrumb.length - 1 ? "truncate text-clinicalWhite" : "truncate"}>{item}</span>
              {index < breadcrumb.length - 1 ? <span className="text-agedGold/70">/</span> : null}
            </span>
          ))}
        </div>
        <div className="mt-1 truncate font-serif text-lg uppercase tracking-[0.18em] text-clinicalWhite">
          {structure?.name || model.title}
        </div>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <LanguageSelector compact />
        <span className="rounded-full border border-selectionGreen/30 bg-selectionGreen/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-selectionGreen">
          {t("viewer.activeStructure")}
        </span>
      </div>
    </header>
  );
}

function ViewerContent({ id, user, navigate, notify, onLogout }) {
  const { t } = useLanguage();

  const modelState = useViewerModel(id, user);
  const annotationsState = useViewerAnnotations(modelState.model);
  
  const [toast, setToast] = useState("");
  const [leftOpen, setLeftOpen] = useState(() => window.innerWidth >= 1180);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [activeMarkerId, setActiveMarkerId] = useState(null);
  const [nativeMarkers, setNativeMarkers] = useState([]);

  const progressState = useViewerProgress(modelState.model, user, setToast);
  const quizState = useViewerQuiz(modelState.model, user, annotationsState, setToast, setLeftOpen);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!modelState.model?.id) return;
    if (modelState.model.viewerType === 'atlas-native' || modelState.model.viewer_engine === 'atlas' || modelState.model.viewer_engine === 'atlas-native') {
      atlasAssetStorageService.loadAnnotations(modelState.model.id).then(loadedMarkers => {
        if (loadedMarkers && loadedMarkers.length > 0) {
          setNativeMarkers(loadedMarkers);
        } else if (modelState.model.markers && modelState.model.markers.length > 0) {
          setNativeMarkers(modelState.model.markers);
        }
      });
    }
  }, [modelState.model?.id, modelState.model?.viewerType, modelState.model?.viewer_engine]);

  function handleSelectStructure(structure) {
    if (!structure) return;
    modelState.setActiveStructure(structure);
    modelState.setActivePart(null);
    setLeftOpen(true);
    setToast(t("viewer.selectedStructure", { structure: structure.name }));
  }

  function handleSelectPart(part) {
    if (!part) return;
    modelState.setActivePart(part);
    modelState.setActiveStructure(prev => ({
      ...prev,
      name: part.name,
      latinName: part.latinName,
      description: part.description || prev.description,
      breadcrumb: [...(prev.breadcrumb || []), part.name]
    }));
    setToast(t("viewer.highlightedPart", { part: part.name }));
  }

  function handleViewerAction(action) {
    if (!modelState.model?.id) return;
    const model = modelState.model;
    const externalUrl = model.externalUrl || model.sketchfabModelUrl || model.shortUrl;
    
    const actions = {
      "Abrir no Sketchfab": () => {
        if (externalUrl) {
          trackEvent({ userId: user?.id, institutionId: user?.institutionId, modelId: model.id, eventType: "open_external_sketchfab" });
          window.open(externalUrl, "_blank", "noopener,noreferrer");
        }
        else setToast(t("viewer.externalLinkMissing"));
      },
      "Favoritar": progressState.handleFavorite,
      "Marcar como estudado": progressState.handleToggleStudied,
      "Copiar link do modelo": async () => {
        const link = `${window.location.origin}/viewer/${model.slug || model.id}`;
        await navigator.clipboard?.writeText(link);
        trackEvent({ userId: user?.id, institutionId: user?.institutionId, modelId: model.id, eventType: "copy_model_link" });
        setToast(t("viewer.linkCopied"));
      },
      "Registrar acesso": progressState.handleRegisterAccess,
      "Anotações": () => setNotesOpen(true),
      "Simulado Anatômico": quizState.handleOpenAnatomicalQuiz,
      "Simulado Teórico": () => {
        quizState.setTheoreticalQuizOpen(true);
        setLeftOpen(false);
        trackEvent({
          userId: user?.id,
          institutionId: user?.institutionId,
          role: user?.role,
          modelId: model.id,
          eventType: "start_theoretical_quiz"
        });
      },
      "Voltar para biblioteca": () => navigate("/models"),
      "Reportar problema": () => setToast(t("viewer.reportRegistered")),
      "Ver guia de estudo": () => {
        setLeftOpen(true);
        setToast(t("viewer.guideAvailable"))
      }
    };
    (actions[action] || (() => setToast(t("viewer.functionPrepared", { action }))))();
  }

  if (modelState.loading) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <Card className="max-w-lg text-center">
          <p className="eyebrow">{t("common.loading")}</p>
          <h1 className="display-title">{t("models.catalogLoading")}</h1>
        </Card>
      </main>
    );
  }

  if (!modelState.model || !modelState.activeStructure) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <Card className="max-w-lg text-center">
          <h1 className="display-title">{t("models.modelNotFound")}</h1>
          <p className="mt-4 text-textMuted">{t("models.emptyCatalog")}</p>
        </Card>
      </main>
    );
  }

  const contextValue = {
    ...modelState,
    annotations: annotationsState,
    progress: progressState,
    quiz: quizState,
    user,
    navigate,
    notify,
    onLogout,
    toast,
    setToast,
    leftOpen,
    setLeftOpen,
    searchOpen,
    setSearchOpen,
    settingsOpen,
    setSettingsOpen,
    helpOpen,
    setHelpOpen,
    notesOpen,
    setNotesOpen,
    handleSelectStructure,
    handleSelectPart,
    handleViewerAction
  };

  return (
    <ViewerContext.Provider value={contextValue}>
      <div className="viewer-shell">
        <TopViewerBar
          model={modelState.model}
          structure={modelState.activeStructure}
          navigate={navigate}
          onToggleLeft={() => setLeftOpen(value => !value)}
        />

        <main className={`viewer-stage viewer-layout ${leftOpen ? "" : "is-panel-collapsed"}`}>
          <ViewerSidebar />
          {modelState.model.viewerType === 'atlas-native' || modelState.model.viewer_engine === 'atlas' || modelState.model.viewer_engine === 'atlas-native' ? (
            <>
              {(!modelState.model.atlasAssetObjectUrl && !modelState.model.atlasEngineModelUrl && !modelState.model.model_url) && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-blackDeep z-50 p-6">
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 max-w-md text-center">
                       <h3 className="text-xl font-bold text-amber-400 mb-2">Arquivo 3D Ausente</h3>
                       <p className="text-amber-200/80 mb-4 text-sm">Este modelo nativo ainda não possui um arquivo .glb/.obj vinculado, ou o link local temporário foi perdido após um refresh.</p>
                       <p className="text-xs text-textMuted">Acesse o CMS para realizar o upload do Asset 3D.</p>
                    </div>
                 </div>
              )}
              <div className="absolute inset-0">
                <AtlasViewerShell 
                  modelUrl={modelState.model.atlasAssetObjectUrl || modelState.model.atlasEngineModelUrl || modelState.model.model_url || "/models/test-anatomy.glb"} 
                  modelFormat={modelState.model.modelFormat || modelState.model.model_format || "glb"}
                  markers={nativeMarkers.length > 0 ? nativeMarkers : atlasMarkersMock}
                  onMarkerSelect={setActiveMarkerId}
                />
              </div>
              <AnatomyLayerPanel />
              <AtlasAIViewerPanel />
              <AnatomyKnowledgePanel activeMarkerId={activeMarkerId} />
            </>
          ) : (
            <ViewerSketchfab />
          )}
          <ViewerControls />
        </main>

        <ViewerAnnotations />
        <ViewerQuiz />

        {toast ? <div className="viewer-toast">{toast}</div> : null}
      </div>
    </ViewerContext.Provider>
  );
}

export default function ViewerPage(props) {
  return <ViewerContent {...props} />;
}
