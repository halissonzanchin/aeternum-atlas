/**
 * AETERNUM VOICE ENGINE — ANATOMICAL & MEDICAL TEXT NORMALIZER (v2.1.0)
 * Clean-Room implementation for Aeternum Vita's multilingual anatomy tutors:
 * - Marina (pt-BR)
 * - Eduardo (pt-BR)
 * - Antonia (es-ES)
 * - Ariana (en-US)
 * - Fabian (de-DE)
 *
 * Ensures:
 * 1. Absolute removal of citations ([PAS-AUTH-...], [TA2:...], [1], [Moore...])
 * 2. Absolute removal of Markdown formatting (*, #, _, `, >, |, etc.)
 * 3. Expansion of anatomical abbreviations (m., mm., a., aa., v., vv., n., nn., lig., etc.)
 * 4. Expansion of cranial nerves, vertebral levels, ordinals, and percentages per language
 * 5. ReDoS-safe lexicon with phonetic stabilization for Kokoro & Piper TTS
 * 6. Sentence chunker for natural prosody and low-latency streaming
 */

export type SupportedVoiceLanguage = "pt" | "es" | "en" | "de";

export interface LexiconEntry {
  term: string;
  respelling: string;
  language: SupportedVoiceLanguage | "*";
}

export interface NormalizationOptions {
  language?: string;
  enableLexicon?: boolean;
  customLexicon?: Record<string, string>;
}

export type AnatomicalNormalizationOptions = NormalizationOptions;

const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF\u00AD]/g;
const MARKDOWN_ARTIFACTS_RE = /[*#_~`>|]/g;
const ACTION_TAG_RE = /\[ACTION:[^\]]*\]/gi;
const INLINE_OVERRIDE_RE = /\[\[([^\]]+)\]\]/g;
const PATHOLOGICAL_REPEAT_RE = /(.)\1{4,}/g;

// Citations and bibliographic tags: [PAS-AUTH-P12-014], [TA2:1834], [1], [Moore, p. 25], (Moore et al., 2020)
const CITATION_BRACKETS_RE = /\[(?:PAS-AUTH|TA\d+|CIT|REF|[0-9]+)[^\]]*\]/gi;
const GENERIC_BRACKETS_RE = /\[[^\]]{1,60}\]/g;

const PT_UNITS: readonly string[] = [
  "zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
  "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"
];

const PT_TENS: readonly string[] = [
  "", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"
];

const PT_HUNDREDS: readonly string[] = [
  "", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"
];

const ES_UNITS: readonly string[] = [
  "cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve",
  "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"
];

const ES_TENS: readonly string[] = [
  "", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"
];

const ES_HUNDREDS: readonly string[] = [
  "", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"
];

const EN_UNITS: readonly string[] = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"
];

const EN_TENS: readonly string[] = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"
];

const DE_UNITS: readonly string[] = [
  "null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun",
  "zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"
];

const DE_TENS: readonly string[] = [
  "", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"
];

const PT_ORDINALS_MASC: Record<number, string> = {
  1: "primeiro", 2: "segundo", 3: "terceiro", 4: "quarto", 5: "quinto", 6: "sexto",
  7: "sétimo", 8: "oitavo", 9: "nono", 10: "décimo", 11: "décimo primeiro", 12: "décimo segundo"
};

const PT_ORDINALS_FEM: Record<number, string> = {
  1: "primeira", 2: "segunda", 3: "terceira", 4: "quarta", 5: "quinta", 6: "sexta",
  7: "sétima", 8: "oitava", 9: "nona", 10: "décima", 11: "décima primeira", 12: "décima segunda"
};

const ES_ORDINALS_MASC: Record<number, string> = {
  1: "primer", 2: "segundo", 3: "tercer", 4: "cuarto", 5: "quinto", 6: "sexto",
  7: "séptimo", 8: "octavo", 9: "noveno", 10: "décimo", 11: "undécimo", 12: "duodécimo"
};

const ES_ORDINALS_FEM: Record<number, string> = {
  1: "primera", 2: "segunda", 3: "tercera", 4: "cuarta", 5: "quinta", 6: "sexta",
  7: "séptima", 8: "octava", 9: "novena", 10: "décima", 11: "undécima", 12: "duodécima"
};

