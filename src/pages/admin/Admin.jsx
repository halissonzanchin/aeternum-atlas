import { useMemo, useState } from "react";
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
  billingProjectionData,
  billingScenarios,
  dailyAccessData,
  deviceSessions,
  executiveReportObservations,
  hourlyAccessData,
  monthlyUsageEvolution,
  mostAccessedModels,
  overviewMetrics,
  platformErrorData,
  platformHealth,
  platformIncidents,
  studentAccessHistory,
  studentRadarData,
  systemUsageData,
  upeInstitution
} from "../../data/adminMockData";
import {
  defaultStudentHistory,
  mockStudents as institutionStudents,
  studentAccessHistory as institutionStudentAccessHistory,
  studentEnrollmentStats,
  studentGrowthData as institutionStudentGrowthData,
  studentRadarData as institutionStudentRadarData,
  studentWeeklyEvolution as institutionStudentWeeklyEvolution
} from "../../data/mockStudents";
import useRealtimeStudentGrowth from "../../hooks/useRealtimeStudentGrowth";
import { formatCurrency, formatDate, formatNumber } from "../../utils/formatLocale";
import GlobalAnalyticsPage from "./GlobalAnalyticsPage";
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
    overviewText: "Resumo consolidado da operação UPE Presidente Franco, com capacidade, uso, saúde e valor institucional.",
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
    semester: "Receita semestral estimada",
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
  models: "analytics",
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

