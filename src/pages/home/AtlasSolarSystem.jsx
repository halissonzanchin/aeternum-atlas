import { useEffect, useState } from "react";

const PLANETS = [
  {
    id: "models",
    labelKey: "publicHome.interfaceMetricModels",
    titleKey: "publicHome.heroFeatures.models.title",
    descriptionKey: "publicHome.primaryModuleDescription",
    path: "/models",
    radius: "clamp(108px, 7.8vw, 120px)",
    angle: 326,
    duration: "43s",
    direction: "normal",
    delay: "-11s"
  },
  {
    id: "systems",
    labelKey: "publicHome.interfaceMetricSystems",
    titleKey: "publicHome.heroFeatures.atlas.title",
    descriptionKey: "publicHome.modules.atlas",
    path: "/atlas",
    radius: "clamp(128px, 9.5vw, 146px)",
    angle: 56,
    duration: "61s",
    direction: "reverse",
    delay: "-23s"
  },
  {
    id: "content",
    labelKey: "publicHome.contentTitle",
    titleKey: "publicHome.heroFeatures.content.title",
    descriptionKey: "publicHome.modules.content",
    path: "/courses",
    radius: "clamp(168px, 12.7vw, 190px)",
    angle: 142,
    duration: "83s",
    direction: "normal",
    delay: "-37s"
  },
  {
    id: "courses",
    labelKey: "navigation.courses",
    titleKey: "navigation.courses",
    descriptionKey: "publicHome.modules.courses",
    path: "/courses",
    radius: "clamp(148px, 11.2vw, 168px)",
    angle: 220,
    duration: "54s",
    direction: "normal",
    delay: "-7s"
  },
  {
    id: "access",
    labelKey: "publicHome.interfaceMetricAccess",
    titleKey: "publicHome.institutionalAccessTitle",
    descriptionKey: "publicHome.institutionalAccessText",
    path: "/register",
    radius: "clamp(184px, 13.8vw, 208px)",
    angle: 288,
    duration: "104s",
    direction: "reverse",
    delay: "-49s"
  }
];

export default function AtlasSolarSystem({ t, onExplore }) {
  const [selectedId, setSelectedId] = useState(null);
  const selectedPlanet = PLANETS.find((planet) => planet.id === selectedId) ?? null;

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedId(null);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <div className={`p4-atlas-interface${selectedId ? " has-selection" : ""}`}>
      <div className="p4-interface-coordinate p4-interface-coordinate--top">
        <span>ATLAS INTERATIVO</span>
      </div>

      <div className="p4-interface-orbit" aria-label={t("publicHome.interfaceTitle")}>
        <span className="p4-orbit-ring p4-orbit-ring--outer" />
        <span className="p4-orbit-ring p4-orbit-ring--middle" />
        <span className="p4-orbit-ring p4-orbit-ring--inner" />
        <button type="button" className="p4-orbit-core" onClick={() => onExplore("/atlas")}>
          <span>ATLAS</span>
          <strong>360°</strong>
          <small>{t("publicHome.corePrompt")}</small>
        </button>

        {PLANETS.map((planet) => {
          const selected = selectedId === planet.id;
          return (
            <span
              key={planet.id}
              className={`p4-planet-slot p4-planet-slot--${planet.id}${selected ? " is-selected" : ""}`}
              style={{
                "--planet-radius": planet.radius,
                "--planet-angle": `${planet.angle}deg`,
                "--planet-counter-start": `${-planet.angle}deg`,
                "--planet-counter-end": `${-(planet.angle + 360)}deg`,
                "--planet-duration": planet.duration,
                "--planet-direction": planet.direction,
                "--planet-delay": planet.delay
              }}
            >
              <span className="p4-planet-anchor">
                <button
                  type="button"
                  className="p4-planet"
                  aria-expanded={selected}
                  aria-label={`${t(planet.titleKey)} — ${t(planet.descriptionKey)}`}
                  onClick={() => setSelectedId(selected ? null : planet.id)}
                >
                  <span className="p4-planet-compact">
                    <span>{t(planet.labelKey)}</span>
                  </span>
                </button>
              </span>
            </span>
          );
        })}
      </div>

      {selectedPlanet && (
        <aside className="p4-module-panel" aria-live="polite">
          <button
            type="button"
            className="p4-module-panel-close"
            aria-label={t("publicHome.closePlanet")}
            onClick={() => setSelectedId(null)}
          >
            ×
          </button>
          <small>ATLAS 360</small>
          <h3>{t(selectedPlanet.titleKey)}</h3>
          <p>{t(selectedPlanet.descriptionKey)}</p>
          <button
            type="button"
            className="p4-module-panel-action"
            onClick={() => onExplore(selectedPlanet.path)}
          >
            {t("publicHome.exploreResource")}
            <span aria-hidden="true">↗</span>
          </button>
        </aside>
      )}

      <div className="p4-interface-caption">
        <span><i />{selectedPlanet ? t(selectedPlanet.labelKey) : t("publicHome.exploreOrbits")}</span>
      </div>
    </div>
  );
}
