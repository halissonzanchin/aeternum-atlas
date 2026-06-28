import LineIcon from "../icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";

const tools = [
  ["hub", "viewer.toolbar.hub", "home"],
  ["painel", "Painel", "menu"],
  ["marcadores", "Marcadores", "bookmark"],
  ["simulado", "Simulado / Quiz", "file-text"],
  ["tutor", "Tutor IA", "cpu"],
  ["guide", "viewer.toolbar.guide", "library"],
  ["camadas", "Camadas", "layers"],
  ["search", "viewer.toolbar.search", "search"],
  ["library", "viewer.toolbar.library", "library"],
  ["settings", "viewer.toolbar.settings", "settings"],
  ["help", "viewer.toolbar.help", "help"]
];

export default function RightToolbar({ onAction }) {
  const { t } = useLanguage();
  return (
    <aside className="right-toolbar" aria-label={t("settings.preferences.tools")}>
      {tools.map(([id, labelKey, icon]) => (
        <button key={id} onClick={() => onAction(id)} aria-label={t(labelKey)} data-tooltip={t(labelKey)}>
          <LineIcon name={icon} />
          <span>{labelKey.includes('.') ? t(labelKey) : labelKey}</span>
        </button>
      ))}
    </aside>
  );
}
