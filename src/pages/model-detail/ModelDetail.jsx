import { useEffect, useMemo, useState } from "react";
import Button from "../../components/Button/Button";
import Card from "../../components/Card/Card";
import { getModelById } from "../../services/modelService";
import { completeModel, favoriteModel, trackEvent } from "../../services/analyticsService";
import { isFavoriteModel, isModelStudied } from "../../services/progressService";
import { useLanguage } from "../../context/LanguageContext";
import { translateModelSummary } from "../../utils/modelI18n";

const tabKeys = [
  ["overview", "viewer.overview"],
  ["objectives", "viewer.objectives"],
  ["structures", "viewer.anatomicalStructures"],
  ["clinical", "viewer.clinicalCorrelations"],
  ["guide", "viewer.studyGuide"],
  ["reference", "viewer.reference"]
];

function objectivesOf(model) {
  return model.objectives?.length ? model.objectives : model.learningObjectives || [];
}

function structuresOf(model) {
  return model.structures?.length ? model.structures : model.relatedStructures || [];
}

function clinicalOf(model) {
  if (model.clinicalCorrelations?.length) return model.clinicalCorrelations;
  return model.clinicalNotes ? [model.clinicalNotes] : [];
}

function guideOf(model, t) {
  if (model.studyGuide?.length) return model.studyGuide;
  return [
    t("models.defaultStudyGuide.observe"),
    t("models.defaultStudyGuide.identify"),
    t("models.defaultStudyGuide.correlate"),
    t("models.defaultStudyGuide.openViewer")
  ];
}

function ListContent({ items = [], ordered = false }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className="mt-3 grid gap-2 text-sm leading-6 text-slate-200">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{ordered ? `${index + 1}. ` : "• "}{item}</li>
      ))}
    </Tag>
  );
}

export default function ModelDetail({ id, user, navigate }) {
  const { t } = useLanguage();
  const model = getModelById(id);
  const localizedModel = useMemo(() => model ? translateModelSummary(model, t) : null, [model, t]);
  const [tab, setTab] = useState("overview");
  const [favorite, setFavorite] = useState(() => model ? isFavoriteModel(user, model.id) : false);
  const [studied, setStudied] = useState(() => model ? isModelStudied(user, model.id) : false);

  const currentContent = useMemo(() => {
    if (!localizedModel) return null;
    const content = {
      overview: <p className="mt-3 leading-7 text-textMuted">{localizedModel.overview || localizedModel.description}</p>,
      objectives: <ListContent items={objectivesOf(localizedModel)} />,
      structures: <ListContent items={structuresOf(localizedModel)} />,
      clinical: <ListContent items={clinicalOf(localizedModel)} />,
      guide: <ListContent items={guideOf(localizedModel, t)} ordered />,
      reference: (
        <div className="mt-3 grid gap-3 text-sm leading-6 text-textMuted">
          <p>{localizedModel.reference || localizedModel.references?.[0] || t("viewer.reference")}</p>
          <p>{(localizedModel.references || []).slice(1).join(" · ")}</p>
        </div>
      )
    };
    return content[tab];
  }, [localizedModel, tab, t]);

  useEffect(() => {
    if (model) {
      trackEvent({ userId: user?.id, institutionId: user?.institutionId, role: user?.role, modelId: model.id, eventType: "open_model_detail" });
    }
  }, [model?.id, user?.id, user?.institutionId, user?.role]);

  if (!model) {
    return (
      <Card>
        <h1 className="display-title">{t("models.modelNotFound")}</h1>
        <Button className="mt-5" variant="outline" onClick={() => navigate("/models")}>{t("actions.back")}</Button>
      </Card>
    );
  }

  function handleFavorite() {
    const added = favoriteModel(user, model);
    setFavorite(added);
  }

  function handleComplete() {
    completeModel(user, model);
    setStudied(true);
  }

  return (
    <>
      <div className="page-title grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="eyebrow">{localizedModel.system} · {localizedModel.region} · {localizedModel.type}</p>
          <h1 className="display-title">{localizedModel.title}</h1>
          <p className="mt-3 max-w-3xl text-textMuted">{localizedModel.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="badge badge-active">{t("models.availableByInstitution")}</span>
          <span className="badge badge-teal">{localizedModel.level}</span>
          <span className="badge badge-gold">{model.estimatedStudyTime}</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.68fr_0.32fr]">
        <Card>
          <div className="viewer-tabs px-0 pb-4">
            {tabKeys.map(([key, label]) => (
              <button key={key} className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
                {t(label)}
              </button>
            ))}
          </div>
          <section>
            <h2 className="text-xl font-bold text-clinicalWhite">{t(tabKeys.find(([key]) => key === tab)?.[1] || "viewer.overview")}</h2>
            {currentContent}
          </section>
        </Card>

        <Card>
          <h2 className="font-display text-2xl text-agedGold">{t("models.study")}</h2>
          <p className="mt-3 text-textMuted">{t("models.statusAvailableByLicense")}</p>
          <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
            <p><span className="block text-textMuted">{t("models.system")}</span>{localizedModel.system}</p>
            <p><span className="block text-textMuted">{t("models.region")}</span>{localizedModel.region}</p>
            <p><span className="block text-textMuted">{t("models.type")}</span>{localizedModel.type}</p>
            <p><span className="block text-textMuted">{t("models.estimatedTime")}</span>{model.estimatedStudyTime}</p>
          </div>
          <div className="mt-6 grid gap-3">
            <Button variant="teal" onClick={() => navigate(`/viewer/${model.id}`)}>{t("models.open3dViewer")}</Button>
            <Button variant={favorite ? "primary" : "outline"} onClick={handleFavorite}>{favorite ? t("models.favorited") : t("models.favorite")}</Button>
            <Button variant={studied ? "ghost" : "primary"} onClick={handleComplete}>{studied ? t("models.studyCompleted") : t("models.completeStudy")}</Button>
            <Button variant="ghost" onClick={() => navigate("/models")}>{t("models.backToLibrary")}</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
