import { supabase } from "../lib/supabase";
import { getUserInstitutionId, normalizeRole, ROLES } from "./permissions/permissionService";
import { isSupabaseConfigured } from "./supabase/supabaseClient";
import { sanitizeText } from "../utils/validators";
import { findLocalModel, mergeCatalogWithLocalModels, normalizeModelIdentifier } from "../data/localModels";

export function getModelOverrides() {
  try {
    const data = localStorage.getItem("atlas_cms_overrides");
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse CMS overrides", e);
  }
  return {};
}

export function saveModelOverride(modelId, overrideData) {
  const overrides = getModelOverrides();
  overrides[modelId] = { ...overrides[modelId], ...overrideData };
  localStorage.setItem("atlas_cms_overrides", JSON.stringify(overrides));
}

function applyOverrides(model) {
  const overrides = getModelOverrides();
  if (overrides[model.id]) {
    const override = overrides[model.id];
    return { 
      ...model, 
      ...override,
      model_url: override.model_url || model.model_url,
      atlasEngineModelUrl: override.atlasEngineModelUrl || model.atlasEngineModelUrl,
      atlasAssetPublicUrl: override.atlasAssetPublicUrl || model.atlasAssetPublicUrl,
      modelFormat: override.modelFormat || model.modelFormat
    };
  }
  return model;
}

const MODEL_SELECT = [
  "id",
  "institution_id",
  "title",
  "slug",
  "anatomical_system",
  "anatomical_region",
  "sketchfab_url",
  "embed_url",
  "difficulty_level",
  "tags",
  "status",
  "thumbnail_url",
  "created_at"
].join(", ");

function activeModelStatus(status) {
  return ["active", "ativo", "available", "disponivel", "disponível"].includes(String(status || "").toLowerCase());
}

function mapDifficultyLevel(level = "") {
  const normalized = String(level || "").toLowerCase();
  if (normalized === "advanced" || normalized === "avancado" || normalized === "avançado") return "Avançado";
  if (normalized === "intermediate" || normalized === "intermediario" || normalized === "intermediário") return "Intermediário";
  if (normalized === "basic" || normalized === "basico" || normalized === "básico") return "Básico";
  return sanitizeText(level) || "Institucional";
}

function normalizeTagArray(tags) {
  if (Array.isArray(tags)) return tags.filter(Boolean);
  if (typeof tags === "string") return tags.split(",").map(item => item.trim()).filter(Boolean);
  return [];
}

export function normalizeSupabaseModel(record = {}) {
  const tags = normalizeTagArray(record.tags);
  const embedUrl = sanitizeText(record.embed_url || record.sketchfab_url);
  const sketchfabUrl = sanitizeText(record.sketchfab_url || record.embed_url);

  return {
    id: record.id || record.slug || "",
    slug: record.slug || record.id || "",
    institutionId: record.institution_id || "",
    institution_id: record.institution_id || "",
    title: sanitizeText(record.title || "Modelo 3D"),
    shortTitle: sanitizeText(record.title || "Modelo 3D"),
    description: sanitizeText(tags[0] || ""),
    category: sanitizeText(record.anatomical_region || "Institucional"),
    region: sanitizeText(record.anatomical_region || "Institucional"),
    system: sanitizeText(record.anatomical_system || "Sistema anatômico"),
    level: mapDifficultyLevel(record.difficulty_level),
    type: "Sketchfab / Escaneamento anatômico",
    viewerType: "sketchfab",
    coverImageUrl: sanitizeText(record.thumbnail_url),
    thumbnailUrl: sanitizeText(record.thumbnail_url),
    sketchfabUrl,
    sketchfabEmbedUrl: embedUrl,
    embedUrl,
    externalUrl: sketchfabUrl,
    estimatedStudyTime: "",
    author: "",
    provider: "Sketchfab",
    status: activeModelStatus(record.status) ? "active" : sanitizeText(record.status || "inactive"),
    isActive: activeModelStatus(record.status),
    accessCount: 0,
    progressPercent: 0,
    overview: sanitizeText(tags[1] || tags[0] || ""),
    reference: "",
    objectives: [],
    structures: [],
    clinicalCorrelations: [],
    studyGuide: [],
    relatedStructures: [],
    references: [],
    createdAt: record.created_at || ""
  };
}

