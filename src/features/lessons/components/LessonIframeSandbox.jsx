import React, { useState, useEffect } from 'react';

export default function LessonIframeSandbox({ manifest }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!manifest) {
      setError("Manifesto não fornecido.");
      return;
    }

    // Validações obrigatórias
    if (!manifest.deckUrl.startsWith("/lesson-decks/")) {
      setError("Deck URL inválida: O caminho deve ser estritamente local (/lesson-decks/).");
      return;
    }
    
    if (manifest.deckUrl.includes("http://") || manifest.deckUrl.includes("https://")) {
      setError("Deck URL inválida: URLs externas são proibidas.");
      return;
    }
    
    if (manifest.deckUrl.startsWith("javascript:") || manifest.deckUrl.startsWith("data:") || manifest.deckUrl.startsWith("blob:")) {
      setError("Deck URL inválida: Esquemas dinâmicos são proibidos.");
      return;
    }

    if (manifest.sandboxPolicy !== "allow-scripts") {
      setError("Sandbox Policy inválida: Apenas 'allow-scripts' é permitido para esta fase.");
      return;
    }

    if (manifest.status !== "draft" || manifest.visibility !== "admin") {
      setError("Status inválido: Apenas aulas 'draft' e restritas para 'admin' podem ser executadas no sandbox.");
      return;
    }

    setError(null);
  }, [manifest]);

  // Listener para postMessage seguro
  useEffect(() => {
    if (error) return;

    const handleMessage = (event) => {
      // Como não usamos allow-same-origin, a origin será "null".
      // Não podemos confiar em event.origin.
      
      // Validar schema e content
      if (event.data && typeof event.data === 'object' && event.data.type) {
        if (event.data.type === 'lesson.ready') {
          console.log(`[Aeternum Player] Aula carregada: ${event.data.lessonId}`);
        } else {
          console.warn(`[Aeternum Player] Evento ignorado ou não suportado: ${event.data.type}`);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [error]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
        <div>
          <h3 className="text-red-400 font-bold mb-2">Erro de Segurança / Validação</h3>
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col atlas-liquid-glass-panel relative rounded-xl overflow-hidden border border-techTeal/20">
      
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-navyDeep z-10">
          <div className="w-10 h-10 border-t-2 border-r-2 border-techTeal rounded-full animate-spin mb-4"></div>
          <span className="text-techTeal text-sm font-semibold tracking-widest uppercase">Sandboxing Lesson...</span>
        </div>
      )}

      <div className="px-4 py-2 bg-blackDeep/50 border-b border-white/5 flex justify-between items-center text-xs">
        <span className="text-textMuted uppercase tracking-widest font-semibold">{manifest.title} <span className="text-techTeal ml-2">v{manifest.version}</span></span>
        <span className="text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">ISOLATED IFRAME</span>
      </div>
      
      <iframe 
        title={manifest.title}
        src={manifest.deckUrl}
        sandbox={manifest.sandboxPolicy}
        className="w-full h-full flex-1 border-none bg-black"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
