import { useMemo } from "react";
import { atlasPathForItem, atlasStructure, atlasSubcategoryPath, findAtlasItemBySlug, slugifyAtlasLabel } from "../../data/atlasStructure";
import { useLanguage } from "../../context/LanguageContext";
import { translateTaxonomy } from "../../utils/modelI18n";
import { A26Surface } from "../../components/aeternum-26";

function atlasTitle(item, t) {
  return t(`atlas.modules.${item.slug}.title`);
}

function atlasDescription(item, t) {
  return t(`atlas.modules.${item.slug}.description`);
}

function AtlasCard({ item, isActive, navigate, t }) {
  const title = atlasTitle(item, t);

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
      <span className="status-badge">{t("common.available")}</span>

      <div className="atlas-card__body">
        <h3>{title}</h3>
        <p>{atlasDescription(item, t)}</p>

        {item.subcategories.length > 0 && (
          <div className="subcategories" aria-label={t("atlas.subcategoriesOf", { title })}>
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

export default function Atlas({ path = "/atlas", navigate }) {
  const { t } = useLanguage();
  const selectedSlug = path.split("/")[2] || "";
  const selectedSubcategory = path.split("/")[3] || "";
  const selectedItem = useMemo(() => findAtlasItemBySlug(selectedSlug), [selectedSlug]);

  return (
    <section className="atlas-page fade-in-up">
      <div className="page-title atlas-page__header">
        <p className="eyebrow">{t("common.module")}</p>
        <h1 className="display-title">{t("modules.atlasTitle")}</h1>
        <p className="mt-3 text-textMuted">
          {t("atlas.pageDescription")}
        </p>
      </div>

      {selectedItem && (
        <A26Surface material="clear" tone="teal" className="atlas-context-panel">
          <span>{t("atlas.selectedRegion")}</span>
          <strong>{atlasTitle(selectedItem, t)}</strong>
          <p>
            {selectedSubcategory
              ? t("atlas.subcategoryPrepared")
              : atlasDescription(selectedItem, t)}
          </p>
        </A26Surface>
      )}

      <div className="atlas-grid">
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
