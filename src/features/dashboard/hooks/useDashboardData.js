import { useState, useEffect, useMemo } from "react";
import { calculateStudentProgress, fetchAccessLogs } from "../../../services/progressService";
import { listModelsForUser } from "../../../services/modelService";
import { trackEvent } from "../../../services/analytics/analyticsService";

function modelPath(model) {
  return `/viewer/${model.slug || model.id}`;
}

export function useDashboardData(user) {
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  // Stats can eventually be migrated to Supabase completely, for now we mix.
  const stats = useMemo(() => {
    const localStats = calculateStudentProgress(user, models);
    return {
      ...localStats,
      totalAccesses: logs.length
    };
  }, [user, models, logs]);
  
  const recentModels = useMemo(() => {
    const modelsById = new Map(models.map(model => [model.id, model]));
    const fromLogs = [];
    const seen = new Set();

    logs.forEach(log => {
      if (!log?.modelId || seen.has(log.modelId)) return;
      const model = modelsById.get(log.modelId);
      if (!model) return;
      seen.add(log.modelId);
      fromLogs.push(model);
    });

    return (fromLogs.length ? fromLogs : models).slice(0, 3);
  }, [models, logs]);
  
  const activeModels = useMemo(() => models.filter(model => model.isActive !== false), [models]);
  const studiedStructures = stats.studiedModels * 4;
  const continueTarget = recentModels[0] ? modelPath(recentModels[0]) : "/models";
  
  const recommendationPaths = useMemo(() => ({
    "review-most-accessed": recentModels[0] ? modelPath(recentModels[0]) : "/models",
    "complete-started": recentModels[1] ? `/models/${recentModels[1].id}` : "/models",
    "quick-quiz": "/quizzes",
    "generate-flashcards": "/flashcards"
  }), [recentModels]);

  useEffect(() => {
    let mounted = true;
    setModelsLoading(true);

    Promise.all([
      listModelsForUser(user),
      fetchAccessLogs(user)
    ]).then(([items, fetchedLogs]) => {
      if (mounted) {
        setModels(items);
        setLogs(fetchedLogs || []);
      }
    }).finally(() => {
      if (mounted) setModelsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    trackEvent({ userId: user?.id, institutionId: user?.institutionId, role: user?.role, eventType: "open_dashboard" });
  }, [user?.id, user?.institutionId, user?.role]);

  return {
    models,
    modelsLoading,
    stats,
    recentModels,
    activeModels,
    studiedStructures,
    continueTarget,
    recommendationPaths
  };
}
