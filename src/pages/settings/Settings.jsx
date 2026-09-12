import { A26FeatureShell, A26PageHeader } from "../../components/aeternum-26";
import SettingsPanel from "../../components/SettingsPanel/SettingsPanel";
import { useLanguage } from "../../context/LanguageContext";

export default function Settings({ user, onLogout, notify }) {
  const { t } = useLanguage();
  return (
    <A26FeatureShell
      variant="standard"
      header={
        <A26PageHeader
          eyebrow={t("settings.eyebrow")}
          title={t("settings.title")}
          description={t("settings.description")}
        />
      }
    >
      <SettingsPanel user={user} onLogout={onLogout} notify={notify} />
    </A26FeatureShell>
  );
}
