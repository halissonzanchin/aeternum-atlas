import "./analytics.css";

function formatSession(minutes) {
  const wholeMinutes = Math.floor(minutes);
  const seconds = Math.round((minutes - wholeMinutes) * 60);
  return `${wholeMinutes}min ${seconds}s`;
}

function Kpi({ label, value, tone = "gold" }) {
  return (
    <article className={`analytics-kpi-card analytics-kpi-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default function AnalyticsKpiGrid({ analytics, formatNumber }) {
  return (
    <div className="analytics-kpi-grid">
      <Kpi label="Usuários ativos agora" value={formatNumber(analytics.activeUsersNow)} tone="green" />
      <Kpi label="Acessos hoje" value={formatNumber(analytics.accessesToday)} tone="teal" />
      <Kpi label="Acessos no mês" value={formatNumber(analytics.accessesThisMonth)} />
      <Kpi label="Tempo total de uso" value={`${formatNumber(analytics.totalStudyHoursThisMonth)}h`} />
      <Kpi label="Tempo médio por sessão" value={formatSession(analytics.averageSessionMinutes)} tone="teal" />
      <Kpi label="Taxa de retorno" value={`${analytics.returningUserRate}%`} tone="green" />
      <Kpi label="Conclusão de modelos" value={`${analytics.modelCompletionRate}%`} tone="teal" />
      <Kpi label="Status da plataforma" value={analytics.platformStatus} tone={analytics.platformStatus === "online" ? "green" : "amber"} />
      <Kpi label="Uptime" value={`${analytics.uptimePercent}%`} tone="green" />
      <Kpi label="Erros no período" value={formatNumber(analytics.errorsThisMonth)} tone={analytics.errorsThisMonth > 10 ? "red" : "amber"} />
    </div>
  );
}
