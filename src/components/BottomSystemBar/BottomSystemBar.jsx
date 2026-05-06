import LineIcon from "../icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";

function statusLabel(status, t) {
  const labels = {
    active: t("common.active"),
    inactive: t("common.inactive"),
    blocked: t("common.blocked"),
    disabled: t("common.disabled")
  };
  return labels[status] || t("common.inactive");
}

export default function BottomSystemBar({ systems = [], onToggleSystem }) {
  const { t } = useLanguage();
  return (
    <nav className="bottom-system-bar" aria-label={t("viewer.anatomicalStructures")}>
      {systems.map(system => (
        <button
          key={system.id}
          className={`system-pill is-${system.status}`}
          onClick={() => onToggleSystem(system)}
          aria-pressed={system.status === "active"}
          aria-label={`${t(`viewer.systems.${system.id}`)}: ${statusLabel(system.status, t)}`}
          data-tooltip={`${t(`viewer.systems.${system.id}`)}: ${statusLabel(system.status, t)}`}
        >
          <span className="system-icon">
            <LineIcon name={system.status === "blocked" ? "lock" : "layers"} className="h-5 w-5" />
          </span>
          <span className="system-name">{t(`viewer.systems.${system.id}`)}</span>
          <small>{statusLabel(system.status, t)}</small>
        </button>
      ))}
    </nav>
  );
}
