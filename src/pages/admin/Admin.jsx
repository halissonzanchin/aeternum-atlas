import { useEffect, useMemo, useState } from "react";
import Button from "../../components/Button/Button";
import Card from "../../components/Card/Card";
import AdminAlerts from "../../components/admin/AdminAlerts";
import InstitutionStudentsTable from "../../components/admin/InstitutionStudentsTable";
import LicenseBar from "../../components/admin/LicenseBar";
import PlatformStatus from "../../components/admin/PlatformStatus";
import StudentGrowthBarChart from "../../components/admin/StudentGrowthBarChart";
import StudentHistoryModal from "../../components/admin/StudentHistoryModal";
import UsageLineChart from "../../components/admin/UsageLineChart";
import { getAdminNavigationItems, isAdminRouteActive } from "../../config/adminNavigation";
import { useLanguage } from "../../context/LanguageContext";
import {
  getRestrictedInstitutionDashboardData,
  loadInstitutionDashboardData
} from "../../services/admin/institutionDashboardService";
import { reviewPendingUserRegistration } from "../../services/users/userService";
import { formatCurrency, formatDate, formatNumber } from "../../utils/formatLocale";
import GlobalAnalyticsPage from "./GlobalAnalyticsPage";
import Admin3DModelsPage from "../../features/admin-3d/Admin3DModelsPage";
import AcademicAnalyticsPanel from "../../features/institution-admin/components/AcademicAnalyticsPanel";
import InstitutionRoiDashboard from "../../features/institution-admin/components/InstitutionRoiDashboard";
import AnatomicalHeatmapPanel from "../../features/institution-admin/components/AnatomicalHeatmapPanel";
import AcademicImportPanel from "../../features/institution-admin/components/AcademicImportPanel";
import AtlasViewerAnalyticsDashboard from "./AtlasViewerAnalyticsDashboard";
import AtlasMigrationWorkbenchPage from "../../features/admin-3d/migration/AtlasMigrationWorkbenchPage";
import { getExecutiveLayer } from "../../demo/upe";
import "./adminExecutive.css";

const copy = {
  pt: {
    adminEyebrow: "Central executiva institucional",
    overview: "Visão geral",
    institution: "Instituição",
    students: "Alunos da instituição",
    analytics: "Analytics globais",
    billing: "Faturamento estimado",
    reports: "Relatórios",
    settings: "Configurações",
    overviewText: "Resumo consolidado da operação institucional real, com capacidade, uso, saúde e valor institucional.",
    institutionText: "Dados contratuais, acadêmicos e operacionais da instituição contratante.",
    studentsText: "Base completa de alunos, filtros, histórico individual, desempenho e crescimento de cadastros.",
    analyticsText: "Uso geral da plataforma, monitoramento operacional, instabilidades e comportamento acadêmico.",
    billingText: "Simulação financeira por aluno cadastrado, aluno ativo e capacidade contratada.",
    reportsText: "Relatório executivo institucional para apresentação acadêmica, operacional e financeira.",
    contractedCapacity: "Capacidade contratada",
    registeredStudents: "Alunos cadastrados",
    activeStudents: "Alunos ativos no mês",
    inactiveStudents: "Alunos inativos",
    licenseOccupancy: "Taxa de ocupação da licença",
    estimatedMonthlyRevenue: "Receita estimada mensal",
    maxRevenue: "Receita potencial máxima",
    lostRevenue: "Receita não realizada",
    mostAccessedContent: "Conteúdo mais acessado",
    mostAccessedModels: "Modelos mais acessados",
    totalStudyTime: "Tempo total de estudo no mês",
    accessesToday: "Acessos hoje",
    executiveAlerts: "Alertas inteligentes",
    weeklyUsage: "Uso dos últimos 7 dias",
    executiveSnapshot: "Leitura executiva",
    studentsUnit: "alunos",
    hours: "horas",
    activeNow: "Usuários ativos agora",
    accessesThisMonth: "Acessos no mês",
    avgSession: "Tempo médio por sessão",
    returnRate: "Taxa de retorno",
    peakHour: "Horário de maior uso",
    peakDay: "Dia com maior uso",
    completionRate: "Conclusão de modelos",
    licenseStatus: "Status da licença",
    billingModel: "Modelo de cobrança",
    unitValue: "Valor unitário por aluno",
    licenseStart: "Início da licença",
    nextRenewal: "Próxima renovação",
    responsible: "Responsável institucional",
    administrativeEmail: "E-mail administrativo",
    contractNotes: "Observações do contrato",
    used: "Usado",
    available: "Disponível",
    totalCapacity: "Capacidade total",
    studentStatus: "Status dos alunos",
    noAccessLast30: "Sem acesso nos últimos 30 dias",
    pending: "Pendentes",
    blocked: "Bloqueados",
    searchStudent: "Buscar por nome, e-mail ou matrícula",
    all: "Todos",
    name: "Nome do aluno",
    email: "E-mail",
    registration: "Matrícula/R.A.",
    course: "Curso",
    semester: "Ano/Semestre",
    status: "Status",
    createdAt: "Cadastro",
    lastAccess: "Último acesso",
    totalAccesses: "Total de acessos",
    totalStudyTimeStudent: "Tempo total de estudo",
    topContent: "Conteúdo mais acessado",
    studiedModels: "Modelos estudados",
    performance: "Performance geral",
    actions: "Ações",
    viewDetails: "Visualizar",
    block: "Bloquear",
    growthTitle: "Crescimento de alunos cadastrados",
    monthGrowth: "Crescimento no mês",
    averageDailyRegistrations: "Média de novos cadastros por dia",
    licenseFullForecast: "Previsão de ocupação total",
    remainingCapacity: "Capacidade restante",
    studentDetail: "Detalhe do aluno",
    accessHistory: "Histórico completo de acessos",
    academicPerformance: "Rede de desempenho acadêmico",
    close: "Fechar",
    date: "Data",
    time: "Horário",
    eventType: "Tipo de evento",
    model: "Modelo acessado",
    duration: "Duração",
    action: "Ação realizada",
    dailyAccess: "Acessos por dia",
    hourlyAccess: "Acessos por hora do dia",
    systemStudy: "Tempo de uso por sistema anatômico",
    devices: "Sessões por dispositivo",
    monthlyEvolution: "Evolução de uso mensal",
    activeVsInactive: "Alunos ativos vs inativos",
    platformHealth: "Saúde da plataforma",
    uptime: "Uptime estimado",
    incidents: "Incidentes no mês",
    downtime: "Indisponibilidade",
    affectedUsers: "Usuários afetados",
    avgResponse: "Tempo médio de resposta",
    sketchfabErrors: "Falhas Sketchfab",
    loginErrors: "Falhas de login",
    reportErrors: "Falhas em relatórios",
    lastIncident: "Última instabilidade",
    errorChart: "Erros por tipo",
    incidentLog: "Log de instabilidades",
    module: "Módulo afetado",
    error: "Tipo de erro",
    note: "Observação",
    registeredBilling: "Cobrança por aluno cadastrado",
    activeBilling: "Cobrança por aluno ativo",
    contractedBilling: "Cobrança por capacidade contratada",
    monthly: "Receita mensal estimada",
    semesterRevenue: "Receita semestral estimada",
    annual: "Receita anual estimada",
    maxCapacityRevenue: "Receita máxima pela capacidade",
    activeRegisteredDiff: "Diferença ativo vs cadastrado",
    unusedPotential: "Potencial não utilizado",
    scenarios: "Cenários de receita",
    strategicIndicators: "Indicadores estratégicos do negócio",
    annualRevenue: "Receita anual projetada",
    operationalCost: "Custo operacional estimado",
    ebitda: "EBITDA estimado",
    ebitdaMargin: "Margem operacional",
    payback: "Payback estimado",
    roi: "ROI projetado",
    expansionCapacity: "Capacidade de expansão",
    exportPdf: "Exportar PDF",
    exportCsv: "Exportar CSV",
    exportFinancial: "Exportar dados financeiros",
    exportAcademic: "Exportar relatório acadêmico",
    generateExecutive: "Gerar relatório executivo",
    printReport: "Imprimir / PDF",
    reportFilters: "Filtros de relatório",
    initialPeriod: "Período inicial",
    finalPeriod: "Período final",
    observations: "Observações",
    reportGenerated: "Relatório executivo gerado no MVP.",
    csvExported: "CSV exportado localmente."
  },
  es: {},
  en: {},
  de: {}
};

