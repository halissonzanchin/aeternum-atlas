import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (relPath) => readFile(new URL(`../${relPath}`, import.meta.url), "utf8");

const [
  theoryModalSource,
  anatModalSource,
  serviceSource,
  globalsCssSource,
  skillSource
] = await Promise.all([
  read("src/components/TheoreticalQuiz/TheoreticalQuizModal.jsx"),
  read("src/components/AnatomicalQuiz/AnatomicalQuizModal.jsx"),
  read("src/services/ai/quizErrorToFlashcardsService.js"),
  read("src/styles/globals.css"),
  read("../../.gemini/config/skills/aeternum-26-liquid-glass/SKILL.md").catch(() => "")
]);

test("serviço de erros extrai questões e marcações e agenda repetição espaçada", () => {
  assert.match(serviceSource, /extractTheoreticalErrorsToCards/);
  assert.match(serviceSource, /extractAnatomicalErrorsToCards/);
  assert.match(serviceSource, /convertErrorsToStudyDeckAndSchedule/);
  assert.match(serviceSource, /saveDeckToCollection/);
  assert.match(serviceSource, /scheduleFlashcardStudyEvent/);
  assert.match(serviceSource, /origin:\s*"quiz-errors"/);
});

test("modais de simulado contêm acionamento de reforço de erros e agendamento", () => {
  assert.match(theoryModalSource, /extractTheoreticalErrorsToCards/);
  assert.match(theoryModalSource, /convertErrorsToStudyDeckAndSchedule/);
  assert.match(theoryModalSource, /Transformar Erros em Flashcards & Agendar/);
  assert.match(theoryModalSource, /theory-error-reinforcement-card/);

  assert.match(anatModalSource, /extractAnatomicalErrorsToCards/);
  assert.match(anatModalSource, /convertErrorsToStudyDeckAndSchedule/);
  assert.match(anatModalSource, /viewer-quiz-error-btn/);
});

test("Modo Exame implementa o sistema Light Liquid Glass iOS 27 sem quebra escura", () => {
  assert.match(globalsCssSource, /\.theory-quiz-backdrop\.is-exam-mode/);
  assert.match(globalsCssSource, /rgba\(232,\s*242,\s*245,\s*0\.88\)/);
  assert.match(globalsCssSource, /\.theory-error-reinforcement-card/);
  assert.doesNotMatch(globalsCssSource, /\.theory-quiz-backdrop\.is-exam-mode\s*\{\s*background:\s*#f4f6f8;\s*backdrop-filter:\s*none;\s*\}/);
});

test("Skill Aeternum 26.1 declara o Sistema Dual Dark e Light Liquid Glass iOS 27", () => {
  if (skillSource) {
    assert.match(skillSource, /Dark Liquid Glass/);
    assert.match(skillSource, /Light Liquid Glass.*iOS 27/);
  }
});

