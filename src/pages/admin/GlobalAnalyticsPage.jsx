import { useMemo, useState } from "react";
import Card from "../../components/Card/Card";
import AnalyticsKpiGrid from "../../components/admin/analytics/AnalyticsKpiGrid";
import BlockedAccessPanel from "../../components/admin/analytics/BlockedAccessPanel";
import DailyAccessChart from "../../components/admin/analytics/DailyAccessChart";
import DevelopmentMetricsPanel from "../../components/admin/analytics/DevelopmentMetricsPanel";
import DowntimeTimelineChart from "../../components/admin/analytics/DowntimeTimelineChart";
import HourlyUsageChart from "../../components/admin/analytics/HourlyUsageChart";
import MostAccessedModelsChart from "../../components/admin/analytics/MostAccessedModelsChart";
import PlatformErrorsChart from "../../components/admin/analytics/PlatformErrorsChart";
import PlatformHealthPanel from "../../components/admin/analytics/PlatformHealthPanel";
import PlatformIncidentsTable from "../../components/admin/analytics/PlatformIncidentsTable";
import RealtimeStatusBadge from "../../components/admin/analytics/RealtimeStatusBadge";
import ResponseTimeChart from "../../components/admin/analytics/ResponseTimeChart";
import SystemStudyTimeChart from "../../components/admin/analytics/SystemStudyTimeChart";
import { formatNumber } from "../../utils/formatLocale";
import "../../components/admin/analytics/analytics.css";

const PERIODS = ["Hoje", "Últimos 7 dias", "Últimos 30 dias", "Este mês", "Personalizado"];

const emptyAnalyticsSnapshot = {
  activeUsersNow: 0,
  accessesToday: 0,
  accessesThisMonth: 0,
  totalStudyHoursThisMonth: 0,
  averageSessionMinutes: 0,
  returningUserRate: 0,
  modelCompletionRate: 0,
  platformStatus: "sem dados",
  uptimePercent: 0,
  errorsThisMonth: 0,
  blockedAccessAttempts: 0,
  affectedUsers: 0,
  totalDowntimeMinutes: 0,
  lastIncident: null,
  averageResponseTimeMs: 0,
  sketchfabLoadErrors: 0,
  loginErrors: 0,
  reportExportErrors: 0,
  routeErrors: 0,
  lastUpdated: "Nenhum dado real"
};

const emptyDevelopmentMetrics = {
  appVersion: "-",
  environment: "-",
  lastDeploy: "-",
  buildStatus: "-",
  averageViewerLoadTimeSeconds: 0,
  frontendErrorRate: 0,
  routeErrorRate: 0,
  sketchfabFailureRate: 0,
  exportFailureRate: 0,
  averageMemoryUsageMb: 0
};

