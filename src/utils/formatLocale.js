const localeMap = {
  pt: "pt-BR",
  es: "es-ES",
  en: "en-US",
  de: "de-DE"
};

export function localeForLanguage(language = "pt") {
  return localeMap[language] || "pt-BR";
}

export function formatCurrency(value, language = "pt", currency = "BRL", options = {}) {
  return new Intl.NumberFormat(localeForLanguage(language), {
    style: "currency",
    currency,
    ...options
  }).format(value);
}

export function formatNumber(value, language = "pt", options = {}) {
  return new Intl.NumberFormat(localeForLanguage(language), options).format(value);
}

export function formatDate(value, language = "pt", options = {}) {
  if (!value) return "";
  return new Intl.DateTimeFormat(localeForLanguage(language), options).format(new Date(value));
}
