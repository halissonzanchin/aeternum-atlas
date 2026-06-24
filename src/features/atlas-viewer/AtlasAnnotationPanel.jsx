import { atlasEducationalRegistry } from '../../data/atlasEducationalRegistry';

export default function AtlasAnnotationPanel({ activeMarker, onClose }) {
  if (!activeMarker) return null;

  // Busca dados educacionais oficiais
  const structureKey = activeMarker.anatomicalStructure || activeMarker.title;
  const eduData = atlasEducationalRegistry[structureKey] || null;

  return (
    <div className="absolute top-20 right-4 w-96 max-h-[80vh] flex flex-col bg-blackDeep/95 backdrop-blur-xl border border-techTeal/30 rounded-2xl shadow-[0_0_40px_rgba(45,212,191,0.15)] overflow-hidden z-20 pointer-events-auto transform transition-all duration-500 ease-out animate-fade-in-up">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-techTeal/20 to-transparent p-4 border-b border-techTeal/10 flex justify-between items-start flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-techTeal/10 flex items-center justify-center border border-techTeal/30">
            <span className="text-techTeal font-bold">i</span>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-techTeal/70 font-semibold block mb-0.5">Estrutura Ativa</span>
            <h3 className="text-white font-medium leading-tight">{activeMarker.title}</h3>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors p-1"
          aria-label="Fechar painel"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Content Body */}
      <div className="p-5 overflow-y-auto custom-scrollbar flex-grow">
        {eduData ? (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-white/90 leading-relaxed font-medium">
                {eduData.shortExplanation}
              </p>
            </div>
            
            <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg">
              <h4 className="text-[11px] uppercase tracking-wider text-red-400 font-semibold mb-1.5 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Importância Clínica
              </h4>
              <p className="text-xs text-white/70 leading-relaxed">{eduData.clinicalImportance}</p>
            </div>

            <div>
              <h4 className="text-[11px] uppercase tracking-wider text-techTeal/70 font-semibold mb-2">Objetivos de Aprendizagem</h4>
              <ul className="space-y-1.5">
                {eduData.learningObjectives?.map((obj, i) => (
                  <li key={i} className="text-xs text-white/70 flex items-start gap-2">
                    <span className="text-techTeal mt-0.5">•</span> {obj}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] uppercase tracking-wider text-amber-500/70 font-semibold mb-2">Erros Frequentes</h4>
              <ul className="space-y-1.5">
                {eduData.commonMistakes?.map((err, i) => (
                  <li key={i} className="text-xs text-white/70 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">⚠</span> {err}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/70 leading-relaxed mb-4">
            {activeMarker.description}
          </p>
        )}
        
        {/* Real Actions */}
        <div className="flex flex-col gap-2 mt-6 pt-4 border-t border-white/5">
          <button 
            onClick={() => {
              console.log('EVENT: AI_TUTOR_OPENED', { structureId: structureKey });
              alert(`Tutor IA Iniciado: Qual a sua dúvida sobre o ${structureKey}?`);
            }}
            className="w-full bg-techTeal text-blackDeep text-xs font-bold py-2.5 px-3 rounded-lg hover:bg-white hover:text-blackDeep transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Tutor IA (Atlas Native)
          </button>
          
          <button 
            onClick={() => {
              console.log('EVENT: QUIZ_STARTED', { structureId: structureKey });
              alert(`Simulado Iniciado: Verificando conhecimentos de ${structureKey}.`);
            }}
            className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold py-2 px-3 rounded-lg border border-indigo-500/20 transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Resolver Questões
          </button>
        </div>
      </div>
    </div>
  );
}
