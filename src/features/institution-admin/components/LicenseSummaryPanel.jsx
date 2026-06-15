import Card from "../../../components/Card/Card";
import Button from "../../../components/Button/Button";
import { useLanguage } from "../../../context/LanguageContext";
import { formatNumber, formatCurrency, formatDate } from "../../../utils/formatLocale";
import { institutionProfile } from "../../../data/mockInstitutionalAnalytics";
import AdminTitle from "./AdminTitle";
import Kpi from "./Kpi";

function money(value, language) {
  return formatCurrency(value, language, "BRL", { maximumFractionDigits: 0 });
}

export default function LicenseSummaryPanel({ navigate }) {
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
