import React, { useState, useMemo } from "react";
import {
  A26Card,
  A26MetricTile,
  A26AnatomicalMasteryCard,
  A26StudyChronometerChart,
  A26AcademicReviewPanel,
  A26EmptyState
} from "../../../components/aeternum-26";
import {
  ACADEMIC_DATA_STATES,
  calculateQualifiedActiveTime,
  calculate3DExplorationMetrics,
  calculateFlashcardMetrics,
  calculateQuizMetrics,
  calculateAnatomicalMasteryBySystem,
  determineGlobalDataState,
  buildUnifiedStudySeries
} from "../../../services/academicMetricsService";
import "../../../styles/AcademicEvolutionDashboard.css";

export default function AcademicEvolutionDashboard({
  user,
  models = [],
  sessions = [],
  events = [],
  quizResults = [],
  reviews = [],
  syncStatus = "verified",
  syncError = null,
  navigate,
  t = (k, o) => o?.defaultValue || k,
  className = ""
}) {
  const [period, setPeriod] = useState("week");

  // 1. Cálculos Canônicos Verificáveis
  const activeTimeMetrics = useMemo(() => {
    return calculateQualifiedActiveTime(sessions, events);
  }, [sessions, events]);

  const exploration3D = useMemo(() => {
    return calculate3DExplorationMetrics(models, sessions, events);
  }, [models, sessions, events]);

  const flashcardMetrics = useMemo(() => {
    return calculateFlashcardMetrics(reviews, events);
  }, [reviews, events]);

  const quizMetrics = useMemo(() => {
    return calculateQuizMetrics(quizResults, []);
  }, [quizResults]);

  const systemsMastery = useMemo(() => {
    return calculateAnatomicalMasteryBySystem({
      models,
      explorationMetrics: exploration3D,
      flashcardMetrics,
      quizMetrics
    });
  }, [models, exploration3D, flashcardMetrics, quizMetrics]);

  const globalDataState = useMemo(() => {
    return determineGlobalDataState({
      totalActiveSeconds: activeTimeMetrics.totalActiveSeconds,
      distinctModelsCount: exploration3D.distinctModelsCount,
      flashcardsAnswered: flashcardMetrics.totalCardsAnswered,
      quizAttempts: quizMetrics.totalAttempts,
      syncError,
      isSynchronized: syncStatus === "verified"
    });
  }, [activeTimeMetrics, exploration3D, flashcardMetrics, quizMetrics, syncError, syncStatus]);

  const studySeries = useMemo(() => {
    return buildUnifiedStudySeries(sessions, period);
  }, [sessions, period]);

  // Identificar sistemas com menor acurácia para foco de revisão
  const weakSystems = useMemo(() => {
    return systemsMastery.filter(s => s.dataState !== ACADEMIC_DATA_STATES.SEM_HISTORICO);
  }, [systemsMastery]);

  const formatHours = (hours) => {
    if (!hours || hours === 0) return "0h";
    return `${hours}h`;
  };

  const statusLabel = syncError
    ? "Sincronização pendente"
    : syncStatus === "verified"
      ? "Sincronizado com a conta"
      : "Dados locais deste dispositivo";

  return (
    <section className={`academic-evolution-dashboard ${className}`} aria-label="Evolução e Telemetria Acadêmica">
      {/* Cabeçalho da Seção */}
      <div className="academic-evolution-header">
        <div>
          <p className="viewer-eyebrow">Acompanhamento Curricular • Medicina</p>
          <h2 className="academic-evolution-title">Evolução do Estudante</h2>
          <span className="academic-evolution-subtitle">
            Telemetria verificável baseada no histórico de dissecção 3D, repetição espaçada e simulados clínicos.
          </span>
        </div>
        <div className="academic-evolution-sync-badge">
          <span className={`sync-indicator ${syncError ? "is-error" : "is-synced"}`} />
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* Alerta de sincronização se houver erro */}
      {syncError ? (
        <div className="academic-sync-alert" role="alert">
          <span>⚠️ {syncError}. Os dados salvos localmente serão sincronizados assim que a conexão estabilizar.</span>
        </div>
      ) : null}

      {/* ZONA A: Resumo Executivo de Atividades (4 A26MetricTiles) */}
      <div className="academic-metrics-grid">
        <A26MetricTile
          label="Tempo Ativo Total"
          value={activeTimeMetrics.totalActiveHours > 0 ? activeTimeMetrics.totalActiveHours : activeTimeMetrics.totalActiveMinutes}
          unit={activeTimeMetrics.totalActiveHours > 0 ? "h" : "min"}
          detail={`${activeTimeMetrics.intervalsCount} ${activeTimeMetrics.intervalsCount === 1 ? "sessão qualificada" : "sessões qualificadas"}`}
          icon="time"
          tone="teal"
          status={syncError ? "pending" : "verified"}
          statusLabel={activeTimeMetrics.totalActiveSeconds > 0 ? "Comprovado" : "Sem histórico"}
        />

        <A26MetricTile
          label="Estruturas 3D Examinadas"
          value={exploration3D.totalStructuresExplored}
          unit="alfinetes"
          detail={`${exploration3D.distinctModelsCount} ${exploration3D.distinctModelsCount === 1 ? "peça explorada" : "peças exploradas"}`}
          icon="layers"
          tone="teal"
          status={exploration3D.totalStructuresExplored > 0 ? "verified" : "unavailable"}
          statusLabel={`${exploration3D.overallCoveragePercent}% do catálogo`}
        />

        <A26MetricTile
          label="Retenção Ativa (SRS)"
          value={flashcardMetrics.totalCardsAnswered > 0 ? `${flashcardMetrics.accuracyPercent}%` : "—"}
          unit={flashcardMetrics.totalCardsAnswered > 0 ? "acerto" : ""}
          detail={flashcardMetrics.totalCardsAnswered > 0 ? `${flashcardMetrics.totalCardsAnswered} cards revisados` : "Nenhum card revisado"}
          icon="spark"
          tone="purple"
          status={flashcardMetrics.totalCardsAnswered > 0 ? "verified" : "unavailable"}
          statusLabel={flashcardMetrics.overallRetentionStage}
        />

        <A26MetricTile
          label="Simulados Anatômicos"
          value={quizMetrics.globalWeightedAccuracy !== null ? `${quizMetrics.globalWeightedAccuracy}%` : "—"}
          unit={quizMetrics.globalWeightedAccuracy !== null ? "precisão" : ""}
          detail={quizMetrics.totalAttempts > 0 ? `${quizMetrics.totalAttempts} ${quizMetrics.totalAttempts === 1 ? "simulado" : "simulados"} (${quizMetrics.totalQuestionsSum} questões)` : "Aguardando primeiro simulado"}
          icon="check"
          tone="coral"
          status={quizMetrics.totalAttempts > 0 ? "verified" : "unavailable"}
          statusLabel={quizMetrics.totalAttempts > 0 ? "Ponderada" : "Pendente"}
        />
      </div>

      {/* ESTADO: SEM HISTÓRICO GLOBAL (Onboarding Educacional) */}
      {globalDataState === ACADEMIC_DATA_STATES.SEM_HISTORICO ? (
        <A26Card material="regular" tone="teal" className="academic-onboarding-card">
          <A26EmptyState
            title="Seja bem-vindo ao Aeternum Atlas"
            text="Sua telemetria acadêmica começará a ser registrada assim que você abrir seu primeiro modelo anatômico 3D ou revisar uma rodada de flashcards."
          />
        </A26Card>
      ) : (
        <>
          {/* ZONA B & D: Grid de Ritmo Temporal e Próximos Passos */}
          <div className="academic-bipolar-grid">
            <A26Card material="regular" className="academic-chronometer-panel">
              <A26StudyChronometerChart
                series={studySeries}
                period={period}
                onPeriodChange={setPeriod}
              />
            </A26Card>

            <A26AcademicReviewPanel
              pendingReviewsCount={flashcardMetrics.pendingReviewsCount}
              retentionStage={flashcardMetrics.overallRetentionStage}
              weakSystems={weakSystems}
              onStartReview={() => navigate && navigate("/flashcards")}
              onOpenExplorer={() => navigate && navigate("/models")}
            />
          </div>

          {/* ZONA C: Tríade de Maestria por Sistema Anatômico */}
          <div className="academic-systems-section">
            <div className="academic-systems-header">
              <h3 className="academic-systems-title">Desempenho por Sistema Anatômico</h3>
              <span className="academic-systems-subtitle">
                Tríade pedagógica individual: dissecção 3D, retenção em repetição espaçada e acurácia de prova.
              </span>
            </div>

            <div className="academic-systems-grid">
              {systemsMastery.map(sys => (
                <A26AnatomicalMasteryCard
                  key={sys.systemName}
                  systemName={sys.systemName}
                  modelsCount={sys.modelsCount}
                  structuresInspected={sys.structuresInspected}
                  structuresTotal={sys.structuresTotal}
                  explorationCoveragePercent={sys.explorationCoveragePercent}
                  quizAccuracy={sys.quizAccuracy}
                  quizAttempts={sys.quizAttempts}
                  masteryLevel={sys.masteryLevel}
                  dataState={sys.dataState}
                  onExplore={() => navigate && navigate(`/models?system=${encodeURIComponent(sys.systemName)}`)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
