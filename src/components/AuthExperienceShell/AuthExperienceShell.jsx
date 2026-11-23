/* eslint-disable no-unused-vars -- o parser ESLint atual não contabiliza identificadores usados apenas em JSX */
import AeternumLogo from "../AeternumLogo";
import LineIcon from "../icons/LineIcon";
import { A26Surface } from "../aeternum-26";
import { useLanguage } from "../../context/LanguageContext";

export default function AuthExperienceShell({
  children,
  wide = false,
  variant = "default",
  className = ""
}) {
  const { t } = useLanguage();

  const capabilities = [
    {
      icon: "layers",
      label: t("navigation.models3d"),
      description: t("publicHome.primaryModuleDescription")
    },
    {
      icon: "library",
      label: t("navigation.anatomicalAtlas"),
      description: t("publicHome.description")
    },
    {
      icon: "lock",
      label: t("common.institutionalAccess"),
      description: t("publicHome.institutionalAccessText")
    }
  ];

  const pageClasses = [
    "atlas-auth-page",
    variant === "beta" ? "atlas-auth-page--beta" : "",
    className
  ].filter(Boolean).join(" ");

  const shellClasses = [
    "atlas-auth-shell",
    wide ? "atlas-auth-shell--wide" : "",
    variant === "beta" ? "atlas-auth-shell--beta" : ""
  ].filter(Boolean).join(" ");

  const storyClasses = [
    "atlas-auth-story",
    variant === "beta" ? "atlas-auth-story--beta" : ""
  ].filter(Boolean).join(" ");

  const slotClasses = [
    "atlas-auth-panel-slot",
    variant === "beta" ? "atlas-auth-panel-slot--beta" : ""
  ].filter(Boolean).join(" ");

  return (
    <main className={pageClasses}>
      <div className={shellClasses}>
        <A26Surface
          as="section"
          material="regular"
          className={storyClasses}
          aria-label={t("common.appName")}
          data-testid="a26-auth-story"
        >
          <div className="atlas-auth-brand">
            <AeternumLogo variant="symbol" size="md" theme="transparent" />
            <div>
              <strong>AETERNUM ATLAS</strong>
              <span>{t("publicHome.subtitle")}</span>
            </div>
          </div>

          <div className="atlas-auth-story-copy">
            <span className="atlas-auth-kicker">{t("publicHome.cinematicSlogan")}</span>
            <p className="atlas-auth-story-title">{t("publicHome.title")}</p>
            <p>{t("publicHome.description")}</p>
          </div>

          <div className="atlas-auth-capabilities">
            {capabilities.map((item) => (
              <div key={item.label} className="atlas-auth-capability">
                <span className="atlas-auth-capability__icon">
                  <LineIcon name={item.icon} className="h-5 w-5" />
                </span>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="atlas-auth-status">
            <span aria-hidden="true" />
            <strong>{t("auth.secureAccess")}</strong>
            <small>{t("common.academicAccess")}</small>
          </div>
        </A26Surface>

        <div className={slotClasses}>
          {children}
        </div>
      </div>
    </main>
  );
}
