import React, { useState, useEffect } from 'react';
import Card from '../../../components/Card/Card';
import LineIcon from '../../../components/icons/LineIcon';

export default function AtlasAssetQAPanel({ model, onChange }) {
  const [isRunning, setIsRunning] = useState(false);
  
  // O QA só faz sentido se tivermos um asset no Atlas Native (WebGL)
  const isAtlasNative = (model.viewerType || model.viewer_engine) === 'atlas-native';
  const hasAsset = model.atlasAssetStatus === 'ready' && !!model.atlasAssetObjectUrl;
  
  if (!isAtlasNative || !hasAsset) {
    return null; // Esconde se não for aplicável
  }

  const report = model.qaReport || { status: 'not_checked' };

  const handleRunQA = async () => {
    setIsRunning(true);
    
    // Simula a injeção na engine WebGL para parsing (na FASE 8.4K isso usará a engine real oculta)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const sizeMb = model.atlasAssetFileSize ? (model.atlasAssetFileSize / 1024 / 1024) : 0;
    const format = (model.modelFormat || model.model_format || 'glb').toLowerCase();
    
    let status = 'approved';
    let score = 100;
    let warnings = [];
    let errors = [];
    
    // Validação de formato (OBJ vs GLB)
    if (format === 'obj') {
      status = 'needs_optimization';
      score -= 50;
      warnings.push('Formato OBJ bruto detectado. Ele não carrega texturas comprimidas nativamente.');
      warnings.push('OBJ é aceito administrativamente, mas recomenda-se conversão para GLB para uso do Aluno.');
    } else if (format !== 'glb' && format !== 'gltf') {
      status = 'rejected';
      score -= 100;
      errors.push(`Formato ${format} não é suportado pelo motor.`);
    }

    // Validação de Tamanho (MB)
    if (sizeMb > 500) {
      status = 'needs_optimization'; // Bloqueio forte visual
      score -= 40;
      errors.push(`Tamanho do arquivo extremo (${sizeMb.toFixed(1)}MB) > 500MB.`);
      warnings.push('Pode causar travamento no navegador de celulares e notebooks de entrada.');
    } else if (sizeMb > 200) {
      status = status === 'rejected' ? 'rejected' : 'needs_optimization';
      score -= 20;
      warnings.push(`Tamanho do arquivo alto (${sizeMb.toFixed(1)}MB). Requer otimização rigorosa no Blender (Draco/Meshopt).`);
    } else if (sizeMb > 50) {
      if (status !== 'rejected' && status !== 'needs_optimization') {
        status = 'pending_review';
      }
      score -= 10;
      warnings.push(`Tamanho aceitável (${sizeMb.toFixed(1)}MB), mas passível de otimização para < 50MB.`);
    } else if (sizeMb === 0) {
      warnings.push('Tamanho não calculado pelo Storage. Verifique se o upload concluiu corretamente.');
    }

    score = Math.max(0, score);
    
    let recommendation = 'Aprovado para uso educacional.';
    if (status === 'rejected') recommendation = 'Bloqueado. Impossível carregar na engine atual.';
    if (status === 'needs_optimization') recommendation = 'Otimização requerida. Não publicar para alunos até converter/reduzir o peso.';
    if (status === 'pending_review') recommendation = 'Aceitável. Verifique visualmente se a texturização e o carregamento não travam sua GPU.';

    const newReport = {
      status,
      score,
      warnings,
      errors,
      recommendation,
      fileSizeMb: sizeMb,
      fileFormat: format,
      lastChecked: new Date().toLocaleString()
    };

    onChange({
      ...model,
      qaReport: newReport
    });

    setIsRunning(false);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'pending_review': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'needs_optimization': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'rejected': return 'text-red-400 border-red-500/30 bg-red-500/10';
      default: return 'text-slate-400 border-white/10 bg-blackDeep';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'approved': return 'Aprovado';
      case 'pending_review': return 'Revisão Recomendada';
      case 'needs_optimization': return 'Otimização Necessária';
      case 'rejected': return 'Rejeitado / Falha';
      default: return 'Não Avaliado';
    }
  };

  return (
    <Card className="flex flex-col gap-4 border-techTeal/20 relative overflow-hidden mt-6">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-techTeal/50 to-blue-500/50"></div>
      
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-clinicalWhite flex items-center gap-2">
            <LineIcon name="check-circle" className="w-5 h-5 text-techTeal" />
            QA Pipeline: Validação de Asset 3D
          </h3>
          <p className="text-sm text-textMuted mt-1">
            Analisa o peso, geometria e textura antes da publicação para evitar travamentos nos alunos.
          </p>
        </div>
        
        <div className={`px-3 py-1 rounded border text-xs font-bold uppercase tracking-wider ${getStatusColor(report.status)}`}>
          {getStatusLabel(report.status)}
        </div>
      </div>

      <div className="bg-black/30 border border-white/5 rounded-lg p-4">
        {report.status === 'not_checked' ? (
          <div className="text-center py-6">
            <p className="text-slate-400 text-sm mb-4">Este arquivo ainda não foi submetido ao crivo técnico do motor 3D.</p>
            <button 
              onClick={handleRunQA}
              disabled={isRunning}
              className="bg-techTeal text-black font-bold px-6 py-2 rounded shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:bg-teal-400 transition-colors disabled:opacity-50"
            >
              {isRunning ? 'Analisando Asset...' : 'Executar Diagnóstico QA'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blackDeep p-3 rounded border border-white/5">
                <span className="text-xs text-slate-500 block">Score Técnico</span>
                <span className={`text-xl font-bold ${report.score >= 80 ? 'text-green-400' : report.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {report.score}/100
                </span>
              </div>
              <div className="bg-blackDeep p-3 rounded border border-white/5">
                <span className="text-xs text-slate-500 block">Tamanho</span>
                <span className="text-xl font-bold text-slate-200">
                  {report.fileSizeMb?.toFixed(1)} MB
                </span>
              </div>
              <div className="bg-blackDeep p-3 rounded border border-white/5">
                <span className="text-xs text-slate-500 block">Formato</span>
                <span className="text-xl font-bold text-slate-200 uppercase">
                  {report.fileFormat}
                </span>
              </div>
              <div className="bg-blackDeep p-3 rounded border border-white/5 flex flex-col justify-center">
                <button onClick={handleRunQA} disabled={isRunning} className="text-techTeal text-xs font-bold hover:underline">
                  {isRunning ? 'Re-analisando...' : 'Re-executar QA'}
                </button>
              </div>
            </div>

            {report.errors?.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                <h4 className="text-red-400 text-xs font-bold uppercase mb-2">Erros Críticos</h4>
                <ul className="text-sm text-red-200 space-y-1 list-disc pl-4">
                  {report.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            {report.warnings?.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3">
                <h4 className="text-amber-500 text-xs font-bold uppercase mb-2">Alertas e Otimização</h4>
                <ul className="text-sm text-amber-200/80 space-y-1 list-disc pl-4">
                  {report.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 mt-2">
              <h4 className="text-blue-400 text-xs font-bold uppercase mb-1">Recomendação Final</h4>
              <p className="text-sm text-blue-200">{report.recommendation}</p>
            </div>
          </div>
        )}
      </div>

    </Card>
  );
}
