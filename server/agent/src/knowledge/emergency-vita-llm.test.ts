import assert from "node:assert/strict";
import test from "node:test";
import { llm } from "@livekit/agents";
import { buildEmergencyVitaReply } from "./emergency-vita-llm.ts";

function contextWithKnowledge(language: string, userText: string, library: string) {
  const context = new llm.ChatContext();
  context.addMessage({ role: "user", content: userText });
  context.addMessage({
    role: "developer",
    content: `Idioma obrigatório da resposta: ${language}.\n<biblioteca>\n${library}\n</biblioteca>`,
    extra: { aeternumVitaKnowledge: true }
  });
  return context;
}

test("fallback extrativo responde a partir da biblioteca e preserva a fonte", () => {
  const context = contextWithKnowledge(
    "Português",
    "Por que uma lesão do nervo torácico longo causa escápula alada?",
    `[Fonte 1] Anatomia Orientada para a Clínica — página 744
O nervo torácico longo inerva o músculo serrátil anterior. A paralisia desse músculo impede a fixação da borda medial da escápula contra a parede torácica e produz a escápula alada.

[Fonte 2] Atlas de Anatomia Humana — página 128
A cavidade glenoidal articula-se com a cabeça do úmero.`
  );

  const response = buildEmergencyVitaReply(context);
  assert.match(response, /nervo torácico longo/i);
  assert.match(response, /escápula alada/i);
  assert.match(response, /Anatomia Orientada para a Clínica/i);
  assert.doesNotMatch(response, /não recuperei/i);
});

test("fallback falha fechado quando não há fonte recuperada", () => {
  const context = contextWithKnowledge("Português", "Explique a escápula", "");
  const response = buildEmergencyVitaReply(context);
  assert.match(response, /temporariamente indisponível/i);
  assert.match(response, /não recuperei um trecho bibliográfico seguro/i);
});

test("fallback mantém o idioma obrigatório do tutor", () => {
  const context = contextWithKnowledge("Español", "Explica la escápula", "");
  const response = buildEmergencyVitaReply(context);
  assert.match(response, /no está disponible temporalmente/i);
  assert.doesNotMatch(response, /não recuperei/i);
});
