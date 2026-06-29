import { useState, useEffect } from "react";
import LineIcon from "../../../components/icons/LineIcon";
import { useLanguage } from "../../../context/LanguageContext";
import { sketchfabBridge } from "../../../services/sketchfabAnnotationBridge";
const defaultTabs = [
  "Informação",
  "Anotações",
  "Simulado Teórico",
  "Simulado Prático",
  "Guia de Estudo",
  "Correlações Clínicas"
];

const tabLabels = {
  "Informação": "viewer.information",
  "Guia de Estudo": "viewer.studyGuide",
  "Correlações Clínicas": "viewer.clinicalCorrelations",
  "Anotações": "viewer.annotations",
  "Simulado Teórico": "viewer.theoreticalQuiz",
  "Simulado Prático": "viewer.practicalQuiz"
};

function valueOf(structure, key, fallback) {
  return structure?.[key] || structure?.[key.replace(/[A-Z]/g, match => `_${match.toLowerCase()}`)] || fallback;
}

function InfoBlock({ label, children }) {
  return (
    <div className="atlas-liquid-glass-card p-4 mb-4 rounded-xl">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-techTeal mb-1.5 opacity-80">{label}</span>
      <p className="text-sm text-clinicalWhite/90 leading-relaxed">{children}</p>
    </div>
  );
}

