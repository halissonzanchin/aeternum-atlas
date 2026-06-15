import { useEffect, useState } from "react";
import ViewerContext from "./ViewerContext";
import { useViewerModel } from "./hooks/useViewerModel";
import { useViewerAnnotations } from "./hooks/useViewerAnnotations";
import { useViewerProgress } from "./hooks/useViewerProgress";
import { useViewerQuiz } from "./hooks/useViewerQuiz";

import ViewerSketchfab from "./ViewerSketchfab";
import ViewerAnnotations from "./ViewerAnnotations";
import ViewerQuiz from "./ViewerQuiz";
import ViewerControls from "./ViewerControls";
import ViewerSidebar from "./ViewerSidebar";

import LineIcon from "../../components/icons/LineIcon";
import LanguageSelector from "../../components/LanguageSelector";
import Card from "../../components/Card/Card";
import { useLanguage } from "../../context/LanguageContext";
import { trackEvent } from "../../services/analyticsService";

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

  const progressState = useViewerProgress(modelState.model, user, setToast);
  const quizState = useViewerQuiz(modelState.model, user, annotationsState, setToast, setLeftOpen);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

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
          <ViewerSketchfab />
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
