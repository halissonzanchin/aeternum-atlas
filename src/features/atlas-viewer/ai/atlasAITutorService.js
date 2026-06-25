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
  
  if (normalized.includes('abrir guia') || normalized.includes('mostre o guia')) {
    return {
      text: "*(Modo Local)* Claro, vou abrir o Guia do modelo para você.",
      action: 'OPEN_GUIDE'
    };
  }
  if (normalized.includes('abrir marcador') || normalized.includes('mostrar marcador') || normalized.includes('mostre os marcadores')) {
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

  const intent = detectIntent(message);
  const structure = findStructureInContext(message, context);
  
  // Greeting
  if (intent === 'greeting') {
    return { text: `Olá! Sou o Aeternum AI Tutor (Modo Local). Estou aqui para te ajudar a estudar o modelo **${context.model?.title || 'atual'}**. Como posso ajudar hoje?` };
  }
  
  // Explain specific structure
  if (intent === 'explain' && structure) {
    return { text: `*(Modo Local)* O **${structure.title || structure.name}**${structure.latinName ? ` (*${structure.latinName}*)` : ''} é uma estrutura chave deste modelo. ${structure.description || 'Selecione o marcador para ler os detalhes clínicos na barra lateral.'} Posso ajudar a localizá-lo se quiser.`, action: 'OPEN_MARKERS' };
  }
  
  // Locate specific structure
  if (intent === 'locate' && structure) {
    return { 
      text: `*(Modo Local)* Encontrei a estrutura **${structure.title || structure.name}**. Nesta versão, eu posso abrir os marcadores para que você a encontre ou focar diretamente nela se o botão abaixo for acionado.`,
      action: 'FOCUS_MARKER',
      payload: structure.id || `marker-${structure.title}`
    };
  }
  
  // General study guide
  if (intent === 'study_guide') {
    return { 
      text: `*(Modo Local)* Recomendo começar pelos marcadores principais, depois revisar o Guia e finalizar com o simulado prático. Posso abrir o guia de estudos para você dar o primeiro passo.`,
      action: 'SHOW_STUDY_PATH'
    };
  }
  
  // Explain markers
  if (intent === 'markers') {
    return { text: "*(Modo Local)* Para usar os marcadores, clique no botão **Marcadores** na barra inferior central. Posso abri-los para você.", action: 'OPEN_MARKERS' };
  }
  
  // Explain guide
  if (intent === 'guide') {
    return { text: "*(Modo Local)* Abra o painel do **Guia** clicando no botão na barra esquerda. Posso abrir o guia para você.", action: 'OPEN_GUIDE' };
  }
  
  // Explain quiz
  if (intent === 'quiz') {
    return { text: "*(Modo Local)* Acesse os Simulados (Teórico ou Prático) pelo painel esquerdo para testar seus conhecimentos. Gostaria de iniciar o prático?", action: 'START_PRACTICAL_QUIZ' };
  }
  
  // Generic fallback
  return { text: `*(Modo Local)* Estou usando o modo local do Tutor IA com base nos dados já cadastrados neste modelo. Posso te ajudar a explorar os marcadores anatômicos e o uso da plataforma. O que prefere fazer?` };
}
};
