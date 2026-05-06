import { useState } from "react";
import AeternumLogo from "../AeternumLogo";
import LineIcon from "../icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";

const tabs = [
  ["account", "settings.tabs.account"],
  ["notifications", "settings.tabs.notifications"],
  ["preferences", "settings.tabs.preferences"],
  ["language", "settings.tabs.language"],
  ["license", "settings.tabs.license"],
  ["share", "settings.tabs.share"],
  ["about", "settings.tabs.about"]
];

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button className={`toggle-switch ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)} aria-label={label} aria-pressed={checked}>
      <span />
    </button>
  );
}

function SettingCard({ title, children, icon = "settings" }) {
  return (
    <div className="settings-card">
      <span className="settings-card-icon"><LineIcon name={icon} /></span>
      <div className="min-w-0 flex-1">
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export default function SettingsPanel({ open = true, onClose, user, notify = () => {}, onLogout = () => {} }) {
  const { language, setLanguage, availableLanguages, t } = useLanguage();
  const [tab, setTab] = useState("account");
  const [license, setLicense] = useState("");
  const [prefs, setPrefs] = useState({
    tabs: true,
    tools: true,
    capture: true,
    help: true,
    fullRotation: true,
    sync: false,
    animations: true,
    privacy: true,
    updates: true
  });

  if (!open) return null;

  const content = (
    <section className="settings-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="viewer-eyebrow">{t("settings.eyebrow")}</p>
          <h2>{t("settings.panelTitle")}</h2>
        </div>
        {onClose ? (
          <button className="viewer-icon-button" onClick={onClose} aria-label={t("settings.closeSettings")} data-tooltip={t("settings.closeSettings")}>
            <LineIcon name="close" />
          </button>
        ) : null}
      </div>

      <div className="viewer-tabs settings-tabs mt-5" role="tablist" aria-label={t("settings.title")}>
        {tabs.map(([id, labelKey]) => (
          <button key={id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)} role="tab" aria-selected={tab === id}>
            {t(labelKey)}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {tab === "account" ? (
          <>
            <SettingCard title={t("settings.account")} icon="home">
              <p>{user?.name || t("auth.userType")}</p>
              <small>{user?.email || t("common.academicAccess")}</small>
            </SettingCard>
            <SettingCard title={t("settings.academicProfile")} icon="library">
              <p>{user?.userType || user?.user_type || "Estudante"}</p>
              <small>{user?.institution || t("auth.institution")}</small>
            </SettingCard>
            <button className="viewer-danger-button w-full" onClick={onLogout}>{t("settings.endSession")}</button>
          </>
        ) : null}

        {tab === "notifications" ? (
          <SettingCard title={t("settings.notificationCenter")} icon="help">
            <p>{t("settings.noNotifications")}</p>
            <small>{t("settings.notificationText")}</small>
          </SettingCard>
        ) : null}

        {tab === "preferences" ? (
          <>
            {Object.entries({
              tabs: t("settings.preferences.tabs"),
              tools: t("settings.preferences.tools"),
              capture: t("settings.preferences.capture"),
              help: t("settings.preferences.help"),
              fullRotation: t("settings.preferences.fullRotation"),
              sync: t("settings.preferences.sync"),
              animations: t("settings.preferences.animations"),
              privacy: t("settings.preferences.privacy"),
              updates: t("settings.preferences.updates")
            }).map(([key, label]) => (
              <div key={key} className="viewer-pref-row">
                <span>{label}</span>
                <ToggleSwitch checked={prefs[key]} label={label} onChange={value => setPrefs(current => ({ ...current, [key]: value }))} />
              </div>
            ))}
          </>
        ) : null}

        {tab === "language" ? (
          <SettingCard title={t("settings.interfaceLanguage")} icon="settings">
            <label className="premium-field">
              <span>{t("auth.preferredLanguage")}</span>
              <select value={language} onChange={event => setLanguage(event.target.value)}>
                {availableLanguages.map(item => <option key={item.code} value={item.code}>{item.nativeName}</option>)}
              </select>
            </label>
            <button className="viewer-primary-button mt-4" onClick={() => notify(t("settings.languageSaved"))}>{t("settings.saveLanguage")}</button>
          </SettingCard>
        ) : null}

        {tab === "license" ? (
          <SettingCard title={t("settings.institutionalCode")} icon="lock">
            <p>{user?.institution || t("auth.institution")}</p>
            <small>{t("license.linkedLicense")}: {user?.licenseStatus || t("common.active")}</small>
            <label className="premium-field">
              <span>{t("settings.redeemLicense")}</span>
              <input value={license} onChange={event => setLicense(event.target.value)} placeholder="AA-UNIVERSIDADE-2026" />
            </label>
            <button className="viewer-primary-button mt-4" onClick={() => notify(license ? t("settings.codeValidated") : t("settings.informCode"))}>{t("settings.redeemCode")}</button>
          </SettingCard>
        ) : null}

        {tab === "share" ? (
          <>
            <SettingCard title={t("settings.studyGroups")} icon="library">
              <p>{t("settings.groupsText")}</p>
              <small>{t("settings.groupsHelp")}</small>
            </SettingCard>
            <div className="grid gap-3 sm:grid-cols-2">
              <button className="viewer-primary-button w-full" onClick={() => notify(t("settings.groupCreationPrepared"))}>{t("settings.createGroup")}</button>
              <button className="viewer-secondary-button w-full" onClick={() => notify(t("settings.groupSearchPrepared"))}>{t("settings.searchGroup")}</button>
            </div>
          </>
        ) : null}

        {tab === "about" ? (
          <SettingCard title="Aeternum Atlas" icon="layers">
            <div className="mb-4">
              <AeternumLogo variant="symbol" size="md" theme="transparent" />
            </div>
            <p>{t("settings.aboutText")}</p>
            <small>{t("settings.version")}</small>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="viewer-secondary-button">{t("settings.privacy")}</button>
              <button className="viewer-secondary-button">{t("settings.terms")}</button>
            </div>
          </SettingCard>
        ) : null}
      </div>
    </section>
  );

  if (!onClose) return content;

  return (
    <div className="viewer-drawer-backdrop">
      <aside className="viewer-settings-drawer" role="dialog" aria-modal="true">
        {content}
      </aside>
    </div>
  );
}
