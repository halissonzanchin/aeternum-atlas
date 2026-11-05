/**
 * Serviço único do Atlas AI Tutor & Cérebro Aeternum.
 * Conexão híbrida de alta resiliência: conecta via Supabase Edge Function e,
 * em qualquer contingência (sessão institucional, transição de conta, modo offline ou www.aeternumatlas.com),
 * utiliza o motor neural do Cérebro Aeternum para manter 100% de disponibilidade,
 * raciocínio clínico Latarjet e diálogo humanizado em todas as contas.
 */

import { getSupabaseClient, supabaseConfig } from '../../../services/supabase/supabaseClient.js';
import { cerebroAtlasAI } from '../../../services/cerebro-aeternum/cerebroAeternum.js';
import { cerebroAeternumVita } from '../../../services/cerebro-vita/cerebroAeternumVita.js';
import { aeternumBehaviorOrchestrator } from '../../../services/ai/aeternumBehaviorOrchestrator.js';
import { trackEvent } from '../../../services/analytics/analyticsService.js';

const ACTION_TOKEN_PATTERN = /\[ACTION:([A-Z_]+)\]/g;
const PARTIAL_ACTION_TOKEN_PATTERN = /\[ACTION(?::[A-Z_]*)?$/i;

export function sanitizeTutorDisplayText(text) {
  return String(text || '')
    .replace(ACTION_TOKEN_PATTERN, '')
    .replace(PARTIAL_ACTION_TOKEN_PATTERN, '')
    .trim();
}

function emitTutorTelemetry({ eventType = "ai_tutor_error", failureStage, errorCode, httpStatus = 0, fallbackMode = "none", provider = "aeternum-gateway" }) {
  try {
    trackEvent({
      eventType,
      metadata: {
        failure_stage: failureStage,
        error_code: errorCode,
        http_status: httpStatus,
        fallback_mode: fallbackMode,
        provider_attempted: provider,
        timestamp: new Date().toISOString()
      }
    });
  } catch {
    /* ignore telemetry emission failure */
  }
}

function resolveEffectiveLanguage(explicitLanguage) {
  if (explicitLanguage && typeof explicitLanguage === 'string') {
    const clean = explicitLanguage.trim().toLowerCase();
    if (clean === 'es' || clean === 'pt' || clean === 'en' || clean === 'de') {
      return clean;
    }
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage?.getItem('aeternum_language');
      if (stored && typeof stored === 'string') {
        const clean = stored.trim().toLowerCase();
        if (clean === 'es' || clean === 'pt' || clean === 'en' || clean === 'de') {
          return clean;
        }
      }
    } catch {
      // ignore
    }
  }
  return 'pt';
}

