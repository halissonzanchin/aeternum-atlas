import { useEffect, useMemo, useState } from "react";
import ModelCard from "../../components/ModelCard/ModelCard";
import Card from "../../components/Card/Card";
import Button from "../../components/Button/Button";
import LineIcon from "../../components/icons/LineIcon";
import AeternumGlassSurface from "../../components/system/AeternumGlassSurface";
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterOptions = useMemo(() => getModelFilterOptions(models), [models]);
  const catalogSources = useMemo(() => ({
    institutional: models.filter(model => model.catalogSource === "supabase").length,
    reference: models.filter(model => model.catalogSource !== "supabase").length
  }), [models]);

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

  const activeFilterCount = [
    category !== "Todas",
    system !== "Todos",
    region !== "Todas",
    level !== "Todos",
    type !== "Todos"
  ].filter(Boolean).length;

  const resetFilters = () => {
    setQuery("");
    setCategory("Todas");
    setSystem("Todos");
    setRegion("Todas");
    setLevel("Todos");
    setType("Todos");
  };

  return (
    <div className="premium-dashboard models-page-aog fade-in-up pb-12 relative min-h-screen">
      <AeternumGlassSurface className="models-hero-aog" variant="regular" depth="standard">
        <div className="models-hero-aog__copy">
          <p className="models-hero-aog__eyebrow">{t("models.eyebrow")}</p>
          <h1>{t("models.title")}</h1>
          <p>{t("models.subtitle")}</p>
        </div>
        <div className="models-hero-aog__metric" aria-label={`${models.length} modelos disponíveis`}>
          <strong>{models.length}</strong>
          <span>Modelos disponíveis</span>
        </div>
      </AeternumGlassSurface>

      <div className="models-discovery-aog">
        <AeternumGlassSurface className="models-search-aog" variant="clear" depth="subtle">
          <LineIcon name="search" />
          <input
            placeholder={t("models.searchModel")}
            value={query}
            onChange={event => setQuery(event.target.value)}
            aria-label={t("models.searchModel")}
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca">
              <LineIcon name="close" />
            </button>
          ) : null}
        </AeternumGlassSurface>

        <Button
          variant={filtersOpen || activeFilterCount ? "outline" : "ghost"}
          className="models-filter-toggle"
          onClick={() => setFiltersOpen(open => !open)}
          aria-expanded={filtersOpen}
          aria-controls="models-advanced-filters"
        >
          <LineIcon name="tools" />
          <span>Filtros</span>
          {activeFilterCount ? <strong>{activeFilterCount}</strong> : null}
        </Button>

        {filtersOpen ? (
          <AeternumGlassSurface
            id="models-advanced-filters"
            className="models-filter-panel"
            variant="regular"
            depth="standard"
          >
            <div className="models-filter-panel__header">
              <div>
                <p>Refinar catálogo</p>
                <span>Combine somente os critérios necessários.</span>
              </div>
              {activeFilterCount ? (
                <button type="button" onClick={resetFilters}>Limpar filtros</button>
              ) : null}
            </div>
            <div className="models-filter-grid">
              <label>
                <span>{t("models.system")}</span>
                <select value={system} onChange={event => setSystem(event.target.value)}>
                  <option value="Todos">{t("models.all")}</option>
                  {filterOptions.systems.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "systems")}</option>)}
                </select>
              </label>
              <label>
                <span>Categoria</span>
                <select value={category} onChange={event => setCategory(event.target.value)}>
                  <option value="Todas">{t("models.allFem")}</option>
                  {filterOptions.categories.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "categories")}</option>)}
                </select>
              </label>
              <label>
                <span>{t("models.region")}</span>
                <select value={region} onChange={event => setRegion(event.target.value)}>
                  <option value="Todas">{t("models.allFem")}</option>
                  {filterOptions.regions.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "regions")}</option>)}
                </select>
              </label>
              <label>
                <span>Nível</span>
                <select value={level} onChange={event => setLevel(event.target.value)}>
                  <option value="Todos">{t("models.all")}</option>
                  {filterOptions.levels.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "levels")}</option>)}
                </select>
              </label>
              <label>
                <span>Tipo</span>
                <select value={type} onChange={event => setType(event.target.value)}>
                  <option value="Todos">{t("models.all")}</option>
                  {filterOptions.types.map(item => <option key={item} value={item}>{translateTaxonomy(item, t, "types")}</option>)}
                </select>
              </label>
            </div>
          </AeternumGlassSurface>
        ) : null}
      </div>

      {!loading && !loadError && models.length ? (
        <>
          {catalogSources.reference ? (
            <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-agedGold/20 bg-agedGold/[0.055] px-4 py-3 text-sm text-textMuted sm:flex-row sm:items-center sm:justify-between" role="status">
              <span>
                <strong className="text-agedGold">Origem do catálogo:</strong>{" "}
                {catalogSources.institutional
                  ? `${catalogSources.institutional} institucionais e ${catalogSources.reference} referências locais identificadas.`
                  : `${catalogSources.reference} referências locais. Nenhum registro institucional foi retornado pela fonte atual.`}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-agedGold">Fonte identificada</span>
            </div>
          ) : null}
          <div className="models-results-aog" aria-live="polite">
            <span>{filtered.length} {filtered.length === 1 ? "modelo encontrado" : "modelos encontrados"}</span>
            {query || activeFilterCount ? <button type="button" onClick={resetFilters}>Restaurar catálogo</button> : null}
          </div>
        </>
      ) : null}

      {loading ? (
        <Card className="max-w-lg text-center atlas-text-safe mx-auto mt-10 atlas-liquid-glass atlas-liquid-glass-card border-white/10">
          <p className="eyebrow atlas-nowrap-label">{t("common.loading")}</p>
          <h1 className="atlas-empty-state-title mt-2">{t("models.catalogLoading")}</h1>
        </Card>
      ) : loadError ? (
        <Card className="max-w-lg text-center atlas-text-safe mx-auto mt-10 atlas-liquid-glass atlas-liquid-glass-card border-red-500/20">
          <h1 className="atlas-empty-state-title text-red-400">{t("models.catalogLoadError") || loadError}</h1>
        </Card>
      ) : !models.length ? (
        <Card className="max-w-lg text-center atlas-text-safe mx-auto mt-10 atlas-liquid-glass atlas-liquid-glass-card border-white/10">
          <h1 className="atlas-empty-state-title">{t("models.emptyCatalog")}</h1>
          <p className="mt-4 text-textMuted atlas-empty-state-description">{t("models.emptyCatalogSubtitle") || "Nenhum modelo disponível."}</p>
        </Card>
      ) : !filtered.length ? (
        <Card className="max-w-lg text-center atlas-text-safe mx-auto mt-10 atlas-liquid-glass atlas-liquid-glass-card border-white/10 relative overflow-hidden">
          <div className="atlas-liquid-highlight"></div>
          <h1 className="atlas-empty-state-title relative z-10">{t("models.emptyFilteredCatalog")}</h1>
          <p className="mt-4 text-textMuted atlas-empty-state-description relative z-10">Tente mudar os filtros de busca para encontrar o que procura.</p>
          <Button variant="outline" onClick={resetFilters} className="mt-6 relative z-10">Limpar filtros</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 w-full min-w-0 max-w-full">
          {filtered.map(model => <ModelCard key={model.id} model={model} user={user} navigate={navigate} />)}
        </div>
      )}
    </div>
  );
}
