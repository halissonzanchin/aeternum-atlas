// src/demo/upe/heatmapIntelligenceLayer.js

export const getHeatmapIntelligence = () => {
  // Configuração base
  const totalViews = 46260;
  const totalErrors = 9945;
  const errorRateAvg = 21.5;
  const analyzedHours = 8742;

  const getRiskLevel = (errorRate) => {
    if (errorRate >= 35) return "critical";
    if (errorRate >= 20) return "high";
    if (errorRate >= 10) return "medium";
    return "low";
  };

  // Mapeamento Anatômico Estendido Premium B2B (8 Regiões - Corpo Único)
  const anatomicalPerformance = [
    {
      id: "encefalo-cranio",
      regionId: "head",
      regionName: "Cabeça / Encéfalo",
      displayName: "Encéfalo e Cúpula Craniana",
      course: "Medicina",
      affectedClasses: 4,
      affectedStudents: 150,
      teacher: "Dr. Roberto",
      errorRate: 15.2,
      trend: "-2% nesta semana",
      totalAnswers: 3000,
      failedAnswers: 456,
      hours: 180,
      aiRecommendation: "Acompanhamento preventivo em sulcos e giros.",
      financialImpact: 0,
      relatedModels: ["neuro-001-enc", "neuro-002-cx"]
    },
    {
      id: "face-mandibula",
      regionId: "face",
      regionName: "Face / Base do Crânio",
      displayName: "Face e Base Craniana",
      course: "Odontologia",
      affectedClasses: 3,
      affectedStudents: 218,
      teacher: "Dra. Sônia",
      errorRate: 42.1,
      trend: "+2% nesta semana",
      totalAnswers: 2328,
      failedAnswers: 980,
      hours: 210,
      aiRecommendation: "Ativar quiz semanal compulsório sobre forames faciais.",
      financialImpact: 18200,
      relatedModels: ["osteo-001-face", "osteo-003-forames"]
    },
    {
      id: "regiao-cervical",
      regionId: "neck",
      regionName: "Cervical",
      displayName: "Cervical e Vasos do Pescoço",
      course: "Fisioterapia",
      affectedClasses: 2,
      affectedStudents: 85,
      teacher: "Prof. Henrique",
      errorRate: 28.5,
      trend: "+5% nesta semana",
      totalAnswers: 1400,
      failedAnswers: 399,
      hours: 120,
      aiRecommendation: "Focar em musculatura supra-hióidea e plexo cervical.",
      financialImpact: 5400,
      relatedModels: ["musc-cervical-01"]
    },
    {
      id: "sistema-respiratorio",
      regionId: "chest",
      regionName: "Tórax",
      displayName: "Sistemas Torácicos e Costelas",
      course: "Fisioterapia",
      affectedClasses: 4,
      affectedStudents: 150,
      teacher: "Dra. Fernanda",
      errorRate: 33.5,
      trend: "+8% nesta semana",
      totalAnswers: 2100,
      failedAnswers: 703,
      hours: 160,
      aiRecommendation: "Intensificar estudo dos segmentos broncopulmonares.",
      financialImpact: 8500,
      relatedModels: ["resp-pulmao-01", "cardio-coracao-01"]
    },
    {
      id: "visceras-abdominais",
      regionId: "abdomen",
      regionName: "Abdome",
      displayName: "Cavidade e Vísceras Abdominais",
      course: "Enfermagem",
      affectedClasses: 3,
      affectedStudents: 120,
      teacher: "Prof. Marcos",
      errorRate: 18.0,
      trend: "Estável",
      totalAnswers: 1800,
      failedAnswers: 324,
      hours: 150,
      aiRecommendation: "Aplicar módulo interativo de topografia abdominal.",
      financialImpact: 1200,
      relatedModels: ["gastro-figado-01", "gastro-estomago-01"]
    },
    {
      id: "topografia-pelvica",
      regionId: "pelvis",
      regionName: "Pelve",
      displayName: "Pelve e Trato Urogenital",
      course: "Medicina",
      affectedClasses: 4,
      affectedStudents: 220,
      teacher: "Dra. Sônia",
      errorRate: 46.8,
      trend: "+12% nesta semana",
      totalAnswers: 1950,
      failedAnswers: 912,
      hours: 190,
      aiRecommendation: "Alerta pedagógico! Revisão urgente de assoalho pélvico.",
      financialImpact: 22400,
      relatedModels: ["pelv-fem-01", "pelv-masc-01"]
    },
    {
      id: "membros-superiores",
      regionId: "upper_limbs",
      regionName: "Membros Superiores",
      displayName: "Articulações e Musculatura dos MMSS",
      course: "Fisioterapia",
      affectedClasses: 3,
      affectedStudents: 218,
      teacher: "Dr. Roberto",
      errorRate: 36.5,
      trend: "+5% nesta semana",
      totalAnswers: 2747,
      failedAnswers: 1250,
      hours: 250,
      aiRecommendation: "Revisar inervação de manguito rotador e antebraços.",
      financialImpact: 12500,
      relatedModels: ["musc-braco-dir", "musc-ombro-esq"]
    },
    {
      id: "membros-inferiores",
      regionId: "lower_limbs",
      regionName: "Membros Inferiores",
      displayName: "Compartimentos Crurais e Femorais dos MMII",
      course: "Ortopedia",
      affectedClasses: 2,
      affectedStudents: 85,
      teacher: "Dr. Carlos",
      errorRate: 38.2,
      trend: "+4% nesta semana",
      totalAnswers: 1450,
      failedAnswers: 554,
      hours: 130,
      aiRecommendation: "Prática dirigida em musculatura tibial e fáscias crurais.",
      financialImpact: 9800,
      relatedModels: ["musc-coxa-dir", "musc-perna-esq"]
    }
  ];

  const enhancedPerformance = anatomicalPerformance.map(p => ({
    ...p,
    riskLevel: getRiskLevel(p.errorRate)
  }));

  const coursePerformance = [
    { course: "Medicina", errorRate: 28.4, criticalStructures: 12, monitoredClasses: 8 },
    { course: "Odontologia", errorRate: 25.1, criticalStructures: 8, monitoredClasses: 6 },
    { course: "Enfermagem", errorRate: 22.0, criticalStructures: 5, monitoredClasses: 4 },
    { course: "Fisioterapia", errorRate: 18.5, criticalStructures: 3, monitoredClasses: 5 }
  ];

  const classPerformance = [
    { className: "MED-3A", course: "Medicina", errorRate: 42.5, risk: "Alto", suggestedAction: "Intervenção imediata: Plexo Braquial." },
    { className: "ODO-2B", course: "Odontologia", errorRate: 38.1, risk: "Médio", suggestedAction: "Carga extra de dissecção virtual: Face." },
    { className: "MED-4B", course: "Medicina", errorRate: 46.8, risk: "Alto", suggestedAction: "Revisão geral: Pelve." },
    { className: "ENF-4A", course: "Enfermagem", errorRate: 26.0, risk: "Baixo", suggestedAction: "Engajamento saudável." }
  ];

  const institutionalImpact = {
    recoverableHours: 420,
    projectedFailReduction: "14%",
    labSavings: "R$ 45.000/sem",
    pedagogicalRoi: "2.8x"
  };

  const exportRows = enhancedPerformance.map(p => ({
    "Região Anatômica": p.regionName,
    "Estrutura Crítica": p.displayName,
    "Curso": p.course,
    "Turmas Afetadas": p.affectedClasses,
    "Alunos Impactados": p.affectedStudents,
    "Taxa de Erro": `${p.errorRate}%`,
    "Tendência Semanal": p.trend,
    "Risco Financeiro": p.financialImpact ? `R$ ${p.financialImpact}` : 'Sem impacto',
    "Recomendação IA": p.aiRecommendation,
    "Modelos 3D Relacionados": p.relatedModels.join(', '),
    "Prioridade": p.riskLevel === 'critical' ? 'Risco Crítico' : p.riskLevel === 'high' ? 'Risco Moderado' : p.riskLevel === 'medium' ? 'Atenção' : 'Adequado',
    "Responsável Pedagógico Sugerido": p.teacher,
    "Ação Recomendada": p.aiRecommendation
  }));

  return {
    kpis: {
      totalViews,
      totalErrors,
      errorRateAvg,
      analyzedHours,
      criticalStructuresCount: enhancedPerformance.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high').length,
    },
    anatomicalPerformance: enhancedPerformance,
    coursePerformance,
    classPerformance,
    institutionalImpact,
    exportRows
  };
};
