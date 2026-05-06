export function formatDate(value) {
  if (!value) return "Não definido";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

export function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getTrialDaysRemaining(user) {
  if (!user?.trialEndsAt) return 0;
  const diff = new Date(user.trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export function subscriptionLabel(status) {
  const labels = {
    trial: "Acesso acadêmico",
    active: "Acesso institucional",
    expired: "Licença expirada",
    cancelled: "Licença inativa",
    acesso_institucional: "Acesso institucional"
  };
  return labels[status] || "Acesso institucional";
}

export function statusBadgeClass(status) {
  const classes = {
    trial: "badge-teal",
    active: "badge-active",
    expired: "badge-danger",
    cancelled: "badge-danger",
    module_restricted: "badge-gold",
    free: "badge-teal",
    blocked: "badge-danger",
    available: "badge-active"
  };
  return classes[status] || "badge-danger";
}