export function mapSupabaseModelToUIModel(record) {
  const asset = record.atlas_model_assets?.[0];
  return {
    id: record.id || record.slug || "",
    slug: record.slug || record.id || "",
    title: sanitizeText(record.title || "Modelo 3D"),
    shortTitle: sanitizeText(record.title || "Modelo 3D"),
    description: sanitizeText(record.description || ""),
    category: sanitizeText(record.anatomical_region || "Institucional"),
    region: sanitizeText(record.anatomical_region || "Institucional"),
    system: sanitizeText(record.anatomical_system || "Sistema anatômico"),
    level: mapDifficultyLevel(record.difficulty_level),
    viewerType: record.viewer_type || "atlas-native",
    modelFormat: asset?.file_format || "glb",
    atlasEngineModelUrl: asset?.asset_url || "",
    model_url: asset?.asset_url || "",
    atlasAssetPublicUrl: asset?.asset_url || "",
    atlasAssetObjectUrl: asset?.asset_url || "",
    atlasAssetFileName: asset?.file_name || "",
    atlasAssetFileSize: asset?.file_size || 0,
    atlasAssetFileType: asset?.file_format ? `model/${asset.file_format}` : "",
    atlasAssetStatus: asset ? 'ready' : undefined,
    atlasAssetUploadedAt: asset?.created_at ? new Date(asset.created_at).toLocaleDateString() : "",
    sketchfabUrl: sanitizeText(record.sketchfab_url),
    status: activeModelStatus(record.status) ? "active" : sanitizeText(record.status || "inactive"),
    isActive: activeModelStatus(record.status),
    estimatedStudyTime: record.estimated_time || "",
    createdAt: record.created_at || "",
    archivedAt: record.archived_at || null,
    deletedAt: record.deleted_at || null
  };
}

async function loadModelsQuery(user, options = {}) {
  const { includeInactive = false, includeDeleted = false } = options;

  if (!isSupabaseConfigured()) {
    console.warn("[models] Supabase não configurado. Catálogo bloqueado por segurança.");
    return [];
  }

  const role = normalizeRole(user?.role, user);
  const institutionId = getUserInstitutionId(user);
  const isSuper = role === ROLES.SUPER_ADMIN;

  console.log("[Admin Models Load Debug] Query Iniciada", { role, isSuper, institutionId, includeInactive, includeDeleted });

  if (!isSuper && !institutionId) {
    console.warn("[models] Consulta bloqueada: institution_id ausente para usuário institucional.");
    return [];
  }

  let queryOld = supabase.from("models_3d").select(MODEL_SELECT);
  let queryNew = supabase.from("atlas_models").select("*, atlas_model_assets(asset_url, file_format, file_name, file_size, created_at)");
  
  if (!includeDeleted) {
    queryNew = queryNew.is("deleted_at", null); // Exclude permanently deleted by default
  }

  if (!isSuper) {
    queryOld = queryOld.eq("institution_id", institutionId);
    // Removed queryNew.eq("institution_id", institutionId) because atlas_models uses institution_availability JSONB
    // queryNew = queryNew.contains("institution_availability", `["${institutionId}"]`); // Optional: If we want strict DB filtering
  }

  const [resOld, resNew] = await Promise.all([
    queryOld.order("created_at", { ascending: false }),
    queryNew.order("created_at", { ascending: false })
  ]);

  if (resOld.error) {
    console.error("[models] Falha ao carregar models_3d.", resOld.error);
    // Defensive fallback: do not throw, allow other sources to load
  }
  if (resNew.error) {
    console.error("[models] Falha ao carregar atlas_models.", resNew.error);
    // Defensive fallback: do not throw, allow other sources to load
  }

  const oldModels = (resOld.data || []).map(normalizeSupabaseModel);
  const newModels = (resNew.data || []).map(mapSupabaseModelToUIModel);

  const allModels = [...newModels, ...oldModels];

  return allModels.filter(model => includeInactive || model.isActive);
}

