import React, { useMemo } from "react";
import { A26SegmentedControl } from "./A26Primitives";
import "../../styles/A26StudyChronometerChart.css";

function formatMinutes(mins = 0) {
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins} min`;
}

export default function A26StudyChronometerChart({
  series = [],
  period = "week",
  onPeriodChange,
  className = ""
}) {
  const totalMinutes = useMemo(() => {
    return series.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
  }, [series]);

  // Encontrar o teto do eixo Y (mínimo de 60 minutos como escala de referência realista)
  const maxMinutes = useMemo(() => {
    const rawMax = Math.max(0, ...series.map(s => Number(s.minutes || 0)));
    return Math.max(60, Math.ceil(rawMax / 30) * 30);
  }, [series]);

  const periodOptions = [
    { value: "week", label: "7 Dias" },
    { value: "month", label: "30 Dias" },
    { value: "year", label: "12 Meses" }
  ];

  return (
    <div className={`a26-chronometer-chart ${className}`} role="region" aria-label="Cronômetro de Estudo Acadêmico">
      <div className="a26-chronometer-chart__top">
        <div>
          <span className="a26-chronometer-chart__eyebrow">Ritmo de Estudo Observado</span>
          <h3 className="a26-chronometer-chart__total">{formatMinutes(totalMinutes)}</h3>
          <span className="a26-chronometer-chart__period-note">
            {totalMinutes > 0 ? "Tempo ativo deduplicado no período selecionado" : "Nenhuma sessão registrada no período selecionado"}
          </span>
        </div>

        {onPeriodChange ? (
          <A26SegmentedControl
            label="Seletor de período temporal"
            value={period}
            onChange={onPeriodChange}
            options={periodOptions}
            className="a26-chronometer-chart__switch"
          />
        ) : null}
      </div>

      <div className="a26-chronometer-chart__bars-container" role="graphics-document" aria-label="Gráfico temporal de estudo">
        {series.map(item => {
          const minutes = Number(item.minutes || 0);
          const heightPercent = maxMinutes > 0 ? Math.min(100, Math.round((minutes / maxMinutes) * 100)) : 0;
          const isZero = minutes === 0;

          return (
            <div
              key={item.key || item.label}
              className={`a26-chronometer-col ${isZero ? "is-zero" : ""}`}
              tabIndex={0}
              aria-label={`${item.label}: ${formatMinutes(minutes)}`}
            >
              <div className="a26-chronometer-col__track">
                <div
                  className="a26-chronometer-col__fill"
                  style={{ height: `${heightPercent}%` }}
                  title={`${item.label}: ${formatMinutes(minutes)}`}
                />
              </div>
              <span className="a26-chronometer-col__label">{item.label}</span>
              <span className="a26-chronometer-col__value">{minutes > 0 ? formatMinutes(minutes) : "0"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
