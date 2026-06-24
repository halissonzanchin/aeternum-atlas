import React from 'react';
import LineIcon from '../../../components/icons/LineIcon';
import { formatNumber } from '../../../utils/formatLocale';
import { useLanguage } from '../../../context/LanguageContext';
import { anatomicalStructureRegistry } from '../../../data/anatomicalStructureRegistry';
import { atlasModelRegistry } from '../../../data/atlasModelRegistry';

export default function AnatomicalHeatmapDetailDrawer({ regionId, data = [], onClose }) {
  const { language } = useLanguage();

  if (!regionId) return null;

  const structures = data.filter(d => d.regionId === regionId);
  const registryData = anatomicalStructureRegistry[regionId];
  const regionName = registryData ? registryData.regionName : 'Região Selecionada';

  return (
    <div className="flex flex-col w-full p-4 animate-fade-in-down">
      {/* Header Executivo */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
        <div>
          <span className="text-xs font-bold text-techTeal uppercase tracking-wider mb-1 block">Diagnóstico Regional</span>
          <h2 className="text-2xl font-bold text-clinicalWhite flex items-center gap-2">
            <LineIcon name="activity" className="text-techTeal h-7 w-7" />
            {regionName}
          </h2>
          {registryData && (
            <span className="text-[10px] text-textMuted uppercase tracking-wider mt-2 block">
              Sistema: {registryData.anatomicalSystem} | Risco Acadêmico: {registryData.academicRiskCategory}
            </span>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-textMuted hover:text-white border border-transparent hover:border-white/10">
            <LineIcon name="x" className="h-5 w-5" />
          </button>
        )}
      </div>

      {structures.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-textMuted bg-black/20 rounded-xl border border-dashed border-white/10">
          <LineIcon name="shield-check" className="h-10 w-10 mb-3 text-green-500/50" />
          <p className="text-sm font-medium">Anatomia estável. Sem riscos críticos detectados.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {structures.map((struct, idx) => (
            <div key={idx} className="bg-premiumDark rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
              
              {/* Top Bar: Nome e Severidade */}
              <div className="flex justify-between items-start p-5 bg-black/40 border-b border-white/5">
                <div>
                  <h3 className="text-xl font-bold text-clinicalWhite mb-2">{struct.displayName}</h3>
                  <div className="flex items-center gap-4 text-sm text-textMuted">
                    <span className="flex items-center gap-1"><LineIcon name="book" className="h-4 w-4 text-techTeal" /> {struct.course}</span>
                    <span className="flex items-center gap-1"><LineIcon name="user" className="h-4 w-4 text-blue-400" /> {struct.teacher}</span>
                  </div>
                </div>
                
                <div className={`px-4 py-2 rounded-xl text-center shadow-lg border ${
                  struct.riskLevel === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/30' : 
                  struct.riskLevel === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' :
                  struct.riskLevel === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-green-500/10 text-green-500 border-green-500/30'
                }`}>
                  <div className="text-xl font-black">{struct.errorRate}%</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-1">Taxa de Erro</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{struct.trend}</div>
                </div>
              </div>

              {/* Corpo: Dados Clínicos e Financeiros divididos */}
              <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/5 bg-premiumDark">
                
                {/* Lado Esquerdo: Acadêmico */}
                <div className="flex-1 p-5 grid grid-cols-2 gap-y-6 gap-x-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-textMuted uppercase tracking-widest mb-1 font-bold">Turmas Afetadas</span>
                    <strong className="text-clinicalWhite text-2xl font-light">{struct.affectedClasses}</strong>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-textMuted uppercase tracking-widest mb-1 font-bold">Estudantes</span>
                    <strong className="text-clinicalWhite text-2xl font-light">{struct.affectedStudents}</strong>
                  </div>
                  <div className="flex flex-col col-span-2">
                    <span className="text-[10px] text-textMuted uppercase tracking-widest mb-1 font-bold">Horas de Estudo Monitorado</span>
                    <strong className="text-clinicalWhite text-lg font-light">{struct.hours}h <span className="text-xs text-textMuted font-normal ml-1">em dissecação virtual</span></strong>
                  </div>
                </div>

                {/* Lado Direito: Financeiro */}
                <div className="md:w-2/5 p-5 bg-gradient-to-br from-red-500/5 to-transparent flex flex-col justify-center">
                  <span className="text-[10px] text-red-400 uppercase tracking-widest mb-2 font-black flex items-center gap-1">
                    <LineIcon name="trending-down" className="h-3 w-3" /> Exposição Financeira
                  </span>
                  <strong className="text-red-400 text-3xl font-light tracking-tight">
                    R$ {formatNumber(struct.financialImpact, language)}
                  </strong>
                  <span className="text-xs text-textMuted mt-2 leading-relaxed">
                    Custo estimado de evasão atrelado à deficiência de aprendizagem nesta estrutura.
                  </span>
                </div>
              </div>

              {/* Estruturas Físicas Associadas (Vindo do Registry) */}
              {registryData && registryData.relatedStructures && registryData.relatedStructures.length > 0 && (
                <div className="px-5 pt-5 bg-black/20">
                  <h4 className="text-[10px] text-textMuted uppercase font-bold tracking-wider mb-2">Estruturas Físicas Associadas</h4>
                  <div className="flex flex-wrap gap-2">
                    {registryData.relatedStructures.map((structure, sIdx) => (
                      <span key={sIdx} className="bg-white/5 text-[10px] text-white/70 px-2 py-1 rounded">
                        {structure}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rodapé: Prescrição IA e Modelos do Digital Twin */}
              <div className="p-5 border-t border-white/5 bg-techTeal/5 flex flex-col gap-6 mt-4">
                
                <div>
                  <h4 className="text-[11px] text-techTeal uppercase font-black tracking-widest mb-2 flex items-center gap-2">
                    <LineIcon name="spark" className="h-4 w-4" /> Prescrição Inteligente Aeternum
                  </h4>
                  <p className="text-sm text-clinicalWhite leading-relaxed border-l-2 border-techTeal/50 pl-3">
                    {struct.aiRecommendation}
                  </p>
                </div>

                {/* Atlas Model Registry Connect */}
                {registryData && registryData.linkedModelIds && registryData.linkedModelIds.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-[10px] text-textMuted uppercase font-bold tracking-wider mb-3 flex items-center gap-1">
                      <LineIcon name="box" className="h-3 w-3" /> Atlas Viewer Engine - Modelos 3D Associados
                    </h4>
                    <div className="flex flex-col gap-3">
                      {registryData.linkedModelIds.map((modelId, mIdx) => {
                        const modelData = atlasModelRegistry[modelId];
                        if (!modelData) return null;
                        
                        return (
                          <div 
                            key={mIdx} 
                            onClick={() => window.location.href = `/atlas-viewer/${modelId}`}
                            className="bg-black/40 border border-white/10 rounded-lg p-3 flex justify-between items-center hover:bg-white/5 hover:border-techTeal/30 transition-all cursor-pointer group"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white group-hover:text-techTeal transition-colors">{modelData.modelName}</span>
                              <span className="text-[10px] text-textMuted mt-1 font-mono">/atlas-viewer/{modelId}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                                modelData.engineStatus === 'Pronto' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                              }`}>
                                {modelData.engineStatus}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
