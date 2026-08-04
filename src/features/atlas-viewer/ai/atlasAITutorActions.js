/**
 * atlasAITutorActions.js
 * Lista centralizada e segura (Whitelist) de ações que o Aeternum AI Tutor 
 * tem permissão para executar no Viewer.
 */

import { sketchfabBridge } from '../../../services/sketchfabAnnotationBridge';

export const TUTOR_ACTIONS = {
  CLOSE_PANELS: 'CLOSE_PANELS',
  RESET_VIEW: 'RESET_VIEW',
  FOCUS_MARKER: 'FOCUS_MARKER',
  START_THEORETICAL_QUIZ: 'START_THEORETICAL_QUIZ',
  START_PRACTICAL_QUIZ: 'START_PRACTICAL_QUIZ',
  SHOW_STUDY_PATH: 'SHOW_STUDY_PATH',
  START_STUDY_PATH: 'START_STUDY_PATH',
  NEXT_STUDY_STEP: 'NEXT_STUDY_STEP',
  GENERATE_MIND_MAP: 'GENERATE_MIND_MAP',
  GENERATE_STUDY_REPORT: 'GENERATE_STUDY_REPORT',
  GENERATE_CUSTOM_QUIZ: 'GENERATE_CUSTOM_QUIZ',
  GENERATE_FLASHCARDS: 'GENERATE_FLASHCARDS',
  GENERATE_DATA_TABLE: 'GENERATE_DATA_TABLE',
  GENERATE_AUDIO_SUMMARY: 'GENERATE_AUDIO_SUMMARY',
  NAVIGATE_TO_DASHBOARD: 'NAVIGATE_TO_DASHBOARD',
  NAVIGATE_TO_CATALOG: 'NAVIGATE_TO_CATALOG'
};

/**
 * Mapeamento das propriedades visuais e comportamentais de cada ação.
 * autoExecute: true -> Executa assim que a IA sugere
 * autoExecute: false -> Requer que o usuário clique no botão sugerido no chat
 */
export const actionDictionary = {
  [TUTOR_ACTIONS.CLOSE_PANELS]: {
    id: TUTOR_ACTIONS.CLOSE_PANELS,
    label: 'Fechar Painéis',
    description: 'Recolhe os painéis para limpar a tela.',
    autoExecute: true,
  },
  [TUTOR_ACTIONS.RESET_VIEW]: {
    id: TUTOR_ACTIONS.RESET_VIEW,
    label: 'Resetar Visão',
    description: 'Centraliza e reinicia a câmera 3D para o enquadramento original.',
    autoExecute: false,
  },
  [TUTOR_ACTIONS.FOCUS_MARKER]: {
    id: TUTOR_ACTIONS.FOCUS_MARKER,
    label: 'Focar Marcador',
    description: 'Mova a câmera para focar na estrutura especificada.',
    autoExecute: false,
  },
  [TUTOR_ACTIONS.START_THEORETICAL_QUIZ]: {
    id: TUTOR_ACTIONS.START_THEORETICAL_QUIZ,
    label: 'Iniciar Simulado Teórico',
    description: 'Abre o painel de perguntas teóricas sobre a anatomia.',
    autoExecute: false,
  },
  [TUTOR_ACTIONS.START_PRACTICAL_QUIZ]: {
    id: TUTOR_ACTIONS.START_PRACTICAL_QUIZ,
    label: 'Iniciar Simulado Prático',
    description: 'Abre o modo de identificação visual de pinos.',
    autoExecute: false,
  },
  [TUTOR_ACTIONS.SHOW_STUDY_PATH]: {
    id: TUTOR_ACTIONS.SHOW_STUDY_PATH,
    label: 'Ver Sequência de Estudo',
    description: 'Exibe a trilha recomendada na interface se disponível.',
    autoExecute: false,
  },
  [TUTOR_ACTIONS.START_STUDY_PATH]: {
    id: TUTOR_ACTIONS.START_STUDY_PATH,
    label: 'Iniciar Trilha',
    description: 'Inicia o modo guiado passo a passo.',
    autoExecute: false,
  },
  [TUTOR_ACTIONS.NEXT_STUDY_STEP]: {
    id: TUTOR_ACTIONS.NEXT_STUDY_STEP,
    label: 'Próximo Passo',
    description: 'Avança para a próxima estrutura na trilha.',
    autoExecute: false,
  },
  [TUTOR_ACTIONS.GENERATE_MIND_MAP]: {
    id: TUTOR_ACTIONS.GENERATE_MIND_MAP,
    label: 'Mapa Mental',
    description: 'Gera um diagrama hierárquico em mapa mental sobre o conteúdo.',
    autoExecute: false,
  },
  [TUTOR_ACTIONS.GENERATE_STUDY_REPORT]: {
    id: TUTOR_ACTIONS.GENERATE_STUDY_REPORT,
    label: 'Criar Relatório / Guia',
    description: 'Gera um documento de resumo ou guia de estudo estruturado.',
    autoExecute: false,
  },
  [TUTOR_ACTIONS.GENERATE_CUSTOM_QUIZ]: {
    id: TUTOR_ACTIONS.GENERATE_CUSTOM_QUIZ,
    label: 'Teste Personalizado',
    description: 'Cria um teste sob medida por tema e nível de dificuldade.',
    autoExecute: false,
  },
  [TUTOR_ACTIONS.GENERATE_FLASHCARDS]: {
    id: TUTOR_ACTIONS.GENERATE_FLASHCARDS,
    label: 'Cartões Didáticos',
    description: 'Gera um deck de flashcards para memorização ativa.',
    autoExecute: false,
  },
  [TUTOR_ACTIONS.GENERATE_DATA_TABLE]: {
    id: TUTOR_ACTIONS.GENERATE_DATA_TABLE,
    label: 'Tabela Anatômica',
    description: 'Gera uma tabela detalhada com Origem, Inserção e Inervação.',
    autoExecute: false,
  },
  [TUTOR_ACTIONS.GENERATE_AUDIO_SUMMARY]: {
    id: TUTOR_ACTIONS.GENERATE_AUDIO_SUMMARY,
    label: 'Resumo em Áudio',
    description: 'Gera uma narração didática sobre a peça anatômica.',
    autoExecute: false,
  },
  [TUTOR_ACTIONS.NAVIGATE_TO_DASHBOARD]: {
    id: TUTOR_ACTIONS.NAVIGATE_TO_DASHBOARD,
    label: 'Ir para o Meu Painel',
    description: 'Navega para a página de evolução de estudos.',
    autoExecute: false,
  },
  [TUTOR_ACTIONS.NAVIGATE_TO_CATALOG]: {
    id: TUTOR_ACTIONS.NAVIGATE_TO_CATALOG,
    label: 'Ver Catálogo 3D',
    description: 'Navega para a biblioteca de modelos 3D.',
    autoExecute: false,
  }
};

