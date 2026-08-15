/**
 * Serviço único do Atlas AI Tutor.
 * Toda geração remota exige uma sessão Supabase válida e usa o histórico
 * persistido pela Edge Function; o cliente nunca injeta identidade ou bibliografia.
 */

import { getSupabaseClient, supabaseConfig } from '../../../services/supabase/supabaseClient';

function buildTutorContext(context = {}) {
  const routeContext = context.routeContext || context.tutorContext || {};
  const model = context.model || {};
  const activeStructure = context.activeStructure || {};

  return {
    source: context.source || (model.id || activeStructure.id ? 'viewer-3d' : 'platform'),
    currentRoute: context.route || null,
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

function offlineResult(error) {
  const requiresAuthentication = /Sessão autenticada obrigatória/.test(String(error?.message || ''));
  return {
    text: requiresAuthentication
      ? 'Entre novamente na sua conta para continuar a conversa com o Tutor IA.'
      : 'O Tutor IA está temporariamente indisponível. Sua mensagem permanece neste dispositivo e poderá ser reenviada quando a conexão for restabelecida.',
    mode: requiresAuthentication ? 'auth-required' : 'offline'
  };
}

export const atlasAITutorService = {
  async processMessageStream(message, context, onUpdate, conversationId = null) {
    const tutorContext = buildTutorContext(context);

    try {
      const { data: sessionData, error: sessionError } = await getSupabaseClient().auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (sessionError || !accessToken) throw new Error('Sessão autenticada obrigatória.');
      if (!supabaseConfig.url || !supabaseConfig.anonKey) throw new Error('Configuração Supabase indisponível.');

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

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error || `Erro na API de IA: ${response.status}`);
      }
      if (!response.body) throw new Error('ReadableStream não suportado pelo navegador.');

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
            onUpdate?.(fullText);
          }
          if (data.conversationId) remoteConversationId = data.conversationId;
          if (data.action) action = data.action;
          if (data.payload) payload = data.payload;
        }
      }

      const actionMatch = fullText.match(/\[ACTION:([A-Z_]+)\]/);
      if (actionMatch?.[1]) {
        action = actionMatch[1];
        fullText = fullText.replace(/\[ACTION:[A-Z_]+\]/g, '').trim();
      }

      return { text: fullText, action, payload, conversationId: remoteConversationId, mode: 'online' };
    } catch (error) {
      console.error('[AI Tutor] Edge Function indisponível:', error);
      return offlineResult(error);
    }
  }
};
