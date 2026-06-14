import { useState } from "react";
import Card from "../../components/Card/Card";
import Button from "../../components/Button/Button";
import { averageStudyTimeByStudent, dailyAccessLast30Days, institutionProfile, institutionalReports, mockInstitutionStudents, registeredStudentsEvolution, registeredVsActiveStudents, topAccessedModels, weeklyActiveStudents, courseDistribution } from "../../data/mockInstitutionalAnalytics";
import { useLanguage } from "../../context/LanguageContext";
import { formatCurrency, formatDate, formatNumber } from "../../utils/formatLocale";
import { trackEvent } from "../../services/analyticsService";

function money(value, language) {
  return formatCurrency(value, language, "BRL", { maximumFractionDigits: 0 });
}

function AdminTitle({ title, text }) {
  const { t } = useLanguage();
  return (
    <div className="page-title">
      <p className="eyebrow">{t("institutionAdmin.eyebrow")}</p>
      <h1 className="display-title">{title}</h1>
      <p className="mt-3 max-w-3xl text-textMuted">{text}</p>
    </div>
  );
}

function BarChart({ data, labelKey = "date", valueKey = "accesses" }) {
  const max = Math.max(...data.map(item => item[valueKey]));

  return (
    <div className="grid gap-2">
      {data.map(item => (
        <div key={item[labelKey]} className="grid grid-cols-[92px_1fr_56px] items-center gap-3 text-xs text-slate-300">
          <span className="truncate">{item[labelKey]}</span>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-techTeal" style={{ width: `${(item[valueKey] / max) * 100}%` }} />
          </div>
          <strong className="text-right text-clinicalWhite">{item[valueKey]}</strong>
        </div>
      ))}
    </div>
  );
}

function Kpi({ label, value, tone = "gold" }) {
  return (
    <Card>
      <strong className={`text-3xl ${tone === "teal" ? "text-techTeal" : "text-agedGold"}`}>{value}</strong>
      <p className="mt-2 text-textMuted">{label}</p>
    </Card>
  );
}

function csvValue(value) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
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

