import { getMgmtToken } from "./supabase_admin_helper.mjs";
import fs from "fs";

// Strict TLS using Windows System Root CA store

// --- LEGACY EXTRACTION FUNCTIONS (Exact copy from supabase/functions/ai-tutor/index.ts) ---
function legacyExtractSearchTerms(prompt) {
  const stopwords = new Set([
    "explique", "explica", "fale", "falar", "sobre", "quais", "qual", "quem", "como", "onde", "quando",
    "por", "que", "porque", "para", "com", "sem", "uma", "um", "umas", "uns", "dos", "das", "do", "da",
    "de", "em", "no", "na", "nos", "nas", "ao", "aos", "a", "o", "os", "as", "e", "ou", "se", "me", "diga",
    "mostre", "descreva", "detalhe", "apresente", "resuma", "sintetize", "ola", "oi", "bom", "dia", "boa", "tarde", "noite",
    "segundo", "atlas", "aeternum", "por favor", "base", "fontes", "variacoes", "variações", "anatomicas", "anatômicas",
    "documentadas", "pontos", "pulso", "correlacoes", "correlações", "cirurgico", "cirúrgico", "hemodinamicas", "hemodinâmicas",
    "gerar", "flashcards", "cartoes", "cartões", "nivel", "nível", "facil", "fácil", "medio", "médio", "dificil", "difícil"
  ]);
  return prompt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopwords.has(t));
}

const LEGACY_SYNONYM_MAP = {
  "arteria gonadal": ["artéria testicular", "artéria ovárica", "artérias testiculares", "artérias ováricas", "artéria gonadal"],
  "arterias gonadais": ["artéria testicular", "artéria ovárica", "artérias testiculares", "artérias ováricas", "artérias gonadais"],
  "arteria testicular": ["artérias gonadais", "artéria testicular", "artéria ovárica", "vasos testiculares"],
  "arterias testiculares": ["artérias gonadais", "artéria testicular", "artérias testiculares"],
  "arteria ovarica": ["artérias gonadais", "artéria ovárica", "artéria testicular", "vasos ováricos"],
  "arterias ovaricas": ["artérias gonadais", "artéria ovárica", "artérias ováricas"],
  "arterias testiculares e ovaricas": ["artérias gonadais", "artéria testicular", "artéria ovárica"],
  "plexo braquial": ["plexo braquial", "plexus brachialis", "troncos do plexo braquial", "fascículos do plexo braquial"],
  "poligono de willis": ["círculo arterial do cérebro", "polígono de willis", "circulus arteriosus cerebri"],
  "circulo arterial do cerebro": ["círculo arterial do cérebro", "polígono de willis"],
  "arteria carotida interna": ["carótida interna", "artéria carótida interna", "sifão carotídeo"],
  "arteria carotida comum": ["carótida comum", "artéria carótida comum", "bifurcação carotídea"],
  "arteria subclavia": ["artéria subclávia", "tronco tireocervical"],
  "arteria vertebral": ["artéria vertebral", "artéria basilar"],
  "nervo vago": ["nervo vago", "décimo par craniano", "nervus vagus", "nc x"],
  "nervo frenico": ["nervo frênico", "inervação diafragma"],
  "nervo isquiatico": ["nervo isquiático", "nervo ciático", "nervus ischiadicus"],
  "nervo ciatico": ["nervo isquiático", "nervo ciático", "nervus ischiadicus"],
  "nervo mediano": ["nervo mediano", "nervus medianus", "túnel do carpo"],
  "ducto coledoco": ["ducto colédoco", "via biliar principal", "ductus choledochus"],
  "feixe vasculonervoso": ["feixe neurovascular", "bainha carotídea", "feixe vasculonervoso"]
};

