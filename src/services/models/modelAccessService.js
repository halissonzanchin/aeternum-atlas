import { getModelById, getModels } from "../modelService";
import { canAccessModel, createTenantScope } from "../permissions/permissionService";
import { trackEvent } from "../analytics/analyticsService";

export function listInstitutionModels(userOrInstitutionId = "upe-presidente-franco") {
  const institutionId = typeof userOrInstitutionId === "string" ? userOrInstitutionId : userOrInstitutionId?.institutionId;
  return getModels().filter(model => !model.institutionId || model.institutionId === institutionId || institutionId === "aeternum-atlas");
}

export function getAccessibleModels(user) {
  return getModels().filter(model => canAccessModel(user, model));
}

export function getModelBySlugOrId(modelIdOrSlug) {
  return getModelById(modelIdOrSlug) || getModels().find(model => model.slug === modelIdOrSlug) || null;
}

export function canUserOpenModel(user, modelIdOrSlug) {
  const model = typeof modelIdOrSlug === "string" ? getModelBySlugOrId(modelIdOrSlug) : modelIdOrSlug;
  return canAccessModel(user, model);
}

export function recordModelAccess(user, modelIdOrSlug, metadata = {}) {
  const model = getModelBySlugOrId(modelIdOrSlug);
  const tenant = createTenantScope(user, model?.institutionId || user?.institutionId);

  return trackEvent({
    userId: tenant.userId,
    institutionId: tenant.institutionId,
    role: tenant.role,
    modelId: model?.id || modelIdOrSlug,
    eventType: "open_model_viewer",
    metadata
  });
}

export function getModelAccessContext(user, modelIdOrSlug) {
  const model = getModelBySlugOrId(modelIdOrSlug);
  return {
    model,
    canOpen: canAccessModel(user, model),
    tenant: createTenantScope(user, model?.institutionId || user?.institutionId)
  };
}
