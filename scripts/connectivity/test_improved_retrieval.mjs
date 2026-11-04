// scripts/connectivity/test_improved_retrieval.mjs
import { createClient } from "@supabase/supabase-js";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient("https://hyivyrietgjdazgizafp.supabase.co", serviceRoleKey);

export function extractSearchTerms(prompt) {
  const stopwords = new Set([
    // Português
    "explique", "explica", "fale", "falar", "sobre", "quais", "qual", "quem", "como", "onde", "quando",
    "por", "que", "porque", "para", "com", "sem", "uma", "um", "umas", "uns", "dos", "das", "do", "da",
    "de", "em", "no", "na", "nos", "nas", "ao", "aos", "a", "o", "os", "as", "e", "ou", "se", "me", "diga",
    "mostre", "descreva", "detalhe", "detalhadamente", "apresente", "resuma", "sintetize", "ola", "oi", "bom", "dia", "boa", "tarde", "noite",
    "segundo", "atlas", "aeternum", "por favor", "base", "fontes",
    "sao", "seus", "suas", "seu", "sua", "tem", "ha", "este", "esta", "estes", "estas",
    "esse", "essa", "esses", "essas", "aquele", "aquela", "aqueles", "aquelas", "dele", "dela",
    "deles", "delas", "entre", "posso", "pode", "podem", "atraves",
    // Español
    "hable", "hablar", "cuales", "quien", "donde", "cuando", "unos", "del", "dela",
    "el", "los", "las", "al", "y", "u", "son", "es", "sea", "muestre", "describa", "detalle", "presente", "buen", "buenos", "dias",
    "buenas", "tardes", "noches", "segun", "favor", "estimado", "sus", "su", "traves"
  ]);
  return prompt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopwords.has(t));
}

export function evaluateEvidenceSufficiency(sources, canonicalFacts) {
  if (canonicalFacts && canonicalFacts.length > 0) {
    return { sufficient: true, reason: "CANONICAL_CONTEXT_AVAILABLE" };
  }
  if (!sources || sources.length === 0) {
    return { sufficient: false, reason: "NO_SOURCES_RETRIEVED" };
  }
  const topMatch = sources[0];
  const content = (topMatch.content || "").trim();
  if (content.length < 60) {
    return { sufficient: false, reason: "INSUFFICIENT_CONTENT_LENGTH" };
  }
  const anatomicalMarkers = /\b(nervo|nervio|musculo|músculo|arteria|artéria|osso|hueso|cartilagem|cartílago|veia|vena|vaso|ramo|ramus|plexo|plexus|insercao|inserção|inserción|origem|origen|articulacao|articulação|articulación|fasciculo|fascículo|espaco|espaço|espacio|face|borda|borde|ligamento|forame|foramen|processo|proceso|tuberculo|tubérculo|fossa|fosa|sulco|surco|espinha|espina|cavidade|cavidad|labrum|extremidade|extremo|crista|cresta|segmento|raiz|tronco|cordao|cordão|cordon|cuerda|lobo|fissura|valvula|atrio|ventriculo|septo|coronaria|aorta|pulmao|pulmon|diafragma)\b/i;
  if (!anatomicalMarkers.test(content)) {
    return { sufficient: false, reason: "NO_ANATOMICAL_MARKERS_IN_TOP_SOURCE" };
  }
  return { sufficient: true, reason: "SOURCE_EVIDENCE_SUFFICIENT" };
}

