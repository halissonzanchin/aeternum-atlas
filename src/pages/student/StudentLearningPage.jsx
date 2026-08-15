import { useMemo, useState } from "react";
import {
  A26Button,
  A26Card,
  A26EmptyState,
  A26Field,
  A26LoadingState,
  A26Metric,
  A26SegmentedControl,
  A26Toolbar
} from "../../components/aeternum-26";
import LineIcon from "../../components/icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";
import { useDashboardData } from "../../features/dashboard/hooks/useDashboardData";
import { getFavoriteModels } from "../../services/progressService";
import { useAtlasAITutorSession } from "../../context/AtlasAITutorSessionContext";
import AtlasAIConversation from "../../features/atlas-viewer/ai/AtlasAIConversation";
import "./StudentLearningPage.css";

const sectionDefinitions = Object.freeze({
  videos: {
    icon: "eye",
    titleKey: "modules.videosTitle",
    textKey: "modules.videosText",
    kind: "unpublished",
    nextPath: "/models"
  },
  courses: {
    icon: "library",
    titleKey: "modules.coursesTitle",
    textKey: "modules.coursesText",
    kind: "course",
    nextPath: "/profile"
  },
  history: {
    icon: "reset",
    titleKey: "modules.historyTitle",
    textKey: "modules.historyText",
    kind: "history",
    nextPath: "/models"
  },
  favorites: {
    icon: "favorite",
    titleKey: "modules.favoritesTitle",
    textKey: "modules.favoritesText",
    kind: "favorites",
    nextPath: "/models"
  },
  progress: {
    icon: "check",
    titleKey: "studentHome.evolutionTitle",
    textKey: "studentHome.evolutionSubtitle",
    kind: "progress",
    nextPath: "/quizzes"
  },
  flashcards: {
    icon: "library",
    titleKey: "studentHome.tools.flashcards.title",
    textKey: "studentHome.tools.flashcards.description",
    kind: "planned",
    nextPath: "/review"
  },
  summaries: {
    icon: "spark",
    titleKey: "studentHome.tools.summaries.title",
    textKey: "studentHome.tools.summaries.description",
    kind: "planned",
    nextPath: "/history"
  },
  "guided-study": {
    icon: "layers",
    titleKey: "studentHome.tools.guidedStudy.title",
    textKey: "studentHome.tools.guidedStudy.description",
    kind: "recommendations",
    nextPath: "/models"
  },
  "ai-tutor": {
    icon: "help",
    titleKey: "studentHome.tools.aiTutor.title",
    textKey: "studentHome.tools.aiTutor.description",
    kind: "tutor",
    nextPath: "/student/home"
  },
  review: {
    icon: "reset",
    titleKey: "studentHome.tools.quickReview.title",
    textKey: "studentHome.tools.quickReview.description",
    kind: "recommendations",
    nextPath: "/quizzes"
  },
  "study-lists": {
    icon: "library",
    titleKey: "modules.studyListsTitle",
    textKey: "modules.studyListsText",
    kind: "planned",
    nextPath: "/favorites"
  },
  classes: {
    icon: "user",
    titleKey: "modules.classesTitle",
    textKey: "modules.classesText",
    kind: "unpublished",
    nextPath: "/courses"
  },
  recommendations: {
    icon: "spark",
    titleKey: "modules.recommendationsTitle",
    textKey: "modules.recommendationsText",
    kind: "recommendations",
    nextPath: "/models"
  },
  "academic-reports": {
    icon: "reset",
    titleKey: "modules.academicReportsTitle",
    textKey: "modules.academicReportsText",
    kind: "progress",
    nextPath: "/history"
  },
  radiology: {
    icon: "search",
    titleKey: "modules.radiologyTitle",
    textKey: "modules.radiologyText",
    kind: "unpublished",
    nextPath: "/atlas"
  }
});

