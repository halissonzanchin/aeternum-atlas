import Card from "../../components/Card/Card";
import Button from "../../components/Button/Button";
import { institutionProfile } from "../../data/mockInstitutionalAnalytics";
import { useLanguage } from "../../context/LanguageContext";
import { formatCurrency, formatDate, formatNumber } from "../../utils/formatLocale";

function money(value, language) {
  return formatCurrency(value, language, "BRL", { maximumFractionDigits: 0 });
}

export default function License({ user, navigate }) {
  const { language, t } = useLanguage();
  const canSeeBilling = ["institution_admin", "super_admin", "admin"].includes(user?.role);

  if (!canSeeBilling) {
    return (
      <section className="fade-in-up">
        <div className="page-title">
          <p className="eyebrow">{t("license.title")}</p>
          <h1 className="display-title">{t("license.accessTitle")}</h1>
          <p className="mt-3 max-w-3xl text-textMuted">
            {t("license.accessText")}
          </p>
        </div>
        <Card>
          <h2 className="text-2xl font-bold text-clinicalWhite">{user?.institution || institutionProfile.name}</h2>
          <p className="mt-3 text-textMuted">{t("common.status")}: {t("common.institutionalAccess")} {t("common.active").toLowerCase()}.</p>
          <Button className="mt-5" variant="teal" onClick={() => navigate("/models")}>{t("viewer.library")}</Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="fade-in-up">
      <div className="page-title">
        <p className="eyebrow">{t("license.title")}</p>
        <h1 className="display-title">{institutionProfile.name}</h1>
        <p className="mt-3 max-w-3xl text-textMuted">
          {t("license.estimateNotice")}
        </p>
      </div>

      <div className="kpi-grid">
        <Card><strong className="text-3xl text-agedGold">{institutionProfile.licenseStatus}</strong><p className="mt-2 text-textMuted">{t("license.licenseStatus")}</p></Card>
        <Card><strong className="text-3xl text-agedGold">{formatNumber(institutionProfile.registeredStudents, language)}</strong><p className="mt-2 text-textMuted">{t("license.registeredStudents")}</p></Card>
        <Card><strong className="text-3xl text-agedGold">{formatNumber(institutionProfile.activeStudentsThisMonth, language)}</strong><p className="mt-2 text-textMuted">{t("license.activeStudents")}</p></Card>
        <Card><strong className="text-3xl text-agedGold">{money(institutionProfile.estimatedMonthlyTotal, language)}</strong><p className="mt-2 text-textMuted">{t("license.estimatedValue")}</p></Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.62fr_0.38fr]">
        <Card>
          <h2 className="text-2xl font-bold text-clinicalWhite">{t("license.billingModel")}</h2>
          <div className="mt-5 grid gap-4 text-sm text-slate-200 md:grid-cols-2">
            <p><span className="block text-textMuted">{t("institutionAdmin.institution")}</span>{institutionProfile.name}</p>
            <p><span className="block text-textMuted">{t("license.billingModel")}</span>{institutionProfile.billingModel}</p>
            <p><span className="block text-textMuted">{t("license.pricePerRegisteredStudent")}</span>{money(institutionProfile.pricePerRegisteredStudent, language)}</p>
            <p><span className="block text-textMuted">{t("license.pricePerActiveStudent")}</span>{money(institutionProfile.pricePerActiveStudent, language)}</p>
            <p><span className="block text-textMuted">{t("license.billableStudents")}</span>{formatNumber(institutionProfile.billableStudents, language)}</p>
            <p><span className="block text-textMuted">{t("license.referencePeriod")}</span>{institutionProfile.referencePeriod}</p>
            <p><span className="block text-textMuted">{t("license.reportGeneration")}</span>{formatDate(institutionProfile.generatedAt, language)}</p>
            <p><span className="block text-textMuted">{t("institutionAdmin.currency")}</span>{institutionProfile.currency}</p>
          </div>
          <p className="mt-5 text-sm text-textMuted">{t("license.estimateNotice")}</p>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold text-clinicalWhite">{t("institutionAdmin.exports")}</h2>
          <p className="mt-3 text-textMuted">{t("institutionAdmin.exportsText")}</p>
          <div className="mt-5 grid gap-3">
            <Button variant="teal">{t("reports.exportCsv")}</Button>
            <Button variant="outline">{t("reports.exportPdf")}</Button>
            <Button variant="ghost" onClick={() => navigate("/institution-admin/reports")}>{t("institutionAdmin.openReports")}</Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
