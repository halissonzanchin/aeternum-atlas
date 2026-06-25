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
   * Process a user message against the local context
   * @param {string} message - The user's query
   * @param {object} context - Viewer state (model, markers, active markers, etc)
   * @returns {Promise<string>} - The tutor's response
   */
  async processMessage(message, context) {
    // Simulate network delay for "thinking" effect
    await delay(1200 + Math.random() * 800);
    
    const intent = detectIntent(message);
    const structure = findStructureInContext(message, context);
    
    // Greeting
    if (intent === 'greeting') {
      return `Olá! Sou o Aeternum AI Tutor. Estou aqui para te ajudar a estudar o modelo **${context.model?.title || 'atual'}**. Como posso ajudar hoje?`;
    }
    
    // Explain specific structure
    if (intent === 'explain' && structure) {
      return `O **${structure.title || structure.name}**${structure.latinName ? ` (*${structure.latinName}*)` : ''} é uma estrutura chave deste modelo. ${structure.description || 'Para informações clínicas mais detalhadas, você pode selecioná-lo e abrir o painel lateral de Informações e Correlações Clínicas.'} Posso ajudar a localizá-lo se quiser.`;
    }
    
    // Locate specific structure
    if (intent === 'locate' && structure) {
      return `Para focar no **${structure.title || structure.name}**, você pode clicar diretamente no marcador correspondente na interface 3D. Se precisar, posso emitir um comando para centralizar a câmera nele.`;
    }
    
    // General study guide
    if (intent === 'study_guide') {
      const guide = context.model?.studyGuide;
      if (guide && guide.length > 0) {
        return `Para este modelo, recomendo seguir estes passos:\n\n${guide.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nLembre-se de explorar a anatomia livremente com a câmera.`;
      }
      return `Para estudar o **${context.model?.title || 'modelo'}**, recomendo começar habilitando os Marcadores na barra inferior. Eles vão te guiar pelas estruturas essenciais. Depois, abra o Guia para ver as correlações clínicas.`;
    }
    
    // Explain markers
    if (intent === 'markers') {
      return "Para usar os marcadores, clique no botão **Marcadores** na barra inferior central. Eles destacarão as estruturas anatômicas oficiais do modelo. Clique em qualquer marcador na tela 3D para focar a câmera e ler mais detalhes.";
    }
    
    // Explain guide
    if (intent === 'guide') {
      return "Você pode abrir o painel do **Guia** clicando no botão de 'Guia' ou 'Biblioteca' na barra esquerda. Lá você encontrará informações teóricas, nomenclatura anatômica e notas clínicas sobre o modelo que estamos visualizando.";
    }
    
    // Explain quiz
    if (intent === 'quiz') {
      return "Se quiser testar seus conhecimentos, você pode acessar os Simulados (Teórico ou Prático) pelo painel lateral esquerdo. No simulado prático, você deverá identificar as estruturas apontadas no modelo 3D.";
    }
    
    // Default fallback (no structure found or unknown intent)
    if (intent === 'explain' || intent === 'locate') {
      return "Essa informação específica ainda não está cadastrada neste modelo ou eu não consegui identificar a estrutura mencionada. Posso te orientar com base nos marcadores e no guia disponíveis.";
    }
    
    // Generic fallback
    return `Essa informação ainda não está cadastrada neste modelo. Posso te ajudar a explorar o modelo atual (**${context.model?.title || 'Corte Sagital'}**), orientar sobre os marcadores anatômicos e o uso da plataforma. O que prefere fazer?`;
  }
};
