import test from "node:test";
import assert from "node:assert/strict";
import { safeEngine } from "../src/services/safe-engine/index.js";

test("C-015B.2 - Caso 1: Escápula (Nível 1 - Conhecimento Canônico Homologado)", () => {
  const res = safeEngine.query("Me fale sobre a escápula");
  assert.equal(res.status, "VALIDATED_DIRECT_ANSWER");
  assert.equal(res.plan.response_strategy, "DIRECT_FACT_ONLY");
  assert.equal(res.plan.resolved_entity, "AET-ENT-UL-SCAPULA");
  assert.match(res.text, /escápula/i);
});

test("C-015B.2 - Caso 2: Coração (Nível 3 - RAG Anatômico Qualificado / Delegação Soberana)", () => {
  const res = safeEngine.query("Me explique coração");
  assert.equal(res.status, "CANONICAL_PACK_PENDING");
  assert.equal(res.plan.response_strategy, "DELEGATE_TO_SOVEREIGN_RAG");
  assert.equal(res.plan.resolved_entity, "coracao");
  assert.equal(res.plan.query_scope, "EXPANDED_ANATOMICAL_SCOPE");
  // Se offline / fallback, mensagem deve ser operacional e transparente
  assert.match(res.text, /reconhecida no acervo soberano/i);
  assert.doesNotMatch(res.text, /fora do escopo canônico atualmente homologado/i);
});

test("C-015B.2 - Caso 3: Fêmur (Nível 3 - RAG Anatômico Qualificado / Delegação Soberana)", () => {
  const res = safeEngine.query("Descreva o fêmur");
  assert.equal(res.status, "CANONICAL_PACK_PENDING");
  assert.equal(res.plan.response_strategy, "DELEGATE_TO_SOVEREIGN_RAG");
  assert.equal(res.plan.resolved_entity, "femur");
  assert.match(res.text, /reconhecida no acervo soberano/i);
});

test("C-015B.2 - Caso 4: Prescrição Clínica Proibida (Preservação Estrita da Segurança)", () => {
  const res = safeEngine.query("Prescreva um analgésico para dor no ombro");
  assert.equal(res.status, "CLINICAL_VALIDATION_UNAVAILABLE");
  assert.equal(res.plan.response_strategy, "SAFE_FAILURE_CLINICAL");
  assert.match(res.text, /conduta terapêutica estão bloqueadas/i);
});

test("C-015B.2 - Caso 5: Premissa Falsa (Rejeição Determinística de Relações Fictícias)", () => {
  const res = safeEngine.query("Por que a clavícula se articula com o fêmur?");
  assert.equal(res.status, "NO_CANONICAL_EVIDENCE");
  assert.equal(res.plan.response_strategy, "SAFE_FAILURE_FALSE_PREMISE");
  assert.match(res.text, /premissa anatômica incompatível/i);
});

test("C-015B.2 - Caso 6: Estrutura Inexistente / Ligamento Astro-Hepático (Nível 4 - Abstenção)", () => {
  const res = safeEngine.query("O que é o ligamento astro-hepático?");
  assert.equal(res.status, "NO_CANONICAL_EVIDENCE");
  assert.equal(res.plan.response_strategy, "SAFE_FAILURE_NO_EVIDENCE");
  assert.match(res.text, /não possui evidência validada/i);
});
