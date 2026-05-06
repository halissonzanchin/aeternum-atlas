import { useMemo, useState } from "react";
import "./adminStudents.css";

function normalize(value) {
  return String(value || "").toLowerCase();
}

export function performanceMeta(score) {
  if (score >= 80) return { label: "Alto desempenho", tone: "high" };
  if (score >= 60) return { label: "Bom desempenho", tone: "medium" };
  if (score >= 40) return { label: "Baixo engajamento", tone: "low" };
  return { label: "Risco acadêmico", tone: "risk" };
}

function engagementMatches(student, engagement) {
  if (engagement === "all") return true;
  const score = student.performanceScore;
  if (engagement === "alto") return score >= 80;
  if (engagement === "medio") return score >= 60 && score < 80;
  if (engagement === "baixo") return score >= 40 && score < 60;
  if (engagement === "risco") return score < 40;
  return true;
}

export default function InstitutionStudentsTable({
  students,
  formatNumber,
  onOpenHistory,
  onOpenPerformance,
  onExportStudent,
  onToggleStatus
}) {
  const [filters, setFilters] = useState({
    query: "",
    email: "",
    registration: "",
    status: "all",
    semester: "all",
    course: "all",
    createdAfter: "",
    lastAccessAfter: "",
    engagement: "all"
  });

  const semesters = useMemo(() => Array.from(new Set(students.map(student => student.semester))).sort(), [students]);
  const courses = useMemo(() => Array.from(new Set(students.map(student => student.course))).sort(), [students]);

  const filteredStudents = useMemo(() => students.filter(student => {
    const query = normalize(filters.query);
    const matchesQuery = !query || normalize(`${student.name} ${student.email} ${student.registration}`).includes(query);
    const matchesEmail = !filters.email || normalize(student.email).includes(normalize(filters.email));
    const matchesRegistration = !filters.registration || normalize(student.registration).includes(normalize(filters.registration));
    const matchesStatus = filters.status === "all" || student.status === filters.status;
    const matchesSemester = filters.semester === "all" || student.semester === filters.semester;
    const matchesCourse = filters.course === "all" || student.course === filters.course;
    const matchesCreated = !filters.createdAfter || student.createdAt >= filters.createdAfter;
    const matchesLastAccess = !filters.lastAccessAfter || (student.lastAccess && student.lastAccess.slice(0, 10) >= filters.lastAccessAfter);
    return matchesQuery && matchesEmail && matchesRegistration && matchesStatus && matchesSemester && matchesCourse && matchesCreated && matchesLastAccess && engagementMatches(student, filters.engagement);
  }), [filters, students]);

  function updateFilter(event) {
    setFilters(prev => ({ ...prev, [event.target.name]: event.target.value }));
  }

  return (
    <div className="student-filter-panel">
      <div className="student-filter-grid">
        <input name="query" value={filters.query} onChange={updateFilter} placeholder="Buscar por nome" />
        <input name="email" value={filters.email} onChange={updateFilter} placeholder="Buscar por e-mail" />
        <input name="registration" value={filters.registration} onChange={updateFilter} placeholder="Matrícula/R.A." />
        <select name="status" value={filters.status} onChange={updateFilter} aria-label="Status">
          <option value="all">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="pendente">Pendente</option>
          <option value="bloqueado">Bloqueado</option>
        </select>
        <select name="semester" value={filters.semester} onChange={updateFilter} aria-label="Semestre">
          <option value="all">Todos os semestres</option>
          {semesters.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <select name="course" value={filters.course} onChange={updateFilter} aria-label="Curso">
          <option value="all">Todos os cursos</option>
          {courses.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <input name="createdAfter" value={filters.createdAfter} onChange={updateFilter} type="date" aria-label="Período de cadastro" />
        <input name="lastAccessAfter" value={filters.lastAccessAfter} onChange={updateFilter} type="date" aria-label="Último acesso após" />
        <select name="engagement" value={filters.engagement} onChange={updateFilter} aria-label="Engajamento">
          <option value="all">Todos os engajamentos</option>
          <option value="alto">Alto desempenho</option>
          <option value="medio">Bom desempenho</option>
          <option value="baixo">Baixo engajamento</option>
          <option value="risco">Risco acadêmico</option>
        </select>
      </div>

      <div className="student-table-meta">
        {formatNumber(filteredStudents.length)} alunos encontrados na amostra administrativa.
      </div>

      <div className="table-scroll">
        <table className="admin-table text-left text-sm">
          <thead>
            <tr>
              {[
                "Nome",
                "E-mail",
                "Matrícula/R.A.",
                "Curso",
                "Ano/Semestre",
                "Status",
                "Data de cadastro",
                "Último acesso",
                "Total de acessos",
                "Tempo total de estudo",
                "Conteúdo mais acessado",
                "Modelos estudados",
                "Performance geral",
                "Ações"
              ].map(item => <th key={item}>{item}</th>)}
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => {
              const meta = performanceMeta(student.performanceScore);
              return (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.registration}</td>
                  <td>{student.course}</td>
                  <td>{student.semester}</td>
                  <td><span className={`student-status-badge student-status-badge--${student.status}`}>{student.status}</span></td>
                  <td>{student.createdAt}</td>
                  <td>{student.lastAccess || "-"}</td>
                  <td>{formatNumber(student.totalAccesses)}</td>
                  <td>{formatNumber(student.totalStudyMinutes)} min</td>
                  <td>{student.mostViewedContent}</td>
                  <td>{formatNumber(student.studiedModels)}</td>
                  <td>
                    <div className="student-performance-cell">
                      <span className={`student-performance-badge student-performance-badge--${meta.tone}`}>{meta.label}</span>
                      <div className="student-performance-track"><div style={{ width: `${student.performanceScore}%` }} /></div>
                      <small>{student.performanceScore}/100</small>
                    </div>
                  </td>
                  <td>
                    <div className="student-row-actions">
                      <button type="button" onClick={() => onOpenHistory(student)}>Ver histórico</button>
                      <button type="button" onClick={() => onOpenPerformance(student)}>Ver desempenho</button>
                      <button type="button" onClick={() => onToggleStatus(student)}>
                        {student.status === "bloqueado" ? "Desbloquear" : "Bloquear"}
                      </button>
                      <button type="button" onClick={() => onExportStudent(student)}>Exportar dados</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
