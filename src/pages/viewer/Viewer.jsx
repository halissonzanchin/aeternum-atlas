import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AnatomicalQuizModal from "../../components/AnatomicalQuiz/AnatomicalQuizModal";
import TheoreticalQuizModal from "../../components/TheoreticalQuiz/TheoreticalQuizModal";
import LeftInfoPanel from "../../components/LeftInfoPanel/LeftInfoPanel";
import LineIcon from "../../components/icons/LineIcon";
import LanguageSelector from "../../components/LanguageSelector";
import ModelViewer from "../../components/ModelViewer/ModelViewer";
import RightToolbar from "../../components/RightToolbar/RightToolbar";
import SearchOverlay from "../../components/SearchOverlay/SearchOverlay";
import SettingsPanel from "../../components/SettingsPanel/SettingsPanel";
import { getStructureForModel } from "../../data/mockStructures";
import Card from "../../components/Card/Card";
import { completeModel, favoriteModel, trackEvent } from "../../services/analyticsService";
import { getAnatomicalQuizForModel, gradeAnatomicalQuiz, recordAnatomicalQuizAttempt } from "../../services/anatomicalQuizService";
import { listModelAnnotations } from "../../services/modelAnnotationService";
import { exportModelNotePdf, getModelNote, saveModelNote } from "../../services/modelNotesService";
import { getModelByIdForUser, listModelsForUser } from "../../services/modelService";
import { isFavoriteModel, isModelStudied, trackModelAccess, unmarkModelAsStudied } from "../../services/progressService";
import { useLanguage } from "../../context/LanguageContext";
import { translateModelSummary } from "../../utils/modelI18n";

