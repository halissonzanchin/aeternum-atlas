const adminPathById = {
  overview: "/admin/dashboard",
  institution: "/admin/institution",
  students: "/admin/institution-students",
  analytics: "/admin/global-analytics",
  academic_analytics: "/admin/academic-analytics",
  billing: "/admin/estimated-billing",
  reports: "/admin/reports",
  settings: "/admin/settings"
};

export const adminNavigationItems = [
  {
    id: "overview",
    label: "Visão geral",
    labelKey: "superAdmin.overview",
    path: "/super-admin",
    aliases: ["/super-admin/overview", "/admin", "/admin/dashboard", "/admin/overview", "/institution-admin"]
  },
  {
    id: "institution",
    label: "Instituição",
    labelKey: "institutionAdmin.institution",
    sidebarLabel: "Instituições",
    sidebarLabelKey: "superAdmin.institutions",
    path: "/super-admin/institution",
    aliases: ["/super-admin/institutions", "/super-admin/instituicao", "/super-admin/contracts", "/admin/institution", "/institution-admin/institution"]
  },
  {
    id: "students",
    label: "Alunos da instituição",
    labelKey: "adminNavigation.institutionStudents",
    sidebarLabel: "Alunos por instituição",
    sidebarLabelKey: "superAdmin.studentsByInstitution",
    path: "/super-admin/students",
    aliases: ["/super-admin/institution-students", "/super-admin/alunos", "/admin/institution-students", "/admin/students", "/institution-admin/students"]
  },
  {
    id: "analytics",
    label: "Analytics globais",
    labelKey: "superAdmin.globalAnalytics",
    path: "/super-admin/analytics",
    aliases: ["/super-admin/global-analytics", "/admin/global-analytics", "/admin/analytics", "/institution-admin/analytics"]
  },
  {
    id: "academic_analytics",
    label: "Analytics Acadêmico",
    labelKey: "institutionAdmin.academicAnalytics",
    path: "/super-admin/academic-analytics",
    aliases: ["/admin/academic-analytics", "/institution-admin/academic-analytics"]
  },
  {
    id: "billing",
    label: "Faturamento estimado",
    labelKey: "superAdmin.estimatedBilling",
    path: "/super-admin/billing",
    aliases: ["/super-admin/estimated-billing", "/admin/estimated-billing", "/admin/billing", "/admin/license", "/institution-admin/license"]
  },
  {
    id: "reports",
    label: "Relatórios",
    labelKey: "superAdmin.reports",
    path: "/super-admin/reports",
    aliases: ["/admin/reports", "/institution-admin/reports"]
  },
  {
    id: "settings",
    label: "Configurações",
    labelKey: "navigation.settings",
    path: "/super-admin/settings",
    aliases: ["/super-admin/configuracoes", "/admin/settings", "/institution-admin/settings"]
  }
];

export function getAdminNavigationItems(basePath = "/super-admin") {
  if (basePath === "/admin") {
    return adminNavigationItems.map(item => ({
      ...item,
      path: adminPathById[item.id] || item.path
    }));
  }

  return adminNavigationItems;
}

export function isAdminRouteActive(pathname, item) {
  return pathname === item.path || item.aliases?.includes(pathname) || false;
}

export function getAdminNavigationItemByPath(pathname) {
  return adminNavigationItems.find(item => isAdminRouteActive(pathname, item));
}

export function adminSectionFromPath(pathname, fallback = "overview") {
  return getAdminNavigationItemByPath(pathname)?.id || fallback;
}

export function canonicalSuperAdminPath(pathname) {
  const item = adminNavigationItems.find(entry => entry.aliases?.includes(pathname));
  if (!item || !pathname.startsWith("/super-admin")) return null;
  return item.path;
}
