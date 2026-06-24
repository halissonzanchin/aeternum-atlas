import React from 'react';
import Card from '../../../components/Card/Card';

export default function MigrationExecutiveDashboard({ kpis }) {
  if (!kpis) return null;

  const MetricCard = ({ title, value, unit, highlightClass = "text-clinicalWhite" }) => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
      <span className="text-xs uppercase tracking-wider text-textMuted font-semibold">{title}</span>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`text-2xl font-bold font-serif ${highlightClass}`}>{value}</span>
        {unit && <span className="text-xs text-textMuted uppercase">{unit}</span>}
      </div>
    </div>
  );

  return (
    <Card className="flex flex-col gap-4">
      <div className="border-b border-white/10 pb-3 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-clinicalWhite">Executive Dashboard</h2>
          <p className="text-sm text-textMuted">Progresso de migração do acervo Anatômico</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold text-techTeal font-mono">{kpis.percentComplete}%</span>
          <p className="text-xs text-textMuted uppercase tracking-widest">Concluído</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
        <MetricCard title="Total Acervo" value={kpis.total} unit="Modelos" />
        <MetricCard title="Sketchfab Legacy" value={kpis.sketchfabCount} unit="Modelos" highlightClass="text-gray-400" />
        <MetricCard title="Atlas Native" value={kpis.atlasNativeCount} unit="Modelos" highlightClass="text-blue-400" />
        <MetricCard title="Certificados" value={kpis.certifiedCount} unit="Modelos" highlightClass="text-green-400" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1">
        <MetricCard title="Assets 3D Nuvem" value={kpis.assetsMigrated} unit="GLB/OBJ" highlightClass="text-purple-400" />
        <MetricCard title="Marcadores" value={kpis.markersMigrated} unit="Pinos 3D" highlightClass="text-amber-400" />
        <MetricCard title="Quizzes Nativos" value={kpis.quizzesMigrated} unit="Testes" />
        <MetricCard title="Tutores IA" value={kpis.aiTutorsPrepared} unit="Ativos" />
      </div>

      {kpis.certifiedCount > 0 && (
        <div className="mt-4 bg-gradient-to-r from-techTeal/20 to-transparent p-4 rounded-xl border border-techTeal/30 flex items-center justify-between animate-fade-in-up">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-techTeal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <div>
              <p className="text-xs text-techTeal font-bold uppercase tracking-widest">Pioneirismo</p>
              <p className="text-sm text-clinicalWhite font-medium">Primeiro Digital Twin Certificado: <span className="text-techTeal font-bold">Corte Sagital do Encéfalo</span></p>
            </div>
          </div>
          <span className="bg-techTeal/20 text-techTeal text-[10px] uppercase font-bold px-2 py-1 rounded border border-techTeal/40">
            ATLAS CERTIFIED
          </span>
        </div>
      )}
    </Card>
  );
}
