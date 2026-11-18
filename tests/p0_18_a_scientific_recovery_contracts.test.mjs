import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  isTutorSuccess,
  isEvidenceInsufficient,
  ACADEMIC_ERROR_CODES
} from "../src/services/ai/academicTaskContracts.js";
import {
  decomposeTopic,
  ANATOMICAL_SYNONYM_MAP,
  normalizeAnatomicalKey,
  extractSearchTerms
} from "../src/services/ai/anatomicalTopicDecomposer.js";
import { normalizeMindMapOutline } from "../src/services/ai/mindMapGenerationService.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("P0.18.A — decomposeTopic isolates nuclear entity from long pedagogical strings", () => {
  const input = "artérias gonadais - variações anatômicas documentadas, pontos de pulso e correlações cirúrgico-hemodinâmicas";
  const result = decomposeTopic(input);

  assert.equal(result.nuclearTopic, "artérias gonadais");
  assert.ok(result.searchQueries.includes("artérias gonadais"));
  // Deve conter sinônimos de artérias gonadais
  assert.ok(result.searchQueries.some(q => q.includes("testicular") || q.includes("ovárica")));
  // Não deve conter queries poluidas com 10 termos concatenados
  assert.ok(!result.searchQueries.some(q => q.split(" ").length > 5));
});

test("P0.18.A — ANATOMICAL_SYNONYM_MAP covers key clinical and anatomical variants", () => {
  const gonadais = ANATOMICAL_SYNONYM_MAP["arterias gonadais"];
  assert.ok(Array.isArray(gonadais));
  assert.ok(gonadais.includes("artéria testicular"));
  assert.ok(gonadais.includes("artéria ovárica"));

  const plexo = ANATOMICAL_SYNONYM_MAP["plexo braquial"];
  assert.ok(Array.isArray(plexo));
  assert.ok(plexo.includes("troncos do plexo braquial"));

  const willis = ANATOMICAL_SYNONYM_MAP["poligono de willis"];
  assert.ok(Array.isArray(willis));
  assert.ok(willis.includes("círculo arterial do cérebro"));
});

test("P0.18.A — isEvidenceInsufficient detects Evidence Gate abstentions accurately", () => {
  const refusal1 = {
    mode: "live",
    text: "Evidência anatômica insuficiente nas fontes soberanas do Aeternum Atlas para sintetizar esta estrutura com precisão.",
    knowledgeState: "INSUFFICIENT_EVIDENCE"
  };
  assert.equal(isEvidenceInsufficient(refusal1), true);
  assert.equal(isTutorSuccess(refusal1), false);

  const refusal2 = {
    mode: "live",
    text: "Evidência anatômica insuficiente nas fontes soberanas do Aeternum Atlas.",
    knowledgeState: "INSUFFICIENT_EVIDENCE"
  };
  assert.equal(isEvidenceInsufficient(refusal2), true);
  assert.equal(isTutorSuccess(refusal2), false);

  const successValid = {
    mode: "live",
    text: "As artérias testiculares originam-se da aorta abdominal...",
    knowledgeState: "SOURCE_GROUNDED_SYNTHESIS"
  };
  assert.equal(isEvidenceInsufficient(successValid), false);
  assert.equal(isTutorSuccess(successValid), true);
});

test("P0.18.A — normalizeMindMapOutline never fabricates synthetic nodes from Evidence Gate refusal", () => {
  const refusalText = "Evidência anatômica insuficiente nas fontes soberanas do Aeternum Atlas para sintetizar esta estrutura com precisão.";
  assert.throws(
    () => normalizeMindMapOutline(refusalText, "Artérias Gonadais"),
    (err) => {
      return err.code === ACADEMIC_ERROR_CODES.ANATOMICAL_EVIDENCE_INSUFFICIENT ||
        /Evidência anatômica insuficiente/.test(err.message);
    }
  );
});

test("P0.18.A — ai-tutor index.ts contains anatomical decomposition and telemetry latency headers", async () => {
  const edgeSource = await read("supabase/functions/ai-tutor/index.ts");
  assert.ok(edgeSource.includes("ANATOMICAL_SYNONYM_MAP"));
  assert.ok(edgeSource.includes("decomposeTopic"));
  assert.ok(edgeSource.includes("X-Aeternum-Latency-Safe-Engine"));
  assert.ok(edgeSource.includes("X-Aeternum-Latency-RAG"));
  assert.ok(edgeSource.includes("X-Aeternum-Latency-Gateway"));
  assert.ok(edgeSource.includes("X-Aeternum-Latency-Total"));
});