function buildStructure(model, t) {
  const structure = getStructureForModel(model.slug || model.id);
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

function formatNoteTimestamp(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function NotesModal({ open, model, content, updatedAt, onChange, onClose, onSave, onExport }) {
  const { t } = useLanguage();
  if (!open) return null;

  const updatedLabel = updatedAt
    ? t("viewer.notesUpdatedAt", { date: formatNoteTimestamp(updatedAt) })
    : t("viewer.notesNotSaved");

  return (
    <div className="viewer-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="viewer-notes-title">
      <div className="viewer-modal viewer-notes-modal">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="viewer-eyebrow">{t("viewer.notesEyebrow")}</p>
            <h2 id="viewer-notes-title" className="mt-2 text-2xl font-bold text-clinicalWhite">{t("viewer.notesTitle")}</h2>
            <p className="viewer-notes-model">{model?.title}</p>
          </div>
          <button className="viewer-icon-button" onClick={onClose} aria-label={t("viewer.closeNotes")} data-tooltip={t("viewer.closeNotes")}>
            <LineIcon name="close" />
          </button>
        </div>

        <textarea
          className="viewer-notes-textarea"
          value={content}
          onChange={event => onChange(event.target.value)}
          placeholder={t("viewer.notesPlaceholder")}
          autoFocus
        />

        <div className="viewer-notes-footer">
          <p className="viewer-notes-meta">
            <span>{updatedLabel}</span>
            <span>{t("viewer.notesCharacters", { count: content.length })}</span>
          </p>
          <div className="viewer-notes-actions">
            <button type="button" className="viewer-secondary-button" onClick={onClose}>
              {t("viewer.closeNotes")}
            </button>
            <button type="button" className="viewer-secondary-button" onClick={onSave}>
              <LineIcon name="check" className="h-4 w-4" />
              {t("viewer.saveNotes")}
            </button>
            <button type="button" className="viewer-primary-button" onClick={onExport}>
              <LineIcon name="note" className="h-4 w-4" />
              {t("viewer.exportNotesPdf")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Viewer({ id, user, navigate, notify, onLogout }) {
  const { t } = useLanguage();
  const [rawModel, setRawModel] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const model = useMemo(() => translateModelSummary(rawModel, t), [rawModel, t]);
  const initialStructure = useMemo(() => model ? buildStructure(model, t) : null, [model, t]);
  const [activeStructure, setActiveStructure] = useState(null);
  const [activePart, setActivePart] = useState(null);
  const [leftOpen, setLeftOpen] = useState(() => window.innerWidth >= 1180);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteUpdatedAt, setNoteUpdatedAt] = useState(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizStartedAt, setQuizStartedAt] = useState(null);
  const [quizTimeRemaining, setQuizTimeRemaining] = useState(300);
  const [theoreticalQuizOpen, setTheoreticalQuizOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [studied, setStudied] = useState(false);
  const [accessRegistered, setAccessRegistered] = useState(false);
  const [sketchfabAnnotations, setSketchfabAnnotations] = useState([]);
  const [activeAnnotationIndex, setActiveAnnotationIndex] = useState(null);
  const [annotationNavigationRequest, setAnnotationNavigationRequest] = useState(null);
  const quizAnswersRef = useRef({});
  const quizFinishLockRef = useRef(false);
  const accessLocked = false;
  const isSketchfabModel = Boolean(model?.sketchfabEmbedUrl || model?.sketchfabUrl || model?.sketchfab_url);
  const anatomicalStructures = useMemo(
    () => sketchfabAnnotations.map(annotation => annotation.name).filter(Boolean),
    [sketchfabAnnotations]
  );
  const structures = useMemo(() => {
    if (!activeStructure) return [];
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
    let mounted = true;
    setLoading(true);

    Promise.all([
      getModelByIdForUser(id, user),
      listModelsForUser(user)
    ])
      .then(([modelRecord, models]) => {
        if (!mounted) return;
        setRawModel(modelRecord);
        setAvailableModels(models);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, user]);

  useEffect(() => {
    setActiveStructure(initialStructure);
    setActivePart(null);
  }, [initialStructure]);

  useEffect(() => {
    setFavorite(model?.id ? isFavoriteModel(user, model.id) : false);
    setStudied(model?.id ? isModelStudied(user, model.id) : false);
    setAccessRegistered(false);
  }, [model?.id, user]);

  useEffect(() => {
    if (!model?.id) {
      setNoteContent("");
      setNoteUpdatedAt(null);
      return;
    }

    const savedNote = getModelNote(user, model.id);
    setNoteContent(savedNote.content || "");
    setNoteUpdatedAt(savedNote.updatedAt || null);
  }, [model?.id, user]);

  useEffect(() => {
    if (!model?.id) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setSketchfabAnnotations([]);
    setActiveAnnotationIndex(null);
    setAnnotationNavigationRequest(null);
    setQuizOpen(false);
    setActiveQuiz(null);
    setQuizResult(null);
    setQuizStartedAt(null);
    setQuizAnswers({});
    setTheoreticalQuizOpen(false);
    quizAnswersRef.current = {};
  }, [model?.id]);

  useEffect(() => {
    if (!model?.id || !isSketchfabModel) return undefined;
    let mounted = true;

    listModelAnnotations(model.id).then(annotations => {
      if (!mounted || !annotations.length) return;
      setSketchfabAnnotations(annotations);
      setActiveAnnotationIndex(current => Number.isInteger(current) ? current : 0);
    });

    return () => {
      mounted = false;
    };
  }, [isSketchfabModel, model?.id]);

  useEffect(() => {
    if (!model?.id) return undefined;
    const startedAt = Date.now();
    trackEvent({ userId: user?.id, institutionId: user?.institutionId, modelId: model.id, eventType: "open_model_viewer" });
    trackModelAccess(user, model.id, { action: "open_model_viewer", model });

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
        model,
        startedAt: new Date(startedAt).toISOString(),
        endedAt: new Date().toISOString(),
        durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000))
      });
    };
  }, [model?.id, user?.id, user?.institutionId]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function showToast(message) {
    setToast(message);
  }

  function handleSaveNotes() {
    if (!model?.id) return;

    const savedNote = saveModelNote(user, model, noteContent);
    setNoteContent(savedNote.content);
    setNoteUpdatedAt(savedNote.updatedAt);
    trackEvent({
      userId: user?.id,
      institutionId: user?.institutionId,
      role: user?.role,
      modelId: model.id,
      eventType: "save_model_notes",
      metadata: { characters: savedNote.content.length }
    });
    showToast(t("viewer.notesSaved"));
  }

  function handleExportNotes() {
    if (!model?.id) return;

    const savedNote = saveModelNote(user, model, noteContent);
    setNoteContent(savedNote.content);
    setNoteUpdatedAt(savedNote.updatedAt);

    if (!savedNote.content.trim()) {
      showToast(t("viewer.notesEmpty"));
      return;
    }

    const filename = exportModelNotePdf({ user, model, note: savedNote });
    trackEvent({
      userId: user?.id,
      institutionId: user?.institutionId,
      role: user?.role,
      modelId: model.id,
      eventType: "export_model_notes_pdf",
      metadata: { filename, characters: savedNote.content.length }
    });
    showToast(t("viewer.notesExported"));
  }

  async function handleOpenAnatomicalQuiz() {
    if (!model?.id) return;

    setQuizOpen(true);
    setQuizLoading(true);
    setQuizResult(null);
    setQuizAnswers({});
    quizAnswersRef.current = {};
    quizFinishLockRef.current = false;
    setLeftOpen(false);

    try {
      let annotations = sketchfabAnnotations;

      if (!annotations.length && isSketchfabModel) {
        annotations = await listModelAnnotations(model.id);
        if (annotations.length) {
          setSketchfabAnnotations(annotations);
          setActiveAnnotationIndex(current => Number.isInteger(current) ? current : 0);
        }
      }

      const nextQuiz = await getAnatomicalQuizForModel({ model, user, annotations });
      const startedAt = new Date().toISOString();

      setActiveQuiz(nextQuiz);
      setQuizStartedAt(startedAt);
      setQuizTimeRemaining(nextQuiz?.timeLimitSeconds || 300);

      if (!nextQuiz?.questions?.length) {
        showToast(t("viewer.anatomicalQuizUnavailable"));
        return;
      }

      trackEvent({
        userId: user?.id,
        institutionId: user?.institutionId,
        role: user?.role,
        modelId: model.id,
        eventType: "start_anatomical_quiz",
        metadata: {
          quizId: nextQuiz.id,
          quizSource: nextQuiz.source,
          totalQuestions: nextQuiz.questions.length,
          timeLimitSeconds: nextQuiz.timeLimitSeconds
        }
      });
    } catch (error) {
      console.error("[anatomical_quiz] Não foi possível iniciar o simulado.", error);
      setActiveQuiz(null);
      showToast(t("viewer.anatomicalQuizStartError"));
    } finally {
      setQuizLoading(false);
    }
  }

  const handleFinishAnatomicalQuiz = useCallback(async (status = "completed") => {
    if (!activeQuiz?.questions?.length || quizResult || quizFinishLockRef.current) return;

    quizFinishLockRef.current = true;
    const finishedAt = new Date().toISOString();
    const result = gradeAnatomicalQuiz({
      quiz: activeQuiz,
      answers: quizAnswersRef.current,
      startedAt: quizStartedAt,
      finishedAt,
      status
    });

    setQuizResult(result);

    try {
      await recordAnatomicalQuizAttempt({ quiz: activeQuiz, model, user, result });
    } catch (error) {
      console.warn("[anatomical_quiz] Falha ao registrar tentativa remota/local.", error);
    }

    trackEvent({
      userId: user?.id,
      institutionId: user?.institutionId,
      role: user?.role,
      modelId: model?.id,
      eventType: "finish_anatomical_quiz",
      metadata: {
        quizId: activeQuiz.id,
        quizSource: activeQuiz.source,
        score: result.score,
        totalQuestions: result.totalQuestions,
        percentage: result.percentage,
        status
      }
    });

    showToast(t("viewer.anatomicalQuizCompleted", {
      score: result.score,
      total: result.totalQuestions,
      percentage: result.percentage
    }));
  }, [activeQuiz, model, quizResult, quizStartedAt, t, user]);

  function handleQuizAnswerChange(questionId, value) {
    const nextAnswers = {
      ...quizAnswersRef.current,
      [questionId]: value
    };

    quizAnswersRef.current = nextAnswers;
    setQuizAnswers(nextAnswers);
  }

  function handleQuizQuestionNavigate(question) {
    if (!question || quizResult) return;

    const rawIndex = Number.isFinite(Number(question.annotationIndex))
      ? Number(question.annotationIndex)
      : Number(question.markerNumber) - 1;
    const index = Math.trunc(rawIndex);

    if (!Number.isInteger(index) || index < 0) return;

    setActiveAnnotationIndex(index);
    setAnnotationNavigationRequest({
      index,
      silent: true,
      source: "anatomical_quiz",
      requestId: `${model?.id || "model"}-quiz-${index}-${Date.now()}`
    });
  }

  useEffect(() => {
    if (!quizOpen || quizLoading || !activeQuiz?.questions?.length || quizResult || !quizStartedAt) return undefined;

    function tick() {
      const elapsedSeconds = Math.floor((Date.now() - new Date(quizStartedAt).getTime()) / 1000);
      const remaining = Math.max(0, (activeQuiz.timeLimitSeconds || 300) - elapsedSeconds);
      setQuizTimeRemaining(remaining);

      if (remaining <= 0) {
        handleFinishAnatomicalQuiz("time_expired");
      }
    }

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [activeQuiz, handleFinishAnatomicalQuiz, quizLoading, quizOpen, quizResult, quizStartedAt]);

  function handleViewerAction(action) {
    if (!model?.id) return;
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
        setFavorite(added);
        showToast(added ? t("viewer.favoriteAdded") : t("viewer.favoriteRemoved"));
      },
      "Marcar como estudado": () => {
        const nextStudied = !studied;

        if (nextStudied) {
          completeModel(user, model);
          showToast(t("viewer.modelCompleted"));
        } else {
          unmarkModelAsStudied(user, model.id);
          trackEvent({
            userId: user?.id,
            institutionId: user?.institutionId,
            role: user?.role,
            modelId: model.id,
            eventType: "uncomplete_model"
          });
          showToast(t("viewer.modelUnmarked"));
        }

        setStudied(nextStudied);
      },
      "Copiar link do modelo": async () => {
        const link = `${window.location.origin}/viewer/${model.slug || model.id}`;
        await navigator.clipboard?.writeText(link);
        trackEvent({ userId: user?.id, institutionId: user?.institutionId, modelId: model.id, eventType: "copy_model_link" });
        showToast(t("viewer.linkCopied"));
      },
      "Registrar acesso": () => {
        const nextAccessRegistered = !accessRegistered;

        if (nextAccessRegistered) {
          trackEvent({ userId: user?.id, institutionId: user?.institutionId, modelId: model.id, eventType: "open_model_viewer", metadata: { source: "manual_button" } });
          trackModelAccess(user, model.id, { action: "open_model_viewer", model });
          showToast(t("viewer.accessRegistered"));
        } else {
          showToast(t("viewer.accessUnregistered"));
        }

        setAccessRegistered(nextAccessRegistered);
      },
      "Anotações": () => setNotesOpen(true),
      "Simulado Anatômico": () => handleOpenAnatomicalQuiz(),
      "Simulado Teórico": () => {
        setTheoreticalQuizOpen(true);
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
      "Reportar problema": () => showToast(t("viewer.reportRegistered")),
      "Ver guia de estudo": () => {
        setLeftOpen(true);
        showToast(t("viewer.guideAvailable"))
      }
    };
    (actions[action] || (() => showToast(t("viewer.functionPrepared", { action }))))();
  }

  function handleSelectStructure(structure) {
    if (!structure) return;
    setActiveStructure(structure);
    setActivePart(null);
    setLeftOpen(true);
    showToast(t("viewer.selectedStructure", { structure: structure.name }));
  }

  function handleSelectPart(part) {
    if (!part) return;
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

  function handleAnnotationsLoad(annotations = []) {
    setSketchfabAnnotations(annotations);
    setActiveAnnotationIndex(current => Number.isInteger(current) ? current : (annotations.length ? 0 : null));
  }

  function handleSelectAnatomicalStructure(item, index) {
    const annotation = sketchfabAnnotations[index];
    if (!annotation || !Number.isInteger(index)) return;

    setActiveAnnotationIndex(index);
    setAnnotationNavigationRequest({
      index,
      requestId: `${model?.id || "model"}-${index}-${Date.now()}`
    });
  }

  function handleSketchfabAnnotationSelect(index) {
    if (!Number.isInteger(index) || index < 0) return;
    setActiveAnnotationIndex(index);
  }

  function handleSketchfabEvent(event) {
    if (!model?.id) return;
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

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <Card className="max-w-lg text-center">
          <p className="eyebrow">{t("common.loading")}</p>
          <h1 className="display-title">{t("models.catalogLoading")}</h1>
        </Card>
      </main>
    );
  }

  if (!model || !activeStructure) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <Card className="max-w-lg text-center">
          <h1 className="display-title">{t("models.modelNotFound")}</h1>
          <p className="mt-4 text-textMuted">{t("models.emptyCatalog")}</p>
        </Card>
      </main>
    );
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
          anatomicalStructures={anatomicalStructures}
          activeAnatomicalIndex={activeAnnotationIndex}
          onSelectAnatomicalStructure={handleSelectAnatomicalStructure}
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
              onAnnotationsLoad={handleAnnotationsLoad}
              onAnnotationSelect={handleSketchfabAnnotationSelect}
              annotationNavigationRequest={annotationNavigationRequest}
              annotationTooltipsHidden={quizOpen && !quizResult}
              isFavorite={favorite}
              isStudied={studied}
              isAccessRegistered={accessRegistered}
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
        models={availableModels}
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

      <NotesModal
        open={notesOpen}
        model={model}
        content={noteContent}
        updatedAt={noteUpdatedAt}
        onChange={setNoteContent}
        onClose={() => setNotesOpen(false)}
        onSave={handleSaveNotes}
        onExport={handleExportNotes}
      />

      <AnatomicalQuizModal
        open={quizOpen}
        model={model}
        quiz={activeQuiz}
        loading={quizLoading}
        answers={quizAnswers}
        result={quizResult}
        timeRemaining={quizTimeRemaining}
        onAnswerChange={handleQuizAnswerChange}
        onQuestionNavigate={handleQuizQuestionNavigate}
        onClose={() => setQuizOpen(false)}
        onFinish={handleFinishAnatomicalQuiz}
        onRestart={handleOpenAnatomicalQuiz}
      />

      <TheoreticalQuizModal
        open={theoreticalQuizOpen}
        model={model}
        user={user}
        onClose={() => setTheoreticalQuizOpen(false)}
        onCompleted={result => {
          trackEvent({
            userId: user?.id,
            institutionId: user?.institutionId,
            role: user?.role,
            modelId: model.id,
            eventType: "finish_theoretical_quiz",
            metadata: {
              score: result.score,
              objectiveTotal: result.objectiveTotal,
              percentage: result.percentage,
              status: result.status
            }
          });
          showToast(`Simulado teórico finalizado: ${result.score}/${result.objectiveTotal} (${result.percentage}%).`);
        }}
      />

      {toast ? <div className="viewer-toast">{toast}</div> : null}
    </div>
  );
}