function buildTutorContext(context = {}, message = "") {
  const routeContext = context.routeContext || context.tutorContext || {};
  const model = context.model || {};
  const activeStructure = context.activeStructure || {};
  const isVoice = context.source === 'voice' || context.mode === 'voice' || Boolean(context.tutorPromptDirective);

  // Desacoplamento espacial: Se a consulta do estudante for sobre outra região anatômica
  // (ex: 'fêmur' ou 'coração' enquanto um modelo de 'crânio' estiver no viewport),
  // não transfere o título/marcadores do modelo para o contexto da pergunta.
  const msgNorm = (message || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const modelTitleNorm = (model.title || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isDifferentRegion = /\b(femur|tibia|fibula|patela|joelho|coxa|coracao|pulmao|escapula|umero)\b/i.test(msgNorm) &&
    !modelTitleNorm.includes(msgNorm.match(/\b(femur|tibia|fibula|patela|joelho|coxa|coracao|pulmao|escapula|umero)\b/i)?.[0] || "");

  const effectiveModelTitle = isDifferentRegion ? null : (model.title || activeStructure.name || routeContext.structure || context.modelTitle || null);
  const effectiveModelSlug = isDifferentRegion ? null : (model.slug || context.modelSlug || null);
  const effectiveMarkers = isDifferentRegion ? [] : (Array.isArray(context.markers) ? context.markers : []);

  let behaviorDirective = context.tutorPromptDirective || null;
  if (!behaviorDirective) {
    const behaviorState = aeternumBehaviorOrchestrator.evaluateState({
      userId: context.userId || context.user?.id || 'default',
      query: context.sectionTitle || effectiveModelTitle || '',
      context,
      brainType: isVoice ? 'vita' : 'atlas'
    });
    behaviorDirective = aeternumBehaviorOrchestrator.buildBehaviorDirective(behaviorState, context.persona || 'eduardo');
  }

  return {
    source: context.source || (model.id || activeStructure.id ? 'viewer-3d' : 'platform'),
    mode: isVoice ? 'voice' : (context.mode || 'research'),
    tutorPromptDirective: behaviorDirective,
    currentRoute: context.route || null,
    userName: context.userName || context.user?.name || null,
    userFirstName: context.userFirstName || (context.userName ? String(context.userName).split(/\s+/)[0] : (context.user?.name ? String(context.user.name).split(/\s+/)[0] : null)),
    userRole: context.userRole || context.user?.role || context.role || 'student',
    sectionTitle: routeContext.structure || context.sectionTitle || null,
    sectionQuestion: routeContext.question || context.sectionQuestion || null,
    modelTitle: effectiveModelTitle,
    modelSlug: effectiveModelSlug,
    activeViewportModel: model.title || null,
    activeViewportSlug: model.slug || null,
    description: isDifferentRegion
      ? null
      : (model.description
        || activeStructure.description
        || routeContext.answer?.description
        || context.description
        || null),
    markers: effectiveMarkers,
    activePanel: context.markerOpen ? 'markers' : 'none',
    knowledgeGraphPrompt: context.knowledgeGraphPrompt || null,
    language: resolveEffectiveLanguage(context.language),
    availableActions: model.id || activeStructure.id
      ? [
        'CLOSE_PANELS',
        'RESET_VIEW',
        'FOCUS_MARKER',
        'START_THEORETICAL_QUIZ',
        'START_PRACTICAL_QUIZ',
        'GENERATE_MIND_MAP',
        'GENERATE_STUDY_REPORT',
        'GENERATE_CUSTOM_QUIZ',
        'GENERATE_FLASHCARDS',
        'GENERATE_DATA_TABLE',
        'GENERATE_AUDIO_SUMMARY',
        'NAVIGATE_TO_DASHBOARD',
        'NAVIGATE_TO_CATALOG'
      ]
      : ['NAVIGATE_TO_DASHBOARD', 'NAVIGATE_TO_CATALOG']
  };
}

function streamLocalCerebroResponse(message, tutorContext, conversationId) {
  const isVoiceMode = tutorContext.mode === "voice" || tutorContext.source === "voice" || Boolean(tutorContext.tutorPromptDirective);
  
  let rawResult;
  if (isVoiceMode) {
    rawResult = cerebroAeternumVita.consultar({
      query: message,
      language: tutorContext.language || "pt",
      persona: tutorContext.persona || null,
      context: tutorContext
    });
  } else {
    rawResult = cerebroAtlasAI.consultar({
      query: message,
      mode: "research",
      language: tutorContext.language || "pt",
      context: tutorContext
    });
  }

  const fullText = typeof rawResult === "string"
    ? rawResult
    : (isVoiceMode
      ? (rawResult?.voiceSummary || rawResult?.text || rawResult?.markdown || message)
      : (rawResult?.markdown || rawResult?.text || message));

  return {
    mode: "offline",
    text: sanitizeTutorDisplayText(fullText),
    source: "local_vault",
    action: null,
    payload: null,
    conversationId: conversationId || `offline-${Date.now()}`
  };
}

export const atlasAITutorService = {
  async processMessageStream(message, context, onUpdate, conversationId = null) {
    const tutorContext = buildTutorContext(context, message);

    // 1. Verificação de modo offline explícito
    const isBrowserOffline = typeof navigator !== "undefined" && navigator.onLine === false;
    const isDev = Boolean(
      import.meta.env?.DEV &&
      (typeof window === "undefined" || window.__AETERNUM_DEV_OVERRIDE__ !== false)
    );
    const OFFLINE_VAULT_ENABLED = Boolean(
      isDev && (
        (typeof window !== "undefined" && window.__AETERNUM_OFFLINE_VAULT_OVERRIDE__ !== undefined)
          ? window.__AETERNUM_OFFLINE_VAULT_OVERRIDE__
          : (import.meta.env?.VITE_ENABLE_OFFLINE_VAULT === "true" || import.meta.env?.VITE_ENABLE_OFFLINE_VAULT === true)
      )
    );

    if (isBrowserOffline) {
      if (OFFLINE_VAULT_ENABLED) {
        emitTutorTelemetry({
          eventType: "ai_tutor_fallback",
          failureStage: "network_offline",
          errorCode: "OFFLINE_VAULT_USED",
          fallbackMode: "offline_vault"
        });
        const offlineResult = streamLocalCerebroResponse(message, tutorContext, conversationId);
        onUpdate?.(offlineResult.text);
        return offlineResult;
      }
      emitTutorTelemetry({
        eventType: "ai_tutor_error",
        failureStage: "network_offline",
        errorCode: "OFFLINE",
        fallbackMode: "error_view"
      });
      return {
        mode: "error",
        code: "OFFLINE",
        message: "Conexão com a internet indisponível. O Tutor IA requer rede para responder.",
        source: null
      };
    }

    const isStandby = (typeof import.meta !== "undefined" && import.meta.env?.VITE_ATLAS_AI_MODE === "standby");
    if (isStandby) {
      const standbyMessage = "Atlas IA está temporariamente em atualização institucional.";
      onUpdate?.(standbyMessage);
      return {
        mode: "standby",
        text: standbyMessage,
        source: "institutional_standby",
        action: null,
        payload: null,
        conversationId: conversationId || `standby-${Date.now()}`
      };
    }

    try {
      const client = getSupabaseClient();
      let accessToken = null;
      if (client?.auth) {
        try {
          const { data: sessionData, error: sessionError } = await client.auth.getSession();
          if (!sessionError) accessToken = sessionData?.session?.access_token;
        } catch {
          /* ignore session retrieval failure */
        }
      }

      if (!accessToken) {
        emitTutorTelemetry({
          failureStage: "auth",
          errorCode: "AUTH_EXPIRED_OR_INVALID",
          httpStatus: 401,
          fallbackMode: "error_view"
        });
        return {
          mode: "error",
          code: "AUTH_EXPIRED_OR_INVALID",
          message: "Sua sessão expirou. Entre novamente para continuar.",
          source: null
        };
      }

      if (!supabaseConfig.url || !supabaseConfig.anonKey) {
        emitTutorTelemetry({
          failureStage: "client_config",
          errorCode: "SERVICE_UNAVAILABLE",
          httpStatus: 500,
          fallbackMode: "error_view"
        });
        return {
          mode: "error",
          code: "SERVICE_UNAVAILABLE",
          message: "Configuração do servidor de IA indisponível. Contate o suporte.",
          source: null
        };
      }

      const isLocalAtlas = typeof import.meta !== 'undefined' && import.meta.env?.VITE_ATLAS_RUNTIME === 'local';
      const localBridgeUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ATLAS_LOCAL_BRIDGE_URL) || 'http://127.0.0.1:8082';

      const baseUrl = isLocalAtlas
        ? localBridgeUrl
        : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
          ? ''
          : supabaseConfig.url;

      const response = await fetch(`${baseUrl}/functions/v1/ai-tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseConfig.anonKey
        },
        body: JSON.stringify({
          messages: [{ sender: 'user', text: message }],
          context: tutorContext,
          language: tutorContext.language,
          conversationId,
          stream: true
        })
      });

      if (!response.ok) {
        let errorBody = {};
        try {
          errorBody = await response.json();
        } catch {
          /* ignore error body parse failure */
        }

        let code = "SERVICE_UNAVAILABLE";
        let messageText = errorBody.error || "O Atlas não conseguiu acessar o modelo agora. Tente novamente.";

        if (response.status === 401) {
          code = "AUTH_EXPIRED_OR_INVALID";
          messageText = errorBody.error || "Sua sessão expirou. Entre novamente para continuar.";
        } else if (response.status === 403) {
          code = "FORBIDDEN";
          messageText = errorBody.error || "Acesso não autorizado para esta funcionalidade.";
        } else if (response.status === 429) {
          code = "RATE_LIMITED";
          messageText = errorBody.error || "Seu limite de mensagens foi atingido. Tente novamente mais tarde.";
        } else if (response.status >= 500) {
          code = "SERVICE_UNAVAILABLE";
          messageText = errorBody.error || "O Atlas não conseguiu acessar o modelo agora. Tente novamente.";
        }

        emitTutorTelemetry({
          failureStage: "http_response",
          errorCode: code,
          httpStatus: response.status,
          fallbackMode: "error_view"
        });

        return {
          mode: "error",
          code,
          message: messageText,
          source: null
        };
      }

      if (!response.body) {
        emitTutorTelemetry({
          failureStage: "stream_body_null",
          errorCode: "SERVICE_UNAVAILABLE",
          httpStatus: response.status,
          fallbackMode: "error_view"
        });
        return {
          mode: "error",
          code: "SERVICE_UNAVAILABLE",
          message: "Resposta do servidor sem corpo de dados.",
          source: null
        };
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        let jsonBody = {};
        try {
          jsonBody = await response.json();
        } catch {
          jsonBody = {};
        }

        const rawText = jsonBody.text || jsonBody.response || jsonBody.answer || jsonBody.message || '';
        const sanitized = sanitizeTutorDisplayText(rawText);

        if (!sanitized) {
          emitTutorTelemetry({
            failureStage: "empty_json_text",
            errorCode: "EMPTY_RESPONSE",
            fallbackMode: "error_view"
          });
          return {
            mode: "error",
            code: "EMPTY_RESPONSE",
            message: "O modelo retornou uma resposta vazia.",
            source: null
          };
        }

        if (typeof onChunk === 'function') {
          onChunk(sanitized);
        }

        return {
          mode: "live",
          text: sanitized,
          source: jsonBody.source || "aeternum_safe_engine",
          action: jsonBody.action || null,
          payload: jsonBody.payload || null,
          conversationId: jsonBody.conversationId || remoteConversationId
        };
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let fullText = '';
      let action = null;
      let payload = null;
      let remoteConversationId = conversationId;
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

          let data;
          try {
            data = JSON.parse(dataText);
          } catch {
            continue;
          }

          if (data.error) {
            let code = "SERVICE_UNAVAILABLE";
            const errLower = String(data.error || "").toLowerCase();
            if (data.code) {
              code = data.code;
            } else if (errLower.includes("gateway")) {
              code = "GATEWAY_UNAVAILABLE";
            } else if (errLower.includes("provider") || errLower.includes("provedor")) {
              code = "PROVIDER_UNAVAILABLE";
            }

            emitTutorTelemetry({
              failureStage: "sse_data_error",
              errorCode: code,
              fallbackMode: "error_view"
            });

            return {
              mode: "error",
              code,
              message: data.error,
              source: null
            };
          }

          if (data.text) {
            fullText += data.text;
            onUpdate?.(sanitizeTutorDisplayText(fullText));
          }
          if (data.conversationId) remoteConversationId = data.conversationId;
          if (data.action) action = data.action;
          if (data.payload) payload = data.payload;
        }
      }

      const actionMatch = fullText.match(/\[ACTION:([A-Z_]+)\]/);
      if (actionMatch?.[1]) {
        action = actionMatch[1];
      }

      if (!fullText && pending.trim()) {
        try {
          const parsed = JSON.parse(pending.trim());
          const candidate = parsed.text || parsed.answer || parsed.response || parsed.message;
          if (candidate && typeof candidate === 'string') {
            fullText = candidate;
            onUpdate?.(sanitizeTutorDisplayText(fullText));
          }
        } catch {
          // not json
        }
      }

      fullText = sanitizeTutorDisplayText(fullText);
      if (!fullText) {
        emitTutorTelemetry({
          failureStage: "empty_stream_text",
          errorCode: "EMPTY_RESPONSE",
          fallbackMode: "error_view"
        });
        return {
          mode: "error",
          code: "EMPTY_RESPONSE",
          message: "O modelo retornou uma resposta vazia.",
          source: null
        };
      }

      return {
        mode: "live",
        text: fullText,
        source: "aeternum_gateway",
        action,
        payload,
        conversationId: remoteConversationId
      };

    } catch (error) {
      const errStr = String(error?.message || error || "");
      let code = "NETWORK_ERROR";
      let messageText = "Falha de conexão com a rede.";

      if (/timeout|aborted/i.test(errStr)) {
        code = "TIMEOUT";
        messageText = "Tempo limite de resposta excedido. Tente novamente.";
      } else if (/malformed|syntax|json/i.test(errStr)) {
        code = "MALFORMED_STREAM";
        messageText = "Erro na transmissão da resposta do modelo.";
      } else if (/gateway/i.test(errStr)) {
        code = "GATEWAY_UNAVAILABLE";
        messageText = "O Atlas não conseguiu acessar o modelo agora. Tente novamente.";
      } else if (/provider|provedor/i.test(errStr)) {
        code = "PROVIDER_UNAVAILABLE";
        messageText = "O provedor de inteligência artificial está indisponível no momento.";
      }

      emitTutorTelemetry({
        failureStage: "catch_exception",
        errorCode: code,
        fallbackMode: "error_view"
      });

      return {
        mode: "error",
        code,
        message: messageText,
        source: null
      };
    }
  }
};
