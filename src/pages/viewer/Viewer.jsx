import { useEffect, useMemo, useState } from "react";
import LeftInfoPanel from "../../components/LeftInfoPanel/LeftInfoPanel";
import LineIcon from "../../components/icons/LineIcon";
import LanguageSelector from "../../components/LanguageSelector";
import ModelViewer from "../../components/ModelViewer/ModelViewer";
import RightToolbar from "../../components/RightToolbar/RightToolbar";
import SearchOverlay from "../../components/SearchOverlay/SearchOverlay";
import SettingsPanel from "../../components/SettingsPanel/SettingsPanel";
import { mockModels } from "../../data/mockModels";
import { getStructureForModel } from "../../data/mockStructures";
import { completeModel, favoriteModel, trackEvent } from "../../services/analyticsService";
import { trackModelAccess } from "../../services/progressService";
import { useLanguage } from "../../context/LanguageContext";
import { translateModelSummary } from "../../utils/modelI18n";

function getModel(id) {
  const normalizedId = id === "coracao-humano" ? "coracao-humano-superficial" : id;
  return mockModels.find(item => item.id === normalizedId) || mockModels[0];
}

function buildStructure(model, t) {
  const structure = getStructureForModel(model.id);
  if (structure) {
    return {
      ...structure,
      name: model.title,
      system: model.system,
      region: model.region || model.category,
      location: model.region || structure.location,
      type: model.level || structure.type,
      description: model.overview || model.description || structure.description,
      keyFeatures: model.relatedStructures?.length ? model.relatedStructures : structure.keyFeatures,
      function: model.function || t("viewer.fallbackStructure.function"),
      clinicalNotes: model.clinicalNotes || structure.clinicalNotes,
      breadcrumb: [model.system, model.region || model.category, model.shortTitle || model.title].filter(Boolean),
      parts: (structure.parts || []).map((part, index) => ({
        ...part,
        name: model.structures?.[index] || model.relatedStructures?.[index] || part.name,
        description: model.studyGuide?.[index] || part.description
      })),
      surfaces: model.structures?.length ? model.structures.slice(0, 5) : structure.surfaces,
      markers: model.relatedStructures?.length ? model.relatedStructures.slice(0, 5) : structure.markers
    };
  }

  return {
    id: `${model.id}-main`,
    name: model.title,
    latinName: model.latinName || "Structura anatomica",
    system: model.system,
    region: model.region || model.category,
    location: model.region || model.category,
    type: model.level,
    description: model.description,
    keyFeatures: model.relatedStructures?.length ? model.relatedStructures : [
      t("viewer.fallbackStructure.interactiveModel"),
      t("viewer.fallbackStructure.academicContext"),
      t("viewer.fallbackStructure.references")
    ],
    function: t("viewer.fallbackStructure.function"),
    clinicalNotes: model.clinicalNotes || t("viewer.fallbackStructure.clinicalNotes"),
    breadcrumb: [model.system || "Sistema", model.region || model.category, model.title],
    parts: [
      { id: `${model.id}-part-1`, name: t("viewer.fallbackStructure.mainStructure"), latinName: "Pars principalis", description: t("viewer.fallbackStructure.mainStructureDescription") },
      { id: `${model.id}-part-2`, name: t("viewer.fallbackStructure.anatomicalLandmark"), latinName: "Punctum anatomicum", description: t("viewer.fallbackStructure.anatomicalLandmarkDescription") }
    ],
    surfaces: [t("viewer.surfacesList.anterior"), t("viewer.surfacesList.posterior"), t("viewer.surfacesList.superiorMargin"), t("viewer.surfacesList.inferiorMargin")],
    markers: [t("viewer.markersList.topographicReference"), t("viewer.markersList.clinicalCorrelation"), t("viewer.markersList.guidedStudy")],
    sections: [t("viewer.planes.axial"), t("viewer.planes.coronal"), t("viewer.planes.sagittal")]
  };
}

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

