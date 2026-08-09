import { A26Button, A26Card, A26EmptyState, A26Metric } from "../../components/aeternum-26";
import { useLanguage } from "../../context/LanguageContext";

function institutionLabel(user) {
  return user?.institution || user?.institutionName || user?.institution_id || user?.institutionId || "Instituição não informada";
}

export default function License({ user, navigate }) {
  const { t } = useLanguage();
  const canSeeBilling = ["institution_admin", "super_admin", "admin"].includes(user?.role);
  const institution = institutionLabel(user);

  return (
    <section className="fade-in-up">
      <header className="page-title">
        <p className="eyebrow">{t("license.title")}</p>
        <h1 className="display-title">Acesso institucional</h1>
        <p className="mt-3 max-w-3xl text-textMuted">
          Esta área exibe apenas dados confirmados da sessão e do perfil autenticado.
        </p>
      </header>

      <div className="kpi-grid">
        <A26Metric label="Instituição" value={institution} />
        <A26Metric label="Papel autenticado" value={user?.role || "Não identificado"} />
        <A26Metric label="Estado do perfil" value={user?.accountStatus || user?.status || "Não informado"} />
        <A26Metric label="Contexto do tenant" value={user?.institutionId || user?.institution_id ? "Vinculado" : "Não informado"} />
      </div>

      <A26Card className="mt-6">
        {canSeeBilling ? (
          <A26EmptyState
            title="Dados contratuais não configurados"
            text="Valores, capacidade e faturamento não serão estimados com dados fictícios. Quando o contrato institucional estiver disponível no Supabase, esta área poderá exibi-lo com rastreabilidade."
            action={
              <A26Button variant="secondary" onClick={() => navigate("/admin/billing")}>
                Abrir faturamento administrativo
              </A26Button>
            }
          />
        ) : (
          <A26EmptyState
            title="Acesso acadêmico ativo"
            text="Os detalhes comerciais são restritos aos responsáveis administrativos da instituição."
            action={<A26Button variant="primary" onClick={() => navigate("/models")}>Abrir modelos 3D</A26Button>}
          />
        )}
      </A26Card>
    </section>
  );
}
