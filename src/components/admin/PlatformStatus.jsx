import "./adminDashboardWidgets.css";

export default function PlatformStatus({ status = "online", uptime, downtime, lastIncident }) {
  if (status === "sem dados") {
    return (
      <div className="platform-status">
        <div className="platform-status__top">
          <div>
            <p className="eyebrow">Saúde da plataforma</p>
            <h2>Telemetria operacional sem registros</h2>
          </div>
          <span className="platform-status__pill">Sem dados</span>
        </div>
        <p className="text-textMuted">
          Uptime, downtime e incidentes não foram inferidos sem eventos de telemetria no período.
        </p>
      </div>
    );
  }

  return (
    <div className="platform-status">
      <div className="platform-status__top">
        <div>
          <p className="eyebrow">Saúde da plataforma</p>
          <h2>Status operacional</h2>
        </div>
        <span className="platform-status__pill">{status}</span>
      </div>

      <div className="platform-status__grid">
        <div className="platform-status__metric">
          <span>Uptime</span>
          <strong>{uptime}%</strong>
        </div>
        <div className="platform-status__metric">
          <span>Downtime</span>
          <strong>{downtime} min</strong>
        </div>
        <div className="platform-status__metric">
          <span>Último incidente</span>
          <strong>{lastIncident}</strong>
        </div>
      </div>
    </div>
  );
}