copy.es = { ...copy.pt, adminEyebrow: "Central ejecutiva institucional", overview: "Visión general", institution: "Institución", students: "Alumnos de la institución", analytics: "Analytics globales", billing: "Facturación estimada", reports: "Reportes", registeredStudents: "Alumnos registrados", activeStudents: "Alumnos activos del mes", inactiveStudents: "Alumnos inactivos", estimatedMonthlyRevenue: "Ingreso mensual estimado", accessesToday: "Accesos hoy", platformHealth: "Salud de la plataforma", exportCsv: "Exportar CSV", printReport: "Imprimir / PDF" };
copy.en = { ...copy.pt, adminEyebrow: "Institutional executive center", overview: "Overview", institution: "Institution", students: "Institution students", analytics: "Global analytics", billing: "Estimated billing", reports: "Reports", contractedCapacity: "Contracted capacity", registeredStudents: "Registered students", activeStudents: "Active students this month", inactiveStudents: "Inactive students", licenseOccupancy: "License occupancy", estimatedMonthlyRevenue: "Estimated monthly revenue", mostAccessedContent: "Most accessed content", totalStudyTime: "Total study time this month", accessesToday: "Accesses today", platformHealth: "Platform health", exportCsv: "Export CSV", printReport: "Print / PDF" };
copy.de = { ...copy.pt, adminEyebrow: "Institutionelles Executive Center", overview: "Übersicht", institution: "Institution", students: "Studierende der Institution", analytics: "Globale Analytics", billing: "Geschätzte Abrechnung", reports: "Berichte", registeredStudents: "Eingeschriebene Studierende", activeStudents: "Aktive Studierende im Monat", inactiveStudents: "Inaktive Studierende", estimatedMonthlyRevenue: "Geschätzter Monatsumsatz", platformHealth: "Plattformzustand", exportCsv: "CSV exportieren", printReport: "Drucken / PDF" };

const sectionRoutes = {
  dashboard: "overview",
  overview: "overview",
  institution: "institution",
  "institution-students": "students",
  students: "students",
  "global-analytics": "analytics",
  analytics: "analytics",
  "academic-analytics": "academic_analytics",
  academic_analytics: "academic_analytics",
  roi: "roi",
  heatmap: "heatmap",
  "import-students": "import_students",
  import_students: "import_students",
  "models-3d": "models_3d",
  models_3d: "models_3d",
  models: "models_3d",
  "atlas-migration": "atlas_migration",
  atlas_migration: "atlas_migration",
  "viewer-analytics": "viewer_analytics",
  viewer_analytics: "viewer_analytics",
  "estimated-billing": "billing",
  billing: "billing",
  license: "billing",
  reports: "reports",
  settings: "settings"
};

