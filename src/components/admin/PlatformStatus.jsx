import "./adminDashboardWidgets.css";

export default function PlatformStatus({ status = "online", uptime, downtime, lastIncident }) {
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