function AdminKpiCard({ label, value, detail, tone = "gold" }) {
  return (
    <Card className={`admin-kpi-card admin-kpi-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
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

function LicenseCapacityBar({ labels, language }) {
  const available = upeInstitution.contractedCapacity - upeInstitution.registeredStudents;
  const occupancy = (upeInstitution.registeredStudents / upeInstitution.contractedCapacity) * 100;
  return (
    <Card className="admin-license-card">
      <div className="admin-card-heading">
        <h2>{labels.licenseOccupancy}</h2>
        <strong>{pct(occupancy)}</strong>
      </div>
      <div className="admin-license-track" aria-label={labels.licenseOccupancy}>
        <div style={{ width: `${occupancy}%` }} />
      </div>
      <div className="admin-license-split">
        <span>{labels.used}: {formatNumber(upeInstitution.registeredStudents, language)}</span>
        <span>{labels.available}: {formatNumber(available, language)}</span>
        <span>{labels.totalCapacity}: {formatNumber(upeInstitution.contractedCapacity, language)}</span>
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
            <StudentRadarChart data={studentRadarData} />
          </Card>
          <Card className="table-card p-0">
            <div className="table-scroll">
              <table className="admin-table text-left text-sm">
                <thead><tr>{[labels.date, labels.time, labels.eventType, labels.model, labels.duration, labels.action].map(item => <th key={item}>{item}</th>)}</tr></thead>
                <tbody>
                  {studentAccessHistory.map((event, index) => (
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

export default function Admin({ section = "overview", path = window.location.pathname, navigate, notify = () => {} }) {
  const { language, t } = useLanguage();
  const labels = copy[language] || copy.pt;
  const current = sectionRoutes[section] || "overview";
  const [selectedStudent, setSelectedStudent] = useState(null);
  const navigationBase = path.startsWith("/admin") || path.startsWith("/institution-admin") ? "/admin" : "/super-admin";
  const topNavigationItems = getAdminNavigationItems(navigationBase);

  function exportStudentsCsv() {
    downloadCsv("aeternum-upe-alunos.csv", [
      [labels.name, labels.email, labels.registration, labels.course, labels.semester, labels.status, labels.lastAccess, labels.totalAccesses, labels.totalStudyTimeStudent, labels.performance],
      ...institutionStudents.map(student => [student.name, student.email, student.registration, student.course, student.semester, student.status, student.lastAccess, student.totalAccesses, student.totalStudyMinutes, `${student.performanceScore}%`])
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
    const history = institutionStudentAccessHistory[student.id] || defaultStudentHistory;
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

      {current === "overview" && <Overview labels={labels} language={language} />}
      {current === "institution" && <Institution labels={labels} language={language} />}
      {current === "students" && <Students labels={labels} language={language} notify={notify} onSelectStudent={setSelectedStudent} onExport={exportStudentsCsv} onExportStudent={exportStudentCsv} />}
      {current === "analytics" && <GlobalAnalyticsPage language={language} notify={notify} />}
      {current === "billing" && <Billing labels={labels} language={language} />}
      {current === "reports" && <Reports labels={labels} language={language} onExport={exportStudentsCsv} onPrint={printReport} />}
      {current === "settings" && <Settings labels={labels} />}

      <StudentHistoryModal
        student={selectedStudent}
        history={selectedStudent ? institutionStudentAccessHistory[selectedStudent.id] || defaultStudentHistory : []}
        weeklyEvolution={institutionStudentWeeklyEvolution}
        radarData={institutionStudentRadarData}
        onClose={() => setSelectedStudent(null)}
        onExportHistory={exportStudentHistoryCsv}
        onPrintStudent={printStudentAnalysis}
      />
    </section>
  );
}

function Overview({ labels, language }) {
  const registeredStudents = upeInstitution.registeredStudents;
  const activeStudents = upeInstitution.activeStudents;
  const inactiveStudents = upeInstitution.inactiveStudents;
  const contractedCapacity = upeInstitution.contractedCapacity;
  const pricePerStudent = upeInstitution.pricePerStudent;
  const occupancyRate = (registeredStudents / contractedCapacity) * 100;
  const estimatedRevenue = activeStudents * pricePerStudent;
  const maxRevenue = contractedCapacity * pricePerStudent;
  const lostRevenue = maxRevenue - estimatedRevenue;
  const usageData = [
    { day: "01", access: 120 },
    { day: "02", access: 180 },
    { day: "03", access: 160 },
    { day: "04", access: 220 },
    { day: "05", access: 280 },
    { day: "06", access: 320 },
    { day: "07", access: 290 }
  ];

  return (
    <>
      <AdminSectionHeader eyebrow={labels.adminEyebrow} title={labels.overview} text={labels.overviewText} />
      <div className="admin-kpi-grid">
        <AdminKpiCard label={labels.contractedCapacity} value={formatNumber(contractedCapacity, language)} detail={labels.studentsUnit} />
        <AdminKpiCard label={labels.registeredStudents} value={formatNumber(registeredStudents, language)} detail="UPE Presidente Franco" tone="teal" />
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
            <span>{labels.accessesToday}: {formatNumber(overviewMetrics.accessesToday, language)}</span>
          </div>
          <UsageLineChart data={usageData} />
        </Card>
        <Card>
          <div className="admin-card-heading">
            <h2>{labels.mostAccessedModels}</h2>
            <span>{labels.completionRate}: {overviewMetrics.completionRate}%</span>
          </div>
          <HorizontalMetricList data={mostAccessedModels.map(item => ({ label: item.title, value: item.accesses, subtitle: `${item.studyHours}h` }))} formatter={value => formatNumber(value, language)} />
        </Card>
      </div>

      <div className="admin-two-columns">
        <Card>
          <PlatformStatus status="online" uptime={99.8} downtime={18} lastIncident="2026-04-27" />
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

function Institution({ labels, language }) {
  return (
    <>
      <AdminSectionHeader eyebrow={labels.adminEyebrow} title={labels.institution} text={labels.institutionText} />
      <div className="admin-two-columns">
        <Card>
          <h2>{upeInstitution.name}</h2>
          <dl className="admin-definition-grid">
            {[
              ["Sigla", upeInstitution.abbreviation],
              ["Campus", upeInstitution.campus],
              ["País", upeInstitution.country],
              ["Cidade", upeInstitution.city],
              ["Tipo", upeInstitution.type],
              ["Curso principal", upeInstitution.course],
              [labels.licenseStatus, upeInstitution.licenseStatus],
              [labels.billingModel, upeInstitution.billingModel],
              [labels.unitValue, money(upeInstitution.pricePerStudent, language)],
              [labels.licenseStart, formatDate(upeInstitution.licenseStart, language)],
              [labels.nextRenewal, formatDate(upeInstitution.nextRenewal, language)],
              [labels.responsible, upeInstitution.institutionalResponsible],
              [labels.administrativeEmail, upeInstitution.administrativeEmail],
              [labels.contractNotes, upeInstitution.contractNotes]
            ].map(([term, description]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <div className="admin-stack">
          <LicenseCapacityBar labels={labels} language={language} />
          <Card>
            <h2>{labels.studentStatus}</h2>
            <HorizontalMetricList
              data={[
                { label: labels.activeStudents, value: upeInstitution.activeStudents },
                { label: labels.inactiveStudents, value: upeInstitution.inactiveStudents },
                { label: labels.pending, value: upeInstitution.pendingStudents },
                { label: labels.blocked, value: upeInstitution.blockedStudents },
                { label: labels.noAccessLast30, value: upeInstitution.noAccessLast30Days }
              ]}
              formatter={value => formatNumber(value, language)}
            />
          </Card>
        </div>
      </div>
      <div className="admin-kpi-grid">
        <AdminKpiCard label={labels.contractedCapacity} value={formatNumber(upeInstitution.contractedCapacity, language)} />
        <AdminKpiCard label={labels.registeredStudents} value={formatNumber(upeInstitution.registeredStudents, language)} tone="teal" />
        <AdminKpiCard label={labels.activeStudents} value={formatNumber(upeInstitution.activeStudents, language)} tone="green" />
        <AdminKpiCard label={labels.unitValue} value={money(upeInstitution.pricePerStudent, language)} />
        <AdminKpiCard label={labels.estimatedMonthlyRevenue} value={money(upeInstitution.activeStudents * upeInstitution.pricePerStudent, language)} />
        <AdminKpiCard label={labels.nextRenewal} value={formatDate(upeInstitution.nextRenewal, language)} tone="amber" />
      </div>
    </>
  );
}

function Students({ labels, language, notify, onSelectStudent, onExport, onExportStudent }) {
  const realtime = useRealtimeStudentGrowth(studentEnrollmentStats, institutionStudentGrowthData);
  const occupancyText = pct(realtime.occupancyRate);
  const monthlyGrowthText = `+${realtime.monthlyGrowthPercent.toFixed(1).replace(".", ",")}%`;

  function toggleStudentStatus(student) {
    const action = student.status === "bloqueado" ? "desbloqueio" : "bloqueio";
    notify(`${student.name}: ${action} preparado para backend institucional.`);
  }

  return (
    <>
      <AdminSectionHeader
        eyebrow={labels.adminEyebrow}
        title={labels.students}
        text={`${labels.studentsText} · ${studentEnrollmentStats.institutionName} · ${studentEnrollmentStats.campus}`}
        actions={
          <div className="student-table-actions">
            <span className="students-realtime-badge">Atualizado agora · {realtime.lastUpdated}</span>
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
            <span>Capacidade UPE</span>
          </div>
          <LicenseBar
            registeredStudents={realtime.registeredStudents}
            contractedCapacity={realtime.contractedCapacity}
            occupancyRate={realtime.occupancyRate}
            formatNumber={value => formatNumber(value, language)}
          />
          <div className="admin-kpi-grid compact mt-5">
            <AdminKpiCard label={labels.averageDailyRegistrations} value="49" tone="teal" />
            <AdminKpiCard label={labels.licenseFullForecast} value="Maio/2026" tone="amber" />
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
            students={institutionStudents}
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

function Billing({ labels, language }) {
  const registeredBilling = upeInstitution.registeredStudents * upeInstitution.pricePerStudent;
  const activeBilling = upeInstitution.activeStudents * upeInstitution.pricePerStudent;
  const contractedBilling = upeInstitution.contractedCapacity * upeInstitution.pricePerStudent;
  const annualRevenue = billingScenarios[2].annualRevenue;
  const operationalCost = annualRevenue * 0.15;
  const ebitda = annualRevenue - operationalCost;
  const ebitdaMargin = (ebitda / annualRevenue) * 100;
  return (
    <>
      <AdminSectionHeader eyebrow={labels.adminEyebrow} title={labels.billing} text={labels.billingText} />
      <div className="admin-kpi-grid">
        <AdminKpiCard label={labels.registeredBilling} value={money(registeredBilling, language)} detail={`${upeInstitution.registeredStudents} x R$ 50`} />
        <AdminKpiCard label={labels.activeBilling} value={money(activeBilling, language)} detail={`${upeInstitution.activeStudents} x R$ 50`} tone="teal" />
        <AdminKpiCard label={labels.contractedBilling} value={money(contractedBilling, language)} detail={`${upeInstitution.contractedCapacity} x R$ 50`} />
        <AdminKpiCard label={labels.semester} value={money(activeBilling * 6, language)} />
        <AdminKpiCard label={labels.annual} value={money(activeBilling * 12, language)} />
        <AdminKpiCard label={labels.unusedPotential} value={money((upeInstitution.contractedCapacity - upeInstitution.activeStudents) * upeInstitution.pricePerStudent, language)} tone="amber" />
      </div>
      <div className="admin-two-columns">
        <Card><h2>{labels.scenarios}</h2><HorizontalMetricList data={billingScenarios.map(item => ({ label: item.name, value: item.annualRevenue, subtitle: `${item.activeStudents} alunos` }))} formatter={value => money(value, language)} /></Card>
        <Card><h2>{labels.monthly}</h2><BarList data={billingProjectionData} valueKey="realistic" formatter={value => money(value, language)} color="gold" /></Card>
      </div>
      <Card>
        <h2>{labels.strategicIndicators}</h2>
        <div className="admin-kpi-grid compact">
          <AdminKpiCard label={labels.annualRevenue} value={money(annualRevenue, language)} />
          <AdminKpiCard label={labels.operationalCost} value={money(operationalCost, language)} tone="amber" />
          <AdminKpiCard label={labels.ebitda} value={money(ebitda, language)} tone="green" />
          <AdminKpiCard label={labels.ebitdaMargin} value={pct(ebitdaMargin)} tone="green" />
          <AdminKpiCard label={labels.payback} value="4-6 meses" tone="teal" />
          <AdminKpiCard label={labels.roi} value="> 300%" tone="green" />
          <AdminKpiCard label={labels.expansionCapacity} value="Multi-campus" />
        </div>
      </Card>
    </>
  );
}

function Reports({ labels, language, onExport, onPrint }) {
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
          <input type="date" aria-label={labels.initialPeriod} defaultValue="2026-04-01" />
          <input type="date" aria-label={labels.finalPeriod} defaultValue="2026-04-30" />
          <select defaultValue="mensal"><option value="mensal">mensal</option><option value="semestral">semestral</option><option value="anual">anual</option></select>
          <select defaultValue="upe"><option value="upe">UPE Presidente Franco</option></select>
        </div>
      </Card>
      <div className="admin-kpi-grid">
        <AdminKpiCard label={labels.contractedCapacity} value={formatNumber(upeInstitution.contractedCapacity, language)} />
        <AdminKpiCard label={labels.registeredStudents} value={formatNumber(upeInstitution.registeredStudents, language)} />
        <AdminKpiCard label={labels.activeStudents} value={formatNumber(upeInstitution.activeStudents, language)} tone="green" />
        <AdminKpiCard label={labels.totalAccesses} value={formatNumber(overviewMetrics.accessesThisMonth, language)} />
        <AdminKpiCard label={labels.totalStudyTime} value={`${formatNumber(overviewMetrics.totalStudyHoursThisMonth, language)}h`} />
        <AdminKpiCard label={labels.estimatedMonthlyRevenue} value={money(upeInstitution.activeStudents * upeInstitution.pricePerStudent, language)} />
      </div>
      <div className="admin-two-columns">
        <Card className="report-card"><h2>{labels.mostAccessedContent}</h2><HorizontalMetricList data={mostAccessedModels.map(item => ({ label: item.title, value: item.accesses }))} formatter={value => formatNumber(value, language)} /></Card>
        <Card className="report-card"><h2>{labels.platformHealth}</h2><p className="admin-report-health">{platformHealth.status} · {platformHealth.uptimePercent}% uptime · {platformHealth.incidentsThisMonth} incidentes</p><HorizontalMetricList data={platformErrorData} formatter={value => formatNumber(value, language)} /></Card>
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
