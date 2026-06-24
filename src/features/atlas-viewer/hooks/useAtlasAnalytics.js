import { useEffect, useCallback } from 'react';
import { 
  initializeSession, 
  endSession, 
  logEvent 
} from '../../../utils/atlasInteractionAnalytics';
import { atlasAnalyticsService } from '../../../services/atlasAnalyticsService';
import { getCurrentUser } from '../../../services/auth/authService';

export function useAtlasAnalytics(modelId) {

  useEffect(() => {
    if (!modelId) return;

    // Quando o Hook monta (Modelo Abriu)
    const sessionId = initializeSession(modelId);

    // Quando o Hook desmonta (Modelo Fechou/Saiu da Rota)
    return () => {
      const closedSession = endSession(sessionId);
      if (closedSession) {
        const user = getCurrentUser();
        if (user && user.id) {
          // Despacha para o Supabase (Fogo e Esquece)
          atlasAnalyticsService.syncSession(closedSession, user.id).then(success => {
            if (success && closedSession.events && closedSession.events.length > 0) {
              atlasAnalyticsService.syncEvents(closedSession.events, closedSession.sessionId);
            }
          });
        }
      }
    };
  }, [modelId]);

  const trackAnnotationSelect = useCallback((annotation) => {
    logEvent('ANNOTATION_SELECTED', {
      annotationId: annotation.annotationId,
      title: annotation.title,
      structure: annotation.anatomicalStructure
    });
  }, []);

  const trackStructureSelect = useCallback((structureLayer) => {
    if (!structureLayer) return;
    logEvent('STRUCTURE_SELECTED', {
      layerId: structureLayer.layerId,
      meshName: structureLayer.meshName
    });
  }, []);

  const trackStructureToggle = useCallback((layerId, isHiddenNow) => {
    logEvent(isHiddenNow ? 'STRUCTURE_HIDDEN' : 'STRUCTURE_VISIBLE', {
      layerId
    });
  }, []);

  const trackAutoRotate = useCallback((enabled) => {
    logEvent(enabled ? 'AUTO_ROTATE_ENABLED' : 'AUTO_ROTATE_DISABLED');
  }, []);

  const trackResetView = useCallback(() => {
    logEvent('RESET_VIEW');
  }, []);

  const trackQuizStart = useCallback((quizId) => {
    logEvent('QUIZ_STARTED', { quizId });
  }, []);

  const trackQuizAnswer = useCallback((quizId, isCorrect, timeSpentMs) => {
    logEvent('QUIZ_ANSWERED', { quizId, isCorrect, timeSpentMs });
    logEvent(isCorrect ? 'QUIZ_CORRECT' : 'QUIZ_INCORRECT', { quizId });
  }, []);

  return {
    trackAnnotationSelect,
    trackStructureSelect,
    trackStructureToggle,
    trackAutoRotate,
    trackResetView,
    trackQuizStart,
    trackQuizAnswer
  };
}
