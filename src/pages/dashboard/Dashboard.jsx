import { useEffect, useMemo } from "react";
import Card from "../../components/Card/Card";
import AeternumLogo from "../../components/AeternumLogo";
import LineIcon from "../../components/icons/LineIcon";
import { mockModels } from "../../data/mockModels";
import { institutionProfile } from "../../data/mockInstitutionalAnalytics";
import { trackEvent } from "../../services/analyticsService";
import { calculateStudentProgress, getProgressBySystem } from "../../services/progressService";
import { useLanguage } from "../../context/LanguageContext";
import { translateModelSummary, translateTaxonomy } from "../../utils/modelI18n";

const continueModelIds = ["coracao-humano-superficial", "abdome-cadaverico-3d", "cranio-humano-3d"];

const studyTools = [
  {
    id: "agenda",
    titleKey: "studentHome.tools.agenda.title",
    descriptionKey: "studentHome.tools.agenda.description",
    statusKey: "studentHome.status.available",
    statusTone: "available",
    icon: "clock",
    path: "/study-agenda"
  },
  {
    id: "flashcards",
    titleKey: "studentHome.tools.flashcards.title",
    descriptionKey: "studentHome.tools.flashcards.description",
    statusKey: "studentHome.status.available",
    statusTone: "available",
    icon: "library",
    path: "/flashcards"
  },
  {
    id: "quizzes",
    titleKey: "studentHome.tools.quizzes.title",
    descriptionKey: "studentHome.tools.quizzes.description",
    statusKey: "studentHome.status.inDevelopment",
    statusTone: "development",
    icon: "check",
    path: "/quizzes"
  },
  {
    id: "summaries",
    titleKey: "studentHome.tools.summaries.title",
    descriptionKey: "studentHome.tools.summaries.description",
    statusKey: "studentHome.status.inDevelopment",
    statusTone: "development",
    icon: "spark",
    path: "/summaries"
  },
  {
    id: "guided-study",
    titleKey: "studentHome.tools.guidedStudy.title",
    descriptionKey: "studentHome.tools.guidedStudy.description",
    statusKey: "studentHome.status.available",
    statusTone: "available",
    icon: "layers",
    path: "/guided-study"
  },
  {
    id: "ai-tutor",
    titleKey: "studentHome.tools.aiTutor.title",
    descriptionKey: "studentHome.tools.aiTutor.description",
    statusKey: "studentHome.status.soon",
    statusTone: "soon",
    icon: "help",
    path: "/ai-tutor"
  },
  {
    id: "quick-review",
    titleKey: "studentHome.tools.quickReview.title",
    descriptionKey: "studentHome.tools.quickReview.description",
    statusKey: "studentHome.status.available",
    statusTone: "available",
    icon: "reset",
    path: "/review"
  },
  {
    id: "anatomical-map",
    titleKey: "studentHome.tools.anatomicalMap.title",
    descriptionKey: "studentHome.tools.anatomicalMap.description",
    statusKey: "studentHome.status.available",
    statusTone: "available",
    icon: "search",
    path: "/atlas"
  }
];

const recommendationCards = [
  {
    id: "review-most-accessed",
    titleKey: "studentHome.recommendations.reviewMostAccessed",
    descriptionKey: "studentHome.recommendationDescriptions.reviewMostAccessed",
    icon: "reset",
    path: "/viewer/coracao-humano-superficial"
  },
  {
    id: "complete-started",
    titleKey: "studentHome.recommendations.completeStarted",
    descriptionKey: "studentHome.recommendationDescriptions.completeStarted",
    icon: "check",
    path: "/models/abdome-cadaverico-3d"
  },
  {
    id: "quick-quiz",
    titleKey: "studentHome.recommendations.quickQuiz",
    descriptionKey: "studentHome.recommendationDescriptions.quickQuiz",
    icon: "spark",
    path: "/quizzes"
  },
  {
    id: "generate-flashcards",
    titleKey: "studentHome.recommendations.generateFlashcards",
    descriptionKey: "studentHome.recommendationDescriptions.generateFlashcards",
    icon: "library",
    path: "/flashcards"
  }
];

const weeklyStudyData = [
  { dayKey: "studentHome.days.mon", minutes: 38 },
  { dayKey: "studentHome.days.tue", minutes: 52 },
  { dayKey: "studentHome.days.wed", minutes: 44 },
  { dayKey: "studentHome.days.thu", minutes: 71 },
  { dayKey: "studentHome.days.fri", minutes: 58 },
  { dayKey: "studentHome.days.sat", minutes: 36 },
  { dayKey: "studentHome.days.sun", minutes: 21 }
];

const evolutionSystems = [
  ["taxonomy.systems.cardiovascular", 82],
  ["taxonomy.systems.skeletal", 68],
  ["taxonomy.systems.digestive", 54],
  ["taxonomy.systems.respiratory", 61],
  ["taxonomy.systems.nervous", 46]
];

