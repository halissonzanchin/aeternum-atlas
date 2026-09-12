import React, { useState } from 'react';
import { getAllLessons } from '../../services/lessonManifestService';
import LessonCard from './components/LessonCard';
import { useLanguage } from '../../context/LanguageContext';
import { A26FeatureShell, A26PageHeader, A26SegmentedControl } from '../../components/aeternum-26';

export default function LessonLibraryPage({ navigate }) {
  const { t } = useLanguage();
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
    <A26FeatureShell
      variant="standard"
      className="animate-fade-in-up"
      header={
        <A26PageHeader
          eyebrow={t("lessonLibrary.eyebrow")}
          title={t("lessonLibrary.title")}
          description={t("lessonLibrary.subtitle")}
        />
      }
      toolbar={
        <div className="flex justify-end">
          <A26SegmentedControl
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: t("lessonLibrary.filterAll") },
              { value: 'published', label: t("lessonLibrary.filterPublished") },
              { value: 'draft', label: t("lessonLibrary.filterDraft") }
            ]}
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
          <p>{t("common.noData", { defaultValue: "Nenhuma aula encontrada para este filtro." })}</p>
        </div>
      )}
    </A26FeatureShell>
  );
}
