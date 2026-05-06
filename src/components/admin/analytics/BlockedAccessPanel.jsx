import "./analytics.css";

export default function BlockedAccessPanel({ logs }) {
  return (
    <div>
      <div className="analytics-card-heading">
        <h2>Controle de acessos e bloqueios</h2>
        <span>Tentativas bloqueadas, permissões negadas e sessões de risco</span>
      </div>
      <div className="table-scroll">
        <table className="admin-table text-left text-sm">
          <thead>
            <tr>
              {["Data", "Usuário", "E-mail", "Motivo", "IP/dispositivo", "Status"].map(item => <th key={item}>{item}</th>)}
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>{log.date}</td>
                <td>{log.user}</td>
                <td>{log.email}</td>
                <td>{log.reason}</td>
                <td>{log.device}</td>
                <td>{log.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
