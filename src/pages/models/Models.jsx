import { useEffect, useMemo, useState } from "react";
import ModelCard from "../../components/ModelCard/ModelCard";
import { getCategories, getModels } from "../../services/modelService";
import { anatomicalSystems, modelTypes } from "../../data/mockModels";
import { trackEvent } from "../../services/analyticsService";
import { useLanguage } from "../../context/LanguageContext";
import { translatedSearchText, translateTaxonomy } from "../../utils/modelI18n";

export default function Models({ user, navigate }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [system, setSystem] = useState("Todos");
  const [region, setRegion] = useState("Todas");
  const [level, setLevel] = useState("Todos");
  const [type, setType] = useState("Todos");
  const models = getModels().filter(model => model.isActive);
  const categories = getCategories();
  const regions = Array.from(new Set(models.map(model => model.region).filter(Boolean)));

  useEffect(() => {
    trackEvent({ userId: user?.id, institutionId: user?.institutionId, eventType: "open_models_page" });
  }, [user?.id, user?.institutionId]);

  const filtered = useMemo(() => models.filter(model => {
    const matchesQuery = translatedSearchText(model, t).includes(query.toLowerCase());
    const matchesCategory = category === "Todas" || model.category === category;
    const matchesSystem = system === "Todos" || model.system === system;
    const matchesRegion = region === "Todas" || model.region === region;
    const matchesLevel = level === "Todos" || model.level === level;
    const matchesType = type === "Todos" || model.type === type;
    return matchesQuery && matchesCategory && matchesSystem && matchesRegion && matchesLevel && matchesType;
  }), [models, query, category, system, region, level, type, t]);

  return (
    <>
      <div className="page-title">
        <p className="eyebrow">{t("models.eyebrow")}</p>
        <h1 className="display-title">{t("models.title")}</h1>
        <p className="mt-3 text-textMuted">
          {t("models.subtitle")}
        </p>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <input className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70" placeholder={t("models.searchModel")} value={query} onChange={event => setQuery(event.target.value)} />
        <select className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70" value={system} onChange={event => setSystem(event.target.value)}>
          <option value="Todos">{t("models.all")}</option>
          {anatomicalSystems.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "systems")}</option>)}
        </select>
        <select className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70" value={category} onChange={event => setCategory(event.target.value)}>
          <option value="Todas">{t("models.allFem")}</option>
          {categories.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "categories")}</option>)}
        </select>
        <select className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70" value={region} onChange={event => setRegion(event.target.value)}>
          <option value="Todas">{t("models.allFem")}</option>
          {regions.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "regions")}</option>)}
        </select>
        <select className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70" value={level} onChange={event => setLevel(event.target.value)}>
          <option value="Todos">{t("models.all")}</option>
          <option value="Básico">{translateTaxonomy("Básico", t, "levels")}</option>
          <option value="Intermediário">{translateTaxonomy("Intermediário", t, "levels")}</option>
          <option value="Avançado">{translateTaxonomy("Avançado", t, "levels")}</option>
        </select>
        <select className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70" value={type} onChange={event => setType(event.target.value)}>
          <option value="Todos">{t("models.all")}</option>
          {modelTypes.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "types")}</option>)}
        </select>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(model => <ModelCard key={model.id} model={model} user={user} navigate={navigate} />)}
      </div>
    </>
  );
}
