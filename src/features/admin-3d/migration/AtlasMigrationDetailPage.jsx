import React, { useEffect, useState } from 'react';
import Card from '../../../components/Card/Card';
import Button from '../../../components/Button/Button';
import LineIcon from '../../../components/icons/LineIcon';
import { getMigrationDashboardMetrics } from '../../../services/atlasMigrationService';

export default function AtlasMigrationDetailPage({ modelId, navigate }) {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    getMigrationDashboardMetrics(null).then(res => {
      if (!mounted) return;
      const found = res.models.find(m => m.id === modelId);
      setModel(found);
      setLoading(false);
    });

    return () => { mounted = false; };
  }, [modelId]);

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto animate-pulse flex flex-col gap-6">
        <div className="h-10 w-64 bg-white/10 rounded"></div>
        <div className="h-96 bg-white/5 rounded-xl border border-white/10"></div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-xl text-clinicalWhite">Modelo não encontrado</h1>
        <Button onClick={() => navigate('/super-admin/atlas-migration')} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const { checks, migrationScore, migrationStatus } = model;

  const CheckItem = ({ label, checked }) => (
    <div className="flex items-center gap-3 p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
      <div className={`w-5 h-5 rounded flex items-center justify-center border ${checked ? 'bg-techTeal border-techTeal text-blackDeep' : 'border-white/20 bg-blackDeep'}`}>
        {checked && <LineIcon name="check" className="w-4 h-4" />}
      </div>
      <span className={checked ? 'text-clinicalWhite font-medium' : 'text-textMuted'}>{label}</span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <button onClick={() => navigate('/super-admin/atlas-migration')} className="text-techTeal hover:underline text-sm mb-4 inline-flex items-center gap-2">
          &larr; Voltar para Workbench
        </button>
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">{model.system || 'Atlas Migration'}</p>
            <h1 className="display-title">{model.title}</h1>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <div className="flex items-center gap-4">
              <div className="text-right flex flex-col items-end">
                <span className="text-4xl font-bold font-mono text-techTeal">{migrationScore}%</span>
                <span className="text-xs uppercase tracking-wider text-textMuted mt-1 px-2 py-1 bg-white/10 rounded">{migrationStatus}</span>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate(`/super-admin/atlas-certification/${model.id}`)}>
              Digital Twin Certification
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-clinicalWhite">Migration Checklist</h2>
          <Button variant="outline" onClick={() => navigate(`/super-admin/models-3d/${model.id}/editor`)}>
            <LineIcon name="edit" className="w-4 h-4 mr-2" />
            Abrir no Editor Visual
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>
            <h3 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-2 mt-4">Asset 3D</h3>
            <CheckItem label="GLB/GLTF/OBJ carregado" checked={checks.hasAsset} />
            <CheckItem label="Viewer funcional" checked={checks.viewerFunctional} />
            
            <h3 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-2 mt-6">Anotações e Espacial</h3>
            <CheckItem label="Marcadores recriados" checked={checks.markersRecreated} />
            <CheckItem label="Views/Câmeras recriadas" checked={checks.camerasRecreated} />
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-2 mt-4">Estrutura de Ensino</h3>
            <CheckItem label="Conteúdo educacional" checked={checks.hasEducationalContent} />
            <CheckItem label="Estruturas cadastradas" checked={checks.structuresRegistered} />
            <CheckItem label="Isolation Layer validada" checked={checks.isolationLayerValid} />
            
            <h3 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-2 mt-6">Inteligência e Ensino</h3>
            <CheckItem label="Quiz vinculado" checked={checks.hasQuiz} />
            <CheckItem label="Tutor IA preparado" checked={checks.hasAiTutor} />
            <CheckItem label="Telemetria ativa" checked={checks.telemetryActive} />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-clinicalWhite mb-2">Importação de Dados (Coming Soon)</h2>
        <p className="text-sm text-textMuted mb-6">Ferramentas de importação em lote para facilitar a migração massiva de marcadores.</p>
        
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" className="opacity-50 cursor-not-allowed">
            <LineIcon name="download" className="w-4 h-4 mr-2" />
            Sketchfab Marker Import
          </Button>
          <Button variant="outline" className="opacity-50 cursor-not-allowed">
            <LineIcon name="code" className="w-4 h-4 mr-2" />
            JSON Import
          </Button>
          <Button variant="outline" className="opacity-50 cursor-not-allowed">
            <LineIcon name="file" className="w-4 h-4 mr-2" />
            CSV Import
          </Button>
        </div>
      </Card>
    </div>
  );
}
