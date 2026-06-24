import React from 'react';
import LineIcon from '../../../components/icons/LineIcon';
import Card from '../../../components/Card/Card';

export default function AnatomicalRiskLegend() {
  const severities = [
    { label: 'Risco Crítico', color: 'bg-red-500', desc: 'Ação imediata necessária' },
    { label: 'Risco Moderado', color: 'bg-orange-500', desc: 'Requer intervenção focada' },
    { label: 'Atenção', color: 'bg-amber-400', desc: 'Acompanhamento preventivo' },
    { label: 'Adequado', color: 'bg-green-500', desc: 'Desempenho dentro do esperado' }
  ];

  return (
    <Card className="premium-panel-card p-4 mt-4">
      <h4 className="text-xs font-bold text-textMuted uppercase mb-3 flex items-center gap-2">
        <LineIcon name="info" className="h-4 w-4" /> Legenda de Criticidade
      </h4>
      <div className="flex flex-col gap-2">
        {severities.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${item.color} shadow-sm`} />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-clinicalWhite">{item.label}</span>
              <span className="text-xs text-textMuted">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
