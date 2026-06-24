import React, { useEffect, useState } from 'react';
import Card from '../../../components/Card/Card';
import Button from '../../../components/Button/Button';
import LineIcon from '../../../components/icons/LineIcon';
import { getModelByIdForUser } from '../../../services/modelService';
import { atlasAnnotationCmsService } from '../../../services/atlasAnnotationCmsService';

export default function AtlasCertificationPage({ modelId, navigate }) {
  const [model, setModel] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    getModelByIdForUser(modelId, null).then(res => {
      if (!mounted) return;
      setModel(res);
      
      try {
        const savedMarkers = atlasAnnotationCmsService.getMarkers(modelId);
        if (savedMarkers) setMarkers(savedMarkers);
      } catch (e) {
        console.error("Failed to load markers for certification page", e);
      }

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

  // Certification Baseline Logic
  const hasAsset = !!(model.atlasAssetObjectUrl || model.atlasEngineModelUrl || model.model_url);
  const viewerFunctional = model.viewerType === 'atlas-native' || model.viewer_engine === 'atlas-native';
  const hasStructures = model.structures && model.structures.length > 0;
  const hasMarkers = markers.length > 0;
  const hasCameras = markers.some(m => m.cameraPosition || m.camera_position);
  
  // Education, Quiz, AI Tutor logic (Mocked based on future fields)
  const hasLearningObjectives = !!model.objectives && model.objectives.length > 0;
  const hasClinicalImportance = !!model.clinicalCorrelations && model.clinicalCorrelations.length > 0;
  const hasFrequentErrors = !!model.frequentErrors && model.frequentErrors.length > 0;
  const hasEducationalContent = hasLearningObjectives || hasClinicalImportance || hasFrequentErrors;
  
  const hasQuiz = !!model.quizzes || !!model.quizId;
  const hasAiTutor = !!model.aiTutorEnabled;
  const hasAnalytics = !!model.analyticsEnabled;

  let currentScore = 0;
  if (hasAsset && viewerFunctional) currentScore += 20;
  if (hasMarkers) currentScore += 20;
  if (hasCameras) currentScore += 10;
  if (hasEducationalContent) currentScore += 15;
  if (hasQuiz) currentScore += 15;
  if (hasAiTutor) currentScore += 10;
  if (hasAnalytics) currentScore += 10;

  const hasSyntheticMarkers = markers.some(m => m.coordinateStatus === "synthetic_baseline" || m.requiresManualValidation);

  const CheckItem = ({ label, checked }) => (
    <div className="flex items-center gap-3 p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
      <div className={`w-5 h-5 rounded flex items-center justify-center border ${checked ? 'bg-techTeal border-techTeal text-blackDeep' : 'border-white/20 bg-blackDeep'}`}>
        {checked && <LineIcon name="check" className="w-4 h-4" />}
      </div>
      <span className={checked ? 'text-clinicalWhite font-medium' : 'text-textMuted'}>{label}</span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6">
      <div>
        <button onClick={() => navigate('/super-admin/atlas-migration')} className="text-techTeal hover:underline text-sm mb-4 inline-flex items-center gap-2">
          &larr; Voltar para Workbench
        </button>
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">Digital Twin Certification</p>
            <h1 className="display-title">{model.title}</h1>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-4xl font-bold font-mono text-techTeal">{currentScore}%</span>
            <span className="text-xs uppercase tracking-wider text-textMuted mt-1 px-2 py-1 bg-white/10 rounded">{model.status || 'MIGRATING'}</span>
            <span className="text-[10px] uppercase text-techTeal mt-1">Target: {model.migrationTarget || 'ATLAS_CERTIFIED'}</span>
          </div>
        </div>
      </div>

      {hasSyntheticMarkers && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-lg flex items-start gap-3">
          <LineIcon name="alert-triangle" className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold mb-1">Atenção: Baseline Sintético</h4>
            <p className="text-sm">Marcadores criados como baseline sintético; validação anatômica manual ainda necessária.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-clinicalWhite">Checklist de Certificação</h2>
            <Button variant="outline" size="sm" onClick={() => navigate(`/super-admin/models-3d/${model.id}/editor`)}>
              <LineIcon name="edit" className="w-4 h-4 mr-2" />
              Editor 3D
            </Button>
          </div>

          <div className="flex-grow overflow-y-auto pr-2">
            <h3 className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2 mt-4">Asset</h3>
            <CheckItem label="GLB carregado" checked={hasAsset} />
            <CheckItem label="Viewer validado (Atlas Native)" checked={viewerFunctional} />
            
            <h3 className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2 mt-6">Estruturas & Marcadores</h3>
            <CheckItem label="Estruturas cadastradas" checked={hasStructures} />
            <CheckItem label="Marcadores criados" checked={hasMarkers} />
            
            <h3 className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2 mt-6">Câmeras</h3>
            <CheckItem label="CameraPosition definida" checked={hasCameras} />
            <CheckItem label="CameraTarget definido" checked={hasCameras} />
            
            <h3 className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2 mt-6">Educação</h3>
            <CheckItem label="Objetivos de aprendizagem" checked={hasLearningObjectives} />
            <CheckItem label="Importância clínica" checked={hasClinicalImportance} />
            <CheckItem label="Erros frequentes" checked={hasFrequentErrors} />
            
            <h3 className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2 mt-6">Inteligência de Ensino</h3>
            <CheckItem label="Questões cadastradas (Quiz)" checked={hasQuiz} />
            <CheckItem label="Perguntas sugeridas (Tutor IA)" checked={hasAiTutor} />
            <CheckItem label="Eventos capturados (Analytics)" checked={hasAnalytics} />
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="mb-4 border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-clinicalWhite">Inventário Anatômico Oficial</h2>
            <p className="text-sm text-textMuted mt-1">
              Lista das estruturas catalogadas neste Digital Twin. Marcadores devem mapear diretamente para estas chaves.
            </p>
          </div>

          <div className="flex-grow overflow-y-auto pr-2">
            {model.structures && model.structures.length > 0 ? (
              <ul className="space-y-2">
                {model.structures.map((struct, idx) => (
                  <li key={idx} className="flex items-center gap-3 p-2 bg-white/5 rounded border border-white/5">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-textMuted font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-clinicalWhite">{struct}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center p-8 text-textMuted text-sm">
                Nenhuma estrutura cadastrada neste modelo.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
