import Card from "../../components/Card/Card";
import { useLanguage } from "../../context/LanguageContext";
import LineIcon from "../../components/icons/LineIcon";

export default function RectorDashboard() {
  const { t } = useLanguage();

  return (
    <section className="premium-dashboard fade-in-up">
      <div className="page-title mb-8">
        <p className="eyebrow">Universidad Privada del Este</p>
        <h1 className="display-title">Dashboard Executivo</h1>
        <p className="mt-3 text-textMuted">Visão estratégica, adoção e ROI institucional.</p>
      </div>

      <Card className="flex min-h-[400px] flex-col items-center justify-center border-dashed border-techTeal/30 bg-blackDeep/40 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-techTeal/10 text-techTeal">
          <LineIcon name="spark" className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-clinicalWhite">Executive Dashboard em Construção</h2>
        <p className="mt-2 max-w-md text-textMuted">
          O painel de indicadores da reitoria está sendo preparado com a identidade Aeternum Atlas Premium.
        </p>
      </Card>
    </section>
  );
}