const EN_ORDINALS: Record<number, string> = {
  1: "first", 2: "second", 3: "third", 4: "fourth", 5: "fifth", 6: "sixth",
  7: "seventh", 8: "eighth", 9: "ninth", 10: "tenth", 11: "eleventh", 12: "twelfth"
};

const DE_ORDINALS: Record<number, string> = {
  1: "erste", 2: "zweite", 3: "dritte", 4: "vierte", 5: "fünfte", 6: "sechste",
  7: "siebte", 8: "achte", 9: "neunte", 10: "zehnte", 11: "elfte", 12: "zwölfte"
};

const ROMAN_TO_INT: Record<string, number> = {
  I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
  VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12
};

const PERCENT_WORDS: Record<SupportedVoiceLanguage, string> = {
  pt: "por cento",
  es: "por ciento",
  en: "percent",
  de: "Prozent"
};

const RANGE_WORDS: Record<SupportedVoiceLanguage, string> = {
  pt: "a",
  es: "a",
  en: "to",
  de: "bis"
};

/**
 * Multilingual FCAT / IFAA Anatomical & Clinical Pronunciation Lexicon.
 */
export const DEFAULT_ANATOMICAL_LEXICON: readonly LexiconEntry[] = Object.freeze([
  // Acronyms
  { term: "FCAT", respelling: "Fê Cê Á Tê", language: "pt" },
  { term: "IFAA", respelling: "I Éfe Á Á", language: "pt" },
  { term: "FCAT", respelling: "Efe Ce A Te", language: "es" },
  { term: "IFAA", respelling: "I Efe A A", language: "es" },
  { term: "SNC", respelling: "sistema nervoso central", language: "pt" },
  { term: "SNP", respelling: "sistema nervoso periférico", language: "pt" },
  { term: "SNC", respelling: "sistema nervioso central", language: "es" },
  { term: "SNP", respelling: "sistema nervioso periférico", language: "es" },
  { term: "CNS", respelling: "central nervous system", language: "en" },
  { term: "PNS", respelling: "peripheral nervous system", language: "en" },
  { term: "ZNS", respelling: "zentrales Nervensystem", language: "de" },
  { term: "PNS", respelling: "peripheres Nervensystem", language: "de" },
  { term: "ATM", respelling: "articulação temporomandibular", language: "pt" },
  { term: "ATM", respelling: "articulación temporomandibular", language: "es" },
  { term: "TMJ", respelling: "temporomandibular joint", language: "en" },
  { term: "TMG", respelling: "Temporomandibulargelenk", language: "de" },
  { term: "LCA", respelling: "ligamento cruzado anterior", language: "pt" },
  { term: "LCP", respelling: "ligamento cruzado posterior", language: "pt" },
  { term: "ACL", respelling: "anterior cruciate ligament", language: "en" },
  { term: "PCL", respelling: "posterior cruciate ligament", language: "en" },
  { term: "VKB", respelling: "vorderes Kreuzband", language: "de" },
  { term: "HKB", respelling: "hinteres Kreuzband", language: "de" },
  { term: "mmHg", respelling: "milímetros de mercúrio", language: "pt" },
  { term: "mmHg", respelling: "milímetros de mercurio", language: "es" },
  { term: "mmHg", respelling: "millimeters of mercury", language: "en" },
  { term: "mmHg", respelling: "Millimeter Quecksilbersäule", language: "de" },
  { term: "cm³", respelling: "centímetros cúbicos", language: "pt" },
  { term: "cm³", respelling: "centímetros cúbicos", language: "es" },

  // Eponyms & French/Latin phonetic traps in PT-BR & ES
  { term: "ângulo de Louis", respelling: "ângulo de Luí", language: "pt" },
  { term: "ángulo de Louis", respelling: "ángulo de Luí", language: "es" },
  { term: "polígono de Willis", respelling: "polígono de Uílis", language: "pt" },
  { term: "polígono de Willis", respelling: "polígono de Uílis", language: "es" },
  { term: "aqueduto de Sylvius", respelling: "aqueduto de Sílvius", language: "pt" },
  { term: "forame de Monro", respelling: "forame de Monrô", language: "pt" },
  { term: "cápsula de Bowman", respelling: "cápsula de Bôuman", language: "pt" },
  { term: "alça de Henle", respelling: "alça de Rênle", language: "pt" },
  { term: "células de Schwann", respelling: "células de Xuvãn", language: "pt" },
  { term: "nódulos de Ranvier", respelling: "nódulos de Ranviê", language: "pt" },
  { term: "plexo de Auerbach", respelling: "plexo de Áuerbak", language: "pt" },
  { term: "plexo de Meissner", respelling: "plexo de Máissner", language: "pt" },

  // Complex Osteological & Myological Terms (PT-BR prosody stabilization)
  { term: "fossa supraespinhosa", respelling: "fóssa supra-espinhósa", language: "pt" },
  { term: "fossa infraespinhosa", respelling: "fóssa infra-espinhósa", language: "pt" },
  { term: "fossa subescapular", respelling: "fóssa sub-escapular", language: "pt" },
  { term: "fossas supraespinhosa e infraespinhosa", respelling: "fóssas supra-espinhósa e infra-espinhósa", language: "pt" },
  { term: "articulação acromioclavicular", respelling: "articulação acrômio-clavicular", language: "pt" },
  { term: "articulação glenoumeral", respelling: "articulação gleno-umeral", language: "pt" },
  { term: "articulação esternoclavicular", respelling: "articulação esterno-clavicular", language: "pt" },
  { term: "processo coracoide", respelling: "processo coracóide", language: "pt" },
  { term: "processo xifoide", respelling: "processo xifóide", language: "pt" },
  { term: "processo estiloide", respelling: "processo estilóide", language: "pt" },
  { term: "processo mastoide", respelling: "processo mastóide", language: "pt" },
  { term: "processo pterigoide", respelling: "processo pterigóide", language: "pt" },
  { term: "cavidade glenoide", respelling: "cavidade glenóide", language: "pt" },
  { term: "cavidade glenoidal", respelling: "cavidade glenoidál", language: "pt" },
  { term: "esternocleidomastoideo", respelling: "esterno-cleido-mastóideo", language: "pt" },
  { term: "tubérculo supraglenoidal", respelling: "tubérculo supra-glenoidál", language: "pt" },
  { term: "tubérculo infraglenoidal", respelling: "tubérculo infra-glenoidál", language: "pt" },
  { term: "parede posterolateral", respelling: "parede póstero-lateral", language: "pt" },
  { term: "anterolateralmente", respelling: "ântero-lateralmente", language: "pt" },
  { term: "neurovasculares", respelling: "neuro-vasculares", language: "pt" },
  { term: "osteoarticular", respelling: "ósteo-articular", language: "pt" },

  // Spanish complex anatomical prosody stabilization
  { term: "fosa supraespinosa", respelling: "fosa supra-espinosa", language: "es" },
  { term: "fosa infraespinosa", respelling: "fosa infra-espinosa", language: "es" },
  { term: "fosa subescapular", respelling: "fosa sub-escapular", language: "es" },
  { term: "articulación acromioclavicular", respelling: "articulación acromio-clavicular", language: "es" },
  { term: "articulación glenohumeral", respelling: "articulación gleno-humeral", language: "es" },
  { term: "esternocleidomastoideo", respelling: "esterno-cleido-mastoideo", language: "es" },
  { term: "pared posterolateral", respelling: "pared póstero-lateral", language: "es" }
]);

