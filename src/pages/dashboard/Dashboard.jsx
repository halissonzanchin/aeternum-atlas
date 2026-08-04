import { useEffect } from "react";
import Card from "../../components/Card/Card";
import LineIcon from "../../components/icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";

import QuickMetricCard from "../../features/dashboard/components/QuickMetricCard";
import StudyToolCard from "../../features/dashboard/components/StudyToolCard";
import ContinueModelCard from "../../features/dashboard/components/ContinueModelCard";
import EvolutionPanel from "../../features/dashboard/components/EvolutionPanel";
import { A26Button, A26LoadingState } from "../../components/aeternum-26";
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
  const progress = Math.max(0, Math.min(100, Number(stats.progressPercent) || 0));
  const recentModel = recentModels[0];
  const courseLabel = user?.course || "Medicina";
  const semesterLabel = user?.semester || "Acesso institucional";

  return (
    <section className="student-study-home upe-student-dashboard premium-dashboard fade-in-up pb-12">
      <div className="student-study-hero upe-student-hero atlas-liquid-glass atlas-liquid-glass-card">
        <div className="atlas-liquid-highlight" />
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

        <div className="student-study-hero__visual upe-progress-orbit" aria-label={`Progresso geral: ${progress}%`}>
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray="351"
              strokeDashoffset={351 - (351 * progress) / 100}
              className="text-techTeal"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <strong>{progress}%</strong>
            <span>Progresso</span>
          </div>
        </div>
      </div>

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
            <Card className="premium-panel-card">
              <p className="text-sm text-textMuted">{t("models.emptyCatalog")}</p>
            </Card>
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
            <button key={item.id} className="student-recommendation-card" onClick={() => navigate(item.path)}>
              <span className="module-icon"><LineIcon name={item.icon} /></span>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
              <small>{t("studentHome.actions.start")}</small>
            </button>
          ))}
          {!modelsLoading && observedRecommendations.length === 0 ? (
            <Card className="premium-panel-card">
              <p className="text-sm text-textMuted">
                Ainda não há histórico suficiente para gerar recomendações pessoais. Abra um modelo para iniciar sua trilha observada.
              </p>
            </Card>
          ) : null}
        </div>
      </section>
    </section>
  );
}