const professorCards = [
  ["navigation.models3d", "professorDashboard.modelsText", "/models", "layers"],
  ["navigation.studyLists", "professorDashboard.studyListsText", "/study-lists", "library"],
  ["navigation.classes", "professorDashboard.classesText", "/classes", "check"],
  ["navigation.recommendations", "professorDashboard.recommendationsText", "/recommendations", "spark"],
  ["navigation.academicReports", "professorDashboard.reportsText", "/academic-reports", "reset"],
  ["navigation.profile", "professorDashboard.profileText", "/profile", "favorite"]
];

function minutesLabel(minutes, t) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours}h ${rest}min` : `${hours}h`;
  }
  return `${minutes} ${t("common.minutes")}`;
}

function modelPath(model) {
  return model.id === "coracao-humano-superficial" ? `/viewer/${model.id}` : `/models/${model.id}`;
}

function KpiCard({ icon, label, value, tone = "gold" }) {
  return (
    <Card className="premium-panel-card">
      <div className="flex items-start justify-between gap-4">
        <span className={`module-icon ${tone === "teal" ? "text-techTeal" : "text-agedGold"}`}>
          <LineIcon name={icon} />
        </span>
        <strong className={`text-right text-3xl ${tone === "teal" ? "text-techTeal" : "text-agedGold"}`}>{value}</strong>
      </div>
      <p className="mt-4 text-sm font-bold text-textMuted">{label}</p>
    </Card>
  );
}

function QuickMetricCard({ icon, label, value, hint, tone = "gold" }) {
  return (
    <article className="student-quick-card">
      <span className={`student-quick-icon student-quick-icon--${tone}`}>
        <LineIcon name={icon} />
      </span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
        {hint ? <small>{hint}</small> : null}
      </div>
    </article>
  );
}

function StudyToolCard({ tool, navigate, t }) {
  return (
    <button className="study-tool-card" onClick={() => navigate(tool.path)}>
      <span className="study-tool-icon">
        <LineIcon name={tool.icon} />
      </span>
      <span className={`study-tool-status study-tool-status--${tool.statusTone}`}>{t(tool.statusKey)}</span>
      <strong>{t(tool.titleKey)}</strong>
      <p>{t(tool.descriptionKey)}</p>
    </button>
  );
}

function ContinueModelCard({ model, navigate, t }) {
  const summary = translateModelSummary(model, t);
  const progress = model.progressPercent || 0;

  return (
    <article className="continue-model-card">
      <div>
        <span className="badge badge-teal">{summary.system}</span>
        <h3>{summary.title}</h3>
        <p className="continue-model-meta">{summary.region} · {model.estimatedStudyTime}</p>
      </div>
      <div>
        <div className="continue-progress-label">
          <span>{t("models.personalProgress")}</span>
          <strong>{progress}%</strong>
        </div>
        <div className="student-progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <button className="viewer-primary-button" onClick={() => navigate(modelPath(model))}>
        {t("models.openModel")}
      </button>
    </article>
  );
}

function WeeklyStudyChart({ data, t }) {
  const maxMinutes = Math.max(...data.map(item => item.minutes), 1);

  return (
    <div className="weekly-study-chart">
      {data.map(item => (
        <div key={item.dayKey} className="weekly-study-column">
          <div className="weekly-study-bar-wrap">
            <span className="weekly-study-bar" style={{ height: `${Math.max(18, (item.minutes / maxMinutes) * 100)}%` }} />
          </div>
          <strong>{item.minutes}</strong>
          <small>{t(item.dayKey)}</small>
        </div>
      ))}
    </div>
  );
}

function EvolutionPanel({ stats, t }) {
  return (
    <section className="student-section">
      <div className="student-section-header">
        <div>
          <p className="viewer-eyebrow">{t("studentHome.evolutionEyebrow")}</p>
          <h2>{t("studentHome.evolutionTitle")}</h2>
          <span>{t("studentHome.evolutionSubtitle")}</span>
        </div>
      </div>

      <div className="student-evolution-grid">
        <Card className="premium-panel-card student-radar-card">
          <div className="student-card-title-row">
            <h3>{t("studentHome.radarTitle")}</h3>
            <span>{stats.progressPercent}%</span>
          </div>
          <div className="student-radar-layout">
            <div className="student-radar-visual">
              <span className="student-radar-ring ring-one" />
              <span className="student-radar-ring ring-two" />
              <span className="student-radar-core">{stats.progressPercent}%</span>
            </div>
            <div className="student-radar-bars">
              {evolutionSystems.map(([labelKey, value]) => (
                <div key={labelKey} className="student-system-row">
                  <div>
                    <span>{t(labelKey)}</span>
                    <strong>{value}%</strong>
                  </div>
                  <div className="student-progress-track">
                    <span style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="premium-panel-card">
          <div className="student-card-title-row">
            <h3>{t("studentHome.weeklyTitle")}</h3>
            <span>{minutesLabel(stats.totalStudyMinutes, t)}</span>
          </div>
          <WeeklyStudyChart data={weeklyStudyData} t={t} />
        </Card>

        <Card className="premium-panel-card student-insights-card">
          <div className="student-insights">
            <div>
              <h3>{t("studentHome.strengthsTitle")}</h3>
              <ul>
                {t("studentHome.strengths").map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <h3>{t("studentHome.reviewTitle")}</h3>
              <ul>
                {t("studentHome.reviewPoints").map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

function ProgressRow({ item }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <strong className="min-w-0 truncate text-clinicalWhite">{translateTaxonomy(item.system, t, "systems")}</strong>
        <span className="shrink-0 text-textMuted">{item.studied}/{item.total}</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-techTeal" style={{ width: `${item.percent}%` }} />
      </div>
    </div>
  );
}

function ProfessorDashboard({ user, navigate }) {
  const { t } = useLanguage();
  const recommended = useMemo(() => mockModels.slice(0, 4), []);

  useEffect(() => {
    trackEvent({ userId: user?.id, institutionId: user?.institutionId, role: user?.role, eventType: "open_dashboard" });
  }, [user?.id, user?.institutionId, user?.role]);

  return (
    <section className="premium-dashboard fade-in-up">
      <div className="dashboard-hero">
        <div className="dashboard-brand-intro">
          <AeternumLogo variant="symbol" size="lg" theme="transparent" />
          <div>
            <p className="viewer-eyebrow">{t("professorDashboard.eyebrow")}</p>
            <h1 className="display-title">{t("professorDashboard.title")}</h1>
            <p className="mt-3 max-w-3xl text-textMuted">{t("professorDashboard.subtitle")}</p>
          </div>
        </div>

        <div className="account-summary-card">
          <span>{t("professorDashboard.academicManagement")}</span>
          <strong>{user?.name || t("auth.userType")}</strong>
          <small>{user?.institution || institutionProfile.name} · {user?.course || t("navigation.courses")}</small>
        </div>
      </div>

      <div className="kpi-grid mb-6">
        <KpiCard icon="layers" label={t("professorDashboard.availableModels")} value={mockModels.length} tone="teal" />
        <KpiCard icon="library" label={t("professorDashboard.studyLists")} value="6" />
        <KpiCard icon="check" label={t("professorDashboard.classes")} value="4" tone="teal" />
        <KpiCard icon="reset" label={t("professorDashboard.weeklyEngagement")} value="78%" />
      </div>

      <div className="dashboard-grid">
        <button className="dashboard-main-card" onClick={() => navigate("/models")}>
          <div className="dashboard-anatomy-visual">
            <div className="body-silhouette compact" />
            <div className="scan-ring ring-one" />
          </div>
          <div>
            <span className="premium-badge teal">{t("professorDashboard.teacherHub")}</span>
            <h2>{t("professorDashboard.modelCuration")}</h2>
            <p>{t("professorDashboard.modelCurationText")}</p>
          </div>
        </button>

        <div className="dashboard-module-grid">
          {professorCards.map(([titleKey, textKey, path, icon]) => (
            <button key={titleKey} className="dashboard-module-card" onClick={() => navigate(path)}>
              <span className="module-icon"><LineIcon name={icon} /></span>
              <span className="premium-badge teal">{t("common.available")}</span>
              <h3>{t(titleKey)}</h3>
              <p>{t(textKey)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-lower-grid">
        <Card className="premium-panel-card">
          <p className="viewer-eyebrow">{t("professorDashboard.recommendedForClass")}</p>
          <div className="mt-4 grid gap-3">
            {recommended.map(model => {
              const summary = translateModelSummary(model, t);
              return (
                <button key={model.id} className="viewer-list-row" onClick={() => navigate(`/models/${model.id}`)}>
                  <span className="module-icon"><LineIcon name="layers" /></span>
                  <span className="min-w-0 flex-1 text-left">
                    <strong>{summary.title}</strong>
                    <small>{summary.system} · {model.estimatedStudyTime}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="premium-panel-card">
          <p className="viewer-eyebrow">{t("professorDashboard.classProgress")}</p>
          <div className="mt-4 grid gap-3">
            {getProgressBySystem(user).slice(0, 4).map(item => <ProgressRow key={item.system} item={item} />)}
          </div>
        </Card>

        <Card className="premium-panel-card">
          <p className="viewer-eyebrow">{t("professorDashboard.nextActions")}</p>
          <div className="mt-4 grid gap-3">
            {["professorDashboard.actionCreateList", "professorDashboard.actionRecommendHeart", "professorDashboard.actionReviewReports"].map(item => (
              <button key={item} className="viewer-list-row text-left" onClick={() => navigate("/study-lists")}>
                <span className="module-icon"><LineIcon name="check" /></span>
                <span className="min-w-0 flex-1">
                  <strong>{t(item)}</strong>
                  <small>{t("professorDashboard.actionHint")}</small>
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

export default function Dashboard({ user, navigate }) {
  const { t } = useLanguage();
  const stats = calculateStudentProgress(user);
  const recentModels = useMemo(() => continueModelIds.map(id => mockModels.find(model => model.id === id)).filter(Boolean), []);
  const activeModels = useMemo(() => mockModels.filter(model => model.isActive !== false), []);
  const studiedStructures = Math.max(stats.studiedModels * 4, 32);

  useEffect(() => {
    trackEvent({ userId: user?.id, institutionId: user?.institutionId, role: user?.role, eventType: "open_dashboard" });
  }, [user?.id, user?.institutionId, user?.role]);

  if (user?.role === "professor") {
    return <ProfessorDashboard user={user} navigate={navigate} />;
  }

  return (
    <section className="student-study-home premium-dashboard fade-in-up">
      <div className="student-study-hero">
        <div className="student-study-hero__content">
          <p className="viewer-eyebrow">{t("studentHome.eyebrow")}</p>
          <h1>{t("studentHome.title")}</h1>
          <p>{t("studentHome.subtitle")}</p>
          <div className="student-study-actions">
            <button className="viewer-primary-button" onClick={() => navigate("/models")}>
              <LineIcon name="layers" />
              {t("studentHome.actions.openModels")}
            </button>
            <button className="viewer-secondary-button" onClick={() => navigate("/viewer/coracao-humano-superficial")}>
              <LineIcon name="reset" />
              {t("studentHome.actions.continue")}
            </button>
            <button className="viewer-secondary-button" onClick={() => navigate("/progress")}>
              <LineIcon name="check" />
              {t("studentHome.actions.progress")}
            </button>
          </div>
        </div>

        <div className="student-study-hero__visual" aria-hidden="true">
          <AeternumLogo variant="symbol" size="lg" theme="transparent" />
          <span className="hero-orbit orbit-one" />
          <span className="hero-orbit orbit-two" />
        </div>
      </div>

      <div className="student-quick-grid">
        <QuickMetricCard icon="layers" label={t("studentHome.quick.availableModels")} value={activeModels.length} hint={t("studentHome.quick.modelsHint")} tone="teal" />
        <QuickMetricCard icon="clock" label={t("studentHome.quick.totalStudyTime")} value={minutesLabel(stats.totalStudyMinutes, t)} hint={t("studentHome.quick.studyHint")} />
        <QuickMetricCard icon="check" label={t("studentHome.quick.studiedStructures")} value={studiedStructures} hint={t("studentHome.quick.structuresHint")} tone="teal" />
        <QuickMetricCard icon="spark" label={t("studentHome.quick.overallProgress")} value={`${stats.progressPercent}%`} hint={t("studentHome.quick.progressHint")} />
      </div>

      <section className="student-section">
        <div className="student-section-header">
          <div>
            <p className="viewer-eyebrow">{t("studentHome.toolsEyebrow")}</p>
            <h2>{t("studentHome.toolsTitle")}</h2>
            <span>{t("studentHome.toolsSubtitle")}</span>
          </div>
        </div>
        <div className="study-tools-grid">
          {studyTools.map(tool => <StudyToolCard key={tool.id} tool={tool} navigate={navigate} t={t} />)}
        </div>
      </section>

      <section className="student-section">
        <div className="student-section-header">
          <div>
            <p className="viewer-eyebrow">{t("studentHome.continueEyebrow")}</p>
            <h2>{t("studentHome.continueTitle")}</h2>
            <span>{t("studentHome.continueSubtitle")}</span>
          </div>
        </div>
        <div className="continue-model-grid">
          {recentModels.map(model => <ContinueModelCard key={model.id} model={model} navigate={navigate} t={t} />)}
        </div>
      </section>

      <EvolutionPanel stats={stats} t={t} />

      <section className="student-section">
        <div className="student-section-header">
          <div>
            <p className="viewer-eyebrow">{t("studentHome.recommendedEyebrow")}</p>
            <h2>{t("studentHome.recommendedTitle")}</h2>
            <span>{t("studentHome.recommendedSubtitle")}</span>
          </div>
        </div>
        <div className="student-recommendation-grid">
          {recommendationCards.map(item => (
            <button key={item.id} className="student-recommendation-card" onClick={() => navigate(item.path)}>
              <span className="module-icon"><LineIcon name={item.icon} /></span>
              <strong>{t(item.titleKey)}</strong>
              <p>{t(item.descriptionKey)}</p>
              <small>{t("studentHome.actions.start")}</small>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}
