import React, { useState, useEffect } from 'react';
import Card from '../../components/Card/Card';
import { atlasAssetStorageService, AssetUploadConstants } from '../../services/atlasAssetStorageService';
import AtlasAssetQAPanel from './components/AtlasAssetQAPanel';
import { validateAssetPublicationGate } from '../../services/atlasPublicationGateService';
import Button from '../../components/Button/Button';

export default function Admin3DModelForm({ model, onChange, user, isSuperAdmin }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideText, setOverrideText] = useState('');
  const [largeFileUploadError, setLargeFileUploadError] = useState(null);
  const [tusProgress, setTusProgress] = useState(0);
  const [tusStatus, setTusStatus] = useState('');
  
  useEffect(() => {
    const handleGlobalDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleGlobalDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('drop', handleGlobalDrop);

    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  if (!model) return null;

  const handleChange = (field, value) => {
    onChange({ ...model, [field]: value });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('Arquivo selecionado');

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['glb', 'gltf', 'obj'].includes(ext)) {
      alert("Extensão inválida. Utilize apenas .glb, .gltf ou .obj.");
      setUploadStatus('Erro no upload');
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > AssetUploadConstants.MAX_CLOUD_ASSET_UPLOAD_MB) {
      setLargeFileUploadError({
        title: 'Limite do Bucket Excedido',
        message: `Arquivo acima do limite atual do Storage. Este GLB possui aproximadamente ${fileSizeMB.toFixed(2)} MB.`,
        instruction: 'Ajuste o Global File Size Limit do Supabase Storage para permitir arquivos acima desse tamanho ou gere uma versão Balanced abaixo do limite atual.'
      });
      setUploadStatus('Arquivo acima do limite');
      return;
    }

    const safeModelId = model.id || model.slug || `temp-${Date.now()}`;

    if (fileSizeMB > AssetUploadConstants.LARGE_ASSET_THRESHOLD_MB) {
      try {
        setIsUploading(true);
        setUploadStatus('Iniciando TUS (Upload Resumível)...');
        setTusStatus('Preparando');
        setTusProgress(0);
        
        await atlasAssetStorageService.uploadLargeAssetWithTus({
          file,
          modelId: safeModelId,
          onProgress: (bytesUploaded, bytesTotal, percentage) => {
            setTusProgress(percentage);
            setTusStatus(`Enviando: ${(bytesUploaded / (1024 * 1024)).toFixed(2)} MB / ${(bytesTotal / (1024 * 1024)).toFixed(2)} MB`);
            setUploadStatus(`Enviando ${percentage}%`);
          },
          onSuccess: (publicUrl, storagePath) => {
            setTusStatus('Concluído');
            const now = new Date().toLocaleString();
            
            const currentManifest = model.modelLodManifest || {};
            const updatedManifest = {
              ...currentManifest,
              source: {
                url: publicUrl,
                source: "storage",
                sizeBytes: file.size,
                format: ext,
                adminOnly: true
              }
            };
            
            onChange({
              ...model,
              atlasAssetFileName: file.name,
              atlasAssetFileType: file.type || `model/${ext}`,
              atlasAssetFileSize: file.size,
              atlasAssetStoragePath: storagePath,
              modelLodManifest: updatedManifest,
              atlasAssetStatus: 'ready',
              modelFormat: ext,
              atlasAssetUploadedAt: now,
            });
            setUploadStatus('Upload TUS concluído');
            setIsUploading(false);
          },
          onError: (err) => {
            throw err;
          }
        });
      } catch (err) {
        setIsUploading(false);
        console.error("[Diagnostic] Falha no upload TUS:", err);
        const errorMessage = err.message || JSON.stringify(err) || "Erro desconhecido";
        setLargeFileUploadError({
          title: 'Falha no Upload TUS',
          message: `Ocorreu um erro no pipeline de upload resumível: ${errorMessage}`,
          instruction: 'Verifique se o bucket está configurado para suportar arquivos grandes no Supabase.'
        });
        setUploadStatus(`Erro TUS: ${errorMessage}`);
      }
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('Enviando para nuvem (Upload Simples)');
      console.log(`[Diagnostic] Iniciando upload simples. Arquivo: ${file.name}, Tamanho: ${fileSizeMB.toFixed(2)}MB, Tipo: ${file.type}`);
      
      const publicUrl = await atlasAssetStorageService.uploadAsset(file, safeModelId);
      console.log(`[Diagnostic] Upload simples concluído. URL: ${publicUrl}`);
      const now = new Date().toLocaleString();

      onChange({
        ...model,
        atlasAssetFileName: file.name,
        atlasAssetFileType: file.type || `model/${ext}`,
        atlasAssetFileSize: file.size,
        atlasAssetObjectUrl: publicUrl, // deprecated
        atlasAssetPublicUrl: publicUrl,
        atlasAssetStoragePath: `models/${safeModelId}/${file.name}`,
        atlasEngineModelUrl: publicUrl,
        model_url: publicUrl,
        atlasAssetStatus: 'ready',
        modelFormat: ext,
        currentViewerType: 'atlas-native',
        viewerType: 'atlas-native',
        viewer_engine: 'atlas-native',
        atlasAssetUploadedAt: now,
      });
      setUploadStatus('Upload concluído');
    } catch (err) {
      console.error("[Diagnostic] Falha no upload simples:", err);
      const errorMessage = err.message || JSON.stringify(err) || "Erro desconhecido";
      setLargeFileUploadError({
        title: 'Erro de Upload (Supabase)',
        message: `A API retornou o seguinte erro: ${errorMessage}`,
        instruction: "Verifique as permissões do bucket 'atlas-model-assets' e os limites de payload."
      });
      setUploadStatus(`Erro no upload: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const gate = validateAssetPublicationGate(model, user, isSuperAdmin);

  const handleForcePublish = () => {
    if (overrideText !== 'PUBLICAR MESMO ASSIM') return;
    onChange({
      ...model,
      status: 'published',
      publication_override: true,
      publication_override_by: user?.email || 'superadmin',
      publication_override_at: new Date().toISOString(),
      publication_override_reason: 'Override manual executado via Atlas Publication Gate'
    });
    setShowOverrideModal(false);
    setOverrideText('');
  };

  return (
    <Card className="flex flex-col gap-5">
      <div className="border-b border-white/10 pb-3 mb-2">
        <h2 className="text-xl font-bold text-clinicalWhite">Dados Principais</h2>
        <p className="text-sm text-textMuted">Informações do modelo anatômico.</p>
      </div>

      {/* ... main fields ... */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-clinicalWhite">Título</label>
        <input 
          type="text" 
          value={model.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="bg-blackDeep border border-white/20 rounded-md px-3 py-2 text-clinicalWhite focus:outline-none focus:border-techTeal transition-colors"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-clinicalWhite">Descrição</label>
        <textarea 
          value={model.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="bg-blackDeep border border-white/20 rounded-md px-3 py-2 text-clinicalWhite focus:outline-none focus:border-techTeal transition-colors min-h-[80px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-clinicalWhite">Sistema Anatômico</label>
          <input 
            type="text" 
            value={model.system || ''}
            onChange={(e) => handleChange('system', e.target.value)}
            className="bg-blackDeep border border-white/20 rounded-md px-3 py-2 text-clinicalWhite focus:outline-none focus:border-techTeal transition-colors"
            placeholder="Ex: Sistema Reprodutor Feminino"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-clinicalWhite">Região Anatômica</label>
          <input 
            type="text" 
            value={model.region || ''}
            onChange={(e) => handleChange('region', e.target.value)}
            className="bg-blackDeep border border-white/20 rounded-md px-3 py-2 text-clinicalWhite focus:outline-none focus:border-techTeal transition-colors"
            placeholder="Ex: Pelve e Períneo"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-clinicalWhite">Nível de Dificuldade</label>
          <select 
            value={model.level || 'Intermediário'}
            onChange={(e) => handleChange('level', e.target.value)}
            className="bg-blackDeep border border-white/20 rounded-md px-3 py-2 text-clinicalWhite focus:outline-none focus:border-techTeal transition-colors"
          >
            <option value="Básico">Básico</option>
            <option value="Intermediário">Intermediário</option>
            <option value="Avançado">Avançado</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-clinicalWhite">Tempo Estimado</label>
          <input 
            type="text" 
            value={model.estimatedStudyTime || ''}
            onChange={(e) => handleChange('estimatedStudyTime', e.target.value)}
            className="bg-blackDeep border border-white/20 rounded-md px-3 py-2 text-clinicalWhite focus:outline-none focus:border-techTeal transition-colors"
            placeholder="Ex: 35 min"
          />
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-4">
        <h3 className="text-lg font-bold text-clinicalWhite mb-4 flex items-center gap-2">
          Motor de Visualização (Viewer Engine)
          <span className="text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded uppercase tracking-wider" title="Configurações em modo readonly local para testes. Requer migration no Supabase para salvar.">
            BLOCKED_FOR_PERSISTENCE_PENDING_CMS_SCHEMA
          </span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white/5 p-4 rounded-lg border border-white/10">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-clinicalWhite">Viewer Engine</label>
            <select 
              value={model.viewerEngine || model.viewerType || model.viewer_engine || 'hybrid'}
              onChange={(e) => handleChange('viewerEngine', e.target.value)}
              className="bg-blackDeep border border-white/20 rounded-md px-3 py-2 text-clinicalWhite focus:outline-none focus:border-techTeal transition-colors"
            >
              <option value="atlas-native">Atlas Native (WebGL)</option>
              <option value="sketchfab">Sketchfab Embed</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-clinicalWhite">Default para Estudante</label>
            <select 
              value={model.defaultViewerEngine || 'atlas-native'}
              onChange={(e) => handleChange('defaultViewerEngine', e.target.value)}
              className="bg-blackDeep border border-white/20 rounded-md px-3 py-2 text-clinicalWhite focus:outline-none focus:border-techTeal transition-colors"
            >
              <option value="atlas-native">Atlas Native</option>
              <option value="sketchfab">Sketchfab</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-semibold text-clinicalWhite">Sketchfab Embed URL (Opcional)</label>
            <input 
              type="text" 
              value={model.embedUrl || model.sketchfabUrl || ''}
              onChange={(e) => handleChange('embedUrl', e.target.value)}
              className={`bg-blackDeep border rounded-md px-3 py-2 text-clinicalWhite focus:outline-none focus:border-techTeal transition-colors ${
                 model.embedUrl && !model.embedUrl.includes('/embed') ? 'border-amber-500' : 'border-white/20'
              }`}
              placeholder="https://sketchfab.com/models/.../embed"
            />
            {model.embedUrl && !model.embedUrl.includes('/embed') && (
               <p className="text-[10px] text-amber-500">Alerta: A URL deve terminar com /embed</p>
            )}
            <p className="text-[10px] text-textMuted">Use apenas URL /embed do Sketchfab.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-clinicalWhite">Engine Status</label>
            <select 
              value={model.engineStatus || 'active'}
              onChange={(e) => handleChange('engineStatus', e.target.value)}
              className="bg-blackDeep border border-white/20 rounded-md px-3 py-2 text-clinicalWhite focus:outline-none focus:border-techTeal transition-colors"
            >
              <option value="active">Active</option>
              <option value="fallback">Fallback</option>
              <option value="experimental">Experimental</option>
              <option value="deprecated">Deprecated</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-clinicalWhite">Native Engine Status</label>
            <div className="bg-blackDeep border border-white/10 rounded-md p-3 text-xs text-textMuted flex flex-col gap-1">
              <div>Manifest: {model.modelLodManifest ? 'Sim' : 'Não'}</div>
              <div>Performance LOD: {model.modelLodManifest?.performance?.url ? 'Sim' : 'Não'}</div>
              <div>Balanced LOD: {model.modelLodManifest?.balanced?.url ? 'Sim' : 'Não'}</div>
              <div>Source/HQ: {model.modelLodManifest?.hq?.url ? 'Sim' : 'Pendente'}</div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 md:col-span-2 pt-2 border-t border-white/10">
            <label className="text-sm font-semibold text-clinicalWhite mb-1">Testes / Preview</label>
            <div className="flex flex-wrap gap-2">
              <a href={`/viewer/${model.slug || model.id}`} target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded text-xs transition-colors">
                Testar Padrão Estudante
              </a>
              <a href={`/viewer/${model.slug || model.id}?engine=sketchfab`} target="_blank" rel="noreferrer" className="bg-techTeal/10 hover:bg-techTeal/20 text-techTeal border border-techTeal/30 px-3 py-1.5 rounded text-xs transition-colors">
                Testar Forçado: Sketchfab
              </a>
              <a href={`/viewer/${model.slug || model.id}?engine=native`} target="_blank" rel="noreferrer" className="bg-selectionGreen/10 hover:bg-selectionGreen/20 text-selectionGreen border border-selectionGreen/30 px-3 py-1.5 rounded text-xs transition-colors">
                Testar Forçado: Native
              </a>
            </div>
          </div>

        </div>
      </div>

      {(model.viewerType || model.viewer_engine) !== 'sketchfab' && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-bold text-clinicalWhite flex items-center gap-2">
                Arquivo 3D do Atlas Native
                {model.atlasAssetStatus === 'ready' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
              </h3>
              <p className="text-sm text-textMuted">Faça o upload definitivo do arquivo para o Supabase Storage.</p>
            </div>
          </div>

          <div className="bg-blackDeep border border-white/10 rounded-lg p-4 flex flex-col gap-3">
            {model.id === 'new' ? (
              <div className="border border-amber-500/30 bg-amber-500/10 rounded-lg p-6 text-center">
                <svg className="w-8 h-8 text-amber-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h4 className="text-amber-500 font-medium mb-1">Salve o modelo primeiro</h4>
                <p className="text-xs text-amber-500/80">
                  Para fazer o upload de um arquivo 3D, você precisa preencher o Título e clicar em "Salvar CMS" no botão superior direito. Isso criará o registro oficial no banco de dados para poder receber arquivos pesados.
                </p>
              </div>
            ) : isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-techTeal border-t-transparent animate-spin"></div>
                <span className="text-sm font-semibold text-clinicalWhite animate-pulse">{uploadStatus}</span>
                {tusStatus && (
                  <div className="flex flex-col items-center gap-1 mt-2 w-full max-w-xs">
                    <span className="text-xs text-slate-400">{tusStatus}</span>
                    <div className="w-full bg-white/10 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div 
                        className="bg-amber-400 h-1.5 transition-all duration-300"
                        style={{ width: `${tusProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ) : model.atlasAssetStatus === 'ready' ? (
              <div className="flex justify-between items-center bg-techTeal/10 border border-techTeal/30 rounded-md p-3">
                <div className="flex flex-col">
                  <span className="font-medium text-clinicalWhite">{model.atlasAssetFileName}</span>
                  <span className="text-xs text-textMuted">
                    {model.atlasAssetFileType} • {(model.atlasAssetFileSize / 1024 / 1024).toFixed(2)} MB • Carregado em {model.atlasAssetUploadedAt}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    onChange({
                      ...model, 
                      atlasAssetStatus: 'missing',
                      atlasAssetObjectUrl: '',
                      atlasAssetFileName: '',
                      atlasAssetFileSize: '',
                      atlasAssetFileType: ''
                    });
                    setUploadStatus('');
                  }}
                  className="text-red-400 text-sm hover:underline"
                >
                  Remover
                </button>
              </div>
            ) : (
              <div 
                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md transition-colors ${isDragActive ? 'border-techTeal bg-techTeal/10' : 'border-white/20 bg-black/30'}`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  accept=".glb,.gltf,.obj" 
                  className="hidden" 
                  id="atlas-asset-upload"
                  onChange={handleFileUpload}
                />
                <label htmlFor="atlas-asset-upload" className="cursor-pointer bg-white/10 hover:bg-white/20 text-clinicalWhite px-4 py-2 rounded transition-colors text-sm font-medium">
                  Selecionar ou arrastar arquivo 3D
                </label>
                <p className="text-xs text-textMuted mt-2">Arquivos grandes exigem limite Supabase compatível e upload resumível/TUS.</p>
                <p className="text-xs text-textMuted mt-1">Formatos suportados: GLB, GLTF, OBJ</p>
                {uploadStatus && uploadStatus !== 'Upload concluído' && (
                  <p className={`text-xs mt-2 font-bold ${uploadStatus.includes('Erro') || uploadStatus.includes('Falha') ? 'text-red-400' : 'text-amber-500'}`}>{uploadStatus}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pipeline de QA para o Arquivo Anexado */}
      <AtlasAssetQAPanel model={model} onChange={onChange} />

      {/* Atlas Publication Gate UI */}
      {(model.viewerType || model.viewer_engine) === 'atlas-native' && model.atlasAssetStatus === 'ready' && (
        <Card className={`flex flex-col gap-4 border ${gate.allowed ? 'border-green-500/30' : 'border-red-500/30'} mt-2 relative overflow-hidden`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-clinicalWhite flex items-center gap-2">
                Atlas Publication Gate
                {gate.allowed || model.publication_override ? (
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                )}
              </h3>
              <p className="text-sm text-textMuted mt-1">
                Controle de publicação técnica para o ambiente educacional.
              </p>
            </div>
            <div className={`px-3 py-1 rounded border text-xs font-bold uppercase tracking-wider ${gate.allowed || model.publication_override ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
              {model.publication_override ? 'FORCED OVERRIDE' : (gate.allowed ? 'LIVRE PARA PUBLICAR' : 'PUBLICACAO BLOQUEADA')}
            </div>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-lg p-4">
            <p className="text-sm text-slate-200 font-medium mb-2">{gate.reason}</p>
            
            {!gate.allowed && !model.publication_override && (
              <div className="flex items-center gap-3 mt-4">
                <Button variant="outline" onClick={() => handleChange('status', 'draft')}>Manter em Rascunho</Button>
                {gate.requiresSuperAdminOverride && (
                  <Button className="bg-red-900/40 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white" onClick={() => setShowOverrideModal(true)}>
                    Forçar Publicação (Super Admin)
                  </Button>
                )}
              </div>
            )}
            {model.publication_override && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded text-amber-500 text-xs">
                Publicação forçada por <b>{model.publication_override_by}</b> em {new Date(model.publication_override_at).toLocaleString()}.<br/>
                Motivo: {model.publication_override_reason}
              </div>
            )}
          </div>
        </Card>
      )}

      {showOverrideModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="max-w-md w-full border-red-500/30 bg-blackDeep">
            <h2 className="text-xl font-bold text-red-400 mb-2">Override de Publicação</h2>
            <p className="text-sm text-textMuted mb-6">
              Este modelo não passou no QA técnico. Publicar mesmo assim pode causar travamentos graves para os alunos.
            </p>
            <div className="mb-6">
              <label className="block text-xs text-textMuted mb-2 uppercase tracking-wider">
                Digite PUBLICAR MESMO ASSIM para forçar
              </label>
              <input 
                type="text" 
                value={overrideText}
                onChange={(e) => setOverrideText(e.target.value)}
                className="w-full bg-black border border-white/10 rounded px-3 py-2 text-clinicalWhite focus:outline-none focus:border-red-500 transition-colors"
                placeholder="PUBLICAR MESMO ASSIM"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setShowOverrideModal(false); setOverrideText(''); }}>Cancelar</Button>
              <Button 
                className={`bg-red-500 text-white px-4 py-2 rounded font-medium transition-colors ${overrideText !== 'PUBLICAR MESMO ASSIM' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'}`}
                onClick={handleForcePublish}
                disabled={overrideText !== 'PUBLICAR MESMO ASSIM'}
              >
                Forçar Publicação
              </Button>
            </div>
          </Card>
        </div>
      )}
      {/* Renderização do Error Modal para Large Files (Glassmorphism Premium) */}
      {largeFileUploadError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setLargeFileUploadError(null)}
          ></div>
          <div className="relative p-6 sm:p-8 max-w-lg w-full flex flex-col gap-4 animate-scale-up atlas-liquid-glass atlas-liquid-glass-modal">
            <div className="atlas-liquid-highlight"></div>
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-clinicalWhite">
                {largeFileUploadError.title}
              </h3>
            </div>
            
            <p className="text-slate-300 text-sm leading-relaxed mt-2">
              {largeFileUploadError.message}
            </p>
            
            <div className="bg-black/50 border border-white/5 rounded-lg p-4 mt-2">
              <p className="text-amber-500 text-xs font-semibold uppercase tracking-widest mb-1">
                Ação Sugerida
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                {largeFileUploadError.instruction}
              </p>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button 
                variant="primary" 
                onClick={() => setLargeFileUploadError(null)}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
              >
                Entendi
              </Button>
            </div>
          </div>
        </div>
      )}

    </Card>
  );
}
