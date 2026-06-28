import React, { useState } from 'react';
import { getAllLessons } from '../../../services/lessonManifestService';
import LessonStatusBadge from '../components/LessonStatusBadge';

export default function LessonAdminReviewPage({ navigate }) {
  const [lessons] = useState(getAllLessons());

  const handleOpenSandbox = (slug) => {
    navigate(`/lessons/${slug}`);
  };

  return (
    <div className="flex flex-col h-full space-y-6 w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-techTeal/10 border border-techTeal/20 text-techTeal text-xs font-bold uppercase tracking-widest mb-3">
            Governança Editorial
          </span>
          <h1 className="text-3xl md:text-4xl font-light text-clinicalWhite tracking-tight">
            Gestão de Aulas Estáticas
          </h1>
          <p className="text-textMuted mt-2 text-lg">
            Revisão Anatômica, Técnica e de Segurança do Lesson Animator
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {lessons.map(lesson => (
          <div key={lesson.lessonId} className="atlas-liquid-glass-card p-6 rounded-2xl border border-white/5 flex flex-col lg:flex-row gap-6">
            
            {/* Infos Principais */}
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-clinicalWhite">{lesson.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">ID: {lesson.lessonId} | Base: {lesson.modelSlug}</p>
                </div>
                <LessonStatusBadge status={lesson.status} />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Orçamento de Assets</p>
                  <p className={`text-sm font-bold ${lesson.security?.assetBudgetPassed ? 'text-techTeal' : 'text-red-400'}`}>
                    {lesson.assetBudgetMb} MB
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Dependência GLB</p>
                  <p className="text-sm font-bold text-gray-300">
                    {lesson.usesGlb ? 'Sim (Exige HTTP)' : 'Não'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Sandbox Policy</p>
                  <p className="text-sm font-bold text-gray-300 font-mono">
                    {lesson.sandboxPolicy}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Origem URL</p>
                  <p className="text-sm font-bold text-gray-300 truncate" title={lesson.deckUrl}>
                    {lesson.deckUrl.startsWith('/lesson-decks/') ? 'Local' : 'Externa'}
                  </p>
                </div>
              </div>
            </div>

            {/* Ações e Checklist */}
            <div className="w-full lg:w-72 bg-black/20 rounded-xl p-4 border border-white/5 flex flex-col justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold mb-2">Checklist de Revisão</p>
                <ul className="space-y-1 text-sm">
                  <li className={`flex justify-between ${lesson.review?.technicalStatus === 'approved' ? 'text-techTeal' : 'text-gold'}`}>
                    <span>Técnica</span>
                    <span className="uppercase text-xs font-bold">{lesson.review?.technicalStatus}</span>
                  </li>
                  <li className={`flex justify-between ${lesson.review?.anatomicalStatus === 'approved' ? 'text-techTeal' : 'text-gold'}`}>
                    <span>Anatomia</span>
                    <span className="uppercase text-xs font-bold">{lesson.review?.anatomicalStatus}</span>
                  </li>
                  <li className={`flex justify-between ${lesson.review?.securityStatus === 'approved' ? 'text-techTeal' : 'text-gold'}`}>
                    <span>Segurança</span>
                    <span className="uppercase text-xs font-bold">{lesson.review?.securityStatus}</span>
                  </li>
                </ul>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                <button 
                  onClick={() => handleOpenSandbox(lesson.slug)}
                  className="w-full py-2 bg-techTeal hover:bg-techTeal/80 text-blackDeep font-bold rounded transition-colors text-sm"
                >
                  Abrir no Sandbox
                </button>
                <p className="text-[10px] text-gray-500 text-center">
                  Edição de status indisponível sem RLS/DB.
                </p>
              </div>
            </div>

          </div>
        ))}

        {lessons.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            Nenhum manifesto carregado.
          </div>
        )}
      </div>
    </div>
  );
}
