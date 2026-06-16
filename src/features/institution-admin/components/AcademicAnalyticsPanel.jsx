import React from "react";
import Card from "../../../components/Card/Card";
import LineIcon from "../../../components/icons/LineIcon";
import { useAcademicAnalytics } from "../hooks/useAcademicAnalytics";
import { useLanguage } from "../../../context/LanguageContext";
import { formatNumber } from "../../../utils/formatLocale";
import Kpi from "./Kpi";
import AdminTitle from "./AdminTitle";

export default function AcademicAnalyticsPanel() {
  const { data, loading, error } = useAcademicAnalytics();
  const { language, t } = useLanguage();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-textMuted">
        <LineIcon name="refresh" className="mr-3 h-5 w-5 animate-spin" />
        <span>Carregando dados acadêmicos...</span>
      </div>
    );
  }

  // Se não houver dados nenhum ou falhou gravemente e retornou vazio
  if (!data || data.totalAttempts === 0) {
    return (
      <>
        <AdminTitle title="Analytics Acadêmicos" text="Métricas de simulados anatômicos e teóricos." />
        <Card className="premium-panel-card mt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center text-textMuted">
            <LineIcon name="bar-chart" className="mb-4 h-12 w-12 opacity-30" />
            <h3 className="mb-2 text-xl font-bold text-clinicalWhite">Nenhum dado disponível ainda</h3>
            <p className="max-w-md text-sm">
              {error ? "As tabelas de análise ainda não estão ativas ou não há tentativas registradas." : "Os alunos ainda não realizaram simulados acadêmicos nesta instituição."}
            </p>
          </div>
        </Card>
      </>
    );
  }

  const formatMinutes = (seconds) => {
    if (!seconds) return "0 min";
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <>
      <AdminTitle title="Analytics Acadêmicos" text="Métricas de simulados anatômicos e teóricos." />
      
      {error && (
         <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
           <LineIcon name="alert-triangle" className="mr-2 inline h-4 w-4" />
           Erro fatal: {error}
         </div>
      )}

      {data.warning && (
         <div className="mb-6 rounded-xl border border-techTeal/30 bg-techTeal/10 p-4 text-sm text-techTeal">
           <LineIcon name="info" className="mr-2 inline h-4 w-4" />
           Aviso: Alguns dados teóricos podem não estar disponíveis ({data.warning}).
         </div>
      )}

      <div className="kpi-grid">
        <Kpi label="Total de Tentativas" value={formatNumber(data.totalAttempts, language)} tone="teal" />
        <Kpi label="Desempenho Médio" value={`${data.averageScore}%`} tone="teal" />
        <Kpi label="Tempo Médio" value={formatMinutes(data.averageTimeSeconds)} />
        <Kpi label="KPI Institucional" value={data.kpiUsage} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold text-clinicalWhite mb-4">Modelos Mais Acessados (Simulados)</h2>
          {data.topModels.length > 0 ? (
            <div className="grid gap-3">
              {data.topModels.map((model, index) => (
                <div key={model.id} className="flex items-center justify-between rounded-xl bg-premiumDark p-3 shadow-sm ring-1 ring-white/5">
                   <div className="flex items-center gap-3">
                     <span className="badge badge-teal">{index + 1}</span>
                     <strong className="text-sm text-white">ID: {model.id.split("-")[0]}...</strong>
                   </div>
                   <span className="text-xs text-textMuted">{formatNumber(model.attempts, language)} tentativas</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-textMuted">Nenhum dado de modelo.</p>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-clinicalWhite mb-4">Modelos com Maior Dificuldade</h2>
          {data.difficultModels.length > 0 ? (
            <div className="grid gap-3">
              {data.difficultModels.map((model, index) => (
                <div key={model.id} className="flex items-center justify-between rounded-xl bg-premiumDark p-3 shadow-sm ring-1 ring-white/5">
                   <div className="flex items-center gap-3">
                     <span className="badge">{index + 1}</span>
                     <strong className="text-sm text-white">ID: {model.id.split("-")[0]}...</strong>
                   </div>
                   <span className="text-xs text-textMuted">Média: {model.averageScore}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-textMuted">Nenhum dado de dificuldade.</p>
          )}
        </Card>
      </div>
    </>
  );
}
