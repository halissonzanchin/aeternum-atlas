import "./analytics.css";

export default function DevelopmentMetricsPanel({ metrics }) {
  const items = [
    ["Build version", metrics.appVersion],
    ["Ambiente", metrics.environment],
    ["Último deploy", metrics.lastDeploy],
    ["Build status", metrics.buildStatus],
    ["Carga média do viewer", `${metrics.averageViewerLoadTimeSeconds}s`],
    ["Taxa de erro frontend", `${metrics.frontendErrorRate}%`],
    ["Falhas de rota", `${metrics.routeErrorRate}%`],
    ["Falhas Sketchfab", `${metrics.sketchfabFailureRate}%`],
    ["Falhas de exportação", `${metrics.exportFailureRate}%`],
    ["Memória média mockada", `${metrics.averageMemoryUsageMb} MB`]
  ];

  return (
    <div>
      <div className="analytics-card-heading">
        <h2>Métricas de desenvolvimento</h2>
        <span>Performance técnica e prontidão operacional</span>
      </div>
      <div className="development-metrics-grid">
        {items.map(([label, value]) => (
          <article key={label} className="development-metric-card">
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
    </div>
  );
}
