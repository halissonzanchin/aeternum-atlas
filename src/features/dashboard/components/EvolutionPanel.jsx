import { useMemo, useState } from "react";
import { A26Card, A26SegmentedControl } from "../../../components/aeternum-26";
import WeeklyStudyChart from "./WeeklyStudyChart";
import StrategicProgressDonut from "../../../components/Analytics/StrategicProgressDonut";

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

export default function EvolutionPanel({
  stats,
  systemProgress,
  studySeriesByPeriod,
  weeklyStudyData,
  telemetry,
  t,
  flashcardsReviewed = 0,
  completedQuizzesCount = 0,
  totalQuizzesTarget = 6,
  tutorQuestionsCount = 0
}) {
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
        <A26Card material="regular" className="premium-panel-card student-radar-card">
          <div className="student-card-title-row">
            <h3>{t("studentHome.radarTitle")}</h3>
            <span className={`learning-source-badge ${telemetry?.synchronized ? "is-synced" : "is-local"}`}>{sourceLabel}</span>
          </div>
          <div className="student-radar-layout">
            <StrategicProgressDonut
              totalStudyMinutes={stats.totalStudyMinutes || 0}
              flashcardsReviewed={flashcardsReviewed}
              completedQuizzesCount={completedQuizzesCount}
              totalQuizzesTarget={totalQuizzesTarget}
              tutorQuestionsCount={tutorQuestionsCount}
            />
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
        </A26Card>

        <A26Card material="regular" className="premium-panel-card">
          <div className="student-card-title-row">
            <div>
              <h3>{periodTitle}</h3>
              <small className="learning-period-total">{minutesLabel(selectedMinutes, t)} no período</small>
            </div>
            <A26SegmentedControl
              className="learning-period-switch"
              label="Período do tempo de estudo"
              value={period}
              onChange={setPeriod}
              options={[
                { value: "week", label: "7D" },
                { value: "month", label: "30D" },
                { value: "year", label: "12M" }
              ]}
            />
          </div>
          <WeeklyStudyChart data={selectedSeries} t={t} />
        </A26Card>

        <A26Card material="regular" className="premium-panel-card student-insights-card">
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
        </A26Card>
      </div>
    </section>
  );
}
