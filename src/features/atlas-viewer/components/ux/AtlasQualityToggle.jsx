import React, { useState } from 'react';

export default function AtlasQualityToggle({ qualityPreset, setQualityPreset }) {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { id: 'performance', label: 'Performance', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'balanced', label: 'Balanceado', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
    { id: 'clinical', label: 'Clínico', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' }
  ];

  const currentOption = options.find(o => o.id === qualityPreset) || options[2];

  return (
    <div className="relative group">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="h-10 px-3 rounded-lg bg-[#151A23]/90 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors shadow-lg gap-2"
        aria-label="Qualidade de Renderização"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={currentOption.icon} /></svg>
        <span className="text-[10px] font-bold uppercase tracking-widest">{currentOption.label}</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-[calc(100%+8px)] right-0 bg-[#151A23] border border-white/10 rounded-lg shadow-2xl overflow-hidden flex flex-col w-36">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setQualityPreset(opt.id);
                setIsOpen(false);
              }}
              className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-left transition-colors flex items-center gap-2 ${qualityPreset === opt.id ? 'bg-techTeal/20 text-techTeal' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
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
