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
          },
          history: history
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.text;
      }

      // If backend explicitly says no API key, or other server errors, fallback gracefully
      console.warn(`[AI Tutor] Backend unavailable (Status: ${response.status}). Falling back to local heuristic.`);
    } catch (networkError) {
      console.warn(`[AI Tutor] Network error reaching backend. Falling back to local heuristic.`, networkError);
    }

    // 2. Local Heuristic Fallback
    await delay(1200 + Math.random() * 800);
    
    const intent = detectIntent(message);
    const structure = findStructureInContext(message, context);
    
    // Greeting
    if (intent === 'greeting') {
      return `Olá! Sou o Aeternum AI Tutor (Modo Local). Estou aqui para te ajudar a estudar o modelo **${context.model?.title || 'atual'}**. Como posso ajudar hoje?`;
    }
    
    // Explain specific structure
    if (intent === 'explain' && structure) {
      return `*(Modo Local)* O **${structure.title || structure.name}**${structure.latinName ? ` (*${structure.latinName}*)` : ''} é uma estrutura chave deste modelo. ${structure.description || 'Selecione o marcador para ler os detalhes clínicos na barra lateral.'} Posso ajudar a localizá-lo se quiser.`;
    }
    
    // Locate specific structure
    if (intent === 'locate' && structure) {
      return `*(Modo Local)* Para focar no **${structure.title || structure.name}**, clique no marcador correspondente na interface 3D.`;
    }
    
    // General study guide
    if (intent === 'study_guide') {
      return `*(Modo Local)* Para estudar o **${context.model?.title || 'modelo'}**, recomendo começar habilitando os Marcadores na barra inferior. Eles vão te guiar pelas estruturas essenciais. Depois, abra o Guia para ver as correlações clínicas.`;
    }
    
    // Explain markers
    if (intent === 'markers') {
      return "*(Modo Local)* Para usar os marcadores, clique no botão **Marcadores** na barra inferior central. Eles destacarão as estruturas anatômicas oficiais do modelo.";
    }
    
    // Explain guide
    if (intent === 'guide') {
      return "*(Modo Local)* Abra o painel do **Guia** clicando no botão na barra esquerda. Lá você encontrará informações teóricas sobre o modelo.";
    }
    
    // Explain quiz
    if (intent === 'quiz') {
      return "*(Modo Local)* Acesse os Simulados (Teórico ou Prático) pelo painel esquerdo para testar seus conhecimentos.";
    }
    
    // Generic fallback
    return `*(Modo Local)* Estou usando o modo local do Tutor IA com base nos dados já cadastrados neste modelo. Posso te ajudar a explorar os marcadores anatômicos e o uso da plataforma. O que prefere fazer?`;
  }
};
