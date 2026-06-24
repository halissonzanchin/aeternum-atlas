import { atlasAiTutorRegistry } from '../data/atlasAiTutorRegistry';
import { atlasEducationalRegistry } from '../data/atlasEducationalRegistry';

export const generateMockTutorResponse = async (question, tutorContext) => {
  return new Promise((resolve) => {
    // Simular o delay de digitação/raciocínio da IA
    setTimeout(() => {
      if (!tutorContext) {
        resolve("Olá! Selecione uma estrutura anatômica no modelo 3D para que eu possa ajudá-lo com contexto médico focado.");
        return;
      }

      const qLower = question.toLowerCase();
      let simulatedInsight = "";

      // Simulação bem rasa baseada em palavras-chave para criar imersão
      if (qLower.includes("erro") || qLower.includes("provas") || qLower.includes("cuidado")) {
        simulatedInsight = tutorContext.commonMistakes 
          ? `Alunos costumam errar muito nisso: ${tutorContext.commonMistakes[0]}. Fique atento!` 
          : 'Sempre observe bem a anatomia topográfica desta peça.';
      } else if (qLower.includes("clinica") || qLower.includes("patologia") || qLower.includes("doença")) {
        simulatedInsight = tutorContext.clinicalCorrelations
          ? `Clinicamente, essa estrutura tem forte correlação com ${tutorContext.clinicalCorrelations[0]}.`
          : 'Esta região possui grande relevância cirúrgica.';
      } else {
        simulatedInsight = `Aprofundando no contexto de ${tutorContext.structureName || tutorContext.structureId}: ${tutorContext.whatIsIt}`;
      }

      const mockResponse = `[ESTADO DE PREPARAÇÃO: LLM OFFLINE]\n\nCom base no contexto educacional cadastrado e simulando o processamento do "atlasTutorPrompts", aqui está uma resposta preparatória:\n\nSua pergunta: "${question}"\n\nInsight do Tutor Local: ${simulatedInsight}\n\n*Esta resposta é simulada e será substituída pela Inteligência Artificial real (OpenAI/Claude) na próxima fase de desenvolvimento.*`;
      
      resolve(mockResponse);
    }, 1500); // 1.5s delay simulado
  });
};
