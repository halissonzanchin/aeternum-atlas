/**
 * atlasAITutorService.js
 * Serviço de inteligência artificial local provisório para a FASE 8.8A.
 * Fornece respostas contextuais baseadas no modelo atual e marcadores ativos
 * sem realizar requisições externas para LLMs, evitando exposição de API keys.
 */

// Simulated typing delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Simple intent matcher based on keywords
function detectIntent(message) {
  const normalized = message.toLowerCase().trim();
  
  if (normalized.includes('explic') || normalized.includes('o que é') || normalized.includes('para que serve')) {
    return 'explain';
  }
  if (normalized.includes('mostr') || normalized.includes('onde fica') || normalized.includes('localiz')) {
    return 'locate';
  }
  if (normalized.includes('estudar') || normalized.includes('revis') || normalized.includes('como devo')) {
    return 'study_guide';
  }
  if (normalized.includes('marcador') || normalized.includes('pontos') || normalized.includes('pinos')) {
    return 'markers';
  }
  if (normalized.includes('guia') || normalized.includes('painel')) {
    return 'guide';
  }
  if (normalized.includes('simulad') || normalized.includes('teste') || normalized.includes('prátic')) {
    return 'quiz';
  }
  if (normalized.includes('olá') || normalized.includes('oi') || normalized.includes('bom dia') || normalized.includes('boa tarde')) {
    return 'greeting';
  }
  
  return 'unknown';
}

function findStructureInContext(message, context) {
  const normalized = message.toLowerCase();
  
  // Look through markers
  if (context.markers && context.markers.length > 0) {
    const marker = context.markers.find(m => 
      normalized.includes(m.title.toLowerCase()) || 
      (m.latinName && normalized.includes(m.latinName.toLowerCase()))
    );
    if (marker) return marker;
  }
  
  // Look through anatomical structures
  if (context.structures && context.structures.length > 0) {
    const struct = context.structures.find(s => 
      normalized.includes(s.name.toLowerCase()) || 
      (s.latinName && normalized.includes(s.latinName.toLowerCase()))
    );
    if (struct) return struct;
  }
  
  return null;
}