function csvValue(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function exportToCsv(filename, rows) {
  const csv = rows.map(row => row.map(csvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function GlobalAnalyticsPage({ language = "pt", notify = () => {}, dashboardData = null }) {
  const [period, setPeriod] = useState("Últimos 30 dias");
  const dashboardAnalytics = ["supabase", "restricted", "demo_upe"].includes(dashboardData?.source) ? dashboardData?.analytics : null;
  const analytics = dashboardAnalytics?.snapshot || emptyAnalyticsSnapshot;
  const dataSourceLabel = dashboardData?.source === "supabase"
    ? "Supabase real"
    : dashboardData?.source === "demo_upe"
      ? "MODO APRESENTAÇÃO (DEMO UPE)"
      : dashboardData?.source === "restricted"
        ? "Tenant restrito"
        : "Nenhum dado real";
  const activeDailyAccessData = useMemo(() => dashboardAnalytics?.dailyAccessData || [], [dashboardAnalytics]);
  const activeHourlyUsageData = useMemo(() => dashboardAnalytics?.hourlyUsageData || [], [dashboardAnalytics]);
  const activeSystemStudyTimeData = useMemo(() => dashboardAnalytics?.systemStudyTimeData || [], [dashboardAnalytics]);
  const activeMostAccessedModelsData = useMemo(() => dashboardAnalytics?.mostAccessedModelsData || [], [dashboardAnalytics]);
  const activePlatformErrorsData = useMemo(() => dashboardAnalytics?.platformErrorsData || [], [dashboardAnalytics]);
  const activeDowntimeData = useMemo(() => dashboardAnalytics?.downtimeData || [], [dashboardAnalytics]);
  const activeResponseTimeData = useMemo(() => dashboardAnalytics?.responseTimeData || [], [dashboardAnalytics]);
  const activePlatformIncidents = useMemo(() => dashboardAnalytics?.platformIncidents || [], [dashboardAnalytics]);
  const activeBlockedAccessLogs = useMemo(() => dashboardAnalytics?.blockedAccessLogs || [], [dashboardAnalytics]);
  const activeDevelopmentMetrics = dashboardAnalytics?.developmentMetrics || emptyDevelopmentMetrics;
  const number = value => formatNumber(value, language);

  function exportAnalyticsCsv() {
    exportToCsv("aeternum-analytics-globais.csv", [
      ["Métrica", "Valor"],
      ["Usuários ativos agora", analytics.activeUsersNow],
      ["Acessos hoje", analytics.accessesToday],
      ["Acessos no mês", analytics.accessesThisMonth],
      ["Tempo total de uso", `${analytics.totalStudyHoursThisMonth}h`],
      ["Tempo médio por sessão", `${analytics.averageSessionMinutes} min`],
      ["Taxa de retorno", `${analytics.returningUserRate}%`],
      ["Conclusão de modelos", `${analytics.modelCompletionRate}%`],
      ["Status da plataforma", analytics.platformStatus],
      ["Uptime", `${analytics.uptimePercent}%`],
      ["Erros no período", analytics.errorsThisMonth],
      ["Fonte de dados", dataSourceLabel]
    ]);
    notify("Analytics exportado em CSV.");
  }

  function exportIncidentsCsv() {
    exportToCsv("aeternum-incidentes.csv", [
      ["Data", "Horário", "Módulo afetado", "Tipo de erro", "Duração", "Usuários afetados", "Status", "Severidade", "Observação"],
      ...activePlatformIncidents.map(item => [item.date, item.time, item.module, item.errorType, `${item.durationMinutes} min`, item.affectedUsers, item.status, item.severity, item.note])
    ]);
    notify("Incidentes exportados em CSV.");
  }

  function printDashboard() {
    window.print();
  }

  return (
    <section className="global-analytics-page fade-in-up">
      <div className="admin-section-header">
        <div>
          <p className="eyebrow">Observabilidade institucional</p>
          <h1 className="display-title">Analytics globais</h1>
          <p className="mt-3 max-w-4xl text-textMuted">
            Central de inteligência operacional para uso acadêmico, estabilidade técnica, incidentes, bloqueios de acesso e performance da plataforma Aeternum Atlas.
          </p>
        </div>
        <RealtimeStatusBadge status={analytics.platformStatus} lastUpdated={`${dataSourceLabel} · ${analytics.lastUpdated}`} />
      </div>

      <div className="analytics-toolbar">
        <div className="analytics-period-tabs" aria-label="Filtros de período">
          {PERIODS.map(item => (
            <button key={item} type="button" className={period === item ? "is-active" : ""} onClick={() => setPeriod(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="analytics-toolbar__actions">
          <button type="button" onClick={exportAnalyticsCsv}>Exportar analytics CSV</button>
          <button type="button" onClick={exportIncidentsCsv}>Exportar incidentes CSV</button>
          <button type="button" onClick={() => notify("Relatório técnico preparado para backend real.")}>Gerar relatório técnico</button>
          <button type="button" onClick={printDashboard}>Imprimir dashboard</button>
        </div>
      </div>

      <AnalyticsKpiGrid analytics={analytics} formatNumber={number} />

      <div>
        <div className="analytics-card-heading">
          <h2>Desempenho de uso acadêmico</h2>
          <span>{period}</span>
        </div>
        <div className="analytics-chart-grid">
          <Card>
            <div className="analytics-card-heading">
              <h3>Acessos por dia</h3>
              <span>Acessos, usuários ativos e minutos de estudo</span>
            </div>
            <DailyAccessChart data={activeDailyAccessData} formatNumber={number} />
          </Card>
          <Card>
            <div className="analytics-card-heading">
              <h3>Acessos por hora</h3>
              <span>Identificação de horários de pico</span>
            </div>
            <HourlyUsageChart data={activeHourlyUsageData} formatNumber={number} />
          </Card>
          <Card>
            <div className="analytics-card-heading">
              <h3>Tempo por sistema anatômico</h3>
              <span>Horas acumuladas no mês</span>
            </div>
            <SystemStudyTimeChart data={activeSystemStudyTimeData} formatNumber={number} />
          </Card>
          <Card>
            <div className="analytics-card-heading">
              <h3>Modelos mais acessados</h3>
              <span>Acessos, estudo, crescimento e conclusão</span>
            </div>
            <MostAccessedModelsChart data={activeMostAccessedModelsData} formatNumber={number} />
          </Card>
        </div>
      </div>

      <Card>
        <PlatformHealthPanel analytics={analytics} formatNumber={number} />
      </Card>

      <div className="analytics-chart-grid">
        <Card>
          <div className="analytics-card-heading">
            <h2>Erros por tipo</h2>
            <span>Login, Sketchfab, relatórios, rotas e timeout</span>
          </div>
          <PlatformErrorsChart data={activePlatformErrorsData} formatNumber={number} />
        </Card>
        <Card>
          <div className="analytics-card-heading">
            <h2>Downtime por data</h2>
            <span>Minutos de indisponibilidade</span>
          </div>
          <DowntimeTimelineChart data={activeDowntimeData} />
        </Card>
        <Card>
          <div className="analytics-card-heading">
            <h2>Tempo médio de resposta</h2>
            <span>Performance técnica por horário</span>
          </div>
          <ResponseTimeChart data={activeResponseTimeData} />
        </Card>
      </div>

      <Card className="table-card p-5">
        <div className="analytics-card-heading">
          <h2>Log de incidentes</h2>
          <span>Instabilidades e impacto no período</span>
        </div>
        <PlatformIncidentsTable incidents={activePlatformIncidents} formatNumber={number} />
      </Card>

      <Card className="table-card p-5">
        <BlockedAccessPanel logs={activeBlockedAccessLogs} />
      </Card>

      <Card>
        <DevelopmentMetricsPanel metrics={activeDevelopmentMetrics} />
      </Card>
    </section>
  );
}