const copy = {
  pt: {
    eyebrow: "Experiência acadêmica",
    source: "Dados da sua conta",
    search: "Filtrar conteúdo",
    searchPlaceholder: "Busque por modelo ou sistema",
    all: "Todos",
    inProgress: "Em andamento",
    completed: "Concluídos",
    open: "Abrir",
    continue: "Continuar estudo",
    explore: "Explorar biblioteca",
    viewProfile: "Revisar perfil",
    startQuiz: "Iniciar simulado",
    noRecords: "Nenhum registro real disponível",
    noRecordsBody: "Quando a instituição publicar conteúdo ou você iniciar uma atividade, ela aparecerá aqui.",
    noHistory: "Seu histórico começa na primeira exploração",
    noHistoryBody: "Abra um modelo 3D para registrar a continuidade do estudo nesta conta.",
    noFavorites: "Nenhum modelo favorito",
    noFavoritesBody: "Favoritos marcados na biblioteca aparecem aqui para acesso rápido.",
    noMatches: "Nenhum resultado para este filtro",
    noMatchesBody: "Limpe a busca ou selecione outra visão para continuar.",
    planned: "Experiência em preparação",
    plannedBody: "Este recurso ainda não possui uma coleção institucional publicada. Use a alternativa disponível sem perder seu contexto.",
    profileCourse: "Formação vinculada",
    profileSemester: "Etapa acadêmica",
    profileInstitution: "Vínculo",
    accessCount: "Acessos registrados",
    studied: "Modelos concluídos",
    favorites: "Favoritos",
    totalTime: "Tempo de estudo",
    progressBySystem: "Continuidade por sistema",
    recentActivity: "Atividade recente",
    tutorTitle: "Tutor disponível em toda a plataforma",
    tutorBody: "Use a esfera flutuante para retomar a mesma conversa em qualquer área. O histórico permanece sincronizado com esta conta.",
    dataNotice: "Somente dados observados na conta são apresentados; ausência de conteúdo é exibida como estado vazio."
  },
  es: {
    eyebrow: "Experiencia académica", source: "Datos de tu cuenta", search: "Filtrar contenido",
    searchPlaceholder: "Busca por modelo o sistema", all: "Todos", inProgress: "En curso", completed: "Completados",
    open: "Abrir", continue: "Continuar estudio", explore: "Explorar biblioteca", viewProfile: "Revisar perfil",
    startQuiz: "Iniciar simulación", noRecords: "No hay registros reales disponibles",
    noRecordsBody: "Cuando la institución publique contenido o inicies una actividad, aparecerá aquí.",
    noHistory: "Tu historial comienza con la primera exploración", noHistoryBody: "Abre un modelo 3D para registrar la continuidad del estudio.",
    noFavorites: "No hay modelos favoritos", noFavoritesBody: "Los favoritos de la biblioteca aparecerán aquí.",
    noMatches: "No hay resultados para este filtro", noMatchesBody: "Limpia la búsqueda o selecciona otra vista.",
    planned: "Experiencia en preparación", plannedBody: "Este recurso aún no tiene una colección institucional publicada.",
    profileCourse: "Formación vinculada", profileSemester: "Etapa académica", profileInstitution: "Vínculo",
    accessCount: "Accesos registrados", studied: "Modelos completados", favorites: "Favoritos", totalTime: "Tiempo de estudio",
    progressBySystem: "Continuidad por sistema", recentActivity: "Actividad reciente",
    tutorTitle: "Tutor disponible en toda la plataforma", tutorBody: "Usa la esfera flotante para retomar la misma conversación en cualquier área.",
    dataNotice: "Solo se muestran datos observados en la cuenta; la ausencia se presenta como estado vacío."
  },
  en: {
    eyebrow: "Academic experience", source: "Your account data", search: "Filter content",
    searchPlaceholder: "Search by model or system", all: "All", inProgress: "In progress", completed: "Completed",
    open: "Open", continue: "Continue studying", explore: "Explore library", viewProfile: "Review profile",
    startQuiz: "Start quiz", noRecords: "No real records available",
    noRecordsBody: "Institutional content and your activity will appear here when available.",
    noHistory: "Your history starts with your first exploration", noHistoryBody: "Open a 3D model to record study continuity.",
    noFavorites: "No favorite models", noFavoritesBody: "Models favorited in the library will appear here.",
    noMatches: "No results for this filter", noMatchesBody: "Clear the search or select another view.",
    planned: "Experience in preparation", plannedBody: "This resource has no institutional collection published yet.",
    profileCourse: "Linked program", profileSemester: "Academic stage", profileInstitution: "Affiliation",
    accessCount: "Recorded accesses", studied: "Completed models", favorites: "Favorites", totalTime: "Study time",
    progressBySystem: "Continuity by system", recentActivity: "Recent activity",
    tutorTitle: "Tutor available across the platform", tutorBody: "Use the floating sphere to resume the same conversation in any area.",
    dataNotice: "Only observed account data is shown; missing content appears as an empty state."
  },
  de: {
    eyebrow: "Akademische Erfahrung", source: "Daten deines Kontos", search: "Inhalte filtern",
    searchPlaceholder: "Nach Modell oder System suchen", all: "Alle", inProgress: "In Bearbeitung", completed: "Abgeschlossen",
    open: "Öffnen", continue: "Weiterlernen", explore: "Bibliothek erkunden", viewProfile: "Profil prüfen",
    startQuiz: "Quiz starten", noRecords: "Keine realen Einträge verfügbar",
    noRecordsBody: "Institutionelle Inhalte und deine Aktivitäten erscheinen hier, sobald sie verfügbar sind.",
    noHistory: "Dein Verlauf beginnt mit der ersten Erkundung", noHistoryBody: "Öffne ein 3D-Modell, um den Lernfortschritt zu speichern.",
    noFavorites: "Keine Favoriten", noFavoritesBody: "In der Bibliothek markierte Favoriten erscheinen hier.",
    noMatches: "Keine Ergebnisse für diesen Filter", noMatchesBody: "Suche löschen oder eine andere Ansicht wählen.",
    planned: "Erfahrung in Vorbereitung", plannedBody: "Für diese Funktion wurde noch keine institutionelle Sammlung veröffentlicht.",
    profileCourse: "Verknüpftes Studium", profileSemester: "Akademische Stufe", profileInstitution: "Zugehörigkeit",
    accessCount: "Erfasste Zugriffe", studied: "Abgeschlossene Modelle", favorites: "Favoriten", totalTime: "Lernzeit",
    progressBySystem: "Fortschritt nach System", recentActivity: "Letzte Aktivität",
    tutorTitle: "Tutor auf der gesamten Plattform verfügbar", tutorBody: "Nutze die schwebende Kugel, um dasselbe Gespräch überall fortzusetzen.",
    dataNotice: "Es werden nur beobachtete Kontodaten gezeigt; fehlende Inhalte erscheinen als Leerzustand."
  }
};

