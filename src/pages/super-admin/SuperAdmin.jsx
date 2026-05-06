import Card from "../../components/Card/Card";
import Button from "../../components/Button/Button";
import { mockInstitutions, topAccessedModels } from "../../data/mockInstitutionalAnalytics";
import { useLanguage } from "../../context/LanguageContext";
import { formatCurrency, formatNumber } from "../../utils/formatLocale";

function money(value, language) {
  return formatCurrency(value, language, "BRL", { maximumFractionDigits: 0 });
}

const sectionLabels = {
  overview: "superAdmin.overview",
  institutions: "superAdmin.institutions",
  contracts: "superAdmin.contracts",
  students: "superAdmin.studentsByInstitution",
  analytics: "superAdmin.globalAnalytics",
  billing: "superAdmin.estimatedBilling",
  reports: "superAdmin.reports"
};

export default function SuperAdmin({ user, section = "overview", navigate }) {
  const { language, t } = useLanguage();
  if (!["super_admin", "admin"].includes(user?.role)) {
    return (
      <Card>
        <h1 className="display-title">{t("superAdmin.restrictedArea")}</h1>
        <p className="mt-4 text-textMuted">{t("superAdmin.restrictedText")}</p>
        <Button className="mt-5" variant="outline" onClick={() => navigate("/dashboard")}>{t("actions.back")}</Button>
      </Card>
    );
  }

  const institutions = mockInstitutions;
  const activeInstitutions = institutions.filter(institution => institution.licenseStatus === "ativa" || institution.status === "Ativa").length;
  const implementingInstitutions = institutions.filter(institution => institution.status === "Em implantação").length;
  const registeredStudents = institutions.reduce((sum, institution) => sum + institution.registeredStudents, 0);
  const activeStudents = institutions.reduce((sum, institution) => sum + institution.activeStudentsThisMonth, 0);
  const estimatedRevenue = institutions.reduce((sum, institution) => sum + institution.estimatedMonthlyTotal, 0);
  const averageGrowth = Math.round(institutions.reduce((sum, institution) => sum + (institution.usageGrowthPercent || 0), 0) / institutions.length);
  const activeSection = t(sectionLabels[section] || sectionLabels.overview);

  return (
    <section className="fade-in-up">
      <div className="page-title">
        <p className="eyebrow">Aeternum Atlas</p>
        <h1 className="display-title">{activeSection}</h1>
        <p className="mt-3 max-w-3xl text-textMuted">
          {t("superAdmin.description")}
        </p>
      </div>

      <div className="kpi-grid">
        <Card><strong className="text-3xl text-agedGold">{formatNumber(activeInstitutions, language)}</strong><p className="mt-2 text-textMuted">{t("superAdmin.activeInstitutions")}</p></Card>
        <Card><strong className="text-3xl text-agedGold">{formatNumber(implementingInstitutions, language)}</strong><p className="mt-2 text-textMuted">{t("superAdmin.implementingInstitutions")}</p></Card>
        <Card><strong className="text-3xl text-agedGold">{formatNumber(registeredStudents, language)}</strong><p className="mt-2 text-textMuted">{t("superAdmin.registeredStudents")}</p></Card>
        <Card><strong className="text-3xl text-agedGold">{formatNumber(activeStudents, language)}</strong><p className="mt-2 text-textMuted">{t("superAdmin.activeStudents")}</p></Card>
        <Card><strong className="text-3xl text-agedGold">{money(estimatedRevenue, language)}</strong><p className="mt-2 text-textMuted">{t("superAdmin.estimatedMonthlyRevenue")}</p></Card>
        <Card><strong className="text-xl text-agedGold">Coração Humano</strong><p className="mt-2 text-textMuted">{t("superAdmin.mostAccessedModel")}</p></Card>
        <Card><strong className="text-3xl text-techTeal">+{averageGrowth}%</strong><p className="mt-2 text-textMuted">{t("superAdmin.usageGrowth")}</p></Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.62fr_0.38fr]">
        <Card className="table-card p-0">
          <div className="table-scroll">
            <table className="admin-table text-left text-sm">
              <thead><tr>{[t("superAdmin.institution"), t("superAdmin.status"), t("superAdmin.students"), t("superAdmin.active"), t("superAdmin.estimate"), t("superAdmin.actions")].map(item => <th key={item} className="border-b border-white/10 bg-agedGold/5 p-4 uppercase tracking-[0.08em] text-agedGold">{item}</th>)}</tr></thead>
              <tbody className="[&_td]:border-b [&_td]:border-white/10 [&_td]:p-4 [&_td]:text-slate-200">
                {institutions.map(institution => (
                  <tr key={institution.id}>
                    <td>{institution.name}</td>
                    <td><span className="badge badge-teal">{institution.licenseStatus}</span></td>
                    <td>{formatNumber(institution.registeredStudents, language)}</td>
                    <td>{formatNumber(institution.activeStudentsThisMonth, language)}</td>
                    <td>{money(institution.estimatedMonthlyTotal, language)}</td>
                    <td><Button variant="outline" className="min-h-8 px-3" onClick={() => navigate("/institution-admin")}>{t("superAdmin.viewPanel")}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-clinicalWhite">{t("institutionAdmin.mostAccessedModels")}</h2>
          <div className="mt-4 grid gap-3">
            {topAccessedModels.slice(0, 4).map(model => (
              <div key={model.id} className="viewer-list-row">
                <span className="badge badge-teal">{formatNumber(model.accesses, language)}</span>
                <span className="min-w-0 flex-1">
                  <strong>{model.title}</strong>
                  <small>{t("superAdmin.studyMinutes", { minutes: formatNumber(model.studyMinutes, language) })}</small>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