/**
 * Função responsável por rotear a intenção da IA para os métodos reais do React Context.
 */
export const executeTutorAction = (actionId, payload = null, viewerContext) => {
  if (!viewerContext) {
    console.warn("[AI Tutor] Contexto do viewer ausente. Ação abortada.");
    return false;
  }

  switch (actionId) {
    case TUTOR_ACTIONS.CLOSE_PANELS:
      viewerContext.setSearchOpen?.(false);
      return true;
      
    case TUTOR_ACTIONS.RESET_VIEW:
      return sketchfabBridge.resetCamera();

    case TUTOR_ACTIONS.FOCUS_MARKER:
      if (!payload) return false;
      {
        const annotations = viewerContext.annotations?.sketchfabAnnotations || [];
        const normalizedPayload = String(payload).toLocaleLowerCase('pt-BR');
        const index = annotations.findIndex((annotation) => {
          const values = [annotation?.id, annotation?.name, annotation?.title]
            .filter(Boolean)
            .map(value => String(value).toLocaleLowerCase('pt-BR'));
          return values.some(value => value === normalizedPayload || value.includes(normalizedPayload));
        });
        return index >= 0 ? sketchfabBridge.goToSketchfabAnnotation(index) : false;
      }

    case TUTOR_ACTIONS.START_THEORETICAL_QUIZ:
      if (viewerContext.quiz && typeof viewerContext.quiz.setTheoreticalQuizOpen === 'function') {
        viewerContext.quiz.setTheoreticalQuizOpen(true);
        return true;
      }
      return false;

    case TUTOR_ACTIONS.START_PRACTICAL_QUIZ:
      if (viewerContext.quiz && typeof viewerContext.quiz.handleOpenAnatomicalQuiz === 'function') {
        viewerContext.quiz.handleOpenAnatomicalQuiz();
        return true;
      }
      return false;

    case TUTOR_ACTIONS.NAVIGATE_TO_DASHBOARD:
      if (viewerContext.navigate) {
        viewerContext.navigate('/dashboard');
        return true;
      }
      return false;

    case TUTOR_ACTIONS.NAVIGATE_TO_CATALOG:
      if (viewerContext.navigate) {
        viewerContext.navigate('/models');
        return true;
      }
      return false;

    case TUTOR_ACTIONS.SHOW_STUDY_PATH:
    case TUTOR_ACTIONS.START_STUDY_PATH:
    case TUTOR_ACTIONS.NEXT_STUDY_STEP:
    case TUTOR_ACTIONS.GENERATE_MIND_MAP:
    case TUTOR_ACTIONS.GENERATE_STUDY_REPORT:
    case TUTOR_ACTIONS.GENERATE_CUSTOM_QUIZ:
    case TUTOR_ACTIONS.GENERATE_FLASHCARDS:
    case TUTOR_ACTIONS.GENERATE_DATA_TABLE:
    case TUTOR_ACTIONS.GENERATE_AUDIO_SUMMARY:
      // Managed by AI Conversation Panel
      return true;

    default:
      console.warn(`[AI Tutor] Ação ${actionId} não reconhecida ou não whitelisted.`);
      return false;
  }
};