export default function InstitutionAdmin({ section = "overview", navigate, notify = () => {} }) {
  const { language, t } = useLanguage();
  const current = section === "dashboard" ? "overview" : section;

  if (current === "students") return <Students notify={notify} />;
  if (current === "analytics" || current === "models") return <Analytics />;
  if (current === "reports") return <Reports notify={notify} />;
  if (current === "license") return <LicenseSummary navigate={navigate} />;

  return (
    <>
      <AdminTitle
        title={t("institutionAdmin.title")}
        text={t("institutionAdmin.titleText")}
      />
      <div className="kpi-grid">
        <Kpi label={t("institutionAdmin.totalEnrolledStudents")} value={formatNumber(institutionProfile.registeredStudents, language)} />
        <Kpi label={t("institutionAdmin.activeStudentsToday")} value={formatNumber(institutionProfile.activeStudentsToday, language)} tone="teal" />
        <Kpi label={t("institutionAdmin.activeStudentsThisMonth")} value={formatNumber(institutionProfile.activeStudentsThisMonth, language)} tone="teal" />
        <Kpi label={t("institutionAdmin.inactiveStudents")} value={formatNumber(institutionProfile.inactiveStudentsThisMonth, language)} />
        <Kpi label={t("institutionAdmin.accessesToday")} value={formatNumber(institutionProfile.accessesToday, language)} />
        <Kpi label={t("institutionAdmin.accessesLast7Days")} value={formatNumber(institutionProfile.accessesLast7Days, language)} />
        <Kpi label={t("institutionAdmin.accessesThisMonth")} value={formatNumber(institutionProfile.accessesThisMonth, language)} />
        <Kpi label={t("institutionAdmin.totalStudyTime")} value={`${formatNumber(institutionProfile.totalStudyHours, language)}h`} />
        <Kpi label={t("institutionAdmin.averageStudyPerStudent")} value={`${formatNumber(institutionProfile.averageStudyMinutesPerStudent, language)} min`} tone="teal" />
        <Kpi label={t("institutionAdmin.estimatedMonthlyValue")} value={money(institutionProfile.estimatedMonthlyTotal, language)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.64fr_0.36fr]">
        <Card>
          <h2 className="text-xl font-bold text-clinicalWhite">{t("institutionAdmin.dailyAccessLast30Days")}</h2>
          <div className="mt-5">
            <BarChart data={dailyAccessLast30Days} />
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-clinicalWhite">{t("institutionAdmin.mostAccessedModels")}</h2>
          <div className="mt-4 grid gap-3">
            {topAccessedModels.map((model, index) => (
              <button key={model.id} className="viewer-list-row" onClick={() => navigate(`/viewer/${model.slug || model.id}`)}>
                <span className="badge badge-teal">{index + 1}</span>
                <span className="min-w-0 flex-1 text-left">
                  <strong>{model.title}</strong>
                  <small>{formatNumber(model.accesses, language)} {t("models.accesses").toLowerCase()}</small>
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function Students({ notify }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [course, setCourse] = useState("Todos");
  const [semester, setSemester] = useState("Todos");
  const [activity, setActivity] = useState("Todos");
  const courses = Array.from(new Set(mockInstitutionStudents.map(student => student.course).filter(Boolean)));
  const semesters = Array.from(new Set(mockInstitutionStudents.map(student => student.semester).filter(Boolean)));
  const visibleStudents = mockInstitutionStudents.filter(student => {
    const matchesQuery = [student.name, student.email, student.registration].join(" ").toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "Todos" || student.status === status;
    const matchesCourse = course === "Todos" || student.course === course;
    const matchesSemester = semester === "Todos" || student.semester === semester;
    const matchesActivity = activity === "Todos" || (activity === "ativo" ? student.totalAccesses > 0 : student.totalAccesses === 0);
    return matchesQuery && matchesStatus && matchesCourse && matchesSemester && matchesActivity;
  });

  function exportStudents() {
    const rows = [
      [
        t("institutionAdmin.name"),
        t("institutionAdmin.email"),
        t("institutionAdmin.registration"),
        t("institutionAdmin.course"),
        t("institutionAdmin.semester"),
        t("institutionAdmin.status"),
        t("institutionAdmin.createdAt"),
        t("institutionAdmin.lastAccess"),
        t("institutionAdmin.accesses"),
        t("institutionAdmin.studiedModels"),
        t("institutionAdmin.time")
      ],
      ...visibleStudents.map(student => [
        student.name,
        student.email,
        student.registration,
        student.course,
        student.semester,
        student.status,
        student.createdAt.slice(0, 10),
        student.lastAccessAt || t("institutionAdmin.noAccess"),
        student.totalAccesses,
        student.modelsStudied,
        `${student.studyMinutes} min`
      ])
    ];
    downloadCsv("aeternum-alunos-institucionais.csv", rows);
    trackEvent({ eventType: "export_csv", role: "institution_admin", institutionId: institutionProfile.id, metadata: { report: "students", rows: visibleStudents.length } });
    notify(t("institutionAdmin.csvExported"));
  }

  return (
    <>
      <AdminTitle title={t("institutionAdmin.studentsTitle")} text={t("institutionAdmin.studentsText")} />
      <Card className="mb-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70 md:col-span-2" placeholder={t("institutionAdmin.searchStudent")} value={query} onChange={event => setQuery(event.target.value)} />
          <select className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70" value={status} onChange={event => setStatus(event.target.value)}>
            <option value="Todos">{t("institutionAdmin.allStatuses")}</option>
            <option>ativo</option>
            <option>inativo</option>
            <option>pendente</option>
            <option>bloqueado</option>
          </select>
          <select className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70" value={course} onChange={event => setCourse(event.target.value)}>
            <option value="Todos">{t("institutionAdmin.allCourses")}</option>
            {courses.map(item => <option key={item}>{item}</option>)}
          </select>
          <select className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70" value={semester} onChange={event => setSemester(event.target.value)}>
            <option value="Todos">{t("institutionAdmin.allSemesters")}</option>
            {semesters.map(item => <option key={item}>{item}</option>)}
          </select>
          <select className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70" value={activity} onChange={event => setActivity(event.target.value)}>
            <option value="Todos">{t("institutionAdmin.allActivity")}</option>
            <option value="ativo">{t("institutionAdmin.withAccess")}</option>
            <option value="inativo">{t("institutionAdmin.withoutAccess")}</option>
          </select>
          <Button variant="outline" onClick={exportStudents}>{t("institutionAdmin.exportData")}</Button>
        </div>
      </Card>
      <Card className="table-card p-0">
        <div className="table-scroll">
          <table className="admin-table text-left text-sm">
            <thead><tr>{[
              t("institutionAdmin.name"),
              t("institutionAdmin.email"),
              t("institutionAdmin.registration"),
              t("institutionAdmin.course"),
              t("institutionAdmin.semester"),
              t("institutionAdmin.status"),
              t("institutionAdmin.createdAt"),
              t("institutionAdmin.lastAccess"),
              t("institutionAdmin.accesses"),
              t("institutionAdmin.studiedModels"),
              t("institutionAdmin.time"),
              t("institutionAdmin.actions")
            ].map(item => <th key={item} className="border-b border-white/10 bg-agedGold/5 p-4 uppercase tracking-[0.08em] text-agedGold">{item}</th>)}</tr></thead>
            <tbody className="[&_td]:border-b [&_td]:border-white/10 [&_td]:p-4 [&_td]:text-slate-200">
              {visibleStudents.map(student => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.registration}</td>
                  <td>{student.course}</td>
                  <td>{student.semester}</td>
                  <td><span className={`badge ${student.status === "ativo" ? "badge-active" : "badge-teal"}`}>{student.status}</span></td>
                  <td>{student.createdAt.slice(0, 10)}</td>
                  <td>{student.lastAccessAt || t("institutionAdmin.noAccess")}</td>
                  <td>{student.totalAccesses}</td>
                  <td>{student.modelsStudied}</td>
                  <td>{student.studyMinutes} min</td>
                  <td className="flex flex-wrap gap-2">
                    <Button variant="ghost" className="min-h-8 px-3">{t("institutionAdmin.view")}</Button>
                    <Button variant="outline" className="min-h-8 px-3">{student.status === "bloqueado" ? t("institutionAdmin.unblock") : t("institutionAdmin.block")}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Analytics() {
  const { t } = useLanguage();
  return (
    <>
      <AdminTitle title={t("institutionAdmin.analyticsTitle")} text={t("institutionAdmin.analyticsText")} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold text-clinicalWhite">{t("institutionAdmin.weeklyActiveStudents")}</h2>
          <div className="mt-5"><BarChart data={weeklyActiveStudents} labelKey="week" valueKey="students" /></div>
        </Card>
        <Card>
          <h2 className="text-xl font-bold text-clinicalWhite">{t("institutionAdmin.courseDistribution")}</h2>
          <div className="mt-5"><BarChart data={courseDistribution} labelKey="label" valueKey="students" /></div>
        </Card>
        <Card>
          <h2 className="text-xl font-bold text-clinicalWhite">{t("institutionAdmin.averageStudyTime")}</h2>
          <div className="mt-5"><BarChart data={averageStudyTimeByStudent} labelKey="label" valueKey="students" /></div>
        </Card>
        <Card>
          <h2 className="text-xl font-bold text-clinicalWhite">{t("institutionAdmin.registeredEvolution")}</h2>
          <div className="mt-5"><BarChart data={registeredStudentsEvolution} labelKey="month" valueKey="students" /></div>
        </Card>
        <Card>
          <h2 className="text-xl font-bold text-clinicalWhite">{t("institutionAdmin.registeredVsActive")}</h2>
          <div className="mt-5"><BarChart data={registeredVsActiveStudents} labelKey="label" valueKey="students" /></div>
        </Card>
        <Card className="xl:col-span-2">
          <h2 className="text-xl font-bold text-clinicalWhite">{t("institutionAdmin.usageByModel")}</h2>
          <div className="mt-5"><BarChart data={topAccessedModels} labelKey="title" valueKey="accesses" /></div>
        </Card>
      </div>
    </>
  );
}

function Reports({ notify }) {
  const { language, t } = useLanguage();
  function exportReport(kind) {
    const rows = [
      [t("reports.monthlyReport"), institutionProfile.referencePeriod],
      [t("institutionAdmin.institution"), institutionProfile.name],
      [t("license.registeredStudents"), institutionProfile.registeredStudents],
      [t("license.activeStudents"), institutionProfile.activeStudentsThisMonth],
      [t("reports.billableStudents"), institutionProfile.billableStudents],
      [t("reports.totalAccesses"), institutionProfile.accessesThisMonth],
      [t("institutionAdmin.totalStudyTime"), `${institutionProfile.totalStudyHoursThisMonth}h`],
      [t("license.estimatedValue"), institutionProfile.estimatedMonthlyValue]
    ];
    if (kind === "csv") downloadCsv("aeternum-relatorio-mensal.csv", rows);
    trackEvent({ eventType: kind === "csv" ? "export_csv" : "open_report", role: "institution_admin", institutionId: institutionProfile.id, metadata: { report: "monthly", format: kind } });
    notify(kind === "csv" ? t("institutionAdmin.csvExported") : t("institutionAdmin.pdfExportPrepared"));
  }

  return (
    <>
      <AdminTitle title={t("institutionAdmin.reportsTitle")} text={t("institutionAdmin.reportsText")} />
      <Card className="mb-6">
        <h2 className="text-xl font-bold text-clinicalWhite">{t("reports.monthlyReport")} · {institutionProfile.referencePeriod}</h2>
        <div className="mt-5 grid gap-4 text-sm text-slate-200 md:grid-cols-3">
          <p><span className="block text-textMuted">{t("institutionAdmin.institution")}</span>{institutionProfile.name}</p>
          <p><span className="block text-textMuted">{t("license.registeredStudents")}</span>{formatNumber(institutionProfile.registeredStudents, language)}</p>
          <p><span className="block text-textMuted">{t("license.activeStudents")}</span>{formatNumber(institutionProfile.activeStudentsThisMonth, language)}</p>
          <p><span className="block text-textMuted">{t("reports.billableStudents")}</span>{formatNumber(institutionProfile.billableStudents, language)}</p>
          <p><span className="block text-textMuted">{t("reports.totalAccesses")}</span>{formatNumber(institutionProfile.accessesThisMonth, language)}</p>
          <p><span className="block text-textMuted">{t("institutionAdmin.totalStudyTime")}</span>{formatNumber(institutionProfile.totalStudyHoursThisMonth, language)}h</p>
          <p><span className="block text-textMuted">{t("license.estimatedValue")}</span>{money(institutionProfile.estimatedMonthlyValue, language)}</p>
          <p className="md:col-span-2"><span className="block text-textMuted">{t("reports.observations")}</span>{t("license.estimateNotice")}</p>
        </div>
      </Card>
      <div className="grid gap-5 md:grid-cols-3">
        {institutionalReports.map(report => (
          <Card key={report.id}>
            <span className="badge badge-teal">{report.status}</span>
            <h2 className="mt-4 text-xl font-bold text-clinicalWhite">{report.name}</h2>
            <p className="mt-2 text-textMuted">{report.period}</p>
            <div className="mt-5 grid gap-3">
              <Button variant="teal" onClick={() => exportReport("csv")}>{t("reports.exportCsv")}</Button>
              <Button variant="outline" onClick={() => exportReport("pdf")}>{t("reports.exportPdf")}</Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function LicenseSummary({ navigate }) {
  const { language, t } = useLanguage();
  return (
    <>
      <AdminTitle title={t("license.title")} text={t("license.estimateNotice")} />
      <div className="kpi-grid">
        <Kpi label={t("license.billingModel")} value={institutionProfile.billingModel} />
        <Kpi label={t("license.pricePerRegisteredStudent")} value={money(institutionProfile.pricePerRegisteredStudent, language)} />
        <Kpi label={t("license.pricePerActiveStudent")} value={money(institutionProfile.pricePerActiveStudent, language)} />
        <Kpi label={t("license.registeredStudents")} value={formatNumber(institutionProfile.registeredStudents, language)} />
        <Kpi label={t("license.activeStudents")} value={formatNumber(institutionProfile.activeStudentsThisMonth, language)} />
        <Kpi label={t("license.billableStudents")} value={formatNumber(institutionProfile.activeStudentsThisMonth, language)} />
        <Kpi label={t("license.estimatedValue")} value={money(institutionProfile.estimatedMonthlyTotal, language)} />
      </div>
      <Card className="mt-6">
        <h2 className="text-xl font-bold text-clinicalWhite">Contrato acadêmico</h2>
        <p className="mt-3 text-textMuted">{t("institutionAdmin.institution")}: {institutionProfile.name}. {t("license.licenseStatus")}: {institutionProfile.licenseStatus}. {t("license.referencePeriod")}: {institutionProfile.referencePeriod}. {t("license.reportGeneration")}: {formatDate(institutionProfile.generatedAt, language)}.</p>
        <Button className="mt-5" variant="teal" onClick={() => navigate("/license")}>{t("license.title")}</Button>
      </Card>
    </>
  );
}
