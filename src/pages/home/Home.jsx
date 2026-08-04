/* eslint-disable no-unused-vars -- o parser ESLint atual não contabiliza identificadores usados apenas em JSX */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AeternumLogo from "../../components/AeternumLogo";
import LanguageSelector from "../../components/LanguageSelector";
import LineIcon from "../../components/icons/LineIcon";
import { A26Button, A26Card, A26Surface } from "../../components/aeternum-26";
import { useLanguage } from "../../context/LanguageContext";
import AtlasSolarSystem from "./AtlasSolarSystem";
import ParticleMeshBackground from "./ParticleMeshBackground";
import "./HomePriorityOne.css";
import "./HomePriorityThree.css";
import "./HomePriorityFour.css";
import "./AtlasSolarSystemPremium.css";

const headerNavItems = [
  ["navigation.models3d", "layers", "/models"],
  ["navigation.anatomicalAtlas", "library", "/atlas"],
  ["publicHome.contentTitle", "note", "/courses"],
  ["viewer.library", "favorite", "/models"],
  ["publicHome.navAboutUs", "home", "#home-footer"]
];

export default function Home({ navigate }) {
  const { t } = useLanguage();
  const heroRef = useRef(null);
  const reducedMotionRef = useRef(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [headerScrolled, setHeaderScrolled] = useState(false);

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
    const updateHeader = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => setHeaderScrolled(window.scrollY > 36));
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateHeader);
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
      <main className="premium-page home-premium cinematic-home" style={cinematicStyle}>
      <a className="p3-skip-link" href="#home-hero">{t("publicHome.skipToContent")}</a>
      <A26Surface
        as="header"
        material="regular"
        className={`premium-public-header cinematic-public-header a26-public-header${headerScrolled ? " is-scrolled" : ""}`}
        data-testid="a26-public-header"
      >
        <button className="brand-lockup" onClick={() => navigate("/")} aria-label={t("publicHome.homeLabel")}>
          <AeternumLogo variant="horizontal" size="md" theme="transparent" />
        </button>

        <nav className="header-icon-cluster public-home-nav" aria-label={t("publicHome.toolsLabel")}>
          {headerNavItems.map(([labelKey, icon, target]) => (
            <A26Button
              key={labelKey}
              variant="liquid"
              className="public-home-nav-button"
              icon={<LineIcon name={icon} />}
              onClick={() => {
                if (target.startsWith("#")) {
                  document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  return;
                }
                navigate(target);
              }}
            >
              {t(labelKey)}
            </A26Button>
          ))}
        </nav>

        <div className="public-actions">
          <span className="public-desktop-language"><LanguageSelector compact /></span>
          <span className="public-mobile-language"><LanguageSelector compact /></span>
          <A26Button variant="liquid" aria-label={t("auth.login")} onClick={() => navigate("/login")}>
            <span className="public-login-full">{t("auth.login").toUpperCase()}</span>
            <span className="public-login-short">{t("auth.loginShort").toUpperCase()}</span>
          </A26Button>
          <A26Button variant="primary" onClick={() => navigate("/register")}>{t("auth.register").toUpperCase()}</A26Button>
        </div>
      </A26Surface>

      <section
        id="home-hero"
        ref={heroRef}
        className="home-hero cinematic-home-hero aeternum-hero"
        tabIndex="-1"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <div className="aeternum-hero-background" aria-hidden="true">
          <ParticleMeshBackground />
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
            </div>
          </div>

          <AtlasSolarSystem t={t} onExplore={(path = "/atlas") => navigate(path)} />

        </div>
      </section>

      <A26Card
        id="home-footer"
        as="footer"
        className="premium-footer p3-premium-footer a26-public-footer"
        data-testid="a26-public-footer"
      >
        <button className="p3-footer-brand" onClick={() => navigate("/")} aria-label={t("publicHome.homeLabel")}>
          <AeternumLogo variant="horizontal" size="sm" theme="transparent" />
        </button>
        <nav className="p3-footer-nav" aria-label={t("publicHome.footerNavigationLabel")}>
          <button onClick={() => navigate("/models")}>{t("navigation.models3d")}</button>
          <button onClick={() => navigate("/atlas")}>{t("navigation.anatomicalAtlas")}</button>
          <button onClick={() => navigate("/courses")}>{t("navigation.courses")}</button>
        </nav>
        <div className="p3-footer-status">
          <span aria-hidden="true" />
          {t("publicHome.platformStatus")}
        </div>
        <p>{t("publicHome.footer")}</p>
      </A26Card>
      </main>
    </>
  );
}
