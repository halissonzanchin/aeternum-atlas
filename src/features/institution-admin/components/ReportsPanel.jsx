import Card from "../../../components/Card/Card";
import Button from "../../../components/Button/Button";
import { useLanguage } from "../../../context/LanguageContext";
import { formatNumber, formatCurrency } from "../../../utils/formatLocale";
import { institutionProfile, institutionalReports } from "../../../data/mockInstitutionalAnalytics";
import { trackEvent } from "../../../services/analyticsService";
import { downloadCsv } from "../utils/exportCsv";
import AdminTitle from "./AdminTitle";

function money(value, language) {
  return formatCurrency(value, language, "BRL", { maximumFractionDigits: 0 });
}

export default function ReportsPanel({ notify }) {
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
