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
  NEXT_STUDY_STEP: 'NEXT_STUDY_STEP'
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

    case TUTOR_ACTIONS.SHOW_STUDY_PATH:
    case TUTOR_ACTIONS.START_STUDY_PATH:
    case TUTOR_ACTIONS.NEXT_STUDY_STEP:
      // These actions are intercepted and managed locally by the AI Viewer Panel state
      return true;

    default:
      console.warn(`[AI Tutor] Ação ${actionId} não reconhecida ou não whitelisted.`);
      return false;
  }
};
