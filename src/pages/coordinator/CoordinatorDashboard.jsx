import React from "react";
import Card from "../../components/Card/Card";
import LineIcon from "../../components/icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";

export default function CoordinatorDashboard() {
  const { t } = useLanguage();

  // Static Data Contract for UPE Demo (Fase 6.2D.2)
  const healthMetrics = {
    activeDisciplines: 6,
    activeProfessors: 15,
    activeStudents: 700,
    classesAtRisk: 3,
    averageApprovalRate: 82,
    averageEngagementRate: 76
  };

  const curriculumHeatmap = [
    { structure: "Osteologia", accuracy: 58, risk: "medium" },
    { structure: "Neuroanatomia", accuracy: 52, risk: "high" },
    { structure: "Plexo Braquial", accuracy: 47, risk: "high" },
    { structure: "Base do Crânio", accuracy: 43, risk: "critical" },
    { structure: "Sistema Ventricular", accuracy: 39, risk: "critical" }
  ];

  const studentRiskMetrics = {
    atRisk: 47,
    inactive: 28,
    lowPerformance: 34,
    recovered: 31
  };

  const facultyPerformance = [
    { name: "Dr. Carlos Mendes", discipline: "Neuroanatomia", engagement: 92, libraryUsage: 88, quizUsage: 95, score: 78 },
    { name: "Dra. Ana Silva", discipline: "Osteologia", engagement: 85, libraryUsage: 70, quizUsage: 60, score: 81 },
    { name: "Dr. Roberto Costa", discipline: "Anatomia Sistêmica", engagement: 72, libraryUsage: 65, quizUsage: 50, score: 74 },
    { name: "Dra. Juliana Prado", discipline: "Morfologia", engagement: 68, libraryUsage: 55, quizUsage: 45, score: 72 },
    { name: "Dr. Fernando Rios", discipline: "Topográfica", engagement: 55, libraryUsage: 40, quizUsage: 30, score: 65 }
  ];

  const alerts = [
    { id: 1, severity: "critical", target: "Turma Medicina M4", problem: "Queda brusca de engajamento (30% abaixo da média).", action: "Convocar reunião com Dr. Fernando Rios." },
    { id: 2, severity: "high", target: "Base do Crânio (Tópico)", problem: "Taxa de erro superior a 55% em todas as turmas ativas.", action: "Recomendar Trilha de Revisão 3D guiada." },
    { id: 3, severity: "high", target: "28 Alunos Inativos", problem: "Nenhum login na plataforma há mais de 15 dias letivos.", action: "Acionar protocolo de prevenção à evasão (E-mail)." },
    { id: 4, severity: "medium", target: "Dra. Juliana Prado", problem: "Baixa utilização do banco de simulados no semestre.", action: "Oferecer treinamento pedagógico do Atlas AI." },
    { id: 5, severity: "low", target: "Osteologia Clínica", problem: "Tempo médio de estudo inferior à projeção ideal (1h/sem).", action: "Monitorar engajamento na próxima semana." }
  ];

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case "critical": return "bg-alertWarning/10 border-alertWarning/30 text-alertWarning";
      case "high": return "bg-orange-500/10 border-orange-500/30 text-orange-500";
      case "medium": return "bg-yellow-500/10 border-yellow-500/30 text-yellow-500";
      case "low": return "bg-techTeal/10 border-techTeal/30 text-techTeal";
      default: return "bg-slate-800 border-slate-700 text-slate-300";
    }
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy < 45) return "bg-alertWarning";
    if (accuracy < 55) return "bg-orange-500";
    return "bg-yellow-500";
  };

  return (
    <section className="premium-dashboard fade-in-up pb-12">
      <div className="page-title mb-8 flex flex-col md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow text-techTeal">Universidad Privada del Este</p>
          <h1 className="display-title text-clinicalWhite">Inteligência Acadêmica</h1>
          <p className="mt-2 text-textMuted max-w-2xl">
            Gestão pedagógica avançada, prevenção de evasão e saúde curricular.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2 text-sm text-textMuted bg-blackDeep/40 px-4 py-2 rounded-full border border-techTeal/20">
          <LineIcon name="activity" className="w-4 h-4 text-techTeal" />
          <span>Monitoramento Ativo</span>
        </div>
      </div>

      {/* 1. Academic Health Overview */}
      <div className="mb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-blackDeep/60 border-techTeal/20 p-4 text-center">
            <p className="text-textMuted text-xs font-medium mb-1">Disciplinas</p>
            <div className="text-2xl font-bold text-clinicalWhite">{healthMetrics.activeDisciplines}</div>
          </Card>
          <Card className="bg-blackDeep/60 border-techTeal/20 p-4 text-center">
            <p className="text-textMuted text-xs font-medium mb-1">Professores</p>
            <div className="text-2xl font-bold text-clinicalWhite">{healthMetrics.activeProfessors}</div>
          </Card>
          <Card className="bg-blackDeep/60 border-techTeal/20 p-4 text-center">
            <p className="text-textMuted text-xs font-medium mb-1">Alunos</p>
            <div className="text-2xl font-bold text-clinicalWhite">{healthMetrics.activeStudents}</div>
          </Card>
          <Card className="bg-alertWarning/5 border-alertWarning/20 p-4 text-center">
            <p className="text-alertWarning/80 text-xs font-medium mb-1">Turmas Críticas</p>
            <div className="text-2xl font-bold text-alertWarning">{healthMetrics.classesAtRisk}</div>
          </Card>
          <Card className="bg-techTeal/5 border-techTeal/20 p-4 text-center">
            <p className="text-textMuted text-xs font-medium mb-1">Aprovação Média</p>
            <div className="text-2xl font-bold text-techTeal">{healthMetrics.averageApprovalRate}%</div>
          </Card>
          <Card className="bg-techTeal/5 border-techTeal/20 p-4 text-center">
            <p className="text-textMuted text-xs font-medium mb-1">Engajamento Média</p>
            <div className="text-2xl font-bold text-techTeal">{healthMetrics.averageEngagementRate}%</div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* 2. Intervention Center */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-clinicalWhite mb-4 flex items-center">
            <LineIcon name="bell" className="w-5 h-5 mr-2 text-alertWarning" />
            Intervention Center
          </h2>
          <Card className="bg-blackDeep/40 border-slate-800 p-0 overflow-hidden">
            <div className="divide-y divide-slate-800">
              {alerts.map(alert => (
                <div key={alert.id} className="p-4 hover:bg-slate-900/50 transition flex items-start space-x-4">
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${getSeverityStyle(alert.severity).split(' ')[0]}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-clinicalWhite">{alert.target}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getSeverityStyle(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-sm text-textMuted mb-2">{alert.problem}</p>
                    <div className="flex items-center text-xs text-techTeal bg-techTeal/5 px-3 py-2 rounded border border-techTeal/10">
                      <LineIcon name="zap" className="w-3 h-3 mr-1" />
                      Ação Recomenda: {alert.action}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 3. Student Risk Center */}
        <div>
          <h2 className="text-xl font-bold text-clinicalWhite mb-4 flex items-center">
            <LineIcon name="user-x" className="w-5 h-5 mr-2 text-techTeal" />
            Student Risk Center
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-alertWarning/5 border-alertWarning/20 text-center p-5">
              <div className="text-3xl font-bold text-alertWarning mb-1">{studentRiskMetrics.atRisk}</div>
              <p className="text-xs text-alertWarning/80 font-medium">Alunos em<br/>Risco Alto</p>
            </Card>
            <Card className="bg-slate-900/50 border-slate-700 text-center p-5">
              <div className="text-3xl font-bold text-slate-300 mb-1">{studentRiskMetrics.inactive}</div>
              <p className="text-xs text-textMuted font-medium">Sem Acesso<br/>({'>'} 15 dias)</p>
            </Card>
            <Card className="bg-orange-500/5 border-orange-500/20 text-center p-5">
              <div className="text-3xl font-bold text-orange-500 mb-1">{studentRiskMetrics.lowPerformance}</div>
              <p className="text-xs text-orange-500/80 font-medium">Baixo<br/>Rendimento</p>
            </Card>
            <Card className="bg-alertSuccess/5 border-alertSuccess/20 text-center p-5">
              <div className="text-3xl font-bold text-alertSuccess mb-1">{studentRiskMetrics.recovered}</div>
              <p className="text-xs text-alertSuccess/80 font-medium">Recuperados<br/>com IA</p>
            </Card>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 4. Curriculum Heatmap */}
        <div>
          <h2 className="text-xl font-bold text-clinicalWhite mb-4 flex items-center">
            <LineIcon name="target" className="w-5 h-5 mr-2 text-techTeal" />
            Curriculum Heatmap (Tópicos Críticos)
          </h2>
          <Card className="bg-blackDeep/40 border-slate-800">
            <div className="space-y-4">
              {curriculumHeatmap.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-clinicalWhite font-medium">{item.structure}</span>
                    <span className="font-bold text-slate-300">{item.accuracy}% acerto</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className={`${getAccuracyColor(item.accuracy)} h-2 rounded-full transition-all`} style={{ width: `${item.accuracy}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-800 text-center">
              <p className="text-sm text-textMuted">Zonas anatômicas com precisão abaixo de 60% são sinalizadas.</p>
            </div>
          </Card>
        </div>

        {/* 5. Faculty Performance */}
        <div>
          <h2 className="text-xl font-bold text-clinicalWhite mb-4 flex items-center">
            <LineIcon name="users" className="w-5 h-5 mr-2 text-techTeal" />
            Faculty Performance
          </h2>
          <Card className="bg-blackDeep/40 border-slate-800 overflow-x-auto p-0">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-textMuted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Professor</th>
                  <th className="px-4 py-3 font-semibold">Engajamento</th>
                  <th className="px-4 py-3 font-semibold text-center">Simulados</th>
                  <th className="px-4 py-3 font-semibold text-right">Nota Média</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {facultyPerformance.map((prof, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/30 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-clinicalWhite">{prof.name}</div>
                      <div className="text-xs text-textMuted">{prof.discipline}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-800 rounded-full h-1.5">
                          <div className="bg-techTeal h-1.5 rounded-full" style={{ width: `${prof.engagement}%` }}></div>
                        </div>
                        <span className="text-xs">{prof.engagement}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{prof.quizUsage}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${prof.score >= 75 ? 'bg-techTeal/10 text-techTeal' : 'bg-orange-500/10 text-orange-500'}`}>
                        {prof.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </section>
  );
}
