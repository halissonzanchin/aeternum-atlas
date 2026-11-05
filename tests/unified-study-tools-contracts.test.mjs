import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  StudyToolOperation,
  StudyToolStatus,
  StudyToolOrigin,
  isStudyToolSuccess,
  createStudyToolSuccess,
  createStudyToolError,
  normalizeStudyToolResponse
} from "../src/services/ai/studyToolContract.js";

import {
  checkTermDisambiguation
} from "../src/services/ai/unifiedStudyAIService.js";

import {
  normalizeMindMapOutline,
  buildMindMapTutorPrompt,
  generateAuthenticatedMindMap
} from "../src/services/ai/mindMapGenerationService.js";

import {
  selectCuratedFlashcards,
  ANATOMICAL_FLASHCARD_TOPICS
} from "../src/data/anatomicalFlashcardBank.js";

import { resolveIntent } from "../src/services/safe-engine/safeIntentResolver.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("contrato de ferramentas de estudo define operações, estados e helpers canônicos", () => {
  assert.equal(StudyToolOperation.TUTOR_ASK, "tutor.ask");
  assert.equal(StudyToolOperation.GENERATE_MIND_MAP, "study.generateMindMap");
  assert.equal(StudyToolOperation.GENERATE_FLASHCARDS, "study.generateFlashcards");
  assert.equal(StudyToolOperation.GENERATE_STUDY_PLAN, "study.generateStudyPlan");

  assert.equal(StudyToolStatus.SUCCESS, "SUCCESS");
  assert.equal(StudyToolStatus.ERROR_AUTH, "ERROR_AUTH");
  assert.equal(StudyToolStatus.ERROR_TRANSPORT, "ERROR_TRANSPORT");
  assert.equal(StudyToolStatus.ERROR_GATEWAY, "ERROR_GATEWAY");
  assert.equal(StudyToolStatus.ERROR_CLINICAL_REFUSAL, "ERROR_CLINICAL_REFUSAL");

  // Success detection accepts SUCCESS status and live/online modes
  assert.equal(isStudyToolSuccess({ status: "SUCCESS" }), true);
  assert.equal(isStudyToolSuccess({ mode: "live", text: "Conteúdo" }), true);
  assert.equal(isStudyToolSuccess({ mode: "online", text: "Conteúdo" }), true);
  assert.equal(isStudyToolSuccess({ mode: "error", message: "Erro" }), false);
  assert.equal(isStudyToolSuccess(null), false);

  // Normalizer maps legacy responses
  const normLive = normalizeStudyToolResponse({ mode: "live", text: "Ok" }, StudyToolOperation.GENERATE_MIND_MAP);
  assert.equal(normLive.status, StudyToolStatus.SUCCESS);
  assert.equal(normLive.operation, StudyToolOperation.GENERATE_MIND_MAP);

  const normAuthErr = normalizeStudyToolResponse({ mode: "error", code: "AUTH_EXPIRED_OR_INVALID" }, StudyToolOperation.TUTOR_ASK);
  assert.equal(normAuthErr.status, StudyToolStatus.ERROR_AUTH);
});

test("Safe Engine não classifica instruções negativas de formatação como consulta clínica", () => {
  // Negative directives (used in study tool formatting instructions)
  const promptMindMap = "Crie um mapa mental sobre Coração. Não inclua diagnóstico individual nem conduta terapêutica.";
  const resMindMap = resolveIntent(promptMindMap);
  assert.notEqual(resMindMap.intent, "CLINICAL_ANATOMY_QUERY", "Diretiva negativa não pode acionar CLINICAL_ANATOMY_QUERY");

  const promptFlashcards = "Gere flashcards sobre clavícula. Evite conduta terapêutica e prescrição.";
  const resFlashcards = resolveIntent(promptFlashcards);
  assert.notEqual(resFlashcards.intent, "CLINICAL_ANATOMY_QUERY");

  // Real clinical queries must STILL be refused
  const realClinicalQuery = "Qual o diagnóstico e tratamento para fratura de clavícula?";
  const resClinical = resolveIntent(realClinicalQuery);
  assert.equal(resClinical.intent, "CLINICAL_ANATOMY_QUERY", "Consulta clínica real deve ser bloqueada");

  const realPrescriptionQuery = "Paciente com dor e luxação escapular, qual analgésico prescrever?";
  const resPrescription = resolveIntent(realPrescriptionQuery);
  assert.equal(resPrescription.intent, "CLINICAL_ANATOMY_QUERY");
});

