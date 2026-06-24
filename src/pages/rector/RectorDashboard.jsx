import React from "react";
import Card from "../../components/Card/Card";
import LineIcon from "../../components/icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";
import { isUpeDemoMode, getExecutiveLayer } from "../../demo/upe";

export default function RectorDashboard({ user }) {
  const { t } = useLanguage();
  const demoMode = isUpeDemoMode(user);
  
  const rectorView = getExecutiveLayer().rector;

  // Static Data Contract for UPE Demo (Fase 6.2C.2)
  const metrics = demoMode ? {
    totalStudents: rectorView.institution.contractedCapacity,
    activeStudents: rectorView.institution.activeStudents,
    totalProfessors: rectorView.hierarchy.roles.professors,
    totalCourses: rectorView.hierarchy.courses.length,
    totalStudyHours: 4860, // From academic layer
    monthlyGrowth: 5.2,
    estimatedLabSavings: rectorView.roi.estimatedLabSavings,
    averageScore: rectorView.academicPerformance[0]?.avgScore || 82,
    atRiskStudents: 47,
    recoveredStudents: 31
  } : {
    totalStudents: 700,
    activeStudents: 650,
    totalProfessors: 42,
    totalCourses: 1,
    totalStudyHours: 14000,
    monthlyGrowth: 38,
    estimatedLabSavings: 250000,
    averageScore: 82,
    atRiskStudents: 47,
    recoveredStudents: 31
  };

  const adoptionByDiscipline = [
    { name: "Anatomia Sistêmica", usage: 85 },
    { name: "Neuroanatomia", usage: 92 },
    { name: "Anatomia Topográfica", usage: 78 }
  ];

  const mostStudiedStructures = [
    { name: "Coração (Completo)", views: 3200 },
    { name: "Sistema Nervoso Central", views: 2850 },
    { name: "Crânio e Face", views: 2100 }
  ];

  const hardestStructures = demoMode 
    ? getExecutiveLayer().professor.mostErroredStructures.slice(0, 3).map(h => ({ name: h.structure, errorRate: h.errorRate }))
    : [
    { name: "Pares Cranianos", errorRate: 64 },
    { name: "Plexo Braquial", errorRate: 58 },
    { name: "Artérias da Base do Crânio", errorRate: 52 }
  ];

  return (
    <section className="premium-dashboard fade-in-up pb-12">
      <div className="page-title mb-8 flex flex-col md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow text-techTeal">Universidad Privada del Este</p>
          <h1 className="display-title text-clinicalWhite">Dashboard Executivo</h1>
          <p className="mt-2 text-textMuted max-w-2xl">
            Visão estratégica de adoção institucional, engajamento e retorno acadêmico (ROI).
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2 text-sm text-textMuted bg-blackDeep/40 px-4 py-2 rounded-full border border-techTeal/20">
          <LineIcon name="calendar" className="w-4 h-4 text-techTeal" />
          <span>Mês Corrente (Maio 2026)</span>
        </div>
      </div>

      {/* 1. Executive Overview */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-clinicalWhite mb-4 flex items-center">
          <LineIcon name="globe" className="w-5 h-5 mr-2 text-techTeal" />
          Visão Geral Institucional
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-blackDeep/60 border-techTeal/20 hover:border-techTeal/40 transition">
            <p className="text-textMuted text-sm font-medium mb-1 flex items-center">
              <LineIcon name="users" className="w-4 h-4 mr-2" />
              Alunos Ativos / Total
            </p>
            <div className="flex items-end space-x-2">
              <span className="text-3xl font-bold text-clinicalWhite">{metrics.activeStudents}</span>
              <span className="text-lg text-textMuted mb-1">/ {metrics.totalStudents}</span>
            </div>
            <p className="text-xs text-techTeal mt-2 flex items-center">
              <LineIcon name="arrow-up" className="w-3 h-3 mr-1" />
              {(metrics.activeStudents / metrics.totalStudents * 100).toFixed(1)}% de ativação
            </p>
          </Card>

          <Card className="bg-blackDeep/60 border-techTeal/20 hover:border-techTeal/40 transition">
            <p className="text-textMuted text-sm font-medium mb-1 flex items-center">
              <LineIcon name="clock" className="w-4 h-4 mr-2" />
              Horas de Estudo (Mês)
            </p>
            <div className="text-3xl font-bold text-clinicalWhite">
              {metrics.totalStudyHours.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-techTeal mt-2 flex items-center">
              <LineIcon name="arrow-up" className="w-3 h-3 mr-1" />
              +{metrics.monthlyGrowth}% adoção mensal
            </p>
          </Card>

          <Card className="bg-blackDeep/60 border-techTeal/20 hover:border-techTeal/40 transition">
            <p className="text-textMuted text-sm font-medium mb-1 flex items-center">
              <LineIcon name="user-check" className="w-4 h-4 mr-2" />
              Professores Conectados
            </p>
            <div className="text-3xl font-bold text-clinicalWhite">{metrics.totalProfessors}</div>
            <p className="text-xs text-textMuted mt-2">Corpo docente engajado</p>
          </Card>

          <Card className="bg-blackDeep/60 border-techTeal/20 hover:border-techTeal/40 transition relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-alertSuccess/5 to-transparent z-0"></div>
            <p className="text-textMuted text-sm font-medium mb-1 flex items-center relative z-10">
              <LineIcon name="dollar-sign" className="w-4 h-4 mr-2 text-alertSuccess" />
              Economia Lab. Estimada
            </p>
            <div className="text-3xl font-bold text-alertSuccess relative z-10">
              R$ {metrics.estimatedLabSavings.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-alertSuccess/80 mt-2 relative z-10">
              Projeção baseada em horas digitais
            </p>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* 2. Academic Adoption */}
        <div>
          <h2 className="text-xl font-bold text-clinicalWhite mb-4 flex items-center">
            <LineIcon name="bar-chart-2" className="w-5 h-5 mr-2 text-techTeal" />
            Adoção por Disciplina
          </h2>
          <Card className="bg-blackDeep/40 border-slate-800">
            <div className="space-y-4">
              {adoptionByDiscipline.map((disc, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-clinicalWhite font-medium">{disc.name}</span>
                    <span className="text-techTeal font-bold">{disc.usage}% ativo</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-techTeal h-2 rounded-full" style={{ width: `${disc.usage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-800 text-center">
              <p className="text-sm text-textMuted">Os 3 módulos mais engajados representam 74% do uso total.</p>
            </div>
          </Card>
        </div>

        {/* 3. Student Success */}
        <div>
          <h2 className="text-xl font-bold text-clinicalWhite mb-4 flex items-center">
            <LineIcon name="trending-up" className="w-5 h-5 mr-2 text-techTeal" />
            Impacto no Rendimento Acadêmico
          </h2>
          <Card className="bg-blackDeep/40 border-slate-800 h-full">
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="flex flex-col justify-center items-center text-center p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="text-alertWarning text-4xl mb-2"><LineIcon name="alert-triangle" className="w-10 h-10 mx-auto" /></div>
                <div className="text-2xl font-bold text-clinicalWhite">{metrics.atRiskStudents}</div>
                <div className="text-xs text-textMuted mt-1">Alunos em Risco<br/>Identificados pela IA</div>
              </div>
              <div className="flex flex-col justify-center items-center text-center p-4 bg-alertSuccess/5 rounded-xl border border-alertSuccess/20">
                <div className="text-alertSuccess text-4xl mb-2"><LineIcon name="check-circle" className="w-10 h-10 mx-auto" /></div>
                <div className="text-2xl font-bold text-clinicalWhite">{metrics.recoveredStudents}</div>
                <div className="text-xs text-textMuted mt-1">Alunos Recuperados<br/>com Aeternum Atlas</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 4. Anatomical Intelligence */}
      <div>
        <h2 className="text-xl font-bold text-clinicalWhite mb-4 flex items-center">
          <LineIcon name="crosshair" className="w-5 h-5 mr-2 text-techTeal" />
          Inteligência Anatômica (Campus Inteiro)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-blackDeep/40 border-slate-800">
            <h3 className="text-sm font-bold text-textMuted uppercase mb-4 tracking-wider">Estruturas Mais Visualizadas</h3>
            <div className="space-y-3">
              {mostStudiedStructures.map((struct, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800 hover:border-techTeal/30 transition">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded bg-techTeal/10 flex items-center justify-center text-techTeal text-xs font-bold">
                      #{idx + 1}
                    </div>
                    <span className="text-clinicalWhite font-medium text-sm">{struct.name}</span>
                  </div>
                  <span className="text-techTeal text-sm font-bold">{struct.views} views</span>
                </div>
              ))}
            </div>
          </Card>
          
          <Card className="bg-blackDeep/40 border-slate-800">
            <h3 className="text-sm font-bold text-textMuted uppercase mb-4 tracking-wider flex items-center">
              Maior Taxa de Erro (Simulados)
            </h3>
            <div className="space-y-3">
              {hardestStructures.map((struct, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-alertWarning/5 rounded-lg border border-alertWarning/20 hover:border-alertWarning/40 transition">
                  <div className="flex items-center space-x-3">
                    <LineIcon name="activity" className="w-5 h-5 text-alertWarning" />
                    <span className="text-clinicalWhite font-medium text-sm">{struct.name}</span>
                  </div>
                  <span className="text-alertWarning text-sm font-bold">{struct.errorRate}% erro</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

    </section>
  );
}
