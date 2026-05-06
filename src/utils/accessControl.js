import { getSubscriptionStatus } from "../services/subscriptionService";

export function isAdmin(user) {
  return ["admin", "super_admin", "institution_admin"].includes(user?.role);
}

export function canAccessModel(user, model) {
  return Boolean(user && model?.isActive !== false && (user.accountStatus || "ativo") !== "bloqueado");
}

export function isPrivatePath(path) {
  return [
    "/dashboard",
    "/models",
    "/viewer",
    "/license",
    "/profile",
    "/settings",
    "/history",
    "/favorites",
    "/teacher",
    "/study-lists",
    "/classes",
    "/recommendations",
    "/academic-reports",
    "/institution-admin",
    "/super-admin",
    "/atlas",
    "/radiology",
    "/videos",
    "/courses"
  ].some(route => path === route || path.startsWith(`${route}/`));
}

export function isAdminPath(path) {
  return path === "/admin" || path.startsWith("/admin/") || path === "/institution-admin" || path.startsWith("/institution-admin/") || path === "/super-admin" || path.startsWith("/super-admin/");
}

export function accessSummary(user) {
  const status = getSubscriptionStatus(user);
  return {
    status,
    hasInstitutionalAccess: true,
    isAdmin: isAdmin(user)
  };
}
