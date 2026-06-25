import Card from "../../components/Card/Card";
import AeternumLogo from "../../components/AeternumLogo";
import LineIcon from "../../components/icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";

import QuickMetricCard from "../../features/dashboard/components/QuickMetricCard";
import StudyToolCard from "../../features/dashboard/components/StudyToolCard";
import ContinueModelCard from "../../features/dashboard/components/ContinueModelCard";
import EvolutionPanel from "../../features/dashboard/components/EvolutionPanel";
import ProfessorDashboard from "../../features/dashboard/components/ProfessorDashboard";
import { studyTools, recommendationCards } from "../../features/dashboard/data/constants";
import { useDashboardData } from "../../features/dashboard/hooks/useDashboardData";
import { isUpeDemoMode } from "../../demo/upe";
import UpeStudentDashboard from "../../features/dashboard/components/UpeStudentDashboard";

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
    studiedStructures,
    continueTarget,
    recommendationPaths
  } = useDashboardData(user);

  if (user?.role === "professor") {
    return <ProfessorDashboard user={user} navigate={navigate} models={models} modelsLoading={modelsLoading} />;
  }

  if (isUpeDemoMode(user) && user?.role !== "professor") {
    return <UpeStudentDashboard navigate={navigate} />;
  }

  return (
    <section className="student-study-home premium-dashboard fade-in-up">
      <div className="student-study-hero">
        <div className="student-study-hero__content">
          <p className="viewer-eyebrow">{t("studentHome.eyebrow")}</p>
          <h1>{t("studentHome.title")}</h1>
          <p>{t("studentHome.subtitle")}</p>
          <div className="student-study-actions">
            <button className="viewer-primary-button invitation-to-act" onClick={() => navigate("/models")}>
              <LineIcon name="layers" />
              {t("studentHome.actions.openModels")}
            </button>
            <button className="viewer-secondary-button" onClick={() => navigate(continueTarget)}>
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
        <QuickMetricCard icon="layers" label={t("studentHome.quick.availableModels")} value={modelsLoading ? "..." : activeModels.length} hint={t("studentHome.quick.modelsHint")} tone="teal" />
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
          {!modelsLoading && recentModels.length === 0 ? (
            <Card className="premium-panel-card">
              <p className="text-sm text-textMuted">{t("models.emptyCatalog")}</p>
            </Card>
          ) : null}
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
            <button key={item.id} className="student-recommendation-card" onClick={() => navigate(recommendationPaths[item.id] || "/models")}>
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
