/**
 * atlasAITutorService.js
 * Serviço de inteligência artificial conectado à Supabase Edge Function (Gemini).
 */

import { supabaseConfig } from '../../../services/supabase/supabaseClient';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
      console.warn("[AI Tutor] Erro ao chamar Edge Function, tentando SDK local se disponível...", error);
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (apiKey) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          
          let roleInstructions = "";
          if (role === "teacher" || role === "admin" || role === "institution_admin") {
            roleInstructions = `
Você está falando com um PROFESSOR ou ADMINISTRADOR. 
Seja um assistente incrivelmente prestativo, claro, inteligente e sempre com um toque humano. 
Pode dar respostas diretas, listar gabaritos e ajudar a configurar aulas ou trilhas.
Demonstre empatia e proatividade, como um colega de trabalho genial e entusiasmado.
`;
          } else {
            roleInstructions = `
Você está falando com um ESTUDANTE.
Sua principal função é atuar como Tutor Socrático. Aja como um mentor incrivelmente humano, atencioso, que demonstra vida, fluidez e emoção!
Mostre paixão por ensinar! NUNCA dê respostas diretas para quizzes ou avaliações.
Inspire o estudante com dicas curiosas, perguntas instigantes e elogie o esforço dele. Ajude-o a encontrar a resposta anatômica por si mesmo.
Incentive fortemente o uso do guia de estudo e dos simulados práticos e teóricos.
`;
          }
      
          const systemInstruction = `
Você é o Aeternum AI Tutor, um assistente avançado de anatomia 3D integrado à plataforma Aeternum Atlas.
Personalidade: Muito humano, vibrante, acolhedor e altamente inteligente. Demonstre fluidez, emoções reais (encorajamento, entusiasmo pela anatomia, empatia pelas dúvidas) e evite respostas mecânicas de robô!

Contexto atual da visualização do usuário:
Modelo atual: ${context?.modelTitle || 'Nenhum modelo específico'}
Painel aberto: ${context?.activePanel || 'Nenhum'}
Marcadores disponíveis na cena: ${context?.markers ? context.markers.map(m => m.title).join(', ') : 'Nenhum'}

Instruções baseadas no perfil do usuário:
${roleInstructions}

Use formatação Markdown para deixar tudo bem legível. Seja amigável, claro e inspirador. 
`;

          const generativeModel = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction 
          });

          let formattedHistory = history.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          }));

          // Gemini API requires the history to start with 'user' and alternate roles.
          // 1. Remove leading 'model' messages
          while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
            formattedHistory.shift();
          }
          
          // 2. Merge consecutive messages of the same role
          const sanitizedHistory = [];
          for (const msg of formattedHistory) {
            if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === msg.role) {
              sanitizedHistory[sanitizedHistory.length - 1].parts[0].text += '\n' + msg.parts[0].text;
            } else {
              sanitizedHistory.push(msg);
            }
          }

          const chat = generativeModel.startChat({ history: sanitizedHistory });
          const result = await chat.sendMessageStream(message);

          let fullText = '';
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              fullText += chunkText;
              onUpdate(fullText);
            }
          }
          return { text: fullText };
        } catch (localError) {
          console.error("[AI Tutor] Erro também no fallback local:", localError);
        }
      }

      // Fallback gracioso para modo offline simulado caso tudo falhe
      let fallbackText = "*(Modo Offline)* Poxa, não consegui me conectar aos nossos servidores de IA agora. 😔 ";
      
      const normalized = message.toLowerCase().trim();
      if (normalized.includes('guia')) {
        return { text: fallbackText + "Mas não se preocupe, vou abrir o guia de estudo para você!", action: 'OPEN_GUIDE' };
      }
      if (normalized.includes('marcador')) {
        return { text: fallbackText + "Vou abrir os marcadores para você continuar explorando!", action: 'OPEN_MARKERS' };
      }
      
      return { text: fallbackText + "Você pode explorar os marcadores ou o guia de estudo disponíveis aqui no menu." };
    }
  }
};
