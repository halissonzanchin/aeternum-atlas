import { resolveOllamaReasoningParams, resolveOllamaOptions } from "./ollama_reasoning_helper.mjs";
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

// Teste de Opções e Orçamento de Contexto (Context Window Calibration):
const optStructured = resolveOllamaOptions({ metadata: { task: "generate_flashcards" } });
assert(optStructured.num_ctx === 4096, "generate_flashcards recebe num_ctx calibrado em 4096 (economia de VRAM)");
assert(optStructured.num_predict === 2048, "generate_flashcards recebe num_predict calibrado em 2048");

const optDeep = resolveOllamaOptions({ metadata: { task: "explain_flashcard" } });
assert(optDeep.num_ctx === 8192, "explain_flashcard recebe num_ctx expandido em 8192");
assert(optDeep.num_predict === 4096, "explain_flashcard recebe num_predict calibrado em 4096");

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
assert(correctValidation.status === "CANONICAL_FACTS_VERIFIED", "Plexo braquial correto recebe status CANONICAL_FACTS_VERIFIED");
assert(correctValidation.coverage === "domain_rule_verified", "Plexo braquial correto recebe coverage domain_rule_verified");
assert(correctValidation.verifiedFacts.length >= 2, `Identificados ${correctValidation.verifiedFacts.length} fatos canônicos verificados`);

// Teste de Negação / Refutação Didática (não existem quatro troncos):
const refutingCard = {
  front: "O plexo braquial possui quatro troncos?",
  back: "Não, é falso afirmar isso. O plexo braquial possui estritamente três troncos: superior, médio e inferior; não existem quatro troncos nem tronco costocervical no plexo.",
  explanation: "O tronco costocervical é uma artéria ramo da subclávia, não uma estrutura nervosa.",
  topic: "Plexo Braquial"
};
const refutingValidation = validateAnatomicalScientificFacts(refutingCard, "Plexo Braquial");
assert(refutingValidation.valid, "Refutação didática explícita de erro não é tratada como contradição");
assert(refutingValidation.contradictions.length === 0, "Zero contradições em cartão que refuta ativamente o erro");
assert(refutingValidation.status === "CANONICAL_FACTS_VERIFIED", "Cartão com refutação e afirmação dos 3 troncos é CANONICAL_FACTS_VERIFIED");

// Teste de Contagem Incorreta Alternativa (cinco troncos):
const fiveTrunkCard = {
  front: "Quantos troncos formam o plexo braquial?",
  back: "O plexo braquial é composto por cinco troncos distintos ao longo do pescoço.",
  explanation: "Cada tronco origina-se de uma raiz cervical independente.",
  topic: "Plexo Braquial"
};
const fiveTrunkValidation = validateAnatomicalScientificFacts(fiveTrunkCard, "Plexo Braquial");
assert(!fiveTrunkValidation.valid, "Afirmação positiva de cinco troncos é REJEITADA como contradição");
assert(fiveTrunkValidation.status === "CONTRADICTION_CONFIRMED", "Cinco troncos recebe status CONTRADICTION_CONFIRMED");

// Teste de Falácia das Três Divisões do Plexo Braquial:
const threeDivCard = {
  front: "Quantas divisões tem o plexo braquial e como se organizam?",
  back: "O plexo braquial divide-se em 3 divisões principais que formam diretamente os três fascículos.",
  explanation: "As 3 divisões principais distribuem-se na axila.",
  topic: "Plexo Braquial"
};
const threeDivValidation = validateAnatomicalScientificFacts(threeDivCard, "Plexo Braquial");
assert(!threeDivValidation.valid, "Afirmação positiva de 3 divisões é REJEITADA como contradição (canônico: 6 divisões)");
assert(threeDivValidation.status === "CONTRADICTION_CONFIRMED", "Três divisões recebe status CONTRADICTION_CONFIRMED");

// Teste de Cartão no Domínio sem Fatos Canônicos Específicos:
const genericDomainCard = {
  front: "O que é o plexo braquial em termos gerais?",
  back: "É uma complexa rede de nervos que fornece inervação motora e sensitiva para todo o membro superior.",
  explanation: "Origina-se no pescoço e transita para a axila através do canal cervicoaxilar.",
  topic: "Plexo Braquial"
};
const genericDomainValidation = validateAnatomicalScientificFacts(genericDomainCard, "Plexo Braquial");
assert(genericDomainValidation.valid, "Cartão geral de domínio sem contradições é aceito");
assert(genericDomainValidation.status === "SCIENTIFIC_REVIEW_REQUIRED", "Cartão sem fatos canônicos específicos recebe SCIENTIFIC_REVIEW_REQUIRED");
assert(genericDomainValidation.coverage === "domain_unverified_propositions", "Coverage classificada honestamente como domain_unverified_propositions");

const liverCard = {
  front: "Quais são os limites anatômicos dos lobos hepáticos funcionais?",
  back: "Os lobos hepáticos direito e esquerdo funcionais são divididos pela fissura sagital principal (linha de Cantlie).",
  explanation: "A linha de Cantlie estende-se da fossa da vesícula biliar até a margem esquerda da veia cava inferior na anatomia hepática.",
  topic: "Anatomia Hepática"
};
const liverValidation = validateAnatomicalScientificFacts(liverCard, "Anatomia Hepática");
assert(liverValidation.valid, "Cartão válido sobre Anatomia Hepática é aprovado");
assert(liverValidation.status === "SCHEMA_AND_TOPIC_VALIDATED", "Tópico sem regras específicas de domínio recebe status SCHEMA_AND_TOPIC_VALIDATED");
assert(liverValidation.coverage === "general_syntax_only", "Tópico sem regras específicas de domínio recebe coverage general_syntax_only");

// Teste de Taxonomia na Validação Completa (validateFlashcardScientificAccuracy):
const accCanonical = validateFlashcardScientificAccuracy(correctCard, "Plexo Braquial");
assert(accCanonical.valid && accCanonical.status === "CANONICAL_FACTS_VERIFIED", "Acurácia completa confirma CANONICAL_FACTS_VERIFIED");

const accGeneric = validateFlashcardScientificAccuracy(genericDomainCard, "Plexo Braquial");
assert(accGeneric.valid && accGeneric.status === "SCIENTIFIC_REVIEW_REQUIRED", "Acurácia completa confirma SCIENTIFIC_REVIEW_REQUIRED para domínio sem fatos verificados");

const accLiver = validateFlashcardScientificAccuracy(liverCard, "Anatomia Hepática");
assert(accLiver.valid && accLiver.status === "SCHEMA_AND_TOPIC_VALIDATED", "Acurácia completa confirma SCHEMA_AND_TOPIC_VALIDATED para outros tópicos");

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
