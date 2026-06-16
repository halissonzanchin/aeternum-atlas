import React from "react";
import Card from "../../../components/Card/Card";
import LineIcon from "../../../components/icons/LineIcon";
import { useTeacherDashboardAnalytics } from "../hooks/useTeacherDashboardAnalytics";
import { useLanguage } from "../../../context/LanguageContext";

import { downloadCsv } from "../../../services/export/csvExportService";

function Kpi({ label, value, tone = "default" }) {
  const toneClasses = {
    teal: "text-techTeal",
    default: "text-clinicalWhite"
  };

  return (
    <Card className="premium-panel-card flex flex-col justify-center">
      <span className="text-sm font-medium text-textMuted">{label}</span>
      <strong className={`mt-1 text-3xl font-bold ${toneClasses[tone]}`}>{value}</strong>
    </Card>
  );
}

export default function TeacherPedagogicalDashboard({ user }) {
  const { data, loading } = useTeacherDashboardAnalytics(user);
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex w-full items-center justify-center py-10 text-textMuted">
        <LineIcon name="refresh" className="mr-3 h-5 w-5 animate-spin" />
        <span>Calculando métricas pedagógicas...</span>
      </div>
    );
  }

  if (!data || data.totalSimulations === 0) {
    return (
      <Card className="premium-panel-card mt-6">
        <div className="flex flex-col items-center justify-center py-10 text-center text-textMuted">
          <LineIcon name="users" className="mb-4 h-10 w-10 opacity-30" />
          <h3 className="mb-2 text-lg font-bold text-clinicalWhite">Nenhum dado das suas turmas</h3>
          <p className="max-w-sm text-sm">
            Os alunos ainda não completaram simulados suficientes para gerar o mapa pedagógico.
          </p>
        </div>
      </Card>
    );
  }

  const formatMin = (sec) => sec ? `${Math.floor(sec / 60)} min` : "0 min";

  const handleExport = () => {
    if (!data.allStudents || data.allStudents.length === 0) {
      alert("Nenhum dado disponível para exportação.");
      return;
    }

    const rows = data.allStudents.map(student => ({
      "Nome": student.name,
      "Email": student.email,
      "Turma": student.className,
      "Média Geral": student.averageScore,
      "Simulados Realizados": student.attempts,
      "Tempo de Estudo": formatMin(student.totalDuration),
      "Status Pedagógico": student.averageScore < Math.min(50, data.classAverage - 15) ? "Em Risco" : "Normal"
    }));

    const date = new Date().toISOString().split('T')[0];
    downloadCsv(`aeternum-gradebook-${date}.csv`, rows);
  };

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="viewer-eyebrow">Raio-X Acadêmico</p>
          <h2 className="text-xl font-bold text-clinicalWhite">Desempenho da Turma</h2>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg bg-techTeal/10 px-4 py-2 text-sm font-medium text-techTeal hover:bg-techTeal/20 transition-colors"
        >
          <LineIcon name="download" className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      <div className="kpi-grid">
        <Kpi label="Média Geral" value={`${data.classAverage}%`} tone="teal" />
        <Kpi label="Simulados Realizados" value={data.totalSimulations} />
        <Kpi label="Alunos em Risco" value={data.studentsAtRisk.length} tone="teal" />
        <Kpi label="Tempo Médio" value={formatMin(data.averageStudyTime)} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="premium-panel-card">
          <h3 className="mb-4 font-bold text-clinicalWhite">Alunos em Risco (Atenção)</h3>
          {data.studentsAtRisk.length > 0 ? (
            <div className="flex flex-col gap-3">
              {data.studentsAtRisk.map((student, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-premiumDark p-3 shadow-sm ring-1 ring-white/5">
                  <span className="text-sm text-white">ID: {student.userId.split("-")[0]}...</span>
                  <span className="text-sm font-bold text-red-400">{student.averageScore}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-textMuted">Nenhum aluno classificado em risco crítico.</p>
          )}
        </Card>

        <Card className="premium-panel-card">
          <h3 className="mb-4 font-bold text-clinicalWhite">Modelos de Maior Dificuldade</h3>
          {data.bottomModels.length > 0 ? (
            <div className="flex flex-col gap-3">
              {data.bottomModels.map((model, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-premiumDark p-3 shadow-sm ring-1 ring-white/5">
                  <span className="text-sm text-white">Ref: {model.modelId.split("-")[0]}</span>
                  <span className="text-sm font-bold text-techTeal">{model.averageScore}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-textMuted">Nenhum dado estruturado.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