function pct(value) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function csvValue(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadCsv(filename, rows) {
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

function money(value, language) {
  return formatCurrency(value, language, "BRL", { maximumFractionDigits: 0 });
}

const emptyInstitution = {
  id: "",
  name: "Nenhum dado encontrado",
  displayName: "Nenhum dado encontrado",
  abbreviation: "-",
  campus: "-",
  country: "-",
  city: "-",
  type: "-",
  course: "-",
  licenseStatus: "-",
  billingModel: "-",
  pricePerStudent: 0,
  contractedCapacity: 0,
  registeredStudents: 0,
  activeStudents: 0,
  inactiveStudents: 0,
  pendingStudents: 0,
  blockedStudents: 0,
  noAccessLast30Days: 0,
  licenseStart: "",
  nextRenewal: "",
  createdAt: "",
  institutionalResponsible: "-",
  administrativeEmail: "-",
  contractNotes: "-"
};

const emptyOverviewMetrics = {
  activeNow: 0,
  accessesToday: 0,
  accessesThisMonth: 0,
  totalStudyHoursThisMonth: 0,
  averageSessionMinutes: 0,
  returnRate: 0,
  completionRate: 0,
  mostAccessedContent: "Nenhum dado encontrado",
  peakHour: "-",
  peakDay: "-"
};

const emptyPlatformHealth = {
  status: "sem dados",
  uptimePercent: 0,
  incidentsThisMonth: 0,
  totalDowntimeMinutes: 0,
  affectedUsers: 0,
  averageResponseTimeMs: 0,
  sketchfabLoadErrors: 0,
  loginErrors: 0,
  reportExportErrors: 0,
  lastIncident: "-"
};

function AdminSectionHeader({ eyebrow, title, text, actions }) {
  return (
    <div className="admin-section-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display-title">{title}</h1>
        {text ? <p className="mt-3 max-w-4xl text-textMuted">{text}</p> : null}
      </div>
      {actions ? <div className="admin-header-actions">{actions}</div> : null}
    </div>
  );
}

function AdminKpiCard({ label, value, detail, tone = "gold", wide = false }) {
  const isLongValue = String(value).length >= 10;
  return (
    <Card className={`admin-kpi-card admin-kpi-card--${tone} flex flex-col justify-between ${wide ? 'md:col-span-2' : ''}`}>
      <span className="text-sm font-medium">{label}</span>
      <strong 
        className={`w-full leading-tight font-bold ${wide ? '' : 'break-words'}`} 
        style={{ fontSize: isLongValue && !wide ? 'clamp(1.15rem, 1.8vw, 1.8rem)' : undefined }}
        title={value}
      >
        {value}
      </strong>
      {detail ? <small className="w-full text-xs text-textMuted mt-1 line-clamp-2" title={detail}>{detail}</small> : null}
    </Card>
  );
}

function BarList({ data, labelKey = "period", valueKey = "accesses", formatter = value => value, color = "teal" }) {
  const max = Math.max(...data.map(item => item[valueKey]), 1);
  return (
    <div className="admin-bar-list">
      {data.map(item => (
        <div key={item[labelKey]} className="admin-bar-row">
          <span>{item[labelKey]}</span>
          <div className="admin-bar-track">
            <div className={`admin-bar-fill admin-bar-fill--${color}`} style={{ width: `${(item[valueKey] / max) * 100}%` }} />
          </div>
          <strong>{formatter(item[valueKey])}</strong>
        </div>
      ))}
    </div>
  );
}

function HorizontalMetricList({ data, valueKey = "value", formatter = value => value }) {
  const max = Math.max(...data.map(item => item[valueKey]), 1);
  return (
    <div className="admin-horizontal-metrics">
      {data.map(item => (
        <div key={item.label || item.title} className="admin-horizontal-row">
          <div>
            <strong>{item.label || item.title}</strong>
            {item.subtitle ? <small>{item.subtitle}</small> : null}
          </div>
          <div className="admin-bar-track">
            <div className="admin-bar-fill" style={{ width: `${(item[valueKey] / max) * 100}%` }} />
          </div>
          <span>{formatter(item[valueKey])}</span>
        </div>
      ))}
    </div>
  );
}

function LicenseCapacityBar({ labels, language, institution }) {
  const source = institution || {};
  const available = Math.max((source.contractedCapacity || 0) - (source.registeredStudents || 0), 0);
  const occupancy = source.contractedCapacity ? (source.registeredStudents / source.contractedCapacity) * 100 : 0;
  return (
    <Card className="admin-license-card">
      <div className="admin-card-heading">
        <h2>{labels.licenseOccupancy}</h2>
        <strong>{pct(occupancy)}</strong>
      </div>
      <div className="admin-license-track" aria-label={labels.licenseOccupancy}>
        <div style={{ width: `${Math.min(Math.max(occupancy, 0), 100)}%` }} />
      </div>
      <div className="admin-license-split">
        <span>{labels.used}: {formatNumber(source.registeredStudents, language)}</span>
        <span>{labels.available}: {formatNumber(available, language)}</span>
        <span>{labels.totalCapacity}: {formatNumber(source.contractedCapacity, language)}</span>
      </div>
    </Card>
  );
}

function StudentRadarChart({ data }) {
  return (
    <div className="admin-radar-fallback">
      {data.map(item => (
        <div key={item.subject}>
          <span>{item.subject}</span>
          <div className="admin-radar-track"><div style={{ width: `${item.value}%` }} /></div>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function StudentDetailModal({ student, labels, onClose, language }) {
  if (!student) return null;
  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
      <Card className="admin-student-modal">
        <div className="admin-modal-header">
          <div>
            <p className="eyebrow">{labels.studentDetail}</p>
            <h2>{student.name}</h2>
            <p>{student.email} · {student.registration}</p>
          </div>
          <Button variant="outline" onClick={onClose}>{labels.close}</Button>
        </div>
        <div className="admin-detail-grid">
          <AdminKpiCard label={labels.totalStudyTimeStudent} value={`${formatNumber(student.totalStudyMinutes, language)} min`} />
          <AdminKpiCard label={labels.totalAccesses} value={formatNumber(student.totalAccesses, language)} tone="teal" />
          <AdminKpiCard label={labels.studiedModels} value={formatNumber(student.studiedModels, language)} />
          <AdminKpiCard label={labels.performance} value={`${student.performance}%`} tone={student.performance >= 70 ? "green" : "amber"} />
        </div>
        <div className="admin-modal-columns">
          <Card>
            <h3>{labels.academicPerformance}</h3>
            <StudentRadarChart data={[]} />
          </Card>
          <Card className="table-card p-0">
            <div className="table-scroll">
              <table className="admin-table text-left text-sm">
                <thead><tr>{[labels.date, labels.time, labels.eventType, labels.model, labels.duration, labels.action].map(item => <th key={item}>{item}</th>)}</tr></thead>
                <tbody>
                  {[].map((event, index) => (
                    <tr key={`${event.date}-${event.time}-${index}`}>
                      <td>{event.date}</td>
                      <td>{event.time}</td>
                      <td>{event.eventType}</td>
                      <td>{event.model}</td>
                      <td>{event.duration}</td>
                      <td>{event.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
}

export default function Admin({ user, section = "overview", path = window.location.pathname, navigate, notify = () => {} }) {
  const { language, t } = useLanguage();
  const labels = copy[language] || copy.pt;
  const current = sectionRoutes[section] || "overview";
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dashboardData, setDashboardData] = useState(() => getRestrictedInstitutionDashboardData(null, "Carregando sessão administrativa."));
  const [dashboardStatus, setDashboardStatus] = useState("loading");
  const [selectedInstitutionId, setSelectedInstitutionId] = useState("");
  const navigationBase = path.startsWith("/admin") || path.startsWith("/institution-admin") ? "/admin" : "/super-admin";
  const topNavigationItems = getAdminNavigationItems(navigationBase);
  const adminStudents = dashboardData?.students || [];
  const studentHistoryByUser = dashboardData?.studentHistoryByUser || {};
  const availableInstitutions = dashboardData?.institutions || [];
  const isSuperAdminScope = ["super_admin", "admin"].includes(String(dashboardData?.raw?.profile?.role || "").toLowerCase());
  const realStudents = ["restricted", "supabase", "demo_upe"].includes(dashboardData?.source)
    ? adminStudents || []
    : [];

  useEffect(() => {
    let mounted = true;

    setDashboardStatus("loading");
    loadInstitutionDashboardData({ institutionId: selectedInstitutionId || null })
      .then(data => {
        if (!mounted) return;
        setDashboardData(data);
        setDashboardStatus(data.source === "supabase" ? "connected" : data.source === "demo_upe" ? "demo_upe" : "restricted");
      })
      .catch(error => {
        console.warn("[admin-dashboard] Falha ao carregar dashboard real. Mantendo estado restrito.", error);
        if (!mounted) return;
        setDashboardData(getRestrictedInstitutionDashboardData(null, "Falha ao validar sessão/tenant administrativo."));
        setDashboardStatus("restricted");
      });

    return () => {
      mounted = false;
    };
  }, [selectedInstitutionId]);

  function exportStudentsCsv() {
    downloadCsv("aeternum-alunos-institucionais.csv", [
      [labels.name, labels.email, labels.registration, labels.course, labels.semester, labels.status, labels.lastAccess, labels.totalAccesses, labels.totalStudyTimeStudent, labels.performance],
      ...adminStudents.map(student => [student.name, student.email, student.registration, student.course, student.semester, student.status, student.lastAccess, student.totalAccesses, student.totalStudyMinutes, `${student.performanceScore}%`])
    ]);
    notify(labels.csvExported);
  }

  function exportStudentCsv(student) {
    downloadCsv(`aeternum-${student.id}.csv`, [
      ["Campo", "Valor"],
      ["Nome", student.name],
      ["E-mail", student.email],
      ["Matrícula", student.registration],
      ["Curso", student.course],
      ["Semestre", student.semester],
      ["Status", student.status],
      ["Último acesso", student.lastAccess],
      ["Total de acessos", student.totalAccesses],
      ["Tempo total de estudo", `${student.totalStudyMinutes} min`],
      ["Conteúdo mais acessado", student.mostViewedContent],
      ["Performance", `${student.performanceScore}/100`]
    ]);
    notify(labels.csvExported);
  }

  function exportStudentHistoryCsv(student) {
    const history = studentHistoryByUser[student.id] || [];
    downloadCsv(`aeternum-historico-${student.id}.csv`, [
      ["Data", "Horário", "Tipo de evento", "Conteúdo/modelo", "Duração", "Dispositivo", "Status"],
      ...history.map(event => [event.date, event.time, event.eventType, event.content, `${event.durationMinutes} min`, event.device, event.status])
    ]);
    notify(labels.csvExported);
  }

  function printStudentAnalysis() {
    window.print();
  }

  function printReport() {
    window.print();
  }

  async function handlePendingRegistrationReview(student, decision) {
    const institutionId = dashboardData?.institution?.id || student?.institutionId;

    if (dashboardData?.source !== "supabase") {
      notify("Aprovação real exige tenant Supabase validado.");
      return;
    }

    try {
      await reviewPendingUserRegistration({
        studentId: student.id,
        institutionId,
        decision
      });

      notify(decision === "approve" ? "Cadastro aprovado com segurança." : "Cadastro rejeitado com segurança.");
      const refreshed = await loadInstitutionDashboardData({ institutionId: selectedInstitutionId || null });
      setDashboardData(refreshed);
      setDashboardStatus(refreshed.source === "supabase" ? "connected" : refreshed.source === "demo_upe" ? "demo_upe" : "restricted");
    } catch (error) {
      notify(error.message || "Não foi possível revisar o cadastro pendente.");
    }
  }

  return (
    <section className="admin-executive-page fade-in-up">
      <div className="admin-section-tabs">
        {topNavigationItems.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={current === item.id || isAdminRouteActive(path, item) ? "is-active" : ""}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      <div className="admin-realdata-toolbar">
        <span>
          {dashboardStatus === "connected" ? "Supabase real" : dashboardStatus === "demo_upe" ? "MODO APRESENTAÇÃO (DEMO UPE)" : dashboardStatus === "loading" ? "Carregando Supabase" : "Acesso restrito"}
          {" · "}
          {dashboardData?.reason || (dashboardData?.scope === "global" ? "escopo global" : dashboardData?.institution?.displayName || "tenant validado")}
        </span>
        {dashboardData?.source === "supabase" && isSuperAdminScope ? (
          <select
            value={selectedInstitutionId}
            onChange={event => setSelectedInstitutionId(event.target.value)}
            aria-label="Alternar instituição real"
          >
            <option value="">Todas as instituições reais</option>
            {availableInstitutions.map(institution => (
              <option key={institution.id} value={institution.id}>
                {institution.displayName || institution.name || institution.id}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {current === "overview" && <Overview labels={labels} language={language} dashboardData={dashboardData} dashboardStatus={dashboardStatus} path={path} />}
      {current === "institution" && <Institution labels={labels} language={language} dashboardData={dashboardData} />}
      {current === "students" && <Students labels={labels} language={language} notify={notify} dashboardData={dashboardData} students={realStudents} onSelectStudent={setSelectedStudent} onExport={exportStudentsCsv} onExportStudent={exportStudentCsv} onReviewPending={handlePendingRegistrationReview} />}
      {current === "analytics" && <GlobalAnalyticsPage language={language} notify={notify} dashboardData={dashboardData} />}
      {current === "academic_analytics" && <AcademicAnalyticsPanel />}
      {current === "roi" && <InstitutionRoiDashboard />}
      {current === "heatmap" && <AnatomicalHeatmapPanel />}
      {current === "import_students" && <AcademicImportPanel />}
      {current === "models_3d" && <Admin3DModelsPage notify={notify} user={user} />}
      {current === "atlas_migration" && <AtlasMigrationWorkbenchPage navigate={navigate} />}
      {current === "viewer_analytics" && <AtlasViewerAnalyticsDashboard />}
      {current === "billing" && <Billing labels={labels} language={language} dashboardData={dashboardData} />}
      {current === "reports" && <Reports labels={labels} language={language} dashboardData={dashboardData} onExport={exportStudentsCsv} onPrint={printReport} />}
      {current === "settings" && <Settings labels={labels} />}

      <StudentHistoryModal
        student={selectedStudent}
        history={selectedStudent ? studentHistoryByUser[selectedStudent.id] || [] : []}
        weeklyEvolution={buildWeeklyEvolutionFromHistory(selectedStudent ? studentHistoryByUser[selectedStudent.id] || [] : [])}
        radarData={buildStudentRadarData(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        onExportHistory={exportStudentHistoryCsv}
        onPrintStudent={printStudentAnalysis}
      />
    </section>
  );
}

function Overview({ labels, language, dashboardData, dashboardStatus, path }) {
  if (dashboardStatus === "demo_upe" && path?.startsWith("/super-admin")) {
    return <SuperAdminB2BOverview labels={labels} language={language} dashboardData={dashboardData} dashboardStatus={dashboardStatus} />;
  }

  const institution = dashboardData?.institution || emptyInstitution;
  const stats = dashboardData?.stats || {};
  const realtimeOverviewMetrics = dashboardData?.overviewMetrics || emptyOverviewMetrics;
  const realtimeUsageData = dashboardData?.usageData || [];
  const realtimeMostAccessedModels = dashboardData?.mostAccessedModels || [];
  const realtimePlatformHealth = dashboardData?.platformHealth || emptyPlatformHealth;
  const registeredStudents = stats.registeredStudents ?? institution.registeredStudents;
  const activeStudents = stats.activeStudents ?? institution.activeStudents;
  const inactiveStudents = stats.inactiveStudents ?? institution.inactiveStudents;
  const contractedCapacity = stats.contractedCapacity ?? institution.contractedCapacity;
  const pricePerStudent = institution.pricePerStudent || 0;
  const occupancyRate = stats.occupancyRate ?? (contractedCapacity ? (registeredStudents / contractedCapacity) * 100 : 0);
  const estimatedRevenue = stats.estimatedRevenue ?? activeStudents * pricePerStudent;
  const maxRevenue = stats.maxRevenue ?? contractedCapacity * pricePerStudent;
  const lostRevenue = stats.lostRevenue ?? maxRevenue - estimatedRevenue;
  const dataSourceLabel = dashboardStatus === "connected"
    ? "Supabase real"
    : dashboardStatus === "demo_upe"
      ? "MODO APRESENTAÇÃO (DEMO UPE)"
      : dashboardStatus === "loading"
        ? "Carregando Supabase"
        : dashboardStatus === "restricted"
          ? "Tenant restrito"
          : "Nenhum dado real";

  return (
    <>
      <AdminSectionHeader
        eyebrow={labels.adminEyebrow}
        title={labels.overview}
        text={labels.overviewText}
        actions={<span className="students-realtime-badge">{dataSourceLabel} · {new Date(dashboardData?.lastUpdated || Date.now()).toLocaleTimeString("pt-BR")}</span>}
      />
      <div className="admin-kpi-grid">
        <AdminKpiCard label={labels.contractedCapacity} value={formatNumber(contractedCapacity, language)} detail={labels.studentsUnit} />
        <AdminKpiCard label={labels.registeredStudents} value={formatNumber(registeredStudents, language)} detail={institution.displayName || institution.name} tone="teal" />
        <AdminKpiCard label={labels.licenseOccupancy} value={pct(occupancyRate)} detail={`${formatNumber(registeredStudents, language)} / ${formatNumber(contractedCapacity, language)}`} />
        <AdminKpiCard label={labels.activeStudents} value={formatNumber(activeStudents, language)} detail="Base ativa faturável" tone="green" />
        <AdminKpiCard label={labels.inactiveStudents} value={formatNumber(inactiveStudents, language)} detail="Reativação recomendada" tone="amber" />
        <AdminKpiCard label={labels.estimatedMonthlyRevenue} value={money(estimatedRevenue, language)} detail={`${formatNumber(activeStudents, language)} x ${money(pricePerStudent, language)}`} />
        <AdminKpiCard label={labels.maxRevenue} value={money(maxRevenue, language)} detail={`${formatNumber(contractedCapacity, language)} x ${money(pricePerStudent, language)}`} />
        <AdminKpiCard label={labels.lostRevenue} value={money(lostRevenue, language)} detail="Diferença entre capacidade e uso ativo" tone="amber" />
      </div>

      <Card className="admin-overview-alerts">
        <div className="admin-card-heading">
          <h2>{labels.executiveAlerts}</h2>
          <span>{labels.executiveSnapshot}</span>
        </div>
        <AdminAlerts
          occupancyRate={occupancyRate}
          inactiveStudents={inactiveStudents}
          lostRevenue={lostRevenue}
          formatCurrency={value => money(value, language)}
        />
      </Card>

      <div className="admin-two-columns">
        <Card>
          <div className="admin-card-heading">
            <h2>{labels.weeklyUsage}</h2>
            <span>{labels.accessesToday}: {formatNumber(realtimeOverviewMetrics.accessesToday, language)}</span>
          </div>
          <UsageLineChart data={realtimeUsageData} />
        </Card>
        <Card>
          <div className="admin-card-heading">
            <h2>{labels.mostAccessedModels}</h2>
            <span>{labels.completionRate}: {realtimeOverviewMetrics.completionRate}%</span>
          </div>
          <HorizontalMetricList data={realtimeMostAccessedModels.map(item => ({ label: item.title, value: item.accesses, subtitle: `${item.studyHours}h` }))} formatter={value => formatNumber(value, language)} />
        </Card>
      </div>

      <div className="admin-two-columns">
        <Card>
          <PlatformStatus
            status={realtimePlatformHealth.status}
            uptime={realtimePlatformHealth.uptimePercent}
            downtime={realtimePlatformHealth.totalDowntimeMinutes}
            lastIncident={realtimePlatformHealth.lastIncident}
          />
        </Card>
        <Card>
          <LicenseBar
            registeredStudents={registeredStudents}
            contractedCapacity={contractedCapacity}
            occupancyRate={occupancyRate}
            formatNumber={value => formatNumber(value, language)}
          />
        </Card>
      </div>
    </>
  );
}

function SuperAdminB2BOverview({ labels, language, dashboardData, dashboardStatus }) {
  const executiveLayer = getExecutiveLayer() || {};
  const superAdmin = executiveLayer.superAdmin || {};
  const investor = executiveLayer.investor || {};

  const financials = investor.financials || {};
  const growthMetrics = superAdmin.growthMetrics || {};
  const globalUsage = superAdmin.globalUsage || { studyHours: [], topModels: [] };
  const marketShareRegions = investor.marketShare?.regions || [];
  const expansion = investor.expansion || { targetMarkets: [] };

  return (
    <>
      <AdminSectionHeader
        eyebrow="Aeternum Atlas · Executive Console"
        title="B2B SaaS Dashboard"
        text="Visão estratégica global, saúde financeira, expansão territorial e performance B2B."
        actions={<span className="students-realtime-badge">MODO APRESENTAÇÃO (DEMO UPE)</span>}
      />
      <div className="admin-kpi-grid">
        <AdminKpiCard label="Receita Recorrente Mensal (MRR)" value={money(financials.mrr || 0, language)} detail={`+${financials.mrrGrowth || 0}% no último trimestre`} tone="green" />
        <AdminKpiCard label="Receita Anual Estimada (ARR)" value={money(financials.arr || 0, language)} detail="Projeção anual" />
        <AdminKpiCard label="Customer Acquisition Cost (CAC)" value={money(financials.cac || 0, language)} detail="Custo por instituição" tone="amber" />
        <AdminKpiCard label="Lifetime Value (LTV)" value={money(financials.ltv || 0, language)} detail="Valor do ciclo de vida" tone="teal" />
        <AdminKpiCard label="Universidades Ativas" value={growthMetrics.activeUniversities || 0} detail="Base LATAM" />
        <AdminKpiCard label="Capacidade Ocupada" value={`${growthMetrics.occupancyRate || 0}%`} detail={`${growthMetrics.totalStudents || 0} alunos ativos`} />
        <AdminKpiCard label="Saúde da Plataforma" value="99.9%" detail="Uptime últimos 30 dias" tone="green" />
        <AdminKpiCard label="Taxa de Cancelamento (Churn)" value={`${financials.churnRate || 0}%`} detail="Anualizado" tone="teal" />
      </div>

      <div className="admin-two-columns">
        <Card>
          <div className="admin-card-heading">
            <h2>Expansão LATAM (Market Share)</h2>
            <span>Visão territorial</span>
          </div>
          <HorizontalMetricList 
            data={marketShareRegions.map(r => ({ label: r.region, value: r.percentage, subtitle: 'Mercado' }))} 
            formatter={v => `${v}%`} 
          />
        </Card>
        <Card>
          <div className="admin-card-heading">
            <h2>Uso Global da Plataforma</h2>
            <span>Horas estudadas</span>
          </div>
          <HorizontalMetricList 
            data={(globalUsage.studyHours || []).map(s => ({ label: s.period, value: s.value }))} 
            formatter={v => `${Number(v).toLocaleString(language)}h`} 
          />
        </Card>
      </div>

      <div className="admin-two-columns">
        <Card>
          <div className="admin-card-heading">
            <h2>Pipeline de Oportunidades</h2>
            <span>{expansion.pipelineValue || "R$ 0"} no funil</span>
          </div>
          <div className="admin-stack">
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <div>
                <strong className="block text-clinicalWhite">Novos Mercados Alvo</strong>
                <span className="text-xs text-textMuted">{(expansion.targetMarkets || []).join(", ")}</span>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <div>
                <strong className="block text-clinicalWhite">Próximo Marco de Receita</strong>
                <span className="text-xs text-textMuted">{expansion.nextRevenueMilestone || "-"}</span>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="admin-card-heading">
            <h2>Adoção de Modelos 3D</h2>
            <span>Top 3 mais utilizados</span>
          </div>
          <HorizontalMetricList 
            data={(globalUsage.topModels || []).map(m => ({ label: m.model, value: m.accesses }))} 
            formatter={v => Number(v).toLocaleString(language)} 
          />
        </Card>
      </div>
    </>
  );
}

function Institution({ labels, language, dashboardData }) {
  const institution = dashboardData?.institution || emptyInstitution;
  const stats = dashboardData?.stats || {};
  const activeStudents = stats.activeStudents ?? institution.activeStudents;
  const inactiveStudents = stats.inactiveStudents ?? institution.inactiveStudents;
  const registeredStudents = stats.registeredStudents ?? institution.registeredStudents;
  const estimatedMonthlyRevenue = stats.estimatedRevenue ?? activeStudents * institution.pricePerStudent;

  return (
    <>
      <AdminSectionHeader eyebrow={labels.adminEyebrow} title={labels.institution} text={labels.institutionText} />
      <div className="admin-two-columns">
        <Card>
          <h2>{institution.name}</h2>
          <dl className="admin-definition-grid">
            {[
              ["Sigla", institution.abbreviation],
              ["Campus", institution.campus],
              ["País", institution.country],
              ["Cidade", institution.city],
              ["Tipo", institution.type],
              ["Curso principal", institution.course],
              [labels.licenseStatus, institution.licenseStatus],
              [labels.billingModel, institution.billingModel],
              [labels.unitValue, money(institution.pricePerStudent, language)],
              [labels.licenseStart, formatDate(institution.licenseStart || institution.createdAt, language)],
              [labels.nextRenewal, formatDate(institution.nextRenewal, language)],
              [labels.responsible, institution.institutionalResponsible],
              [labels.administrativeEmail, institution.administrativeEmail],
              [labels.contractNotes, institution.contractNotes]
            ].map(([term, description]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <div className="admin-stack">
          <LicenseCapacityBar labels={labels} language={language} institution={{ ...institution, registeredStudents }} />
          <Card>
            <h2>{labels.studentStatus}</h2>
            <HorizontalMetricList
              data={[
                { label: labels.activeStudents, value: activeStudents },
                { label: labels.inactiveStudents, value: inactiveStudents },
                { label: labels.pending, value: institution.pendingStudents },
                { label: labels.blocked, value: institution.blockedStudents },
                { label: labels.noAccessLast30, value: institution.noAccessLast30Days }
              ]}
              formatter={value => formatNumber(value, language)}
            />
          </Card>
        </div>
      </div>
      <div className="admin-kpi-grid">
        <AdminKpiCard label={labels.contractedCapacity} value={formatNumber(institution.contractedCapacity, language)} />
        <AdminKpiCard label={labels.registeredStudents} value={formatNumber(registeredStudents, language)} tone="teal" />
        <AdminKpiCard label={labels.activeStudents} value={formatNumber(activeStudents, language)} tone="green" />
        <AdminKpiCard label={labels.unitValue} value={money(institution.pricePerStudent, language)} />
        <AdminKpiCard label={labels.estimatedMonthlyRevenue} value={money(estimatedMonthlyRevenue, language)} />
        <AdminKpiCard label={labels.nextRenewal} value={formatDate(institution.nextRenewal, language)} tone="amber" />
      </div>
    </>
  );
}

function buildStudentGrowthFromRows(students, contractedCapacity) {
  const monthlyTotals = new Map();
  students.forEach(student => {
    if (!student.createdAt) return;
    const date = new Date(student.createdAt);
    if (Number.isNaN(date.getTime())) return;
    const period = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    monthlyTotals.set(period, (monthlyTotals.get(period) || 0) + 1);
  });

  let accumulated = 0;
  let previous = 0;
  const chartData = Array.from(monthlyTotals.entries()).map(([period, newStudents]) => {
    accumulated += newStudents;
    const growthPercent = previous ? ((newStudents - previous) / previous) * 100 : 0;
    previous = newStudents;
    return { period, newStudents, accumulated, growthPercent };
  });

  const currentMonthStudents = chartData.at(-1)?.newStudents || 0;
  const previousMonthStudents = chartData.at(-2)?.newStudents || Math.max(currentMonthStudents, 1);

  return {
    chartData,
    newStudentsThisMonth: currentMonthStudents,
    monthlyGrowthPercent: previousMonthStudents ? ((currentMonthStudents - previousMonthStudents) / previousMonthStudents) * 100 : 0,
    remainingSlots: Math.max(contractedCapacity - students.length, 0)
  };
}

function buildWeeklyEvolutionFromHistory(history = []) {
  const buckets = new Map();

  history.forEach(event => {
    if (!event.date) return;
    const date = new Date(event.date);
    if (Number.isNaN(date.getTime())) return;
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const weekNumber = Math.max(1, Math.ceil((((date - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7));
    const key = `Semana ${weekNumber}`;
    const current = buckets.get(key) || {
      week: key,
      accesses: 0,
      studyMinutes: 0,
      completedModels: 0
    };

    current.accesses += 1;
    current.studyMinutes += Number(event.durationMinutes) || 0;
    if (String(event.status || "").toLowerCase().includes("conclu")) current.completedModels += 1;
    buckets.set(key, current);
  });

  return Array.from(buckets.values()).slice(-4);
}

function buildStudentRadarData(student) {
  if (!student) return [];

  const totalAccesses = Number(student.totalAccesses) || 0;
  const totalStudyMinutes = Number(student.totalStudyMinutes) || 0;
  const studiedModels = Number(student.studiedModels) || 0;
  const performance = Number(student.performanceScore) || 0;

  return [
    { subject: "Frequência", value: Math.min(100, totalAccesses * 3) },
    { subject: "Tempo de estudo", value: Math.min(100, Math.round(totalStudyMinutes / 6)) },
    { subject: "Modelos concluídos", value: Math.min(100, studiedModels * 10) },
    { subject: "Diversidade", value: Math.min(100, (student.viewedContents?.length || studiedModels) * 12) },
    { subject: "Interação 3D", value: Math.min(100, totalAccesses * 4) },
    { subject: "Revisão", value: Math.min(100, Math.round(performance * 0.8)) },
    { subject: "Engajamento", value: Math.min(100, performance) }
  ];
}

function Students({ labels, language, notify, dashboardData, students, onSelectStudent, onExport, onExportStudent, onReviewPending }) {
  const realStudents = ["restricted", "supabase", "demo_upe"].includes(dashboardData?.source)
    ? students || []
    : [];
  const stats = dashboardData?.stats || {};
  const institution = dashboardData?.institution || emptyInstitution;
  const isRealSource = dashboardData?.source === "supabase";
  const isRestrictedSource = dashboardData?.source === "restricted";
  const realGrowth = useMemo(() => buildStudentGrowthFromRows(realStudents, stats.contractedCapacity || institution.contractedCapacity || 0), [realStudents, stats.contractedCapacity, institution.contractedCapacity]);
  const daysElapsedThisMonth = Math.max(new Date().getDate(), 1);
  const averageDailyRegistrations = realGrowth.newStudentsThisMonth
    ? Math.round(realGrowth.newStudentsThisMonth / daysElapsedThisMonth)
    : 0;
  const licenseFullForecast = averageDailyRegistrations > 0 && realGrowth.remainingSlots > 0
    ? new Date(Date.now() + Math.ceil(realGrowth.remainingSlots / averageDailyRegistrations) * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
    : "-";
  const isDemoUpeSource = dashboardData?.source === "demo_upe";
  const realtime = (isRealSource || isDemoUpeSource) ? {
    registeredStudents: stats.registeredStudents ?? realStudents.length,
    contractedCapacity: stats.contractedCapacity ?? institution.contractedCapacity,
    activeStudents: stats.activeStudents ?? realStudents.filter(student => student.status === "ativo").length,
    inactiveStudents: stats.inactiveStudents ?? realStudents.filter(student => student.status === "inativo").length,
    occupancyRate: stats.occupancyRate ?? ((realStudents.length / (institution.contractedCapacity || 1)) * 100),
    remainingSlots: stats.contractedCapacity ? stats.contractedCapacity - (stats.registeredStudents ?? 0) : realGrowth.remainingSlots,
    newStudentsThisMonth: stats.newStudentsThisMonth ?? realGrowth.newStudentsThisMonth,
    monthlyGrowthPercent: stats.monthlyGrowthPercent ?? realGrowth.monthlyGrowthPercent,
    chartData: realGrowth.chartData,
    lastUpdated: new Date(dashboardData?.lastUpdated || Date.now()).toLocaleTimeString("pt-BR")
  } : isRestrictedSource ? {
    registeredStudents: 0,
    contractedCapacity: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    occupancyRate: 0,
    remainingSlots: 0,
    newStudentsThisMonth: 0,
    monthlyGrowthPercent: 0,
    chartData: [],
    lastUpdated: new Date(dashboardData?.lastUpdated || Date.now()).toLocaleTimeString("pt-BR")
  } : {
    registeredStudents: 0,
    contractedCapacity: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    occupancyRate: 0,
    remainingSlots: 0,
    newStudentsThisMonth: 0,
    monthlyGrowthPercent: 0,
    chartData: [],
    lastUpdated: new Date(dashboardData?.lastUpdated || Date.now()).toLocaleTimeString("pt-BR")
  };
  const occupancyText = pct(realtime.occupancyRate);
  const monthlyGrowthText = `${realtime.monthlyGrowthPercent >= 0 ? "+" : ""}${realtime.monthlyGrowthPercent.toFixed(1).replace(".", ",")}%`;
  const pendingRegistrations = realStudents
    .filter(student => ["pendente", "pending"].includes(String(student.status || "").toLowerCase()))
    .slice(0, 8);

  function toggleStudentStatus(student) {
    const action = student.status === "bloqueado" ? "desbloqueio" : "bloqueio";
    notify(`${student.name}: ${action} preparado para backend institucional.`);
  }

  return (
    <>
      <AdminSectionHeader
        eyebrow={labels.adminEyebrow}
        title={labels.students}
        text={`${labels.studentsText} · ${institution.displayName || institution.name || "Nenhum dado encontrado"}`}
        actions={
          <div className="student-table-actions">
            <span className="students-realtime-badge">{isRealSource ? "Supabase real" : isRestrictedSource ? "Tenant restrito" : "Nenhum dado real"} · {realtime.lastUpdated}</span>
            <button type="button" onClick={onExport}>Exportar lista de alunos CSV</button>
          </div>
        }
      />

      <div className="admin-kpi-grid">
        <AdminKpiCard label="Total cadastrado" value={formatNumber(realtime.registeredStudents, language)} detail="alunos" tone="teal" />
        <AdminKpiCard label="Capacidade contratada" value={formatNumber(realtime.contractedCapacity, language)} detail="acessos contratados" />
        <AdminKpiCard label="Vagas restantes" value={formatNumber(realtime.remainingSlots, language)} detail="acessos disponíveis" tone={realtime.remainingSlots <= 50 ? "amber" : "green"} />
        <AdminKpiCard label="Alunos ativos" value={formatNumber(realtime.activeStudents, language)} detail="ativos no mês" tone="green" />
        <AdminKpiCard label="Alunos inativos" value={formatNumber(realtime.inactiveStudents, language)} detail="atenção acadêmica" tone="amber" />
        <AdminKpiCard label="Taxa de ocupação" value={occupancyText} detail={`${formatNumber(realtime.registeredStudents, language)} / ${formatNumber(realtime.contractedCapacity, language)}`} />
        <AdminKpiCard label="Novos cadastros no mês" value={formatNumber(realtime.newStudentsThisMonth, language)} detail="entrada mensal" tone="teal" />
        <AdminKpiCard label="Crescimento mensal" value={monthlyGrowthText} detail="comparado ao período anterior" tone="green" />
      </div>

      <Card className="table-card p-0">
        <div className="p-5">
          <div className="admin-card-heading">
            <h2>Novos cadastros pendentes</h2>
            <span>{formatNumber(pendingRegistrations.length, language)} aguardando aprovação institucional</span>
          </div>

          {pendingRegistrations.length ? (
            <div className="table-scroll">
              <table className="admin-table text-left text-sm">
                <thead>
                  <tr>
                    {["Nome", "E-mail", "Matrícula/R.A.", "Curso", "Semestre", "Data de cadastro", "Ações"].map(item => <th key={item}>{item}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {pendingRegistrations.map(student => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.registration}</td>
                      <td>{student.course}</td>
                      <td>{student.semester}</td>
                      <td>{student.createdAt || "-"}</td>
                      <td>
                        <div className="student-row-actions">
                          <button type="button" className="table-action" onClick={() => onReviewPending(student, "approve")}>
                            Aprovar
                          </button>
                          <button type="button" className="table-action table-action--danger" onClick={() => onReviewPending(student, "reject")}>
                            Rejeitar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-textMuted">Nenhum cadastro pendente encontrado na instituição selecionada.</p>
          )}
        </div>
      </Card>

      <div className="students-intelligence-grid">
        <Card>
          <div className="admin-card-heading">
            <h2>{labels.growthTitle}</h2>
            <span>{monthlyGrowthText} no período atual</span>
          </div>
          <StudentGrowthBarChart data={realtime.chartData} formatNumber={value => formatNumber(value, language)} />
        </Card>
        <Card>
          <div className="admin-card-heading">
            <h2>Resumo coletivo</h2>
            <span>{institution.displayName || institution.name || "Nenhum dado encontrado"}</span>
          </div>
          <LicenseBar
            registeredStudents={realtime.registeredStudents}
            contractedCapacity={realtime.contractedCapacity}
            occupancyRate={realtime.occupancyRate}
            formatNumber={value => formatNumber(value, language)}
          />
          <div className="admin-kpi-grid compact mt-5">
            <AdminKpiCard label={labels.averageDailyRegistrations} value={formatNumber(averageDailyRegistrations, language)} tone="teal" />
            <AdminKpiCard label={labels.licenseFullForecast} value={licenseFullForecast} tone="amber" />
            <AdminKpiCard label={labels.remainingCapacity} value={formatNumber(realtime.remainingSlots, language)} />
          </div>
        </Card>
      </div>

      <Card className="table-card p-0">
        <div className="p-5">
          <div className="admin-card-heading">
            <h2>Tabela completa de alunos</h2>
            <span>Busca, filtros, histórico, desempenho e exportação</span>
          </div>
          <InstitutionStudentsTable
            students={realStudents}
            formatNumber={value => formatNumber(value, language)}
            onOpenHistory={onSelectStudent}
            onOpenPerformance={onSelectStudent}
            onExportStudent={onExportStudent}
            onToggleStatus={toggleStudentStatus}
          />
        </div>
      </Card>
    </>
  );
}

function Analytics({ labels, language }) {
  const overviewMetrics = emptyOverviewMetrics;
  const dailyAccessData = [];
  const hourlyAccessData = [];
  const systemUsageData = [];
  const deviceSessions = [];
  const monthlyUsageEvolution = [];
  const platformErrorData = [];
  return (
    <>
      <AdminSectionHeader eyebrow={labels.adminEyebrow} title={labels.analytics} text={labels.analyticsText} />
      <div className="admin-kpi-grid">
        <AdminKpiCard label={labels.activeNow} value={formatNumber(overviewMetrics.activeNow, language)} tone="green" />
        <AdminKpiCard label={labels.accessesToday} value={formatNumber(overviewMetrics.accessesToday, language)} tone="teal" />
        <AdminKpiCard label={labels.accessesThisMonth} value={formatNumber(overviewMetrics.accessesThisMonth, language)} />
        <AdminKpiCard label={labels.avgSession} value={`${overviewMetrics.averageSessionMinutes} min`} />
        <AdminKpiCard label={labels.totalStudyTime} value={`${formatNumber(overviewMetrics.totalStudyHoursThisMonth, language)}h`} />
        <AdminKpiCard label={labels.returnRate} value={`${overviewMetrics.returnRate}%`} tone="green" />
        <AdminKpiCard label={labels.peakHour} value={overviewMetrics.peakHour} />
        <AdminKpiCard label={labels.peakDay} value={overviewMetrics.peakDay} />
        <AdminKpiCard label={labels.completionRate} value={`${overviewMetrics.completionRate}%`} tone="teal" />
      </div>
      <div className="admin-chart-grid">
        <Card><h2>{labels.dailyAccess}</h2><BarList data={dailyAccessData.slice(-12)} formatter={value => formatNumber(value, language)} /></Card>
        <Card><h2>{labels.hourlyAccess}</h2><BarList data={hourlyAccessData} formatter={value => formatNumber(value, language)} color="gold" /></Card>
        <Card><h2>{labels.systemStudy}</h2><HorizontalMetricList data={systemUsageData} formatter={value => `${formatNumber(value, language)}h`} /></Card>
        <Card><h2>{labels.devices}</h2><HorizontalMetricList data={deviceSessions} formatter={value => `${value}%`} /></Card>
        <Card><h2>{labels.monthlyEvolution}</h2><BarList data={monthlyUsageEvolution} formatter={value => formatNumber(value, language)} /></Card>
        <Card><h2>{labels.errorChart}</h2><HorizontalMetricList data={platformErrorData} formatter={value => formatNumber(value, language)} /></Card>
      </div>
      <PlatformHealthPanel labels={labels} language={language} />
    </>
  );
}

function PlatformHealthPanel({ labels, language }) {
  const platformHealth = emptyPlatformHealth;
  const platformIncidents = [];
  return (
    <Card className="admin-health-panel">
      <div className="admin-card-heading">
        <h2>{labels.platformHealth}</h2>
        <span className="admin-health-online">{platformHealth.status}</span>
      </div>
      <div className="admin-kpi-grid compact">
        <AdminKpiCard label={labels.uptime} value={`${platformHealth.uptimePercent}%`} tone="green" />
        <AdminKpiCard label={labels.incidents} value={platformHealth.incidentsThisMonth} tone="amber" />
        <AdminKpiCard label={labels.downtime} value={`${platformHealth.totalDowntimeMinutes} min`} tone="amber" />
        <AdminKpiCard label={labels.affectedUsers} value={platformHealth.affectedUsers} />
        <AdminKpiCard label={labels.avgResponse} value={`${platformHealth.averageResponseTimeMs} ms`} tone="teal" />
        <AdminKpiCard label={labels.sketchfabErrors} value={platformHealth.sketchfabLoadErrors} tone="amber" />
        <AdminKpiCard label={labels.loginErrors} value={platformHealth.loginErrors} tone="amber" />
        <AdminKpiCard label={labels.reportErrors} value={platformHealth.reportExportErrors} />
        <AdminKpiCard label={labels.lastIncident} value={platformHealth.lastIncident} />
      </div>
      <div className="table-scroll mt-5">
        <table className="admin-table text-left text-sm">
          <thead><tr>{[labels.date, labels.time, labels.module, labels.error, labels.duration, labels.affectedUsers, labels.status, labels.note].map(item => <th key={item}>{item}</th>)}</tr></thead>
          <tbody>
            {platformIncidents.map(item => (
              <tr key={`${item.date}-${item.time}`}>
                <td>{item.date}</td><td>{item.time}</td><td>{item.module}</td><td>{item.errorType}</td><td>{item.duration}</td><td>{formatNumber(item.affectedUsers, language)}</td><td>{item.status}</td><td>{item.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Billing({ labels, language, dashboardData }) {
  const institution = dashboardData?.institution || emptyInstitution;
  const stats = dashboardData?.stats || {};
  const registeredStudents = stats.registeredStudents ?? institution.registeredStudents;
  const activeStudents = stats.activeStudents ?? institution.activeStudents;
  const contractedCapacity = stats.contractedCapacity ?? institution.contractedCapacity;
  const pricePerStudent = institution.pricePerStudent || 0;
  const registeredBilling = registeredStudents * pricePerStudent;
  const activeBilling = activeStudents * pricePerStudent;
  const contractedBilling = contractedCapacity * pricePerStudent;
  const annualRevenue = activeBilling * 12;
  const operationalCost = annualRevenue * 0.15;
  const ebitda = annualRevenue - operationalCost;
  const ebitdaMargin = annualRevenue ? (ebitda / annualRevenue) * 100 : 0;
  const billingScenarios = [
    { name: labels.registeredStudents, activeStudents: registeredStudents, annualRevenue: registeredBilling * 12 },
    { name: labels.activeStudents, activeStudents, annualRevenue: activeBilling * 12 },
    { name: labels.contractedCapacity, activeStudents: contractedCapacity, annualRevenue: contractedBilling * 12 }
  ];
  const billingProjectionData = [
    { period: labels.monthly, realistic: activeBilling },
    { period: labels.semesterRevenue, realistic: activeBilling * 6 },
    { period: labels.annual, realistic: activeBilling * 12 }
  ];
  return (
    <>
      <AdminSectionHeader eyebrow={labels.adminEyebrow} title={labels.billing} text={labels.billingText} />
      <div className="admin-kpi-grid">
        <AdminKpiCard label={labels.registeredBilling} value={money(registeredBilling, language)} detail={`${registeredStudents} x ${money(pricePerStudent, language)}`} />
        <AdminKpiCard label={labels.activeBilling} value={money(activeBilling, language)} detail={`${activeStudents} x ${money(pricePerStudent, language)}`} tone="teal" />
        <AdminKpiCard label={labels.contractedBilling} value={money(contractedBilling, language)} detail={`${contractedCapacity} x ${money(pricePerStudent, language)}`} />
        <AdminKpiCard label={labels.semesterRevenue} value={money(activeBilling * 6, language)} />
        <AdminKpiCard label={labels.annual} value={money(activeBilling * 12, language)} />
        <AdminKpiCard label={labels.unusedPotential} value={money((contractedCapacity - activeStudents) * pricePerStudent, language)} tone="amber" />
      </div>
      <div className="admin-two-columns">
        <Card><h2>{labels.scenarios}</h2><HorizontalMetricList data={billingScenarios.map(item => ({ label: item.name, value: item.annualRevenue, subtitle: `${item.activeStudents} alunos` }))} formatter={value => money(value, language)} /></Card>
        <Card><h2>{labels.monthly}</h2><BarList data={billingProjectionData} valueKey="realistic" formatter={value => money(value, language)} color="gold" /></Card>
      </div>
      <Card>
        <h2>{labels.strategicIndicators}</h2>
        <div className="admin-kpi-grid compact">
          <AdminKpiCard label={labels.annualRevenue} value={money(annualRevenue, language)} wide />
          <AdminKpiCard label={labels.operationalCost} value={money(operationalCost, language)} tone="amber" wide />
          <AdminKpiCard label={labels.ebitda} value={money(ebitda, language)} tone="green" wide />
          <AdminKpiCard label={labels.ebitdaMargin} value={pct(ebitdaMargin)} tone="green" />
          <AdminKpiCard label={labels.payback} value="-" tone="teal" />
          <AdminKpiCard label={labels.roi} value="-" tone="green" />
          <AdminKpiCard label={labels.expansionCapacity} value={dashboardData?.institutions?.length ? formatNumber(dashboardData.institutions.length, language) : "-"} />
        </div>
      </Card>
    </>
  );
}

function Reports({ labels, language, dashboardData, onExport, onPrint }) {
  const institution = dashboardData?.institution || emptyInstitution;
  const stats = dashboardData?.stats || {};
  const realtimeOverviewMetrics = dashboardData?.overviewMetrics || emptyOverviewMetrics;
  const realtimeMostAccessedModels = dashboardData?.mostAccessedModels || [];
  const realtimePlatformHealth = dashboardData?.platformHealth || emptyPlatformHealth;
  const platformErrorData = dashboardData?.analytics?.platformErrorsData || [];
  const executiveReportObservations = dashboardData?.source === "supabase"
    ? ["Relatório gerado exclusivamente com dados reais disponíveis no Supabase."]
    : ["Nenhum dado real disponível para relatório executivo."];
  const registeredStudents = stats.registeredStudents ?? institution.registeredStudents;
  const activeStudents = stats.activeStudents ?? institution.activeStudents;
  const contractedCapacity = stats.contractedCapacity ?? institution.contractedCapacity;
  const estimatedMonthlyRevenue = stats.estimatedRevenue ?? activeStudents * institution.pricePerStudent;

  return (
    <section className="report-page">
      <AdminSectionHeader
        eyebrow={labels.adminEyebrow}
        title={labels.reports}
        text={labels.reportsText}
        actions={
          <div className="report-actions">
            <Button variant="outline" onClick={onExport}>{labels.exportCsv}</Button>
            <Button variant="ghost" onClick={onPrint}>{labels.printReport}</Button>
          </div>
        }
      />
      <Card className="report-card">
        <h2>{labels.reportFilters}</h2>
        <div className="admin-filter-grid">
          <input type="date" aria-label={labels.initialPeriod} />
          <input type="date" aria-label={labels.finalPeriod} />
          <select defaultValue="mensal"><option value="mensal">mensal</option><option value="semestral">semestral</option><option value="anual">anual</option></select>
          <select value={institution.id || ""} onChange={() => {}}>
            <option value={institution.id || ""}>{institution.displayName || institution.name || "Nenhum dado encontrado"}</option>
          </select>
        </div>
      </Card>
      <div className="admin-kpi-grid">
        <AdminKpiCard label={labels.contractedCapacity} value={formatNumber(contractedCapacity, language)} />
        <AdminKpiCard label={labels.registeredStudents} value={formatNumber(registeredStudents, language)} />
        <AdminKpiCard label={labels.activeStudents} value={formatNumber(activeStudents, language)} tone="green" />
        <AdminKpiCard label={labels.totalAccesses} value={formatNumber(realtimeOverviewMetrics.accessesThisMonth, language)} />
        <AdminKpiCard label={labels.totalStudyTime} value={`${formatNumber(realtimeOverviewMetrics.totalStudyHoursThisMonth, language)}h`} />
        <AdminKpiCard label={labels.estimatedMonthlyRevenue} value={money(estimatedMonthlyRevenue, language)} />
      </div>
      <div className="admin-two-columns">
        <Card className="report-card"><h2>{labels.mostAccessedContent}</h2><HorizontalMetricList data={realtimeMostAccessedModels.map(item => ({ label: item.title, value: item.accesses }))} formatter={value => formatNumber(value, language)} /></Card>
        <Card className="report-card"><h2>{labels.platformHealth}</h2><p className="admin-report-health">{realtimePlatformHealth.status} · {realtimePlatformHealth.uptimePercent}% uptime · {realtimePlatformHealth.incidentsThisMonth} incidentes</p><HorizontalMetricList data={platformErrorData} formatter={value => formatNumber(value, language)} /></Card>
      </div>
      <Card className="report-card">
        <h2>{labels.observations}</h2>
        <ul className="admin-observation-list">{executiveReportObservations.map(item => <li key={item}>{item}</li>)}</ul>
      </Card>
      <div className="report-actions">
        <Button variant="primary" onClick={onPrint}>{labels.exportPdf}</Button>
        <Button variant="outline" onClick={onExport}>{labels.exportCsv}</Button>
        <Button variant="ghost">{labels.exportFinancial}</Button>
        <Button variant="ghost">{labels.exportAcademic}</Button>
        <Button variant="teal">{labels.generateExecutive}</Button>
      </div>
    </section>
  );
}

function Settings({ labels }) {
  return (
    <>
      <AdminSectionHeader eyebrow={labels.adminEyebrow} title={labels.settings} text="Preferências administrativas preparadas para backend real, permissões e integração institucional." />
      <Card>
        <h2>Configurações administrativas</h2>
        <p className="mt-3 text-textMuted">Estrutura pronta para conectar permissões, responsáveis, domínios acadêmicos e integrações futuras.</p>
      </Card>
    </>
  );
}
