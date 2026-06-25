import LineIcon from "../icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";

const tools = [
  ["hub", "viewer.toolbar.hub", "home"],
  ["search", "viewer.toolbar.search", "search"],
  ["library", "viewer.toolbar.library", "library"],
  ["settings", "viewer.toolbar.settings", "settings"],
  ["guide", "viewer.toolbar.guide", "library"],
  ["help", "viewer.toolbar.help", "help"]
];

export default function RightToolbar({ onAction }) {
  const { t } = useLanguage();
  return (
    <aside className="right-toolbar" aria-label={t("settings.preferences.tools")}>
      {tools.map(([id, labelKey, icon]) => (
        <button key={id} onClick={() => onAction(id)} aria-label={t(labelKey)} data-tooltip={t(labelKey)}>
          <LineIcon name={icon} />
          <span>{t(labelKey)}</span>
        </button>
      ))}
    </aside>
  );
}