function legacyNormalizeKey(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function legacyDecomposeTopic(rawTopic) {
  const clean = String(rawTopic || "").trim();
  if (!clean) return { nuclearTopic: "", subtopics: [], searchQueries: [] };

  const segments = clean
    .split(/[-—–:;|/()\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const rawNuclear = segments[0] || clean;
  const nuclearTopic = rawNuclear
    .replace(/^(visao geral|estudo sobre|anatomia da|anatomia do|morfologia da|morfologia do)\s+/i, "")
    .trim();

  const subtopics = segments.slice(1);
  const queries = [];

  if (nuclearTopic) {
    queries.push(nuclearTopic);
  }

  const normKey = legacyNormalizeKey(nuclearTopic);
  for (const [key, synList] of Object.entries(LEGACY_SYNONYM_MAP)) {
    if (normKey.includes(key) || key.includes(normKey)) {
      for (const syn of synList) {
        if (!queries.includes(syn)) queries.push(syn);
      }
    }
  }

  const nuclearTerms = legacyExtractSearchTerms(nuclearTopic);
  if (nuclearTerms.length >= 2 && nuclearTerms.length <= 3) {
    const joined = nuclearTerms.join(" ");
    if (!queries.includes(joined)) queries.push(joined);
  }

  for (const sub of subtopics) {
    const subTerms = legacyExtractSearchTerms(sub).slice(0, 2);
    if (subTerms.length > 0 && nuclearTerms.length > 0) {
      const combined = `${nuclearTerms.slice(0, 2).join(" ")} ${subTerms.join(" ")}`;
      if (!queries.includes(combined)) queries.push(combined);
    }
  }

  return { nuclearTopic, subtopics, searchQueries: queries };
}

// --- QUALIFIED EXTRACTION FUNCTIONS ---
import { buildCalibratedSearchQueries as buildQualifiedSearchQueries } from "./calibrated_retrieval.mjs";

const testBattery = [
  // 1. Perguntas curtas (PT)
  { id: "TC-01", category: "Curta (PT)", query: "Escápula", lang: "pt", domain: "Osteologia", isFictitious: false },
  { id: "TC-02", category: "Curta (PT)", query: "Nervo vago", lang: "pt", domain: "Neuroanatomia", isFictitious: false },
  { id: "TC-03", category: "Curta (PT)", query: "Ventrículo esquerdo", lang: "pt", domain: "Cardiovascular", isFictitious: false },
  
  // 2. Perguntas com 4 ou mais termos relevantes (PT)
  { id: "TC-04", category: ">=4 Termos (PT)", query: "Quais são as inserções proximais e distais do músculo bíceps braquial?", lang: "pt", domain: "Miologia", isFictitious: false },
  { id: "TC-05", category: ">=4 Termos (PT)", query: "Qual é o trajeto detalhado e os ramos principais do nervo vago no mediastino posterior?", lang: "pt", domain: "Neuroanatomia", isFictitious: false },
  { id: "TC-06", category: ">=4 Termos (PT)", query: "Descreva a origem embriológica, anatomia macroscópica e vascularização da glândula tireoide.", lang: "pt", domain: "Endócrino / Vísceras", isFictitious: false },
  { id: "TC-07", category: ">=4 Termos (PT)", query: "Como se dá a inervação motora e sensitiva do músculo trapézio no dorso humano?", lang: "pt", domain: "Miologia", isFictitious: false },

  // 3. Perguntas extensas / discursivas
  { id: "TC-08", category: "Extensa / Discursiva", query: "Explique a anatomia cirúrgica da artéria subclávia, dividindo suas três partes em relação ao músculo escaleno anterior e listando todos os seus ramos colaterais.", lang: "pt", domain: "Angiologia", isFictitious: false },
  { id: "TC-09", category: "Extensa / Discursiva", query: "Discorra sobre a formação dos troncos, divisões e fascículos do plexo braquial e suas relações anatômicas com a artéria axilar na fossa axilar.", lang: "pt", domain: "Neuroanatomia", isFictitious: false },
  { id: "TC-10", category: "Extensa / Discursiva", query: "Apresente as relações topográficas da face posterior do estômago com o pâncreas, bolsa omental e artéria esplênica.", lang: "pt", domain: "Anatomia Visceral", isFictitious: false },

  // 4. Consultas com sinônimos e epônimos clássicos
  { id: "TC-11", category: "Sinônimos / Epônimos", query: "Quais são as artérias que formam o polígono de Willis?", lang: "pt", domain: "Angiologia / Neuro", isFictitious: false },
  { id: "TC-12", category: "Sinônimos / Epônimos", query: "Descreva os limites e o assoalho da fossa cubital ou fossa antecubital.", lang: "pt", domain: "Anatomia Regional", isFictitious: false },
  { id: "TC-13", category: "Sinônimos / Epônimos", query: "Qual é a função e o trajeto do nervo ciático ou isquiático?", lang: "pt", domain: "Neuroanatomia", isFictitious: false },
  { id: "TC-14", category: "Sinônimos / Epônimos", query: "Onde desemboca o ducto colédoco na via biliar principal?", lang: "pt", domain: "Anatomia Visceral", isFictitious: false },

  // 5. Variações ortográficas: com e sem acentos
  { id: "TC-15", category: "Sem Acentos", query: "Quais sao os acidentes anatomicos da face posterior da escapula?", lang: "pt", domain: "Osteologia", isFictitious: false },
  { id: "TC-16", category: "Sem Acentos", query: "Como e a vascularizacao do musculo deltoide no ombro?", lang: "pt", domain: "Miologia", isFictitious: false },
  { id: "TC-17", category: "Sem Acentos", query: "Descreva o trajeto da arteria carotida interna no pescoco.", lang: "pt", domain: "Angiologia", isFictitious: false },
  { id: "TC-18", category: "Com Acentos", query: "Artéria carótida comum e bifurcação carotídea ao nível de C4.", lang: "pt", domain: "Angiologia", isFictitious: false },

  // 6. Terminologia Anatômica Internacional (TA2 / TA98 / Latim)
  { id: "TC-19", category: "Terminologia (TA2/Latim)", query: "Quais estruturas formam o circulus arteriosus cerebri?", lang: "la/pt", domain: "Neuroanatomia", isFictitious: false },
  { id: "TC-20", category: "Terminologia (TA2/Latim)", query: "Qual é a inserção terminal do musculus biceps brachii?", lang: "la/pt", domain: "Miologia", isFictitious: false },
  { id: "TC-21", category: "Terminologia (TA2/Latim)", query: "Origem e trajeto do nervus medianus no antebrachium.", lang: "la/pt", domain: "Neuroanatomia", isFictitious: false },
  { id: "TC-22", category: "Terminologia (TA2/Latim)", query: "Quais são as fixações do ligamentum inguinale?", lang: "la/pt", domain: "Anatomia Regional", isFictitious: false },

  // 7. Perguntas em Espanhol (Latarjet / Snell)
  { id: "TC-23", category: "Espanhol (ES)", query: "¿Cuáles son las inserciones del músculo pectoral mayor según Latarjet?", lang: "es", domain: "Miologia", isFictitious: false },
  { id: "TC-24", category: "Espanhol (ES)", query: "¿Cómo se describe la configuración interna del ventrículo izquierdo en anatomía clínica?", lang: "es", domain: "Cardiovascular", isFictitious: false },
  { id: "TC-25", category: "Espanhol (ES)", query: "¿Cuáles son las ramas de la arteria subclavia en su trayecto cervical?", lang: "es", domain: "Angiologia", isFictitious: false },
  { id: "TC-26", category: "Espanhol (ES)", query: "Describa el origen y relaciones del nervio ciático mayor en la región glútea.", lang: "es", domain: "Neuroanatomia", isFictitious: false },
  { id: "TC-27", category: "Espanhol (ES)", query: "¿Qué estructuras componen la vía biliar extrahepática y el colédoco?", lang: "es", domain: "Anatomia Visceral", isFictitious: false },

  // 8. Estruturas Vasculares e Circulatórias
  { id: "TC-28", category: "Vascular", query: "Quais são os ramos do arco aórtico e suas principais variações anatômicas?", lang: "pt", domain: "Angiologia", isFictitious: false },
  { id: "TC-29", category: "Vascular", query: "Como é formada a veia cava superior a partir das veias braquiocefálicas?", lang: "pt", domain: "Angiologia", isFictitious: false },
  { id: "TC-30", category: "Vascular", query: "Qual é a origem e distribuição da artéria femoral profunda na coxa?", lang: "pt", domain: "Angiologia", isFictitious: false },

  // 9. Inervação e Sistema Nervoso Periférico
  { id: "TC-31", category: "Inervação", query: "Qual nervo é responsável pela inervação dos músculos extensores do antebraço e dorso da mão?", lang: "pt", domain: "Neuroanatomia", isFictitious: false },
  { id: "TC-32", category: "Inervação", query: "Quais raízes espinais formam o nervo frênico e qual é sua inervação diafragmática?", lang: "pt", domain: "Neuroanatomia", isFictitious: false },

  // 10. Anatomia Regional e Relações Topográficas
  { id: "TC-33", category: "Topografia Regional", query: "Quais são os limites anatômicos do trígono femoral ou triângulo de Scarpa?", lang: "pt", domain: "Anatomia Regional", isFictitious: false },
  { id: "TC-34", category: "Topografia Regional", query: "Descreva a bainha dos músculos retos do abdome acima e abaixo da linha arqueada.", lang: "pt", domain: "Anatomia Regional", isFictitious: false },

  // 11. Correlações Clínicas Anatômicas
  { id: "TC-35", category: "Correlação Clínica", query: "Qual estrutura é comprimida na síndrome do túnel do carpo e quais são os déficits motores?", lang: "pt", domain: "Clínica Cirúrgica", isFictitious: false },
  { id: "TC-36", category: "Correlação Clínica", query: "Quais são os pontos de palpação do pulso da artéria radial e da artéria femoral?", lang: "pt", domain: "Exame Físico", isFictitious: false },

  // 12. Perguntas Ambíguas ou Sintéticas
  { id: "TC-37", category: "Ambígua / Sintética", query: "Cabeça longa e cabeça curta", lang: "pt", domain: "Miologia", isFictitious: false },
  { id: "TC-38", category: "Ambígua / Sintética", query: "Átrio e ventrículo diferenças", lang: "pt", domain: "Cardiovascular", isFictitious: false },

  // 13. Perguntas Genuinamente Sem Evidência Suficiente / Fictícias (Evidence Gate Test)
  { id: "TC-39", category: "Fictícia / Sem Evidência", query: "Qual é a vascularização e inserção do nervo telecinético subquântico na calvária?", lang: "pt", domain: "Fictício", isFictitious: true },
  { id: "TC-40", category: "Fictícia / Sem Evidência", query: "¿Cómo se inserta la arteria levitatoria ectoplasmática en el hueso astral según Moore?", lang: "es", domain: "Fictício", isFictitious: true }
];

async function evaluateCase(token, tc) {
  // --- 1. LEGACY RETRIEVAL SIMULATION ---
  let legacyQueries = [];
  const legacyDecomp = legacyDecomposeTopic(tc.query);
  if (legacyDecomp.nuclearTopic && legacyDecomp.nuclearTopic.length <= 80) {
    legacyQueries.push(legacyDecomp.nuclearTopic);
  }
  for (const q of legacyDecomp.searchQueries) {
    if (!legacyQueries.includes(q)) legacyQueries.push(q);
  }
  const legacyTerms = legacyExtractSearchTerms(tc.query);
  if (legacyTerms.length > 0 && legacyTerms.length <= 3) {
    const joined = legacyTerms.join(" ");
    if (!legacyQueries.includes(joined)) legacyQueries.push(joined);
  }

  let legacySources = [];
  for (const q of legacyQueries.slice(0, 3)) {
    if (legacySources.length >= 4) break;
    const cleanQ = q.replace(/'/g, "''");
    const sql = `
      SELECT id, book_title, page_number
      FROM public.vita_anatomical_knowledge
      WHERE to_tsvector('public.pt_unaccent', coalesce(book_title, '') || ' ' || coalesce(content, '')) @@ websearch_to_tsquery('public.pt_unaccent', '${cleanQ}')
      LIMIT 4;
    `;
    try {
      const res = await (await fetch("https://api.supabase.com/v1/projects/hyivyrietgjdazgizafp/database/query", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ query: sql })
      })).json();
      if (Array.isArray(res)) {
        for (const row of res) {
          if (!legacySources.some(s => s.id === row.id)) legacySources.push(row);
        }
      }
    } catch {}
  }
  const legacyGate = legacySources.length > 0 ? "PASS" : "BLOCKED";

  // --- 2. QUALIFIED NEW RETRIEVAL SIMULATION ---
  const qualifiedQueries = buildQualifiedSearchQueries(tc.query);
  let qualifiedSources = [];
  for (const q of qualifiedQueries) {
    if (qualifiedSources.length >= 4) break;
    const cleanQ = q.replace(/'/g, "''");
    const sql = `
      SELECT id, book_title, page_number, substring(content from 1 for 100) as snippet
      FROM public.vita_anatomical_knowledge
      WHERE to_tsvector('public.pt_unaccent', coalesce(book_title, '') || ' ' || coalesce(content, '')) @@ websearch_to_tsquery('public.pt_unaccent', '${cleanQ}')
      LIMIT 4;
    `;
    try {
      const res = await (await fetch("https://api.supabase.com/v1/projects/hyivyrietgjdazgizafp/database/query", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ query: sql })
      })).json();
      if (Array.isArray(res)) {
        for (const row of res) {
          if (!qualifiedSources.some(s => s.id === row.id)) qualifiedSources.push(row);
        }
      }
    } catch {}
  }
  const qualifiedGate = qualifiedSources.length > 0 ? "PASS" : "BLOCKED";

  const expectedGate = tc.isFictitious ? "BLOCKED" : "PASS";
  const legacyCorrect = legacyGate === expectedGate;
  const qualifiedCorrect = qualifiedGate === expectedGate;

  return {
    id: tc.id,
    category: tc.category,
    domain: tc.domain,
    lang: tc.lang,
    query: tc.query,
    isFictitious: tc.isFictitious,
    expectedGate,
    legacy: {
      queries: legacyQueries,
      sourcesCount: legacySources.length,
      gate: legacyGate,
      correct: legacyCorrect
    },
    qualified: {
      queries: qualifiedQueries,
      sourcesCount: qualifiedSources.length,
      gate: qualifiedGate,
      correct: qualifiedCorrect,
      topSource: qualifiedSources[0] ? `${qualifiedSources[0].book_title} (p. ${qualifiedSources[0].page_number})` : "Nenhum"
    }
  };
}

