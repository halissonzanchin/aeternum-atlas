// Gera 700 alunos distribuídos estaticamente para a Demo
export const upeStudentsMetrics = {
  total: 700,
  active: 650,
  inactive: 15,
  highPerformance: 200,
  lowPerformance: 150,
  atRisk: 47,
  recovered: 31
};

const firstNames = ["Ana", "Carlos", "João", "Mariana", "Lucas", "Beatriz", "Gabriel", "Julia", "Pedro", "Leticia", "Rafael", "Camila"];
const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Almeida", "Costa", "Gomes", "Martins"];

export function generateUpeStudents() {
  const students = [];
  for (let i = 1; i <= 700; i++) {
    const fName = firstNames[i % firstNames.length];
    const lName = lastNames[i % lastNames.length];
    let status = "active";
    if (i <= 47) status = "atRisk";
    else if (i <= 62) status = "inactive";
    else if (i <= 212) status = "lowPerformance";
    else if (i <= 412) status = "highPerformance";
    
    students.push({
      id: `upe-std-${i}`,
      name: `${fName} ${lName}`,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@upe.edu.py`,
      status,
      lastAccess: status === "inactive" ? "10+ days ago" : "today"
    });
  }
  return students;
}

export const upeRiskStudentsList = [
  { id: '1', name: "João Pedro Silva", class: "Turma B", reason: "Engajamento Zero", lastAccess: "10 dias atrás", action: "Enviar Alerta" },
  { id: '2', name: "Mariana Costa", class: "Turma D", reason: "Nota < 40%", lastAccess: "Ontem", action: "Recomendar Trilha" },
  { id: '3', name: "Lucas Almeida", class: "Turma B", reason: "Múltiplas Faltas", lastAccess: "7 dias atrás", action: "Contatar" },
  { id: '4', name: "Beatriz Souza", class: "Turma C", reason: "Nota < 40%", lastAccess: "Hoje", action: "Recomendar Aula 3D" },
  { id: '5', name: "Carlos Eduardo", class: "Turma A", reason: "Queda de Acesso", lastAccess: "5 dias atrás", action: "Notificar" }
];
