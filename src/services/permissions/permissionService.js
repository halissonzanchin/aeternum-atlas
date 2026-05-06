export const ROLES = {
  STUDENT: "student",
  TEACHER: "teacher",
  INSTITUTION_ADMIN: "institution_admin",
  SUPER_ADMIN: "super_admin"
};

export const ROLE_HOME = {
  [ROLES.STUDENT]: "/dashboard",
  [ROLES.TEACHER]: "/teacher/dashboard",
  [ROLES.INSTITUTION_ADMIN]: "/super-admin",
  [ROLES.SUPER_ADMIN]: "/super-admin"
};

export const PERMISSIONS = {
  VIEW_STUDENT_DASHBOARD: "student.dashboard.view",
  VIEW_MODELS: "models.view",
  VIEW_MODEL_VIEWER: "models.viewer.view",
  MANAGE_STUDY_AGENDA: "study.agenda.manage",
  VIEW_TEACHER_DASHBOARD: "teacher.dashboard.view",
  VIEW_TEACHER_STUDENTS: "teacher.students.view",
  MANAGE_STUDY_GUIDES: "teacher.study_guides.manage",
  VIEW_INSTITUTION_DASHBOARD: "institution.dashboard.view",
  MANAGE_INSTITUTION_STUDENTS: "institution.students.manage",
  VIEW_INSTITUTION_ANALYTICS: "institution.analytics.view",
  VIEW_INSTITUTION_BILLING: "institution.billing.view",
  EXPORT_REPORTS: "reports.export",
  MANAGE_GLOBAL_INSTITUTIONS: "super_admin.institutions.manage",
  VIEW_GLOBAL_ANALYTICS: "super_admin.analytics.view",
  VIEW_PLATFORM_HEALTH: "super_admin.platform_health.view"
};

export const ROLE_PERMISSIONS = {
  [ROLES.STUDENT]: [
    PERMISSIONS.VIEW_STUDENT_DASHBOARD,
    PERMISSIONS.VIEW_MODELS,
    PERMISSIONS.VIEW_MODEL_VIEWER,
    PERMISSIONS.MANAGE_STUDY_AGENDA
  ],
  [ROLES.TEACHER]: [
    PERMISSIONS.VIEW_TEACHER_DASHBOARD,
    PERMISSIONS.VIEW_TEACHER_STUDENTS,
    PERMISSIONS.MANAGE_STUDY_GUIDES,
    PERMISSIONS.VIEW_MODELS,
    PERMISSIONS.VIEW_MODEL_VIEWER,
    PERMISSIONS.EXPORT_REPORTS
  ],
  [ROLES.INSTITUTION_ADMIN]: [
    PERMISSIONS.VIEW_INSTITUTION_DASHBOARD,
    PERMISSIONS.MANAGE_INSTITUTION_STUDENTS,
    PERMISSIONS.VIEW_INSTITUTION_ANALYTICS,
    PERMISSIONS.VIEW_INSTITUTION_BILLING,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_PLATFORM_HEALTH,
    PERMISSIONS.VIEW_MODELS,
    PERMISSIONS.VIEW_MODEL_VIEWER
  ],
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS)
};

export const routeAccessRules = [
  { prefix: "/", public: true, exact: true },
  { prefix: "/login", public: true },
  { prefix: "/register", public: true },
  { prefix: "/dashboard", roles: [ROLES.STUDENT, ROLES.TEACHER, ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN] },
  { prefix: "/models", roles: [ROLES.STUDENT, ROLES.TEACHER, ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN] },
  { prefix: "/model", roles: [ROLES.STUDENT, ROLES.TEACHER, ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN] },
  { prefix: "/viewer", roles: [ROLES.STUDENT, ROLES.TEACHER, ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN] },
  { prefix: "/atlas", roles: [ROLES.STUDENT, ROLES.TEACHER, ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN] },
  { prefix: "/videos", roles: [ROLES.STUDENT, ROLES.TEACHER, ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN] },
  { prefix: "/courses", roles: [ROLES.STUDENT, ROLES.TEACHER, ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN] },
  { prefix: "/history", roles: [ROLES.STUDENT] },
  { prefix: "/favorites", roles: [ROLES.STUDENT] },
  { prefix: "/progress", roles: [ROLES.STUDENT] },
  { prefix: "/study-agenda", roles: [ROLES.STUDENT] },
  { prefix: "/flashcards", roles: [ROLES.STUDENT] },
  { prefix: "/quizzes", roles: [ROLES.STUDENT] },
  { prefix: "/summaries", roles: [ROLES.STUDENT] },
  { prefix: "/guided-study", roles: [ROLES.STUDENT] },
  { prefix: "/ai-tutor", roles: [ROLES.STUDENT] },
  { prefix: "/review", roles: [ROLES.STUDENT] },
  { prefix: "/profile", roles: [ROLES.STUDENT, ROLES.TEACHER, ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN] },
  { prefix: "/settings", roles: [ROLES.STUDENT, ROLES.TEACHER, ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN] },
  { prefix: "/license", roles: [ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN] },
  { prefix: "/teacher", roles: [ROLES.TEACHER, ROLES.SUPER_ADMIN] },
  { prefix: "/institution-admin", roles: [ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN] },
  { prefix: "/admin", roles: [ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN] },
  { prefix: "/super-admin", roles: [ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN] }
];

