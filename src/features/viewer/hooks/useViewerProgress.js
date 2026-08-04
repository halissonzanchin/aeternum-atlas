import { useState, useEffect } from 'react';
import { favoriteModel, completeModel, trackEvent } from '../../../services/analytics/analyticsService';
import { isFavoriteModel, isModelStudied, unmarkModelAsStudied } from '../../../services/progressService';
import { startTrackedLearningSession } from '../../../services/learningTelemetryService';
import { useLanguage } from '../../../context/LanguageContext';

export function useViewerProgress(model, user, setToast) {
  const { t } = useLanguage();
  const [favorite, setFavorite] = useState(false);
  const [studied, setStudied] = useState(false);
  const [accessRegistered, setAccessRegistered] = useState(false);

  useEffect(() => {
    setFavorite(model?.id ? isFavoriteModel(user, model.id) : false);
    setStudied(model?.id ? isModelStudied(user, model.id) : false);
    setAccessRegistered(false);
  }, [model?.id, user]);

  useEffect(() => {
    if (!model?.id) return undefined;
    trackEvent({ userId: user?.id, institutionId: user?.institutionId, modelId: model.id, eventType: "open_model_viewer" });
    const tracker = startTrackedLearningSession({
      user,
      scope: "viewer",
      modelId: model.id
    });

    return () => {
      const session = tracker.stop("viewer_unmount");
      trackEvent({
        userId: user?.id,
        institutionId: user?.institutionId,
        modelId: model.id,
        eventType: "viewer_duration",
        durationSeconds: Math.max(0, Number(session?.activeSeconds) || 0),
        metadata: {
          activeSeconds: Math.max(0, Number(session?.activeSeconds) || 0),
          idleSeconds: Math.max(0, Number(session?.idleSeconds) || 0),
          telemetrySessionId: session?.id || null
        }
      });
    };
  }, [model?.id, user?.id, user?.institutionId]);

  function handleFavorite() {
    const added = favoriteModel(user, model);
    setFavorite(added);
    setToast(added ? t("viewer.favoriteAdded") : t("viewer.favoriteRemoved"));
  }

  function handleToggleStudied() {
    const nextStudied = !studied;

    if (nextStudied) {
      completeModel(user, model);
      setToast(t("viewer.modelCompleted"));
    } else {
      unmarkModelAsStudied(user, model.id);
      trackEvent({
        userId: user?.id,
        institutionId: user?.institutionId,
        role: user?.role,
        modelId: model.id,
        eventType: "uncomplete_model"
      });
      setToast(t("viewer.modelUnmarked"));
    }

    setStudied(nextStudied);
  }

  function handleRegisterAccess() {
    const nextAccessRegistered = !accessRegistered;

    if (nextAccessRegistered) {
      trackEvent({ userId: user?.id, institutionId: user?.institutionId, modelId: model.id, eventType: "open_model_viewer", metadata: { source: "manual_button" } });
      setToast(t("viewer.accessRegistered"));
    } else {
      setToast(t("viewer.accessUnregistered"));
    }

    setAccessRegistered(nextAccessRegistered);
  }

  return {
    favorite,
    studied,
    accessRegistered,
    handleFavorite,
    handleToggleStudied,
    handleRegisterAccess
  };
}
