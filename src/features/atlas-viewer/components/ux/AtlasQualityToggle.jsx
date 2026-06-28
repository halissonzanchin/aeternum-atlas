import React, { useState } from 'react';

import AtlasTooltip from './AtlasTooltip';

export default function AtlasQualityToggle({ renderMode, setRenderMode, disabled }) {
  const [isOpen, setIsOpen] = useState(false);

  // Mapeia as opções do Render Studio
  const options = [
    { id: 'anatomicalRealism', label: 'Realismo', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    { id: 'vertexColorFaithful', label: 'Cor Fiel', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
    { id: 'clinicalDepth', label: 'Clínico', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
    { id: 'performanceMobile', label: 'Mobile', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
  ];

  const currentOption = options.find(o => o.id === renderMode) || options[0];

  return (
    <div className="relative">
      <AtlasTooltip content={disabled ? "Recurso nativo (Indisponível no Sketchfab)" : "Qualidade"} position="top">
        <button 
          onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className={`h-10 px-3 rounded-lg flex items-center justify-center transition-colors shadow-lg gap-2 ${
            disabled 
              ? 'bg-[#151A23]/50 border border-white/5 text-slate-600 cursor-not-allowed'
              : 'bg-[#151A23]/90 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          aria-label="Modo Visual"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={currentOption.icon} /></svg>
          <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline atlas-nowrap-label">{currentOption.label}</span>
        </button>
      </AtlasTooltip>

      {isOpen && (
        <div className="absolute bottom-[calc(100%+8px)] right-0 bg-[#151A23] border border-white/10 rounded-lg shadow-2xl overflow-hidden flex flex-col w-36">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setRenderMode(opt.id);
                setIsOpen(false);
              }}
              className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-left transition-colors flex items-center gap-2 ${renderMode === opt.id ? 'bg-techTeal/20 text-techTeal' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={opt.icon} /></svg>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
