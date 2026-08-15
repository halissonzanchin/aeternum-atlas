import { supabase } from "../lib/supabase";
import { getUserInstitutionId, normalizeRole, ROLES } from "./permissions/permissionService";
import { isSupabaseConfigured } from "./supabase/supabaseClient";
import { sanitizeText } from "../utils/validators";
import { findLocalModel, mergeCatalogWithLocalModels, normalizeModelIdentifier } from "../data/localModels";

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
  return ["active", "ativo", "available", "disponivel", "disponível", "published", "publicado"].includes(String(status || "").toLowerCase());
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
  const localModel = findLocalModel(record.slug) || findLocalModel(record.id);
  const embedUrl = sanitizeText(record.embed_url || record.sketchfab_url);
  const sketchfabUrl = sanitizeText(record.sketchfab_url || record.embed_url);

  return normalizeViewerModelAsset({
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
    type: "MODELO 3D INTERATIVO",
    viewerType: "sketchfab",
    coverImageUrl: sanitizeText(record.thumbnail_url),
    thumbnailUrl: sanitizeText(record.thumbnail_url),
    sketchfabUrl,
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
    createdAt: record.created_at || "",
    catalogSource: "supabase",
    embedUrl: embedUrl || localModel?.embedUrl || localModel?.sketchfabEmbedUrl || "",
    sketchfabEmbedUrl: embedUrl || localModel?.sketchfabEmbedUrl || localModel?.embedUrl || ""
  });
}

export function normalizeViewerModelAsset(model) {
  return {
    ...model,
    provider: "sketchfab",
    viewerType: "sketchfab",
    viewer_type: "sketchfab",
    viewerEngine: "sketchfab",
    viewer_engine: "sketchfab",
    defaultViewerEngine: "sketchfab",
    embedProvider: "sketchfab"
  };
}

export function mapSupabaseModelToUIModel(record) {
  const localModel = findLocalModel(record.slug) || findLocalModel(record.id);
  
  const uiModel = normalizeViewerModelAsset({
    id: record.id || record.slug || "",
    slug: record.slug || record.id || "",
    title: sanitizeText(record.title || "Modelo 3D"),
    shortTitle: sanitizeText(record.title || "Modelo 3D"),
    description: sanitizeText(record.description || ""),
    category: sanitizeText(record.anatomical_region || "Institucional"),
    region: sanitizeText(record.anatomical_region || "Institucional"),
    system: sanitizeText(record.anatomical_system || "Sistema anatômico"),
    level: mapDifficultyLevel(record.difficulty_level),
    viewerType: "sketchfab",
    sketchfabUrl: sanitizeText(record.sketchfab_url || localModel?.sketchfabUrl),
    sketchfabEmbedUrl: sanitizeText(record.embed_url || localModel?.sketchfabEmbedUrl || localModel?.embedUrl),
    embedUrl: sanitizeText(record.embed_url || localModel?.embedUrl || localModel?.sketchfabEmbedUrl),
    status: activeModelStatus(record.status) ? "active" : sanitizeText(record.status || "inactive"),
    isActive: activeModelStatus(record.status),
    estimatedStudyTime: record.estimated_time || "",
    createdAt: record.created_at || "",
    archivedAt: record.archived_at || null,
    deletedAt: record.deleted_at || null,
    catalogSource: "supabase"
  });

  if (localModel && (localModel.slug === 'corte-sagital-cranio-humano-superficial' || localModel.id === 'corte-sagital-cranio-humano-superficial')) {
    return {
      ...uiModel,
      viewerType: localModel.viewerType || uiModel.viewerType,
      viewerEngine: localModel.viewerEngine,
      defaultViewerEngine: localModel.defaultViewerEngine,
      embedProvider: localModel.embedProvider,
      embedUrl: localModel.embedUrl,
      externalViewerLabel: localModel.externalViewerLabel,
      sketchfabUrl: localModel.sketchfabUrl || uiModel.sketchfabUrl,
      sketchfabEmbedUrl: localModel.sketchfabEmbedUrl || uiModel.sketchfabEmbedUrl
    };
  }

  return uiModel;
}

// Regras de visibilidade exclusivas para a tabela moderna (atlas_models)
function applyAtlasModelVisibilityRules(query, user, options = {}) {
  const { includeInactive = false } = options;
  const role = normalizeRole(user?.role, user);
  
  const isSuper = role === ROLES.SUPER_ADMIN || role === ROLES.FOUNDER || role === "super_admin";
  const isAdmin = role === ROLES.ADMIN || role === ROLES.INSTITUTION_ADMIN || role === "admin" || role === "institution_admin";
  const isTeacher = role === ROLES.TEACHER || role === "teacher";

  if (isSuper) {
    return query;
  }

  // Alunos e professores regulares só veem publicados, admins institucionais também podem ver archived (via CMS includeInactive)
  // Nota: A segurança real é garantida pelo banco de dados (RLS). Isso é apenas restrição de listagem de UI.
  if (!isSuper && !isAdmin && !isTeacher) {
    query = query.eq("status", "published");
  } else if (!includeInactive && !isSuper) {
    query = query.neq("status", "archived");
  }

  // institution_availability check é garantido via banco de dados JSONB, 
  // no client-side a listagem já virá filtrada pela RLS.

  return query;
}

