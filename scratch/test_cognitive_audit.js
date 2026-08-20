import { cerebroAeternum } from '../src/services/cerebro-aeternum/cerebroAeternum.js';

console.log('======================================================================');
console.log('🔍 AUDITORIA DE CAPACIDADE COGNITIVA & RACIOCÍNIO CLÍNICO DO TUTOR');
console.log('======================================================================\n');

const testCases = [
  {
    category: '1. Raciocínio Clínico de Urgência (Infarto / Coronárias)',
    query: 'O que acontece se houver oclusão da artéria descendente anterior?',
    lang: 'pt'
  },
  {
    category: '2. Biomecânica e Inervação do Ombro',
    query: 'Quais músculos se inserem na clavícula e elevam o braço?',
    lang: 'pt'
  },
  {
    category: '3. Hemodinâmica e Vascularização Encefálica',
    query: 'Como funciona o polígono de Willis e a irrigação do cérebro?',
    lang: 'pt'
  },
  {
    category: '4. Fisiologia e Mecânica Respiratória',
    query: 'Explique a hematose pulmonar e o papel do diafragma',
    lang: 'pt'
  },
  {
    category: '5. Mentoria de Rotina e Gestão de Tempo',
    query: 'Como posso organizar minha agenda de estudos com eficiência?',
    lang: 'es'
  },
  {
    category: '6. Apoio Psicológico e Ansiedade Pré-Prova',
    query: 'Estou muito estressado e com medo de não passar na prova de anatomia',
    lang: 'pt'
  },
  {
    category: '7. Diálogo Espontâneo e Filosofia do Estudo',
    query: '¿Podés explicarme cómo funciona el sentido de la vida?',
    lang: 'es'
  }
];

testCases.forEach((tc, idx) => {
  console.log(`[TESTE ${idx + 1}] ${tc.category}`);
  console.log(`Pergunta do Aluno: "${tc.query}"`);
  const answer = cerebroAeternum.consultar({ query: tc.query, language: tc.lang });
  const text = typeof answer === 'object' ? (answer.markdown || answer.title) : answer;
  console.log(`Resposta do Tutor:`);
  console.log(`"${text}"`);
  console.log('----------------------------------------------------------------------\n');
});
