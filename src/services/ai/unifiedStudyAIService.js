/**
 * AETERNUM ATLAS — UNIFIED STUDY AI SERVICE
 * Module: unifiedStudyAIService.js
 * Version: C-015C.1
 *
 * Isolated generation layer for all academic study tools:
 * - Mind Map Generator
 * - Anatomical Flashcard Generator
 * - Study Agenda / Plan Generator
 *
 * Guarantees:
 * 1. Zero chat history pollution (does not commit to ai_messages or session context)
 * 2. Authenticated access via Supabase session
 * 3. Structured JSON / Hierarchical output normalization
 * 4. Disambiguation handling for ambiguous anatomical terms
 * 5. Full telemetry and deterministic error typing via StudyToolContract
 */

import { getSupabaseClient, supabaseConfig } from '../supabase/supabaseClient.js';
import {
  StudyToolOperation,
  StudyToolStatus,
  StudyToolOrigin,
  createStudyToolSuccess,
  createStudyToolError,
  isStudyToolSuccess
} from './studyToolContract.js';

// Anatomical Term Disambiguation Dictionary
const DISAMBIGUATION_MAP = {
  perone: {
    canonical: 'Fíbula',
    context: 'Terminologia Anatomica atual substituiu perôneo/perone por fíbula.',
    options: ['Fíbula (Osso)', 'Músculo Fibular Longo', 'Músculo Fibular Curto', 'Nervo Fibular Comum']
  },
  peroneo: {
    canonical: 'Fíbula',
    context: 'Terminologia Anatomica atual substituiu perôneo por fíbula.',
    options: ['Fíbula (Osso)', 'Músculos Fibulares', 'Nervo Fibular Profundo', 'Nervo Fibular Superficial']
  },
  omoplata: {
    canonical: 'Escápula',
    context: 'Terminologia Anatomica oficial adota escápula no lugar de omoplata.',
    options: ['Escápula (Osso)', 'Cíngulo do Membro Superior', 'Articulação Escapulotorácica']
  },
  cubito: {
    canonical: 'Ulna',
    context: 'Terminologia Anatomica oficial adota ulna no lugar de cúbito.',
    options: ['Ulna (Osso)', 'Articulação Radioulnar', 'Incisura Troclear da Ulna']
  }
};

/**
 * Resolves potential ambiguity in user-entered anatomical terms.
 */
export function checkTermDisambiguation(rawTopic = '') {
  const normalized = String(rawTopic || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const [key, entry] of Object.entries(DISAMBIGUATION_MAP)) {
    if (normalized === key || normalized.includes(key)) {
      return {
        isAmbiguous: true,
        originalTerm: rawTopic,
        canonicalTerm: entry.canonical,
        context: entry.context,
        options: entry.options
      };
    }
  }

  return {
    isAmbiguous: false,
    originalTerm: rawTopic,
    canonicalTerm: rawTopic,
    context: null,
    options: []
  };
}

/**
 * Executes an isolated prompt against the AI Tutor edge function / gateway
 * without polluting the user's conversation history.
 */
