import React, { useEffect, useState } from 'react';
import { getLessonBySlug, validateLessonManifest } from '../../services/lessonManifestService';
import LessonIframeSandbox from './components/LessonIframeSandbox';
import LessonSecurityChecklist from './components/LessonSecurityChecklist';
import LessonReviewSummary from './components/LessonReviewSummary';
import LessonManifestMetadata from './components/LessonManifestMetadata';

export default function LessonPlayerPage({ lessonSlug, navigate }) {
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const data = getLessonBySlug(lessonSlug);
    if (!data) {
      setError("Aula não encontrada no manifesto local.");
      return;
    }

    const validation = validateLessonManifest(data);
    if (!validation.valid) {
      setError(`Manifesto inválido: ${validation.error}`);
      return;
    }

    // Por enquanto, bloqueamos aulas que não são draft ou que não têm visibilidade admin
    // (a menos que a flag status seja published)
    if (data.visibility !== 'admin' && data.visibility !== 'teacher') {
       setError("Esta aula não tem visibilidade permitida para visualização neste protótipo.");
       return;
    }

    setLesson(data);
  }, [lessonSlug]);

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center animate-fade-in-up">
        <h2 className="text-2xl text-red-400 font-bold mb-4">Acesso Bloqueado</h2>
        <p className="text-gray-300 max-w-md">{error}</p>
        <button 
          onClick={() => navigate('/lessons')}
          className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
        >
          Voltar para Biblioteca
        </button>
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="flex flex-col h-full space-y-4 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-4 animate-fade-in-up">
      
      {/* Header Compacto */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/lessons')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-gray-300"
            title="Voltar"
          >
            ←
          </button>
          <div>
            <span className="text-xs text-techTeal font-bold uppercase tracking-widest block mb-1">
              Aeternum Lesson Player
            </span>
            <h1 className="text-xl md:text-2xl font-semibold text-clinicalWhite">
              {lesson.title}
            </h1>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs text-gray-500 uppercase font-semibold">Status</span>
          <span className={`text-sm font-bold uppercase ${lesson.status === 'published' ? 'text-techTeal' : 'text-gold'}`}>
            {lesson.status}
          </span>
        </div>
      </div>

      {/* Main Grid: Player + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[700px]">
        
        {/* Player Iframe */}
        <div className="flex-1 min-h-[600px] lg:min-h-0 relative">
          <LessonIframeSandbox manifest={lesson} />
        </div>

        {/* Sidebar Diagnostics */}
        <div className="w-full lg:w-[350px] space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          
          <div className="atlas-liquid-glass-card p-5 rounded-2xl border border-white/5">
            <LessonSecurityChecklist security={lesson.security} />
          </div>

          <div className="atlas-liquid-glass-card p-5 rounded-2xl border border-white/5">
            <LessonReviewSummary review={lesson.review} />
          </div>

          <div className="atlas-liquid-glass-card p-5 rounded-2xl border border-white/5">
            <LessonManifestMetadata manifest={lesson} />
          </div>

        </div>
      </div>
    </div>
  );
}
