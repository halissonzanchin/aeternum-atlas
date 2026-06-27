import Button from "../Button/Button";
import Card from "../Card/Card";
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
    <Card as="article" className="model-card grid gap-4 overflow-hidden w-full min-w-0">
      <div className="relative min-h-[140px] md:min-h-40 overflow-hidden rounded-2xl w-full shrink-0" style={!thumbUrl ? getPlaceholderStyle(modelRouteId(model)) : {}}>
        {thumbUrl ? (
          <img src={thumbUrl} alt={localizedModel.title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-[22%] rounded-full border border-white/20 shadow-glow" />
            <div className="absolute inset-0 flex items-center justify-center opacity-40">
              <span className="text-6xl font-bold tracking-wider text-white mix-blend-overlay">
                {(localizedModel.shortTitle || localizedModel.title || "M").charAt(0).toUpperCase()}
              </span>
            </div>
          </>
        )}
        <div className="absolute bottom-4 left-4 rounded-full border border-selectionGreen/30 bg-selectionGreen/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-selectionGreen backdrop-blur-md">
          {t("common.available")}
        </div>
        {studied ? (
          <div className="absolute right-4 top-4 rounded-full border border-selectionGreen/30 bg-selectionGreen/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-selectionGreen backdrop-blur-md">
            {t("studentDashboard.studied")}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 w-full items-start">
        <span className="badge badge-teal atlas-nowrap-label text-[10px] md:text-xs truncate max-w-full" title={localizedModel.level}>{localizedModel.level}</span>
        <span className="badge badge-active atlas-nowrap-label text-[10px] md:text-xs truncate max-w-full" title={localizedModel.type}>
          <span className="hidden sm:inline">{localizedModel.type}</span>
          <span className="sm:hidden text-[10px]">ATLAS NATIVE</span>
        </span>
        <span className="badge badge-gold atlas-nowrap-label text-[10px] md:text-xs truncate max-w-full" title={t("models.availableByInstitution")}>{t("models.availableByInstitution")}</span>
      </div>

      <div className="flex-1 flex flex-col min-w-0 w-full">
        <h3 className="text-lg md:text-xl font-bold text-clinicalWhite atlas-text-safe line-clamp-2" title={localizedModel.title}>{localizedModel.title}</h3>
        <p className="mt-2 text-sm leading-6 text-textMuted line-clamp-2 sm:line-clamp-3 md:line-clamp-2">{localizedModel.description}</p>
        <p className="mt-2 text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 atlas-nowrap-label truncate w-full" title={`${localizedModel.system} · ${localizedModel.region}`}>
          {localizedModel.system} &middot; {localizedModel.region}
        </p>
      </div>

      <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-200 w-full min-w-0 mt-auto shrink-0">
        <div className="flex justify-between gap-4 overflow-hidden"><span className="shrink-0 text-white/60">{t("models.estimatedTime")}</span><strong className="truncate text-right">{studyTime(model)}</strong></div>
        <div className="flex justify-between gap-4 overflow-hidden"><span className="shrink-0 text-white/60">{t("models.accesses")}</span><strong className="truncate text-right">{formatNumber(model.accessCount || 0, language)}</strong></div>
        <div className="flex justify-between gap-4 overflow-hidden"><span className="shrink-0 text-white/60">{t("common.status")}</span><strong className="truncate text-right text-selectionGreen">{t("common.available")}</strong></div>
      </div>

      <div className="w-full shrink-0">
        <div className="mb-2 flex items-center justify-between text-[10px] md:text-xs text-textMuted atlas-nowrap-label"><span>{t("models.personalProgress")}</span><span>{progress}%</span></div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden"><div className="h-2 rounded-full bg-techTeal transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full shrink-0">
        <Button variant="teal" className="w-full h-11" onClick={() => navigate(`/viewer/${modelRouteId(model)}`)}>{t("models.openModel")}</Button>
        <Button variant="outline" className="w-full h-11" onClick={() => navigate(`/models/${modelRouteId(model)}`)}>{t("models.viewDetails")}</Button>
        <Button variant={favorite ? "primary" : "ghost"} className="w-full h-10 sm:col-span-2 text-xs" onClick={handleFavorite}>
          {favorite ? t("models.favorited") : t("models.favorite")}
        </Button>
      </div>
    </Card>
  );
}
