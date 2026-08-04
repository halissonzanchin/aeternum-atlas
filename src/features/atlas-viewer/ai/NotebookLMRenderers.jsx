import React, { useState } from "react";
import LineIcon from "../../../components/icons/LineIcon";

/**
 * Renderizador de Mapa Mental (Mermaid Parser / Visualizer)
 */
export function MermaidMindMap({ code }) {
  const lines = String(code || "")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("graph") && !line.startsWith("subgraph") && !line.startsWith("end"));

  const nodesMap = new Map();
  const connections = [];

  lines.forEach(line => {
    const parts = line.split(/-->|---|==>/);
    if (parts.length >= 2) {
      const fromRaw = parts[0].trim();
      const toRaw = parts[1].trim();

      const parseNode = (raw) => {
        const match = raw.match(/^([A-Za-z0-9_]+)(?:\["?([^"]+)"?\])?$/);
        if (match) {
          const id = match[1];
          const label = match[2] || match[1];
          return { id, label };
        }
        return { id: raw, label: raw };
      };

      const from = parseNode(fromRaw);
      const to = parseNode(toRaw);

      nodesMap.set(from.id, from.label);
      nodesMap.set(to.id, to.label);
      connections.push({ from: from.id, to: to.id });
    }
  });

  const nodeList = Array.from(nodesMap.entries());

  if (!nodeList.length) {
    return (
      <div className="aog-mermaid-fallback p-3 bg-blackDeep/40 border border-glassBorder/30 rounded-lg text-xs text-textMuted font-mono">
        <pre>{code}</pre>
      </div>
    );
  }

  return (
    <div className="atlas-ai-mindmap-container my-3 p-4 bg-blackDeep/60 border border-agedGold/30 rounded-xl backdrop-blur-md">
      <div className="flex items-center gap-2 mb-3 text-agedGold text-xs uppercase tracking-widest font-semibold border-b border-agedGold/20 pb-2">
        <LineIcon name="share" className="w-4 h-4" />
        <span>Mapa Mental Anatômico</span>
      </div>
      
      <div className="atlas-ai-mindmap-grid flex flex-wrap gap-2 justify-center">
        {nodeList.map(([id, label], index) => {
          const isMain = index === 0;
          return (
            <div
              key={id}
              className={`px-3 py-2 rounded-lg text-xs transition-all duration-300 shadow-lg ${
                isMain
                  ? "bg-agedGold/20 border border-agedGold text-clinicalWhite font-bold text-sm scale-105"
                  : "bg-surfaceDark/80 border border-glassBorder/40 text-clinicalWhite hover:border-agedGold/50"
              }`}
            >
              {isMain ? "🎯 " : "📌 "}
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Renderizador de Cartões Didáticos (Flashcards Interativos)
 */
export function InteractiveFlashcardDeck({ cards = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!cards || !cards.length) return null;

  const currentCard = cards[currentIndex] || cards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  return (
    <div className="atlas-ai-flashcard-wrapper my-4">
      <div className="flex items-center justify-between text-xs text-agedGold font-semibold mb-2">
        <span>🎴 Cartão Didático ({currentIndex + 1} de {cards.length})</span>
        <span>Clique no cartão para virar</span>
      </div>

      <div
        className={`atlas-ai-flashcard relative min-h-[160px] p-5 bg-gradient-to-br from-surfaceDark/90 to-blackDeep/90 border ${
          isFlipped ? "border-amber-400/60 bg-amber-500/10" : "border-glassBorder/60"
        } rounded-xl shadow-2xl backdrop-blur-md cursor-pointer transition-all duration-500 flex flex-col items-center justify-center text-center`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <span className="text-[10px] uppercase tracking-widest text-textMuted mb-2">
          {isFlipped ? "VERSO (RESPOSTA)" : "FRENTE (PERGUNTA)"}
        </span>
        <p className={`text-sm ${isFlipped ? "text-amber-200 font-medium" : "text-clinicalWhite font-semibold"}`}>
          {isFlipped ? currentCard.back || currentCard.verso : currentCard.front || currentCard.frente}
        </p>
        <span className="mt-3 text-[10px] text-agedGold/70">
          🔄 Toque para alternar
        </span>
      </div>

      {cards.length > 1 && (
        <div className="flex items-center justify-between mt-2 px-1">
          <button
            type="button"
            onClick={handlePrev}
            className="px-3 py-1 bg-surfaceDark border border-glassBorder/40 rounded-lg text-xs text-clinicalWhite hover:border-agedGold/50 transition-all"
          >
            ← Anterior
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="px-3 py-1 bg-agedGold/20 border border-agedGold/50 rounded-lg text-xs text-clinicalWhite hover:bg-agedGold/40 transition-all"
          >
            Próximo →
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Parser para extrair blocos Mermaid ou Flashcards do texto e renderizar componentes ricos
 */
export function RichContentParser({ text }) {
  const contentStr = String(text || "");

  // Detectar blocos Mermaid
  if (contentStr.includes("```mermaid")) {
    const parts = contentStr.split(/```mermaid([\s\S]*?)```/);
    return (
      <>
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            return <MermaidMindMap key={index} code={part} />;
          }
          return <p key={index} className="whitespace-pre-wrap">{part}</p>;
        })}
      </>
    );
  }

  // Detectar Flashcards (padrão "Frente:" e "Verso:")
  if (contentStr.includes("Frente:") && contentStr.includes("Verso:")) {
    const flashcardMatches = [];
    const regex = /(?:Frente|Pergunta):\s*([\s\S]*?)(?:Verso|Resposta):\s*([\s\S]*?)(?=(?:Frente|Pergunta):|$)/gi;
    let match;

    while ((match = regex.exec(contentStr)) !== null) {
      if (match[1] && match[2]) {
        flashcardMatches.push({
          front: match[1].trim(),
          back: match[2].trim()
        });
      }
    }

    if (flashcardMatches.length > 0) {
      const cleanIntro = contentStr.split(/(?:Frente|Pergunta):/)[0].trim();
      return (
        <>
          {cleanIntro ? <p className="mb-2 whitespace-pre-wrap">{cleanIntro}</p> : null}
          <InteractiveFlashcardDeck cards={flashcardMatches} />
        </>
      );
    }
  }

  return null;
}