async function retrieveKnowledgeSim(prompt, targetEntities = []) {
  const terms = extractSearchTerms(prompt);
  const searchQueries = [];

  if (terms.length > 0) {
    searchQueries.push(terms.join(" "));
    if (targetEntities.length > 0) {
      const tgt = targetEntities.join(" ");
      if (!searchQueries.includes(tgt)) searchQueries.push(tgt);
    }
    if (terms.length > 2) {
      const first3 = terms.slice(0, 3).join(" ");
      const last2 = terms.slice(-2).join(" ");
      if (!searchQueries.includes(first3)) searchQueries.push(first3);
      if (!searchQueries.includes(last2)) searchQueries.push(last2);
    }
  }
  if (!searchQueries.includes(prompt)) searchQueries.push(prompt);

  console.log(`  Candidatos ordenados:`, searchQueries);

  for (const q of searchQueries) {
    try {
      // 1. Sovereign Hybrid RPC com target_entities
      if (targetEntities && targetEntities.length > 0) {
        const { data: sovData, error: sovError } = await sb.rpc("match_vita_sovereign_knowledge", {
          search_query: q,
          target_entities: targetEntities,
          match_count: 4
        });
        if (!sovError && Array.isArray(sovData) && sovData.length > 0) {
          return { sources: sovData, method: "sovereign-hybrid-rpc (targeted)", query: q };
        }
      }

      // 2. Sovereign Hybrid RPC amplo (sem target_entities restritivo)
      const { data: sovDataBroad, error: sovErrorBroad } = await sb.rpc("match_vita_sovereign_knowledge", {
        search_query: q,
        target_entities: [],
        match_count: 4
      });
      if (!sovErrorBroad && Array.isArray(sovDataBroad) && sovDataBroad.length > 0) {
        return { sources: sovDataBroad, method: "sovereign-hybrid-rpc (broad)", query: q };
      }

      // 3. FTS fallback
      const { data: ftsData, error: ftsError } = await sb.rpc("match_vita_anatomical_knowledge", {
        search_query: q,
        match_count: 4
      });
      if (!ftsError && Array.isArray(ftsData) && ftsData.length > 0) {
        return { sources: ftsData, method: "postgresql-fts", query: q };
      }
    } catch (err) {
      console.warn("  Erro na consulta:", q, err.message);
    }
  }

  return { sources: [], method: "none", query: "" };
}

const testPrompts = [
  { name: "Fêmur", prompt: "Fale sobre a anatomia do fêmur e seus principais acidentes ósseos.", target: ["femur"] },
  { name: "Coração", prompt: "Descreva a vascularização do coração através das artérias coronárias.", target: ["coracao"] },
  { name: "Pulmão", prompt: "Explique a anatomia dos pulmões, seus lobos e fissuras.", target: ["pulmao"] },
  { name: "Plexo Braquial", prompt: "Quais são as raízes espinhais e troncos do plexo braquial?", target: [] },
  { name: "Escápula", prompt: "Quais são as margens e fossas da escápula?", target: ["escapula"] }
];

console.log("=================================================================");
console.log("  VALIDAÇÃO EMPÍRICA DA NOVA DECOMPOSIÇÃO DE BUSCA               ");
console.log("=================================================================\n");

let allPassed = true;
for (const item of testPrompts) {
  console.log(`\nESTRUTURA: ${item.name}`);
  console.log(`Prompt: "${item.prompt}"`);
  const t0 = Date.now();
  const res = await retrieveKnowledgeSim(item.prompt, item.target);
  const latency = Date.now() - t0;

  console.log(`Resultado: ${res.sources.length} fontes encontradas via ${res.method} (query: "${res.query}") em ${latency}ms`);
  if (res.sources.length > 0) {
    const gate = evaluateEvidenceSufficiency(res.sources, []);
    console.log(`Evidence Gate: sufficient=${gate.sufficient}, reason=${gate.reason}`);
    console.log(`Fonte #1: Livro: ${res.sources[0].book_title} | Pág: ${res.sources[0].page_number} | Chars: ${res.sources[0].content?.length}`);
    console.log(`Prévia: "${res.sources[0].content?.slice(0, 110).replace(/\n/g, " ")}..."`);
    if (!gate.sufficient) allPassed = false;
  } else {
    console.error(`❌ NENHUMA FONTE ENCONTRADA!`);
    allPassed = false;
  }
}

console.log("\n=================================================================");
console.log(`RESULTADO FINAL: ${allPassed ? "✅ TODAS AS 5 ESTRUTURAS APROVADAS NO RAG!" : "❌ FALHA EM ALGUMA ESTRUTURA"}`);
console.log("=================================================================");
