import { useState } from "react";
import LineIcon from "../icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";

const defaultTabs = [
  "Informação",
  "Partes",
  "Superfícies",
  "Marcadores",
  "Secções transversais",
  "Modelos",
  "Nervos",
  "Artérias",
  "Suturas",
  "Craniometria",
  "Tratamentos",
  "Condições",
  "Exercícios"
];

const academicTabs = [
  "Visão geral",
  "Objetivos",
  "Estruturas anatômicas",
  "Correlações clínicas",
  "Guia de estudo",
  "Referência"
];

const tabLabels = {
  "Informação": "viewer.information",
  "Partes": "viewer.parts",
  "Superfícies": "viewer.surfaces",
  "Marcadores": "viewer.markers",
  "Secções transversais": "viewer.crossSections",
  "Modelos": "viewer.models",
  "Visão geral": "viewer.overview",
  "Objetivos": "viewer.objectives",
  "Estruturas anatômicas": "viewer.anatomicalStructures",
  "Correlações clínicas": "viewer.clinicalCorrelations",
  "Guia de estudo": "viewer.studyGuide",
  "Referência": "viewer.reference",
  Nervos: "viewer.extraTabs.nerves",
  Artérias: "viewer.extraTabs.arteries",
  Suturas: "viewer.extraTabs.sutures",
  Craniometria: "viewer.extraTabs.craniometry",
  Tratamentos: "viewer.extraTabs.treatments",
  Condições: "viewer.extraTabs.conditions",
  Exercícios: "viewer.extraTabs.exercises"
};

const tabFallbacks = {
  Nervos: ["Nervo alveolar inferior", "Nervo mentual", "Nervo lingual"],
  Artérias: ["Artéria alveolar inferior", "Artéria facial", "Artéria maxilar"],
  Suturas: ["Sínfise mandibular", "Articulação temporomandibular", "Inserções ligamentares"],
  Craniometria: ["Gônio", "Gnátio", "Pogônio", "Mentoniano"],
  Tratamentos: ["Redução de fraturas", "Planejamento ortognático", "Bloqueio anestésico"],
  Condições: ["Fratura mandibular", "Disfunção temporomandibular", "Alterações de oclusão"],
  Exercícios: ["Identificar marcos ósseos", "Relacionar nervos e forames", "Correlacionar trauma e anatomia"]
};

function valueOf(structure, key, fallback) {
  return structure?.[key] || structure?.[key.replace(/[A-Z]/g, match => `_${match.toLowerCase()}`)] || fallback;
}

function InfoBlock({ label, children }) {
  return (
    <div className="viewer-info-block">
      <span>{label}</span>
      <p>{children}</p>
    </div>
  );
}

