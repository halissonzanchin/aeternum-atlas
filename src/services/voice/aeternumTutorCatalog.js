export const AETERNUM_VITA_TUTORS = Object.freeze({
  pt: Object.freeze({
    id: "eduardo",
    name: "Eduardo",
    countryCode: "BR",
    country: "Brasil",
    langCode: "pt-BR",
    role: "Mentor Sênior em Português",
    badgeGradient: "linear-gradient(135deg, #009c3b 0%, #ffdf00 50%, #002776 100%)",
    greeting: "Olá! Seja muito bem-vindo ao Aeternum Vita. Eu sou o Eduardo, seu mentor em português do Brasil. Como posso guiar seus estudos anatômicos hoje?"
  }),
  es: Object.freeze({
    id: "antonia",
    name: "Antonia",
    countryCode: "ES",
    country: "Argentina / España",
    langCode: "es-ES",
    role: "Mentora Empática en Español",
    badgeGradient: "linear-gradient(135deg, #aa151b 0%, #f1bf00 50%, #aa151b 100%)",
    greeting: "¡Hola! Te doy una cálida bienvenida a Aeternum Vita. Soy Antonia, tu mentora nativa en español. ¿Qué estructura anatómica deseas explorar hoy?"
  }),
  en: Object.freeze({
    id: "ariana",
    name: "Ariana",
    countryCode: "US",
    country: "United States",
    langCode: "en-US",
    role: "Dynamic English Mentor",
    badgeGradient: "linear-gradient(135deg, #0a3161 0%, #ffffff 50%, #b31942 100%)",
    greeting: "Hello and welcome to Aeternum Vita! I am Ariana, your native English anatomy mentor. How can I guide your journey today?"
  }),
  de: Object.freeze({
    id: "fabian",
    name: "Fabian",
    countryCode: "DE",
    country: "Deutschland",
    langCode: "de-DE",
    role: "Strukturierter Deutscher Mentor",
    badgeGradient: "linear-gradient(135deg, #000000 0%, #dd0000 50%, #ffce00 100%)",
    greeting: "Hallo und herzlich willkommen bei Aeternum Vita! Ich bin Fabian, dein Anatomie-Mentor auf Deutsch. Wie kann ich dir heute helfen?"
  })
});

export function getTutorForLanguage(language = "pt") {
  const code = String(language || "pt").toLowerCase().slice(0, 2);
  return AETERNUM_VITA_TUTORS[code] || AETERNUM_VITA_TUTORS.pt;
}
