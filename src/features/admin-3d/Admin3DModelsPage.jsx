import React, { useState, useEffect, useMemo } from 'react';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Admin3DModelForm from './Admin3DModelForm';
import Admin3DMarkersEditor from './Admin3DMarkersEditor';
import { listModelsForUser, saveModelOverride, archiveModel, restoreModel, deleteModelPermanently, isValidUuid } from '../../services/modelService';
import { normalizeModelIdentifier } from '../../data/localModels';
import { useAuth } from '../../context/AuthContext';
import { normalizeRole, ROLES, isAeternumSuperAdmin, getEffectiveUserEmail } from '../../services/permissions/permissionService';
import { supabase } from '../../lib/supabase';
import { validateAssetPublicationGate } from '../../services/atlasPublicationGateService';

export default function Admin3DModelsPage({ notify, user: propUser }) {
  const authContext = useAuth();
  const user = propUser || authContext.user;

  useEffect(() => {
    try {
      const data = localStorage.getItem("atlas_cms_overrides");
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed['teste-urso-glb'] || parsed['corte-sagital-encefalo']) {
          delete parsed['teste-urso-glb'];
          delete parsed['corte-sagital-encefalo'];
          localStorage.setItem("atlas_cms_overrides", JSON.stringify(parsed));
          console.log("Cleaned up orphaned local models from cache.");
        }
      }
    } catch (e) {}
  }, []);

  
  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [filter, setFilter] = useState('active'); // active, draft, archived, orphan, duplicated, all
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
    });
  }, []);

  const profileRole = normalizeRole(user?.role, user);
  
  // AÚDITO RIGOROSO DA CAUSA RAIZ (FASE 8.3C.7 - SESSÃO AUTÊNTICA)
  const effectiveEmail = getEffectiveUserEmail(user, null, session);
  const sessionEmail = session?.user?.email || "";
  const userEmail = user?.email || user?.user?.email || "";
  const profileEmail = user?.profile?.email || "";
  
  const roleFromSession = session?.user?.role || "";
  const roleFromProfile = String(user?.role || "").toLowerCase();
  const appRole = String(user?.app_metadata?.role || "").toLowerCase();
  const metadataRole = String(user?.user_metadata?.role || "").toLowerCase();
  
  const isFounder = effectiveEmail === "superadmin@aeternum.com";
  const hasSuperAdminRole = roleFromSession === "super_admin" || roleFromProfile === "super_admin" || appRole === "super_admin" || metadataRole === "super_admin";
  
  let roleEffective = isFounder ? "super_admin" : (profileRole || roleFromSession || "viewer");
  
  // SINGLE SOURCE OF TRUTH (Prioritize session)
  const isSuperAdmin = isFounder || isAeternumSuperAdmin(user, null, session);
  const canDeletePermanently = isSuperAdmin;
  const adminBadgeLabel = isSuperAdmin ? 'SUPER ADMIN (FOUNDER)' : 'ADMIN GLOBAL';

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("[FOUNDER DELETE AUDIT]", {
        sessionEmail,
        profileEmail,
        userEmail,
        effectiveEmail,
        roleFromSession,
        roleFromProfile,
        roleEffective,
        isFounder,
        hasSuperAdminRole,
        isSuperAdmin,
        canPermanentDelete: canDeletePermanently,
        selectedModelId,
      });
    }
  }, [user, session, effectiveEmail, sessionEmail, profileEmail, userEmail, roleFromSession, roleFromProfile, roleEffective, isFounder, hasSuperAdminRole, isSuperAdmin, canDeletePermanently, selectedModelId]);

  const blankModel = {
    id: 'new',
    title: 'Novo Modelo 3D',
    description: '',
    system: '',
    region: '',
    level: 'Intermediário',
    estimatedStudyTime: '',
    viewerType: 'atlas-native',
    modelFormat: 'glb',
    status: 'draft',
    sketchfabUrl: '',
    atlasEngineModelUrl: '',
    markers: []
  };

  const loadData = async () => {
    setLoading(true);
    setErrorState(null);
    
    console.log("[Admin Auth Debug]", {
      userId: user?.id,
      email: user?.email,
      metadataRole: user?.user_metadata?.role,
      appRole: user?.app_metadata?.role,
      detectedRole: roleEffective,
      institutionId: user?.institution_id,
      isSuperAdmin: isSuperAdmin,
      isAdmin: [ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN].includes(roleEffective)
    });

    try {
      const fetchPromise = listModelsForUser(user, { includeInactive: true, includeDeleted: true });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: O carregamento excedeu 10 segundos.')), 10000)
      );
      
      const data = await Promise.race([fetchPromise, timeoutPromise]);
      setModels(data);
    } catch (err) {
      console.error("[Admin3DModelsPage] Erro ao carregar modelos:", err);
      setErrorState({
        message: err.message,
        userId: user?.id,
        email: user?.email,
        role: roleEffective,
        institutionId: user?.institution_id
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Compute duplicate slugs
  const slugCounts = useMemo(() => {
    const counts = {};
    models.forEach(m => {
      if (m.slug && m.id !== 'new') {
        counts[m.slug] = (counts[m.slug] || 0) + 1;
      }
    });
    return counts;
  }, [models]);

  const filteredModels = useMemo(() => {
    return models.filter(m => {
      if (filter === 'all') return true;
      if (filter === 'active') return !m.deletedAt && !m.archivedAt && (m.isActive || m.status === 'published');
      if (filter === 'draft') return !m.deletedAt && !m.archivedAt && (!m.isActive && m.status !== 'published');
      if (filter === 'archived') return m.archivedAt && !m.deletedAt;
      if (filter === 'orphan') return !m.deletedAt && (!m.id || !/^[0-9a-fA-F]{8}-/.test(m.id));
      if (filter === 'duplicated') return !m.deletedAt && slugCounts[m.slug] > 1;
      return true;
    });
  }, [models, filter, slugCounts]);

  const selectedModel = models.find(m => m.id === selectedModelId) || (selectedModelId === 'new' ? blankModel : null);

  const handleModelSelect = (id) => {
    setSelectedModelId(id);
  };

  const handleModelUpdate = (updatedModel) => {
    if (selectedModelId === 'new') {
      const exists = models.find(m => m.id === 'new');
      if (exists) {
        setModels(models.map(m => m.id === 'new' ? updatedModel : m));
      } else {
        setModels([{ ...updatedModel, id: 'new' }, ...models]);
      }
    } else {
      setModels(models.map(m => m.id === updatedModel.id ? updatedModel : m));
    }
  };

  const handleMarkersUpdate = (updatedMarkers) => {
    if (!selectedModel) return;
    handleModelUpdate({ ...selectedModel, markers: updatedMarkers });
  };

  const handleSaveCMS = async () => {
    if (!selectedModel) return;

    let modelToSave = { ...selectedModel };
    
    if (selectedModelId === 'new') {
      if (!modelToSave.title || modelToSave.title === 'Novo Modelo 3D') {
        notify('Dê um título real para salvar o modelo.');
        return;
      }
      modelToSave.slug = normalizeModelIdentifier(modelToSave.title);
      // Remove o ID provisório "new" para que o banco gere um UUID real v4
      delete modelToSave.id;
    }

    // Atlas Publication Gate
    if (modelToSave.status === 'published' || modelToSave.status === 'active') {
      const gate = validateAssetPublicationGate(modelToSave, user, isSuperAdmin);
      if (!gate.allowed && !modelToSave.publication_override) {
        notify(`Bloqueio de Publicação: ${gate.reason || 'O modelo não cumpre os requisitos mínimos do QA.'}`);
        return;
      }
    }

    try {
      const assetData = modelToSave.atlasAssetObjectUrl ? {
        fileName: modelToSave.atlasAssetFileName,
        filePath: `models/${modelToSave.slug || 'temp'}/${modelToSave.atlasAssetFileName}`,
        fileFormat: modelToSave.atlasAssetFileType?.includes('glb') ? 'glb' : (modelToSave.atlasAssetFileType?.includes('obj') ? 'obj' : 'gltf'),
        fileSize: modelToSave.atlasAssetFileSize,
        fileUrl: modelToSave.atlasAssetObjectUrl
      } : null;

      const savedMetadata = await import('../../services/atlasAssetStorageService').then(m => m.atlasAssetStorageService.saveModelAndAssetMetadata(modelToSave, assetData));
      
      if (savedMetadata && savedMetadata.id) {
        notify(`Modelo "${modelToSave.title}" salvo com sucesso no CMS.`);
        if (selectedModelId === 'new') {
          setSelectedModelId(savedMetadata.id);
        }
        loadData();
      } else {
        notify(`Erro ao salvar no banco. Verifique os logs.`);
      }
    } catch (err) {
      console.error(err);
      notify(err.message || `Aviso: Falha ao salvar no banco em nuvem.`);
    }
  };

  const handleCreateNew = () => {
    setSelectedModelId('new');
    const exists = models.find(m => m.id === 'new');
    if (!exists) {
      setModels([blankModel, ...models]);
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleArchive = async () => {
    if (confirm("Deseja mover este modelo para a lixeira (Arquivar)?")) {
      await archiveModel(selectedModelId, user);
      notify("Modelo arquivado com sucesso.");
      setSelectedModelId(null);
      loadData();
    }
  };

  const handleRestore = async () => {
    await restoreModel(selectedModelId, user);
    notify("Modelo restaurado com sucesso.");
    loadData();
  };

  const handleDeletePermanently = async () => {
    if (!selectedModel) return;
    setShowDeleteModal(true);
    setDeleteConfirmationText("");
  };

  const confirmPermanentDelete = async () => {
    if (deleteConfirmationText !== "EXCLUIR") return;
    
    setIsDeleting(true);

    console.log("[PERMANENT DELETE EXECUTION CHECK]", {
      effectiveEmail,
      roleEffective,
      isFounder,
      isSuperAdmin,
      canPermanentDelete: canDeletePermanently,
      selectedModelId: selectedModel?.id,
      selectedModelTitle: selectedModel?.title
    });

    try {
      if (!canDeletePermanently) {
        throw new Error("Apenas Super Admin pode excluir permanentemente.");
      }

      await deleteModelPermanently(selectedModelId, user, {
        userEmail: effectiveEmail,
        roleEffective,
        isFounder,
        canPermanentDelete: canDeletePermanently
      });
      notify("Modelo, assets e marcadores excluídos permanentemente.");
      setSelectedModelId(null);
      setShowDeleteModal(false);
      loadData();
    } catch (err) {
      console.error("[Admin3DModelsPage] Erro ao excluir permanentemente:", err);
      notify(err.message || "Erro crítico ao excluir modelo permanentemente.");
    } finally {
      setIsDeleting(false);
    }
  };



  if (loading) {
    return <div className="p-10 text-center text-textMuted">Carregando acervo de modelos...</div>;
  }

  if (errorState) {
    const diagnostic = JSON.stringify(errorState, null, 2);
    return (
      <div className="flex flex-col gap-6 fade-in-up">
        <div className="admin-section-header">
          <p className="eyebrow">Gestão de Conteúdo Proprietário</p>
          <h1 className="display-title">Modelos 3D</h1>
        </div>
        <Card className="max-w-3xl mx-auto border-red-500/30 bg-red-900/10">
          <h2 className="text-xl font-bold text-red-400 mb-4">Não foi possível carregar o acervo de modelos.</h2>
          <div className="text-sm text-textMuted mb-6 space-y-2">
            <p><strong>Conta atual:</strong> {errorState.email || 'Desconhecida'}</p>
            <p><strong>Role detectada:</strong> {errorState.role || 'Desconhecida'}</p>
            <p><strong>Origem do erro:</strong> {errorState.message}</p>
            <p className="mt-4"><strong>Sugestão de correção:</strong> Verifique sua conexão ou se as permissões (RLS) do Supabase para esta conta estão corretas.</p>
          </div>
          <div className="flex gap-4">
            <Button variant="primary" onClick={loadData}>Tentar novamente</Button>
            <Button variant="secondary" onClick={() => {
              navigator.clipboard.writeText(diagnostic);
              notify("Diagnóstico copiado para a área de transferência.");
            }}>Copiar diagnóstico</Button>
          </div>
        </Card>
      </div>
    );
  }

  const filters = [
    { id: 'active', label: 'Ativos' },
    { id: 'draft', label: 'Rascunhos' },
    { id: 'archived', label: 'Lixeira' },
    { id: 'orphan', label: 'Órfãos' },
    { id: 'duplicated', label: 'Duplicados' },
    { id: 'all', label: 'Todos' }
  ];

  return (
    <div className="flex flex-col gap-6 fade-in-up">
      <div className="admin-section-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <p className="eyebrow m-0">Gestão de Conteúdo Proprietário</p>
            <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-full border ${isFounder ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}>
              {adminBadgeLabel}
            </span>
          </div>
          <h1 className="display-title">Modelos 3D (CMS Governance)</h1>
          <p className="mt-2 max-w-4xl text-textMuted text-sm">
            Interface administrativa unificada para cadastro com governança estrita de banco de dados (UUIDs nativos, Lixeira, Auditoria).
          </p>
        </div>
        <Button variant="teal" onClick={handleCreateNew}>
          + Novo Modelo 3D
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Painel Esquerdo: Lista de Modelos */}
        <Card className="lg:col-span-4 flex flex-col gap-4">
          <div className="border-b border-white/10 pb-3 flex flex-col gap-3">
            <h2 className="text-xl font-bold text-clinicalWhite">Acervo Institucional</h2>
            
            <div className="flex flex-wrap gap-2">
              {filters.map(f => (
                <button 
                  key={f.id} 
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${filter === f.id ? 'bg-techTeal text-black border-techTeal' : 'bg-blackDeep border-white/10 text-textMuted hover:text-white'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto">
            {filteredModels.length === 0 && (
              <p className="text-center text-textMuted py-4 text-sm">Nenhum modelo encontrado para o filtro atual.</p>
            )}
            {filteredModels.map(model => {
              const isOrphan = !model.deletedAt && (!model.id || !/^[0-9a-fA-F]{8}-/.test(model.id));
              const isDuplicated = !model.deletedAt && slugCounts[model.slug] > 1;

              return (
              <button 
                key={model.id}
                onClick={() => handleModelSelect(model.id)}
                className={`text-left p-3 rounded-lg border transition-colors relative ${
                  selectedModelId === model.id 
                    ? 'border-techTeal bg-techTeal/10' 
                    : 'border-white/10 hover:border-white/30 bg-blackDeep/50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-clinicalWhite truncate pr-2">{model.title}</span>
                  <span className={`whitespace-nowrap text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    model.archivedAt ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    (model.isActive || model.status === 'published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30')
                  }`}>
                    {model.archivedAt ? 'Lixeira' : (model.isActive || model.status === 'published' ? 'active' : model.status)}
                  </span>
                </div>
                <div className="text-xs text-textMuted flex items-center gap-2 mb-2">
                  <span className="uppercase tracking-wider">{model.modelFormat || model.model_format || 'sketchfab'}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20"></span>
                  <span>{model.viewerType || model.viewer_engine || 'sketchfab'}</span>
                </div>
                
                {/* Governance Alerts */}
                <div className="flex gap-2 flex-wrap">
                  {isOrphan && <span className="bg-red-500/10 text-red-400 text-[10px] px-2 py-0.5 rounded border border-red-500/20">Sem UUID (Órfão)</span>}
                  {isDuplicated && <span className="bg-orange-500/10 text-orange-400 text-[10px] px-2 py-0.5 rounded border border-orange-500/20">Slug Duplicado</span>}
                </div>
              </button>
            )})}
          </div>
        </Card>

        {/* Painel Direito: Formulários e Edição */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {!selectedModel ? (
            <Card className="flex flex-col items-center justify-center py-20 text-center border-dashed border-2 border-white/10">
              <svg className="w-16 h-16 text-white/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
              <h3 className="text-xl font-medium text-clinicalWhite mb-2">Nenhum modelo selecionado</h3>
              <p className="text-textMuted max-w-sm">Selecione um modelo da lista ao lado para gerenciar.</p>
            </Card>
          ) : (
            <>
              {/* Painel de Ações de Governança */}
              {selectedModelId !== 'new' && (
                <Card className="flex justify-between items-center bg-blackDeep border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-clinicalWhite">Governança:</span>
                    <span className="text-xs text-textMuted font-mono bg-black px-2 py-1 rounded">UUID: {selectedModel.id}</span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      {!selectedModel.archivedAt && (
                        <Button variant="outline" onClick={handleArchive}>Mover para Lixeira</Button>
                      )}
                      {selectedModel.archivedAt && (
                        <Button variant="outline" onClick={handleRestore}>Restaurar Modelo</Button>
                      )}
                      {canDeletePermanently && (
                        <Button className="bg-red-900/40 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white text-xs px-3 py-1.5 rounded" onClick={handleDeletePermanently}>Excluir Permanente</Button>
                      )}
                    </div>
                    {process.env.NODE_ENV === 'development' && (
                      <div className="text-[10px] text-left border border-white/10 bg-black p-2 mt-2 font-mono text-textMuted rounded max-w-sm">
                        <div className="text-white font-bold mb-1 border-b border-white/10 pb-1">DEBUG SUPERADMIN:</div>
                        <div>sessionEmail: {sessionEmail}</div>
                        <div>profileEmail: {profileEmail}</div>
                        <div>userEmail: {userEmail}</div>
                        <div>effectiveEmail: {effectiveEmail}</div>
                        <div>roleFromSession: {roleFromSession}</div>
                        <div>roleFromProfile: {roleFromProfile}</div>
                        <div>roleEffective: {roleEffective}</div>
                        <div>isFounder: {String(isFounder)}</div>
                        <div>hasSuperAdminRole: {String(hasSuperAdminRole)}</div>
                        <div>isSuperAdmin: {String(isSuperAdmin)}</div>
                        <div>canPermanentDelete: {String(canDeletePermanently)}</div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              <Admin3DModelForm 
                model={selectedModel} 
                onChange={handleModelUpdate} 
                disabled={!!selectedModel.archivedAt} 
                user={user} 
                isSuperAdmin={isSuperAdmin} 
              />
              
              {(!selectedModel.viewerType || selectedModel.viewerType === 'sketchfab' || selectedModel.viewer_engine === 'sketchfab') ? (
                <Admin3DMarkersEditor markers={selectedModel.markers || []} onChange={handleMarkersUpdate} />
              ) : (
                <Card className="flex flex-col items-center justify-center py-10 border-dashed border border-white/10 bg-blackDeep">
                  <h3 className="text-lg font-bold text-clinicalWhite mb-2">Editor Visual 3D (Atlas Native)</h3>
                  <p className="text-sm text-textMuted text-center max-w-md mb-6">O Atlas Engine possui um editor interativo de malha que permite clicar no modelo 3D para posicionar marcadores e salvar ângulos de câmera.</p>
                  
                  {(!selectedModel.id || !/^[0-9a-fA-F]{8}-/.test(selectedModel.id)) ? (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-4 py-3 rounded text-sm text-center">
                      Este modelo ainda não foi salvo no CMS com um UUID real.<br/>Salve antes de abrir o Editor 3D.
                    </div>
                  ) : (
                    <Button variant="teal" onClick={() => {
                      window.location.href = `/super-admin/models-3d/${selectedModel.id}/editor`;
                    }}>
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      Abrir Editor 3D
                    </Button>
                  )}
                </Card>
              )}
              
              <Card className="flex flex-col sm:flex-row justify-end items-center bg-blackDeep mt-2 gap-4">
                <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
                  {!selectedModel.archivedAt && (
                    <>
                      <Button variant="outline" onClick={() => {
                        window.location.href = `/viewer/${selectedModel.slug || selectedModel.id}`;
                      }}>
                        Visualizar Aluno
                      </Button>
                      <Button variant="teal" onClick={handleSaveCMS}>
                        Salvar no CMS
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Modal de Exclusão Permanente */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="max-w-md w-full border-red-500/30 bg-blackDeep">
            <h2 className="text-xl font-bold text-red-400 mb-2">Exclusão Permanente</h2>
            <p className="text-sm text-textMuted mb-6">
              Esta ação é irreversível. O modelo, seus assets associados e todos os marcadores vinculados serão removidos permanentemente.
            </p>
            
            {!isFounder ? (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-4 py-3 rounded text-sm mb-6">
                Apenas o Super Admin fundador pode excluir permanentemente.
              </div>
            ) : !isValidUuid(selectedModelId) ? (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded text-sm mb-6">
                <strong>Modelo Nativo Protegido:</strong> Este é um modelo fixo do sistema (local slug: {selectedModelId}) e não pode ser excluído permanentemente do banco de dados na nuvem.
              </div>
            ) : (
              <>
                {!selectedModel?.archivedAt && (
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-4 py-3 rounded text-sm mb-6">
                    Este modelo ainda está ativo. Recomenda-se mover para a lixeira antes da exclusão permanente.
                  </div>
                )}
                <div className="mb-6">
                  <label className="block text-xs text-textMuted mb-2 uppercase tracking-wider">
                    Digite EXCLUIR para confirmar
                  </label>
                  <input 
                    type="text" 
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-3 py-2 text-clinicalWhite focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="EXCLUIR"
                  />
                </div>
              </>
            )}
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Cancelar</Button>
              {isFounder && isValidUuid(selectedModelId) && (
                <Button 
                  className={`bg-red-500 text-white px-4 py-2 rounded font-medium transition-colors ${deleteConfirmationText !== 'EXCLUIR' || isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'}`}
                  onClick={confirmPermanentDelete}
                  disabled={deleteConfirmationText !== 'EXCLUIR' || isDeleting}
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir Permanentemente'}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
