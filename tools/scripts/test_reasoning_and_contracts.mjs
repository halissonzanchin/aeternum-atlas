import { resolveOllamaReasoningParams } from "../../packages/aeternum-vita/src/providers/local/ollama/OllamaLLMProvider.ts";
import {
  validateAnatomicalScientificFacts,
  validateFlashcardSchema,
  ACADEMIC_ERROR_CODES
} from "../../src/services/ai/academicTaskContracts.js";
import {
  validateFlashcardScientificAccuracy,
  applyScientificQuarantine,
  validateFlashcardCorrespondence
} from "../../src/services/ai/flashcardGenerationService.js";
import { isRawFlashcardJsonOutput } from "../../src/features/atlas-viewer/ai/atlasAITutorService.js";

console.log("=== BATERIA DE VALIDAÇÃO DE CONTRATOS E REGRAS CIENTÍFICAS (P0.20-G) ===\n");

let passed = 0;
let total = 0;

function assert(condition, desc) {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS] ${desc}`);
  } else {
    console.error(`[FAIL] ${desc}`);
    process.exitCode = 1;
  }
}

// 1. POLÍTICA DE RACIOCÍNIO (resolveOllamaReasoningParams)
console.log("\n--- 1. Política de Raciocínio (OllamaLLMProvider) ---");

const reqExplain1 = {
  messages: [{ role: "user", content: "Explique o plexo braquial" }],
  metadata: { task: "explain_flashcard", source: "flashcard-explanation" }
};
const resExplain1 = resolveOllamaReasoningParams(reqExplain1);
assert(Object.keys(resExplain1).length === 0, "explain_flashcard + flashcard-explanation preserva raciocínio ({})");

const reqExplain2 = {
  messages: [{ role: "user", content: "Explique o plexo braquial" }],
  metadata: { task: "explain_flashcard", source: "flashcards" }
};
const resExplain2 = resolveOllamaReasoningParams(reqExplain2);
assert(Object.keys(resExplain2).length === 0, "explain_flashcard mesmo com source=flashcards preserva raciocínio ({})");

const reqGenFlashcards = {
  messages: [{ role: "user", content: "Gere 5 cartões" }],
  metadata: { task: "generate_flashcards", source: "flashcards" },
  systemInstruction: "Modo de saída — Flashcards Anatômicos"
};
const resGenFlashcards = resolveOllamaReasoningParams(reqGenFlashcards);
assert(resGenFlashcards.reasoning_effort === "none" && resGenFlashcards.think === false, "generate_flashcards desativa raciocínio para aceleração estruturada");

const reqGenMindMap = {
  messages: [{ role: "user", content: "Gere mapa mental" }],
  metadata: { task: "generate_mind_map", source: "mind-map" }
};
const resGenMindMap = resolveOllamaReasoningParams(reqGenMindMap);
assert(resGenMindMap.reasoning_effort === "none" && resGenMindMap.think === false, "generate_mind_map desativa raciocínio");

const reqTutor = {
  messages: [{ role: "user", content: "Dúvida socrática" }],
  metadata: { task: "tutor_ia", source: "platform" }
};
const resTutor = resolveOllamaReasoningParams(reqTutor);
assert(Object.keys(resTutor).length === 0, "tutor_ia padrão preserva raciocínio ({})");

// 2. DETECÇÃO DE SAÍDA JSON BRUTA (isRawFlashcardJsonOutput)
console.log("\n--- 2. Interceptor de Formato (isRawFlashcardJsonOutput) ---");

const rawJsonSample1 = `[{"front": "Quantos troncos tem o plexo?", "back": "4 troncos", "explanation": "Superior, médio, inferior e costocervical"}]`;
assert(isRawFlashcardJsonOutput(rawJsonSample1), "Detecta array JSON puro contendo front/back");

const rawJsonSample2 = "```json\n[{\n  \"front\": \"Questão\",\n  \"back\": \"Resposta\"\n}]\n```";
assert(isRawFlashcardJsonOutput(rawJsonSample2), "Detecta array JSON envolvido em blocos markdown");

const didacticSample = `### Estrutura Estudada: Plexo Braquial (Plexus brachialis)

**Correção Conceitual:** O cartão apresenta um erro grave ao afirmar que existem quatro troncos. O plexo braquial é formado estritamente por **três troncos**: superior, médio e inferior. O tronco costocervical é uma artéria ramo da subclávia, não um elemento nervoso.

**Anatomia Detalhada:**
Formado pelos ramos anteriores dos nervos espinais C5 a T1...`;
assert(!isRawFlashcardJsonOutput(didacticSample), "Reconhece texto didático em Markdown como NÃO-JSON");

// 3. VALIDAÇÃO ANATÔMICA CIENTÍFICA (validateAnatomicalScientificFacts)
console.log("\n--- 3. Validação Científica Determinística (Plexo Braquial) ---");

// Reprodução do Incidente do Operador:
const incidentCard = {
  front: "Quais são os quatro troncos do plexo braquial?",
  back: "O plexo braquial é composto por quatro troncos: superior, médio, inferior e tronco costocervical. O fascículo lateral inerva o trapézio e sua lesão causa paralisia de Erb-Duchenne.",
  explanation: "O tronco costocervical integra o plexo braquial e divide-se em 3 divisões que formam os fascículos.",
  topic: "Plexo Braquial"
};
const incidentValidation = validateAnatomicalScientificFacts(incidentCard, "Plexo Braquial");
assert(!incidentValidation.valid, "Incidente reproduzido é REJEITADO pela validação científica");
assert(incidentValidation.contradictions.length >= 3, `Identificadas ${incidentValidation.contradictions.length} contradições factuais no caso do incidente`);
console.log("Contradições detectadas:", incidentValidation.contradictions);

const correctCard = {
  front: "Qual é a organização troncular do plexo braquial e suas raízes de origem?",
  back: "O plexo braquial é formado por três troncos principais originados dos ramos anteriores de C5 a T1: tronco superior (C5-C6), tronco médio (C7) e tronco inferior (C8-T1).",
  explanation: "Cada tronco bifurca-se em divisões anterior e posterior no triângulo posterior do pescoço, relacionando-se intimamente com a artéria subclávia e posteriormente com a artéria axilar.",
  topic: "Plexo Braquial"
};
const correctValidation = validateAnatomicalScientificFacts(correctCard, "Plexo Braquial");
assert(correctValidation.valid, "Cartão canônico correto sobre Plexo Braquial é APROVADO cientificamente");

// 4. QUARENTENA CIENTÍFICA (applyScientificQuarantine)
console.log("\n--- 4. Sistema de Quarentena Científica ---");

const quarantined = applyScientificQuarantine(incidentCard, incidentValidation);
assert(quarantined.quarantine === true, "Cartão marcado com quarantine: true");
assert(quarantined.scientificStatus === "QUARANTINED", "Status definido como QUARANTINED");
assert(quarantined.scientificReviewNeeded === true, "scientificReviewNeeded: true");
assert(quarantined.front === incidentCard.front, "Texto original do estudante preservado para auditoria e SM-2");

console.log(`\n========================================`);
console.log(`TOTAL: ${passed}/${total} testes aprovados.`);
console.log(`========================================\n`);
