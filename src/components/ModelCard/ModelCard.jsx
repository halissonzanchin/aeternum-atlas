import LineIcon from "../icons/LineIcon";
import { A26Button, A26Card, A26Surface } from "../aeternum-26";
import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { formatNumber } from "../../utils/formatLocale";
import { translateModelSummary } from "../../utils/modelI18n";
import { isFavoriteModel, isModelStudied, toggleFavoriteModel } from "../../services/progressService";
import { trackEvent } from "../../services/analytics/analyticsService";

function studyTime(model) {
  if (model.estimatedStudyTime) return model.estimatedStudyTime;
  if (model.level === "Avançado") return "20–30 min";
  if (model.level === "Intermediário") return "15–20 min";
  return "10–15 min";
}

function progressFor(user, model) {
  if (isModelStudied(user, model.id)) return 100;
  return model.progressPercent || 0;
}

function modelRouteId(model) {
  return model?.slug || model?.id;
}

function getPlaceholderStyle(slug) {
  const hash = String(slug || "default").split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const colors = [
    ["47,184,181", "198,168,92"],
    ["139,92,246", "59,130,246"],
    ["244,63,94", "249,115,22"],
    ["16,185,129", "14,165,233"],
  ];
  const [c1, c2] = colors[hash % colors.length];
  return {
    backgroundImage: `radial-gradient(circle at 50% 30%, rgba(${c1},0.34), transparent 55%), linear-gradient(135deg, rgba(${c2},0.22), rgba(15,23,42,0.96))`
  };
}

export default function ModelCard({ model, user, navigate }) {
  const { language, t } = useLanguage();
  const [favorite, setFavorite] = useState(() => isFavoriteModel(user, model.id));
  const studied = isModelStudied(user, model.id);
  const progress = progressFor(user, model);
  const localizedModel = translateModelSummary(model, t);

  function handleFavorite() {
    const added = toggleFavoriteModel(user, model.id);
    setFavorite(added);
    trackEvent({
      userId: user?.id,
      institutionId: user?.institutionId,
      role: user?.role,
      modelId: model.id,
      eventType: "favorite_model",
      metadata: { toggled: added ? "added" : "removed", source: "model_card" }
    });
  }

  const thumbUrl = model.thumbnailUrl || model.coverImageUrl || model.thumbnail_url || model.cover_image_url;

  return (
    <A26Card as="article" material="regular" interactive tone="teal" className="model-card model-card-aog grid gap-4 w-full atlas-card-safe">
      <div className="model-card-aog__media" style={!thumbUrl ? getPlaceholderStyle(modelRouteId(model)) : {}}>
        {thumbUrl ? (
          <img src={thumbUrl} alt={localizedModel.title} />
        ) : (
          <>
            <div className="model-card-aog__placeholder-ring" />
            <div className="model-card-aog__placeholder-letter">
              <span>
                {(localizedModel.shortTitle || localizedModel.title || "M").charAt(0).toUpperCase()}
              </span>
            </div>
          </>
        )}
        <div className="model-card-aog__status">
          {t("common.available")}
        </div>
        <A26Surface
          as="button"
          material="clear"
          interactive
          type="button"
          className={`model-card-aog__favorite${favorite ? " is-active" : ""}`}
          onClick={handleFavorite}
          aria-label={favorite ? t("models.favorited") : t("models.favorite")}
          aria-pressed={favorite}
        >
          <LineIcon name="favorite" />
        </A26Surface>
      </div>

      <div className="model-card-aog__body">
        <div className="model-card-aog__taxonomy">
          <span title={localizedModel.level}>{localizedModel.level}</span>
          <span aria-hidden="true">·</span>
          <span title={localizedModel.type}>{localizedModel.type}</span>
          {studied ? <strong>{t("studentDashboard.studied")}</strong> : null}
        </div>
        <h3 className="text-lg md:text-xl font-bold text-clinicalWhite atlas-text-safe line-clamp-2" title={localizedModel.title}>{localizedModel.title}</h3>
        <p className="model-card-aog__description">{localizedModel.description}</p>
        <p className="model-card-aog__location" title={`${localizedModel.system} · ${localizedModel.region}`}>
          {localizedModel.system} &middot; {localizedModel.region}
        </p>
      </div>

      <div className="model-card-aog__meta">
        <span><LineIcon name="clock" /> {studyTime(model)}</span>
        <span>{formatNumber(model.accessCount || 0, language)} {t("models.accesses").toLowerCase()}</span>
        <span>{t("models.availableByInstitution")}</span>
      </div>

      <div className="model-card-aog__progress">
        <div><span>{t("models.personalProgress")}</span><strong>{progress}%</strong></div>
        <span className="model-card-aog__track"><i style={{ width: `${progress}%` }} /></span>
      </div>

      <div className="model-card-aog__actions">
        <A26Button variant="primary" className="model-card-aog__primary" onClick={() => navigate(`/viewer/${modelRouteId(model)}`)}>
          <span>{t("models.openModel")}</span>
          <LineIcon name="chevron" />
        </A26Button>
        <A26Button variant="ghost" className="model-card-aog__secondary" onClick={() => navigate(`/models/${modelRouteId(model)}`)}>
          <span>{t("models.viewDetails")}</span>
        </A26Button>
      </div>
    </A26Card>
  );
}
