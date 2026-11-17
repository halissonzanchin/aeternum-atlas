import { generateAnatomicalFlashcards } from "../../src/services/ai/flashcardGenerationService.js";
import { validateFlashcardSchema } from "../../src/services/ai/academicTaskContracts.js";

const BRIDGE_URL = "http://127.0.0.1:8082";

async function queryRealEngine(payload) {
  const res = await fetch(`${BRIDGE_URL}/functions/v1/ai-tutor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return { status: res.status, ...data };
}

const mockSender = async (req) => {
  return queryRealEngine({
    question: req.text,
    language: "pt-BR",
    context: req.context,
    stream: false
  });
};

async function testFlashcardsGeneration() {
  console.log("=== P0.8: GERAÇÃO E AUDITORIA DE 20 FLASHCARDS DIFÍCEIS SOBRE ARTÉRIA AORTA ASCENDENTE ===");

  const deck = await generateAnatomicalFlashcards({
    topic: "Artéria aorta ascendente",
    difficulty: "Difícil",
    cardCount: "many",
    language: "pt",
    sendTutorMessage: mockSender
  });

  console.log(`\nBaralho gerado: ${deck.cards.length} cartões.`);
  console.log(`Modo de geração: ${deck.generationMode}`);
  console.log(`Aviso ao estudante: ${deck.generationNotice}`);
  console.log(`Fontes citadas: ${deck.sources.join("; ")}`);

  console.log("\n=== AUDITORIA INDIVIDUAL DE CADA CARTÃO ===");
  const auditReport = [];

  for (let i = 0; i < deck.cards.length; i++) {
    const c = deck.cards[i];
    const validation = validateFlashcardSchema(c);
    const item = {
      numero: i + 1,
      id: c.id,
      pergunta: c.front,
      resposta: c.back,
      justificativa: c.explanation.slice(0, 150) + "...",
      fonte: c.sourceCitation,
      origem: c.origin,
      valido: validation.valid
    };
    auditReport.push(item);
    console.log(`\n[Cartão ${i + 1}] ID: ${c.id}`);
    console.log(`  Pergunta: ${c.front}`);
    console.log(`  Resposta: ${c.back}`);
    console.log(`  Objetivo: ${c.learningObjective}`);
    console.log(`  Fonte: ${c.sourceCitation}`);
    console.log(`  Origem: ${c.origin} | Válido: ${validation.valid}`);
  }

  console.log("\n=== RESUMO ===");
  console.table(auditReport.map(r => ({
    N: r.numero,
    Pergunta: r.pergunta.slice(0, 45) + "...",
    Resposta: r.resposta.slice(0, 45) + "...",
    Fonte: r.fonte.slice(0, 30) + "...",
    Valido: r.valido
  })));
}

testFlashcardsGeneration().catch(console.error);