function InformationTab({ structure, t }) {
  const features = structure?.keyFeatures || structure?.features || [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <InfoBlock label={t("viewer.infoLabels.location")}>{valueOf(structure, "location", t("viewer.notDefined"))}</InfoBlock>
      <InfoBlock label={t("viewer.infoLabels.type")}>{valueOf(structure, "type", t("viewer.notDefined"))}</InfoBlock>
      <InfoBlock label={t("viewer.infoLabels.function")}>{valueOf(structure, "function", t("viewer.notDefined"))}</InfoBlock>
      <InfoBlock label={t("viewer.infoLabels.clinicalNotes")}>{valueOf(structure, "clinicalNotes", t("viewer.notDefined"))}</InfoBlock>
      
      {features.length ? (
        <div className="atlas-liquid-glass-card p-4 rounded-xl">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-techTeal mb-2 opacity-80">{t("viewer.infoLabels.keyFeatures")}</span>
          <ul className="space-y-2">
            {features.map((item, idx) => (
              <li key={idx} className="text-sm text-clinicalWhite/90 flex items-start gap-2">
                <span className="text-techTeal mt-1 flex-shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ListTab({ items = [], empty, onClick, variant = "default", activeIndex = null }) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center atlas-liquid-glass-card rounded-xl animate-in fade-in">
        <LineIcon name="spark" className="w-8 h-8 text-white/20 mb-3" />
        <p className="text-sm text-white/50">{empty}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {items.map((item, index) => {
        const label = typeof item === "string" ? item : item.name || item.plane || item.id;
        const detail = typeof item === "string"
          ? ""
          : item.latinName || item.latin_name || item.description || item.plane || "";
        return (
          <button
            key={`${label}-${index}`}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-center gap-3 ${
              activeIndex === index 
                ? "bg-techTeal/10 border-techTeal/30 shadow-[0_0_15px_rgba(35,210,179,0.15)] text-white" 
                : "atlas-liquid-glass-card border-white/5 hover:border-white/20 hover:bg-white/5 text-clinicalWhite/80"
            }`}
            onClick={() => onClick?.(item, index)}
          >
            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${activeIndex === index ? 'bg-techTeal text-blackDeep' : 'bg-white/10 text-white/50'}`}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="flex-1 flex flex-col min-w-0">
              <strong className="text-sm font-medium truncate">{label}</strong>
              {detail ? <small className="text-[10px] text-white/50 truncate uppercase tracking-wide">{detail}</small> : null}
            </span>
            <LineIcon name="chevron" className={`w-4 h-4 flex-shrink-0 ${activeIndex === index ? 'text-techTeal' : 'text-white/20'}`} />
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
    t("models.defaultStudyGuide.observe", "Observe o modelo em múltiplos ângulos"),
    t("models.defaultStudyGuide.identify", "Identifique as estruturas principais"),
    t("models.defaultStudyGuide.correlate", "Correlacione com notas clínicas"),
    t("models.defaultStudyGuide.complete", "Faça o simulado para fixar o aprendizado")
  ];
}

function academicClinicalNotes(model, structure) {
  if (model?.clinicalCorrelations?.length) return model.clinicalCorrelations;
  if (model?.clinicalNotes) return [model.clinicalNotes];
  if (structure?.clinicalNotes) return [structure.clinicalNotes];
  return [];
}

export default function EducationalPanel({
  open,
  structure,
  model,
  onAction,
  onClose,
  isSketchfabMode = false
}) {
  const { t } = useLanguage();
  const [tab, setTab] = useState("Informação");
  const latin = structure?.latinName || structure?.latin_name || "Nomen anatomicum";
  const activeTab = defaultTabs.includes(tab) ? tab : defaultTabs[0];

  const [sketchfabAnnotations, setSketchfabAnnotations] = useState([]);
  const [activeSketchfabAnnotationIndex, setActiveSketchfabAnnotationIndex] = useState(-1);
  const [sketchfabReady, setSketchfabReady] = useState(false);

  useEffect(() => {
    if (!isSketchfabMode) return;
    
    setSketchfabAnnotations(sketchfabBridge.getSketchfabAnnotations());
    setSketchfabReady(sketchfabBridge.isSketchfabReady());

    const unsubReady = sketchfabBridge.subscribeToSketchfabReady(() => setSketchfabReady(true));
    const unsubAnnotations = sketchfabBridge.subscribe((annotations) => setSketchfabAnnotations(annotations));
    const unsubSelect = sketchfabBridge.subscribeToAnnotationSelect((idx) => setActiveSketchfabAnnotationIndex(idx));

    return () => {
      unsubReady();
      unsubAnnotations();
      unsubSelect();
    };
  }, [isSketchfabMode]);

  const handleSketchfabAnnotationClick = (index) => {
    setActiveSketchfabAnnotationIndex(index);
    sketchfabBridge.goToSketchfabAnnotation(index);
  };

  return (
    <>
      {open ? <button className="fixed inset-0 z-[40] bg-blackDeep/40 backdrop-blur-sm lg:hidden animate-in fade-in" onClick={onClose} aria-label={t("settings.closeSettings")} /> : null}
      
      <aside 
        className={`fixed top-0 left-0 h-[100dvh] w-full max-w-sm sm:max-w-md z-[50] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col pt-16 sm:pt-20 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 flex flex-col mx-4 mb-24 sm:mb-6 mt-2 overflow-hidden rounded-2xl atlas-liquid-glass-panel border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
          
          {/* Header Premium */}
          <div className="relative p-5 sm:p-6 border-b border-white/10 shrink-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-techTeal/10 to-transparent opacity-50 pointer-events-none" />
            <div className="relative z-10 flex justify-between items-start gap-4">
              <div>
                <p className="text-[10px] font-bold text-techTeal uppercase tracking-widest mb-1.5 opacity-90">
                  {model?.category || model?.system || t("viewer.structure")}
                </p>
                <h1 className="text-xl sm:text-2xl font-bold text-clinicalWhite leading-tight mb-1">
                  {structure?.name || model?.title}
                </h1>
                <p className="text-sm italic text-white/50">{latin}</p>
              </div>
              <button 
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shrink-0" 
                onClick={onClose} 
                aria-label={t("viewer.togglePanel")}
              >
                <LineIcon name="close" className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Segmented Tabs Premium */}
          <div className="px-5 py-4 border-b border-white/5 shrink-0 bg-black/20 relative">
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-20" />
            <div className="flex flex-row gap-2 overflow-x-auto pb-1 relative z-10 w-full scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] after:content-[''] after:min-w-[3rem] after:shrink-0">
              {defaultTabs.map(item => (
                <button 
                  key={item} 
                  className={`whitespace-nowrap px-4 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-full transition-all duration-300 flex-shrink-0 ${
                    activeTab === item 
                      ? "bg-techTeal text-blackDeep shadow-[0_0_15px_rgba(35,210,179,0.3)] scale-105 transform origin-center" 
                      : "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20"
                  }`} 
                  onClick={(e) => {
                    setTab(item);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  }}
                  aria-selected={activeTab === item}
                  role="tab"
                >
                  {t(tabLabels[item] || item, item)}
                </button>
              ))}
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none h-32" />
            
            <div className="relative z-10">
              {activeTab === "Informação" ? <InformationTab structure={structure} t={t} /> : null}
              
              {activeTab === "Anotações" ? (
                isSketchfabMode ? (
                  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {!sketchfabReady ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center atlas-liquid-glass-card rounded-xl">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-techTeal rounded-full animate-spin mb-3" />
                        <p className="text-sm text-white/50">Carregando marcações do modelo...</p>
                      </div>
                    ) : sketchfabAnnotations.length > 0 ? (
                      sketchfabAnnotations.map((annotation, index) => (
                        <button
                          key={`anot-${annotation.id}`}
                          className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-start gap-3 ${
                            activeSketchfabAnnotationIndex === index 
                              ? "bg-techTeal/10 border-techTeal/30 shadow-[0_0_15px_rgba(35,210,179,0.15)] text-white" 
                              : "atlas-liquid-glass-card border-white/5 hover:border-white/20 hover:bg-white/5 text-clinicalWhite/80"
                          }`}
                          onClick={() => handleSketchfabAnnotationClick(index)}
                        >
                          <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${activeSketchfabAnnotationIndex === index ? 'bg-techTeal text-blackDeep' : 'bg-white/10 text-white/50'}`}>
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="flex-1 flex flex-col min-w-0">
                            <strong className="text-sm font-medium">{annotation.name}</strong>
                            {annotation.description ? (
                              <small className="text-xs text-white/50 mt-1 line-clamp-2">{annotation.description}</small>
                            ) : null}
                            <span className={`text-[10px] uppercase tracking-widest font-bold mt-2 ${activeSketchfabAnnotationIndex === index ? 'text-techTeal' : 'text-white/30'}`}>
                              {activeSketchfabAnnotationIndex === index ? 'Focando no modelo' : 'Focar no modelo'}
                            </span>
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center atlas-liquid-glass-card rounded-xl">
                        <LineIcon name="alert-triangle" className="w-8 h-8 text-alertRed/50 mb-3" />
                        <p className="text-sm text-white/50">Não foi possível carregar as marcações do Sketchfab.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center mt-4 p-6 atlas-liquid-glass-card rounded-xl border border-techTeal/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="w-12 h-12 rounded-full bg-techTeal/10 border border-techTeal/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(35,210,179,0.15)]">
                      <LineIcon name="pencil" className="w-5 h-5 text-techTeal" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Anotações Pessoais</h3>
                    <p className="mb-6 text-white/60 text-sm leading-relaxed">
                      Crie e organize suas notas para estudo deste modelo anatômico no ambiente nativo.
                    </p>
                    <button 
                      className="atlas-liquid-glass-button bg-techTeal/10 border border-techTeal/40 text-techTeal hover:bg-techTeal hover:text-blackDeep transition-all px-6 py-2.5 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(35,210,179,0.2)]" 
                      onClick={() => onAction("Anotações")}
                    >
                      Acessar Minhas Anotações
                    </button>
                  </div>
                )
              ) : null}
              
              {activeTab === "Simulado Teórico" ? (
                <div className="flex flex-col items-center justify-center text-center mt-4 p-6 atlas-liquid-glass-card rounded-xl border border-selectionGreen/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="w-12 h-12 rounded-full bg-selectionGreen/10 border border-selectionGreen/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(46,213,115,0.15)]">
                    <LineIcon name="spark" className="w-5 h-5 text-selectionGreen" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Simulado Teórico</h3>
                  <p className="mb-6 text-white/60 text-sm leading-relaxed">
                    Teste seus conhecimentos sobre o modelo com questões de múltipla escolha e verdadeiro ou falso.
                  </p>
                  <button 
                    className="atlas-liquid-glass-button bg-selectionGreen/10 border border-selectionGreen/40 text-selectionGreen hover:bg-selectionGreen hover:text-blackDeep transition-all px-6 py-2.5 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(46,213,115,0.2)]" 
                    onClick={() => onAction("Simulado Teórico")}
                  >
                    Iniciar Simulado Teórico
                  </button>
                </div>
              ) : null}
              
              {activeTab === "Simulado Prático" ? (
                <div className="flex flex-col items-center justify-center text-center mt-4 p-6 atlas-liquid-glass-card rounded-xl border border-techTeal/20 animate-in fade-in slide-in-from-bottom-2 duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
                  <div className="w-12 h-12 rounded-full bg-techTeal/10 border border-techTeal/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(35,210,179,0.15)]">
                    <LineIcon name="target" className="w-5 h-5 text-techTeal" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Simulado Prático</h3>
                  <p className="mb-6 text-white/60 text-sm leading-relaxed max-w-[250px]">
                    Identifique as estruturas anatômicas diretamente no modelo 3D.
                  </p>
                  <button 
                    className="atlas-liquid-glass-button bg-techTeal/10 border border-techTeal/40 text-techTeal hover:bg-techTeal hover:text-blackDeep transition-all px-6 py-2.5 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(35,210,179,0.2)]" 
                    onClick={() => onAction("Simulado Prático")}
                  >
                    Iniciar Simulado Prático
                  </button>
                </div>
              ) : null}

              {activeTab === "Guia de Estudo" ? (
                isSketchfabMode ? (
                  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {!sketchfabReady ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center atlas-liquid-glass-card rounded-xl">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-techTeal rounded-full animate-spin mb-3" />
                        <p className="text-sm text-white/50">Carregando marcações do modelo...</p>
                      </div>
                    ) : sketchfabAnnotations.length > 0 ? (
                      sketchfabAnnotations.map((annotation, index) => (
                        <button
                          key={annotation.id}
                          className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-start gap-3 ${
                            activeSketchfabAnnotationIndex === index 
                              ? "bg-techTeal/10 border-techTeal/30 shadow-[0_0_15px_rgba(35,210,179,0.15)] text-white" 
                              : "atlas-liquid-glass-card border-white/5 hover:border-white/20 hover:bg-white/5 text-clinicalWhite/80"
                          }`}
                          onClick={() => handleSketchfabAnnotationClick(index)}
                        >
                          <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${activeSketchfabAnnotationIndex === index ? 'bg-techTeal text-blackDeep' : 'bg-white/10 text-white/50'}`}>
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="flex-1 flex flex-col min-w-0">
                            <strong className="text-sm font-medium">{annotation.name}</strong>
                            {annotation.description ? (
                              <small className="text-xs text-white/50 mt-1 line-clamp-2">{annotation.description}</small>
                            ) : null}
                            <span className={`text-[10px] uppercase tracking-widest font-bold mt-2 ${activeSketchfabAnnotationIndex === index ? 'text-techTeal' : 'text-white/30'}`}>
                              {activeSketchfabAnnotationIndex === index ? 'Focando no modelo' : 'Focar no modelo'}
                            </span>
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center atlas-liquid-glass-card rounded-xl">
                        <LineIcon name="alert-triangle" className="w-8 h-8 text-alertRed/50 mb-3" />
                        <p className="text-sm text-white/50">Não foi possível carregar as marcações do Sketchfab. Tente novamente ou use o Atlas Native Engine.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <ListTab items={studyGuide(model, t)} empty={t("viewer.emptyStates.noStudyGuide", "Sem guia disponível.")} />
                )
              ) : null}

              {activeTab === "Correlações Clínicas" ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {academicClinicalNotes(model, structure).length > 0 ? (
                    <ListTab items={academicClinicalNotes(model, structure)} />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center mt-4 p-6 atlas-liquid-glass-card rounded-xl border border-alertRed/20">
                      <div className="w-12 h-12 rounded-full bg-alertRed/10 border border-alertRed/30 flex items-center justify-center mb-4">
                        <LineIcon name="activity" className="w-5 h-5 text-alertRed" />
                      </div>
                      <h3 className="text-lg font-bold text-white/80 mb-2">Correlações Clínicas</h3>
                      <p className="text-white/50 text-sm leading-relaxed">
                        Conteúdo em revisão anatômica/clínica.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
          
        </div>
      </aside>
    </>
  );
}
