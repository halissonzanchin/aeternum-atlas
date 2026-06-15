import { useState, useEffect } from 'react';
import { favoriteModel, completeModel, trackEvent } from '../../../services/analyticsService';
import { isFavoriteModel, isModelStudied, trackModelAccess, unmarkModelAsStudied } from '../../../services/progressService';
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
    const startedAt = Date.now();
    trackEvent({ userId: user?.id, institutionId: user?.institutionId, modelId: model.id, eventType: "open_model_viewer" });
    trackModelAccess(user, model.id, { action: "open_model_viewer", model });

    return () => {
      trackEvent({
        userId: user?.id,
        institutionId: user?.institutionId,
        modelId: model.id,
        eventType: "viewer_duration",
        metadata: { durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)) }
      });
      trackModelAccess(user, model.id, {
        action: "viewer_duration",
        model,
        startedAt: new Date(startedAt).toISOString(),
        endedAt: new Date().toISOString(),
        durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000))
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
      trackModelAccess(user, model.id, { action: "open_model_viewer", model });
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
