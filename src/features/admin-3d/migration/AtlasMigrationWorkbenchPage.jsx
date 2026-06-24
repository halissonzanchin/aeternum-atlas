import React, { useEffect, useState } from 'react';
import { getMigrationDashboardMetrics } from '../../../services/atlasMigrationService';
import MigrationExecutiveDashboard from './MigrationExecutiveDashboard';
import MigrationStatusBoard from './MigrationStatusBoard';

export default function AtlasMigrationWorkbenchPage({ navigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Supondo role admin, não passamos user específico, pois a métrica carrega do catálogo global
    getMigrationDashboardMetrics(null).then(res => {
      if (!mounted) return;
      setData(res);
      setLoading(false);
    });

    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto animate-pulse flex flex-col gap-6">
        <div className="h-10 w-64 bg-white/10 rounded"></div>
        <div className="h-64 bg-white/5 rounded-xl border border-white/10"></div>
        <div className="h-96 bg-white/5 rounded-xl border border-white/10"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-6">
      <div>
        <p className="eyebrow">Atlas Engine</p>
        <h1 className="display-title">Migration Workbench</h1>
        <p className="mt-2 text-textMuted max-w-3xl">
          Centro de Controle de Migração. Rastreie a conversão do acervo legado (Sketchfab) para o Atlas Native Engine, certificando a presença de marcadores anatômicos, quizzes e telemetria por modelo.
        </p>
      </div>

      <MigrationExecutiveDashboard kpis={data?.kpis} />
      <MigrationStatusBoard models={data?.models || []} navigate={navigate} />
    </div>
  );
}