export function resolveVoiceLanguage(language?: string): SupportedVoiceLanguage {
  const clean = String(language || "pt").trim().toLowerCase();
  if (clean.startsWith("es") || clean === "spanish" || clean === "español") return "es";
  if (clean.startsWith("en") || clean === "english") return "en";
  if (clean.startsWith("de") || clean === "german" || clean === "deutsch") return "de";
  return "pt";
}

export function numberToWordsPt(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 9999) return String(n);
  if (n < 20) return PT_UNITS[n];
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const rem = n % 10;
    return rem === 0 ? PT_TENS[ten] : `${PT_TENS[ten]} e ${PT_UNITS[rem]}`;
  }
  if (n === 100) return "cem";
  if (n < 1000) {
    const hun = Math.floor(n / 100);
    const rem = n % 100;
    return rem === 0 ? PT_HUNDREDS[hun] : `${PT_HUNDREDS[hun]} e ${numberToWordsPt(rem)}`;
  }
  const thou = Math.floor(n / 1000);
  const rem = n % 1000;
  const thouPrefix = thou === 1 ? "mil" : `${numberToWordsPt(thou)} mil`;
  if (rem === 0) return thouPrefix;
  const connector = rem < 100 || rem % 100 === 0 ? " e " : " ";
  return `${thouPrefix}${connector}${numberToWordsPt(rem)}`;
}

