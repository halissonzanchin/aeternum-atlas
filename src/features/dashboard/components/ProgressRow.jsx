import { useLanguage } from "../../../context/LanguageContext";
import { translateTaxonomy } from "../../../utils/modelI18n";

export default function ProgressRow({ item }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <strong className="min-w-0 truncate text-clinicalWhite">{translateTaxonomy(item.system, t, "systems")}</strong>
        <span className="shrink-0 text-textMuted">{item.studied}/{item.total}</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-techTeal" style={{ width: `${item.percent}%` }} />
      </div>
    </div>
  );
}
