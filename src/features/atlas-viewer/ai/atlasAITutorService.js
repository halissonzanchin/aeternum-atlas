/**
 * atlasAITutorService.js
 * Serviço de inteligência artificial conectado à Supabase Edge Function (Gemini).
 */

import { supabaseConfig } from '../../../services/supabase/supabaseClient';

export const atlasAITutorService = {
  /**
   * Processa uma mensagem com suporte a streaming
   * @param {string} message - A mensagem do usuário
   * @param {object} context - O contexto do visualizador
   * @param {Array} history - O histórico de mensagens
   * @param {string} role - O papel do usuário (ex: 'student', 'teacher')
   * @param {function} onUpdate - Callback chamado a cada novo chunk de texto recebido
   * @returns {Promise<object>} - O objeto final com a resposta e possíveis ações
   */
  async processMessageStream(message, context, history = [], role = 'student', onUpdate) {
    try {
      const response = await fetch(`${supabaseConfig.url}/functions/v1/ai-tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseConfig.anonKey}`
        },
        body: JSON.stringify({
          messages: [...history, { sender: 'user', text: message }],
          context: {
            modelTitle: context.model?.title,
            modelSlug: context.model?.slug,
            description: context.model?.description,
            markers: context.markers || [],
            guideSections: context.guide || [],
            activePanel: context.leftOpen ? 'guide' : context.markerOpen ? 'markers' : 'none',
            availableActions: ['OPEN_GUIDE', 'OPEN_MARKERS', 'CLOSE_PANELS', 'RESET_VIEW', 'FOCUS_MARKER', 'START_THEORETICAL_QUIZ', 'START_PRACTICAL_QUIZ']
          },
          role: role
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

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr === '[DONE]') {
                done = true;
                break;
              }
              try {
                const data = JSON.parse(dataStr);
                if (data.text) {
                  fullText += data.text;
                  onUpdate(fullText);
                }
                if (data.action) action = data.action;
                if (data.payload) payload = data.payload;
              } catch (e) {
                // Ignore parse errors on incomplete chunks
              }
            }
          }
        }
      }

      return { text: fullText, action, payload };

    } catch (error) {
      console.error("[AI Tutor] Erro ao chamar Edge Function:", error);
      // Fallback gracioso para modo offline simulado
      let fallbackText = "*(Modo Offline)* Infelizmente, não consegui me conectar ao servidor de IA no momento. ";
      
      const normalized = message.toLowerCase().trim();
      if (normalized.includes('guia')) {
        return { text: fallbackText + "Vou abrir o guia para você.", action: 'OPEN_GUIDE' };
      }
      if (normalized.includes('marcador')) {
        return { text: fallbackText + "Vou abrir os marcadores.", action: 'OPEN_MARKERS' };
      }
      
      return { text: fallbackText + "Você pode explorar os marcadores ou o guia de estudo disponíveis na interface." };
    }
  }
};
