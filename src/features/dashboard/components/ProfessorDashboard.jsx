import { useEffect, useMemo } from "react";
import AeternumLogo from "../../../components/AeternumLogo";
import LineIcon from "../../../components/icons/LineIcon";
import Card from "../../../components/Card/Card";
import { useLanguage } from "../../../context/LanguageContext";
import { trackEvent } from "../../../services/analytics/analyticsService";
import { getProgressBySystem } from "../../../services/progressService";
import { translateModelSummary } from "../../../utils/modelI18n";
import { institutionProfile } from "../../../data/mockInstitutionalAnalytics";
import { professorCards } from "../data/constants";
import KpiCard from "./KpiCard";
import ProgressRow from "./ProgressRow";

export default function ProfessorDashboard({ user, navigate, models, modelsLoading }) {
  const { t } = useLanguage();
  const recommended = useMemo(() => models.slice(0, 4), [models]);

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
        <KpiCard icon="layers" label={t("professorDashboard.availableModels")} value={modelsLoading ? "..." : models.length} tone="teal" />
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
                <button key={model.id} className="viewer-list-row" onClick={() => navigate(`/models/${model.slug || model.id}`)}>
                  <span className="module-icon"><LineIcon name="layers" /></span>
                  <span className="min-w-0 flex-1 text-left">
                    <strong>{summary.title}</strong>
                    <small>{summary.system} · {model.estimatedStudyTime}</small>
                  </span>
                </button>
              );
            })}
            {!modelsLoading && recommended.length === 0 ? (
              <p className="text-sm text-textMuted">{t("models.emptyCatalog")}</p>
            ) : null}
          </div>
        </Card>

        <Card className="premium-panel-card">
          <p className="viewer-eyebrow">{t("professorDashboard.classProgress")}</p>
          <div className="mt-4 grid gap-3">
            {getProgressBySystem(user, models).slice(0, 4).map(item => <ProgressRow key={item.system} item={item} />)}
            {!modelsLoading && models.length === 0 ? (
              <p className="text-sm text-textMuted">{t("models.emptyCatalog")}</p>
            ) : null}
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
