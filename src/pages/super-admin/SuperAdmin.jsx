import { useEffect, useState } from "react";
import Card from "../../components/Card/Card";
import Button from "../../components/Button/Button";
import {
  getRestrictedInstitutionDashboardData,
  loadInstitutionDashboardData
} from "../../services/admin/institutionDashboardService";
import { useLanguage } from "../../context/LanguageContext";
import { formatCurrency, formatNumber } from "../../utils/formatLocale";

const emptyDashboard = getRestrictedInstitutionDashboardData(null, "Carregando dados reais do Supabase.");

function money(value, language) {
  return formatCurrency(value || 0, language, "BRL", { maximumFractionDigits: 0 });
}

export default function SuperAdmin({ user, navigate }) {
  const { language, t } = useLanguage();
  const [dashboardData, setDashboardData] = useState(emptyDashboard);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let mounted = true;

    setStatus("loading");
    loadInstitutionDashboardData()
      .then(data => {
        if (!mounted) return;
        setDashboardData(data);
        setStatus(data.source === "supabase" ? "connected" : "restricted");
      })
      .catch(error => {
        console.warn("[super-admin] Falha ao carregar dados reais.", error);
        if (!mounted) return;
        setDashboardData(getRestrictedInstitutionDashboardData(null, "Falha ao validar sessão/tenant."));
        setStatus("restricted");
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!["super_admin", "admin"].includes(user?.role)) {
    return (
      <Card>
        <h1 className="display-title">{t("superAdmin.restrictedArea")}</h1>
        <p className="mt-4 text-textMuted">{t("superAdmin.restrictedText")}</p>
        <Button className="mt-5" variant="outline" onClick={() => navigate("/dashboard")}>{t("actions.back")}</Button>
      </Card>
    );
  }

  const institutions = dashboardData?.institutions || [];
  const stats = dashboardData?.stats || {};
  const activeInstitutions = institutions.filter(institution => institution.active).length;
  const implementingInstitutions = institutions.filter(institution => !institution.active).length;
  const mostAccessedModel = dashboardData?.mostAccessedModels?.[0]?.title || "Nenhum dado encontrado";
  const dataSourceLabel = status === "connected"
    ? "Supabase real"
    : status === "loading"
      ? "Carregando Supabase"
      : "Acesso restrito";

  return (
    <section className="fade-in-up">
      <div className="page-title">
        <p className="eyebrow">Aeternum Atlas · {dataSourceLabel}</p>
        <h1 className="display-title">{t("superAdmin.overview")}</h1>
        <p className="mt-3 max-w-3xl text-textMuted">
          {dashboardData?.reason || t("superAdmin.description")}
        </p>
      </div>

      <div className="kpi-grid">
        <Card><strong className="text-3xl text-agedGold">{formatNumber(activeInstitutions, language)}</strong><p className="mt-2 text-textMuted">{t("superAdmin.activeInstitutions")}</p></Card>
        <Card><strong className="text-3xl text-agedGold">{formatNumber(implementingInstitutions, language)}</strong><p className="mt-2 text-textMuted">{t("superAdmin.implementingInstitutions")}</p></Card>
        <Card><strong className="text-3xl text-agedGold">{formatNumber(stats.registeredStudents || 0, language)}</strong><p className="mt-2 text-textMuted">{t("superAdmin.registeredStudents")}</p></Card>
        <Card><strong className="text-3xl text-agedGold">{formatNumber(stats.activeStudents || 0, language)}</strong><p className="mt-2 text-textMuted">{t("superAdmin.activeStudents")}</p></Card>
        <Card><strong className="text-3xl text-agedGold">{money(stats.estimatedRevenue, language)}</strong><p className="mt-2 text-textMuted">{t("superAdmin.estimatedMonthlyRevenue")}</p></Card>
        <Card><strong className="text-xl text-agedGold">{mostAccessedModel}</strong><p className="mt-2 text-textMuted">{t("superAdmin.mostAccessedModel")}</p></Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.62fr_0.38fr]">
        <Card className="table-card p-0">
          <div className="table-scroll">
            <table className="admin-table text-left text-sm">
              <thead>
                <tr>
                  {[t("superAdmin.institution"), t("superAdmin.status"), t("superAdmin.students"), t("superAdmin.active"), t("superAdmin.estimate"), t("superAdmin.actions")].map(item => (
                    <th key={item} className="border-b border-white/10 bg-agedGold/5 p-4 uppercase tracking-[0.08em] text-agedGold">{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&_td]:border-b [&_td]:border-white/10 [&_td]:p-4 [&_td]:text-slate-200">
                {institutions.map(institution => (
                  <tr key={institution.id}>
                    <td>{institution.name}</td>
                    <td><span className="badge badge-teal">{institution.contractStatus}</span></td>
                    <td>{formatNumber(institution.registeredStudents || 0, language)}</td>
                    <td>{formatNumber(institution.activeStudents || 0, language)}</td>
                    <td>{money((institution.activeStudents || 0) * (institution.pricePerStudent || 0), language)}</td>
                    <td><Button variant="outline" className="min-h-8 px-3" onClick={() => navigate("/super-admin/institution")}>{t("superAdmin.viewPanel")}</Button></td>
                  </tr>
                ))}
                {!institutions.length ? (
                  <tr>
                    <td colSpan="6" className="text-center text-textMuted">Nenhum dado encontrado no Supabase.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-clinicalWhite">{t("institutionAdmin.mostAccessedModels")}</h2>
          <div className="mt-4 grid gap-3">
            {(dashboardData?.mostAccessedModels || []).slice(0, 4).map(model => (
              <div key={model.id} className="viewer-list-row">
                <span className="badge badge-teal">{formatNumber(model.accesses || 0, language)}</span>
                <span className="min-w-0 flex-1">
                  <strong>{model.title}</strong>
                  <small>{t("superAdmin.studyMinutes", { minutes: formatNumber((model.studyHours || 0) * 60, language) })}</small>
                </span>
              </div>
            ))}
            {!dashboardData?.mostAccessedModels?.length ? (
              <p className="text-sm text-textMuted">Nenhum dado encontrado.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </section>
  );
}
