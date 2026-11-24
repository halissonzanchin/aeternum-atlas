import { useEffect, useState } from "react";

const PLANETS = [
  {
    id: "models",
    labelKey: "publicHome.interfaceMetricModels",
    titleKey: "publicHome.heroFeatures.models.title",
    descriptionKey: "publicHome.primaryModuleDescription",
    path: "/models",
    radius: "clamp(120px, 8.8vw, 128px)",
    angle: 0,
    duration: "60s",
    direction: "normal",
    delay: "0s"
  },
  {
    id: "systems",
    labelKey: "publicHome.interfaceMetricSystems",
    titleKey: "publicHome.heroFeatures.atlas.title",
    descriptionKey: "publicHome.modules.atlas",
    path: "/atlas",
    radius: "clamp(120px, 8.8vw, 128px)",
    angle: 180,
    duration: "60s",
    direction: "normal",
    delay: "0s"
  },
  {
    id: "content",
    labelKey: "publicHome.contentTitle",
    titleKey: "publicHome.heroFeatures.content.title",
    descriptionKey: "publicHome.modules.content",
    path: "/courses",
    radius: "clamp(202px, 15vw, 218px)",
    angle: 45,
    duration: "90s",
    direction: "reverse",
    delay: "0s"
  },
  {
    id: "courses",
    labelKey: "navigation.courses",
    titleKey: "navigation.courses",
    descriptionKey: "publicHome.modules.courses",
    path: "/courses",
    radius: "clamp(202px, 15vw, 218px)",
    angle: 165,
    duration: "90s",
    direction: "reverse",
    delay: "0s"
  },
  {
    id: "access",
    labelKey: "publicHome.interfaceMetricAccess",
    titleKey: "publicHome.institutionalAccessTitle",
    descriptionKey: "publicHome.institutionalAccessText",
    path: "/register",
    radius: "clamp(202px, 15vw, 218px)",
    angle: 285,
    duration: "90s",
    direction: "reverse",
    delay: "0s"
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
