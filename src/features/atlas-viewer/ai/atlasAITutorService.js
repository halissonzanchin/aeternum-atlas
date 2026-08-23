/**
 * Serviço único do Atlas AI Tutor & Cérebro Aeternum.
 * Conexão híbrida de alta resiliência: conecta via Supabase Edge Function e,
 * em qualquer contingência (sessão institucional, transição de conta, modo offline ou www.aeternumatlas.com),
 * utiliza o motor neural do Cérebro Aeternum para manter 100% de disponibilidade,
 * raciocínio clínico Latarjet e diálogo humanizado em todas as contas.
 */

import { getSupabaseClient, supabaseConfig } from '../../../services/supabase/supabaseClient.js';
import { cerebroAtlasAI, cerebroAeternum } from '../../../services/cerebro-aeternum/cerebroAeternum.js';
import { cerebroAeternumVita } from '../../../services/cerebro-vita/cerebroAeternumVita.js';
import { aeternumBehaviorOrchestrator } from '../../../services/ai/aeternumBehaviorOrchestrator.js';

const ACTION_TOKEN_PATTERN = /\[ACTION:([A-Z_]+)\]/g;
const PARTIAL_ACTION_TOKEN_PATTERN = /\[ACTION(?::[A-Z_]*)?$/i;

export function sanitizeTutorDisplayText(text) {
  return String(text || '')
    .replace(ACTION_TOKEN_PATTERN, '')
    .replace(PARTIAL_ACTION_TOKEN_PATTERN, '')
    .trim();
}

function buildTutorContext(context = {}) {
  const routeContext = context.routeContext || context.tutorContext || {};
  const model = context.model || {};
  const activeStructure = context.activeStructure || {};
  const isVoice = context.source === 'voice' || context.mode === 'voice' || Boolean(context.tutorPromptDirective);

  let behaviorDirective = context.tutorPromptDirective || null;
  if (!behaviorDirective) {
    const behaviorState = aeternumBehaviorOrchestrator.evaluateState({
      userId: context.userId || context.user?.id || 'default',
      query: context.sectionTitle || model.title || '',
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
    modelTitle: model.title || activeStructure.name || routeContext.structure || context.modelTitle || null,
    modelSlug: model.slug || context.modelSlug || null,
    description: model.description
      || activeStructure.description
      || routeContext.answer?.description
      || context.description
      || null,
    markers: Array.isArray(context.markers) ? context.markers : [],
    activePanel: context.markerOpen ? 'markers' : 'none',
    knowledgeGraphPrompt: context.knowledgeGraphPrompt || null,
    language: context.language || 'pt',
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

async function streamLocalCerebroResponse(message, tutorContext, onUpdate, conversationId) {
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

  const words = fullText.split(" ");
  let accumulated = "";

  for (let i = 0; i < words.length; i++) {
    accumulated += (i === 0 ? "" : " ") + words[i];
    if (i % 3 === 0 || i === words.length - 1) {
      onUpdate?.(sanitizeTutorDisplayText(accumulated));
      await new Promise((r) => setTimeout(r, 16));
    }
  }

  return {
    text: sanitizeTutorDisplayText(fullText),
    action: null,
    payload: null,
    conversationId: conversationId || `cerebro-${Date.now()}`,
    mode: "online"
  };
}

export const atlasAITutorService = {
  async processMessageStream(message, context, onUpdate, conversationId = null) {
    const tutorContext = buildTutorContext(context);

    try {
      const client = getSupabaseClient();
      let accessToken = null;
      if (client?.auth) {
        try {
          const { data: sessionData, error: sessionError } = await client.auth.getSession();
          if (!sessionError) accessToken = sessionData?.session?.access_token;
        } catch {}
      }

      if (accessToken && supabaseConfig.url && supabaseConfig.anonKey) {
        const response = await fetch(`${supabaseConfig.url}/functions/v1/ai-tutor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': supabaseConfig.anonKey
          },
          body: JSON.stringify({
            messages: [{ sender: 'user', text: message }],
            context: tutorContext,
            conversationId
          })
        });

        if (response.ok && response.body) {
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
              if (data.error) throw new Error(data.error);
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

          fullText = sanitizeTutorDisplayText(fullText);
          if (fullText) {
            return { text: fullText, action, payload, conversationId: remoteConversationId, mode: 'online' };
          }
        }
      }

      // Conexão direta com o Cérebro Aeternum (Garante 100% de disponibilidade em qualquer conta)
      return await streamLocalCerebroResponse(message, tutorContext, onUpdate, conversationId);
    } catch (error) {
      console.warn('[AI Tutor] Conexão remota indisponível, usando Cérebro Aeternum:', error);
      return await streamLocalCerebroResponse(message, tutorContext, onUpdate, conversationId);
    }
  }
};
