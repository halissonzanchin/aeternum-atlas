import "./adminDashboardWidgets.css";

export default function AdminAlerts({ occupancyRate, inactiveStudents, lostRevenue, formatCurrency }) {
  const alerts = [];

  if (occupancyRate > 95) {
    alerts.push({
      title: "Licença quase cheia",
      body: `A ocupação chegou a ${occupancyRate.toFixed(1).replace(".", ",")}%. Planeje expansão de capacidade antes do próximo ciclo acadêmico.`,
      tone: "warning"
    });
  }

  if (inactiveStudents > 300) {
    alerts.push({
      title: "Alto número de alunos inativos",
      body: `${inactiveStudents.toLocaleString("pt-BR")} alunos cadastrados não estão ativos no mês. Vale acionar coordenação, professores e comunicação acadêmica.`,
      tone: "danger"
    });
  }

  if (lostRevenue > 20000) {
    alerts.push({
      title: "Alto potencial não monetizado",
      body: `Existe ${formatCurrency(lostRevenue)} de receita mensal potencial ainda não realizada pela diferença entre capacidade contratada e alunos ativos.`,
      tone: "danger"
    });
  }

  if (!alerts.length) {
    return <div className="admin-alerts__empty">Operação estável, sem alertas críticos neste momento.</div>;
  }

  return (
    <div className="admin-alerts">
      {alerts.map(alert => (
        <article key={alert.title} className={`admin-alerts__item admin-alerts__item--${alert.tone}`}>
          <div>
            <h3>{alert.title}</h3>
            <p>{alert.body}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
