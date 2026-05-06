import SettingsPanel from "../../components/SettingsPanel/SettingsPanel";
import { useLanguage } from "../../context/LanguageContext";

export default function Settings({ user, onLogout, notify }) {
  const { t } = useLanguage();
  return (
    <>
      <div className="page-title">
        <p className="eyebrow">{t("settings.eyebrow")}</p>
        <h1 className="display-title">{t("settings.title")}</h1>
        <p className="mt-3 text-textMuted">{t("settings.description")}</p>
      </div>
      <SettingsPanel user={user} onLogout={onLogout} notify={notify} />
    </>
  );
}
