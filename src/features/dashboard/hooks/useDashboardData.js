import { useState, useEffect, useMemo } from "react";
import {
  calculateStudentProgress,
  fetchAccessLogs,
  getCompletedModelIds
} from "../../../services/progressService";
import { listModelsForUser } from "../../../services/modelService";
import { trackEvent } from "../../../services/analytics/analyticsService";
import {
  fetchLearningTelemetry,
  getLocalLearningTelemetry,
  LEARNING_TELEMETRY_UPDATED_EVENT
} from "../../../services/learningTelemetryService";
import {
  buildStudySeries,
  buildSystemLearningMetrics,
  calculateLearningTotals
} from "../../../services/learningMetrics";
import { useLanguage } from "../../../context/LanguageContext";

function modelPath(model) {
  return `/viewer/${model.slug || model.id}`;
}

export function useDashboardData(user) {
  const { language } = useLanguage();
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [telemetry, setTelemetry] = useState(() => getLocalLearningTelemetry(user));

  const activeModels = useMemo(() => models.filter(model => model.isActive !== false), [models]);
  const completedModelIds = useMemo(() => getCompletedModelIds(user), [user]);
  const learningTotals = useMemo(() => calculateLearningTotals(telemetry.sessions), [telemetry.sessions]);

  const stats = useMemo(() => {
    const localStats = calculateStudentProgress(user, models, logs, telemetry.sessions);
    return {
      ...localStats,
      totalAccesses: learningTotals.viewerSessions || logs.length,
      totalStudyMinutes: Math.round(learningTotals.studySeconds / 60),
      connectedMinutes: Math.round(learningTotals.connectedSeconds / 60),
      telemetrySource: telemetry.source,
      telemetrySynchronized: telemetry.synchronized,
      telemetryError: telemetry.syncError
    };
  }, [learningTotals, logs, models, telemetry, user]);
  
  const recentModels = useMemo(() => {
    const modelsById = new Map(models.flatMap(model => [[model.id, model], [model.slug, model]]).filter(([id]) => id));
    const completedIds = new Set(getCompletedModelIds(user));
    const fromLogs = [];
    const seen = new Set();

    const observedActivity = [
      ...telemetry.sessions
        .filter(session => session.scope === "viewer" && session.modelId)
        .map(session => ({ modelId: session.modelId, createdAt: session.startedAt })),
      ...logs
    ].sort((a, b) => new Date(b.createdAt || b.startedAt || 0) - new Date(a.createdAt || a.startedAt || 0));

    observedActivity.forEach(log => {
      if (!log?.modelId || seen.has(log.modelId)) return;
      const model = modelsById.get(log.modelId);
      if (!model) return;
      seen.add(log.modelId);
      fromLogs.push({
        ...model,
        progressPercent: completedIds.has(model.id) || completedIds.has(model.slug) ? 100 : 0
      });
    });

    return fromLogs.slice(0, 3);
  }, [models, logs, telemetry.sessions, user]);
  
  const systemProgress = useMemo(() => buildSystemLearningMetrics({
    models: activeModels,
    sessions: telemetry.sessions,
    events: telemetry.events,
    quizResults: telemetry.quizResults,
    completedModelIds
  }), [activeModels, completedModelIds, telemetry.events, telemetry.quizResults, telemetry.sessions]);
  const studySeriesByPeriod = useMemo(() => ({
    week: buildStudySeries(telemetry.sessions, "week", { language }),
    month: buildStudySeries(telemetry.sessions, "month", { language }),
    year: buildStudySeries(telemetry.sessions, "year", { language })
  }), [language, telemetry.sessions]);
  const weeklyStudyData = studySeriesByPeriod.week;
  const continueTarget = recentModels[0] ? modelPath(recentModels[0]) : "/models";
  
  const observedRecommendations = useMemo(
    () => recentModels.map((model, index) => ({
      id: `observed-${model.id || model.slug}`,
      icon: index === 0 ? "reset" : "layers",
      title: model.shortTitle || model.title,
      description: index === 0
        ? "Retome o último modelo registrado no seu histórico de acesso."
        : "Continue um modelo presente nas suas sessões recentes.",
      path: modelPath(model)
    })),
    [recentModels]
  );

  useEffect(() => {
    let mounted = true;
    setModelsLoading(true);

    Promise.all([
      listModelsForUser(user),
      fetchAccessLogs(user),
      fetchLearningTelemetry(user)
    ]).then(([items, fetchedLogs, fetchedTelemetry]) => {
      if (mounted) {
        setModels(items);
        setLogs(fetchedLogs || []);
        setTelemetry(fetchedTelemetry || getLocalLearningTelemetry(user));
      }
    }).finally(() => {
      if (mounted) setModelsLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user?.id) return undefined;
    function refreshLocalTelemetry() {
      const local = getLocalLearningTelemetry(user);
      setTelemetry(current => {
        const merge = (primary = [], secondary = []) => {
          const seen = new Set();
          return [...primary, ...secondary].filter((item, index) => {
            const key = item?.id || `${item?.modelId || "item"}:${item?.startedAt || item?.createdAt || index}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        };
        return {
          ...current,
          sessions: merge(local.sessions, current.sessions),
          events: merge(local.events, current.events),
          quizResults: merge(local.quizResults, current.quizResults)
        };
      });
    }
    window.addEventListener(LEARNING_TELEMETRY_UPDATED_EVENT, refreshLocalTelemetry);
    return () => window.removeEventListener(LEARNING_TELEMETRY_UPDATED_EVENT, refreshLocalTelemetry);
  }, [user]);

  useEffect(() => {
    trackEvent({ userId: user?.id, institutionId: user?.institutionId, role: user?.role, eventType: "open_dashboard" });
  }, [user?.id, user?.institutionId, user?.role]);

  return {
    models,
    modelsLoading,
    logs,
    stats,
    recentModels,
    activeModels,
    systemProgress,
    telemetry,
    studySeriesByPeriod,
    weeklyStudyData,
    continueTarget,
    observedRecommendations
  };
}
