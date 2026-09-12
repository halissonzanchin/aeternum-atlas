export const AETERNUM_VITA_TUTORS = Object.freeze({
  pt: Object.freeze({
    id: "eduardo", // eduardo = LEGACY_INTERNAL_ALIAS_FOR_MARINA
    name: "Marina",
    countryCode: "BR",
    country: "Brasil",
    langCode: "pt-BR",
    role: "Mentora Sênior em Português",
    badgeGradient: "linear-gradient(135deg, #009c3b 0%, #ffdf00 50%, #002776 100%)",
    greeting: "Marina está pronta. Pode perguntar quando quiser."
  }),
  es: Object.freeze({
    id: "antonia",
    name: "Antonia",
    countryCode: "ES",
    country: "Argentina / España",
    langCode: "es-ES",
    role: "Mentora Empática en Español",
    badgeGradient: "linear-gradient(135deg, #aa151b 0%, #f1bf00 50%, #aa151b 100%)",
    greeting: "Antonia está lista. Puedes preguntar cuando quieras."
  }),
  en: Object.freeze({
    id: "ariana",
    name: "Ariana",
    countryCode: "US",
    country: "United States",
    langCode: "en-US",
    role: "Dynamic English Mentor",
    badgeGradient: "linear-gradient(135deg, #0a3161 0%, #ffffff 50%, #b31942 100%)",
    greeting: "Ariana is ready. Ask whenever you want."
  }),
  de: Object.freeze({
    id: "fabian",
    name: "Fabian",
    countryCode: "DE",
    country: "Deutschland",
    langCode: "de-DE",
    role: "Strukturierter Deutscher Mentor",
    badgeGradient: "linear-gradient(135deg, #000000 0%, #dd0000 50%, #ffce00 100%)",
    greeting: "Fabian ist bereit. Du kannst jederzeit fragen."
  })
});

export function getTutorForLanguage(language = "pt") {
  const code = String(language || "pt").toLowerCase().slice(0, 2);
  return AETERNUM_VITA_TUTORS[code] || AETERNUM_VITA_TUTORS.pt;
}
