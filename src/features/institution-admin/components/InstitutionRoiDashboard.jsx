import React from "react";
import Card from "../../../components/Card/Card";
import LineIcon from "../../../components/icons/LineIcon";
import { useInstitutionRoi } from "../hooks/useInstitutionRoi";
import { formatNumber } from "../../../utils/formatLocale";
import { useLanguage } from "../../../context/LanguageContext";
import AdminTitle from "./AdminTitle";
import Kpi from "./Kpi";

import { downloadCsv } from "../../../services/export/csvExportService";

export default function InstitutionRoiDashboard() {
  const { data, loading } = useInstitutionRoi();
  const { language } = useLanguage();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-textMuted">
        <LineIcon name="refresh" className="mr-3 h-5 w-5 animate-spin" />
        <span>Calculando impacto institucional...</span>
      </div>
    );
  }

  if (!data || (data.totalViews === 0 && data.totalQuizzes === 0)) {
    return (
      <>
        <AdminTitle title="ROI Institucional" text="Impacto acadêmico e economia de laboratório." />
        <Card className="premium-panel-card mt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center text-textMuted">
            <LineIcon name="chart" className="mb-4 h-12 w-12 opacity-30" />
            <h3 className="mb-2 text-xl font-bold text-clinicalWhite">Aguardando dados de uso</h3>
            <p className="max-w-md text-sm">
              {data?.error ? "As tabelas de análise ainda não estão ativas." : "A instituição precisa gerar sessões de estudo para que o ROI seja calculado."}
            </p>
          </div>
        </Card>
      </>
    );
  }

  const formatHours = (seconds) => {
    if (!seconds) return "0h";
    const hours = (seconds / 3600).toFixed(1);
    return `${hours.replace(".", ",")}h`;
  };

  const handleExport = () => {
    if (!data) {
      alert("Nenhum dado disponível para exportação.");
      return;
    }

    const rows = [{
      "Horas de Estudo": formatHours(data.totalStudySeconds),
      "Simulados Realizados": data.totalQuizzes,
      "Alunos Ativos": data.activeStudents,
      "Visualizações": data.totalViews,
      "Engajamento": data.engagementLevel
    }];

    const date = new Date().toISOString().split('T')[0];
    downloadCsv(`aeternum-roi-${date}.csv`, rows);
  };

  return (
    <>
      <div className="flex items-start justify-between">
        <AdminTitle title="ROI Institucional" text="Impacto acadêmico e economia de laboratório." />
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg bg-techTeal/10 px-4 py-2 text-sm font-medium text-techTeal hover:bg-techTeal/20 transition-colors mt-2"
        >
          <LineIcon name="download" className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      {data.error && (
         <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
           <LineIcon name="alert-triangle" className="mr-2 inline h-4 w-4" />
           Erro fatal: {data.error}
         </div>
      )}

      {data.warning && (
         <div className="mb-6 rounded-xl border border-techTeal/30 bg-techTeal/10 p-4 text-sm text-techTeal">
           <LineIcon name="info" className="mr-2 inline h-4 w-4" />
           Aviso: {data.warning}
         </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi label="Horas de Estudo Geradas" value={formatHours(data.totalStudySeconds)} tone="teal" />
        <Kpi label="Simulados Realizados" value={formatNumber(data.totalQuizzes, language)} />
        <Kpi label="Visualizações 3D" value={formatNumber(data.totalViews, language)} />
        <Kpi label="Alunos Ativos" value={formatNumber(data.activeStudents, language)} tone="teal" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="premium-panel-card">
          <h3 className="mb-4 font-bold text-clinicalWhite">Engajamento Institucional</h3>
          <div className="flex flex-col items-center justify-center py-6">
            <span className="text-4xl font-black text-techTeal">{data.engagementLevel}</span>
            <span className="mt-2 text-sm text-textMuted">Classificação baseada no uso acadêmico global</span>
          </div>
        </Card>

        <Card className="premium-panel-card lg:col-span-2">
          <h3 className="mb-4 font-bold text-clinicalWhite">Impacto Educacional & Laboratorial</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-premiumDark p-4 shadow-sm ring-1 ring-white/5">
              <span className="text-sm font-medium text-textMuted">Exposição Anatômica</span>
              <strong className="mt-1 block text-2xl font-bold text-white">Massiva</strong>
              <small className="text-xs text-techTeal">Escalabilidade infinita</small>
            </div>
            <div className="rounded-xl bg-premiumDark p-4 shadow-sm ring-1 ring-white/5">
              <span className="text-sm font-medium text-textMuted">Turmas Ativas</span>
              <strong className="mt-1 block text-2xl font-bold text-white">{data.activeClasses}</strong>
              <small className="text-xs text-techTeal">Ambientes utilizando 3D</small>
            </div>
            <div className="rounded-xl bg-premiumDark p-4 shadow-sm ring-1 ring-white/5">
              <span className="text-sm font-medium text-textMuted">Laboratório Físico</span>
              <strong className="mt-1 block text-2xl font-bold text-white">Preservado</strong>
              <small className="text-xs text-techTeal">Menos desgaste de peças</small>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
