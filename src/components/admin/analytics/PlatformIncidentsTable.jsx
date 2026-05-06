import "./analytics.css";

function severityClass(severity) {
  return severity.toLowerCase().replace("í", "i").replace("é", "e");
}

export default function PlatformIncidentsTable({ incidents, formatNumber }) {
  return (
    <div className="table-scroll">
      <table className="admin-table text-left text-sm">
        <thead>
          <tr>
            {["Data", "Horário", "Módulo afetado", "Tipo de erro", "Duração", "Usuários afetados", "Status", "Severidade", "Observação"].map(item => <th key={item}>{item}</th>)}
          </tr>
        </thead>
        <tbody>
          {incidents.map(incident => (
            <tr key={incident.id}>
              <td>{incident.date}</td>
              <td>{incident.time}</td>
              <td>{incident.module}</td>
              <td>{incident.errorType}</td>
              <td>{incident.durationMinutes} min</td>
              <td>{formatNumber(incident.affectedUsers)}</td>
              <td>{incident.status}</td>
              <td><span className={`analytics-severity-pill analytics-severity-pill--${severityClass(incident.severity)}`}>{incident.severity}</span></td>
              <td>{incident.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
