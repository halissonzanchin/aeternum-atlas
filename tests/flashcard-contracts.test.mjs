import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  ANATOMICAL_FLASHCARD_TOPICS,
  FLASHCARD_DIFFICULTIES,
  selectCuratedFlashcards
} from "../src/data/anatomicalFlashcardBank.js";

const serviceSource = await readFile(new URL("../src/services/ai/flashcardGenerationService.js", import.meta.url), "utf8");
const pageSource = await readFile(new URL("../src/pages/student/AnatomicalFlashcardsPage.jsx", import.meta.url), "utf8");
const tutorSource = await readFile(new URL("../src/features/dashboard/components/AtlasAITutor.jsx", import.meta.url), "utf8");
const repetitionSource = await readFile(new URL("../src/services/ai/flashcardSpacedRepetitionService.js", import.meta.url), "utf8");
const cssSource = await readFile(new URL("../src/styles/AnatomicalFlashcards.css", import.meta.url), "utf8");

test("banco editorial cobre seis temas e três dificuldades sem repetir perguntas", () => {
  assert.equal(ANATOMICAL_FLASHCARD_TOPICS.length, 6);
  const cards = ANATOMICAL_FLASHCARD_TOPICS.flatMap((topic) => topic.cards);
  assert.equal(cards.length, 72);
  assert.equal(new Set(cards.map((card) => card.id)).size, cards.length);
  assert.equal(new Set(cards.map((card) => card.front.toLocaleLowerCase("pt-BR"))).size, cards.length);

  for (const topic of ANATOMICAL_FLASHCARD_TOPICS) {
    for (const difficulty of FLASHCARD_DIFFICULTIES) {
      assert.equal(topic.cards.filter((card) => card.difficulty === difficulty).length, 4);
    }
    for (const card of topic.cards) {
      assert.ok(card.learningObjective.length >= 3);
      assert.ok(card.front.length >= 18);
      assert.ok(card.back.length >= 3);
      assert.ok(card.explanation.length >= 18);
    }
  }
});

test("seleção curada respeita tema, dificuldade e limite sem completar por repetição", () => {
  const result = selectCuratedFlashcards({ topic: "fêmur", difficulty: "Difícil", count: 20 });
  assert.equal(result.matchedTopic?.title, "Fêmur e Osteologia");
  assert.equal(result.cards.length, 4);
  assert.ok(result.cards.every((card) => card.difficulty === "Difícil"));
  assert.equal(new Set(result.cards.map((card) => card.front)).size, result.cards.length);
});

test("gerador usa o contrato real do Tutor e não fabrica fallback ou bibliografia", () => {
  assert.match(serviceSource, /atlasAITutorService\.processMessageStream/);
  assert.doesNotMatch(serviceSource, /queryTutor/);
  assert.doesNotMatch(serviceSource, /findPdfImageForTopic/);
  assert.doesNotMatch(serviceSource, /Estrutura médica correspondente|Tuberosidade ou crista rugosa/);
  assert.match(serviceSource, /Não invente páginas, capítulos, livros, imagens/);
  assert.match(serviceSource, /Não duplicamos perguntas/);
});

test("interface envia contexto completo ao Tutor e usa apenas materiais A26 suportados", () => {
  assert.match(pageSource, /contextLabel: `Flashcards · \$\{card\.topic\}`/);
  assert.match(pageSource, /learningObjective: card\.learningObjective/);
  assert.match(tutorSource, /\.\.\.\(e\.detail\.context \|\| \{\}\)/);
  assert.doesNotMatch(pageSource, /material="liquid"/);
  assert.doesNotMatch(pageSource, /Fonte RAG/);
  assert.doesNotMatch(cssSource, /backdrop-filter/);
});

test("telemetria registra revisão e conclusão do baralho", () => {
  assert.match(pageSource, /eventType: "flashcard_reviewed"/);
  assert.match(pageSource, /eventType: "flashcard_deck_completed"/);
});

test("baralhos legados são migrados sem repetição, imagem ou alegação RAG não verificada", () => {
  assert.match(repetitionSource, /normalizeSavedDeck/);
  assert.match(repetitionSource, /seenQuestions\.has\(questionKey\)/);
  assert.match(repetitionSource, /imageVerified === true/);
  assert.match(repetitionSource, /Baralho salvo anteriormente/);
  assert.doesNotMatch(repetitionSource, /Revisão Espaçada RAG:/);
});
