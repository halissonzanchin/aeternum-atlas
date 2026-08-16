import { pt } from "../src/i18n/translations/pt.js";
import { en } from "../src/i18n/translations/en.js";
import { es } from "../src/i18n/translations/es.js";
import { de } from "../src/i18n/translations/de.js";

function flatten(obj, prefix = "") {
  let res = {};
  for (const key of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(res, flatten(obj[key], full));
    } else {
      res[full] = obj[key];
    }
  }
  return res;
}

const flatPT = flatten(pt);
const flatEN = flatten(en);
const flatES = flatten(es);
const flatDE = flatten(de);

const allKeys = Object.keys(flatPT);

console.log(`\n=== 🔍 ANÁLISE DE TRADUÇÕES IDÊNTICAS A PT (POSSÍVEIS NÃO TRADUZIDOS) ===\n`);

function checkUntranslated(langName, flatLang) {
  const untranslated = [];
  for (const key of allKeys) {
    const ptVal = flatPT[key];
    const langVal = flatLang[key];

    if (langVal === undefined) continue;

    // Se o valor for string com mais de 8 caracteres e for idêntico a PT (e não for URL, número, slug ou nome próprio fixo)
    if (
      typeof ptVal === "string" &&
      typeof langVal === "string" &&
      ptVal.length > 8 &&
      ptVal === langVal &&
      !key.includes("logo") &&
      !key.includes("url") &&
      !key.includes("icon") &&
      !key.includes("slug") &&
      !key.includes("date") &&
      !key.includes("Email") &&
      !key.includes("email") &&
      !ptVal.startsWith("http") &&
      !ptVal.startsWith("/") &&
      !["Aeternum Atlas", "Sketchfab", "Gemini 2.5", "WebGL"].includes(ptVal)
    ) {
      untranslated.push({ key, val: ptVal });
    }
  }
  console.log(`📌 ${langName}: ${untranslated.length} strings idênticas ao Português`);
  if (untranslated.length > 0) {
    console.log(untranslated.slice(0, 15).map(u => `   - [${u.key}]: "${u.val}"`).join("\n"));
    if (untranslated.length > 15) {
      console.log(`   ... e mais ${untranslated.length - 15} itens.`);
    }
  }
  console.log("");
  return untranslated;
}

const untranslatedEN = checkUntranslated("Inglês (EN)", flatEN);
const untranslatedES = checkUntranslated("Espanhol (ES)", flatES);
const untranslatedDE = checkUntranslated("Alemão (DE)", flatDE);
