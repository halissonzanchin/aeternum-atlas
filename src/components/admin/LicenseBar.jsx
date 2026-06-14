import "./adminDashboardWidgets.css";

export default function LicenseBar({ registeredStudents, contractedCapacity, occupancyRate, formatNumber }) {
  const safeRegisteredStudents = Number(registeredStudents) || 0;
  const safeContractedCapacity = Number(contractedCapacity) || 0;
  const safeOccupancyRate = Number.isFinite(Number(occupancyRate)) ? Number(occupancyRate) : 0;
  const available = Math.max(safeContractedCapacity - safeRegisteredStudents, 0);

  return (
    <div className="license-bar">
      <div className="license-bar__meta">
        <span>Ocupação da licença</span>
        <strong>{safeOccupancyRate.toFixed(1).replace(".", ",")}%</strong>
      </div>

      <div className="license-bar__track" aria-label="Ocupação da licença">
        <div className="license-bar__fill" style={{ width: `${Math.min(Math.max(safeOccupancyRate, 0), 100)}%` }} />
      </div>

      <div className="license-bar__legend">
        <span>Usado: <b>{formatNumber(safeRegisteredStudents)}</b></span>
        <span>Disponível: <b>{formatNumber(available)}</b></span>
        <span>Capacidade: <b>{formatNumber(safeContractedCapacity)}</b></span>
      </div>
    </div>
  );
}
