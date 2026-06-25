/**
 * atlasAITutorActions.js
 * Lista centralizada e segura (Whitelist) de ações que o Aeternum AI Tutor 
 * tem permissão para executar no Viewer.
 */

import { atlasViewerCommands } from './atlasViewerCommands';

export const TUTOR_ACTIONS = {
  OPEN_GUIDE: 'OPEN_GUIDE',
  OPEN_MARKERS: 'OPEN_MARKERS',
  CLOSE_PANELS: 'CLOSE_PANELS',
  RESET_VIEW: 'RESET_VIEW',
  FOCUS_MARKER: 'FOCUS_MARKER',
  START_THEORETICAL_QUIZ: 'START_THEORETICAL_QUIZ',
  START_PRACTICAL_QUIZ: 'START_PRACTICAL_QUIZ',
  SHOW_STUDY_PATH: 'SHOW_STUDY_PATH',
  START_STUDY_PATH: 'START_STUDY_PATH',
  NEXT_STUDY_STEP: 'NEXT_STUDY_STEP'
};

/**
 * Mapeamento das propriedades visuais e comportamentais de cada ação.
 * autoExecute: true -> Executa assim que a IA sugere
 * autoExecute: false -> Requer que o usuário clique no botão sugerido no chat
 */
export const actionDictionary = {
  [TUTOR_ACTIONS.OPEN_GUIDE]: {
    id: TUTOR_ACTIONS.OPEN_GUIDE,
    label: 'Abrir Guia',
    description: 'Abre o painel lateral de guia de estudos e informações.',
    autoExecute: true,
  },
  [TUTOR_ACTIONS.OPEN_MARKERS]: {
    id: TUTOR_ACTIONS.OPEN_MARKERS,
    label: 'Ver Marcadores',
    description: 'Abre a barra inferior com os marcadores anatômicos.',
    autoExecute: true,
  },
  [TUTOR_ACTIONS.CLOSE_PANELS]: {
    id: TUTOR_ACTIONS.CLOSE_PANELS,
    label: 'Fechar Painéis',
    description: 'Recolhe os painéis laterais e inferiores para limpar a tela.',
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
    case TUTOR_ACTIONS.OPEN_GUIDE:
      viewerContext.setLeftOpen(true);
      return true;
      
    case TUTOR_ACTIONS.OPEN_MARKERS:
      viewerContext.setMarkerOpen(true);
      return true;
      
    case TUTOR_ACTIONS.CLOSE_PANELS:
      viewerContext.setLeftOpen(false);
      viewerContext.setMarkerOpen(false);
      viewerContext.setSearchOpen?.(false);
      return true;
      
    case TUTOR_ACTIONS.RESET_VIEW:
      if (atlasViewerCommands && typeof atlasViewerCommands.resetCamera === 'function') {
        atlasViewerCommands.resetCamera();
        return true;
      }
      return false;

    case TUTOR_ACTIONS.FOCUS_MARKER:
      if (atlasViewerCommands && typeof atlasViewerCommands.focusMarker === 'function' && payload) {
        // payload should be the marker ID or name mapping
        atlasViewerCommands.focusMarker(payload);
        return true;
      }
      return false;

    case TUTOR_ACTIONS.START_THEORETICAL_QUIZ:
      if (viewerContext.quiz && typeof viewerContext.quiz.setTheoreticalQuizOpen === 'function') {
        viewerContext.setLeftOpen(false); // Close guide to focus on quiz
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

    case TUTOR_ACTIONS.SHOW_STUDY_PATH:
      // Stub behavior: Opens guide where study path usually resides
      viewerContext.setLeftOpen(true);
      return true;

    case TUTOR_ACTIONS.START_STUDY_PATH:
    case TUTOR_ACTIONS.NEXT_STUDY_STEP:
      // These actions are intercepted and managed locally by the AI Viewer Panel state
      return true;

    default:
      console.warn(`[AI Tutor] Ação ${actionId} não reconhecida ou não whitelisted.`);
      return false;
  }
};
