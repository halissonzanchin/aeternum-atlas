import { getSubscriptionStatus } from "../services/subscriptionService";
import {
  canAccessModel as canAccessModelByPermission,
  isAdminPath as isAdminRoutePath,
  isAdminRole,
  isPrivatePath as isPrivateRoutePath
} from "../services/permissions/permissionService";

export function isAdmin(user) {
  return isAdminRole(user);
}

export function canAccessModel(user, model) {
  return canAccessModelByPermission(user, model);
}

export function isPrivatePath(path) {
  return isPrivateRoutePath(path);
}

export function isAdminPath(path) {
  return isAdminRoutePath(path);
}

export function accessSummary(user) {
  const status = getSubscriptionStatus(user);
  return {
    status,
    hasInstitutionalAccess: true,
    isAdmin: isAdmin(user)
  };
}
