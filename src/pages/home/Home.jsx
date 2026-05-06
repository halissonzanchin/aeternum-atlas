import Button from "../../components/Button/Button";
import AeternumLogo from "../../components/AeternumLogo";
import LanguageSelector from "../../components/LanguageSelector";
import LineIcon from "../../components/icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";

const modules = [
  ["navigation.anatomicalAtlas", "publicHome.modules.atlas", "library", "/atlas"],
  ["navigation.radiology", "publicHome.modules.radiology", "search", "/radiology"],
  ["navigation.videos", "publicHome.modules.videos", "camera", "/videos"],
  ["publicHome.contentTitle", "publicHome.modules.content", "layers", "/courses"],
  ["navigation.courses", "publicHome.modules.courses", "check", "/courses"],
  ["viewer.library", "publicHome.modules.library", "favorite", "/models"]
];

export default function Home({ navigate }) {
  const { t } = useLanguage();

  return (
    <main className="premium-page home-premium">
      <header className="premium-public-header">
        <button className="brand-lockup" onClick={() => navigate("/")} aria-label="Aeternum Atlas home">
          <AeternumLogo variant="horizontal" size="md" theme="transparent" />
        </button>

        <nav className="header-icon-cluster" aria-label={t("publicHome.toolsLabel")}>
          {[
            [t("publicHome.search"), "search"],
            [t("publicHome.notifications"), "help"],
            [t("publicHome.help"), "help"]
          ].map(([label, icon]) => (
            <button key={label} className="premium-icon-button" aria-label={label} data-tooltip={label}>
              <LineIcon name={icon} />
            </button>
          ))}
          <LanguageSelector compact />
        </nav>

        <div className="public-actions">
          <span className="public-mobile-language"><LanguageSelector compact /></span>
          <Button variant="outline" onClick={() => navigate("/login")}>{t("auth.login").toUpperCase()}</Button>
          <Button variant="teal" onClick={() => navigate("/register")}>{t("auth.register").toUpperCase()}</Button>
        </div>
      </header>

      <section className="home-hero">
        <div className="hero-copy fade-in-up">
          <p className="viewer-eyebrow">{t("publicHome.eyebrow")}</p>
          <AeternumLogo variant="full" size="xl" theme="transparent" />
          <p className="mx-auto mt-5 max-w-3xl text-center text-textMuted">
            {t("publicHome.description")}
          </p>
        </div>

        <div className="trial-banner fade-in-up" style={{ animationDelay: "90ms" }}>
          <div>
            <span>{t("publicHome.institutionalAccessTitle").toUpperCase()}</span>
            <p>{t("publicHome.institutionalAccessText")}</p>
          </div>
          <Button variant="teal" onClick={() => navigate("/register")}>{t("publicHome.createAccessButton").toUpperCase()}</Button>
        </div>

        <div className="home-content-grid fade-in-up" style={{ animationDelay: "150ms" }}>
          <button className="home-feature-card home-feature-primary" onClick={() => navigate("/models")}>
            <div className="feature-visual">
              <div className="body-silhouette" />
              <div className="scan-ring ring-one" />
              <div className="scan-ring ring-two" />
            </div>
            <div className="feature-content">
              <span className="premium-badge teal">{t("common.moduleMain")}</span>
              <h3>{t("navigation.models3d")}</h3>
              <p>{t("publicHome.primaryModuleDescription")}</p>
            </div>
          </button>

          <div className="home-module-grid">
            {modules.map(([titleKey, descriptionKey, icon, path]) => (
              <button
                key={titleKey}
                className="home-feature-card"
                onClick={() => navigate(path)}
                aria-label={t(titleKey)}
              >
                <span className="module-icon">
                  <LineIcon name={icon} />
                </span>
                <span className="premium-badge teal">{t("common.available")}</span>
                <h3>{t(titleKey)}</h3>
                <p>{t(descriptionKey)}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className="premium-footer">
        {t("publicHome.footer")}
      </footer>
    </main>
  );
}
