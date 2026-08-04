export const COORDINATOR_SECTIONS = Object.freeze({
  dashboard: {
    path: "/coordinator/dashboard",
    labelKey: "governance.navigation.coordinatorDashboard",
    title: "Inteligência acadêmica"
  },
  professors: {
    path: "/coordinator/professors",
    labelKey: "governance.navigation.professors",
    title: "Professores"
  },
  classes: {
    path: "/coordinator/classes",
    labelKey: "governance.navigation.classes",
    title: "Turmas"
  },
  disciplines: {
    path: "/coordinator/disciplines",
    labelKey: "governance.navigation.disciplines",
    title: "Disciplinas"
  },
  heatmaps: {
    path: "/coordinator/heatmaps",
    labelKey: "governance.navigation.heatmaps",
    title: "Mapas de aprendizagem"
  },
  risk: {
    path: "/coordinator/risk",
    labelKey: "governance.navigation.studentsAtRisk",
    title: "Alunos em atenção"
  }
});

export const RECTOR_SECTIONS = Object.freeze({
  dashboard: {
    path: "/rector/dashboard",
    labelKey: "governance.navigation.rectorDashboard",
    title: "Visão executiva"
  },
  indicators: {
    path: "/rector/indicators",
    labelKey: "governance.navigation.institutionalIndicators",
    title: "Indicadores institucionais"
  },
  engagement: {
    path: "/rector/engagement",
    labelKey: "governance.navigation.engagement",
    title: "Engajamento acadêmico"
  },
  utilization: {
    path: "/rector/utilization",
    labelKey: "governance.navigation.utilization",
    title: "Utilização da plataforma"
  },
  roi: {
    path: "/rector/roi",
    labelKey: "governance.navigation.academicRoi",
    title: "Retorno institucional"
  }
});

export function governanceSectionFromPath(role, pathname) {
  const sections = role === "rector" || role === "reitor"
    ? RECTOR_SECTIONS
    : COORDINATOR_SECTIONS;

  return Object.entries(sections).find(([, item]) => item.path === pathname)?.[0] || null;
}

export function governanceNavigation(role) {
  const sections = role === "rector" || role === "reitor"
    ? RECTOR_SECTIONS
    : COORDINATOR_SECTIONS;

  return Object.values(sections).map(item => [item.path, item.labelKey]);
}
