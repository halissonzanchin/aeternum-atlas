import { generateAnatomicalFlashcards, decomposeTopicDynamically, validateFlashcardCorrespondence } from "../../src/services/ai/flashcardGenerationService.js";

const BRIDGE_URL = "http://127.0.0.1:8082";

async function queryRealEngine(payload) {
  const res = await fetch(`${BRIDGE_URL}/functions/v1/ai-tutor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return { status: res.status, mode: "live", ...data };
}

const liveTutorSender = async (req) => {
  return queryRealEngine({
    question: req.text,
    language: "pt-BR",
    context: req.context,
    stream: false
  });
};

const TEST_TOPICS = [
  { name: "Artéria aorta ascendente", difficulty: "Difícil", count: "many" }, // 20
  { name: "Plexo braquial", difficulty: "Difícil", count: "standard" },       // 10
  { name: "Nervo radial", difficulty: "Médio", count: "standard" },          // 10
  { name: "Fêmur", difficulty: "Difícil", count: "standard" },               // 10
  { name: "Sistema digestório", difficulty: "Médio", count: "standard" }     // 10
];

async function runGeneralizationSuite() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — P0.9: TESTE DE GENERALIZAÇÃO DINÂMICA DE FLASHCARDS           ");
  console.log("================================================================================\n");

  const results = [];

  for (const item of TEST_TOPICS) {
    console.log(`\n▶ [TEMA: ${item.name.toUpperCase()}] Dificuldade: ${item.difficulty}, Solicitados: ${item.count}...`);
    const t0 = Date.now();
    try {
      const subtopics = decomposeTopicDynamically(item.name);
      console.log(`  - Subtópicos dinâmicos gerados:`);
      subtopics.forEach((s, idx) => console.log(`    ${idx + 1}. ${s}`));

      // Verificar se não há contaminação cruzada de aorta em outros temas
      if (item.name !== "Artéria aorta ascendente") {
        const aortaLeak = subtopics.some(s => /aorta|coron[aá]ri|valsalva|stanford/i.test(s));
        if (aortaLeak) {
          throw new Error(`Contaminação de aorta detectada em subtema de ${item.name}`);
        }
      }

      const deck = await generateAnatomicalFlashcards({
        topic: item.name,
        difficulty: item.difficulty,
        cardCount: item.count,
        language: "pt",
        sendTutorMessage: liveTutorSender
      });

      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`  - Duração: ${elapsed}s`);
      console.log(`  - Solicitados: ${deck.requestedCount} | Validados: ${deck.validatedCount} | Rejeitados: ${deck.rejectedCount}`);
      console.log(`  - Aviso: "${deck.generationNotice}"`);
      console.log(`  - Fontes: ${deck.sources.join("; ")}`);

      // Auditar amostras de cartões
      console.log(`  - Amostra de cartões aprovados:`);
      deck.cards.slice(0, 2).forEach((c, idx) => {
        console.log(`    [Cartão ${idx + 1}] P: ${c.front.slice(0, 70)}...`);
        console.log(`      R: ${c.back.slice(0, 70)}...`);
        console.log(`      Fonte: ${c.sourceCitation}`);
      });

      if (deck.auditLedger.rejectedItems.length > 0) {
        console.log(`  - Amostra de rejeições na auditoria científica:`);
        deck.auditLedger.rejectedItems.slice(0, 2).forEach((rej, idx) => {
          console.log(`    [Rejeitado ${idx + 1}] Motivo: ${rej.reason} (${rej.details})`);
          if (rej.candidate?.front) {
            console.log(`      P: ${rej.candidate.front.slice(0, 60)}...`);
          }
        });
      }

      results.push({
        topic: item.name,
        requested: deck.requestedCount,
        validated: deck.validatedCount,
        rejected: deck.rejectedCount,
        sourcesCount: deck.sources.length,
        isPartial: deck.isPartial,
        pass: deck.validatedCount > 0
      });
    } catch (err) {
      console.error(`  ❌ Falha no tema ${item.name}:`, err.message);
      results.push({
        topic: item.name,
        requested: item.count,
        validated: 0,
        rejected: 0,
        sourcesCount: 0,
        isPartial: true,
        pass: false,
        error: err.message
      });
    }
  }

  console.log("\n================================================================================");
  console.log(" RESUMO DA GENERALIZAÇÃO NOS 5 TEMAS OBRIGATÓRIOS:                              ");
  console.log("================================================================================");
  console.table(results);

  const allPassed = results.every(r => r.pass);
  console.log(allPassed ? "\n✅ SUCESSO: Todos os 5 temas foram decompostos dinamicamente e validados sem regressão!" : "\n❌ FALHA detectada.");
}

runGeneralizationSuite().catch(console.error);