async function runBattery() {
  const token = await getMgmtToken();
  console.log(`=== RUNNING 40-CASE SCIENTIFIC RETRIEVAL BATTERY ===`);
  const results = [];

  for (let i = 0; i < testBattery.length; i++) {
    const tc = testBattery[i];
    process.stdout.write(`Evaluating [${i + 1}/40] ${tc.id}: ${tc.category} ... `);
    const res = await evaluateCase(token, tc);
    results.push(res);
    console.log(`Legacy: ${res.legacy.gate} (${res.legacy.sourcesCount} chunks, ${res.legacy.correct ? "OK" : "FAIL"}) | Qualified: ${res.qualified.gate} (${res.qualified.sourcesCount} chunks, ${res.qualified.correct ? "OK" : "FAIL"})`);
  }

  const total = results.length;
  const legacyAcc = results.filter(r => r.legacy.correct).length;
  const qualAcc = results.filter(r => r.qualified.correct).length;

  console.log("\n=== 40-CASE SCIENTIFIC BATTERY SUMMARY ===");
  console.log(`Total Cases: ${total}`);
  console.log(`Legacy RAG Accuracy: ${legacyAcc}/${total} (${((legacyAcc/total)*100).toFixed(1)}%)`);
  console.log(`Qualified RAG Accuracy: ${qualAcc}/${total} (${((qualAcc/total)*100).toFixed(1)}%)`);

  const falseRejectionsLegacy = results.filter(r => !r.isFictitious && r.legacy.gate === "BLOCKED").length;
  const falseRejectionsQual = results.filter(r => !r.isFictitious && r.qualified.gate === "BLOCKED").length;
  const fictitiousBlockedLegacy = results.filter(r => r.isFictitious && r.legacy.gate === "BLOCKED").length;
  const fictitiousBlockedQual = results.filter(r => r.isFictitious && r.qualified.gate === "BLOCKED").length;

  console.log(`False Rejections (Legitimate anatomy blocked): Legacy = ${falseRejectionsLegacy} vs Qualified = ${falseRejectionsQual}`);
  console.log(`Fictitious Properly Blocked by Evidence Gate: Legacy = ${fictitiousBlockedLegacy}/2 vs Qualified = ${fictitiousBlockedQual}/2`);

  const artifactPath = "C:\\Users\\halis\\.gemini\\antigravity\\brain\\b63445c2-37f0-46a4-8ca8-5556eb65a8a3\\P0.19_B_MATRIZ_CIENTIFICA_ANTES_DEPOIS.json";
  fs.writeFileSync(artifactPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalCases: total,
    legacyAccuracy: `${((legacyAcc/total)*100).toFixed(1)}%`,
    qualifiedAccuracy: `${((qualAcc/total)*100).toFixed(1)}%`,
    falseRejections: {
      legacy: falseRejectionsLegacy,
      qualified: falseRejectionsQual
    },
    fictitiousBlocked: {
      legacy: fictitiousBlockedLegacy,
      qualified: fictitiousBlockedQual
    },
    cases: results
  }, null, 2), "utf8");
  console.log(`\nArtifact written to: ${artifactPath}`);
}

runBattery().catch(console.error);
