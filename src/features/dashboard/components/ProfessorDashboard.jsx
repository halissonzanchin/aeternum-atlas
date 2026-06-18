import React from "react";
import Card from "../../../components/Card/Card";
import LineIcon from "../../../components/icons/LineIcon";
import { useLanguage } from "../../../context/LanguageContext";

export default function ProfessorDashboard() {
  const { t } = useLanguage();

  // Static Data Contract for UPE Demo (Fase 6.2E.2)
  const teachingOverview = {
    activeClasses: 4,
    monitoredStudents: 128,
    quizzesCreated: 18,
    activitiesCreated: 12,
    averageClassScore: 78,
    averageEngagementRate: 74
  };

  const classPerformance = [
    { name: "Anatomia I — Turma A", averageScore: 82, engagement: 88, quizCompletion: 90, trend: "+2%" },
    { name: "Anatomia I — Turma B", averageScore: 68, engagement: 65, quizCompletion: 55, trend: "-5%" },
    { name: "Neuroanatomia — Turma C", averageScore: 75, engagement: 80, quizCompletion: 78, trend: "+1%" },
    { name: "Anatomia Topográfica — Turma D", averageScore: 71, engagement: 72, quizCompletion: 68, trend: "0%" }
  ];

  const studentRiskMetrics = {
    atRisk: 12,
    inactive: 7,
    lowPerformance: 9,
    engagementDrop: 6
  };

  const riskStudentsList = [
    { name: "João Pedro Silva", class: "Turma B", reason: "Engajamento Zero", lastAccess: "10 dias atrás", action: "Enviar Alerta" },
    { name: "Mariana Costa", class: "Turma D", reason: "Nota < 40%", lastAccess: "Ontem", action: "Recomendar Trilha" },
    { name: "Lucas Almeida", class: "Turma B", reason: "Múltiplas Faltas", lastAccess: "7 dias atrás", action: "Contatar" },
    { name: "Beatriz Souza", class: "Turma C", reason: "Nota < 40%", lastAccess: "Hoje", action: "Recomendar Aula 3D" },
    { name: "Carlos Eduardo", class: "Turma A", reason: "Queda de Acesso", lastAccess: "5 dias atrás", action: "Notificar" }
  ];

  const difficultyMap = [
    { structure: "Base do Crânio", difficultyScore: 88, averageAccuracy: 42, affectedStudents: 85, recommendedAction: "Abrir Cena 3D: Forames" },
    { structure: "Plexo Braquial", difficultyScore: 85, averageAccuracy: 45, affectedStudents: 78, recommendedAction: "Gerar Simulado Específico" },
    { structure: "Sistema Ventricular", difficultyScore: 80, averageAccuracy: 52, affectedStudents: 62, recommendedAction: "Atividade: Rota do LCR" },
    { structure: "Osso Temporal", difficultyScore: 75, averageAccuracy: 58, affectedStudents: 50, recommendedAction: "Revisão Guiada" },
    { structure: "Tronco Encefálico", difficultyScore: 70, averageAccuracy: 62, affectedStudents: 41, recommendedAction: "Aula Prática de Reforço" }
  ];

  return (
    <section className="premium-dashboard fade-in-up pb-12">
      <div className="page-title mb-8 flex flex-col md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow text-techTeal">Universidad Privada del Este</p>
          <h1 className="display-title text-clinicalWhite">Professor Workspace</h1>
          <p className="mt-2 text-textMuted max-w-2xl">
            Sua central pedagógica. Transforme dados de engajamento em ações didáticas precisas.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          {/* 5. Teaching Actions */}
          <button className="flex items-center space-x-2 text-sm text-clinicalWhite bg-techTeal hover:bg-techTeal/80 px-4 py-2 rounded transition">
            <LineIcon name="plus-circle" className="w-4 h-4" />
            <span>Criar Simulado</span>
          </button>
          <button className="flex items-center space-x-2 text-sm text-techTeal bg-techTeal/10 border border-techTeal/20 hover:bg-techTeal/20 px-4 py-2 rounded transition">
            <LineIcon name="book-open" className="w-4 h-4" />
            <span>Criar Atividade</span>
          </button>
          <button className="flex items-center space-x-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded transition">
            <LineIcon name="more-horizontal" className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Teaching Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-10">
        <Card className="bg-blackDeep/60 border-techTeal/20 p-4 text-center">
          <p className="text-textMuted text-xs font-medium mb-1">Turmas Ativas</p>
          <div className="text-2xl font-bold text-clinicalWhite">{teachingOverview.activeClasses}</div>
        </Card>
        <Card className="bg-blackDeep/60 border-techTeal/20 p-4 text-center">
          <p className="text-textMuted text-xs font-medium mb-1">Alunos</p>
          <div className="text-2xl font-bold text-clinicalWhite">{teachingOverview.monitoredStudents}</div>
        </Card>
        <Card className="bg-blackDeep/60 border-techTeal/20 p-4 text-center">
          <p className="text-textMuted text-xs font-medium mb-1">Simulados</p>
          <div className="text-2xl font-bold text-clinicalWhite">{teachingOverview.quizzesCreated}</div>
        </Card>
        <Card className="bg-blackDeep/60 border-techTeal/20 p-4 text-center">
          <p className="text-textMuted text-xs font-medium mb-1">Atividades</p>
          <div className="text-2xl font-bold text-clinicalWhite">{teachingOverview.activitiesCreated}</div>
        </Card>
        <Card className="bg-techTeal/5 border-techTeal/20 p-4 text-center">
          <p className="text-textMuted text-xs font-medium mb-1">Média Turmas</p>
          <div className="text-2xl font-bold text-techTeal">{teachingOverview.averageClassScore}%</div>
        </Card>
        <Card className="bg-techTeal/5 border-techTeal/20 p-4 text-center">
          <p className="text-textMuted text-xs font-medium mb-1">Engajamento Médio</p>
          <div className="text-2xl font-bold text-techTeal">{teachingOverview.averageEngagementRate}%</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* 2. Class Performance */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold text-clinicalWhite flex items-center">
              <LineIcon name="trending-up" className="w-5 h-5 mr-2 text-techTeal" />
              Desempenho por Turma
            </h2>
            <button className="text-xs text-textMuted hover:text-clinicalWhite underline">Exportar Relatórios</button>
          </div>
          <Card className="bg-blackDeep/40 border-slate-800 p-0 overflow-hidden">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-textMuted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Turma</th>
                  <th className="px-4 py-3 font-semibold text-center">Média</th>
                  <th className="px-4 py-3 font-semibold text-center">Quizzes</th>
                  <th className="px-4 py-3 font-semibold text-right">Tendência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {classPerformance.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/30 transition">
                    <td className="px-4 py-3 font-medium text-clinicalWhite">{c.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${c.averageScore >= 70 ? 'bg-techTeal/10 text-techTeal' : 'bg-alertWarning/10 text-alertWarning'}`}>
                        {c.averageScore}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="w-16 bg-slate-800 rounded-full h-1.5 mx-auto">
                        <div className={`${c.quizCompletion >= 70 ? 'bg-techTeal' : 'bg-alertWarning'} h-1.5 rounded-full`} style={{ width: `${c.quizCompletion}%` }}></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-bold ${c.trend.startsWith('+') ? 'text-techTeal' : c.trend.startsWith('-') ? 'text-alertWarning' : 'text-textMuted'}`}>
                        {c.trend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* 3. Student Risk Monitor (Lista) */}
        <div>
          <h2 className="text-xl font-bold text-clinicalWhite mb-4 flex items-center">
            <LineIcon name="users" className="w-5 h-5 mr-2 text-alertWarning" />
            Alunos Críticos
          </h2>
          <Card className="bg-blackDeep/40 border-slate-800 p-0 overflow-hidden">
            <div className="divide-y divide-slate-800">
              {riskStudentsList.map((student, idx) => (
                <div key={idx} className="p-4 hover:bg-slate-900/50 transition flex items-center justify-between">
                  <div>
                    <p className="font-bold text-clinicalWhite text-sm">{student.name} <span className="text-xs text-textMuted font-normal">({student.class})</span></p>
                    <p className="text-xs text-alertWarning mt-0.5">{student.reason} • {student.lastAccess}</p>
                  </div>
                  <button className="text-xs bg-alertWarning/10 text-alertWarning border border-alertWarning/30 px-3 py-1.5 rounded hover:bg-alertWarning/20 transition">
                    {student.action}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3. Student Risk Monitor (Cards) */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-clinicalWhite mb-4 flex items-center">
            <LineIcon name="activity" className="w-5 h-5 mr-2 text-techTeal" />
            Risk Monitor
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-alertWarning/5 border-alertWarning/20 text-center p-4">
              <div className="text-2xl font-bold text-alertWarning mb-1">{studentRiskMetrics.atRisk}</div>
              <p className="text-xs text-alertWarning/80 font-medium">Alunos em<br/>Risco Alto</p>
            </Card>
            <Card className="bg-slate-900/50 border-slate-700 text-center p-4">
              <div className="text-2xl font-bold text-slate-300 mb-1">{studentRiskMetrics.inactive}</div>
              <p className="text-xs text-textMuted font-medium">Fantasmas<br/>({'>'} 10 dias)</p>
            </Card>
            <Card className="bg-orange-500/5 border-orange-500/20 text-center p-4">
              <div className="text-2xl font-bold text-orange-500 mb-1">{studentRiskMetrics.lowPerformance}</div>
              <p className="text-xs text-orange-500/80 font-medium">Baixa<br/>Nota (&lt; 50%)</p>
            </Card>
            <Card className="bg-yellow-500/5 border-yellow-500/20 text-center p-4">
              <div className="text-2xl font-bold text-yellow-500 mb-1">{studentRiskMetrics.engagementDrop}</div>
              <p className="text-xs text-yellow-500/80 font-medium">Queda<br/>Súbita</p>
            </Card>
          </div>
        </div>

        {/* 4. Anatomical Difficulty Map */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-clinicalWhite mb-4 flex items-center">
            <LineIcon name="crosshair" className="w-5 h-5 mr-2 text-techTeal" />
            Anatomical Difficulty Map (Alvos Didáticos)
          </h2>
          <Card className="bg-blackDeep/40 border-slate-800 p-0 overflow-hidden">
            <div className="p-4 grid gap-3">
              {difficultyMap.map((item, idx) => (
                <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-techTeal/30 transition">
                  <div className="mb-2 md:mb-0 md:w-1/3">
                    <div className="flex items-center space-x-2">
                      {item.averageAccuracy < 50 ? (
                        <div className="w-2 h-2 rounded-full bg-alertWarning"></div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      )}
                      <span className="text-sm font-bold text-clinicalWhite">{item.structure}</span>
                    </div>
                    <span className="text-xs text-textMuted ml-4">{item.affectedStudents} alunos com erro</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 md:w-1/3">
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className={`${item.averageAccuracy < 50 ? 'bg-alertWarning' : 'bg-orange-500'} h-1.5 rounded-full`} style={{ width: `${item.averageAccuracy}%` }}></div>
                    </div>
                    <span className={`text-xs font-bold ${item.averageAccuracy < 50 ? 'text-alertWarning' : 'text-orange-500'}`}>
                      {item.averageAccuracy}%
                    </span>
                  </div>

                  <div className="mt-3 md:mt-0 md:w-1/3 flex justify-end">
                    <button className="text-xs flex items-center text-techTeal hover:underline">
                      <LineIcon name="play" className="w-3 h-3 mr-1" />
                      {item.recommendedAction}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
