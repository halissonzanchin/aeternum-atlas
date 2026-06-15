import Card from "../../../components/Card/Card";
import WeeklyStudyChart from "./WeeklyStudyChart";
import { evolutionSystems, weeklyStudyData } from "../data/constants";

function minutesLabel(minutes, t) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours}h ${rest}min` : `${hours}h`;
  }
  return `${minutes} ${t("common.minutes")}`;
}

export default function EvolutionPanel({ stats, t }) {
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