export async function listModelsForUser(user, options = {}) {
  try {
    const role = normalizeRole(user?.role, user);
    console.log("[Admin Models Load Debug] Iniciando listModelsForUser", { userId: user?.id, email: user?.email, options, role });

    const models = await loadModelsQuery(user, options);
    
    console.log(`[Admin Models Load Debug] Query retornou ${models.length} modelos. Processando locais...`);
    const merged = mergeCatalogWithLocalModels(models, options);
    const finalModels = merged.map(applyOverrides);

    const overrides = getModelOverrides();
    const existingIds = new Set(finalModels.map(m => normalizeModelIdentifier(m.id)));

    for (const [id, modelData] of Object.entries(overrides)) {
      const normalized = normalizeModelIdentifier(id);
      if (!existingIds.has(normalized)) {
        const isActive = modelData.status === 'active' || modelData.status === 'published';
        modelData.isActive = isActive;
        if (options.includeInactive || isActive) {
          finalModels.push({ ...modelData, id, slug: id });
          existingIds.add(normalized);
        }
      }
    }

    console.log(`[Admin Models Load Debug] Finalizado. Retornando ${finalModels.length} modelos finais.`);
    return finalModels;
  } catch (error) {
    console.error("[Admin Models Load Debug] Erro Crítico em listModelsForUser:", error);
    throw error;
  }
}

// --- IDENTIDADE DE MODELO E CACHE ---
const modelIdentityCache = {
  data: new Map(),
  ttlMs: 5 * 60 * 1000, // 5 minutos
  
  get(identifier) {
    const cached = this.data.get(identifier);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.ttlMs) {
      this.data.delete(identifier);
      return null;
    }
    return cached.identity;
  },
  
  set(identifier, identity) {
    this.data.set(identifier, { identity, timestamp: Date.now() });
    // Se resolvemos um slug para UUID, cacheamos também na chave do UUID para busca bidirecional
    if (identity.modelUuid && identifier !== identity.modelUuid) {
      this.data.set(identity.modelUuid, { identity, timestamp: Date.now() });
    }
  },
  
  clear() {
    this.data.clear();
  }
};

export function isValidUuid(value) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function isTemporaryModelId(value) {
  if (!value) return true;
  if (value === 'new' || value.startsWith('new_') || value.startsWith('temp_')) return true;
  return false;
}

/**
 * SINGLE SOURCE OF TRUTH para resolução de identidade de modelo 3D.
 * Recebe qualquer identifier (slug, UUID, temp ID) e retorna um shape padronizado.
 */
