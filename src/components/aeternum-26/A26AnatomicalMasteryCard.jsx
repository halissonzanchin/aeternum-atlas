import React from "react";
import { A26Card, A26Button } from "./A26Primitives";
import LineIcon from "../icons/LineIcon";
import "../../styles/A26AnatomicalMasteryCard.css";

export default function A26AnatomicalMasteryCard({
  systemName = "Sistema Anatômico",
  modelsCount = 0,
  structuresInspected = 0,
  structuresTotal = 0,
  explorationCoveragePercent = 0,
  quizAccuracy = null,
  quizAttempts = 0,
  masteryLevel = "Nao Iniciado",
  dataState = "SEM_HISTORICO",
  onExplore,
  className = ""
}) {
  const isNoData = dataState === "SEM_HISTORICO";
  const isPartial = dataState === "DADOS_PARCIAIS";

  // Ícone por sistema anatômico
  const getSystemIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes("cardio") || lower.includes("coração")) return "heart";
    if (lower.includes("nerv") || lower.includes("cérebro")) return "spark";
    if (lower.includes("loco") || lower.includes("ósseo") || lower.includes("músc")) return "layers";
    if (lower.includes("resp") || lower.includes("pulm")) return "eye";
    return "library";
  };

  const masteryBadgeLabel = {
    Consolidado: "Consolidado",
    "Em Formacao": "Em Formação",
    "Nao Iniciado": "Não Iniciado"
  }[masteryLevel] || "Em Exploração";

  const masteryBadgeClass = {
    Consolidado: "is-consolidated",
    "Em Formacao": "is-forming",
    "Nao Iniciado": "is-unstarted"
  }[masteryLevel] || "is-forming";

  return (
    <A26Card
      material="regular"
      tone="neutral"
      className={`a26-mastery-card ${className}`}
      role="article"
      aria-label={`Sistema ${systemName}: ${masteryBadgeLabel}`}
    >
      <div className="a26-mastery-card__header">
        <div className="a26-mastery-card__title-group">
          <span className="a26-mastery-card__icon" aria-hidden="true">
            <LineIcon name={getSystemIcon(systemName)} />
          </span>
          <div>
            <h3 className="a26-mastery-card__title">{systemName}</h3>
            <span className="a26-mastery-card__subtitle">
              {modelsCount} {modelsCount === 1 ? "modelo cadastrado" : "modelos cadastrados"}
            </span>
          </div>
        </div>
        <span className={`a26-mastery-card__badge ${masteryBadgeClass}`}>
          {masteryBadgeLabel}
        </span>
      </div>

      <div className="a26-mastery-card__triad">
        {/* Pilar 1: Exploração 3D */}
        <div className="a26-triad-row">
          <div className="a26-triad-row__header">
            <span className="a26-triad-row__label">Exploração Anatômica 3D</span>
            <span className="a26-triad-row__value">
              {structuresTotal > 0
                ? `${structuresInspected} / ${structuresTotal} (${explorationCoveragePercent}%)`
                : "Sem estruturas catalogadas"}
            </span>
          </div>
          <div
            className="a26-triad-row__track"
            role="progressbar"
            aria-valuenow={explorationCoveragePercent}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={`Cobertura 3D: ${explorationCoveragePercent}%`}
          >
            <span
              className="a26-triad-row__bar a26-triad-row__bar--teal"
              style={{ width: `${explorationCoveragePercent}%` }}
            />
          </div>
        </div>

        {/* Pilar 2: Simulados Clínicos */}
        <div className="a26-triad-row">
          <div className="a26-triad-row__header">
            <span className="a26-triad-row__label">Simulados & Casos</span>
            <span className="a26-triad-row__value">
              {quizAccuracy !== null
                ? `${quizAccuracy}% de precisão (${quizAttempts} ${quizAttempts === 1 ? "tentativa" : "tentativas"})`
                : "Aguardando primeiro simulado"}
            </span>
          </div>
          <div
            className="a26-triad-row__track"
            role="progressbar"
            aria-valuenow={quizAccuracy || 0}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={`Precisão em simulados: ${quizAccuracy !== null ? quizAccuracy + "%" : "Pendente"}`}
          >
            <span
              className="a26-triad-row__bar a26-triad-row__bar--coral"
              style={{ width: `${quizAccuracy || 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="a26-mastery-card__footer">
        <span className="a26-mastery-card__state-note">
          {isNoData
            ? "Abra um modelo deste sistema para iniciar a telemetria."
            : isPartial
              ? "Dados parciais observados • Trilha em consolidação."
              : "Evidências de dissecção e avaliação verificadas."}
        </span>
        {onExplore ? (
          <A26Button
            variant="liquid"
            size="small"
            onClick={onExplore}
            aria-label={`Explorar modelos do ${systemName}`}
          >
            Explorar
          </A26Button>
        ) : null}
      </div>
    </A26Card>
  );
}
