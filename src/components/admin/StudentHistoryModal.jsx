import Card from "../Card/Card";
import StudentRadarChart from "./StudentRadarChart";
import StudentWeeklyEvolutionChart from "./StudentWeeklyEvolutionChart";
import { performanceMeta } from "./InstitutionStudentsTable";
import "./adminStudents.css";

export default function StudentHistoryModal({
  student,
  history,
  weeklyEvolution,
  radarData,
  onClose,
  onExportHistory,
  onPrintStudent
}) {
  if (!student) return null;

  const meta = performanceMeta(student.performanceScore);

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-label="Histórico completo do aluno">
      <Card className="admin-student-modal student-history-modal">
        <div className="admin-modal-header">
          <div>
            <p className="eyebrow">Histórico completo por aluno</p>
            <h2>{student.name}</h2>
            <p>{student.registration} · {student.email} · {student.semester}</p>
          </div>
          <div className="student-modal-actions">
            <button type="button" onClick={() => onExportHistory(student)}>Exportar histórico CSV</button>
            <button type="button" onClick={() => onPrintStudent(student)}>Imprimir análise</button>
            <button type="button" onClick={onClose}>Fechar</button>
          </div>
        </div>

        <div className="student-history-summary">
          <div><span>Status</span><strong>{student.status}</strong></div>
          <div><span>Último acesso</span><strong>{student.lastAccess || "-"}</strong></div>
          <div><span>Tempo total</span><strong>{student.totalStudyMinutes} min</strong></div>
          <div><span>Sessões</span><strong>{student.totalAccesses}</strong></div>
          <div><span>Modelos estudados</span><strong>{student.studiedModels}</strong></div>
          <div><span>Desempenho</span><strong>{meta.label}</strong></div>
          <div><span>Mais acessado</span><strong>{student.mostViewedContent}</strong></div>
        </div>

        <div className="student-modal-grid mt-5">
          <Card>
            <h3>Evolução semanal</h3>
            <p className="mt-2 text-sm text-textMuted">Acessos, tempo de estudo e modelos concluídos nas últimas semanas.</p>
            <div className="mt-5">
              <StudentWeeklyEvolutionChart data={weeklyEvolution} />
            </div>
          </Card>
          <Card>
            <h3>Radar de desempenho</h3>
            <p className="mt-2 text-sm text-textMuted">Rede individual por frequência, estudo, revisão e interação 3D.</p>
            <div className="mt-4">
              <StudentRadarChart data={radarData} />
            </div>
          </Card>
        </div>

        <Card className="table-card mt-5 p-0">
          <div className="table-scroll">
            <table className="admin-table text-left text-sm">
              <thead>
                <tr>
                  {["Data", "Horário", "Tipo de evento", "Conteúdo/modelo", "Duração", "Dispositivo", "Status"].map(item => <th key={item}>{item}</th>)}
                </tr>
              </thead>
              <tbody>
                {history.map(event => (
                  <tr key={event.id}>
                    <td>{event.date}</td>
                    <td>{event.time}</td>
                    <td>{event.eventType}</td>
                    <td>{event.content}</td>
                    <td>{event.durationMinutes} min</td>
                    <td>{event.device}</td>
                    <td>{event.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Card>
    </div>
  );
}