export async function executeIsolatedAIRequest({
  prompt,
  context = {},
  operation = StudyToolOperation.TUTOR_ASK,
  language = 'pt'
}) {
  let accessToken = null;
  const client = getSupabaseClient();

  if (client?.auth) {
    try {
      const { data: sessionData } = await client.auth.getSession();
      accessToken = sessionData?.session?.access_token || null;
    } catch {
      accessToken = null;
    }
  }

  if (!accessToken) {
    return createStudyToolError({
      operation,
      status: StudyToolStatus.ERROR_AUTH,
      code: 'AUTH_REQUIRED',
      message: 'Sessão autenticada obrigatória para utilizar as ferramentas de estudo com IA.'
    });
  }

  const isLocalAtlas = typeof import.meta !== 'undefined' && import.meta.env?.VITE_ATLAS_RUNTIME === 'local';
  const localBridgeUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ATLAS_LOCAL_BRIDGE_URL) || 'http://127.0.0.1:8082';

  const baseUrl = isLocalAtlas
    ? localBridgeUrl
    : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
      ? ''
      : (supabaseConfig?.url || '');

  const enrichedContext = {
    ...context,
    source: 'study-tool',
    operation,
    language
  };

  try {
    const response = await fetch(`${baseUrl}/functions/v1/ai-tutor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseConfig?.anonKey || ''
      },
      body: JSON.stringify({
        messages: [{ sender: 'user', text: prompt }],
        context: enrichedContext,
        language,
        conversationId: null, // Zero chat history pollution
        stream: true
      })
    });

    if (!response.ok) {
      let errorBody = {};
      try {
        errorBody = await response.json();
      } catch {
        errorBody = {};
      }

      let status = StudyToolStatus.ERROR_TRANSPORT;
      if (response.status === 401 || response.status === 403) status = StudyToolStatus.ERROR_AUTH;
      else if (response.status === 502 || response.status === 503 || response.status === 504) status = StudyToolStatus.ERROR_GATEWAY;

      return createStudyToolError({
        operation,
        status,
        code: `HTTP_${response.status}`,
        message: errorBody.error || `Erro de resposta do servidor de IA (${response.status}).`,
        details: errorBody
      });
    }

    if (!response.body) {
      return createStudyToolError({
        operation,
        status: StudyToolStatus.ERROR_TRANSPORT,
        code: 'NO_STREAM_BODY',
        message: 'A resposta do servidor de IA não possui corpo de transmissão.'
      });
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const jsonBody = await response.json();
      const text = jsonBody.text || jsonBody.response || jsonBody.answer || '';
      return createStudyToolSuccess({
        operation,
        text,
        mode: 'live',
        source: jsonBody.source || 'aeternum_gateway'
      });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;
    let fullText = '';
    let pending = '';

    while (!done) {
      const chunk = await reader.read();
      done = chunk.done;
      if (!chunk.value) continue;
      pending += decoder.decode(chunk.value, { stream: true });
      const lines = pending.split('\n');
      pending = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const dataText = line.slice(6).trim();
        if (dataText === '[DONE]') {
          done = true;
          break;
        }

        try {
          const parsed = JSON.parse(dataText);
          if (parsed.error) {
            return createStudyToolError({
              operation,
              status: StudyToolStatus.ERROR_GATEWAY,
              code: parsed.code || 'GATEWAY_ERROR',
              message: parsed.error
            });
          }
          if (parsed.text) fullText += parsed.text;
        } catch {
          // ignore stream parse glitches
        }
      }
    }

    return createStudyToolSuccess({
      operation,
      text: fullText.trim(),
      mode: 'live',
      source: 'aeternum_gateway'
    });
  } catch (error) {
    return createStudyToolError({
      operation,
      status: StudyToolStatus.ERROR_TRANSPORT,
      code: 'NETWORK_EXCEPTION',
      message: error?.message || 'Falha de comunicação de rede com o serviço de IA.',
      details: error
    });
  }
}

/**
 * Generates an isolated anatomical Mind Map outline.
 */
export async function generateMindMapAI({ topic, language = 'pt', minNodes = 10, maxNodes = 20 }) {
  const disambiguation = checkTermDisambiguation(topic);
  const effectiveTopic = disambiguation.canonicalTerm;

  const prompt = [
    'Crie um mapa mental anatômico didático sobre o tema informado.',
    '',
    'FORMATO OBRIGATÓRIO:',
    '- Responda somente com o esboço hierárquico, sem introdução, conclusão, Markdown, numeração ou bloco de código.',
    '- A primeira linha é o tema central e não possui espaços iniciais.',
    '- Cada nível filho usa exatamente um espaço adicional no início da linha.',
    `- Use entre ${minNodes} e ${maxNodes} nós, no máximo quatro níveis e no máximo seis filhos por nó.`,
    '- Cada rótulo deve ser curto, único e anatomicamente específico.',
    '',
    'QUALIDADE DIDÁTICA:',
    '- Organize do fundamento estrutural para relações, vascularização/inervação e aplicação clínica anatômica.',
    '- Use Terminologia Anatomica internacional.',
    '- Não invente referências, páginas ou fontes.',
    '',
    `TEMA: ${effectiveTopic}`
  ].join('\n');

  const result = await executeIsolatedAIRequest({
    prompt,
    context: {
      source: 'mind-map',
      route: '/mind-map',
      sectionTitle: effectiveTopic,
      sectionQuestion: 'Gerar esboço hierárquico para mapa mental anatômico'
    },
    operation: StudyToolOperation.GENERATE_MIND_MAP,
    language
  });

  return {
    ...result,
    generationId: `mm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    disambiguation,
    effectiveTopic
  };
}

/**
 * Generates isolated anatomical Flashcards.
 */
