/**
 * Helper com implementação canônica em JS puro de resolveOllamaReasoningParams
 * idêntica à de OllamaLLMProvider.ts para execução direta no Node sem loader TS.
 */
export function resolveOllamaReasoningParams(request, policy = "auto") {
  const meta = (request.metadata || {});

  if (typeof meta.reasoningEffort === "string") {
    if (meta.reasoningEffort === "none") {
      return { reasoning_effort: "none", think: false };
    }
    if (meta.reasoningEffort === "default") {
      return {};
    }
    return { reasoning_effort: meta.reasoningEffort };
  }

  if (typeof meta.think === "boolean") {
    return meta.think ? {} : { reasoning_effort: "none", think: false };
  }

  if (policy === "none") {
    return { reasoning_effort: "none", think: false };
  }
  if (policy === "default") {
    return {};
  }

  const task = String(meta.task || "").toLowerCase();
  const source = String(meta.source || "").toLowerCase();
  const sys = String(request.systemInstruction || "");

  // An explanation of a flashcard requires full clinical and anatomical reasoning.
  // Never disable reasoning when task is explain_flashcard.
  if (
    task === "explain_flashcard" ||
    source === "flashcard-explanation" ||
    sys.includes("Explicação Didática e Rigor Anatômico de Flashcard")
  ) {
    return {};
  }

  const isStructuredTask =
    task === "generate_flashcards" ||
    task === "generate_mind_map" ||
    (source === "flashcards" && task !== "explain_flashcard") ||
    source === "mind-map" ||
    sys.includes("Modo de saída — Flashcards Anatômicos") ||
    sys.includes("Modo de saída — Mapa Mental Anatômico");

  if (isStructuredTask) {
    return { reasoning_effort: "none", think: false };
  }

  return {};
}
