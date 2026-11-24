import { getSubscriptionStatus } from "../services/subscriptionService.js";
import {
  canAccessModel as canAccessModelByPermission,
  isAdminPath as isAdminRoutePath,
  isAdminRole,
  isPrivatePath as isPrivateRoutePath
} from "../services/permissions/permissionService.js";

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

/**
 * Política explícita e fail-closed de rotas autorizadas para a Marina Orb / AtlasAITutor.
 * Garante que a IA acadêmica NUNCA seja montada em rotas públicas ou pré-cadastrais
 * (/, /login, /register, /programa-beta, etc.), independente do estado de autenticação.
 */
export function isAcademicTutorAuthorizedRoute(pathname, user, authReady) {
  if (!authReady || !user) return false;
  const path = (pathname || "").split("?")[0].toLowerCase();

  // Bloqueio absoluto fail-closed em todas as rotas públicas, de autenticação e pré-lançamento
  if (
    path === "/" ||
    path === "/login" ||
    path === "/register" ||
    path === "/programa-beta" ||
    path === "/beta" ||
    path.startsWith("/programa-beta/") ||
    path.startsWith("/beta/") ||
    path === "/forgot-password" ||
    path === "/recovery"
  ) {
    return false;
  }

  // Visualizadores 3D dedicados operam seu próprio ciclo de vida de tutor
  if (
    path.startsWith("/viewer/") ||
    path.startsWith("/teacher/viewer/") ||
    path.startsWith("/atlas-viewer/")
  ) {
    return false;
  }

  // Whitelist estrita de rotas acadêmicas autenticadas
  const isAuthorized = (
    path === "/dashboard" ||
    path.startsWith("/dashboard/") ||
    path.startsWith("/student/") ||
    path.startsWith("/professor/") ||
    path.startsWith("/coordinator/") ||
    path.startsWith("/rector/") ||
    path.startsWith("/institution/") ||
    path.startsWith("/super-admin/") ||
    path.startsWith("/admin/") ||
    path === "/models" ||
    path.startsWith("/models/") ||
    path.startsWith("/model/") ||
    path === "/atlas" ||
    path.startsWith("/atlas/") ||
    path === "/videos" ||
    path === "/courses" ||
    path === "/history" ||
    path === "/favorites" ||
    path === "/progress" ||
    path === "/study-agenda" ||
    path === "/flashcards" ||
    path === "/quizzes" ||
    path === "/mind-map" ||
    path === "/ai-tutor" ||
    path.startsWith("/ai-tutor/") ||
    path.startsWith("/lessons/")
  );

  return Boolean(isAuthorized);
}

export function accessSummary(user) {
  const status = getSubscriptionStatus(user);
  return {
    status,
    hasInstitutionalAccess: true,
    isAdmin: isAdmin(user)
  };
}
