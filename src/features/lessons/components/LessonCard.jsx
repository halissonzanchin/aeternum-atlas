import React from 'react';
import LessonStatusBadge from './LessonStatusBadge';
import { getLessonSecurityScore } from '../../../services/lessonManifestService';

export default function LessonCard({ lesson, onClick }) {
  const securityScore = getLessonSecurityScore(lesson);
  let scoreColor = "text-techTeal";
  if (securityScore < 80) scoreColor = "text-gold";
  if (securityScore < 50) scoreColor = "text-red-400";

  return (
    <div 
      className="atlas-liquid-glass-card atlas-liquid-pressable p-5 rounded-2xl flex flex-col h-full cursor-pointer transition-all hover:border-techTeal/40"
      onClick={() => onClick(lesson)}
    >
      <div className="flex justify-between items-start mb-4">
        <LessonStatusBadge status={lesson.status} />
        <span className={`text-xs font-bold ${scoreColor}`}>
          Security: {securityScore}/100
        </span>
      </div>
      
      <h3 className="text-xl font-semibold text-clinicalWhite mb-2 line-clamp-2 leading-tight">
        {lesson.title}
      </h3>
      
      <p className="text-sm text-textMuted mb-4">
        Assunto: <span className="text-gray-300">{lesson.subject}</span>
      </p>
      
      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-white/5">
        <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-400">
          V {lesson.version}
        </span>
        <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-400">
          {lesson.assetBudgetMb} MB
        </span>
        {lesson.usesGlb && (
          <span className="text-xs bg-techTeal/10 text-techTeal px-2 py-1 rounded">
            3D GLB
          </span>
        )}
      </div>
    </div>
  );
}
