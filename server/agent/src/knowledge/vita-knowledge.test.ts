import assert from "node:assert/strict";
import test from "node:test";
import {
  buildVitaKnowledgeDirective,
  extractAnatomySearchTerms,
  VitaKnowledgeRetriever
} from "./vita-knowledge.ts";

test("extrai a estrutura anatômica de uma frase conversacional", () => {
  assert.equal(extractAnatomySearchTerms("Eduardo, vamos falar sobre a escápula"), "escápula");
});

test("a diretiva impede respostas genéricas e preserva a fonte recuperada", () => {
  const directive = buildVitaKnowledgeDirective([{
    bookTitle: "Moore — Anatomia Orientada para a Clínica",
    chapterTitle: "Membro superior",
    pageNumber: 715,
    content: "A escápula é um osso plano triangular situado na face posterolateral do tórax.",
    score: 0.91
  }], "Português do Brasil");

  assert.match(directive, /nunca substitua a resposta por uma oferta genérica/i);
  assert.match(directive, /escápula/i);
  assert.match(directive, /página 715/i);
  assert.match(directive, /<biblioteca>/i);
});

test("sem credenciais, o recuperador falha fechado sem consultar serviços", async () => {
  const retriever = new VitaKnowledgeRetriever({ supabaseUrl: "", serviceRoleKey: "" });
  assert.equal(retriever.available, false);
  assert.deepEqual(await retriever.retrieve("escápula"), []);
});
