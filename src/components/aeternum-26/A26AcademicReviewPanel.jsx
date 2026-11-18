import React from "react";
import { A26Card, A26Button } from "./A26Primitives";
import LineIcon from "../icons/LineIcon";
import "../../styles/A26AcademicReviewPanel.css";

export default function A26AcademicReviewPanel({
  pendingReviewsCount = 0,
  retentionStage = "Insuficiente",
  weakSystems = [],
  onStartReview,
  onOpenExplorer,
  className = ""
}) {
  const hasPending = pendingReviewsCount > 0;
  const hasWeak = weakSystems.length > 0;

  return (
    <A26Card material="regular" tone="purple" className={`a26-review-panel ${className}`} role="region" aria-label="Painel de Revisões e Próximos Passos">
      <div className="a26-review-panel__header">
        <div>
          <span className="a26-review-panel__eyebrow">Recuperação Ativa & Próximos Passos</span>
          <h3 className="a26-review-panel__title">Recomendações Baseadas em Evidências</h3>
        </div>
        <span className="a26-review-panel__srs-badge">
          SRS: {retentionStage}
        </span>
      </div>

      <div className="a26-review-panel__content">
        {hasPending ? (
          <div className="a26-review-item is-alert">
            <span className="a26-review-item__icon" aria-hidden="true">
              <LineIcon name="reset" />
            </span>
            <div className="a26-review-item__info">
              <strong>{pendingReviewsCount} {pendingReviewsCount === 1 ? "revisão agendada" : "revisões agendadas"} para hoje</strong>
              <p>Revisar no intervalo ideal do SM-2 consolida a fixação anatômica na memória de longo prazo.</p>
            </div>
            {onStartReview ? (
              <A26Button variant="primary" size="small" onClick={onStartReview}>
                Iniciar Revisão
              </A26Button>
            ) : null}
          </div>
        ) : (
          <div className="a26-review-item is-clean">
            <span className="a26-review-item__icon" aria-hidden="true">
              <LineIcon name="check" />
            </span>
            <div className="a26-review-item__info">
              <strong>Todas as revisões espaçadas estão em dia</strong>
              <p>Nenhum cartão pendente para hoje. Excelente momento para dissecar novas peças cadavéricas.</p>
            </div>
            {onOpenExplorer ? (
              <A26Button variant="liquid" size="small" onClick={onOpenExplorer}>
                Explorar Modelos 3D
              </A26Button>
            ) : null}
          </div>
        )}

        {hasWeak ? (
          <div className="a26-review-item is-suggestion">
            <span className="a26-review-item__icon" aria-hidden="true">
              <LineIcon name="spark" />
            </span>
            <div className="a26-review-item__info">
              <strong>Foco sugerido: {weakSystems[0].systemName}</strong>
              <p>
                {weakSystems[0].quizAccuracy !== null
                  ? `Acurácia em simulados está em ${weakSystems[0].quizAccuracy}%. Recomendamos nova rodada de dissecção virtual.`
                  : `Menor cobertura de estruturas inspecionadas (${weakSystems[0].explorationCoveragePercent}%).`}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </A26Card>
  );
}
