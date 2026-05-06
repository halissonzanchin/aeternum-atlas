import { useLanguage } from "../../../context/LanguageContext";

function minutesLabel(minutes, t) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours}h ${rest}min` : `${hours}h`;
  }
  return `${minutes} ${t("common.minutes")}`;
}

export default function WeeklyStudySummary({ summary }) {
  const { t } = useLanguage();
  const tone = summary.completionRate >= 70 ? "strong" : summary.completionRate >= 40 ? "medium" : "low";

  return (
    <section className="agenda-side-card weekly-summary">
      <div className="agenda-side-card__title">
        <h3>{t("studyAgenda.weeklySummary")}</h3>
        <span className={`weekly-summary-badge weekly-summary-badge--${tone}`}>{summary.completionRate}%</span>
      </div>
      <div className="weekly-summary-track">
        <span style={{ width: `${summary.completionRate}%` }} />
      </div>
      <div className="weekly-summary-grid">
        <div><strong>{summary.scheduled}</strong><span>{t("studyAgenda.summary.scheduled")}</span></div>
        <div><strong>{summary.completed}</strong><span>{t("studyAgenda.summary.completed")}</span></div>
        <div><strong>{summary.pending}</strong><span>{t("studyAgenda.summary.pending")}</span></div>
        <div><strong>{minutesLabel(summary.plannedMinutes, t)}</strong><span>{t("studyAgenda.summary.planned")}</span></div>
        <div><strong>{minutesLabel(summary.completedMinutes, t)}</strong><span>{t("studyAgenda.summary.completedTime")}</span></div>
      </div>
    </section>
  );
}
