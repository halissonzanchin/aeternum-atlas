import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "../../components/Button/Button";
import AeternumLogo from "../../components/AeternumLogo";
import LanguageSelector from "../../components/LanguageSelector";
import LineIcon from "../../components/icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";
import { CinematicScrollIndicator } from "./CinematicHomeEffects";
import SciFiHeroBackground from "./SciFiHeroBackground";
import { VascularBackground } from "./VascularBackground";

const modules = [
  ["navigation.anatomicalAtlas", "publicHome.modules.atlas", "library", "/atlas"],
  ["navigation.videos", "publicHome.modules.videos", "camera", "/videos"],
  ["publicHome.contentTitle", "publicHome.modules.content", "layers", "/courses"],
  ["navigation.courses", "publicHome.modules.courses", "check", "/courses"],
  ["viewer.library", "publicHome.modules.library", "favorite", "/models"]
];

const heroFeatures = [
  ["publicHome.heroFeatures.models.title", "publicHome.heroFeatures.models.description", "layers", "/models"],
  ["publicHome.heroFeatures.atlas.title", "publicHome.heroFeatures.atlas.description", "library", "/atlas"],
  ["publicHome.heroFeatures.content.title", "publicHome.heroFeatures.content.description", "note", "/courses"],
  ["publicHome.heroFeatures.access.title", "publicHome.heroFeatures.access.description", "lock", "/register"],
  ["publicHome.heroFeatures.study.title", "publicHome.heroFeatures.study.description", "target", "/models"]
];

const headerNavItems = [
  ["navigation.models3d", "layers", "/models"],
  ["navigation.anatomicalAtlas", "library", "/atlas"],
  ["publicHome.contentTitle", "note", "/courses"],
  ["viewer.library", "favorite", "/models"],
  ["publicHome.navAboutUs", "home", "#home-modules"]
];