function modelPath(model) {
  return `/viewer/${model?.slug || model?.id}`;
}

function minutesLabel(minutes, language) {
  const value = Math.max(0, Number(minutes) || 0);
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
}

function dateLabel(value, language) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "—";
  const locale = { pt: "pt-BR", es: "es-ES", en: "en-US", de: "de-DE" }[language] || "pt-BR";
  return date.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

function ModelStudyCard({ model, actionLabel, onOpen }) {
  return (
    <A26Card as="article" className="a26-daily-model-card">
      <span className="a26-daily-model-card__system">{model.system || model.region || "Atlas 3D"}</span>
      <h2>{model.shortTitle || model.title}</h2>
      <p>{model.description || model.academicDescription || model.region || "Modelo anatômico interativo."}</p>
      <A26Button variant="liquid" onClick={onOpen} icon={<LineIcon name="layers" />}>
        {actionLabel}
      </A26Button>
    </A26Card>
  );
}

export default function StudentLearningPage({ section, user, navigate }) {
  const { t, language } = useLanguage();
  const labels = copy[language] || copy.pt;
  const definition = sectionDefinitions[section] || sectionDefinitions.history;
  const {
    models,
    modelsLoading,
    logs,
    stats,
    recentModels,
    systemProgress
  } = useDashboardData(user);
  const [query, setQuery] = useState("");
  const [view, setView] = useState("all");

  const favoriteModels = useMemo(() => getFavoriteModels(user, models), [models, user]);
  const progressBySystem = systemProgress;
  const modelsById = useMemo(() => new Map(models.map(model => [model.id, model])), [models]);
  const historyEntries = useMemo(() => (logs || [])
    .map(log => ({ ...log, model: modelsById.get(log.modelId) }))
    .filter(entry => entry.model), [logs, modelsById]);

  const baseModels = definition.kind === "favorites"
    ? favoriteModels
    : definition.kind === "recommendations"
      ? recentModels
      : [];
  const filteredModels = baseModels.filter(model => {
    const haystack = `${model.title || ""} ${model.shortTitle || ""} ${model.system || ""} ${model.region || ""}`.toLowerCase();
    const matchesQuery = haystack.includes(query.trim().toLowerCase());
    const progress = Number(model.progressPercent) || 0;
    const matchesView = view === "all" || (view === "completed" ? progress >= 100 : progress < 100);
    return matchesQuery && matchesView;
  });
  const title = t(definition.titleKey);
  const subtitle = t(definition.textKey);
  const defaultNextLabel = definition.nextPath === "/profile"
    ? labels.viewProfile
    : definition.nextPath === "/quizzes"
      ? labels.startQuiz
      : labels.explore;

  function renderEmpty(titleText = labels.noRecords, bodyText = labels.noRecordsBody) {
    return (
      <A26EmptyState
        title={titleText}
        text={bodyText}
        action={<A26Button variant="primary" onClick={() => navigate(definition.nextPath)}>{defaultNextLabel}</A26Button>}
      />
    );
  }

  function renderBody() {
    if (modelsLoading && ["history", "favorites", "progress", "recommendations"].includes(definition.kind)) {
      return <A26LoadingState title={title} text={labels.source} />;
    }

    if (definition.kind === "history") {
      if (!historyEntries.length) return renderEmpty(labels.noHistory, labels.noHistoryBody);
      return (
        <A26Card className="a26-daily-timeline">
          <h2>{labels.recentActivity}</h2>
          <ol>
            {historyEntries.slice(0, 20).map((entry, index) => (
              <li key={entry.id || `${entry.modelId}-${index}`}>
                <span aria-hidden="true"><LineIcon name="layers" /></span>
                <div>
                  <strong>{entry.model.shortTitle || entry.model.title}</strong>
                  <small>{entry.model.system || entry.model.region || "Atlas 3D"} · {dateLabel(entry.createdAt || entry.startedAt, language)}</small>
                </div>
                <A26Button variant="ghost" onClick={() => navigate(modelPath(entry.model))}>{labels.continue}</A26Button>
              </li>
            ))}
          </ol>
        </A26Card>
      );
    }

    if (definition.kind === "progress") {
      return (
        <>
          <div className="a26-daily-metrics">
            <A26Metric label={labels.accessCount} value={stats.totalAccesses} detail={labels.source} tone="teal" />
            <A26Metric label={labels.studied} value={stats.studiedModels} detail={`${stats.progressPercent}%`} />
            <A26Metric label={labels.favorites} value={stats.favorites} detail={labels.source} tone="gold" />
            <A26Metric label={labels.totalTime} value={minutesLabel(stats.totalStudyMinutes, language)} detail={labels.source} />
          </div>
          {progressBySystem.length ? (
            <A26Card className="a26-daily-progress">
              <h2>{labels.progressBySystem}</h2>
              <div>
                {progressBySystem.map(item => (
                  <article key={item.system}>
                    <header><strong>{item.system}</strong><span>{item.studied}/{item.total}</span></header>
                    <div className="a26-daily-progress__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={item.percent}>
                      <span style={{ width: `${item.percent}%` }} />
                    </div>
                  </article>
                ))}
              </div>
            </A26Card>
          ) : renderEmpty(labels.noHistory, labels.noHistoryBody)}
        </>
      );
    }

    if (definition.kind === "course") {
      const hasCourse = Boolean(user?.course || user?.semester || user?.institutionName || user?.institution);
      if (!hasCourse) return renderEmpty();
      return (
        <A26Card className="a26-daily-course">
          <span className="a26-kicker">{labels.profileCourse}</span>
          <h2>{user?.course || "—"}</h2>
          <dl>
            <div><dt>{labels.profileSemester}</dt><dd>{user?.semester || "—"}</dd></div>
            <div><dt>{labels.profileInstitution}</dt><dd>{user?.institutionName || user?.institution || user?.institutionId || "—"}</dd></div>
          </dl>
          <A26Button variant="liquid" onClick={() => navigate("/profile")}>{labels.viewProfile}</A26Button>
        </A26Card>
      );
    }

    if (definition.kind === "tutor") {
      return <StudentAITutorStudio />;
    }

    if (definition.kind === "planned" || definition.kind === "unpublished") {
      return renderEmpty(
        definition.kind === "planned" ? labels.planned : labels.noRecords,
        definition.kind === "planned" ? labels.plannedBody : labels.noRecordsBody
      );
    }

    if (!baseModels.length) {
      return renderEmpty(
        definition.kind === "favorites" ? labels.noFavorites : labels.noHistory,
        definition.kind === "favorites" ? labels.noFavoritesBody : labels.noHistoryBody
      );
    }

    if (!filteredModels.length) return renderEmpty(labels.noMatches, labels.noMatchesBody);

    return (
      <div className="a26-daily-card-grid">
        {filteredModels.map(model => (
          <ModelStudyCard
            key={model.id}
            model={model}
            actionLabel={labels.open}
            onOpen={() => navigate(modelPath(model))}
          />
        ))}
      </div>
    );
  }

  const supportsFilter = ["favorites", "recommendations"].includes(definition.kind) && baseModels.length > 0;

  return (
    <section
      className="a26-daily-page fade-in-up"
      data-testid="a26-student-experience"
      data-a26-section={section}
      data-a26-source="account-observed"
    >
      <header className="a26-daily-hero">
        <span className="a26-daily-hero__icon" aria-hidden="true"><LineIcon name={definition.icon} /></span>
        <div>
          <p className="a26-kicker">{labels.eyebrow}</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <span className="a26-daily-source"><i aria-hidden="true" />{labels.source}</span>
      </header>

      {supportsFilter ? (
        <A26Toolbar className="a26-daily-toolbar" label={labels.search}>
          <A26Field
            label={labels.search}
            value={query}
            placeholder={labels.searchPlaceholder}
            onChange={event => setQuery(event.target.value)}
          />
          <A26SegmentedControl
            label={labels.search}
            value={view}
            onChange={setView}
            options={[
              { value: "all", label: labels.all },
              { value: "progress", label: labels.inProgress },
              { value: "completed", label: labels.completed }
            ]}
          />
        </A26Toolbar>
      ) : null}

      <div className="a26-daily-content">{renderBody()}</div>

      <p className="a26-daily-data-notice">
        <LineIcon name="check" />
        {labels.dataNotice}
      </p>
    </section>
  );
}

