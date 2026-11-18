/**
 * AETERNUM ATLAS — ACADEMIC TASK CONTRACTS & UNIFIED BRAIN ORCHESTRATION
 * Contratos padronizados de tarefas acadêmicas entre Frontend, Edge Functions e TutorEngine Rust (Qwen 3.5 4B).
 * Governança P0.7: Tipagem estrita, códigos de erro padronizados, validação de schema e telemetria.
 */

export const ACADEMIC_TASK_TYPES = Object.freeze({
  GENERATE_FLASHCARDS: "generate_flashcards",
  GENERATE_MIND_MAP: "generate_mind_map",
  GENERATE_ANATOMICAL_QUIZ: "generate_anatomical_quiz",
  EXPLAIN_ANATOMICAL_STRUCTURE: "explain_anatomical_structure",
  GENERATE_STUDY_PLAN: "generate_study_plan",
  ANALYZE_LEARNING_PROGRESS: "analyze_learning_progress",
  RECOMMEND_REVISION: "recommend_revision",
  EXPLAIN_3D_MODEL: "explain_3d_model"
});

export const TUTOR_RESPONSE_MODES = Object.freeze({
  LIVE: "live",
  ONLINE: "online",
  STANDBY: "standby",
  ERROR: "error"
});

export const ACADEMIC_ERROR_CODES = Object.freeze({
  TUTOR_GATEWAY_UNAVAILABLE: "TUTOR_GATEWAY_UNAVAILABLE",
  TUTOR_RESPONSE_CONTRACT_MISMATCH: "TUTOR_RESPONSE_CONTRACT_MISMATCH",
  ANATOMICAL_EVIDENCE_INSUFFICIENT: "ANATOMICAL_EVIDENCE_INSUFFICIENT",
  FLASHCARD_SCHEMA_INVALID: "FLASHCARD_SCHEMA_INVALID",
  FLASHCARD_GENERATION_INCOMPLETE: "FLASHCARD_GENERATION_INCOMPLETE",
  MIND_MAP_SCHEMA_INVALID: "MIND_MAP_SCHEMA_INVALID",
  STUDY_PERSISTENCE_FAILED: "STUDY_PERSISTENCE_FAILED",
  RATE_LIMITED: "RATE_LIMITED",
  AUTH_REQUIRED: "AUTH_REQUIRED"
});

/**
 * Determina se o modo de conexão do Tutor é ativo e operacional.
 * Aceita tanto o modo canônico 'live' quanto o legado 'online'.
 */
export function isTutorModeActive(mode) {
  return mode === TUTOR_RESPONSE_MODES.LIVE || mode === TUTOR_RESPONSE_MODES.ONLINE;
}

/**
 * Identifica se a resposta do Tutor corresponde a uma recusa/abstenção científica
 * por evidência anatômica insuficiente nas fontes soberanas (Evidence Gate).
 */
export function isEvidenceInsufficient(response) {
  if (!response || typeof response !== "object") return false;
  if (response.knowledgeState === "INSUFFICIENT_EVIDENCE") return true;
  if (response.code === ACADEMIC_ERROR_CODES.ANATOMICAL_EVIDENCE_INSUFFICIENT) return true;
  const text = String(response.text || response.message || "").trim();
  return /Evidência anatômica insuficiente nas fontes soberanas/i.test(text);
}

/**
 * Valida se uma resposta do serviço de IA foi bem-sucedida, operacional e contém conteúdo anatômico válido.
 * Rejeita expressamente abstenções por insuficiência de evidência ou estados degradados.
 */
export function isTutorSuccess(response) {
  if (!response || typeof response !== "object") return false;
  if (!isTutorModeActive(response.mode)) return false;
  if (isEvidenceInsufficient(response)) return false;
  if (response.code && response.code !== "SUCCESS") return false;
  return Boolean(response.text && String(response.text).trim());
}

/**
 * Validador de Schema para Flashcards Anatômicos
 */
export function validateFlashcardSchema(card) {
  if (!card || typeof card !== "object") return false;
  const front = String(card.front || "").trim();
  const back = String(card.back || "").trim();
  const explanation = String(card.explanation || "").trim();
  const learningObjective = String(card.learningObjective || "").trim();

  if (front.length < 18 || back.length < 3 || explanation.length < 18) return false;
  if (/estrutura médica correspondente|tratado de anatomia|tuberosidade ou crista|placeholder/i.test(`${front} ${back}`)) {
    return false;
  }
  return {
    valid: true,
    card: {
      ...card,
      front,
      back,
      explanation,
      learningObjective: learningObjective || "Integração anatômica e raciocínio clínico"
    }
  };
}

/**
 * Validador de Schema para Esboço de Mapa Mental
 */
export function validateMindMapSchema(outlineText) {
  if (!outlineText || typeof outlineText !== "string") {
    return { valid: false, reason: "Esboço vazio ou inválido." };
  }
  const lines = outlineText.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 7) {
    return { valid: false, reason: "Menos de 7 nós identificados no mapa mental." };
  }
  const childCount = lines.filter((line) => /^\s+\S/.test(line)).length;
  if (childCount < 4) {
    return { valid: false, reason: "Hierarquia insuficiente de nós filhos." };
  }
  return {
    valid: true,
    totalNodes: lines.length,
    childCount,
    rootLabel: lines[0].trim()
  };
}
