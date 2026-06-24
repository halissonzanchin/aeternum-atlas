import React, { useState } from "react";
import Card from "../../../components/Card/Card";
import LineIcon from "../../../components/icons/LineIcon";
import { useAnatomicalHeatmap } from "../hooks/useAnatomicalHeatmap";
import { formatNumber } from "../../../utils/formatLocale";
import { useLanguage } from "../../../context/LanguageContext";
import AdminTitle from "./AdminTitle";
import Kpi from "./Kpi";

import { downloadCsv } from "../../../services/export/csvExportService";
import RealAnatomicalSvgHeatmap from "./RealAnatomicalSvgHeatmap";
import AnatomicalRiskLegend from "./AnatomicalRiskLegend";
import AnatomicalHeatmapDetailDrawer from "./AnatomicalHeatmapDetailDrawer";

export default function AnatomicalHeatmapPanel() {
  const { data, loading } = useAnatomicalHeatmap();
  const { language } = useLanguage();
  const [selectedRegion, setSelectedRegion] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-textMuted">
        <LineIcon name="refresh" className="mr-3 h-5 w-5 animate-spin" />
        <span>Processando Heatmap Anatômico e Inteligência...</span>
      </div>
    );
  }

  if (!data || !data.kpis) {
    return (
      <>
        <AdminTitle title="Inteligência Acadêmica e Heatmap" text="Mapeamento anatômico e diagnóstico preditivo via IA." />
        <Card className="premium-panel-card mt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center text-textMuted">
            <LineIcon name="target" className="mb-4 h-12 w-12 opacity-30" />
            <h3 className="mb-2 text-xl font-bold text-clinicalWhite">Nenhum dado computado ainda</h3>
            <p className="max-w-md text-sm">
              {data?.error ? "As tabelas de análise ainda não estão ativas." : "Os alunos precisam realizar simulados anatômicos para que o painel de inteligência seja processado."}
            </p>
          </div>
        </Card>
      </>
    );
  }

  const handleExport = () => {
    if (!data.exportRows || data.exportRows.length === 0) {
      alert("Nenhum dado disponível para exportação.");
      return;
    }
    const date = new Date().toISOString().split('T')[0];
    downloadCsv(`aeternum-anatomical-intelligence-${date}.csv`, data.exportRows);
  };

  return (
    <div className="fade-in-up">
      <div className="flex items-start justify-between mb-6">
        <AdminTitle title="Mapa de Calor Anatômico Integrado" text="Visão interativa da performance acadêmica, riscos e projeções." />
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg bg-techTeal/10 px-4 py-2 text-sm font-medium text-techTeal hover:bg-techTeal/20 transition-colors mt-2"
        >
          <LineIcon name="download" className="h-4 w-4" /> Exportar Relatório (CSV)
        </button>
      </div>

      {data.error && (
         <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
           <LineIcon name="alert-triangle" className="mr-2 inline h-4 w-4" />
           Erro fatal: {data.error}
         </div>
      )}

      {/* 1. KPIs Executivos */}
      <div className="kpi-grid mb-6">
        <Kpi label="Respostas Analisadas" value={formatNumber(data.kpis.totalViews, language)} />
        <Kpi label="Total de Falhas" value={formatNumber(data.kpis.totalErrors, language)} tone="amber" />
        <Kpi label="Taxa Média de Erro" value={`${data.kpis.errorRateAvg}%`} />
        <Kpi label="Estruturas Críticas" value={data.kpis.criticalStructuresCount} tone="red" />
      </div>

      {/* 2. Visualizador Anatômico e Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Painel Esquerdo: Mapa SVG */}
        <Card className="premium-panel-card lg:col-span-1 flex flex-col items-center">
          <h3 className="font-bold text-clinicalWhite w-full mb-2 flex items-center gap-2">
            <LineIcon name="user" className="h-5 w-5 text-techTeal" /> Visão Anatômica
          </h3>
          <p className="text-xs text-textMuted w-full text-center mb-4">Clique em uma região para detalhar</p>
          
          <RealAnatomicalSvgHeatmap 
            performanceData={data.anatomicalPerformance} 
            selectedRegion={selectedRegion}
            onRegionSelect={setSelectedRegion} 
          />
          
          <div className="w-full mt-auto">
            <AnatomicalRiskLegend />
          </div>
        </Card>

        {/* Painel Direito: Detalhes Dinâmicos + Ranking Permanente */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Card Condicional: Detalhes da Região */}
          {selectedRegion && (
            <Card className="premium-panel-card border-l-4 border-l-techTeal animate-fade-in-up">
              <AnatomicalHeatmapDetailDrawer 
                regionId={selectedRegion} 
                data={data.anatomicalPerformance} 
                onClose={() => setSelectedRegion(null)}
              />
            </Card>
          )}

          {/* Ranking Permanentemente Visível */}
          <Card className="premium-panel-card flex-grow flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-clinicalWhite flex items-center gap-2">
                <LineIcon name="target" className="h-5 w-5 text-techTeal" /> Ranking Global de Risco Anatômico
              </h3>
              <span className="text-xs text-textMuted">Mostrando todas as regiões crticas</span>
            </div>
            
            <div className="flex flex-col gap-3 overflow-y-auto pr-2 max-h-[500px]">
              {data.anatomicalPerformance.map((struct, idx) => {
                const isHighlighted = selectedRegion === struct.regionId;
                return (
                  <div 
                    key={idx} 
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl p-4 shadow-sm ring-1 transition-all cursor-pointer ${
                      isHighlighted 
                        ? 'bg-techTeal/10 ring-techTeal/50 scale-[1.01]' 
                        : 'bg-premiumDark ring-white/5 hover:bg-white/5'
                    }`}
                    onClick={() => setSelectedRegion(struct.regionId)}
                  >
                    <div className="flex items-center gap-4 mb-2 sm:mb-0">
                      <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        struct.riskLevel === 'critical' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50' : 
                        struct.riskLevel === 'high' ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/50' : 
                        struct.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-teal-500/20 text-teal-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex flex-col">
                        <strong className="text-sm text-white">{struct.displayName}</strong>
                        <span className="text-xs text-textMuted">{struct.course} • {struct.affectedClasses} Turmas</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right flex flex-row sm:flex-col gap-4 sm:gap-0 ml-12 sm:ml-0">
                      <span className={`block text-lg font-bold ${struct.riskLevel === 'critical' ? 'text-red-400' : struct.riskLevel === 'high' ? 'text-orange-400' : 'text-clinicalWhite'}`}>
                        {struct.errorRate}% erro
                      </span>
                      <small className="text-xs text-textMuted flex items-center justify-end gap-1">
                        {struct.trend}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* 3. Indicadores Operacionais e Pedagógicos Inferiores */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="premium-panel-card flex flex-col gap-4">
          <h3 className="font-bold text-clinicalWhite flex items-center gap-2">
              <LineIcon name="layers" className="h-5 w-5 text-techTeal" /> Visão Curricular e Cursos
          </h3>
          <div className="flex flex-col gap-3">
            {data.coursePerformance.map((c, i) => (
                <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0">
                  <div className="flex flex-col">
                    <span className="text-sm text-clinicalWhite">{c.course}</span>
                  </div>
                  <strong className="text-sm text-amber-400">{c.errorRate}% erro</strong>
                </div>
            ))}
          </div>
        </Card>

        <Card className="premium-panel-card flex flex-col gap-4">
          <h3 className="font-bold text-clinicalWhite flex items-center gap-2">
              <LineIcon name="users" className="h-5 w-5 text-red-400" /> Turmas em Risco Adicional
          </h3>
          <div className="flex flex-col gap-3">
            {data.classPerformance.slice(0, 3).map((c, i) => (
              <div key={i} className={`rounded-lg p-3 border ${c.risk === 'Alto' ? 'bg-red-500/5 border-red-500/10' : 'bg-amber-500/5 border-amber-500/10'}`}>
                <div className="flex justify-between mb-1">
                  <strong className="text-sm text-white">{c.className}</strong>
                  <span className={`text-xs px-2 rounded font-bold ${c.risk === 'Alto' ? 'text-red-400' : 'text-amber-400'}`}>Risco {c.risk}</span>
                </div>
                <p className="text-xs text-textMuted">Ação: {c.suggestedAction}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="premium-panel-card flex flex-col gap-4">
          <h3 className="font-bold text-clinicalWhite flex items-center gap-2">
              <LineIcon name="dollar-sign" className="h-5 w-5 text-green-400" /> Impacto Institucional
          </h3>
          <div className="flex flex-col gap-3">
             <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg ring-1 ring-white/5">
               <span className="text-sm text-textMuted">Horas Recuperáveis</span>
               <strong className="text-md text-clinicalWhite">{data.institutionalImpact.recoverableHours}h</strong>
             </div>
             <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg ring-1 ring-white/5">
               <span className="text-sm text-textMuted">Retenção Financeira</span>
               <strong className="text-md text-green-400">{data.institutionalImpact.labSavings}</strong>
             </div>
             <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg ring-1 ring-white/5">
               <span className="text-sm text-textMuted">ROI Pedagógico Previsto</span>
               <strong className="text-md text-gold">{data.institutionalImpact.pedagogicalRoi}</strong>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
