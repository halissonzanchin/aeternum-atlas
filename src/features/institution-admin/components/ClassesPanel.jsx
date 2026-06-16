import { useState } from "react";
import { useAcademicClasses } from "../hooks/useAcademicClasses";
import { useLanguage } from "../../../context/LanguageContext";
import Card from "../../../components/Card/Card";
import AdminTitle from "./AdminTitle";

export default function ClassesPanel() {
  const { language, t } = useLanguage();
  const { classes, loading, addClass, addStudent, removeStudent } = useAcademicClasses();
  const [newClassName, setNewClassName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    await addClass({ name: newClassName.trim() });
    setNewClassName("");
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!selectedClass || !studentId.trim()) return;
    await addStudent(selectedClass, studentId.trim());
    setStudentId("");
  };

  const handleRemoveStudent = async (classId, studentToRemove) => {
    await removeStudent(classId, studentToRemove);
  };

  return (
    <>
      <AdminTitle
        title="Gestão de Turmas"
        text="Administre as turmas acadêmicas da instituição."
      />

      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        {/* Form Create Class */}
        <Card>
          <h2 className="text-xl font-bold text-clinicalWhite mb-4">Criar Nova Turma</h2>
          <form onSubmit={handleCreateClass} className="flex gap-2">
            <input
              type="text"
              placeholder="Nome da Turma"
              className="flex-1 input-field bg-slate-800 text-white rounded p-2"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
            <button type="submit" className="btn btn-primary bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded">
              Criar
            </button>
          </form>
        </Card>

        {/* Form Add Student */}
        <Card>
          <h2 className="text-xl font-bold text-clinicalWhite mb-4">Adicionar Aluno à Turma</h2>
          <form onSubmit={handleAddStudent} className="flex gap-2">
            <select
              className="flex-1 input-field bg-slate-800 text-white rounded p-2"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Selecione a Turma</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="ID do Aluno (UUID)"
              className="flex-1 input-field bg-slate-800 text-white rounded p-2"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
            <button type="submit" className="btn btn-primary bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded">
              Adicionar
            </button>
          </form>
        </Card>
      </div>

      {/* List Classes */}
      <Card className="mt-6">
        <h2 className="text-xl font-bold text-clinicalWhite mb-4">Turmas Ativas</h2>
        {loading ? (
          <p className="text-slate-400">Carregando turmas...</p>
        ) : classes.length === 0 ? (
          <p className="text-slate-400">Nenhuma turma cadastrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-slate-300">
                  <th className="p-3 font-semibold">Nome da Turma</th>
                  <th className="p-3 font-semibold">Professor</th>
                  <th className="p-3 font-semibold">Alunos Matriculados</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(cls => (
                  <tr key={cls.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                    <td className="p-3 text-white">{cls.name}</td>
                    <td className="p-3 text-slate-300">{cls.teacherName}</td>
                    <td className="p-3 text-slate-300">{cls.studentCount}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${cls.status === 'active' ? 'bg-teal-900/50 text-teal-400' : 'bg-slate-700 text-slate-300'}`}>
                        {cls.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
