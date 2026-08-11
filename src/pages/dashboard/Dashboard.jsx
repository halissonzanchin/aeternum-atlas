import { useEffect, useMemo } from "react";
import LineIcon from "../../components/icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";

import QuickMetricCard from "../../features/dashboard/components/QuickMetricCard";
import StudyToolCard from "../../features/dashboard/components/StudyToolCard";
import ContinueModelCard from "../../features/dashboard/components/ContinueModelCard";
import EvolutionPanel from "../../features/dashboard/components/EvolutionPanel";
import MuralModularBoard from "../../components/MuralModularBoard/MuralModularBoard";
import StrategicProgressDonut from "../../components/Analytics/StrategicProgressDonut";
import HeroAcademicStatusWidget from "../../components/Analytics/HeroAcademicStatusWidget";
import { A26Button, A26Card, A26EmptyState, A26LoadingState, A26Surface } from "../../components/aeternum-26";
import { studyTools } from "../../features/dashboard/data/constants";
import { useDashboardData } from "../../features/dashboard/hooks/useDashboardData";
import "../../features/dashboard/components/StudentDashboard.css";

function minutesLabel(minutes, t) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours}h ${rest}min` : `${hours}h`;
  }
  return `${minutes} ${t("common.minutes")}`;
}

export default function Dashboard({ user, navigate }) {
  const { t } = useLanguage();
  const {
    models,
    modelsLoading,
    stats,
    recentModels,
    activeModels,
    systemProgress,
    telemetry,
    studySeriesByPeriod,
    weeklyStudyData,
    continueTarget,
    observedRecommendations
  } = useDashboardData(user);

  const flashcardsReviewed = useMemo(() => {
    try {
      const saved = localStorage.getItem("aeternum-flashcards-v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.length;
        if (typeof parsed === "object") return Object.keys(parsed).length;
      }
    } catch (e) {}
    return (telemetry.events || []).filter(e => e.eventType === "flashcard_review" || e.eventType === "flashcard_answer").length || 0;
  }, [telemetry.events]);

  const completedQuizzesCount = useMemo(() => {
    const attemptsFromTelemetry = telemetry.quizResults || [];
    let localAnatomicalAttempts = [];
    try {
      const saved = localStorage.getItem("aeternum_anatomical_quiz_attempts");
      if (saved) localAnatomicalAttempts = JSON.parse(saved);
    } catch (e) {}

    // Track unique (modelId + quizType) pairs that achieved 100% score (zero errors)
    const perfectQuizKeys = new Set();

    attemptsFromTelemetry.forEach(q => {
      const score = Number(q.score ?? q.correct_answers);
      const total = Number(q.totalQuestions ?? q.total_questions);
      const pct = Number(q.percentage ?? q.accuracy);
      const isPerfect = pct === 100 || (score > 0 && score === total);
      const modelId = q.modelId || q.model_id;
      const quizType = q.quizType || q.quiz_type || "anatomical";
      if (isPerfect && modelId) {
        perfectQuizKeys.add(`${modelId}:${quizType}`);
      }
    });

    localAnatomicalAttempts.forEach(q => {
      const score = Number(q.result?.score ?? q.score);
      const total = Number(q.result?.totalQuestions ?? q.totalQuestions);
      const pct = Number(q.result?.percentage ?? q.percentage);
      const isPerfect = pct === 100 || (score > 0 && score === total);
      const modelId = q.modelId || q.model?.id;
      const quizType = q.quizType || "anatomical";
      if (isPerfect && modelId) {
        perfectQuizKeys.add(`${modelId}:${quizType}`);
      }
    });

    return perfectQuizKeys.size;
  }, [telemetry.quizResults]);

  const tutorQuestionsCount = useMemo(() => {
    try {
      const saved = localStorage.getItem("atlas-tutor-session-history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter(m => m.sender === "user" || m.role === "user").length;
      }
    } catch (e) {}
    return (telemetry.events || []).filter(e => e.eventType === "tutor_question" || e.eventType === "ai_query").length || 0;
  }, [telemetry.events]);

  useEffect(() => {
    const studentExperience = user?.role === "student";
    if (studentExperience) document.body.classList.add("upe-student-mode");
    return () => document.body.classList.remove("upe-student-mode");
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === "professor" || user?.role === "teacher") navigate("/teacher");
  }, [navigate, user?.role]);

  if (user?.role === "professor" || user?.role === "teacher") {
    return <A26LoadingState title="Abrindo área docente" text="Carregando os dados observados do professor." />;
  }

  const firstName = String(user?.name || "Estudante").trim().split(/\s+/)[0];
  const recentModel = recentModels[0];
  const courseLabel = user?.course || "Medicina";
  const semesterLabel = user?.semester || "Acesso institucional";

  return (
    <section className="student-study-home a26-student-dashboard fade-in-up pb-12" data-a26-source="account-observed">
      <A26Card material="substantial" tone="teal" className="student-study-hero a26-student-hero">
        <div className="student-study-hero__content">
          <p className="viewer-eyebrow">{courseLabel} • {semesterLabel}</p>
          <h1>Olá, {firstName}</h1>
          <p>
            {recentModel
              ? `Continue sua exploração em ${recentModel.shortTitle || recentModel.title}.`
              : t("studentHome.subtitle")}
          </p>
          <div className="student-study-actions">
            <A26Button
              variant="primary"
              className="invitation-to-act"
              icon={<LineIcon name="layers" />}
              onClick={() => navigate("/models")}
            >
              {t("studentHome.actions.openModels")}
            </A26Button>
            <A26Button variant="liquid" icon={<LineIcon name="reset" />} onClick={() => navigate(continueTarget)}>
              {t("studentHome.actions.continue")}
            </A26Button>
            <A26Button variant="liquid" icon={<LineIcon name="check" />} onClick={() => navigate("/progress")}>
              {t("studentHome.actions.progress")}
            </A26Button>
          </div>
        </div>
      </A26Card>

      <MuralModularBoard />

      <div className="student-quick-grid upe-metrics">
        <QuickMetricCard icon="layers" label={t("studentHome.quick.availableModels")} value={modelsLoading ? "..." : activeModels.length} hint={t("studentHome.quick.modelsHint")} tone="teal" />
        <QuickMetricCard icon="clock" label={t("studentHome.quick.totalStudyTime")} value={minutesLabel(stats.totalStudyMinutes, t)} hint={t("studentHome.quick.studyHint")} />
        <QuickMetricCard icon="check" label={t("studentHome.quick.completedModels")} value={stats.studiedModels} hint={t("studentHome.quick.completionsHint")} tone="teal" />
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
          {!modelsLoading && recentModels.length === 0 ? (
            <A26EmptyState title={t("models.emptyCatalog")} text={t("models.emptyCatalogSubtitle") || "Seu catálogo será exibido assim que a fonte institucional responder."} />
          ) : null}
        </div>
      </section>

      <EvolutionPanel
        stats={stats}
        systemProgress={systemProgress}
        studySeriesByPeriod={studySeriesByPeriod}
        weeklyStudyData={weeklyStudyData}
        telemetry={telemetry}
        t={t}
        flashcardsReviewed={flashcardsReviewed}
        completedQuizzesCount={completedQuizzesCount}
        totalQuizzesTarget={(activeModels.length || 3) * 2}
        tutorQuestionsCount={tutorQuestionsCount}
      />

      <section className="student-section">
        <div className="student-section-header">
          <div>
            <p className="viewer-eyebrow">{t("studentHome.recommendedEyebrow")}</p>
            <h2>{t("studentHome.recommendedTitle")}</h2>
            <span>{t("studentHome.recommendedSubtitle")}</span>
          </div>
        </div>
        <div className="student-recommendation-grid">
          {observedRecommendations.map(item => (
            <A26Surface as="button" type="button" material="regular" interactive tone="teal" key={item.id} className="student-recommendation-card" onClick={() => navigate(item.path)}>
              <span className="module-icon"><LineIcon name={item.icon} /></span>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
              <small>{t("studentHome.actions.start")}</small>
            </A26Surface>
          ))}
          {!modelsLoading && observedRecommendations.length === 0 ? (
            <A26EmptyState
              title="Recomendações em formação"
              text="Ainda não há histórico suficiente para gerar recomendações pessoais. Abra um modelo para iniciar sua trilha observada."
            />
          ) : null}
        </div>
      </section>
    </section>
  );
}
