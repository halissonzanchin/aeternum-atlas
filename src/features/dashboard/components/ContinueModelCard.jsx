import { translateModelSummary } from "../../../utils/modelI18n";

export default function ContinueModelCard({ model, navigate, t }) {
  const summary = translateModelSummary(model, t);
  const progress = model.progressPercent || 0;

  function modelPath(model) {
    return `/viewer/${model.slug || model.id}`;
  }

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