export function normalizeRole(role) {
  if (role === "admin") return ROLES.SUPER_ADMIN;
  if (role === "professor") return ROLES.TEACHER;
  if (role === "institution") return ROLES.INSTITUTION_ADMIN;
  return role || ROLES.STUDENT;
}

export function getHomeForRole(roleOrUser) {
  const role = normalizeRole(typeof roleOrUser === "string" ? roleOrUser : roleOrUser?.role);
  return ROLE_HOME[role] || ROLE_HOME[ROLES.STUDENT];
}

export function isAdminRole(roleOrUser) {
  const role = normalizeRole(typeof roleOrUser === "string" ? roleOrUser : roleOrUser?.role);
  return [ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN].includes(role);
}

export function isFinancialRole(roleOrUser) {
  const role = normalizeRole(typeof roleOrUser === "string" ? roleOrUser : roleOrUser?.role);
  return [ROLES.INSTITUTION_ADMIN, ROLES.SUPER_ADMIN].includes(role);
}

export function hasPermission(user, permission) {
  const role = normalizeRole(user?.role);
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

export function getRouteRule(pathname) {
  const path = normalizePath(pathname);
  return routeAccessRules
    .filter(rule => (rule.exact ? path === rule.prefix : path === rule.prefix || path.startsWith(`${rule.prefix}/`)))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0] || null;
}

export function canAccessRoute(user, pathname) {
  const rule = getRouteRule(pathname);
  if (!rule) return Boolean(user);
  if (rule.public) return true;
  if (!user) return false;

  const role = normalizeRole(user.role);
  return rule.roles?.includes(role) || false;
}

export function isPrivatePath(pathname) {
  const rule = getRouteRule(pathname);
  return Boolean(rule && !rule.public);
}

export function isAdminPath(pathname) {
  const path = normalizePath(pathname);
  return path === "/admin" ||
    path.startsWith("/admin/") ||
    path === "/institution-admin" ||
    path.startsWith("/institution-admin/") ||
    path === "/super-admin" ||
    path.startsWith("/super-admin/");
}

export function isFinancialPath(pathname) {
  const path = normalizePath(pathname);
  return path === "/license" ||
    path.includes("/billing") ||
    path.includes("/estimated-billing") ||
    path.includes("/contracts");
}

export function getRouteFallback(user, pathname) {
  if (!user) return "/login";
  if (canAccessRoute(user, pathname)) return pathname;
  return getHomeForRole(user);
}

export function canAccessModel(user, model) {
  if (!user || model?.isActive === false) return false;
  if ((user.accountStatus || "ativo") === "bloqueado") return false;
  if (!model?.institutionId) return true;
  if (normalizeRole(user.role) === ROLES.SUPER_ADMIN) return true;
  return model.institutionId === user.institutionId;
}

export function createTenantScope(user, institutionId = user?.institutionId) {
  return {
    institutionId: normalizeRole(user?.role) === ROLES.SUPER_ADMIN ? institutionId : user?.institutionId,
    role: normalizeRole(user?.role),
    userId: user?.id || null
  };
}

export function assertTenantAccess(user, institutionId) {
  const role = normalizeRole(user?.role);
  if (role === ROLES.SUPER_ADMIN) return true;
  if (user?.institutionId && user.institutionId === institutionId) return true;
  throw new Error("Acesso negado ao tenant institucional solicitado.");
}

function normalizePath(pathname = "/") {
  if (!pathname) return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}
