import React, { useState } from "react";
import Card from "../../../components/Card/Card";
import LineIcon from "../../../components/icons/LineIcon";
import { atlasAITutorMock } from "../../../demo/upe/aiMock";

export default function AtlasAITutor() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* AI Floating Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-h-[80vh] bg-blackDeep/95 border border-techTeal/30 rounded-2xl shadow-2xl backdrop-blur-xl z-50 flex flex-col overflow-hidden fade-in-up">
          {/* Header */}
          <div className="bg-slate-900/80 p-4 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-techTeal/20 flex items-center justify-center border border-techTeal/40">
                <LineIcon name="cpu" className="w-4 h-4 text-techTeal" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-clinicalWhite">Atlas AI Tutor</h3>
                <p className="text-[10px] text-techTeal tracking-wider uppercase">Conectado • {atlasAITutorMock.student}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-textMuted hover:text-clinicalWhite transition">
              <LineIcon name="x" className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Body */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            
            {/* User Message */}
            <div className="flex flex-col items-end">
              <div className="bg-slate-800 text-clinicalWhite text-sm p-3 rounded-2xl rounded-tr-sm max-w-[85%] border border-slate-700">
                Contexto: <strong>{atlasAITutorMock.structure}</strong>
                <br />
                {atlasAITutorMock.question}
              </div>
            </div>

            {/* AI Response */}
            <div className="flex flex-col items-start">
              <div className="bg-techTeal/5 text-clinicalWhite text-sm p-4 rounded-2xl rounded-tl-sm max-w-[95%] border border-techTeal/20 shadow-inner">
                <p className="mb-3 leading-relaxed">{atlasAITutorMock.answer.description}</p>
                
                <div className="mb-3 bg-alertWarning/10 p-3 rounded-lg border border-alertWarning/20">
                  <h4 className="text-alertWarning text-xs font-bold flex items-center mb-1">
                    <LineIcon name="alert-triangle" className="w-3 h-3 mr-1" /> Importância Clínica
                  </h4>
                  <p className="text-xs text-slate-300">{atlasAITutorMock.answer.clinicalImportance}</p>
                </div>

                <div className="mb-3">
                  <h4 className="text-techTeal text-xs font-bold mb-2">Estruturas Relacionadas</h4>
                  <div className="flex flex-wrap gap-2">
                    {atlasAITutorMock.answer.relatedStructures.map((struct, i) => (
                      <span key={i} className="text-[10px] bg-slate-800 px-2 py-1 rounded border border-slate-700">{struct}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-techTeal text-xs font-bold mb-2">Plano de Revisão Automático</h4>
                  <div className="space-y-1">
                    {atlasAITutorMock.answer.suggestedReview.map((step, i) => (
                      <p key={i} className="text-xs text-slate-300">• {step}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <p className="text-[10px] text-textMuted uppercase mb-2 font-medium tracking-wider">Ações Rápidas (RAG)</p>
            <div className="flex flex-wrap gap-2">
              <button className="text-xs bg-slate-800 hover:bg-slate-700 text-clinicalWhite px-3 py-1.5 rounded-full border border-slate-700 transition">Estruturas relacionadas</button>
              <button className="text-xs bg-slate-800 hover:bg-slate-700 text-clinicalWhite px-3 py-1.5 rounded-full border border-slate-700 transition">Importância clínica</button>
              <button className="text-xs bg-slate-800 hover:bg-slate-700 text-clinicalWhite px-3 py-1.5 rounded-full border border-slate-700 transition flex items-center"><LineIcon name="file-text" className="w-3 h-3 mr-1" /> Gerar mini simulado</button>
              <button className="text-xs bg-techTeal/10 hover:bg-techTeal/20 text-techTeal px-3 py-1.5 rounded-full border border-techTeal/30 transition flex items-center"><LineIcon name="cpu" className="w-3 h-3 mr-1" /> Criar plano de revisão</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button Trigger */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-blackDeep border border-techTeal p-3 rounded-full shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:bg-slate-900 transition group hover:scale-105">
          <div className="w-10 h-10 rounded-full bg-techTeal/20 flex items-center justify-center relative">
            <LineIcon name="cpu" className="w-5 h-5 text-techTeal relative z-10" />
            <div className="absolute inset-0 rounded-full border border-techTeal/50 animate-ping opacity-20"></div>
          </div>
          <span className="font-bold text-techTeal pr-4 text-sm group-hover:text-clinicalWhite transition">Atlas AI</span>
        </button>
      )}
    </>
  );
}
