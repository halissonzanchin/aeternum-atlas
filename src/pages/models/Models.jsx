import { useEffect, useMemo, useState } from "react";
import ModelCard from "../../components/ModelCard/ModelCard";
import Card from "../../components/Card/Card";
import { getModelFilterOptions, listModelsForUser } from "../../services/modelService";
import { trackEvent } from "../../services/analytics/analyticsService";
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
      <div className="page-title atlas-text-safe">
        <p className="eyebrow atlas-nowrap-label">{t("models.eyebrow")}</p>
        <h1 className="atlas-fluid-title font-black text-clinicalWhite">{t("models.title")}</h1>
        <p className="mt-3 text-textMuted atlas-fluid-body">
          {t("models.subtitle")}
        </p>
      </div>

      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 w-full min-w-0">
        <input className="min-h-12 w-full min-w-0 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 py-3 text-sm text-clinicalWhite outline-none focus:border-techTeal/70 text-ellipsis overflow-hidden whitespace-nowrap" placeholder={t("models.searchModel")} value={query} onChange={event => setQuery(event.target.value)} />
        <select className="min-h-12 w-full min-w-0 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 py-3 text-sm text-clinicalWhite outline-none focus:border-techTeal/70 text-ellipsis overflow-hidden whitespace-nowrap" value={system} onChange={event => setSystem(event.target.value)}>
          <option value="Todos">{t("models.all")}</option>
          {filterOptions.systems.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "systems")}</option>)}
        </select>
        <select className="min-h-12 w-full min-w-0 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 py-3 text-sm text-clinicalWhite outline-none focus:border-techTeal/70 text-ellipsis overflow-hidden whitespace-nowrap" value={category} onChange={event => setCategory(event.target.value)}>
          <option value="Todas">{t("models.allFem")}</option>
          {filterOptions.categories.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "categories")}</option>)}
        </select>
        <select className="min-h-12 w-full min-w-0 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 py-3 text-sm text-clinicalWhite outline-none focus:border-techTeal/70 text-ellipsis overflow-hidden whitespace-nowrap" value={region} onChange={event => setRegion(event.target.value)}>
          <option value="Todas">{t("models.allFem")}</option>
          {filterOptions.regions.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "regions")}</option>)}
        </select>
        <select className="min-h-12 w-full min-w-0 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 py-3 text-sm text-clinicalWhite outline-none focus:border-techTeal/70 text-ellipsis overflow-hidden whitespace-nowrap" value={level} onChange={event => setLevel(event.target.value)}>
          <option value="Todos">{t("models.all")}</option>
          {filterOptions.levels.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "levels")}</option>)}
        </select>
        <select className="min-h-12 w-full min-w-0 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 py-3 text-sm text-clinicalWhite outline-none focus:border-techTeal/70 text-ellipsis overflow-hidden whitespace-nowrap" value={type} onChange={event => setType(event.target.value)}>
          <option value="Todos">{t("models.all")}</option>
          {filterOptions.types.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "types")}</option>)}
        </select>
      </div>

      {loading ? (
        <Card className="max-w-lg text-center atlas-text-safe mx-auto mt-10">
          <p className="eyebrow atlas-nowrap-label">{t("common.loading")}</p>
          <h1 className="atlas-empty-state-title mt-2">{t("models.catalogLoading")}</h1>
        </Card>
      ) : loadError ? (
        <Card className="max-w-lg text-center atlas-text-safe mx-auto mt-10">
          <h1 className="atlas-empty-state-title text-red-400">{t("models.catalogLoadError") || loadError}</h1>
        </Card>
      ) : !models.length ? (
        <Card className="max-w-lg text-center atlas-text-safe mx-auto mt-10">
          <h1 className="atlas-empty-state-title">{t("models.emptyCatalog")}</h1>
          <p className="mt-4 text-textMuted atlas-empty-state-description">{t("models.emptyCatalogSubtitle") || "Nenhum modelo disponível."}</p>
        </Card>
      ) : !filtered.length ? (
        <Card className="max-w-lg text-center atlas-text-safe mx-auto mt-10">
          <h1 className="atlas-empty-state-title">{t("models.emptyFilteredCatalog")}</h1>
          <p className="mt-4 text-textMuted atlas-empty-state-description">Tente mudar os filtros de busca.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 w-full min-w-0 max-w-full">
          {filtered.map(model => <ModelCard key={model.id} model={model} user={user} navigate={navigate} />)}
        </div>
      )}
    </>
  );
}
