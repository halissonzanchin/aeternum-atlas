import Button from "../Button/Button";
import Card from "../Card/Card";

export default function SubscriptionCard({ plan, onChoose }) {
  return (
    <Card as="article" className={`relative flex h-full flex-col gap-4 overflow-hidden ${plan.recommended ? "border-agedGold/60 shadow-glow lg:-translate-y-2" : ""}`}>
      {plan.recommended ? <span className="badge badge-gold w-max">Recomendado</span> : null}
      <div>
        <h3 className="text-xl font-bold text-clinicalWhite">{plan.name}</h3>
        <p className="mt-3 text-3xl font-black text-agedGold">{plan.price}</p>
      </div>
      <ul className="grid flex-1 gap-3 text-sm text-slate-200">
        {plan.benefits.map(benefit => (
          <li key={benefit} className="flex gap-3">
            <span className="mt-1 size-2 rounded-full bg-techTeal shadow-glow" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      <Button variant={plan.checkoutEnabled ? "teal" : "outline"} onClick={() => onChoose(plan)}>
        {plan.checkoutEnabled ? "Solicitar ativação" : "Falar com consultor"}
      </Button>
    </Card>
  );
}
