const adminPathById = {
  overview: "/admin/dashboard",
  institution: "/admin/institution",
  students: "/admin/institution-students",
  analytics: "/admin/global-analytics",
  academic_analytics: "/admin/academic-analytics",
  roi: "/admin/roi",
  heatmap: "/admin/heatmap",
  models_3d: "/admin/models-3d",
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
    id: "import_students",
    label: "Importar Alunos",
    labelKey: "institutionAdmin.importStudents",
    sidebarLabel: "Importar Alunos",
    sidebarLabelKey: "institutionAdmin.importStudents",
    path: "/super-admin/import-students",
    aliases: ["/admin/import-students", "/institution-admin/import-students"]
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
    id: "roi",
    label: "ROI Institucional",
    labelKey: "institutionAdmin.roi",
    path: "/super-admin/roi",
    aliases: ["/admin/roi", "/institution-admin/roi"]
  },
  {
    id: "heatmap",
    label: "Heatmap Anatômico",
    labelKey: "institutionAdmin.heatmap",
    path: "/super-admin/heatmap",
    aliases: ["/admin/heatmap", "/institution-admin/heatmap"]
  },
  {
    id: "models_3d",
    label: "Atlas CMS",
    labelKey: "superAdmin.models3d",
    path: "/super-admin/models-3d",
    aliases: ["/admin/models-3d", "/institution-admin/models-3d"]
  },
  {
    id: "atlas_migration",
    label: "Migration Workbench",
    labelKey: "superAdmin.atlasMigration",
    path: "/super-admin/atlas-migration",
    aliases: ["/admin/atlas-migration", "/institution-admin/atlas-migration"]
  },
  {
    id: "viewer_analytics",
    label: "Viewer Analytics",
    labelKey: "superAdmin.viewerAnalytics",
    path: "/super-admin/viewer-analytics",
    aliases: ["/admin/viewer-analytics", "/institution-admin/viewer-analytics"]
  },
  {
    id: "atlas_certification",
    label: "Certification Pipeline",
    labelKey: "superAdmin.atlasCertification",
    path: "/super-admin/atlas-certification",
    aliases: ["/admin/atlas-certification", "/institution-admin/atlas-certification"]
  },
  {
    id: "digital_twins",
    label: "Digital Twins",
    labelKey: "superAdmin.digitalTwins",
    path: "/super-admin/digital-twins",
    aliases: ["/admin/digital-twins", "/institution-admin/digital-twins"]
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
