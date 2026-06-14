import { useEffect, useMemo, useState } from "react";
import ModelCard from "../../components/ModelCard/ModelCard";
import Card from "../../components/Card/Card";
import { getModelFilterOptions, listModelsForUser } from "../../services/modelService";
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
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const filterOptions = useMemo(() => getModelFilterOptions(models), [models]);

  useEffect(() => {
    trackEvent({ userId: user?.id, institutionId: user?.institutionId, eventType: "open_models_page" });
  }, [user?.id, user?.institutionId]);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setLoadError("");

    listModelsForUser(user)
      .then(items => {
        if (mounted) setModels(items);
      })
      .catch(error => {
        console.error("[models-page] Falha ao carregar catálogo real.", error);
        if (mounted) {
          setModels([]);
          setLoadError(t("models.catalogLoadError"));
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user, t]);

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
          {filterOptions.systems.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "systems")}</option>)}
        </select>
        <select className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70" value={category} onChange={event => setCategory(event.target.value)}>
          <option value="Todas">{t("models.allFem")}</option>
          {filterOptions.categories.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "categories")}</option>)}
        </select>
        <select className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70" value={region} onChange={event => setRegion(event.target.value)}>
          <option value="Todas">{t("models.allFem")}</option>
          {filterOptions.regions.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "regions")}</option>)}
        </select>
        <select className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70" value={level} onChange={event => setLevel(event.target.value)}>
          <option value="Todos">{t("models.all")}</option>
          {filterOptions.levels.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "levels")}</option>)}
        </select>
        <select className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70" value={type} onChange={event => setType(event.target.value)}>
          <option value="Todos">{t("models.all")}</option>
          {filterOptions.types.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "types")}</option>)}
        </select>
      </div>

      {loading ? (
        <Card>
          <p className="text-textMuted">{t("models.catalogLoading")}</p>
        </Card>
      ) : loadError ? (
        <Card>
          <p className="text-textMuted">{loadError}</p>
        </Card>
      ) : !models.length ? (
        <Card>
          <p className="text-textMuted">{t("models.emptyCatalog")}</p>
        </Card>
      ) : !filtered.length ? (
        <Card>
          <p className="text-textMuted">{t("models.emptyFilteredCatalog")}</p>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(model => <ModelCard key={model.id} model={model} user={user} navigate={navigate} />)}
        </div>
      )}
    </>
  );
}
