import { useState } from "react";
import LineIcon from "../icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";

const defaultTabs = [
  "Informação",
  "Anotações",
  "Simulado Teórico",
  "Simulado Prático",
  "Correlações clínicas",
  "Objetivos",
  "Guia de estudo",
  "Referência"
];

const academicTabs = [
  "Informação",
  "Anotações",
  "Simulado Teórico",
  "Simulado Prático",
  "Correlações clínicas",
  "Objetivos",
  "Guia de estudo",
  "Referência"
];

const tabLabels = {
  "Informação": "viewer.information",
  "Objetivos": "viewer.objectives",
  "Correlações clínicas": "viewer.clinicalCorrelations",
  "Guia de estudo": "viewer.studyGuide",
  "Referência": "viewer.reference"
};

const tabFallbacks = {};

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

function ListTab({ items = [], empty, onClick, variant = "default", activeIndex = null }) {
  if (!items.length) return <p className="viewer-empty-state">{empty}</p>;
  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const label = typeof item === "string" ? item : item.name || item.plane || item.id;
        const detail = typeof item === "string"
          ? ""
          : item.latinName || item.latin_name || item.description || item.plane || "";
        return (
        <button
          key={`${label}-${index}`}
          className={`viewer-list-row text-left viewer-list-row--${variant} ${activeIndex === index ? "is-active" : ""}`}
          onClick={() => onClick?.(item, index)}
        >
          <span className="viewer-list-index">{String(index + 1).padStart(2, "0")}</span>
          <span className="viewer-list-copy">
            <strong>{label}</strong>
            {detail ? <small>{detail}</small> : null}
          </span>
          <LineIcon name="chevron" className="h-4 w-4 text-techTeal" />
        </button>
        );
      })}
    </div>
  );
}

function studyGuide(model, t) {
  if (model?.studyGuide?.length) return model.studyGuide;

  if ((model?.slug || model?.id) === "coracao-humano-superficial") {
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

function academicStructures(model, structure, anatomicalStructures) {
  if (anatomicalStructures?.length) return anatomicalStructures;
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
  anatomicalStructures,
  activeAnatomicalIndex,
  onSelectAnatomicalStructure,
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

        <div className="flex flex-col gap-1 px-4 py-2 border-b border-white/5 mb-4">
          {panelTabs.map(item => (
            <button 
              key={item} 
              className={`text-left px-3 py-2 text-sm rounded-lg transition-all ${activeTab === item ? "bg-techTeal/10 text-techTeal font-bold" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`} 
              onClick={() => setTab(item)}
            >
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
            <ListTab
              items={academicStructures(model, structure, anatomicalStructures)}
              empty={t("viewer.emptyStates.noAnatomicalStructures")}
              variant="anatomy"
              activeIndex={activeAnatomicalIndex}
              onClick={onSelectAnatomicalStructure}
            />
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
          {activeTab === "Anotações" ? (
            <div className="viewer-info-block text-center mt-6">
              <p className="mb-4 text-textMuted text-sm">Crie notas pessoais para estudo deste modelo anatômico.</p>
              <button className="rounded-md bg-techTeal px-4 py-2 text-sm font-semibold text-blackDeep hover:bg-techTeal/90 transition-colors" onClick={() => onAction("Anotações")}>
                Acessar Minhas Anotações
              </button>
            </div>
          ) : null}
          {activeTab === "Simulado Teórico" ? (
            <div className="viewer-info-block text-center mt-6">
              <p className="mb-4 text-textMuted text-sm">Teste seus conhecimentos com questões múltipla-escolha e verdadeiro ou falso.</p>
              <button className="rounded-md bg-techTeal px-4 py-2 text-sm font-semibold text-blackDeep hover:bg-techTeal/90 transition-colors" onClick={() => onAction("Simulado Teórico")}>
                Iniciar Simulado Teórico
              </button>
            </div>
          ) : null}
          {activeTab === "Simulado Prático" ? (
            <div className="viewer-info-block text-center mt-6">
              <p className="mb-4 text-textMuted text-sm">Identifique as estruturas no modelo 3D usando os marcadores oficiais.</p>
              <button className="rounded-md bg-techTeal px-4 py-2 text-sm font-semibold text-blackDeep hover:bg-techTeal/90 transition-colors" onClick={() => onAction("Simulado Anatômico")}>
                Iniciar Simulado Prático
              </button>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
