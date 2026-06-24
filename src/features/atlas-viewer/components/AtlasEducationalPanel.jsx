import React, { useState } from 'react';
import LineIcon from '../../../components/icons/LineIcon';

export default function AtlasEducationalPanel({ educationalContext, annotation, layer }) {
  const [activeTab, setActiveTab] = useState('Anatomia');

  if (!educationalContext && !annotation && !layer) return null;

  const title = educationalContext?.structureName || annotation?.title || layer?.structureName || 'Estrutura';
  const description = educationalContext?.description || annotation?.description || layer?.description || 'Nenhuma descrição disponível.';

  const tabs = ['Anatomia', 'Clínica', 'Objetivos', 'Quiz'];

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-black/30 border-l border-white/5 animate-fade-in">
      {/* Header */}
      <div className="p-6 pb-0 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <LineIcon name="book-open" className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-blue-400 font-bold block mb-1">
              Contexto Educacional
            </span>
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-white/10 overflow-x-auto custom-scrollbar pb-[-1px]">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap border-b-2 ${
                activeTab === tab 
                  ? 'border-techTeal text-techTeal' 
                  : 'border-transparent text-textMuted hover:text-white hover:border-white/30'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        
        {/* TAB: ANATOMIA */}
        {activeTab === 'Anatomia' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="text-[10px] uppercase text-textMuted font-bold block mb-1">Disciplina</span>
                <span className="text-sm text-clinicalWhite">{educationalContext?.discipline || 'Anatomia Geral'}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="text-[10px] uppercase text-textMuted font-bold block mb-1">Nível</span>
                <span className={`text-sm font-bold ${
                  educationalContext?.difficultyLevel === 'Básico' ? 'text-green-400' :
                  educationalContext?.difficultyLevel === 'Intermediário' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {educationalContext?.difficultyLevel || 'Básico'}
                </span>
              </div>
            </div>

            <p className="text-sm text-clinicalWhite leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
              {description}
            </p>

            {educationalContext?.relatedStructures?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-textMuted mb-3 uppercase tracking-widest text-[10px]">Estruturas Relacionadas</h3>
                <div className="flex flex-wrap gap-2">
                  {educationalContext.relatedStructures.map((rel, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 bg-white/10 rounded-full text-white border border-white/10">
                      {rel}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: CLÍNICA */}
        {activeTab === 'Clínica' && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-techTeal mb-3 flex items-center gap-2">
                <LineIcon name="activity" className="w-4 h-4" /> Importância Clínica
              </h3>
              <p className="text-sm text-clinicalWhite leading-relaxed bg-techTeal/5 p-4 rounded-xl border border-techTeal/10">
                {educationalContext?.clinicalImportance || 'Informação clínica não disponível para esta estrutura.'}
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                <LineIcon name="alert-triangle" className="w-4 h-4" /> Erros Frequentes de Identificação
              </h3>
              <ul className="space-y-2">
                {educationalContext?.commonMistakes?.length > 0 ? educationalContext.commonMistakes.map((mistake, i) => (
                  <li key={i} className="text-sm text-textMuted flex items-start gap-2 bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/10">
                    <span className="text-amber-500 font-bold mt-0.5">✕</span> {mistake}
                  </li>
                )) : (
                  <li className="text-sm text-textMuted italic">Nenhum erro comum mapeado.</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* TAB: OBJETIVOS */}
        {activeTab === 'Objetivos' && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <LineIcon name="check-circle" className="w-4 h-4 text-green-400" /> Objetivos de Aprendizagem
              </h3>
              <ul className="space-y-2">
                {educationalContext?.learningObjectives?.length > 0 ? educationalContext.learningObjectives.map((obj, i) => (
                  <li key={i} className="text-sm text-textMuted flex items-start gap-2 bg-white/5 p-2.5 rounded-lg border border-white/5">
                    <span className="text-green-400 font-bold mt-0.5">•</span> {obj}
                  </li>
                )) : (
                  <li className="text-sm text-textMuted italic">Objetivos não definidos.</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* TAB: QUIZ */}
        {activeTab === 'Quiz' && (
          <div className="animate-fade-in flex flex-col items-center justify-center h-full text-center py-8">
            <LineIcon name="help-circle" className="w-16 h-16 text-blue-500/30 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Avaliação de Conhecimento</h3>
            <p className="text-textMuted text-sm max-w-xs mb-6">
              Teste seu conhecimento sobre {title} com uma bateria rápida de perguntas estruturais.
            </p>
            <button 
              className="px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-blue-400 font-bold transition-colors flex items-center justify-center gap-2"
              disabled={!educationalContext?.linkedQuizIds?.length}
            >
              <LineIcon name="play-circle" className="w-5 h-5" /> 
              {educationalContext?.linkedQuizIds?.length ? 'Iniciar Avaliação' : 'Quiz Indisponível'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
