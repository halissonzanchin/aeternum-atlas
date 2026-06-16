import Card from "../../components/Card/Card";
import { useLanguage } from "../../context/LanguageContext";
import { formatNumber, formatCurrency } from "../../utils/formatLocale";
import { institutionProfile, dailyAccessLast30Days, topAccessedModels } from "../../data/mockInstitutionalAnalytics";

import AdminTitle from "../../features/institution-admin/components/AdminTitle";
import BarChart from "../../features/institution-admin/components/BarChart";
import Kpi from "../../features/institution-admin/components/Kpi";
import StudentsPanel from "../../features/institution-admin/components/StudentsPanel";
import AnalyticsPanel from "../../features/institution-admin/components/AnalyticsPanel";
import ReportsPanel from "../../features/institution-admin/components/ReportsPanel";
import LicenseSummaryPanel from "../../features/institution-admin/components/LicenseSummaryPanel";
import ClassesPanel from "../../features/institution-admin/components/ClassesPanel";
import AcademicAnalyticsPanel from "../../features/institution-admin/components/AcademicAnalyticsPanel";
import InstitutionRoiDashboard from "../../features/institution-admin/components/InstitutionRoiDashboard";
import AnatomicalHeatmapPanel from "../../features/institution-admin/components/AnatomicalHeatmapPanel";

function money(value, language) {
  return formatCurrency(value, language, "BRL", { maximumFractionDigits: 0 });
}

export default function InstitutionAdmin({ section = "overview", navigate, notify = () => {} }) {
  const { language, t } = useLanguage();
  const current = section === "dashboard" ? "overview" : section;

  if (current === "students") return <StudentsPanel notify={notify} />;
  if (current === "classes") return <ClassesPanel />;
  if (current === "analytics" || current === "models") return <AnalyticsPanel />;
  if (current === "academic_analytics") return <AcademicAnalyticsPanel />;
  if (current === "roi") return <InstitutionRoiDashboard />;
  if (current === "heatmap") return <AnatomicalHeatmapPanel />;
  if (current === "reports") return <ReportsPanel notify={notify} />;
  if (current === "license") return <LicenseSummaryPanel navigate={navigate} />;

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