export function numberToWordsEs(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 9999) return String(n);
  if (n < 30) return ES_UNITS[n];
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const rem = n % 10;
    return rem === 0 ? ES_TENS[ten] : `${ES_TENS[ten]} y ${ES_UNITS[rem]}`;
  }
  if (n === 100) return "cien";
  if (n < 1000) {
    const hun = Math.floor(n / 100);
    const rem = n % 100;
    return rem === 0 ? ES_HUNDREDS[hun] : `${ES_HUNDREDS[hun]} ${numberToWordsEs(rem)}`;
  }
  const thou = Math.floor(n / 1000);
  const rem = n % 1000;
  const thouPrefix = thou === 1 ? "mil" : `${numberToWordsEs(thou)} mil`;
  if (rem === 0) return thouPrefix;
  return `${thouPrefix} ${numberToWordsEs(rem)}`;
}

export function numberToWordsEn(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 9999) return String(n);
  if (n < 20) return EN_UNITS[n];
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const rem = n % 10;
    return rem === 0 ? EN_TENS[ten] : `${EN_TENS[ten]}-${EN_UNITS[rem]}`;
  }
  if (n < 1000) {
    const hun = Math.floor(n / 100);
    const rem = n % 100;
    return rem === 0 ? `${EN_UNITS[hun]} hundred` : `${EN_UNITS[hun]} hundred and ${numberToWordsEn(rem)}`;
  }
  const thou = Math.floor(n / 1000);
  const rem = n % 1000;
  const thouPrefix = `${numberToWordsEn(thou)} thousand`;
  if (rem === 0) return thouPrefix;
  return `${thouPrefix} ${numberToWordsEn(rem)}`;
}

export function numberToWordsDe(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 9999) return String(n);
  if (n < 20) return DE_UNITS[n];
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const rem = n % 10;
    return rem === 0 ? DE_TENS[ten] : `${DE_UNITS[rem]}und${DE_TENS[ten]}`;
  }
  if (n < 1000) {
    const hun = Math.floor(n / 100);
    const rem = n % 100;
    const prefix = hun === 1 ? "einhundert" : `${DE_UNITS[hun]}hundert`;
    return rem === 0 ? prefix : `${prefix}${numberToWordsDe(rem)}`;
  }
  const thou = Math.floor(n / 1000);
  const rem = n % 1000;
  const thouPrefix = thou === 1 ? "eintausend" : `${numberToWordsDe(thou)}tausend`;
  if (rem === 0) return thouPrefix;
  return `${thouPrefix}${numberToWordsDe(rem)}`;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function needsWordBoundary(ch: string): boolean {
  return /^[A-Za-z0-9_]$/.test(ch);
}

export function applyAnatomicalLexicon(
  text: string,
  language: SupportedVoiceLanguage,
  customLexicon?: Record<string, string>
): string {
  if (!text) return "";

  const merged = new Map<string, string>();
  for (const entry of DEFAULT_ANATOMICAL_LEXICON) {
    if (entry.language === "*" || entry.language === language) {
      merged.set(entry.term.toLowerCase(), entry.respelling);
    }
  }

  if (customLexicon) {
    for (const [k, v] of Object.entries(customLexicon)) {
      const cleanKey = k.trim();
      if (cleanKey) {
        merged.set(cleanKey.toLowerCase(), String(v));
      }
    }
  }

  const keys = Array.from(merged.keys()).sort((a, b) => b.length - a.length);
  if (keys.length === 0) return text;

  const alternatives = keys.map((key) => {
    const first = key[0] || "";
    const last = key[key.length - 1] || "";
    const prefix = needsWordBoundary(first) ? "\\b" : "";
    const suffix = needsWordBoundary(last) ? "\\b" : "";
    return `${prefix}${escapeRegExp(key)}${suffix}`;
  });

  const pattern = new RegExp(`(?:${alternatives.join("|")})`, "giu");
  return text.replace(pattern, (matched) => {
    const replacement = merged.get(matched.toLowerCase());
    return replacement !== undefined ? replacement : matched;
  });
}

