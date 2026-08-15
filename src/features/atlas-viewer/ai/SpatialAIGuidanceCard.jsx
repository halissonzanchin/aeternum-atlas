import React from "react";
import LineIcon from "../../../components/icons/LineIcon";
import { LOCAL_MODELS } from "../../../data/localModels";

const SPATIAL_MAPPINGS = [
  {
    slug: "corte-sagital-cranio-humano-superficial",
    modelTitle: "Corte Sagital do Crânio Humano — Modelo Superficial 3D",
    keywords: ["crânio", "cranio", "cabeça", "cabeca", "encéfalo", "encefalo", "cérebro", "cerebro", "neuroanatomia", "meninges", "corpo caloso"],
    markers: [
      { id: "m1", label: "Telencéfalo & Córtex", index: 0 },
      { id: "m2", label: "Corpo Caloso", index: 1 },
      { id: "m3", label: "Tronco Encefálico", index: 2 },
      { id: "m4", label: "Cerebelo", index: 3 }
    ]
  },
  {
    slug: "corte-sagital-sistema-reprodutor-feminino",
    modelTitle: "Corte Sagital do Sistema Reprodutor Feminino — Modelo 3D",
    keywords: ["reprodutor feminino", "útero", "utero", "vagina", "cérvix", "cervix", "ginecologia", "pelve feminina", "douglas", "ovário", "ovario"],
    markers: [
      { id: "f1", label: "Útero & Cavidade Uterina", index: 0 },
      { id: "f2", label: "Bexiga Urinária", index: 1 },
      { id: "f3", label: "Fundo de Saco de Douglas", index: 2 },
      { id: "f4", label: "Canal Vaginal & Cérvix", index: 3 }
    ]
  },
  {
    slug: "coracao-edicao-morgue",
    modelTitle: "Coração Humano — Edição Morgue 3D",
    keywords: ["coração", "coracao", "cardíaca", "cardiaca", "cardiovascular", "ventrículo", "ventriculo", "átrio", "atrio", "aorta", "miocárdio"],
    markers: [
      { id: "h1", label: "Ápice Cardíaco", index: 0 },
      { id: "h2", label: "Ventrículo Esquerdo", index: 1 },
      { id: "h3", label: "Tronco da Aorta", index: 2 },
      { id: "h4", label: "Sulco Coronário", index: 3 }
    ]
  }
];

export default function SpatialAIGuidanceCard({ text, currentPath = "" }) {
  if (!text || typeof text !== "string") return null;

  const lowerText = text.toLowerCase();

  // Encontra a melhor correspondência de modelo 3D baseado nas palavras-chave no texto
  const matchedMapping = SPATIAL_MAPPINGS.find((mapping) =>
    mapping.keywords.some((kw) => lowerText.includes(kw))
  );

  if (!matchedMapping) return null;

  const targetUrl = `/viewer/${matchedMapping.slug}`;
  const isAlreadyInTargetViewer = currentPath.includes(matchedMapping.slug);

  const handleOpenViewer = () => {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", targetUrl);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleFocusMarker = (marker) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("aeternum:select-marker", {
          detail: { markerLabel: marker.label, markerIndex: marker.index, modelSlug: matchedMapping.slug }
        })
      );
    }
  };

  return (
    <div className="my-2.5 p-3 bg-gradient-to-r from-teal-950/60 to-blackDeep/80 border border-teal-500/40 rounded-xl backdrop-blur-md text-clinicalWhite shadow-lg space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold text-xs text-teal-300">
          <span className="text-sm">🧊</span>
          <span>Controle Espacial Spatial AI</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-500/30">
          Modelo 3D Mapeado
        </span>
      </div>

      <p className="text-xs text-teal-100/90 font-medium">
        {matchedMapping.modelTitle}
      </p>

      {/* Botões de Ação Espacial */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {!isAlreadyInTargetViewer ? (
          <button
            type="button"
            onClick={handleOpenViewer}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-teal-500 to-teal-600 text-blackDeep hover:brightness-110 transition-all flex items-center gap-1.5 shadow-md"
          >
            <LineIcon name="play" className="w-3.5 h-3.5" />
            <span>Guiar para o Modelo 3D</span>
          </button>
        ) : (
          <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
            <span>👁️</span> Modelo 3D aberto nesta sessão
          </span>
        )}

        {/* Lista de Marcadores Anatômicos Interativos */}
        <div className="w-full pt-1">
          <span className="text-[10px] uppercase tracking-wider text-textMuted block mb-1.5 font-semibold">
            📍 Selecionar Marcador para Destacar (Spatial Focus):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {matchedMapping.markers.map((marker) => (
              <button
                key={marker.id}
                type="button"
                onClick={() => handleFocusMarker(marker)}
                className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-surfaceDark/80 border border-glassBorder/50 text-teal-200 hover:border-teal-400 hover:text-white transition-all hover:bg-teal-500/20"
              >
                📍 {marker.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
