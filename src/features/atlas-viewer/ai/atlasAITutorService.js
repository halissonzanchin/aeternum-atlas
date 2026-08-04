/**
 * atlasAITutorService.js
 * Serviço de inteligência artificial conectado à Supabase Edge Function (Gemini).
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
    guideSections: Array.isArray(context.guide) ? context.guide : [],
    activePanel: context.markerOpen ? 'markers' : 'none',
    availableActions: model.id || activeStructure.id
      ? ['CLOSE_PANELS', 'RESET_VIEW', 'FOCUS_MARKER', 'START_THEORETICAL_QUIZ', 'START_PRACTICAL_QUIZ', 'GENERATE_MIND_MAP', 'GENERATE_STUDY_REPORT', 'GENERATE_CUSTOM_QUIZ', 'GENERATE_FLASHCARDS', 'GENERATE_DATA_TABLE', 'GENERATE_AUDIO_SUMMARY', 'NAVIGATE_TO_DASHBOARD', 'NAVIGATE_TO_CATALOG']
      : ['NAVIGATE_TO_DASHBOARD', 'NAVIGATE_TO_CATALOG']
  };
}

export const atlasAITutorService = {
  /**
   * Processa uma mensagem com suporte a streaming
   * @param {string} message - A mensagem do usuário
   * @param {object} context - O contexto do visualizador
   * @param {function} onUpdate - Callback chamado a cada novo chunk de texto recebido
   * @returns {Promise<object>} - O objeto final com a resposta e possíveis ações
   */
  async processMessageStream(message, context, onUpdate, conversationId = null) {
    const tutorContext = buildTutorContext(context);

    try {
      const { data: sessionData, error: sessionError } = await getSupabaseClient().auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (sessionError || !accessToken) {
        throw new Error('Sessão autenticada necessária para usar o Tutor IA.');
      }

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
        throw new Error(`Erro na API de IA: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream não suportado pelo navegador.');
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
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          pending += decoder.decode(value, { stream: true });
          const lines = pending.split('\n');
          pending = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr === '[DONE]') {
                done = true;
                break;
              }
              let data;
              try {
                data = JSON.parse(dataStr);
              } catch {
                // Ignore parse errors on incomplete chunks
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
        }
      }
      
      const actionMatch = fullText.match(/\[ACTION:([A-Z_]+)\]/);
      if (actionMatch && actionMatch[1]) {
        action = actionMatch[1];
        fullText = fullText.replace(/\[ACTION:[A-Z_]+\]/g, '').trim();
      }

      return { text: fullText, action, payload, conversationId: remoteConversationId, mode: 'online' };

    } catch (error) {
      console.error("[AI Tutor] Erro ao chamar Edge Function:", error);

      // Fallback gracioso para modo offline simulado caso tudo falhe (sem API Key)
      let fallbackText = "*(Modo Offline)* O Tutor IA está temporariamente indisponível. Tente novamente em instantes. 😔 ";
      
      return { text: fallbackText + "Sua pergunta foi preservada no histórico. Você pode continuar navegando e retomar a conversa em qualquer setor da plataforma.", mode: 'offline' };
    }
  }
};