function expandAnatomicalAbbreviations(text: string, lang: SupportedVoiceLanguage): string {
  let out = text;

  if (lang === "pt") {
    out = out
      .replace(/\bmm\.\s+(?=[a-záàâãéêíóôõúç])/gi, "músculos ")
      .replace(/\bm\.\s+(?=[a-záàâãéêíóôõúç])/gi, "músculo ")
      .replace(/\baa\.\s+(?=[a-záàâãéêíóôõúç])/gi, "artérias ")
      .replace(/\bart\.\s+(?=[a-záàâãéêíóôõúç])/gi, "artéria ")
      .replace(/\ba\.\s+(?=[a-záàâãéêíóôõúç])/gi, "artéria ")
      .replace(/\bnn\.\s+(?=[a-záàâãéêíóôõúç])/gi, "nervos ")
      .replace(/\bn\.\s+(?=[a-záàâãéêíóôõúç])/gi, "nervo ")
      .replace(/\bvv\.\s+(?=[a-záàâãéêíóôõúç])/gi, "veias ")
      .replace(/\bv\.\s+(?=[a-záàâãéêíóôõúç])/gi, "veia ")
      .replace(/\bligg\.\s+(?=[a-záàâãéêíóôõúç])/gi, "ligamentos ")
      .replace(/\blig\.\s+(?=[a-záàâãéêíóôõúç])/gi, "ligamento ")
      .replace(/\bproc\.\s+(?=[a-záàâãéêíóôõúç])/gi, "processo ")
      .replace(/\bfor\.\s+(?=[a-záàâãéêíóôõúç])/gi, "forame ");
  } else if (lang === "es") {
    out = out
      .replace(/\bmm\.\s+(?=[a-záéíóúñ])/gi, "músculos ")
      .replace(/\bm\.\s+(?=[a-záéíóúñ])/gi, "músculo ")
      .replace(/\baa\.\s+(?=[a-záéíóúñ])/gi, "arterias ")
      .replace(/\bart\.\s+(?=[a-záéíóúñ])/gi, "arteria ")
      .replace(/\ba\.\s+(?=[a-záéíóúñ])/gi, "arteria ")
      .replace(/\bnn\.\s+(?=[a-záéíóúñ])/gi, "nervios ")
      .replace(/\bn\.\s+(?=[a-záéíóúñ])/gi, "nervio ")
      .replace(/\bvv\.\s+(?=[a-záéíóúñ])/gi, "venas ")
      .replace(/\bv\.\s+(?=[a-záéíóúñ])/gi, "vena ")
      .replace(/\blig\.\s+(?=[a-záéíóúñ])/gi, "ligamento ")
      .replace(/\bproc\.\s+(?=[a-záéíóúñ])/gi, "proceso ")
      .replace(/\bfor\.\s+(?=[a-záéíóúñ])/gi, "foramen ");
  } else if (lang === "en") {
    out = out
      .replace(/\bmm\.\s+(?=[a-z])/gi, "muscles ")
      .replace(/\bm\.\s+(?=[a-z])/gi, "muscle ")
      .replace(/\baa\.\s+(?=[a-z])/gi, "arteries ")
      .replace(/\ba\.\s+(?=[a-z])/gi, "artery ")
      .replace(/\bnn\.\s+(?=[a-z])/gi, "nerves ")
      .replace(/\bn\.\s+(?=[a-z])/gi, "nerve ")
      .replace(/\bvv\.\s+(?=[a-z])/gi, "veins ")
      .replace(/\bv\.\s+(?=[a-z])/gi, "vein ")
      .replace(/\bligg\.\s+(?=[a-z])/gi, "ligaments ")
      .replace(/\blig\.\s+(?=[a-z])/gi, "ligament ");
  } else if (lang === "de") {
    out = out
      .replace(/\bmm\.\s+(?=[a-zäöü])/gi, "Musculi ")
      .replace(/\bm\.\s+(?=[a-zäöü])/gi, "Musculus ")
      .replace(/\baa\.\s+(?=[a-zäöü])/gi, "Arteriae ")
      .replace(/\ba\.\s+(?=[a-zäöü])/gi, "Arteria ")
      .replace(/\bnn\.\s+(?=[a-zäöü])/gi, "Nervi ")
      .replace(/\bn\.\s+(?=[a-zäöü])/gi, "Nervus ")
      .replace(/\bvv\.\s+(?=[a-zäöü])/gi, "Venae ")
      .replace(/\bv\.\s+(?=[a-zäöü])/gi, "Vena ")
      .replace(/\bligg\.\s+(?=[a-zäöü])/gi, "Ligamenta ")
      .replace(/\blig\.\s+(?=[a-zäöü])/gi, "Ligamentum ");
  }

  return out;
}

