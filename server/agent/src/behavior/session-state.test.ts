import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildPedagogyDirective } from "./pedagogy-policy.ts";
import { VitaSessionStateMachine } from "./session-state.ts";

test("BQ-001 — opening delimits the learner goal", () => {
  const state = new VitaSessionStateMachine().observe("Olá, quero estudar anatomia");
  assert.equal(state.strategy, "diagnostic");
  assert.equal(state.shouldAskQuestion, true);
});

test("BQ-002 — direct blind-topic question is handled without an organ script", async () => {
  const state = new VitaSessionStateMachine().observe("Qual é a função do polígono de Willis?");
  const source = await readFile(new URL("./session-state.ts", import.meta.url), "utf8");
  assert.equal(state.currentTopic, "poligono de willis");
  assert.equal(state.strategy, "direct");
  assert.doesNotMatch(source, /ANATOMY_TERMS|escapula|femur|poligono de willis/i);
});

test("BQ-003 — ordinary continuation stays at guided Socratic level", () => {
  const state = new VitaSessionStateMachine().observe("Continue a explicação");
  assert.equal(state.socraticLevel, 2);
});

test("BQ-004 — first confusion changes the explanatory representation", () => {
  const state = new VitaSessionStateMachine().observe("Não entendi o que você explicou");
  assert.equal(state.strategy, "reframe");
  assert.equal(state.confusionStreak, 1);
});

test("BQ-005 — recurring confusion decomposes the next step", () => {
  const machine = new VitaSessionStateMachine();
  machine.observe("Não entendi");
  const state = machine.observe("Ainda não ficou claro");
  assert.equal(state.strategy, "scaffold");
  assert.equal(state.confusionStreak, 2);
});

test("BQ-006 — policy corrects conceptual errors without humiliation", () => {
  const snapshot = new VitaSessionStateMachine().observe("Acho que essa estrutura pertence ao crânio");
  const directive = buildPedagogyDirective(snapshot, "Português do Brasil");
  assert.match(directive, /Corrija erros conceituais com precisão e sobriedade/);
  assert.match(directive, /sem humilhar/);
});

test("BQ-007 — self-correction permits only proportional recognition", () => {
  const state = new VitaSessionStateMachine().observe("Eu quis dizer anterior, me corrigi");
  const directive = buildPedagogyDirective(state, "Português do Brasil");
  assert.equal(state.intent, "self_correction");
  assert.equal(state.praiseAllowed, true);
  assert.match(directive, /reforço breve e específico/);
});

test("BQ-008 — explicit make-me-think command activates S3", () => {
  const state = new VitaSessionStateMachine().observe("Não me dê a resposta, me faça pensar");
  assert.equal(state.strategy, "socratic");
  assert.equal(state.socraticLevel, 3);
});

test("BQ-009 — urgent direct command activates S0 without a forced question", () => {
  const state = new VitaSessionStateMachine().observe("Só responda, estou com pressa");
  assert.equal(state.strategy, "direct");
  assert.equal(state.socraticLevel, 0);
  assert.equal(state.shouldAskQuestion, false);
});

test("BQ-010 — abrupt topic change pushes the old topic onto context", () => {
  const machine = new VitaSessionStateMachine();
  machine.observe("Explique o ducto torácico");
  const state = machine.observe("Agora vamos para o seio cavernoso");
  assert.equal(state.currentTopic, "seio cavernoso");
  assert.deepEqual(state.previousTopics, ["ducto toracico"]);
});

test("BQ-011 — contextual return restores the previous topic", () => {
  const machine = new VitaSessionStateMachine();
  machine.observe("Explique o ducto torácico");
  machine.observe("Agora vamos para o seio cavernoso");
  const state = machine.observe("Onde a gente parou antes?");
  assert.equal(state.strategy, "recall");
  assert.equal(state.currentTopic, "ducto toracico");
});

test("BQ-012 — farewell is aware of all four daily time bands", () => {
  const expected = [[8, "morning"], [14, "afternoon"], [21, "night"], [2, "late_night"]] as const;
  for (const [hour, band] of expected) {
    const state = new VitaSessionStateMachine().observe("Tchau, vamos encerrar", new Date(2026, 0, 1, hour, 0));
    assert.equal(state.timeBand, band);
    assert.equal(state.shouldAskQuestion, false);
    assert.match(buildPedagogyDirective(state, "Português do Brasil"), /encerramento/);
  }
});

test("BQ-013 — anti-hyperbole blocks praise without evidence", () => {
  const state = new VitaSessionStateMachine().observe("Continue");
  const directive = buildPedagogyDirective(state, "Português do Brasil");
  assert.equal(state.praiseAllowed, false);
  assert.match(directive, /Não use elogio genérico/);
});

test("BQ-014 — acoustic contract enables adaptive barge-in", async () => {
  const source = await readFile(new URL("../agent.ts", import.meta.url), "utf8");
  assert.match(source, /interruption:\s*\{[\s\S]*enabled:\s*true[\s\S]*mode:\s*"adaptive"/);
});

test("BQ-015 — turn detector tolerates reflective pauses within the configured ceiling", async () => {
  const source = await readFile(new URL("../agent.ts", import.meta.url), "utf8");
  assert.match(source, /turnDetection:\s*new inference\.TurnDetector\(\)/);
  assert.match(source, /maxDelay:\s*2_200/);
});

test("BQ-016 — bounded memory can be restored in a different session", () => {
  const first = new VitaSessionStateMachine();
  first.observe("Explique o ducto torácico");
  first.observe("Agora entendi o ducto torácico");
  const second = new VitaSessionStateMachine(first.serialize());
  const restored = second.observe("Onde a gente parou?");
  assert.equal(restored.currentTopic, "ducto toracico");
  assert.equal(restored.masteryEvidence, 1);
});
