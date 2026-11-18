import React from "react";
import { A26Card } from "./A26Primitives";
import LineIcon from "../icons/LineIcon";
import "../../styles/A26MetricTile.css";

export default function A26MetricTile({
  label,
  value = "—",
  unit = "",
  detail,
  trend,
  icon,
  tone = "teal",
  status = "verified",
  statusLabel,
  className = "",
  ariaLabel
}) {
  const isPending = status === "pending";
  const isUnavailable = status === "unavailable";

  return (
    <A26Card
      material="regular"
      tone={tone}
      className={`a26-metric-tile a26-metric-tile--${tone} ${className}`}
      role="region"
      aria-label={ariaLabel || `${label}: ${value} ${unit}`}
    >
      <div className="a26-metric-tile__header">
        <span className="a26-metric-tile__label">{label}</span>
        {icon ? (
          <span className="a26-metric-tile__icon" aria-hidden="true">
            {typeof icon === "string" ? <LineIcon name={icon} /> : icon}
          </span>
        ) : null}
      </div>

      <div className="a26-metric-tile__body">
        <span className="a26-metric-tile__value" tabIndex={0}>
          {value}
          {unit ? <span className="a26-metric-tile__unit"> {unit}</span> : null}
        </span>
      </div>

      <div className="a26-metric-tile__footer">
        {detail ? <span className="a26-metric-tile__detail">{detail}</span> : null}
        {statusLabel ? (
          <span
            className={`a26-metric-tile__badge a26-metric-tile__badge--${status}`}
            title={statusLabel}
          >
            {statusLabel}
          </span>
        ) : null}
        {trend ? <span className="a26-metric-tile__trend">{trend}</span> : null}
      </div>
    </A26Card>
  );
}
