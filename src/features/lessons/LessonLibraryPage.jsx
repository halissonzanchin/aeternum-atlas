import React, { useState } from 'react';
import { getAllLessons } from '../../services/lessonManifestService';
import LessonCard from './components/LessonCard';

export default function LessonLibraryPage({ navigate }) {
  const [lessons] = useState(getAllLessons());
  const [filter, setFilter] = useState('all');

  // Filtramos apenas as permitidas para visão interna/protótipo
  const visibleLessons = lessons.filter(l => l.visibility === 'admin' || l.visibility === 'teacher' || l.visibility === 'student');
  
  const filteredLessons = visibleLessons.filter(l => {
    if (filter === 'all') return true;
    return l.status === filter;
  });

  const handleLessonOpen = (lesson) => {
    navigate(`/lessons/${lesson.slug}`);
  };

  return (
    <div className="flex flex-col h-full space-y-6 w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-techTeal/10 border border-techTeal/20 text-techTeal text-xs font-bold uppercase tracking-widest mb-3">
            🧪 Módulo em Protótipo (MIRA Lab)
          </span>
          <h1 className="text-3xl md:text-4xl font-light text-clinicalWhite tracking-tight">
            Biblioteca de Aulas Interativas
          </h1>
          <p className="text-textMuted mt-2 text-lg">
            Decks HTML estáticos gerados externamente e validados via Manifesto
          </p>
        </div>
        
        <div className="flex gap-2 bg-black/40 p-1 rounded-lg border border-white/10">
          <button 
            className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${filter === 'all' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setFilter('all')}
          >
            Todas
          </button>
          <button 
            className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${filter === 'published' ? 'bg-techTeal/20 text-techTeal' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setFilter('published')}
          >
            Publicadas
          </button>
          <button 
            className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${filter === 'draft' ? 'bg-gold/20 text-gold' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setFilter('draft')}
          >
            Rascunhos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
        {filteredLessons.map(lesson => (
          <LessonCard 
            key={lesson.lessonId} 
            lesson={lesson} 
            onClick={handleLessonOpen} 
          />
        ))}
      </div>
      
      {filteredLessons.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p>Nenhuma aula encontrada para este filtro.</p>
        </div>
      )}
    </div>
  );
}