export const atlasAITutorService = {
  /**
   * Process a user message against the backend AI with local context as fallback
   * @param {string} message - The user's query
   * @param {object} context - Viewer state (model, markers, etc)
   * @param {Array} history - Previous messages for context
   * @returns {Promise<string>} - The tutor's response
   */
  async processMessage(message, context, history = []) {
    try {
      // 1. Try to call the secure backend
      const response = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: message,
          viewerContext: {
            modelTitle: context.model?.title,
            modelSlug: context.model?.slug,
            description: context.model?.description,
            markers: context.markers || [],
            guideSections: context.guide || [],
            activePanel: context.leftOpen ? 'guide' : context.markerOpen ? 'markers' : 'none',
            availableActions: ['OPEN_GUIDE', 'OPEN_MARKERS', 'CLOSE_PANELS', 'RESET_VIEW', 'FOCUS_MARKER', 'START_THEORETICAL_QUIZ', 'START_PRACTICAL_QUIZ']
          },
          history: history
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Return object so caller knows about actions
        return { 
          text: data.text, 
          action: data.action, 
          payload: data.payload 
        };
      }

      // If backend explicitly says no API key, or other server errors, fallback gracefully
      console.warn(`[AI Tutor] Backend unavailable (Status: ${response.status}). Falling back to local heuristic.`);
    } catch (networkError) {
      console.warn(`[AI Tutor] Network error reaching backend. Falling back to local heuristic.`, networkError);
    }

    // 2. Local Heuristic Fallback
    await delay(1200 + Math.random() * 800);
    
  // Local intent matcher based on keywords
  const normalized = message.toLowerCase().trim();
  
  // Trilha commands
  if (normalized.includes('iniciar trilha geral')) {
    return {
      text: "*(Modo Local)* Iniciando a Trilha: Visão Geral. Vamos começar pelo primeiro marcador.",
      action: 'START_STUDY_PATH',
      payload: 'GENERAL_OVERVIEW'
    };
  }
  if (normalized.includes('iniciar trilha neuro') || normalized.includes('trilha mediana')) {
    return {
      text: "*(Modo Local)* Iniciando a Trilha: Neuroanatomia Mediana. Vamos começar pelo primeiro marcador.",
      action: 'START_STUDY_PATH',
      payload: 'NEURO_MEDIAN'
    };
  }
  if (normalized.includes('próximo') || normalized.includes('proximo passo') || normalized.includes('avançar')) {
    return {
      text: "*(Modo Local)* Avançando para o próximo passo da trilha.",
      action: 'NEXT_STUDY_STEP'
    };
  }

  if (normalized.includes('abrir guia') || normalized.includes('mostre o guia')) {
    return {
      text: "*(Modo Local)* Claro, vou abrir o Guia do modelo para você.",
      action: 'OPEN_GUIDE'
    };
  }
  if (normalized.includes('abrir marcador') || normalized.includes('mostrar marcador') || normalized.includes('mostre os marcadores') || normalized.includes('ver marcadores')) {
    return {
      text: "*(Modo Local)* Vou abrir os Marcadores anatômicos oficiais deste modelo.",
      action: 'OPEN_MARKERS'
    };
  }
  if (normalized.includes('fechar') && (normalized.includes('pain') || normalized.includes('guia') || normalized.includes('marcador'))) {
    return {
      text: "*(Modo Local)* Fechando os painéis conforme solicitado.",
      action: 'CLOSE_PANELS'
    };
  }
  if (normalized.includes('resetar') || normalized.includes('voltar visão inicial')) {
    return {
      text: "*(Modo Local)* Posso resetar a visão do modelo para o enquadramento inicial. Deseja prosseguir?",
      action: 'RESET_VIEW'
    };
  }
  if (normalized.includes('iniciar simulado')) {
    if (normalized.includes('prático')) {
      return {
        text: "*(Modo Local)* Posso iniciar o simulado prático para você.",
        action: 'START_PRACTICAL_QUIZ'
      };
    }
    return {
      text: "*(Modo Local)* Posso iniciar o simulado teórico.",
      action: 'START_THEORETICAL_QUIZ'
    };
  }

  // 3. Marker Resolver logic
  if (normalized.includes('mostre ') || normalized.includes('focar ') || normalized.includes('onde fica ') || normalized.includes('explique ')) {
    const { resolveMarker } = await import('./atlasAITutorMarkerResolver');
    const { match, alternatives } = resolveMarker(message, context.markers);
    
    if (match) {
      if (normalized.includes('explique')) {
         return {
           text: `*(Modo Local)* O **${match.title || match.name}**${match.latinName ? ` (*${match.latinName}*)` : ''} é uma estrutura chave deste modelo. ${match.description || 'Para informações clínicas, recomendo abrir o painel.'}`,
           action: 'FOCUS_MARKER',
           payload: match.id || `marker-${match.title}`
         };
      }
      return {
        text: `*(Modo Local)* Encontrei o marcador **${match.title || match.name}**. Ainda não tenho controle automático completo da câmera neste viewer, mas abri os Marcadores para você localizar essa estrutura. Alternativamente, clique em Focar Marcador.`,
        action: 'FOCUS_MARKER',
        payload: match.id || `marker-${match.title}`
      };
    } else {
       if (alternatives.length > 0) {
          const altNames = alternatives.map(a => a.title || a.name).join(', ');
          return {
             text: `*(Modo Local)* Não encontrei exatamente o que pediu, mas temos estruturas parecidas: ${altNames}. Deseja ver os marcadores?`,
             action: 'OPEN_MARKERS'
          };
       } else {
          return {
             text: `*(Modo Local)* Essa estrutura específica não está cadastrada nos marcadores deste modelo. Sugiro revisar os marcadores disponíveis.`,
             action: 'OPEN_MARKERS'
          };
       }
    }
  }

  // 4. Study Guide Intent
  if (normalized.includes('como devo estudar') || normalized.includes('como estudar') || normalized.includes('revisão rápida') || normalized.includes('revisão')) {
    return { 
      text: `*(Modo Local)* Recomendo começar pelas trilhas guiadas. Posso exibir as opções de Trilha de Estudo disponíveis baseadas nos marcadores reais deste modelo.`,
      action: 'SHOW_STUDY_PATH'
    };
  }
  
  // Generic fallback
  return { text: `*(Modo Local)* Estou usando o modo local do Tutor IA com base nos dados já cadastrados neste modelo. Posso te ajudar a explorar os marcadores anatômicos, criar trilhas de estudo e focar em estruturas. O que prefere fazer?` };
}
};
