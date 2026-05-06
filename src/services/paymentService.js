import { activateSubscription, cancelSubscription as cancelLocalSubscription, getPlanById } from "./subscriptionService";

export async function createCheckoutSession(planId, user) {
  const plan = getPlanById(planId);
  if (!plan || !user) throw new Error("Não foi possível criar a sessão de pagamento.");

  return {
    id: `checkout_${Date.now()}`,
    provider: "Stripe/Mercado Pago mock",
    status: "created",
    planId: plan.id,
    userId: user.id
  };
}

export async function updateSubscriptionStatus(user, planId) {
  const session = await createCheckoutSession(planId, user);
  const plan = getPlanById(planId);
  return activateSubscription(user, plan, session.provider);
}

export async function cancelSubscription(user) {
  return cancelLocalSubscription(user);
}

export async function applyLicenseCode(user, code) {
  if (!user || !String(code || "").trim()) {
    throw new Error("Informe um código de licença.");
  }

  return {
    accepted: true,
    code: String(code).trim().toUpperCase(),
    message: "Código validado no mock. Integração preparada para gateway/licenciamento."
  };
}
