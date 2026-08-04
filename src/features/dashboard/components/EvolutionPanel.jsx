import { useMemo, useState } from "react";
import Card from "../../../components/Card/Card";
import WeeklyStudyChart from "./WeeklyStudyChart";

function minutesLabel(minutes, t) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours}h ${rest}min` : `${hours}h`;
  }
  return `${minutes} ${t("common.minutes")}`;
}

function metricLabel(item) {
  if (item.metricType === "quiz") return "Precisão nos simulados";
  if (item.metricType === "annotations") return "Cobertura de marcações";
  return "Modelos concluídos";
}

export default function EvolutionPanel({ stats, systemProgress, studySeriesByPeriod, weeklyStudyData, telemetry, t }) {
  const [period, setPeriod] = useState("week");
  const selectedSeries = studySeriesByPeriod?.[period] || weeklyStudyData || [];
  const selectedMinutes = useMemo(
    () => selectedSeries.reduce((sum, item) => sum + Number(item.minutes || 0), 0),
    [selectedSeries]
  );
  const observedSystems = systemProgress.filter(item => item.total > 0);
  const withEvidence = observedSystems.filter(item => (
    item.activeSeconds > 0 || item.annotationTotal > 0 || item.quizAttempts > 0 || item.studied > 0
  ));
  const strongest = [...withEvidence]
    .filter(item => item.percent > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);
  const needsReview = [...withEvidence].filter(item => item.percent < 100).sort((a, b) => a.percent - b.percent).slice(0, 3);
  const sourceLabel = telemetry?.synchronized
    ? "Sincronizado com a conta"
    : telemetry?.syncError
      ? "Sincronização pendente"
      : "Dados deste dispositivo";
  const periodTitle = period === "year"
    ? "Tempo de estudo anual"
    : period === "month"
      ? "Tempo de estudo mensal"
      : t("studentHome.weeklyTitle");
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
            <span className={`learning-source-badge ${telemetry?.synchronized ? "is-synced" : "is-local"}`}>{sourceLabel}</span>
          </div>
          <div className="student-radar-layout">
            <div className="student-radar-visual">
              <span className="student-radar-ring ring-one" />
              <span className="student-radar-ring ring-two" />
              <span className="student-radar-core">{stats.progressPercent}%</span>
            </div>
            <div className="student-radar-bars">
              {observedSystems.map(item => (
                <div key={item.system} className="student-system-row">
                  <div>
                    <span>{item.system}</span>
                    <strong>{item.percent}%</strong>
                  </div>
                  <div className="student-progress-track">
                    <span style={{ width: `${item.percent}%` }} />
                  </div>
                  <div className="student-system-evidence">
                    <small>{metricLabel(item)}</small>
                    <small>{minutesLabel(item.studyMinutes, t)} ativos</small>
                    {item.annotationTotal > 0 ? <small>{item.annotationViewed}/{item.annotationTotal} marcações</small> : null}
                    {item.quizAttempts > 0 ? <small>{item.quizAttempts} simulado{item.quizAttempts === 1 ? "" : "s"}</small> : null}
                  </div>
                </div>
              ))}
              {!observedSystems.length ? <p className="text-sm text-textMuted">{t("studentHome.observedDataEmpty")}</p> : null}
            </div>
          </div>
        </Card>

        <Card className="premium-panel-card">
          <div className="student-card-title-row">
            <div>
              <h3>{periodTitle}</h3>
              <small className="learning-period-total">{minutesLabel(selectedMinutes, t)} no período</small>
            </div>
            <div className="learning-period-switch" role="group" aria-label="Período do tempo de estudo">
              {[
                ["week", "7D"],
                ["month", "30D"],
                ["year", "12M"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={period === value ? "is-active" : ""}
                  aria-pressed={period === value}
                  onClick={() => setPeriod(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <WeeklyStudyChart data={selectedSeries} t={t} />
        </Card>

        <Card className="premium-panel-card student-insights-card">
          <div className="student-insights">
            <div>
              <h3>{t("studentHome.strengthsTitle")}</h3>
              <ul>
                {strongest.map(item => <li key={item.system}>{item.system} · {metricLabel(item)} {item.percent}%</li>)}
                {!strongest.length ? <li>{t("studentHome.observedDataEmpty")}</li> : null}
              </ul>
            </div>
            <div>
              <h3>{t("studentHome.reviewTitle")}</h3>
              <ul>
                {needsReview.map(item => <li key={item.system}>{item.system} · {metricLabel(item)} {item.percent}%</li>)}
                {!needsReview.length ? <li>{t("studentHome.observedReviewEmpty")}</li> : null}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