export async function resolveModelIdentity(identifier, user = null, options = {}) {
  if (!identifier) {
    return { routeIdentifier: identifier, modelUuid: null, slug: null, source: null, modelRecord: null, isUuidResolved: false, isLegacy: false, isTemporary: true, warnings: ["Identificador vazio"] };
  }

  // 1. Verificar cache
  const cached = modelIdentityCache.get(identifier);
  if (cached && !options.forceRefresh) {
    return cached;
  }

  const identity = {
    routeIdentifier: identifier,
    modelUuid: null,
    slug: null,
    source: null,
    modelRecord: null,
    isUuidResolved: false,
    isLegacy: false,
    isTemporary: false,
    warnings: []
  };

  const normalizedIdentifier = normalizeModelIdentifier(identifier);

  // 2. Verificar se é temporário
  if (isTemporaryModelId(identifier)) {
    identity.isTemporary = true;
    identity.warnings.push("Identificador temporário ou local detectado. Operações no banco de dados serão bloqueadas.");
    return identity;
  }

  const isUuid = isValidUuid(identifier);

  try {
    // 3. Buscar no Supabase (se online)
    if (isSupabaseConfigured()) {
      let query = supabase.from('atlas_models').select('*, atlas_model_assets(asset_url, file_format)');
      
      // OBRIGATÓRIO: separar busca por UUID e busca por Slug
      if (isUuid) {
        query = query.eq('id', identifier);
      } else {
        query = query.eq('slug', normalizedIdentifier);
      }
      
      if (!options.includeInactive) {
        // Se precisar apenas ativos, podemos filtrar, mas getModelById costuma pegar tudo se for dono
      }
      
      const { data, error } = await query.single();
      
      if (!error && data) {
        const mappedModel = mapSupabaseModelToUIModel(data);
        // Força a exibição imediata do modelo obtido individualmente do banco (inclusive Rascunhos/Drafts)
        identity.modelRecord = applyOverrides(mappedModel);
        identity.modelUuid = data.id;
        identity.slug = data.slug;
        identity.source = 'supabase';
        identity.isUuidResolved = true;
        
        if (!isUuid) {
          identity.warnings.push(`Resolvedor invocado por slug (${identifier}). Recomenda-se migrar rota para UUID: ${data.id}`);
        }
        
        modelIdentityCache.set(identifier, identity);
        return identity;
      }
    }

    // 4. Fallback Local (Overrides/Mocked)
    const localFallback = findLocalModel(normalizedIdentifier) || findLocalModel(identifier);
    if (localFallback) {
      identity.modelRecord = applyOverrides(localFallback);
      // Se o ID local for UUID, fechou. Senão, é órfão/legacy.
      if (isValidUuid(localFallback.id)) {
        identity.modelUuid = localFallback.id;
        identity.isUuidResolved = true;
      } else {
        identity.isLegacy = true;
        identity.warnings.push("Modelo legado local carregado sem UUID v4.");
      }
      identity.slug = localFallback.slug || normalizedIdentifier;
      identity.source = 'local';
      
      modelIdentityCache.set(identifier, identity);
      return identity;
    }

    // 5. Fallback Overrides fixos (Legacy/Static)
    const overrides = getModelOverrides();
    if (overrides[normalizedIdentifier] || overrides[identifier]) {
      const modelData = overrides[normalizedIdentifier] || overrides[identifier];
      identity.modelRecord = { ...modelData, id: identifier, slug: normalizedIdentifier };
      identity.slug = normalizedIdentifier;
      identity.source = 'mock';
      identity.isLegacy = true;
      identity.warnings.push("Fallback estático acionado.");
      
      modelIdentityCache.set(identifier, identity);
      return identity;
    }

  } catch (err) {
    console.error("[resolveModelIdentity] Erro:", err);
    identity.warnings.push(`Falha ao resolver identidade: ${err.message}`);
  }

  return identity;
}

/**
 * @deprecated Use resolveModelIdentity(identifier)
 * Esta função foi mantida temporariamente para compatibilidade legada.
 * Ela internamente roteia para o resolveModelIdentity.
 */
export async function getModelByIdForUser(id, user, options = {}) {
  console.warn(`[DEPRECATED] getModelByIdForUser("${id}") chamado. Migre para resolveModelIdentity() ou use o UUID diretamente.`);
  
  const identity = await resolveModelIdentity(id, user, options);
  
  if (identity && identity.modelRecord) {
    const isActive = identity.modelRecord.status === 'active' || identity.modelRecord.status === 'published';
    if (options.includeInactive || isActive) {
      return identity.modelRecord;
    }
  }
  
  return null;
}

export function getModelFilterOptions(models = []) {
  return {
    categories: Array.from(new Set(models.map(model => model.category).filter(Boolean))),
    systems: Array.from(new Set(models.map(model => model.system).filter(Boolean))),
    regions: Array.from(new Set(models.map(model => model.region).filter(Boolean))),
    levels: Array.from(new Set(models.map(model => model.level).filter(Boolean))),
    types: Array.from(new Set(models.map(model => model.type).filter(Boolean)))
  };
}

export async function archiveModel(modelId, user) {
  if (!isSupabaseConfigured()) throw new Error("Supabase não configurado.");
  
  const { error } = await supabase.from('atlas_models')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', modelId);
    
  if (error) throw error;
  
  await supabase.from('atlas_model_audit_logs').insert({
    model_id: modelId,
    user_id: user?.id,
    action: 'ARCHIVE',
    changes: { archived_at: new Date().toISOString() }
  });
  
  return true;
}

