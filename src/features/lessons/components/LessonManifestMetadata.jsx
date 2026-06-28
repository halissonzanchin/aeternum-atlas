import React from 'react';

export default function LessonManifestMetadata({ manifest }) {
  if (!manifest) return null;

  const MetaRow = ({ label, value }) => (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-200">{value}</span>
    </div>
  );

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-clinicalWhite uppercase tracking-widest border-b border-white/10 pb-2 mb-3">
        Metadados Técnicos
      </h4>
      <div className="bg-black/20 rounded-lg p-4 border border-white/5">
        <MetaRow label="Lesson ID" value={manifest.lessonId} />
        <MetaRow label="Versão" value={manifest.version} />
        <MetaRow label="Duração Est." value={`${manifest.estimatedDurationMinutes} min`} />
        <MetaRow label="Dificuldade" value={<span className="capitalize">{manifest.difficulty}</span>} />
        <MetaRow label="Modelo 3D Base" value={manifest.modelTitle || manifest.modelSlug} />
        <MetaRow label="Checksum" value={<span className="font-mono text-xs text-gold truncate max-w-[150px] inline-block">{manifest.checksum}</span>} />
      </div>
      
      {manifest.tags && manifest.tags.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <p className="text-xs text-gray-500 mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {manifest.tags.map(tag => (
              <span key={tag} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-400">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
