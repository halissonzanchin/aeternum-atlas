import "./adminDashboardWidgets.css";

export default function LicenseBar({ registeredStudents, contractedCapacity, occupancyRate, formatNumber }) {
  const available = Math.max(contractedCapacity - registeredStudents, 0);

  return (
    <div className="license-bar">
      <div className="license-bar__meta">
        <span>Ocupação da licença</span>
        <strong>{occupancyRate.toFixed(1).replace(".", ",")}%</strong>
      </div>

      <div className="license-bar__track" aria-label="Ocupação da licença">
        <div className="license-bar__fill" style={{ width: `${Math.min(occupancyRate, 100)}%` }} />
      </div>

      <div className="license-bar__legend">
        <span>Usado: <b>{formatNumber(registeredStudents)}</b></span>
        <span>Disponível: <b>{formatNumber(available)}</b></span>
        <span>Capacidade: <b>{formatNumber(contractedCapacity)}</b></span>
      </div>
    </div>
  );
}
