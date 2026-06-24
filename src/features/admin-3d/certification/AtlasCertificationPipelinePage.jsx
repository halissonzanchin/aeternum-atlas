import React, { useState } from 'react';
import Card from '../../../components/Card/Card';
import { CertificationStage, duplicatePipelineFromReference } from '../../../services/atlasCertificationPipeline';

const PRIORITIZED_MODELS = [
  { id: 'corte-sagital-encefalo', name: 'Corte Sagital do Encéfalo', status: CertificationStage.ATLAS_CERTIFIED, score: 100, step: 'Certificado', engine: 'Atlas Native' },
  { id: 'sistema-reprodutor-feminino', name: 'Sistema Reprodutor Feminino', status: CertificationStage.NOT_STARTED, score: 0, step: 'Aguardando', engine: 'Sketchfab Legacy' },
  { id: 'coracao-humano', name: 'Coração Humano', status: CertificationStage.NOT_STARTED, score: 0, step: 'Aguardando', engine: 'Sketchfab Legacy' },
  { id: 'encefalo-completo', name: 'Encéfalo Completo', status: CertificationStage.NOT_STARTED, score: 0, step: 'Aguardando', engine: 'Sketchfab Legacy' },
  { id: 'sistema-vascular', name: 'Sistema Vascular', status: CertificationStage.NOT_STARTED, score: 0, step: 'Aguardando', engine: 'Sketchfab Legacy' },
  { id: 'sistema-musculoesqueletico', name: 'Sistema Musculoesquelético', status: CertificationStage.NOT_STARTED, score: 0, step: 'Aguardando', engine: 'Sketchfab Legacy' }
];

export default function AtlasCertificationPipelinePage({ navigate }) {
  const [models, setModels] = useState(PRIORITIZED_MODELS);

  const handleDuplicate = (targetId) => {
    const pipeline = duplicatePipelineFromReference('corte-sagital-encefalo', targetId);
    setModels(models.map(m => m.id === targetId ? { ...m, status: pipeline.status, step: 'Pipeline Duplicado' } : m));
    alert(`Pipeline estrutural duplicado do Encéfalo para ${targetId}.`);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-20 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <span className="text-techTeal text-xs font-bold tracking-widest uppercase mb-2 block">Aeternum Scale-Up</span>
          <h1 className="text-3xl font-bold text-clinicalWhite font-serif">Certification Pipeline</h1>
          <p className="text-textMuted mt-2 max-w-2xl">
            Esteira fabril para homologação e certificação dos modelos Atlas Native. Acompanhe a transição do legado para a nova engine proprietária.
          </p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border border-white/10 bg-blackDeep/50 backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-textMuted">
              <th className="p-4 font-medium">Modelo</th>
              <th className="p-4 font-medium">Engine</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Score</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {models.map(model => (
              <tr key={model.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <p className="text-clinicalWhite font-medium">{model.name}</p>
                  <p className="text-xs text-textMuted">{model.step}</p>
                </td>
                <td className="p-4">
                  <span className={`whitespace-nowrap px-2 py-1 text-[10px] font-bold uppercase rounded ${model.engine === 'Atlas Native' ? 'bg-techTeal/20 text-techTeal border border-techTeal/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                    {model.engine}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`whitespace-nowrap text-xs font-semibold ${model.status === CertificationStage.ATLAS_CERTIFIED ? 'text-techTeal' : 'text-amber-500'}`}>
                    {model.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${model.score === 100 ? 'bg-techTeal' : 'bg-amber-500'}`}
                        style={{ width: `${model.score}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-clinicalWhite font-mono">{model.score}/100</span>
                  </div>
                </td>
                <td className="p-4 flex gap-2 justify-end">
                  {model.status !== CertificationStage.ATLAS_CERTIFIED && (
                    <button 
                      onClick={() => handleDuplicate(model.id)}
                      className="text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded bg-indigo-500/10 transition-colors"
                    >
                      Duplicar Pipeline do Encéfalo
                    </button>
                  )}
                  {model.status === CertificationStage.ATLAS_CERTIFIED ? (
                    <button 
                      onClick={() => navigate(`/super-admin/atlas-certification/${model.id}`)}
                      className="text-[10px] uppercase font-bold text-blackDeep bg-techTeal hover:bg-white px-3 py-1.5 rounded transition-colors"
                    >
                      Ver Detalhes
                    </button>
                  ) : (
                    <button 
                      onClick={() => alert(`Iniciando esteira para ${model.name}...`)}
                      className="text-[10px] uppercase font-bold text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded transition-colors"
                    >
                      Iniciar Certificação
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
