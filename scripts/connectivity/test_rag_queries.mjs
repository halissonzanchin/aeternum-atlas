// scripts/connectivity/test_rag_queries.mjs
import { createClient } from "@supabase/supabase-js";
import { extractSearchTerms, evaluateEvidenceSufficiency } from "../../supabase/functions/ai-tutor/index.ts";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient("https://hyivyrietgjdazgizafp.supabase.co", serviceRoleKey);

const structures = [
  { name: "Fêmur", prompt: "Fale sobre a anatomia do fêmur e seus principais acidentes ósseos.", target: ["femur"] },
  { name: "Coração", prompt: "Descreva a vascularização do coração através das artérias coronárias.", target: ["coracao"] },
  { name: "Pulmão", prompt: "Explique a anatomia dos pulmões, seus lobos e fissuras.", target: ["pulmao"] },
  { name: "Plexo Braquial", prompt: "Quais são as raízes espinhais e troncos do plexo braquial?", target: [] },
  { name: "Escápula", prompt: "Quais são as margens e fossas da escápula?", target: ["escapula"] }
];

console.log("=================================================================");
console.log("  TESTE DE RECUPERAÇÃO RAG PARA AS 5 ESTRUTURAS PRINCIPAIS       ");
console.log("=================================================================\n");

for (const item of structures) {
  console.log(`\n=================================================================`);
  console.log(`ESTRUTURA: ${item.name}`);
  console.log(`Prompt: "${item.prompt}"`);
  const terms = extractSearchTerms(item.prompt);
  console.log(`Termos extraídos: [${terms.map(t => `"${t}"`).join(", ")}]`);

  const searchCandidates = [
    terms.join(" "),
    item.target.length > 0 ? item.target.join(" ") : null,
    terms.length > 2 ? terms.slice(0, 3).join(" ") : null,
    item.target.length > 0 && terms[0] !== item.target[0] ? `${terms[0]} ${item.target[0]}` : null,
    item.prompt
  ].filter(Boolean);

  console.log(`Candidatos de busca:`, searchCandidates);

  let bestSources = [];
  let bestMethod = "none";
  let bestQuery = "";

  for (const q of searchCandidates) {
    // 1. Sovereign Hybrid RPC
    const { data: sov, error: sovErr } = await sb.rpc("match_vita_sovereign_knowledge", {
      search_query: q,
      target_entities: item.target,
      match_count: 4
    });

    if (!sovErr && Array.isArray(sov) && sov.length > 0) {
      bestSources = sov;
      bestMethod = "match_vita_sovereign_knowledge";
      bestQuery = q;
      break;
    }

    // 2. Sovereign Hybrid RPC without target_entities
    const { data: sov2, error: sovErr2 } = await sb.rpc("match_vita_sovereign_knowledge", {
      search_query: q,
      target_entities: [],
      match_count: 4
    });

    if (!sovErr2 && Array.isArray(sov2) && sov2.length > 0) {
      bestSources = sov2;
      bestMethod = "match_vita_sovereign_knowledge (no target entities)";
      bestQuery = q;
      break;
    }

    // 3. FTS fallback
    const { data: fts, error: ftsErr } = await sb.rpc("match_vita_anatomical_knowledge", {
      search_query: q,
      match_count: 4
    });

    if (!ftsErr && Array.isArray(fts) && fts.length > 0) {
      bestSources = fts;
      bestMethod = "match_vita_anatomical_knowledge (FTS)";
      bestQuery = q;
      break;
    }
  }

  console.log(`-> Melhor consulta com resultado: "${bestQuery}" via ${bestMethod}`);
  console.log(`-> Total fontes retornadas: ${bestSources.length}`);

  if (bestSources.length > 0) {
    bestSources.forEach((s, idx) => {
      console.log(`   [#${idx + 1}] Livro: ${s.book_title || "N/A"} | Pág: ${s.page_number || "N/A"}`);
      console.log(`        Tamanho: ${s.content?.length} | Prévia: "${(s.content || "").slice(0, 120).replace(/\n/g, " ")}..."`);
    });

    const mapped = bestSources.map(s => ({
      id: s.id,
      book_title: s.book_title,
      page_number: s.page_number,
      content: s.content,
      similarity: s.lexical_rank || s.similarity,
      lexical_rank: s.lexical_rank
    }));

    const gate = evaluateEvidenceSufficiency(mapped, []);
    console.log(`-> Evidence Gate: sufficient=${gate.sufficient}, reason=${gate.reason}`);
  } else {
    console.log(`-> ⚠️ NENHUMA FONTE ENCONTRADA`);
  }
}
