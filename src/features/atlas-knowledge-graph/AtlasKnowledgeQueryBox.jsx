import React, { useState } from 'react';
import { anatomyGraphService } from './anatomyGraphService';
import { atlasViewerCommands } from '../atlas-viewer/ai/atlasViewerCommands';

export default function AtlasKnowledgeQueryBox() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);

  const handleQuery = (textToQuery) => {
    const q = textToQuery || query;
    if (!q.trim()) return;

    const result = anatomyGraphService.answerStructuredQuery(q);
    setResponse(result);
  };

  const handleApplyCommand = () => {
    if (response?.suggestedViewerCommand?.markerId) {
      atlasViewerCommands.focusMarker(response.suggestedViewerCommand.markerId);
    }
  };

  const suggestedQueries = [
    "Qual a irrigação do útero?",
    "Quais patologias se relacionam com o endométrio?",
    "O que devo saber para prova sobre ovário?",
    "Mostre estruturas relacionadas ao colo uterino."
  ];

  return (
    <div className="bg-blackDeep/90 backdrop-blur-md border-b border-techTeal/30 p-4 shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded bg-techTeal/20 flex items-center justify-center border border-techTeal/40 shrink-0">
          <svg className="w-3 h-3 text-techTeal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-clinicalWhite">Atlas AI Inference</h3>
      </div>

      <div className="relative">
        <input 
          type="text" 
          placeholder="Pergunte ao Knowledge Graph..." 
          className="w-full bg-blackDeep border border-white/10 rounded-md py-2 px-3 text-xs text-clinicalWhite focus:outline-none focus:border-techTeal transition-colors pr-8"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
        />
        <button 
          onClick={() => handleQuery()}
          className="absolute right-2 top-2 text-techTeal hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap gap-1 mt-2">
        {suggestedQueries.map((sq, i) => (
          <button 
            key={i}
            onClick={() => { setQuery(sq); handleQuery(sq); }}
            className="text-[9px] bg-white/5 hover:bg-techTeal/20 text-textMuted hover:text-clinicalWhite px-2 py-1 rounded transition-colors border border-white/5"
          >
            {sq}
          </button>
        ))}
      </div>

      {response && (
        <div className="mt-4 p-3 bg-techTeal/5 border border-techTeal/20 rounded-md animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-techTeal font-bold">Resposta Inferida</span>
            <span className="text-[9px] bg-blackDeep/50 px-1.5 py-0.5 rounded text-white/50 border border-white/10">Intent: {response.intent}</span>
          </div>
          <p className="text-xs text-clinicalWhite leading-relaxed">{response.answer}</p>
          
          {response.suggestedViewerCommand && response.suggestedViewerCommand.markerId && (
            <button 
              onClick={handleApplyCommand}
              className="mt-3 w-full bg-techTeal/20 hover:bg-techTeal border border-techTeal/50 text-techTeal hover:text-blackDeep font-bold text-xs py-1.5 rounded transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Focar no Modelo 3D
            </button>
          )}
        </div>
      )}
    </div>
  );
}