// Regras de visibilidade exclusivas para a tabela legada (models_3d)
function applyLegacyModelVisibilityRules(query, user, options = {}) {
  const { includeInactive = false, skipInstitutionFilter = false } = options;
  const role = normalizeRole(user?.role, user);
  const institutionId = getUserInstitutionId(user);
  
  const isSuper = role === ROLES.SUPER_ADMIN || role === ROLES.FOUNDER || role === "super_admin";
  const isAdmin = role === ROLES.ADMIN || role === ROLES.INSTITUTION_ADMIN || role === "admin" || role === "institution_admin";
  const isTeacher = role === ROLES.TEACHER || role === "teacher";

  if (isSuper) {
    return query;
  }

  if (!skipInstitutionFilter && institutionId) {
    query = query.eq("institution_id", institutionId);
  }
  
  if (!includeInactive) {
    query = query.in("status", ["active", "ativo", "available", "disponivel", "published"]);
  }

  if (!isSuper && !isAdmin && !isTeacher) {
    query = query.in("status", ["active", "ativo", "available", "disponivel", "published"]);
  }

  return query;
}

async function loadModelsQuery(user, options = {}) {
  const { includeInactive = false } = options;

  if (!isSupabaseConfigured()) {
    console.warn("[models] Supabase não configurado. Catálogo bloqueado por segurança.");
    return [];
  }

  const role = normalizeRole(user?.role, user);
  const institutionId = getUserInstitutionId(user);
  const isSuper = role === ROLES.SUPER_ADMIN;

  if (!isSuper && !institutionId) {
    console.warn("[models] Consulta bloqueada: institution_id ausente para usuário institucional.");
    return [];
  }

  let queryOld = supabase.from("models_3d").select(MODEL_SELECT);
  let queryNew = supabase.from("atlas_models").select("*");
  
  queryOld = applyLegacyModelVisibilityRules(queryOld, user, options);
  queryNew = applyAtlasModelVisibilityRules(queryNew, user, options);

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
  const mergedModels = mergeCatalogWithLocalModels(allModels, options);

  return mergedModels.filter(model => includeInactive || model.isActive);
}

export async function listModelsForUser(user, options = {}) {
  try {
    return await loadModelsQuery(user, options);
  } catch (error) {
    console.error("[models] Falha crítica ao consolidar o catálogo:", error);
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
      let query = supabase.from('atlas_models').select('*');
      
      // OBRIGATÓRIO: separar busca por UUID e busca por Slug
      if (isUuid) {
        query = query.eq('id', identifier);
      } else {
        query = query.eq('slug', normalizedIdentifier);
      }
      
      // Filtrar com regra global de visibilidade
      query = applyAtlasModelVisibilityRules(query, user, options);
      
      const { data, error } = await query.maybeSingle();
      
      if (data) {
        const mappedModel = mapSupabaseModelToUIModel(data);
        // Força a exibição imediata do modelo obtido individualmente do banco (inclusive Rascunhos/Drafts se autorizado)
        identity.modelRecord = mappedModel;
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
      
      // Fallback: search in legacy models_3d table
      let queryOld = supabase.from('models_3d').select('*');
      if (isUuid) {
        queryOld = queryOld.eq('id', identifier);
      } else {
        queryOld = queryOld.eq('slug', normalizedIdentifier);
      }
      
      // Filtrar a tabela legada com a mesma regra de visibilidade
      queryOld = applyLegacyModelVisibilityRules(queryOld, user, options);
      
      const { data: dataOld } = await queryOld.maybeSingle();
      if (dataOld) {
        const mappedModelOld = normalizeSupabaseModel(dataOld);
        identity.modelRecord = mappedModelOld;
        identity.modelUuid = dataOld.id;
        identity.slug = dataOld.slug;
        identity.source = 'supabase_legacy';
        identity.isUuidResolved = true;
        identity.isLegacy = true;
        
        modelIdentityCache.set(identifier, identity);
        return identity;
      }
    }

    // 4. Fallback para Catálogo Local de Referência (garante que modelos como o Reprodutor Feminino abram 100% das vezes)
    const localModel = findLocalModel(identifier) || findLocalModel(normalizedIdentifier);
    if (localModel) {
      const mappedLocal = normalizeViewerModelAsset({
        ...localModel,
        catalogSource: "local_reference"
      });
      identity.modelRecord = mappedLocal;
      identity.modelUuid = localModel.id || localModel.slug;
      identity.slug = localModel.slug || localModel.id;
      identity.source = "local_reference";
      identity.isUuidResolved = false;

      modelIdentityCache.set(identifier, identity);
      return identity;
    }

    identity.warnings.push("Modelo não encontrado no catálogo autorizado do Supabase nem no catálogo local.");

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
    .update({ status: 'archived' })
    .eq('id', modelId);
    
  if (error) throw error;
  
  await supabase.from('atlas_model_audit_logs').insert({
    model_id: modelId,
    user_id: user?.id,
    action: 'ARCHIVE',
    changes: { status: 'archived' }
  });
  
  return true;
}

export async function restoreModel(modelId, user) {
  if (!isSupabaseConfigured()) throw new Error("Supabase não configurado.");
  
  const { error } = await supabase.from('atlas_models')
    .update({ status: 'published' })
    .eq('id', modelId);
    
  if (error) throw error;
  
  await supabase.from('atlas_model_audit_logs').insert({
    model_id: modelId,
    user_id: user?.id,
    action: 'RESTORE',
    changes: { status: 'published' }
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
