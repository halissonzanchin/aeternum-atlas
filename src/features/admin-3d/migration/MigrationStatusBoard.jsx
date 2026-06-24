import React from 'react';
import Card from '../../../components/Card/Card';

export default function MigrationStatusBoard({ models, navigate }) {
  const getStatusBadge = (status) => {
    switch(status) {
      case 'CERTIFIED':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 whitespace-nowrap">CERTIFIED</span>;
      case 'ATLAS_NATIVE':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 whitespace-nowrap">ATLAS_NATIVE</span>;
      case 'MIGRATING':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap">MIGRATING</span>;
      case 'READY_FOR_MIGRATION':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 whitespace-nowrap">READY</span>;
      case 'LEGACY_SKETCHFAB':
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30 whitespace-nowrap">LEGACY_SKETCHFAB</span>;
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="border-b border-white/10 pb-3">
        <h2 className="text-xl font-bold text-clinicalWhite">Migration Status Board</h2>
        <p className="text-sm text-textMuted">Rastreabilidade em tempo real do acervo de modelos.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-clinicalWhite">
          <thead className="bg-white/5 border-b border-white/10 text-textMuted">
            <tr>
              <th className="p-3 font-semibold">Modelo</th>
              <th className="p-3 font-semibold">Sistema</th>
              <th className="p-3 font-semibold">Viewer</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-center">Score</th>
              <th className="p-3 font-semibold text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {models.map(model => (
              <tr key={model.id} className="hover:bg-white/5 transition-colors">
                <td className="p-3 font-medium max-w-[200px] truncate" title={model.title}>{model.title}</td>
                <td className="p-3 text-textMuted max-w-[150px] truncate" title={model.system || model.category || 'N/A'}>{model.system || model.category || 'N/A'}</td>
                <td className="p-3 text-xs uppercase tracking-wider">{model.viewerType || 'sketchfab'}</td>
                <td className="p-3">{getStatusBadge(model.migrationStatus)}</td>
                <td className="p-3 text-center">
                  <span className={`font-mono font-bold ${model.migrationScore >= 100 ? 'text-green-400' : model.migrationScore >= 70 ? 'text-blue-400' : 'text-amber-400'}`}>
                    {model.migrationScore}%
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button 
                    onClick={() => navigate(`/super-admin/atlas-migration/${model.id}`)}
                    className="text-techTeal hover:text-teal-300 font-semibold transition-colors"
                  >
                    Auditar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
