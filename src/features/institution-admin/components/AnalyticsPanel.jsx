import Card from "../../../components/Card/Card";
import { useLanguage } from "../../../context/LanguageContext";
import {
  averageStudyTimeByStudent,
  courseDistribution,
  registeredStudentsEvolution,
  registeredVsActiveStudents,
  topAccessedModels,
  weeklyActiveStudents
} from "../../../data/mockInstitutionalAnalytics";
import AdminTitle from "./AdminTitle";
import BarChart from "./BarChart";

export default function AnalyticsPanel() {
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
