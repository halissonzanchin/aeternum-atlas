import { useMemo } from "react";
import { atlasPathForItem, atlasStructure, atlasSubcategoryPath, findAtlasItemBySlug, slugifyAtlasLabel } from "../../data/atlasStructure";
import { findLocalModel } from "../../data/localModels";
import { useLanguage } from "../../context/LanguageContext";
import { translateTaxonomy } from "../../utils/modelI18n";
import { A26Surface } from "../../components/aeternum-26";
import ModelCard from "../../components/ModelCard/ModelCard";
import LineIcon from "../../components/icons/LineIcon";

function atlasTitle(item, t) {
  const key = `atlas.modules.${item.slug}.title`;
  const translation = t(key);
  return translation && translation !== key ? translation : item.title;
}

function atlasDescription(item, t) {
  const key = `atlas.modules.${item.slug}.description`;
  const translation = t(key);
  return translation && translation !== key ? translation : item.description;
}

function AtlasCard({ item, isActive, navigate, t }) {
  const title = atlasTitle(item, t);
  const hasLinkedModels = item.linkedModelSlugs && item.linkedModelSlugs.length > 0;

  function openRegion() {
    navigate(atlasPathForItem(item));
  }

  function openSubcategory(event, subcategory) {
    event.stopPropagation();
    navigate(atlasSubcategoryPath(item, subcategory));
  }

  return (
    <A26Surface
      as="article"
      material="regular"
      interactive
      className={`atlas-card ${isActive ? "is-active" : ""}`}
      data-atlas-region={item.slug}
      role="button"
      tabIndex="0"
      onClick={openRegion}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openRegion();
        }
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="status-badge">{t("common.available")}</span>
        {hasLinkedModels && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1 font-semibold">
            <span>🧊</span> {t("atlas.linkedModelBadge")}
          </span>
        )}
      </div>

      <div className="atlas-card__body">
        <h3>{title}</h3>
        <p>{atlasDescription(item, t)}</p>

        {item.subcategories.length > 0 && (
          <div className="subcategories mt-3" aria-label={t("atlas.subcategoriesOf", { title })}>
            {item.subcategories.map((sub, index) => (
              <button
                key={index}
                type="button"
                className="subcategory-chip"
                data-atlas-subcategory={slugifyAtlasLabel(sub)}
                onClick={(event) => openSubcategory(event, sub)}
              >
                {translateTaxonomy(sub, t, "atlasSubcategories")}
              </button>
            ))}
          </div>
        )}
      </div>
    </A26Surface>
  );
}

export default function Atlas({ path = "/atlas", user, navigate }) {
  const { t } = useLanguage();
  const selectedSlug = path.split("/")[2] || "";
  const selectedSubcategory = path.split("/")[3] || "";
  const selectedItem = useMemo(() => findAtlasItemBySlug(selectedSlug), [selectedSlug]);

  const linkedModels = useMemo(() => {
    if (!selectedItem || !selectedItem.linkedModelSlugs?.length) return [];
    return selectedItem.linkedModelSlugs.map((slug) => findLocalModel(slug)).filter(Boolean);
  }, [selectedItem]);

  return (
    <section className="atlas-page fade-in-up space-y-6">
      <div className="page-title atlas-page__header">
        <p className="eyebrow">{t("common.module")}</p>
        <h1 className="display-title">{t("modules.atlasTitle")}</h1>
        <p className="mt-3 text-textMuted">
          {t("atlas.pageDescription")}
        </p>
      </div>

      {/* Painel do Módulo Selecionado & Modelos 3D Vinculados */}
      {selectedItem && (
        <div className="space-y-4">
          <A26Surface material="clear" tone="teal" className="atlas-context-panel p-5 rounded-2xl border border-teal-500/30">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <span className="text-xs uppercase tracking-wider text-teal-400 font-bold block mb-1">
                  {t("atlas.selectedRegion")}
                </span>
                <strong className="text-xl text-white font-serif">{atlasTitle(selectedItem, t)}</strong>
                <p className="text-sm text-textMuted mt-1">
                  {selectedSubcategory
                    ? t("atlas.subcategoryPrepared")
                    : atlasDescription(selectedItem, t)}
                </p>
              </div>

              {linkedModels.length > 0 ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
                  <LineIcon name="box" className="w-4 h-4" />
                  <span>{t("atlas.linkedModelCount", { count: linkedModels.length })}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surfaceDark/60 border border-glassBorder/40 text-textMuted text-xs">
                  <span>{t("atlas.expandingStructure")}</span>
                </div>
              )}
            </div>
          </A26Surface>

          {/* Área de Exibição dos Modelos 3D Vinculados */}
          {linkedModels.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-teal-300">
                <LineIcon name="play" className="w-4 h-4" />
                <span>{t("atlas.linkedModelsTitle", { region: atlasTitle(selectedItem, t) })}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {linkedModels.map((model) => (
                  <ModelCard key={model.id} model={model} user={user} navigate={navigate} />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-surfaceDark/40 border border-glassBorder/30 text-textMuted text-xs text-center">
              {t("atlas.expandingStructure")}
            </div>
          )}
        </div>
      )}

      {/* Grid com todas as Macro Regiões Anatômicas */}
      <div className="atlas-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {atlasStructure.map((item) => (
          <AtlasCard
            key={item.slug}
            item={item}
            isActive={item.slug === selectedSlug}
            navigate={navigate}
            t={t}
          />
        ))}
      </div>
    </section>
  );
}