function expandNumbersAndOrdinals(text: string, lang: SupportedVoiceLanguage): string {
  let out = text;

  // 1a. Cranial nerve abbreviations: "NC VII", "NC X", "NC XI", "CN VII"
  out = out.replace(
    /\b(?:NC|CN)\s+(XII|XI|IX|VIII|VII|VI|IV|III|II|X|V|I)\b/gi,
    (full, roman: string) => {
      const num = ROMAN_TO_INT[roman.toUpperCase()];
      if (!num) return full;
      if (lang === "es") return `nervio craneal ${numberToWordsEs(num)}`;
      if (lang === "en") return `cranial nerve ${numberToWordsEn(num)}`;
      if (lang === "de") return `${DE_ORDINALS[num] || num} Hirnnerv`;
      return `nervo craniano ${numberToWordsPt(num)}`;
    }
  );

  // 1b. Cranial nerve Roman numerals: "par craniano VII" / "nervo craniano X"
  out = out.replace(
    /\b(par(?:es)?\s+cranian[oa]s?|nervos?\s+cranianos?|par(?:es)?\s+craneal(?:es)?|nervios?\s+craneal(?:es)?|cranial\s+nerves?|Hirnnerven?)\s+(XII|XI|IX|VIII|VII|VI|IV|III|II|X|V|I)\b/gi,
    (full, prefix: string, roman: string) => {
      const num = ROMAN_TO_INT[roman.toUpperCase()];
      if (!num) return full;
      if (lang === "es") return `${prefix} ${ES_ORDINALS_MASC[num] || numberToWordsEs(num)}`;
      if (lang === "en") return `${prefix} ${EN_ORDINALS[num] || numberToWordsEn(num)}`;
      if (lang === "de") return `${DE_ORDINALS[num] || num} ${prefix}`;
      return `${prefix} ${PT_ORDINALS_MASC[num] || numberToWordsPt(num)}`;
    }
  );

  // 2a. Vertebral ranges: C3-C6, L4-L5, T1-T12
  const rangeWord = RANGE_WORDS[lang] || "a";
  out = out.replace(
    /\b([CTLS])([1-9]|1[0-2])\s*[-–~]\s*([CTLS])([1-9]|1[0-2])\b/g,
    (_full, r1: string, d1: string, r2: string, d2: string) => {
      const num1 = Number(d1);
      const num2 = Number(d2);
      const w1 = lang === "es" ? numberToWordsEs(num1) : lang === "en" ? numberToWordsEn(num1) : lang === "de" ? numberToWordsDe(num1) : numberToWordsPt(num1);
      const w2 = lang === "es" ? numberToWordsEs(num2) : lang === "en" ? numberToWordsEn(num2) : lang === "de" ? numberToWordsDe(num2) : numberToWordsPt(num2);
      const letterMapPt: Record<string, string> = { C: "Cê", T: "Tê", L: "Éle", S: "Ésse" };
      const letterMapEs: Record<string, string> = { C: "Ce", T: "Te", L: "Ele", S: "Ese" };
      const letterMapEn: Record<string, string> = { C: "C", T: "T", L: "L", S: "S" };
      const letterMapDe: Record<string, string> = { C: "C", T: "T", L: "L", S: "S" };
      const map = lang === "es" ? letterMapEs : lang === "en" ? letterMapEn : lang === "de" ? letterMapDe : letterMapPt;
      return `${map[r1] || r1} ${w1} ${rangeWord} ${map[r2] || r2} ${w2}`;
    }
  );

  // 2b. Single Vertebral levels: C1-C7, T1-T12, L1-L5, S1-S5
  out = out.replace(/\b([CTLS])([1-9]|1[0-2])\b/g, (full, region: string, digits: string) => {
    const n = Number(digits);
    if (region === "C" && n > 7) return full;
    if (region === "L" && n > 5) return full;
    if (region === "S" && n > 5) return full;
    const word = lang === "es" ? numberToWordsEs(n) : lang === "en" ? numberToWordsEn(n) : lang === "de" ? numberToWordsDe(n) : numberToWordsPt(n);
    const letterMapPt: Record<string, string> = { C: "Cê", T: "Tê", L: "Éle", S: "Ésse" };
    const letterMapEs: Record<string, string> = { C: "Ce", T: "Te", L: "Ele", S: "Ese" };
    const letterMapEn: Record<string, string> = { C: "C", T: "T", L: "L", S: "S" };
    const letterMapDe: Record<string, string> = { C: "C", T: "T", L: "L", S: "S" };
    const letter = (lang === "es" ? letterMapEs[region] : lang === "en" ? letterMapEn[region] : lang === "de" ? letterMapDe[region] : letterMapPt[region]) || region;
    return `${letter} ${word}`;
  });

  // 3. Explicit Ordinals: 1º, 2ª, 7º
  if (lang === "pt") {
    out = out.replace(/\b(\d{1,2})([º°])/g, (full, d: string) => PT_ORDINALS_MASC[Number(d)] || full);
    out = out.replace(/\b(\d{1,2})([ª])/g, (full, d: string) => PT_ORDINALS_FEM[Number(d)] || full);
  } else if (lang === "es") {
    out = out.replace(/\b(\d{1,2})([º°])/g, (full, d: string) => ES_ORDINALS_MASC[Number(d)] || full);
    out = out.replace(/\b(\d{1,2})([ª])/g, (full, d: string) => ES_ORDINALS_FEM[Number(d)] || full);
  }

  // 4. Numeric ranges: "2~7" or "20-30"
  out = out.replace(/\b(\d{1,4})\s*[~\u301c\uff5e–]\s*(\d{1,4})\b/g, (_full, a: string, b: string) => {
    const na = Number(a);
    const nb = Number(b);
    if (lang === "pt") return `${numberToWordsPt(na)} ${rangeWord} ${numberToWordsPt(nb)}`;
    if (lang === "es") return `${numberToWordsEs(na)} ${rangeWord} ${numberToWordsEs(nb)}`;
    if (lang === "en") return `${numberToWordsEn(na)} ${rangeWord} ${numberToWordsEn(nb)}`;
    if (lang === "de") return `${numberToWordsDe(na)} ${rangeWord} ${numberToWordsDe(nb)}`;
    return `${a} ${rangeWord} ${b}`;
  });

  // 5. Percentages: "50%"
  const pctWord = PERCENT_WORDS[lang];
  out = out.replace(/\b(\d{1,3})%/g, (_full, d: string) => {
    const n = Number(d);
    if (lang === "pt") return `${numberToWordsPt(n)} ${pctWord}`;
    if (lang === "es") return `${numberToWordsEs(n)} ${pctWord}`;
    if (lang === "en") return `${numberToWordsEn(n)} ${pctWord}`;
    if (lang === "de") return `${numberToWordsDe(n)} ${pctWord}`;
    return `${d} ${pctWord}`;
  });

  // 6. Standalone cardinals in PT and ES
  if (lang === "pt") {
    out = out.replace(/(?<![.,\d/-])\b(\d{1,4})\b(?![.,\d/-])/g, (full, d: string) => {
      if (d.length > 1 && d.startsWith("0")) return full;
      return numberToWordsPt(Number(d));
    });
  } else if (lang === "es") {
    out = out.replace(/(?<![.,\d/-])\b(\d{1,4})\b(?![.,\d/-])/g, (full, d: string) => {
      if (d.length > 1 && d.startsWith("0")) return full;
      return numberToWordsEs(Number(d));
    });
  }

  return out;
}

