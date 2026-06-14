import { getModelByIdForUser, listModelsForUser } from "../modelService";
import { canAccessModel, createTenantScope, getUserInstitutionId, normalizeRole, ROLES } from "../permissions/permissionService";
import { trackEvent } from "../analytics/analyticsService";

export async function listInstitutionModels(user) {
  return listModelsForUser(user);
}

export async function getAccessibleModels(user) {
  const models = await listModelsForUser(user);
  return models.filter(model => canAccessModel(user, model));
}

export async function getModelBySlugOrId(modelIdOrSlug, user) {
  return getModelByIdForUser(modelIdOrSlug, user);
}

export async function canUserOpenModel(user, modelIdOrSlug) {
  const model = typeof modelIdOrSlug === "string" ? await getModelBySlugOrId(modelIdOrSlug, user) : modelIdOrSlug;
  return canAccessModel(user, model);
}

export async function recordModelAccess(user, modelIdOrSlug, metadata = {}) {
  const model = await getModelBySlugOrId(modelIdOrSlug, user);
  const modelInstitutionId = model?.institutionId || model?.institution_id || null;
  const tenant = createTenantScope(user, modelInstitutionId);

  if (!tenant.userId || !tenant.institutionId || !model?.id) {
    console.warn("[model-access] Registro bloqueado: usuário, modelo ou institution_id ausente.", {
      userId: tenant.userId,
      role: tenant.role,
      institutionId: tenant.institutionId,
      modelId: model?.id || modelIdOrSlug
    });
    return null;
  }

  return trackEvent({
    userId: tenant.userId,
    institutionId: tenant.institutionId,
    role: tenant.role,
    modelId: model?.id || modelIdOrSlug,
    eventType: "open_model_viewer",
    metadata
  });
}

export async function getModelAccessContext(user, modelIdOrSlug) {
  const model = await getModelBySlugOrId(modelIdOrSlug, user);
  return {
    model,
    canOpen: canAccessModel(user, model),
    tenant: createTenantScope(user, model?.institutionId || model?.institution_id || null)
  };
}
