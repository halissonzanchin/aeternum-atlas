import { useMemo, useState } from "react";
import LineIcon from "../icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";
import { translateModelSummary } from "../../utils/modelI18n";

export default function SearchOverlay({ open, onClose, models = [], structures = [], onSelectStructure, onOpenModel }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const modelResults = models.map(model => {
      const localizedModel = translateModelSummary(model, t);
      return {
        id: model.id,
        type: t("viewer.searchTypes.model"),
        title: localizedModel.title,
        subtitle: `${localizedModel.system || localizedModel.category} — ${localizedModel.region || localizedModel.category}`,
        action: () => {
          onOpenModel(model.id);
          onClose();
        }
      };
    });
    const structureResults = structures.map(structure => ({
      id: structure.id,
      type: t("viewer.searchTypes.structure"),
      title: structure.name,
      subtitle: `${structure.system || t("models.system")} — ${structure.region || t("models.region")}`,
      action: () => {
        onSelectStructure(structure);
        onClose();
      }
    }));

    return [...structureResults, ...modelResults]
      .filter(item => !normalized || `${item.title} ${item.subtitle} ${item.type}`.toLowerCase().includes(normalized))
      .slice(0, 10);
  }, [query, models, structures, onClose, onOpenModel, onSelectStructure, t]);

  if (!open) return null;

  return (
    <div className="viewer-drawer-backdrop">
      <aside className="viewer-search-drawer" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="viewer-eyebrow">{t("viewer.globalSearch")}</p>
            <h2>{t("viewer.findAnatomy")}</h2>
          </div>
          <button className="viewer-icon-button" onClick={onClose} aria-label={t("viewer.closeSearch")} data-tooltip={t("viewer.closeSearch")}>
            <LineIcon name="close" />
          </button>
        </div>

        <label className="viewer-search-field">
          <LineIcon name="search" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            autoFocus
            placeholder={t("viewer.searchPlaceholder")}
          />
        </label>

        <div className="mt-5 space-y-3">
          {results.map(item => (
            <button key={`${item.type}-${item.id}`} className="viewer-search-result" onClick={item.action}>
              <span>
                <small>{item.type}</small>
                <strong>{item.title}</strong>
                <em>{item.subtitle}</em>
              </span>
              <LineIcon name="chevron" className="h-4 w-4 text-techTeal" />
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