function StudentAITutorStudio() {
  const { messages, draft, setDraft, isThinking, sendMessage, connectionMode } = useAtlasAITutorSession();
  const [filterQuery, setFilterQuery] = useState("");
  const [userTags, setUserTags] = useState([]);
  const [showAddTagInput, setShowAddTagInput] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  const filteredMessages = useMemo(() => {
    if (!filterQuery.trim()) return messages;
    const queryLower = filterQuery.toLowerCase();
    return messages.filter(
      (m) => m.text?.toLowerCase().includes(queryLower) || m.contextLabel?.toLowerCase().includes(queryLower)
    );
  }, [messages, filterQuery]);

  const userQuestionsCount = useMemo(() => messages.filter((m) => m.sender === "user").length, [messages]);
  const aiAnswersCount = useMemo(() => messages.filter((m) => m.sender === "ai").length, [messages]);
  const totalDialogues = userQuestionsCount + aiAnswersCount;

  // Extract ONLY topics that were ACTUALLY mentioned by the user in this session
  const autoSessionTopics = useMemo(() => {
    const userTexts = messages
      .filter((m) => m.sender === "user")
      .map((m) => m.text || "")
      .join(" ");
    
    // Extract key capitalized medical terms or unique words
    const words = userTexts.match(/\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]{3,}\b/g) || [];
    const unique = Array.from(new Set(words)).filter(
      (w) => !["Como", "Qual", "Sobre", "Para", "Onde", "Saber", "Gostaria", "Explique", "Apresente"].includes(w)
    );
    return unique.slice(0, 8);
  }, [messages]);

  // Combined active topic tags (Auto detected from real questions + User added)
  const activeTopics = useMemo(() => {
    return Array.from(new Set([...autoSessionTopics, ...userTags])).slice(0, 8);
  }, [autoSessionTopics, userTags]);

  const handleRemoveTopic = (topicToRemove) => {
    setUserTags((prev) => prev.filter((t) => t !== topicToRemove));
    if (filterQuery === topicToRemove) setFilterQuery("");
  };

  const handleAddCustomTag = (e) => {
    e.preventDefault();
    const tag = newTagInput.trim();
    if (tag && !userTags.includes(tag)) {
      setUserTags((prev) => [...prev, tag]);
    }
    setNewTagInput("");
    setShowAddTagInput(false);
  };

  const handleStartClinicalCase = () => {
    sendMessage({
      text: "Apresente 1 Caso Clínico Médico Socrático em 3 etapas (1. História Clínica do Paciente, 2. Pergunta Anatômica de Diagnóstico e 3. Gabarito Acadêmico). Use somente fontes recuperadas e verificáveis da base privada; se não houver fonte disponível, informe isso claramente e não invente capítulo ou página.",
      contextLabel: "Caso Clínico Socrático"
    });
  };

  return (
    <div className="a26-ai-tutor-studio-hub flex flex-col gap-5 w-full">
      <div className="a26-liquid-metrics-grid">
        <A26Metric label="Histórico do diálogo" value={totalDialogues} detail={`${userQuestionsCount} perguntas · ${aiAnswersCount} respostas`} tone="teal" />
        <A26Metric
          label="Estado da sessão"
          value={connectionMode === "online" ? "Sincronizada" : "Neste dispositivo"}
          detail={connectionMode === "online" ? "Conversa associada à conta autenticada" : "Persistência remota indisponível nesta sessão"}
          tone="gold"
        />
        <A26Metric
          label="Fontes anatômicas"
          value="Condicionais"
          detail="Referências são exibidas somente quando recuperadas e presentes na resposta"
        />
      </div>

      {/* Search & User-Controlled Topic Tags Toolbar */}
      <div className="flex flex-col gap-3">
        <A26Toolbar className="a26-daily-toolbar a26-ai-tutor-studio-toolbar" label="Pesquisar histórico">
          <A26Field
            label="Filtrar histórico de consultas por palavra-chave"
            value={filterQuery}
            placeholder="Digite para buscar nas conversas (ex: Clavícula, Plexo, Fratura)..."
            onChange={(event) => setFilterQuery(event.target.value)}
          />
          {filterQuery ? (
            <A26Button variant="ghost" onClick={() => setFilterQuery("")}>
              Limpar busca
            </A26Button>
          ) : null}
        </A26Toolbar>

        {/* User-Controlled Dynamic Topic Tags (Add & Remove) */}
        <div className="flex items-center flex-wrap gap-2 px-1">
          <span className="text-[11px] font-semibold text-textMuted uppercase tracking-wider flex items-center gap-1">
            <span>🏷️</span> Tags de Estudo da Sessão:
          </span>

          {activeTopics.map((topic) => (
            <div
              key={topic}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all border ${
                filterQuery === topic
                  ? "bg-amber-400/25 border-amber-400 text-amber-200 shadow-glowGold"
                  : "bg-surfaceDark/70 border-glassBorder/50 text-teal-200 hover:border-teal-400"
              }`}
            >
              <button
                type="button"
                onClick={() => setFilterQuery(filterQuery === topic ? "" : topic)}
                className="hover:underline"
              >
                {topic}
              </button>
              <button
                type="button"
                onClick={() => handleRemoveTopic(topic)}
                className="text-textMuted hover:text-red-400 text-xs px-0.5 ml-1 transition-colors"
                title="Remover tag"
              >
                ✕
              </button>
            </div>
          ))}

          {showAddTagInput ? (
            <form onSubmit={handleAddCustomTag} className="inline-flex items-center gap-1">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="Nome da tag..."
                className="px-2.5 py-0.5 rounded-full text-xs bg-surfaceDark border border-teal-500/50 text-teal-200 outline-none w-28"
                autoFocus
              />
              <button
                type="submit"
                className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/40"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setShowAddTagInput(false)}
                className="text-xs text-textMuted hover:text-white px-1"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddTagInput(true)}
              className="px-2.5 py-1 rounded-full text-xs font-mono text-teal-300/80 border border-dashed border-teal-500/40 hover:border-teal-400 hover:text-teal-200 transition-all bg-teal-950/20"
            >
              + Adicionar Tag
            </button>
          )}
        </div>
      </div>

      {/* Full Page Dedicated Chat Container - Liquid Glass Aesthetics */}
      <A26Card material="substantial" className="a26-daily-tutor-hub-card" tone="teal">
        <header className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-glassBorder/30 mb-4">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-teal-400 animate-pulse shadow-glowTeal" />
            <div>
              <h2 className="text-base font-bold text-agedGold tracking-wide">Estúdio Completo de Diálogos do Tutor IA</h2>
              <p className="text-xs text-textMuted">Histórico completo de perguntas, pesquisas e respostas médicas sincronizado em tempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <A26Button
              variant="liquid"
              onClick={handleStartClinicalCase}
              disabled={isThinking}
            >
              Gerar Caso Clínico Socrático
            </A26Button>
            {filterQuery ? (
              <span className="text-xs text-amber-300 font-mono bg-amber-950/60 px-3 py-1.5 rounded-full border border-amber-500/30">
                Filtrando: {filteredMessages.length} de {messages.length}
              </span>
            ) : (
              <span className="text-xs text-teal-300 font-mono bg-teal-950/60 px-3 py-1.5 rounded-full border border-teal-500/30">
                {messages.length} mensagens no histórico
              </span>
            )}
          </div>
        </header>

        <div className="a26-tutor-fullpage-chat flex-1 min-h-[520px] flex flex-col justify-between">
          <AtlasAIConversation
            messages={filteredMessages}
            isThinking={isThinking}
            draft={draft}
            setDraft={setDraft}
            onSend={(text) => sendMessage({ text, contextLabel: "Estúdio Tutor IA" })}
            placeholder="Digite sua dúvida anatômica para consultar a base oficial de livros médicos…"
          />
        </div>
      </A26Card>
    </div>
  );
}