export async function generateFlashcardsAI({
  topic,
  difficulty = 'Médio',
  count = 10,
  language = 'pt',
  existingQuestions = []
}) {
  const disambiguation = checkTermDisambiguation(topic);
  const effectiveTopic = disambiguation.canonicalTerm;

  const languageDirectives = {
    pt: 'Idioma de saída OBRIGATÓRIO: Português (pt-BR).',
    es: 'Idioma de salida OBLIGATORIO: Español (es-ES).',
    en: 'MANDATORY output language: English (en-US).',
    de: 'ERFORDERLICHE Ausgabesprache: Deutsch (de-DE).'
  };

  const selectedDirective = languageDirectives[language] || languageDirectives.pt;
  const existingList = existingQuestions.length
    ? existingQuestions.map((q) => `- ${q}`).join('\n')
    : '- nenhuma';

  const prompt = [
    'Você está gerando flashcards para uma plataforma acadêmica de anatomia humana.',
    selectedDirective,
    `Tema: ${effectiveTopic}`,
    `Dificuldade: ${difficulty}`,
    `Quantidade: ${count}`,
    'Retorne SOMENTE um array JSON válido, sem markdown e sem texto adicional.',
    'Cada item deve conter: front, back, explanation e learningObjective.',
    'Crie questões diferentes entre si, com uma única resposta inequívoca e linguagem anatômica precisa.',
    'Distribua objetivos entre reconhecimento, relações espaciais, função e correlação morfológica.',
    'Não invente páginas, capítulos, livros, imagens ou referências bibliográficas.',
    'Evite repetir estas perguntas já presentes no baralho:',
    existingList
  ].join('\n');

  const result = await executeIsolatedAIRequest({
    prompt,
    context: {
      source: 'flashcards',
      route: '/flashcards',
      sectionTitle: effectiveTopic,
      sectionQuestion: `Gerar ${count} flashcards de nível ${difficulty}`
    },
    operation: StudyToolOperation.GENERATE_FLASHCARDS,
    language
  });

  return {
    ...result,
    disambiguation,
    effectiveTopic
  };
}

/**
 * Generates an isolated Study Plan / Agenda Schedule proposal.
 */
export async function generateStudyPlanAI({
  topic,
  availableHours = 10,
  daysCount = 5,
  examDate = null,
  language = 'pt',
  preferredTimes = '09:00'
}) {
  const disambiguation = checkTermDisambiguation(topic);
  const effectiveTopic = disambiguation.canonicalTerm;

  const prompt = [
    'Você é o Tutor de Anatomia da Aeternum Atlas gerando uma proposta de cronograma de estudos.',
    `Tema anatômico: ${effectiveTopic}`,
    `Carga horária total estimada: ${availableHours} horas`,
    `Número de sessões sugeridas: ${daysCount}`,
    examDate ? `Data limite / Prova: ${examDate}` : 'Cronograma regular de consolidação.',
    'Retorne SOMENTE um array JSON válido, sem texto introdutório nem markdown.',
    'Cada elemento do array representa uma sessão de estudo e deve conter estritamente:',
    '- title: Título objetivo da sessão (ex: "Osteologia da Escápula: Acidentes Ósseos")',
    '- description: Roteiro de estudo detalhado para a sessão',
    '- relativeDay: Número do dia relativo (1, 2, 3...)',
    '- startTime: Horário de início no formato HH:MM (ex: "09:00")',
    '- endTime: Horário de término no formato HH:MM (ex: "10:30")',
    '- priority: "low" | "medium" | "high"',
    '- anatomicalSystem: Nome do sistema anatômico',
    '- type: "study" | "revision" | "quiz"'
  ].join('\n');

  const result = await executeIsolatedAIRequest({
    prompt,
    context: {
      source: 'study-agenda',
      route: '/agenda',
      sectionTitle: effectiveTopic,
      sectionQuestion: `Propor cronograma de estudo para ${effectiveTopic}`
    },
    operation: StudyToolOperation.GENERATE_STUDY_PLAN,
    language
  });

  return {
    ...result,
    disambiguation,
    effectiveTopic
  };
}

/**
 * Health check to verify connectivity to the AI Gateway.
 */
export async function checkEngineHealth() {
  try {
    const isLocalAtlas = typeof import.meta !== 'undefined' && import.meta.env?.VITE_ATLAS_RUNTIME === 'local';
    const localBridgeUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ATLAS_LOCAL_BRIDGE_URL) || 'http://127.0.0.1:8082';
    const baseUrl = isLocalAtlas
      ? localBridgeUrl
      : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
        ? ''
        : (supabaseConfig?.url || '');

    const res = await fetch(`${baseUrl}/functions/v1/ai-tutor`, {
      method: 'OPTIONS'
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e?.message || 'Erro ao conectar ao Gateway' };
  }
}

export const unifiedStudyAIService = Object.freeze({
  executeIsolatedAIRequest,
  generateMindMapAI,
  generateFlashcardsAI,
  generateStudyPlanAI,
  checkTermDisambiguation,
  checkEngineHealth
});
