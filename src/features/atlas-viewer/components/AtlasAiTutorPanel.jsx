import React, { useState } from 'react';
import LineIcon from '../../../components/icons/LineIcon';
import AtlasAiChatPanel from './AtlasAiChatPanel';
import AtlasQuizPanel from './AtlasQuizPanel';
import { useAtlasViewer } from '../context/AtlasViewerContext';

export default function AtlasAiTutorPanel({ tutorContext }) {
  const { aiTutorMode, setAiTutorMode, handleSendAiMessage, aiIsTyping, selectedAnnotation, selectedLayer } = useAtlasViewer();
  const [inputText, setInputText] = useState('');
  
  // Modos de aba: 'overview', 'chat', 'quiz'
  // AiTutorMode do contexto agora servirá como fallback ou será melhor substituído pelo estado local aqui se não estiver no context,
  // mas para não quebrar a arquitetura da fase anterior, trataremos:
  const [activeTab, setActiveTab] = useState(aiTutorMode ? 'chat' : 'overview');

  if (!tutorContext) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || aiIsTyping) return;
    
    handleSendAiMessage(inputText);
    setInputText('');
  };

  const handleSuggestedClick = (question) => {
    if (aiIsTyping) return;
    handleSendAiMessage(question);
  };

  // Pega o ID da estrutura sendo focada no momento para repassar ao painel de Quiz
  const targetStructureId = selectedAnnotation ? selectedAnnotation.anatomicalStructure : (selectedLayer ? selectedLayer.meshName : null);

  return (
    <div className="flex-1 overflow-y-auto bg-black/40 border-l border-white/5 animate-fade-in custom-scrollbar flex flex-col">
      
      {/* Header Premium de IA */}
      <div className="p-6 border-b border-white/5 bg-gradient-to-r from-[#0B1528] to-black relative overflow-hidden shrink-0">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>
        <div className="flex items-center gap-3 mb-2 relative z-10">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <LineIcon name="cpu" className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold block mb-0.5">
              Aeternum AI Tutor
            </span>
            <h2 className="text-lg font-black text-white leading-tight">
              {tutorContext.structureName || tutorContext.structureId}
            </h2>
          </div>
        </div>
      </div>

      {/* Navegação Interna do Tutor */}
      <div className="flex px-2 border-b border-white/5 shrink-0">
        <button 
          onClick={() => { setActiveTab('overview'); setAiTutorMode(false); }}
          className={`flex-1 py-3 px-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'overview' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-textMuted hover:text-white'
          }`}
        >
          Visão Geral
        </button>
        <button 
          onClick={() => { setActiveTab('chat'); setAiTutorMode(true); }}
          className={`flex-1 py-3 px-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'chat' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-textMuted hover:text-white'
          }`}
        >
          Tutor Chat
        </button>
        <button 
          onClick={() => { setActiveTab('quiz'); setAiTutorMode(false); }}
          className={`flex-1 py-3 px-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center justify-center gap-1 ${
            activeTab === 'quiz' ? 'border-teal-400 text-teal-400' : 'border-transparent text-textMuted hover:text-white'
          }`}
        >
          <LineIcon name="check-circle" className="w-3 h-3" />
          Quiz Prático
        </button>
      </div>

      {/* Conteúdo Dinâmico */}
      <div className="overflow-y-auto custom-scrollbar flex-1 flex flex-col">
        
        {activeTab === 'overview' && (
          <div className="p-6 animate-fade-in-up space-y-6">
            
            {/* O Que É? */}
            <div>
              <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                <LineIcon name="info" className="w-4 h-4 text-indigo-400" /> O que é esta estrutura?
              </h3>
              <p className="text-sm text-clinicalWhite leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">
                {tutorContext.whatIsIt}
              </p>
            </div>

            {/* Objetivos de Aprendizagem */}
            {tutorContext.learningObjectives && (
              <div>
                <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                  <LineIcon name="target" className="w-4 h-4 text-green-400" /> Foco de Aprendizagem
                </h3>
                <div className="space-y-2">
                  {tutorContext.learningObjectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-xl">
                      <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      </div>
                      <span className="text-sm text-clinicalWhite">{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Correlações Clínicas */}
            {tutorContext.clinicalCorrelations && (
              <div>
                <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                  <LineIcon name="activity" className="w-4 h-4 text-amber-400" /> Relevância Médica
                </h3>
                <div className="grid gap-2">
                  {tutorContext.clinicalCorrelations.map((corr, i) => (
                    <div key={i} className="bg-gradient-to-r from-amber-500/10 to-transparent p-3 rounded-xl border-l-2 border-amber-500 text-sm text-amber-100">
                      {corr}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Erros Frequentes */}
            {tutorContext.commonMistakes && (
              <div>
                <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                  <LineIcon name="alert-triangle" className="w-4 h-4 text-red-400" /> Erros Críticos em Provas
                </h3>
                <ul className="space-y-2">
                  {tutorContext.commonMistakes.map((mistake, i) => (
                    <li key={i} className="text-sm text-clinicalWhite flex items-start gap-2 bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                      <span className="text-red-500 font-bold mt-0.5">✕</span> {mistake}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        )}

        {activeTab === 'chat' && (
          <AtlasAiChatPanel />
        )}

        {activeTab === 'quiz' && (
          <AtlasQuizPanel targetId={targetStructureId} />
        )}

      </div>

      {/* Footer com Prompt Suggestions (Simulando IA Conversacional Futura) */}
      {(activeTab === 'overview' || activeTab === 'chat') && (
        <div className="p-4 border-t border-white/5 bg-black/60 shrink-0">
          {activeTab === 'overview' && tutorContext.recommendedQuestions && (
            <div className="mb-4">
               <span className="text-[10px] text-textMuted uppercase font-bold tracking-widest block mb-2 px-1">
                Perguntas Sugeridas à IA
              </span>
              <div className="space-y-2">
                {tutorContext.recommendedQuestions.map((q, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      handleSuggestedClick(q);
                      setActiveTab('chat');
                      setAiTutorMode(true);
                    }}
                    disabled={aiIsTyping}
                    className="w-full text-left px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl text-xs text-indigo-200 transition-all disabled:opacity-50"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={aiIsTyping}
              placeholder="Pergunte ao Tutor sobre essa estrutura..." 
              className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-textMuted focus:outline-none transition-colors disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={aiIsTyping || !inputText.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors"
            >
              <LineIcon name="send" className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
