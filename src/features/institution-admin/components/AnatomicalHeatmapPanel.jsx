import React from "react";
import Card from "../../../components/Card/Card";
import LineIcon from "../../../components/icons/LineIcon";
import { useAnatomicalHeatmap } from "../hooks/useAnatomicalHeatmap";
import { formatNumber } from "../../../utils/formatLocale";
import { useLanguage } from "../../../context/LanguageContext";
import AdminTitle from "./AdminTitle";
import Kpi from "./Kpi";

import { downloadCsv } from "../../../services/export/csvExportService";

export default function AnatomicalHeatmapPanel() {
  const { data, loading } = useAnatomicalHeatmap();
  const { language } = useLanguage();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-textMuted">
        <LineIcon name="refresh" className="mr-3 h-5 w-5 animate-spin" />
        <span>Processando Heatmap Anatômico...</span>
      </div>
    );
  }

  if (!data || data.totalAnswers === 0) {
    return (
      <>
        <AdminTitle title="Heatmap Anatômico" text="Mapeamento de estruturas com maior taxa de erro." />
        <Card className="premium-panel-card mt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center text-textMuted">
            <LineIcon name="target" className="mb-4 h-12 w-12 opacity-30" />
            <h3 className="mb-2 text-xl font-bold text-clinicalWhite">Nenhum erro computado ainda</h3>
            <p className="max-w-md text-sm">
              {data?.error ? "As tabelas de análise ainda não estão ativas." : "Os alunos precisam realizar mais simulados anatômicos para que o mapa de calor seja desenhado."}
            </p>
          </div>
        </Card>
      </>
    );
  }

  const handleExport = () => {
    if (!data.mostErroredStructures || data.mostErroredStructures.length === 0) {
      alert("Nenhum dado disponível para exportação.");
      return;
    }

    const rows = data.mostErroredStructures.map(struct => ({
      "Estrutura": struct.structureName,
      "Modelo": struct.modelId,
      "Acertos": struct.total - struct.errors,
      "Erros": struct.errors,
      "Taxa de Erro": `${struct.errorRate}%`
    }));

    const date = new Date().toISOString().split('T')[0];
    downloadCsv(`aeternum-heatmap-${date}.csv`, rows);
  };

  return (
    <div className="fade-in-up">
      <div className="flex items-start justify-between">
        <AdminTitle title="Heatmap Anatômico" text="Mapeamento de estruturas com maior taxa de erro." />
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
           {data.warning}
         </div>
      )}

      <div className="kpi-grid mb-6">
        <Kpi label="Respostas Analisadas" value={formatNumber(data.totalAnswers, language)} />
        <Kpi label="Total de Falhas" value={formatNumber(data.totalErrors, language)} tone="teal" />
        <Kpi label="Taxa de Erro Geral" value={`${data.errorRate}%`} />
        <Kpi label="Pontos Críticos" value={data.mostErroredStructures.length} tone="teal" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card className="premium-panel-card">
          <h3 className="mb-4 font-bold text-clinicalWhite flex items-center gap-2">
             <LineIcon name="target" className="h-5 w-5 text-techTeal" /> Estruturas Mais Erradas
          </h3>
          <div className="flex flex-col gap-3">
            {data.mostErroredStructures.map((struct, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl bg-premiumDark p-3 shadow-sm ring-1 ring-white/5">
                <div className="flex items-center gap-3">
                  <span className="badge badge-teal">{idx + 1}</span>
                  <div className="flex flex-col">
                    <strong className="text-sm text-white">{struct.structureName}</strong>
                    <small className="text-xs text-textMuted">Mod: {struct.modelId.split("-")[0]}</small>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-sm font-bold text-red-400">{struct.errorRate}% erro</span>
                  <small className="text-xs text-textMuted">{struct.errors} de {struct.total} res</small>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="premium-panel-card flex flex-col gap-6">
          <div>
             <h3 className="mb-4 font-bold text-clinicalWhite flex items-center gap-2">
                <LineIcon name="layers" className="h-5 w-5 text-techTeal" /> Modelos de Alta Dificuldade
             </h3>
             {data.mostDifficultModels.length > 0 ? (
               <div className="flex flex-col gap-2">
                 {data.mostDifficultModels.map((m, i) => (
                    <div key={i} className="flex justify-between border-b border-white/5 py-2 last:border-0">
                       <span className="text-sm text-textMuted">ID: {m.modelId.split("-")[0]}</span>
                       <strong className="text-sm text-clinicalWhite">{m.errorRate}% erro</strong>
                    </div>
                 ))}
               </div>
             ) : (
                <p className="text-sm text-textMuted">Sem dados suficientes.</p>
             )}
          </div>

          <div>
             <h3 className="mb-4 font-bold text-clinicalWhite flex items-center gap-2">
                <LineIcon name="spark" className="h-5 w-5 text-techTeal" /> Sugestões Pedagógicas
             </h3>
             <div className="flex flex-col gap-3">
                {data.pedagogicalSuggestions.map((sug, i) => (
                   <div key={i} className="rounded-lg bg-techTeal/10 p-3 text-sm text-techTeal border border-techTeal/20">
                     {sug}
                   </div>
                ))}
                {data.pedagogicalSuggestions.length === 0 && (
                   <p className="text-sm text-textMuted">Nenhuma intervenção drástica recomendada no momento.</p>
                )}
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
