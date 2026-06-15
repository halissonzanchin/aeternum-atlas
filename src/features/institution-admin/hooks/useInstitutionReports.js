import { useCallback } from "react";
import { institutionProfile } from "../../../data/mockInstitutionalAnalytics";
import { trackEvent } from "../../../services/analyticsService";
import { downloadCsv } from "../utils/exportCsv";
import { useLanguage } from "../../../context/LanguageContext";

export function useInstitutionReports(notify) {
  const { t } = useLanguage();

  const exportReport = useCallback((kind) => {
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
    if (notify) {
      notify(kind === "csv" ? t("institutionAdmin.csvExported") : t("institutionAdmin.pdfExportPrepared"));
    }
  }, [t, notify]);

  return { exportReport };
}
