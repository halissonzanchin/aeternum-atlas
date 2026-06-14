import "./analytics.css";

function HealthCard({ label, value, tone = "gold" }) {
  return (
    <article className={`analytics-health-card analytics-health-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default function PlatformHealthPanel({ analytics, formatNumber }) {
  return (
    <div>
      <div className="analytics-card-heading">
        <h2>Saúde da plataforma</h2>
        <span className={`analytics-status-pill analytics-status-pill--${analytics.platformStatus}`}>{analytics.platformStatus}</span>
      </div>
      <div className="analytics-health-grid">
        <HealthCard label="Status atual" value={analytics.platformStatus} tone={analytics.platformStatus === "online" ? "green" : "amber"} />
        <HealthCard label="Uptime" value={`${analytics.uptimePercent}%`} tone="green" />
        <HealthCard label="Tempo fora do ar" value={`${analytics.totalDowntimeMinutes} min`} tone="amber" />
        <HealthCard label="Incidentes no mês" value={formatNumber(analytics.incidentsThisMonth || analytics.errorsThisMonth || 0)} tone="amber" />
        <HealthCard label="Usuários afetados" value={formatNumber(analytics.affectedUsers)} />
        <HealthCard label="Tempo médio de resposta" value={`${analytics.averageResponseTimeMs} ms`} tone="teal" />
        <HealthCard label="Erros de login" value={formatNumber(analytics.loginErrors)} tone="amber" />
        <HealthCard label="Erros Sketchfab" value={formatNumber(analytics.sketchfabLoadErrors)} tone="amber" />
        <HealthCard label="Erros em relatórios" value={formatNumber(analytics.reportExportErrors)} />
        <HealthCard label="Tentativas bloqueadas" value={formatNumber(analytics.blockedAccessAttempts)} tone="red" />
      </div>
    </div>
  );
}
