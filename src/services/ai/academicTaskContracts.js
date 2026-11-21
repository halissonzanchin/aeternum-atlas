/**
 * AETERNUM ATLAS — ACADEMIC TASK CONTRACTS & UNIFIED BRAIN ORCHESTRATION
 * Contratos padronizados de tarefas acadêmicas entre Frontend, Edge Functions e TutorEngine Rust (Qwen 3.5 4B).
 * Governança P0.7: Tipagem estrita, códigos de erro padronizados, validação de schema e telemetria.
 */

export const ACADEMIC_TASK_TYPES = Object.freeze({
  GENERATE_FLASHCARDS: "generate_flashcards",
  EXPLAIN_FLASHCARD: "explain_flashcard",
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
  AUTH_REQUIRED: "AUTH_REQUIRED",
  SCIENTIFIC_CONTRADICTION_CONFIRMED: "SCIENTIFIC_CONTRADICTION_CONFIRMED",
  ANATOMICAL_PREMISE_REJECTED: "ANATOMICAL_PREMISE_REJECTED",
  SCIENTIFIC_REVIEW_REQUIRED: "SCIENTIFIC_REVIEW_REQUIRED"
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

/**
 * Validação de Rigor Científico e Fatos Anatômicos Canônicos.
 * Camada adicional independente da validação de schema textual.
 * Aplica regras determinísticas para o Plexo Braquial e estruturas de alto risco científico.
 */
export function validateAnatomicalScientificFacts(cardOrContent, topic = "") {
  if (!cardOrContent) return { valid: false, reason: "EMPTY_CONTENT", contradictions: [] };

  const front = typeof cardOrContent === "object" ? String(cardOrContent.front || "") : "";
  const back = typeof cardOrContent === "object" ? String(cardOrContent.back || "") : "";
  const explanation = typeof cardOrContent === "object" ? String(cardOrContent.explanation || "") : "";
  const combinedText = `${front} ${back} ${explanation} ${typeof cardOrContent === "string" ? cardOrContent : ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const topicNorm = String(topic || (typeof cardOrContent === "object" ? cardOrContent.topic : ""))
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const isBrachialPlexus = /plexo\s+braquial|brachial\s+plexus/.test(topicNorm) || /plexo\s+braquial|brachial\s+plexus/.test(combinedText);

  if (isBrachialPlexus) {
    const contradictions = [];

    // Falácia 1: Quatro troncos no plexo braquial (o plexo tem exatamente 3 troncos: superior, médio e inferior)
    if (/\b(4|quatro)\s+troncos\b/i.test(combinedText) || /\bquarto\s+tronco\b/i.test(combinedText)) {
      contradictions.push("Afirmação de 4 troncos no plexo braquial (o plexo braquial é formado estritamente por 3 troncos: superior, médio e inferior).");
    }

    // Falácia 2: Tronco costocervical apresentado como tronco nervoso do plexo braquial
    if (/tronco\s+costocervical.*(?:tronco\s+nervoso|plexo\s+braquial|nervo)/i.test(combinedText) ||
        /(?:plexo\s+braquial|tronco\s+nervoso).*tronco\s+costocervical/i.test(combinedText)) {
      contradictions.push("Classificação do tronco costocervical como tronco nervoso do plexo braquial (o tronco costocervical é um ramo arterial da artéria subclávia, não um tronco nervoso).");
    }

    // Falácia 3: Inervação motora do trapézio atribuída ao fascículo lateral ou plexo braquial
    if (/trap[eé]zio.*(?:fasc[ií]culo\s+lateral|cord[aã]o\s+lateral|plexo\s+braquial.*motor)/i.test(combinedText) ||
        /(?:fasc[ií]culo\s+lateral|cord[aã]o\s+lateral).*inerva[cç][aã]o\s+motora.*trap[eé]zio/i.test(combinedText)) {
      contradictions.push("Atribuição da inervação motora do trapézio ao fascículo lateral ou plexo braquial (a inervação motora do trapézio provém do nervo acessório [XI par craniano]; ramos C3-C4 do plexo cervical conduzem propriocepção).");
    }

    // Falácia 4: Erb-Duchenne associada à lesão do fascículo lateral
    if (/erb[- ]duchenne.*(?:fasc[ií]culo\s+lateral|cord[aã]o\s+lateral)/i.test(combinedText) ||
        /(?:fasc[ií]culo\s+lateral|cord[aã]o\s+lateral).*erb[- ]duchenne/i.test(combinedText)) {
      contradictions.push("Associação da paralisia de Erb-Duchenne à lesão do fascículo lateral (a paralisia de Erb-Duchenne decorre classicamente de lesão do tronco superior [C5–C6]).");
    }

    // Falácia 5: Três divisões confundidas como fascículos
    if (/tr[eê]s\s+divis[oõ]es\s+(?:formam|constituem|s[aã]o)\s+os\s+fasc[ií]culos/i.test(combinedText) ||
        /divis[oõ]es.*(?:lateral,\s*medial\s*e\s*posterior)/i.test(combinedText)) {
      contradictions.push("Confusão de nomenclatura: 3 divisões atribuídas como fascículos (o plexo possui 6 divisões [3 anteriores e 3 posteriores] que se organizam em 3 fascículos: lateral, posterior e medial).");
    }

    if (contradictions.length > 0) {
      return {
        valid: false,
        status: "CONTRADICTION_CONFIRMED",
        reason: ACADEMIC_ERROR_CODES.SCIENTIFIC_CONTRADICTION_CONFIRMED,
        contradictions,
        details: contradictions.join(" ")
      };
    }
  }

  return {
    valid: true,
    status: "SCIENTIFIC_VALIDATED",
    reason: null,
    contradictions: []
  };
}