export default function Home({ navigate }) {
  const { t } = useLanguage();
  const heroRef = useRef(null);
  const reducedMotionRef = useRef(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [pageScrollProgress, setPageScrollProgress] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => {
      reducedMotionRef.current = media.matches;
      if (media.matches) {
        setScrollProgress(1);
        setPointer({ x: 0, y: 0 });
      }
    };

    syncPreference();
    media.addEventListener("change", syncPreference);

    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (reducedMotionRef.current) {
      return undefined;
    }

    let frame = 0;
    const updateProgress = () => {
      if (!heroRef.current) {
        return;
      }

      const rect = heroRef.current.getBoundingClientRect();
      const revealDistance = Math.max(window.innerHeight * 0.9, rect.height - window.innerHeight * 0.32);
      const nextProgress = Math.min(1, Math.max(0, -rect.top / revealDistance));
      setScrollProgress(Number(nextProgress.toFixed(3)));
    };

    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    let frame = 0;

    const updateScrollProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

      setPageScrollProgress(Math.min(100, Math.max(0, nextProgress)));
    };

    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateScrollProgress);
    };

    updateScrollProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const handlePointerMove = useCallback((event) => {
    if (reducedMotionRef.current) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3);
    const y = ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3);
    setPointer({ x, y });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setPointer({ x: 0, y: 0 });
  }, []);

  const cinematicStyle = useMemo(() => {
    const cardProgress = Math.min(1, scrollProgress * 1.55);
    const cueOpacity = Math.max(0, 1 - scrollProgress * 2.2);
    const portalProgress = Math.min(1, scrollProgress * 1.25);
    const depthProgress = Math.min(1, scrollProgress * 1.12);
    const parallaxProgress = Math.pow(scrollProgress, 0.82);
    const pointerX = Number(pointer.x);
    const pointerY = Number(pointer.y);

    return {
      "--home-scroll-progress": scrollProgress,
      "--home-card-progress": cardProgress,
      "--home-cue-opacity": cueOpacity,
      "--home-portal-progress": portalProgress,
      "--home-depth-progress": depthProgress,
      "--home-pointer-x": pointer.x,
      "--home-pointer-y": pointer.y,
      "--home-radial-x": `${50 + pointerX * 7}%`,
      "--home-radial-y": `${38 + pointerY * 7}%`,
      "--home-bg-x": `${pointerX * -18}px`,
      "--home-bg-y": `${pointerY * -16}px`,
      "--home-network-x": `${pointerX * 10}px`,
      "--home-network-y": `${pointerY * 8}px`,
      "--home-vascular-y": `${parallaxProgress * -8}px`,
      "--home-vascular-scale": 1 + depthProgress * 0.012,
      "--home-grid-y": `${parallaxProgress * 12}px`,
      "--home-ring-scale": 0.94 + depthProgress * 0.026,
      "--home-logo-x": `${pointerX * 10}px`,
      "--home-logo-y": `${pointerY * 8}px`,
      "--home-logo-rotate-x": `${pointerY * -2.4}deg`,
      "--home-logo-rotate-y": `${pointerX * 3}deg`,
      "--home-logo-scale": 0.9 + scrollProgress * 0.045,
      "--home-emblem-y": `${parallaxProgress * -10}px`,
      "--home-emblem-scale": 0.88 + depthProgress * 0.032,
      "--home-copy-y": `${parallaxProgress * -6}px`,
      "--home-feature-parallax-y": `${parallaxProgress * -8}px`,
      "--home-halo-x": `${pointerX * -8}px`,
      "--home-halo-y": `${pointerY * -5}px`,
      "--home-card-offset": `${(1 - cardProgress) * 18}px`,
      "--home-card-offset-soft": `${(1 - cardProgress) * 7}px`,
      "--home-bg-opacity": 0.72 + scrollProgress * 0.22,
      "--home-network-opacity": 0.10 + scrollProgress * 0.14,
      "--home-glow-opacity": 0.16 + scrollProgress * 0.10,
      "--home-floor-opacity": 0.38 + depthProgress * 0.14,
      "--home-halo-opacity": 0.28 + scrollProgress * 0.16,
      "--home-scan-opacity": 0.18 + scrollProgress * 0.24,
      "--home-blueprint-opacity": 0.78 - portalProgress * 0.24,
      "--home-brand-opacity": 0.82 + portalProgress * 0.18,
      "--home-brand-y": `${(1 - portalProgress) * 16}px`,
      "--home-atmosphere-opacity": 0.76 + depthProgress * 0.16
    };
  }, [pointer.x, pointer.y, scrollProgress]);

  return (
    <>
      <CinematicScrollIndicator
        label={t("publicHome.openAtlas")}
        progress={pageScrollProgress}
        onOpen={() => navigate("/models")}
      />

      <main className="premium-page home-premium cinematic-home" style={cinematicStyle}>
      <header className="premium-public-header cinematic-public-header">
        <button className="brand-lockup" onClick={() => navigate("/")} aria-label={t("publicHome.homeLabel")}>
          <AeternumLogo variant="horizontal" size="md" theme="transparent" />
        </button>

        <nav className="header-icon-cluster public-home-nav" aria-label={t("publicHome.toolsLabel")}>
          {headerNavItems.map(([labelKey, icon, target]) => (
            <button
              key={labelKey}
              type="button"
              className="public-home-nav-button"
              onClick={() => {
                if (target.startsWith("#")) {
                  document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  return;
                }
                navigate(target);
              }}
            >
              <LineIcon name={icon} />
              <span>{t(labelKey)}</span>
            </button>
          ))}
        </nav>

        <div className="public-actions">
          <span className="public-desktop-language"><LanguageSelector compact /></span>
          <span className="public-mobile-language"><LanguageSelector compact /></span>
          <Button variant="outline" onClick={() => navigate("/login")}>{t("auth.login").toUpperCase()}</Button>
          <Button variant="teal" onClick={() => navigate("/register")}>{t("auth.register").toUpperCase()}</Button>
        </div>
      </header>

      <section
        ref={heroRef}
        className="home-hero cinematic-home-hero aeternum-hero"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div className="aeternum-hero-background" aria-hidden="true">
          <SciFiHeroBackground />
          <VascularBackground />
          <div className="aeternum-hero-orb-glow" />
          <div className="aeternum-hero-floor-glow" />
        </div>

        <div className="aeternum-hero-content">
          <div className="aeternum-hero-copy">
            <span className="aeternum-hero-eyebrow">{t("publicHome.eyebrow")}</span>
            <div className="aeternum-hero-divider" />
            <h1>
              <span>AETERNUM</span>
              <span>ATLAS</span>
            </h1>
            <p>{t("publicHome.heroDescription")}</p>
            <div className="aeternum-hero-actions">
              <button type="button" className="aeternum-hero-primary" onClick={() => navigate("/models")}>
                {t("publicHome.heroExploreAtlas").toUpperCase()}
                <LineIcon name="chevron" className="aeternum-hero-action-icon" />
              </button>
              <button type="button" className="aeternum-hero-secondary" onClick={() => navigate("/models")}>
                <LineIcon name="target" className="aeternum-hero-action-icon" />
                {t("publicHome.heroDemo").toUpperCase()}
              </button>
            </div>
          </div>

          <div className="aeternum-hero-emblem-area" aria-label="Aeternum Atlas">
            <div className="aeternum-emblem-ring">
              <span className="aeternum-emblem-orbit aeternum-emblem-orbit-one" />
              <span className="aeternum-emblem-orbit aeternum-emblem-orbit-two" />
              <span className="aeternum-emblem-spark aeternum-emblem-spark-top" />
              <span className="aeternum-emblem-spark aeternum-emblem-spark-bottom" />
              <AeternumLogo variant="symbol" size="xl" theme="transparent" className="aeternum-hero-emblem" />
            </div>
          </div>
        </div>

        <div className="aeternum-hero-feature-bar" aria-label={t("publicHome.featuredResourcesLabel")}>
          {heroFeatures.map(([titleKey, descriptionKey, icon, path], index) => (
            <button
              type="button"
              key={titleKey}
              className="aeternum-hero-feature-card"
              onClick={() => navigate(path)}
              style={{ "--feature-delay": `${260 + index * 70}ms` }}
            >
              <span className="aeternum-hero-feature-icon">
                <LineIcon name={icon} />
              </span>
              <span>
                <strong>{t(titleKey)}</strong>
                <small>{t(descriptionKey)}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section id="home-modules" className="home-landing-modules" aria-label={t("publicHome.featuredResourcesLabel")}>
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
            {modules.map(([titleKey, descriptionKey, icon, path], index) => (
              <button
                key={titleKey}
                className="home-feature-card"
                onClick={() => navigate(path)}
                aria-label={t(titleKey)}
                style={{ "--module-delay": `${220 + index * 65}ms` }}
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
    </>
  );
}
