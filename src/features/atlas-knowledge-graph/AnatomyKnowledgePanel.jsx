import React, { useEffect, useState } from 'react';
import Card from '../../components/Card/Card';
import { anatomyGraphService } from './anatomyGraphService';
import AtlasKnowledgeQueryBox from './AtlasKnowledgeQueryBox';

export default function AnatomyKnowledgePanel({ activeMarkerId }) {
  const [entity, setEntity] = useState(null);
  const [relations, setRelations] = useState([]);

  useEffect(() => {
    if (!activeMarkerId) {
      setEntity(null);
      setRelations([]);
      return;
    }

    const foundEntities = anatomyGraphService.getEntitiesByMarkerId(activeMarkerId);
    
    // Simplificando: pega a primeira entidade associada a este pino
    if (foundEntities.length > 0) {
      const mainEntity = foundEntities[0];
      setEntity(mainEntity);
      setRelations(anatomyGraphService.getRelatedEntities(mainEntity.id));
    } else {
      setEntity(null);
      setRelations([]);
    }
  }, [activeMarkerId]);

  // if (!entity) return null; // removido para sempre mostrar o querybox

  return (
    <div className="absolute top-24 right-6 w-80 z-10 fade-in-up max-h-[70vh] flex flex-col pointer-events-none gap-3">
      <Card className="bg-blackDeep/90 backdrop-blur-md border border-selectionGreen/30 shadow-2xl pointer-events-auto flex flex-col overflow-hidden">
        <AtlasKnowledgeQueryBox />
        
        {entity ? (
          <div className="overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1 border-b border-white/10 pb-3">
              <p className="text-[10px] uppercase tracking-widest text-selectionGreen">{entity.system}</p>
              <h2 className="text-xl font-bold text-clinicalWhite">{entity.name}</h2>
              <p className="font-serif italic text-textMuted">{entity.latinName}</p>
            </div>

        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-clinicalWhite mb-1">Descrição</h3>
            <p className="text-sm text-textMuted leading-relaxed">
              {entity.description}
            </p>
          </div>

          {(entity.arterialSupply.length > 0 || entity.venousDrainage.length > 0) && (
            <div className="bg-blackDeep/50 rounded-lg p-3 border border-white/5">
              <h3 className="text-xs uppercase tracking-wider text-clinicalWhite mb-2">Vascularização</h3>
              
              {entity.arterialSupply.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs font-semibold text-red-400">Arterial: </span>
                  <span className="text-xs text-textMuted">{entity.arterialSupply.join(', ')}</span>
                </div>
              )}
              
              {entity.venousDrainage.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-blue-400">Venosa: </span>
                  <span className="text-xs text-textMuted">{entity.venousDrainage.join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {relations.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-clinicalWhite mb-2">Conexões Anatômicas (Grafo)</h3>
              <ul className="flex flex-col gap-2">
                {relations.map((rel, idx) => (
                  <li key={idx} className="flex gap-2 items-start text-xs bg-selectionGreen/5 p-2 rounded-md border border-selectionGreen/10">
                    <svg className="w-4 h-4 text-selectionGreen shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <div>
                      <span className="font-semibold text-clinicalWhite">{rel.entity.name}: </span>
                      <span className="text-textMuted">{rel.relationLabel}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {entity.pathologies.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-clinicalWhite mb-1">Patologias Associadas</h3>
              <div className="flex flex-wrap gap-1">
                {entity.pathologies.map(patho => (
                  <span key={patho} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                    {patho.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-xs text-textMuted">Clique em um marcador 3D para exibir dados clínicos ou use a busca inteligente acima.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
