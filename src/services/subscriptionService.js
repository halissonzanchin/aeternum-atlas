import { mockPlans } from "../data/mockPlans";
import { updateUser } from "./authService";

export function getPlans() {
  return mockPlans;
}

export function getPlanById(planId) {
  return mockPlans.find(plan => plan.id === planId);
}

export function getSubscriptionStatus(user) {
  if (!user) return "cancelled";
  return user.subscriptionStatus || user.accessStatus || "active";
}

export function hasInstitutionalAccess(user) {
  return Boolean(user && (user.accountStatus || "ativo") !== "bloqueado");
}

export function activateSubscription(user, plan, provider = "Mock Gateway") {
  const now = new Date();
  const renewsAt = new Date(now);
  if (plan.interval === "annual") renewsAt.setFullYear(now.getFullYear() + 1);
  else renewsAt.setMonth(now.getMonth() + 1);

  return updateUser(user.id, {
    subscriptionStatus: "active",
    subscriptionPlan: plan.name,
    subscriptionStartedAt: now.toISOString(),
    subscriptionRenewsAt: renewsAt.toISOString(),
    paymentProvider: provider
  });
}

export function cancelSubscription(user) {
  return updateUser(user.id, {
    subscriptionStatus: "cancelled",
    paymentProvider: user.paymentProvider || "Mock Gateway"
  });
}
