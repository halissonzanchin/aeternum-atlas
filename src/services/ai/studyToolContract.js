/**
 * AETERNUM ATLAS — UNIFIED STUDY TOOLS CONTRACT
 * Module: studyToolContract.js
 * Version: C-015C.1
 *
 * Defines the shared, deterministic interface for all AI-assisted study tools:
 * - Mind Map Generation
 * - Flashcard Generation
 * - Study Plan / Agenda Generation
 * - Direct Tutor Interaction
 *
 * Separates operational state, origin/provider, pedagogical mode,
 * authentication/authorization, and inference success/failure.
 */

export const StudyToolOperation = Object.freeze({
  TUTOR_ASK: 'tutor.ask',
  GENERATE_MIND_MAP: 'study.generateMindMap',
  GENERATE_FLASHCARDS: 'study.generateFlashcards',
  GENERATE_STUDY_PLAN: 'study.generateStudyPlan'
});

export const StudyToolStatus = Object.freeze({
  SUCCESS: 'SUCCESS',
  ERROR_AUTH: 'ERROR_AUTH',
  ERROR_TRANSPORT: 'ERROR_TRANSPORT',
  ERROR_GATEWAY: 'ERROR_GATEWAY',
  ERROR_CONTRACT: 'ERROR_CONTRACT',
  ERROR_CLINICAL_REFUSAL: 'ERROR_CLINICAL_REFUSAL',
  ERROR_INSUFFICIENT_EVIDENCE: 'ERROR_INSUFFICIENT_EVIDENCE'
});

export const StudyToolOrigin = Object.freeze({
  TUTOR: 'tutor',
  CURATED: 'curated',
  HYBRID: 'hybrid'
});

/**
 * Validates whether an AI response represents a successful completion.
 * Accepts both unified status SUCCESS and legacy mode 'live' / 'online'.
 */
export function isStudyToolSuccess(response) {
  if (!response) return false;
  if (response.status === StudyToolStatus.SUCCESS) return true;
  if (response.mode === 'live' || response.mode === 'online') {
    return Boolean(response.text || response.data || response.outline || response.cards || response.events);
  }
  return false;
}

/**
 * Creates a normalized success response for study tools.
 */
export function createStudyToolSuccess({
  operation,
  data = null,
  text = '',
  mode = 'live',
  source = 'aeternum_gateway',
  conversationId = null,
  metadata = {}
}) {
  return {
    status: StudyToolStatus.SUCCESS,
    operation,
    mode,
    source,
    success: true,
    data,
    text,
    conversationId,
    timestamp: new Date().toISOString(),
    metadata: {
      ...metadata
    }
  };
}

/**
 * Creates a normalized error response for study tools.
 */
export function createStudyToolError({
  operation,
  status = StudyToolStatus.ERROR_TRANSPORT,
  code = 'UNKNOWN_ERROR',
  message = 'Ocorreu um erro ao processar a ferramenta de estudo.',
  details = null,
  metadata = {}
}) {
  return {
    status,
    operation,
    mode: 'error',
    source: null,
    success: false,
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
    metadata: {
      ...metadata
    }
  };
}

/**
 * Normalizes any raw response from the AI tutor or gateway into the unified contract.
 */
export function normalizeStudyToolResponse(raw, operation) {
  if (!raw) {
    return createStudyToolError({
      operation,
      status: StudyToolStatus.ERROR_TRANSPORT,
      code: 'EMPTY_RESPONSE',
      message: 'Nenhuma resposta recebida do motor de IA.'
    });
  }

  // Already a unified response
  if (raw.status && Object.values(StudyToolStatus).includes(raw.status)) {
    return raw;
  }

  // Error modes
  if (raw.mode === 'error') {
    let status = StudyToolStatus.ERROR_TRANSPORT;
    if (raw.code === 'AUTH_EXPIRED_OR_INVALID' || raw.code === 'FORBIDDEN') {
      status = StudyToolStatus.ERROR_AUTH;
    } else if (raw.code === 'GATEWAY_UNAVAILABLE' || raw.code === 'PROVIDER_UNAVAILABLE') {
      status = StudyToolStatus.ERROR_GATEWAY;
    } else if (raw.code === 'CLINICAL_REFUSAL') {
      status = StudyToolStatus.ERROR_CLINICAL_REFUSAL;
    } else if (raw.code === 'INSUFFICIENT_EVIDENCE') {
      status = StudyToolStatus.ERROR_INSUFFICIENT_EVIDENCE;
    }

    return createStudyToolError({
      operation,
      status,
      code: raw.code || 'UNKNOWN_ERROR',
      message: raw.message || 'Erro durante a inferência do modelo.',
      details: raw
    });
  }

  // Success modes ('live', 'online')
  if (raw.mode === 'live' || raw.mode === 'online') {
    return createStudyToolSuccess({
      operation,
      data: raw.data || null,
      text: raw.text || '',
      mode: raw.mode,
      source: raw.source || 'aeternum_gateway',
      conversationId: raw.conversationId || null,
      metadata: raw.payload || {}
    });
  }

  // Fallback
  return createStudyToolError({
    operation,
    status: StudyToolStatus.ERROR_CONTRACT,
    code: 'INVALID_RESPONSE_FORMAT',
    message: 'Formato de resposta inesperado do serviço de IA.',
    details: raw
  });
}