/**
 * Main entry point for Aeternum Voice Engine text normalization.
 * Strips all citations and formatting, converts to pure oral text.
 */
export function normalizeAnatomicalTextForTTS(
  rawText: string,
  options: NormalizationOptions = {}
): string {
  try {
    if (!rawText || typeof rawText !== "string") return "";

    const lang = resolveVoiceLanguage(options.language);

    // 1. Mask [[inline_override]] spans so number/lexicon passes do not alter them
    const overrides: string[] = [];
    let working = rawText.replace(INLINE_OVERRIDE_RE, (_full, inner: string) => {
      const idx = overrides.length;
      overrides.push(inner.trim());
      return `__AET_OVR_${idx}__`;
    });

    // 2. Eradicate bibliographic citations and action tags before any other processing
    working = working
      .replace(CITATION_BRACKETS_RE, " ")
      .replace(GENERIC_BRACKETS_RE, " ")
      .replace(ACTION_TAG_RE, " ")
      .replace(ZERO_WIDTH_RE, "");

    // 3. Strip markdown symbols (*, #, _, `, >, |, etc.)
    working = working
      .replace(MARKDOWN_ARTIFACTS_RE, " ")
      .replace(PATHOLOGICAL_REPEAT_RE, "$1$1$1");

    // 4. Expand medical/anatomical abbreviations before number/lexicon passes
    working = expandAnatomicalAbbreviations(working, lang);

    // 5. Expand numbers, ordinals, vertebral levels, and percentages
    working = expandNumbersAndOrdinals(working, lang);

    // 6. Apply anatomical & clinical pronunciation lexicon (unless disabled)
    if (options.enableLexicon !== false) {
      working = applyAnatomicalLexicon(working, lang, options.customLexicon);
    }

    // 7. Unmask [[inline_override]] spans last (user's final phonetic override)
    working = working.replace(/__AET_OVR_(\d+)__/g, (_full, idxStr: string) => {
      const idx = Number(idxStr);
      return overrides[idx] !== undefined ? overrides[idx] : "";
    });

    // 8. Clean up whitespace around punctuation
    working = working
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .replace(/\s+/g, " ")
      .trim();

    return working;
  } catch {
    return String(rawText || "")
      .replace(/\[[^\]]*\]/g, "")
      .replace(/[*#_~`>|]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

const HONORIFIC_PREFIXES = [
  "Sras", "Srtas", "Profa", "Prof", "Dra", "Dr", "Sra", "Sr", "Srta",
  "Mr", "Mrs", "Ms", "art", "fig", "pág", "pag", "cap", "vol"
];

const HONORIFIC_RE = new RegExp(`\\b(${HONORIFIC_PREFIXES.join("|")})\\.`, "gi");

/**
 * Progressive Sentence Chunker for low-TTFA streaming TTS.
 */
export class SentenceChunker {
  private readonly minSentenceLen: number;
  private buffer = "";

  constructor(minSentenceLen = 20) {
    this.minSentenceLen = minSentenceLen;
  }

  public push(textChunk: string): string[] {
    this.buffer += textChunk;
    return this.extractCompleteSentences(false);
  }

  public flush(): string[] {
    const sentences = this.extractCompleteSentences(true);
    const remaining = this.buffer.trim();
    this.buffer = "";
    if (remaining) {
      if (sentences.length > 0 && remaining.length < this.minSentenceLen) {
        sentences[sentences.length - 1] = `${sentences[sentences.length - 1]} ${remaining}`.trim();
      } else {
        sentences.push(remaining);
      }
    }
    return sentences;
  }

  public splitText(fullText: string): string[] {
    return SentenceChunker.splitText(fullText, this.minSentenceLen);
  }

  public static splitText(fullText: string, minSentenceLen = 20): string[] {
    const chunker = new SentenceChunker(minSentenceLen);
    const out = chunker.push(fullText);
    out.push(...chunker.flush());
    return out.length > 0 ? out : (fullText.trim() ? [fullText.trim()] : []);
  }

  private extractCompleteSentences(forceAll: boolean): string[] {
    if (!this.buffer.trim()) return [];

    const masked = this.buffer.replace(HONORIFIC_RE, "$1<prd>");
    const parts = masked.split(/(?<=[.!?…;])\s+/);

    if (parts.length <= 1 && !forceAll) {
      return [];
    }

    const emitted: string[] = [];
    let currentAccum = "";

    const limit = forceAll ? parts.length : parts.length - 1;
    for (let i = 0; i < limit; i++) {
      const restored = parts[i].replace(/<prd>/g, ".").trim();
      if (!restored) continue;

      currentAccum = currentAccum ? `${currentAccum} ${restored}` : restored;
      if (currentAccum.length >= this.minSentenceLen || forceAll) {
        emitted.push(currentAccum);
        currentAccum = "";
      }
    }

    const tail = forceAll ? "" : (parts[parts.length - 1] || "").replace(/<prd>/g, ".");
    this.buffer = currentAccum ? (tail ? `${currentAccum} ${tail}` : currentAccum) : tail;

    return emitted;
  }
}