function HelpModal({ open, onClose }) {
  const { t } = useLanguage();
  if (!open) return null;

  const items = [t("viewer.supportItems.platformGuide"), t("viewer.supportItems.study3d"), t("viewer.supportItems.customerService"), t("viewer.supportItems.technicalSupport")];

  return (
    <div className="viewer-modal-backdrop" role="dialog" aria-modal="true">
      <div className="viewer-modal">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="viewer-eyebrow">{t("viewer.helpTitle")}</p>
            <h2 className="mt-2 text-2xl font-bold text-clinicalWhite">{t("viewer.supportTitle")}</h2>
          </div>
          <button className="viewer-icon-button" onClick={onClose} aria-label={t("viewer.closeHelp")} data-tooltip={t("viewer.closeHelp")}>
            <LineIcon name="close" />
          </button>
        </div>
        <div className="mt-6 grid gap-3">
          {items.map(item => (
            <button key={item} className="viewer-list-row text-left">
              <span>{item}</span>
              <LineIcon name="chevron" className="h-4 w-4 text-techTeal" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Viewer({ id, user, navigate, notify, onLogout }) {
  const { t } = useLanguage();
  const rawModel = useMemo(() => getModel(id), [id]);
  const model = useMemo(() => translateModelSummary(rawModel, t), [rawModel, t]);
  const initialStructure = useMemo(() => buildStructure(model, t), [model, t]);
  const [activeStructure, setActiveStructure] = useState(initialStructure);
  const [activePart, setActivePart] = useState(null);
  const [leftOpen, setLeftOpen] = useState(() => window.innerWidth >= 1180);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState("");
  const accessLocked = false;
  const isSketchfabModel = Boolean(model?.sketchfabEmbedUrl || model?.sketchfabUrl || model?.sketchfab_url);
  const structures = useMemo(() => {
    const parts = (activeStructure.parts || []).map(part => ({
      ...activeStructure,
      id: part.id,
      name: part.name,
      latinName: part.latinName,
      description: part.description,
      breadcrumb: [...(activeStructure.breadcrumb || []), part.name]
    }));
    return [activeStructure, ...parts];
  }, [activeStructure]);

  useEffect(() => {
    setActiveStructure(initialStructure);
    setActivePart(null);
  }, [initialStructure]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [model.id]);

  useEffect(() => {
    const startedAt = Date.now();
    trackEvent({ userId: user?.id, institutionId: user?.institutionId, modelId: model.id, eventType: "open_model_viewer" });
    trackModelAccess(user, model.id, { action: "open_model_viewer" });

    return () => {
      trackEvent({
        userId: user?.id,
        institutionId: user?.institutionId,
        modelId: model.id,
        eventType: "viewer_duration",
        metadata: { durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)) }
      });
      trackModelAccess(user, model.id, {
        action: "viewer_duration",
        startedAt: new Date(startedAt).toISOString(),
        endedAt: new Date().toISOString(),
        durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000))
      });
    };
  }, [model.id, user?.id, user?.institutionId]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function showToast(message) {
    setToast(message);
    if (notify) notify(message);
  }

  function handleViewerAction(action) {
    const externalUrl = model.externalUrl || model.sketchfabModelUrl || model.shortUrl;
    const actions = {
      "Abrir no Sketchfab": () => {
        if (externalUrl) {
          trackEvent({ userId: user?.id, institutionId: user?.institutionId, modelId: model.id, eventType: "open_external_sketchfab" });
          window.open(externalUrl, "_blank", "noopener,noreferrer");
        }
        else showToast(t("viewer.externalLinkMissing"));
      },
      "Favoritar": () => {
        const added = favoriteModel(user, model);
        showToast(added ? t("viewer.favoriteAdded") : t("viewer.favoriteRemoved"));
      },
      "Marcar como estudado": () => {
        completeModel(user, model);
        showToast(t("viewer.modelCompleted"));
      },
      "Copiar link do modelo": async () => {
        const link = `${window.location.origin}/viewer/${model.id}`;
        await navigator.clipboard?.writeText(link);
        trackEvent({ userId: user?.id, institutionId: user?.institutionId, modelId: model.id, eventType: "copy_model_link" });
        showToast(t("viewer.linkCopied"));
      },
      "Registrar acesso": () => {
        trackEvent({ userId: user?.id, institutionId: user?.institutionId, modelId: model.id, eventType: "open_model_viewer", metadata: { source: "manual_button" } });
        trackModelAccess(user, model.id, { action: "open_model_viewer" });
        showToast(t("viewer.accessRegistered"));
      },
      "Voltar para biblioteca": () => navigate("/models"),
      "Reportar problema": () => showToast(t("viewer.reportRegistered")),
      "Ver guia de estudo": () => {
        setLeftOpen(true);
        showToast(t("viewer.guideAvailable"))
      }
    };
    (actions[action] || (() => showToast(t("viewer.functionPrepared", { action }))))();
  }

  function handleSelectStructure(structure) {
    setActiveStructure(structure);
    setActivePart(null);
    setLeftOpen(true);
    showToast(t("viewer.selectedStructure", { structure: structure.name }));
  }

  function handleSelectPart(part) {
    setActivePart(part);
    setActiveStructure(prev => ({
      ...prev,
      name: part.name,
      latinName: part.latinName,
      description: part.description || prev.description,
      breadcrumb: [...(prev.breadcrumb || []), part.name]
    }));
    showToast(t("viewer.highlightedPart", { part: part.name }));
  }

  function handleSketchfabEvent(event) {
    trackEvent({
      ...event,
      userId: user?.id,
      institutionId: user?.institutionId,
      role: user?.role || "student",
      modelId: model.id,
      eventType: event.eventType || event.type,
      metadata: {
        ...(event.metadata || {}),
        modelUid: event.modelUid,
        annotationIndex: event.annotationIndex,
        source: "sketchfab_viewer_api"
      }
    });
  }

  function handleRightAction(action) {
    const actions = {
      hub: () => navigate("/dashboard"),
      search: () => setSearchOpen(true),
      library: () => navigate("/models"),
      settings: () => setSettingsOpen(true),
      guide: () => handleViewerAction("Ver guia de estudo"),
      help: () => setHelpOpen(true)
    };
    actions[action]?.();
  }

  return (
    <div className="viewer-shell">
        <TopViewerBar
          model={model}
          structure={activeStructure}
          navigate={navigate}
          onToggleLeft={() => setLeftOpen(value => !value)}
        />

      <main className={`viewer-stage viewer-layout ${leftOpen ? "" : "is-panel-collapsed"}`}>
        <LeftInfoPanel
          open={leftOpen}
          structure={activeStructure}
          model={model}
          actions={[]}
          activePart={activePart}
          onAction={handleViewerAction}
          onSelectPart={handleSelectPart}
          onClose={() => setLeftOpen(false)}
          academicMode={isSketchfabModel}
        />

        <div className="viewer-main">
          <div className="viewer-scroll-content">
            <ModelViewer
              model={model}
              structure={activeStructure}
              structures={structures}
              activePart={activePart}
              accessLocked={accessLocked}
              onSelectStructure={handleSelectStructure}
              onViewerAction={handleViewerAction}
              onViewerEvent={handleSketchfabEvent}
              onRequestAccess={() => navigate("/license")}
              currentUser={user}
            />
          </div>
        </div>

        <RightToolbar onAction={handleRightAction} />
      </main>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        models={mockModels}
        structures={structures}
        onSelectStructure={handleSelectStructure}
        onOpenModel={modelId => navigate(`/viewer/${modelId}`)}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        notify={showToast}
        onLogout={onLogout}
      />

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      {toast ? <div className="viewer-toast">{toast}</div> : null}
    </div>
  );
}
