import Card from "../../components/Card/Card";
import { useLanguage } from "../../context/LanguageContext";
import LineIcon from "../../components/icons/LineIcon";

export default function InstitutionDashboard() {
  const { t } = useLanguage();

  return (
    <section className="premium-dashboard fade-in-up">
      <div className="page-title mb-8">
        <p className="eyebrow">Aeternum Atlas Premium</p>
        <h1 className="display-title">Dashboard Institucional</h1>
        <p className="mt-3 text-textMuted">Gestão global do campus, usuários e acessos.</p>
      </div>

      <Card className="flex min-h-[400px] flex-col items-center justify-center border-dashed border-techTeal/30 bg-blackDeep/40 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-techTeal/10 text-techTeal">
          <LineIcon name="home" className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-clinicalWhite">Dashboard Institucional em Construção</h2>
        <p className="mt-2 max-w-md text-textMuted">
          O painel de administração da instituição está sendo atualizado para a nova governança.
        </p>
      </Card>
    </section>
  );
}
