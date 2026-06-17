import Card from "../../components/Card/Card";
import { useLanguage } from "../../context/LanguageContext";
import LineIcon from "../../components/icons/LineIcon";

export default function SuperAdminDashboard() {
  const { t } = useLanguage();

  return (
    <section className="premium-dashboard fade-in-up">
      <div className="page-title mb-8">
        <p className="eyebrow">Deus Ex Machina</p>
        <h1 className="display-title">Dashboard Global</h1>
        <p className="mt-3 text-textMuted">Controle supremo multi-tenant, contratos e faturamento.</p>
      </div>

      <Card className="flex min-h-[400px] flex-col items-center justify-center border-dashed border-techTeal/30 bg-blackDeep/40 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-techTeal/10 text-techTeal">
          <LineIcon name="globe" className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-clinicalWhite">Dashboard Global em Construção</h2>
        <p className="mt-2 max-w-md text-textMuted">
          O centro de comando supremo está sendo atualizado para a nova governança.
        </p>
      </Card>
    </section>
  );
}
