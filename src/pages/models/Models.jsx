import { useEffect, useMemo, useState } from "react";
import ModelCard from "../../components/ModelCard/ModelCard";
import LineIcon from "../../components/icons/LineIcon";
import {
  A26Button,
  A26Card,
  A26EmptyState,
  A26ErrorState,
  A26LoadingState,
  A26Surface
} from "../../components/aeternum-26";
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
      <A26Card material="substantial" tone="teal" className="models-hero-aog a26-models-hero">
        <div className="models-hero-aog__copy">
          <p className="models-hero-aog__eyebrow">{t("models.eyebrow")}</p>
          <h1>{t("models.title")}</h1>
          <p>{t("models.subtitle")}</p>
        </div>
        <div className="models-hero-aog__metric" aria-label={`${models.length} modelos disponíveis`}>
          <strong>{models.length}</strong>
          <span>Modelos disponíveis</span>
        </div>
      </A26Card>

      <div className="models-discovery-aog">
        <A26Surface material="clear" tone="teal" className="models-search-aog">
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
        </A26Surface>

        <A26Button
          variant={filtersOpen || activeFilterCount ? "outline" : "ghost"}
          className="models-filter-toggle"
          onClick={() => setFiltersOpen(open => !open)}
          aria-expanded={filtersOpen}
          aria-controls="models-advanced-filters"
        >
          <LineIcon name="tools" />
          <span>Filtros</span>
          {activeFilterCount ? <strong>{activeFilterCount}</strong> : null}
        </A26Button>

        {filtersOpen ? (
          <A26Card
            id="models-advanced-filters"
            className="models-filter-panel"
            material="regular"
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
          </A26Card>
        ) : null}
      </div>

      {!loading && !loadError && models.length ? (
        <>
          {catalogSources.reference ? (
            <A26Card as="div" material="clear" tone="gold" className="models-source-notice" role="status">
              <span>
                <strong className="text-agedGold">Origem do catálogo:</strong>{" "}
                {catalogSources.institutional
                  ? `${catalogSources.institutional} institucionais e ${catalogSources.reference} referências locais identificadas.`
                  : `${catalogSources.reference} referências locais. Nenhum registro institucional foi retornado pela fonte atual.`}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-agedGold">Fonte identificada</span>
            </A26Card>
          ) : null}
          <div className="models-results-aog" aria-live="polite">
            <span>{filtered.length} {filtered.length === 1 ? "modelo encontrado" : "modelos encontrados"}</span>
            {query || activeFilterCount ? <button type="button" onClick={resetFilters}>Restaurar catálogo</button> : null}
          </div>
        </>
      ) : null}

      {loading ? (
        <A26LoadingState title={t("models.catalogLoading")} text="Validando a fonte institucional e preparando o catálogo anatômico." />
      ) : loadError ? (
        <A26ErrorState title={t("models.catalogLoadError") || loadError} text="O catálogo não pôde ser confirmado pela fonte atual." />
      ) : !models.length ? (
        <A26EmptyState title={t("models.emptyCatalog")} text={t("models.emptyCatalogSubtitle") || "Nenhum modelo disponível."} />
      ) : !filtered.length ? (
        <A26EmptyState
          title={t("models.emptyFilteredCatalog")}
          text="Tente mudar os filtros de busca para encontrar o que procura."
          action={<A26Button variant="liquid" onClick={resetFilters}>Limpar filtros</A26Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 w-full min-w-0 max-w-full">
          {filtered.map(model => <ModelCard key={model.id} model={model} user={user} navigate={navigate} />)}
        </div>
      )}
    </div>
  );
}
