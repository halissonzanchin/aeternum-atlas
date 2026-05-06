import "./analytics.css";

export default function RealtimeStatusBadge({ status, lastUpdated }) {
  return (
    <div className={`realtime-status-badge realtime-status-badge--${status}`}>
      {status} · Atualizado às {lastUpdated} · Monitoramento em tempo real
    </div>
  );
}
