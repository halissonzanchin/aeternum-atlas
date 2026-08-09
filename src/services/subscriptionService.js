import { getUserInstitutionId, isActiveUser, normalizeRole, ROLES } from "./permissions/permissionService";

export function getSubscriptionStatus(user) {
  if (!user) return "cancelled";
  return user.subscriptionStatus || user.accessStatus || "active";
}

export function hasInstitutionalAccess(user) {
  if (!user || !isActiveUser(user)) return false;
  if (normalizeRole(user.role) === ROLES.SUPER_ADMIN) return true;
  return Boolean(getUserInstitutionId(user));
}