function InformationTab({ structure, t }) {
  const features = structure?.keyFeatures || structure?.features || [];

  return (
    <div className="space-y-3">
      <InfoBlock label={t("viewer.infoLabels.location")}>{valueOf(structure, "location", t("viewer.notDefined"))}</InfoBlock>
      <InfoBlock label={t("viewer.infoLabels.type")}>{valueOf(structure, "type", t("viewer.notDefined"))}</InfoBlock>
      <InfoBlock label={t("viewer.infoLabels.function")}>{valueOf(structure, "function", t("viewer.notDefined"))}</InfoBlock>
      <InfoBlock label={t("viewer.infoLabels.clinicalNotes")}>{valueOf(structure, "clinicalNotes", t("viewer.notDefined"))}</InfoBlock>
      {features.length ? (
        <div className="viewer-info-block">
          <span>{t("viewer.infoLabels.keyFeatures")}</span>
          <ul className="mt-2 space-y-2">
            {features.map(item => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function PartsTab({ structure, activePart, onSelectPart, t }) {
  const parts = structure?.parts || [];

  if (!parts.length) {
    return <p className="viewer-empty-state">{t("viewer.emptyStates.noParts")}</p>;
  }

  return (
    <div className="space-y-3">
      {parts.map(part => (
        <button
          key={part.id || part.name}
          className={`viewer-part-row ${activePart?.name === part.name ? "is-active" : ""}`}
          onClick={() => onSelectPart(part)}
        >
          <span className="viewer-part-thumb" />
          <span className="min-w-0 flex-1 text-left">
            <strong>{part.name}</strong>
            <small>{part.latinName || part.latin_name || t("viewer.anatomicalNomenclature")}</small>
          </span>
          <LineIcon name="chevron" className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

function ListTab({ items = [], empty, onClick }) {
  if (!items.length) return <p className="viewer-empty-state">{empty}</p>;
  return (
    <div className="space-y-2">
      {items.map(item => {
        const label = typeof item === "string" ? item : item.name || item.plane || item.id;
        return (
        <button key={label} className="viewer-list-row text-left" onClick={() => onClick?.(label)}>
          <span>{label}</span>
          <LineIcon name="chevron" className="h-4 w-4 text-techTeal" />
        </button>
        );
      })}
    </div>
  );
}

function studyGuide(model, t) {
  if (model?.studyGuide?.length) return model.studyGuide;

  if (model?.id === "coracao-humano-superficial") {
    return [
      "Inicie observando o coração em vista anterior.",
      "Gire o modelo para reconhecer ápice e base.",
      "Localize os grandes vasos.",
      "Observe as faces cardíacas.",
      "Revise as anotações do Sketchfab.",
      "Marque o modelo como estudado ao finalizar."
    ];
  }

  return [
    t("models.defaultStudyGuide.observe"),
    t("models.defaultStudyGuide.identify"),
    t("models.defaultStudyGuide.correlate"),
    t("models.defaultStudyGuide.complete")
  ];
}

function academicObjectives(model) {
  return model?.objectives?.length ? model.objectives : model?.learningObjectives || [];
}

function academicStructures(model, structure) {
  if (model?.structures?.length) return model.structures;
  if (model?.relatedStructures?.length) return model.relatedStructures;
  return structure?.keyFeatures || structure?.features || [];
}

function academicClinicalNotes(model, structure) {
  if (model?.clinicalCorrelations?.length) return model.clinicalCorrelations;
  if (model?.clinicalNotes) return [model.clinicalNotes];
  if (structure?.clinicalNotes) return [structure.clinicalNotes];
  return [];
}

function academicReference(model, t) {
  if (model?.reference) return model.reference;
  if (model?.provider === "Sketchfab") return t("viewer.sketchfabReference", { author: model?.author || t("viewer.externalAuthor") });
  return t("viewer.internalModelReference");
}

export default function LeftInfoPanel({
  open,
  structure,
  model,
  actions = [],
  activePart,
  onAction,
  onSelectPart,
  onClose,
  academicMode = false
}) {
  const { t } = useLanguage();
  const [tab, setTab] = useState("Informação");
  const latin = structure?.latinName || structure?.latin_name || "Nomen anatomicum";
  const panelTabs = academicMode ? academicTabs : defaultTabs;
  const activeTab = panelTabs.includes(tab) ? tab : panelTabs[0];

  return (
    <>
      {open ? <button className="viewer-panel-scrim lg:hidden" onClick={onClose} aria-label={t("settings.closeSettings")} /> : null}
      <aside className={`left-info-panel ${open ? "is-open" : "is-collapsed"}`}>
        <div className="left-info-header">
          <div>
            <p className="viewer-eyebrow">{model?.category || model?.system || t("viewer.structure")}</p>
            <h1>{structure?.name || model?.title}</h1>
            <p>{latin}</p>
          </div>
          <button className="viewer-icon-button" onClick={onClose} aria-label={t("viewer.togglePanel")} data-tooltip={t("viewer.togglePanel")}>
            <LineIcon name="close" />
          </button>
        </div>

        {actions.length ? (
          <div className="viewer-action-grid">
            {actions.map(action => (
              <button key={action} onClick={() => onAction(action)} aria-label={action} data-tooltip={action}>
                <LineIcon name={action.includes("Isolar") ? "isolate" : action.includes("Ocultar") ? "eye" : "spark"} className="h-4 w-4" />
                <span>{action}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="viewer-tabs">
          {panelTabs.map(item => (
            <button key={item} className={activeTab === item ? "is-active" : ""} onClick={() => setTab(item)}>
              {t(tabLabels[item] || item)}
            </button>
          ))}
        </div>

        <div className="left-info-content">
          {activeTab === "Visão geral" ? (
            <div className="viewer-info-block">
              <span>{t("viewer.overview")}</span>
              <p>{structure?.description || model?.description}</p>
            </div>
          ) : null}
          {activeTab === "Objetivos" ? (
            <ListTab items={academicObjectives(model)} empty={t("viewer.emptyStates.noObjectives")} />
          ) : null}
          {activeTab === "Estruturas anatômicas" ? (
            <ListTab items={academicStructures(model, structure)} empty={t("viewer.emptyStates.noAnatomicalStructures")} />
          ) : null}
          {activeTab === "Correlações clínicas" ? (
            <ListTab items={academicClinicalNotes(model, structure)} empty={t("viewer.emptyStates.noClinicalCorrelations")} />
          ) : null}
          {activeTab === "Guia de estudo" ? (
            <ListTab items={studyGuide(model, t)} empty={t("viewer.emptyStates.noStudyGuide")} />
          ) : null}
          {activeTab === "Referência" ? (
            <div className="viewer-info-block">
              <span>{t("viewer.reference")}</span>
              <p>{academicReference(model, t)}</p>
              <small className="mt-3 block text-textMuted">{(model?.references || []).join(" · ")}</small>
            </div>
          ) : null}
          {activeTab === "Informação" ? <InformationTab structure={structure} t={t} /> : null}
          {activeTab === "Partes" ? <PartsTab structure={structure} activePart={activePart} onSelectPart={onSelectPart} t={t} /> : null}
          {activeTab === "Superfícies" ? (
            <ListTab items={structure?.surfaces || []} empty={t("viewer.emptyStates.noSurfaces")} onClick={item => onAction(`${t("viewer.surfaces")}: ${item}`)} />
          ) : null}
          {activeTab === "Marcadores" ? (
            <ListTab items={structure?.markers || []} empty={t("viewer.emptyStates.noMarkers")} onClick={item => onAction(`${t("viewer.markers")}: ${item}`)} />
          ) : null}
          {activeTab === "Secções transversais" ? (
            <ListTab items={structure?.sections || [t("viewer.planes.axial"), t("viewer.planes.coronal"), t("viewer.planes.sagittal")]} empty={t("viewer.emptyStates.noSections")} onClick={item => onAction(`${t("viewer.crossSections")}: ${item}`)} />
          ) : null}
          {activeTab === "Modelos" ? (
            <div className="viewer-info-block">
              <span>{t("viewer.models")}</span>
              <p>{model?.title}</p>
              <small className="mt-3 block text-textMuted">{t("viewer.viewerSwitchingPrepared")}</small>
            </div>
          ) : null}
          {Object.keys(tabFallbacks).includes(activeTab) ? (
            <ListTab
              items={structure?.[activeTab.toLowerCase()] || tabFallbacks[activeTab]}
              empty={`Nenhum item cadastrado em ${activeTab}.`}
              onClick={item => onAction(`${activeTab}: ${item}`)}
            />
          ) : null}
        </div>
      </aside>
    </>
  );
}