export async function restoreModel(modelId, user) {
  if (!isSupabaseConfigured()) throw new Error("Supabase não configurado.");
  
  const { error } = await supabase.from('atlas_models')
    .update({ archived_at: null })
    .eq('id', modelId);
    
  if (error) throw error;
  
  await supabase.from('atlas_model_audit_logs').insert({
    model_id: modelId,
    user_id: user?.id,
    action: 'RESTORE',
    changes: { archived_at: null }
  });
  
  return true;
}

export async function deleteModelPermanently(modelId, user, context = {}) {
  if (!isSupabaseConfigured()) throw new Error("Supabase não configurado.");
  
  const { userEmail, roleEffective, isFounder, canPermanentDelete } = context;
  
  const isAuthorized = 
    canPermanentDelete === true || 
    userEmail === "superadmin@aeternum.com" || 
    roleEffective === "super_admin" || 
    isFounder === true;

  if (!isAuthorized) {
    const { isAeternumSuperAdmin } = await import("./permissions/permissionService");
    if (!isAeternumSuperAdmin(user)) throw new Error("Apenas Super Admin pode excluir permanentemente.");
  }

  if (!isValidUuid(modelId)) {
    throw new Error("UUID inválido fornecido para exclusão permanente.");
  }

  // 1. Tentar obter modelo da tabela nova (atlas_models)
  let tableName = 'atlas_models';
  let { data: model, error: modelError } = await supabase.from('atlas_models').select('title').eq('id', modelId).maybeSingle();
  
  // 2. Se não achou na nova, tenta na antiga (models_3d)
  if (!model && !modelError) {
    const { data: oldModel, error: oldModelError } = await supabase.from('models_3d').select('title').eq('id', modelId).maybeSingle();
    if (oldModelError) throw new Error(`Falha ao buscar modelo legado: ${oldModelError.message}`);
    if (oldModel) {
      model = oldModel;
      tableName = 'models_3d';
    } else {
      throw new Error("Modelo não encontrado no banco de dados.");
    }
  } else if (modelError) {
    throw new Error(`Falha ao buscar modelo: ${modelError.message}`);
  }

  if (tableName === 'atlas_models') {
    // Processo completo de exclusão para o novo schema
    const { data: assets, error: assetsError } = await supabase.from('atlas_model_assets').select('file_path').eq('model_id', modelId);
    if (assetsError) console.warn(`Falha ao buscar metadados de assets: ${assetsError.message}`);

    await supabase.from('atlas_model_audit_logs').insert({
      model_id: modelId,
      user_id: user?.id,
      action: 'permanent_delete_requested',
      changes: { title: model.title }
    });

    const { error: annError } = await supabase.from('atlas_model_annotations').delete().eq('model_id', modelId);
    if (annError) console.warn(`Erro ao deletar anotações: ${annError.message}`);

    const { error: astError } = await supabase.from('atlas_model_assets').delete().eq('model_id', modelId);
    if (astError) console.warn(`Erro ao deletar metadados de assets: ${astError.message}`);

    if (assets && assets.length > 0) {
      const { atlasAssetStorageService } = await import('./atlasAssetStorageService');
      for (const asset of assets) {
        if (asset.file_path) {
          await atlasAssetStorageService.deleteAssetFile(asset.file_path).catch(e => console.warn("Erro ao deletar arquivo:", e));
        }
      }
    }

    const { error: finalModelError } = await supabase.from('atlas_models').delete().eq('id', modelId);
    if (finalModelError) throw new Error(`Erro ao deletar modelo principal: ${finalModelError.message}`);

    await supabase.from('atlas_model_audit_logs').insert({
      model_id: modelId,
      user_id: user?.id,
      action: 'permanent_delete_completed',
      changes: { status: 'deleted' }
    }).catch(() => {});
  } else {
    // Exclusão simplificada para tabela legada
    const { error: finalModelError } = await supabase.from('models_3d').delete().eq('id', modelId);
    if (finalModelError) throw new Error(`Erro ao deletar modelo legado: ${finalModelError.message}`);
  }

  return true;
}
