import "./adminStudents.css";

export default function StudentWeeklyEvolutionChart({ data }) {
  const maxAccesses = Math.max(...data.map(item => item.accesses), 1);
  const maxMinutes = Math.max(...data.map(item => item.studyMinutes), 1);

  return (
    <div className="student-weekly-chart">
      {data.map(item => (
        <div key={item.week} className="student-weekly-row">
          <strong>{item.week}</strong>
          <div className="student-weekly-bars">
            <div className="student-weekly-track student-weekly-track--accesses">
              <div style={{ width: `${(item.accesses / maxAccesses) * 100}%` }} />
            </div>
            <div className="student-weekly-track student-weekly-track--study">
              <div style={{ width: `${(item.studyMinutes / maxMinutes) * 100}%` }} />
            </div>
          </div>
          <span>{item.accesses} acessos · {item.studyMinutes} min · {item.completedModels} modelos</span>
        </div>
      ))}
    </div>
  );
}
