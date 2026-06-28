import { supabase } from '../lib/supabase';
import { atlasAnnotationCmsService } from './atlasAnnotationCmsService';
import { isValidUuid, isTemporaryModelId } from './modelService';

function requireValidUuid(modelId, operation) {
  if (isTemporaryModelId(modelId)) {
    throw new Error(`[atlasAssetStorageService] Operação negada (${operation}): ID temporário/local detectado '${modelId}'.`);
  }
  if (!isValidUuid(modelId)) {
    throw new Error(`[atlasAssetStorageService] Operação negada (${operation}): ID '${modelId}' não é um UUID v4 válido.`);
  }
}

const BUCKET_NAME = 'atlas-model-assets';

export const AssetUploadConstants = {
  MAX_LOCAL_TEST_UPLOAD_MB: 100,
  MAX_CLOUD_ASSET_UPLOAD_MB: 50, // Limite conservador do bucket padrão (Free Tier Supabase)
  LARGE_ASSET_THRESHOLD_MB: 6    // Arquivos acima de 6MB exigem/recomendam TUS Resumable Upload
};

export const TusUploadState = {
  QUEUED: 'queued',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  READY: 'ready',
  FAILED: 'failed'
};

export const atlasAssetStorageService = {
  
  /**
   * Faz upload de um arquivo 3D real para o Supabase Storage (Legacy / Small files)
   * @param {File} file Arquivo 3D (.glb, .obj, .gltf)
   * @param {string} modelId ID do modelo
   * @returns {Promise<string>} URL pública/assinada do arquivo no Storage
   */
  async uploadAsset(file, modelId) {
    if (!supabase) throw new Error('Supabase cliente não inicializado');
    requireValidUuid(modelId, 'uploadAsset');
    
    // Gerar um nome único
    const fileExt = file.name.split('.').pop();
    const fileName = `${modelId}_${Date.now()}.${fileExt}`;
    const filePath = `models/${modelId}/${fileName}`;

    console.log(`[StorageService] Iniciando upload para bucket '${BUCKET_NAME}' no path '${filePath}'...`);
    console.log(`[StorageService] Detalhes do arquivo: name=${file.name}, type=${file.type}, size=${file.size} bytes`);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, { upsert: true, cacheControl: '3600' });

    if (error) {
      console.error('[StorageService] Erro no upload para o Supabase Storage:', error);
      
      if (error.message?.includes('Bucket not found') || error.message?.includes('The resource was not found')) {
        throw new Error(`Bucket ${BUCKET_NAME} não existe. Execute a migration de Storage no Supabase.`);
      }
      
      throw error; // Repassa o erro detalhado original
    }

    console.log(`[StorageService] Upload físico concluído. Tentando obter URL pública...`);

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      throw new Error("Falha ao gerar URL pública do arquivo no bucket.");
    }

    console.log(`[StorageService] URL gerada: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  },

  /**
   * Salva os metadados do modelo e do asset associado na tabela atlas_models e atlas_model_assets
   */
  async saveModelAndAssetMetadata(modelData, assetData) {
    if (!supabase) return null; // Fallback se não tiver supabase
    try {
      // 1. Salvar na tabela oficial atlas_models
      const payload = {
        title: modelData.title,
        slug: modelData.slug || modelData.id,
        description: modelData.description,
        status: modelData.status || 'draft',
        viewer_type: modelData.viewerType || 'atlas-native',
      };

      const isUUID = isValidUuid(modelData.id);
      if (isUUID) {
        payload.id = modelData.id;
      } else if (!isTemporaryModelId(modelData.id)) {
        // Se tem um ID que não é UUID nem temporário, é um slug usado indevidamente como ID no update
        // We shouldn't allow updating existing models without their UUID
        // mas na criação isso cai no isTemporaryModelId ou o modelo ainda não tem ID
      }

      console.log("[CMS Save] payload sent to atlas_models", payload);

      let savedModel;
      if (isUUID) {
        const { data, error } = await supabase.from('atlas_models').upsert(payload, { onConflict: 'id' }).select().single();
        if (error) throw error;
        savedModel = data;
        
        // Audit log
        supabase.from('atlas_model_audit_logs').insert({
          model_id: data.id,
          action: 'UPDATE',
          changes: payload
        }).then();
      } else {
        // Enforce DB constraints instead of falling back to slug
        const { data, error } = await supabase.from('atlas_models').insert(payload).select().single();
        if (error) {
          if (error.code === '23505') {
            throw new Error(`Conflito de Slug: Já existe um modelo ativo com o slug '${payload.slug}'. Altere o título e tente novamente.`);
          }
          throw error;
        }
        savedModel = data;
        
        // Audit log
        supabase.from('atlas_model_audit_logs').insert({
          model_id: data.id,
          action: 'CREATE',
          changes: payload
        }).then();
      }

      console.log("[CMS Save] saved model returned", savedModel);

      // 2. Se houver assetData, salvar em atlas_model_assets
      if (assetData && assetData.fileUrl) {
        // Remove anterior se existir para evitar lixo (opcional, pode ser upsert tbm se tiver ID)
        await supabase.from('atlas_model_assets').delete().eq('model_id', savedModel.id);

        const { error: assetError } = await supabase
          .from('atlas_model_assets')
          .insert({
            model_id: savedModel.id,
            file_name: assetData.fileName,
            file_path: assetData.filePath,
            file_format: assetData.fileFormat,
            file_size: assetData.fileSize,
            asset_url: assetData.fileUrl,
            status: 'ready'
          });
          
        if (assetError) console.error('Erro ao salvar asset metadata', assetError);
      }

      return savedModel;
    } catch (error) {
      console.error("Erro em saveModelAndAssetMetadata:", error);
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        alert("Tabela atlas_models/atlas_model_assets ausente. Execute migrations.");
      }
      return null;
    }
  },

  /**
   * Sincroniza todas as anotações do localStorage para a nuvem
   */
  async syncAnnotationsToSupabase(modelId) {
    if (!supabase) return { success: false, error: 'Supabase client não configurado.' };
    
    // Puxa as anotações atuais do fallback local
    const localMarkers = atlasAnnotationCmsService.getMarkers(modelId);
    if (!localMarkers || localMarkers.length === 0) return { success: true };

    try {
      requireValidUuid(modelId, 'syncAnnotationsToSupabase');

      // Primeiro apaga os antigos do modelo (se houver upsert massivo) ou faz upsert
      // Para manter seguro, vamos deletar as do modelo atual e re-inserir. 
      // (Em prod o ideal seria upsert unificado)
      const { error: deleteError } = await supabase.from('atlas_model_annotations').delete().eq('model_id', modelId);
      if (deleteError) {
        console.warn("[StorageService] Error deleting previous annotations:", deleteError);
      }

      const toInsert = localMarkers.map(m => {
        // Fallback for camera state
        const camPos = m.camera?.position || m.cameraPosition;
        const camTarget = m.camera?.target || m.target;
        
        return {
          id: String(m.id).startsWith('marker-') ? undefined : m.id,
          model_id: modelId,
          title: m.title || "Novo Marcador",
          description: m.description || "",
          position: m.position,
          camera_position: camPos,
          camera_target: camTarget,
          sort_order: m.order || 0,
          is_active: m.visible !== false,
          metadata: {
            color: m.color,
            anatomicalStructure: m.anatomicalStructure,
            anatomicalSystem: m.anatomicalSystem,
            category: m.category,
            camera: m.camera,
            visible: m.visible !== false
          }
        };
      });

      console.log(`[StorageService] syncAnnotationsToSupabase: preparing to insert ${toInsert.length} markers into atlas_model_annotations for model ${modelId}`, toInsert);

      const { error, data } = await supabase.from('atlas_model_annotations').insert(toInsert).select();
      
      if (error) {
        console.error("[StorageService] Supabase insert error:", error);
        return { success: false, error: error };
      }
      
      // Update local storage to have the real database IDs if they were mock IDs
      if (data && data.length > 0) {
        const formatted = data.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description,
          position: m.position,
          cameraPosition: m.camera_position,
          target: m.camera_target || m.target, // Fallback to older column name just in case
          order: m.sort_order,
          visible: m.is_active,
          color: m.metadata?.color,
          anatomicalStructure: m.metadata?.anatomicalStructure,
          anatomicalSystem: m.metadata?.anatomicalSystem,
          category: m.metadata?.category,
          camera: m.metadata?.camera || m.metadata?.camera_view
        }));
        atlasAnnotationCmsService.saveMarkers(modelId, formatted);
      }
      
      return { success: true };
    } catch (err) {
      console.error("Erro inesperado ao sincronizar anotações com Supabase:", err);
      return { success: false, error: err };
    }
  },

  /**
   * Carrega as anotações da nuvem. Se falhar ou estiver vazio, faz fallback para localStorage
   */
  async loadAnnotations(modelId) {
    if (!supabase) return atlasAnnotationCmsService.getMarkers(modelId);

    // Evita 22P02 invalid input syntax for type uuid no Supabase
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelId);
    if (!isUUID) {
      console.warn(`[StorageService] loadAnnotations chamado com slug ao invés de UUID: ${modelId}. Consultando apenas localmente.`);
      return atlasAnnotationCmsService.getMarkers(modelId);
    }

    try {
      const { data, error } = await supabase
        .from('atlas_model_annotations')
        .select('*')
        .eq('model_id', modelId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Mapeia para o formato de front-end
        const formatted = data.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description,
          position: m.position,
          cameraPosition: m.camera_position,
          target: m.camera_target || m.target, // Try new column, fallback to old
          order: m.sort_order,
          visible: m.is_active,
          color: m.metadata?.color,
          anatomicalStructure: m.metadata?.anatomicalStructure,
          anatomicalSystem: m.metadata?.anatomicalSystem,
          category: m.metadata?.category,
          camera: m.metadata?.camera || m.metadata?.camera_view
        }));
        
        // Atualiza cache local
        atlasAnnotationCmsService.saveMarkers(modelId, formatted);
        return formatted;
      }
    } catch (err) {
      console.error("Erro ao carregar anotações remotas, usando fallback local:", err);
    }

    return atlasAnnotationCmsService.getMarkers(modelId);
  },

  /**
   * Remove um arquivo 3D do Supabase Storage
   * @param {string} filePath Caminho do arquivo no bucket
   */
  async deleteAssetFile(filePath) {
    if (!supabase) return;
    if (!filePath) return;
    
    try {
      const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      if (error) {
        console.warn(`[StorageService] Warning: falha ao deletar objeto ${filePath} no Storage. Isso não impedirá a exclusão dos metadados.`, error);
      } else {
        console.log(`[StorageService] Objeto ${filePath} deletado do bucket ${BUCKET_NAME}.`);
      }
    } catch (err) {
      console.warn(`[StorageService] Exception ao tentar deletar objeto ${filePath}.`, err);
    }
  }
};