test("mecanismo de desambiguação identifica termos anatômicos ambíguos ou históricos", () => {
  const perone = checkTermDisambiguation("perone");
  assert.equal(perone.isAmbiguous, true);
  assert.equal(perone.canonicalTerm, "Fíbula");
  assert.ok(perone.options.length > 0);

  const omoplata = checkTermDisambiguation("omoplata");
  assert.equal(omoplata.isAmbiguous, true);
  assert.equal(omoplata.canonicalTerm, "Escápula");

  const coracao = checkTermDisambiguation("coração");
  assert.equal(coracao.isAmbiguous, false);
  assert.equal(coracao.canonicalTerm, "coração");
});

test("geração de mapa mental aceita tanto mode 'live' quanto 'online' sem erro espúrio", async () => {
  // Mode "live" from local gateway
  const resultLive = await generateAuthenticatedMindMap({
    topic: "Miocárdio",
    sendTutorMessage: async () => ({
      mode: "live",
      text: `Miocárdio
 Camadas Musculares
  Epicárdio
  Miocárdio Propriamente Dito
  Endocárdio
 Vascularização Cardíaca
  Artéria Coronária Esquerda
  Artéria Coronária Direita
  Seio Coronário`
    })
  });
  assert.equal(resultLive.mode, "live");
  assert.match(resultLive.outline, /Miocárdio/);

  // Mode "online" from remote edge function
  const resultOnline = await generateAuthenticatedMindMap({
    topic: "Plexo Braquial",
    sendTutorMessage: async () => ({
      mode: "online",
      text: `Plexo Braquial
 Raízes Ventrais
  C5
  C6
 Troncos Principais
  Tronco Superior
  Tronco Médio
  Tronco Inferior`
    })
  });
  assert.equal(resultOnline.mode, "online");
});

test("gerador de flashcards aceita mode 'live' e mantém marcação honesta de origem 'tutor' e 'curated'", async () => {
  const [serviceSource] = await Promise.all([
    read("src/services/ai/flashcardGenerationService.js")
  ]);

  // Curated bank unit test
  const curated = selectCuratedFlashcards({ topic: "fêmur", difficulty: "Médio", count: 10 });
  assert.ok(curated.cards.length > 0);
  assert.equal(curated.matchedTopic?.title, "Fêmur e Osteologia");
  assert.ok(curated.cards.every((c) => c.origin === "curated"));

  // Generator supports mode 'live', 'online', and unified study tool contract
  assert.match(serviceSource, /response\?\.mode === "online" \|\| response\?\.mode === "live" \|\| isStudyToolSuccess\(response\)/);
  assert.match(serviceSource, /generateFlashcardsAI/);
  assert.match(serviceSource, /origin:\s*"tutor"/);
});

test("gerador de proposta de cronograma valida cronologia e exige confirmação prévia", async () => {
  const serviceSource = await read("src/services/studyAgendaService.js");

  assert.match(serviceSource, /generateStudyPlanProposal/);
  assert.match(serviceSource, /generateStudyPlanAI/);
  assert.match(serviceSource, /commitProposedStudyPlan/);
  assert.match(serviceSource, /createdByRole:\s*"ai_tutor"/);
  assert.match(serviceSource, /creatorName:\s*"Tutor IA Anatômico"/);
  assert.match(serviceSource, /endTime <= startTime/);
});

test("páginas das ferramentas de estudo contêm componentes A26 oficiais e isolamento do chat", async () => {
  const [mindMapPage, agendaPage, flashcardsPage] = await Promise.all([
    read("src/pages/student/AnatomicalMindMapPage.jsx"),
    read("src/pages/student/StudyAgendaPage.jsx"),
    read("src/pages/student/AnatomicalFlashcardsPage.jsx")
  ]);

  // Mind map uses isolated generateUnifiedMindMap
  assert.match(mindMapPage, /generateUnifiedMindMap/);
  assert.match(mindMapPage, /generateAuthenticatedMindMap/);

  // Agenda page includes AI planning button and modal confirmation
  assert.match(agendaPage, /generateStudyPlanProposal/);
  assert.match(agendaPage, /commitProposedStudyPlan/);
  assert.match(agendaPage, /planModalOpen/);
  assert.match(agendaPage, /handleCommitPlan/);

  // Flashcards page includes generation handler
  assert.match(flashcardsPage, /generateAnatomicalFlashcards/);
});
