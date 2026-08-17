import { useEffect, useState, useMemo } from "react";
import Card from "../../components/Card/Card";
import LineIcon from "../../components/icons/LineIcon";
import {
  A26Button,
  A26Card,
  A26EmptyState,
  A26LoadingState,
  A26Modal,
  A26SegmentedControl,
  A26Surface,
  A26Toolbar
} from "../../components/aeternum-26";
import { useLanguage } from "../../context/LanguageContext";
import { loadTeacherDashboardData } from "../../services/teacher/teacherDashboardService";
import {
  createTeacherClass,
  updateTeacherClass,
  deleteTeacherClass,
  enrollStudentInClass,
  removeStudentFromClass,
  createTeacherStudyGuide,
  deleteTeacherStudyGuide,
  createTeacherAnatomicalNote,
  updateTeacherProfile
} from "../../services/teacher/teacherAcademicService";
import { translateModelSummary } from "../../utils/modelI18n";
import "../../styles/A26TeacherExperience.css";

const sectionTitles = {
  dashboard: ["teacher.dashboard.title", "teacher.dashboard.subtitle"],
  models: ["teacher.models.title", "teacher.models.subtitle"],
  classes: ["teacher.classes.title", "teacher.classes.subtitle"],
  students: ["teacher.students.title", "teacher.students.subtitle"],
  "study-guides": ["teacher.studyGuides.title", "teacher.studyGuides.subtitle"],
  lessons: ["teacher.lessons.title", "teacher.lessons.subtitle"],
  "anatomical-notes": ["teacher.notes.title", "teacher.notes.subtitle"],
  reports: ["teacher.reports.title", "teacher.reports.subtitle"],
  profile: ["teacher.profile.title", "teacher.profile.subtitle"]
};

function TeacherPageShell({ section, profile, onEditProfile, children }) {
  const { t } = useLanguage();
  const [titleKey, subtitleKey] = sectionTitles[section] || sectionTitles.dashboard;
  const profileName = profile?.name || t("teacher.emptyStates.profileTitle", { defaultValue: "Professor Aeternum" });
  const department = profile?.department || t("teacher.emptyStates.profileDepartment", { defaultValue: "Departamento de Anatomia & Morfologia" });
  const academicTitle = profile?.academicTitle || "Professor Adjunto";
  const institutionLabel = [profile?.institution, profile?.campus].filter(Boolean).join(" · ") || "Aeternum Atlas Oficial";

  return (
    <section
      className="teacher-page fade-in-up"
      data-testid="a26-teacher-experience"
      data-a26-section={section}
      data-a26-source="tenant-observed"
    >
      <div className="teacher-hero">
        <div className="teacher-hero-content">
          <p className="teacher-hero-kicker">{t("teacher.eyebrow", { defaultValue: "Área do Professor · Aeternum 26.1" })}</p>
          <h1 className="teacher-hero-title">{t(titleKey, { defaultValue: "Painel do Professor" })}</h1>
          <p className="teacher-hero-subtitle">{t(subtitleKey, { defaultValue: "Acompanhe turmas, modelos 3D e desempenho acadêmico em tempo real." })}</p>
        </div>
        <div className="teacher-profile-chip" onClick={onEditProfile} role="button" tabIndex={0} style={{ cursor: "pointer" }}>
          <span className="teacher-profile-chip-dept">{department}</span>
          <strong className="teacher-profile-chip-name">{profileName}</strong>
          <small className="teacher-profile-chip-inst">{academicTitle} · {institutionLabel}</small>
        </div>
      </div>
      {children}
    </section>
  );
}

function TeacherKpiCard({ icon, label, value, tone = "teal" }) {
  return (
    <article className={`teacher-kpi-card ${tone === "gold" ? "teacher-kpi-card--gold" : ""}`}>
      <div className="teacher-kpi-icon">
        <LineIcon name={icon} />
      </div>
      <div className="teacher-kpi-data">
        <strong className="teacher-kpi-value">{value}</strong>
        <p className="teacher-kpi-label">{label}</p>
      </div>
    </article>
  );
}

function modelRouteId(model) {
  return model?.slug || model?.id;
}

function ProgressBar({ value }) {
  return (
    <div className="teacher-progress-track">
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function MiniBarChart({ data }) {
  const max = Math.max(...data.map(item => item.value), 1);
  return (
    <div className="teacher-mini-chart">
      {data.map(item => (
        <div key={item.label} className="teacher-mini-chart-row">
          <span>{item.label}</span>
          <div><strong style={{ width: `${(item.value / max) * 100}%` }} /></div>
          <small>{item.value}</small>
        </div>
      ))}
    </div>
  );
}

function TeacherEmptyState({ title, text, actionLabel, onAction }) {
  return (
    <A26EmptyState
      title={title}
      text={text}
      action={actionLabel && onAction ? (
        <A26Button variant="liquid" onClick={onAction}>{actionLabel}</A26Button>
      ) : null}
    />
  );
}

function downloadTeacherCsv(filename, rows) {
  const csv = rows
    .map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function defaultClassForm() {
  return {
    name: "",
    course: "Medicina",
    semester: "1º Semestre",
    status: "active",
    notes: ""
  };
}

function TeacherClassModal({ open, onClose, onSubmit, saving, error, initialData }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(defaultClassForm);

  useEffect(() => {
    if (open) {
      setForm(initialData || defaultClassForm());
    }
  }, [open, initialData]);

  if (!open) return null;

  function update(name, value) {
    setForm(previous => ({ ...previous, [name]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <A26Modal
      open={open}
      title={initialData ? t("teacher.classes.editTitle", { defaultValue: "Editar Turma" }) : t("teacher.classes.createTitle", { defaultValue: "Criar Nova Turma" })}
      description={t("teacher.classes.formEyebrow", { defaultValue: "Configure os dados acadêmicos da turma" })}
      closeLabel={t("actions.close", { defaultValue: "Fechar" })}
      onClose={onClose}
      actions={(
        <>
          <A26Button variant="ghost" onClick={onClose}>{t("actions.cancel", { defaultValue: "Cancelar" })}</A26Button>
          <A26Button variant="primary" type="submit" form="teacher-class-form" loading={saving}>
            {t("actions.save", { defaultValue: "Salvar" })}
          </A26Button>
        </>
      )}
    >
      <form id="teacher-class-form" className="a26-teacher-form space-y-4" onSubmit={submit}>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-1">
              {t("teacher.classes.form.name", { defaultValue: "Nome da Turma" })}
            </span>
            <input
              required
              className="w-full bg-black/40 border border-teal-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
              value={form.name}
              onChange={event => update("name", event.target.value)}
              placeholder="ex: Anatomia Humana I — Turma Medicina A"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-1">
                {t("teacher.classes.form.course", { defaultValue: "Curso" })}
              </span>
              <input
                className="w-full bg-black/40 border border-teal-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
                value={form.course}
                onChange={event => update("course", event.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-1">
                {t("teacher.classes.form.semester", { defaultValue: "Semestre / Período" })}
              </span>
              <input
                className="w-full bg-black/40 border border-teal-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
                value={form.semester}
                onChange={event => update("semester", event.target.value)}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-1">
              {t("common.status", { defaultValue: "Status" })}
            </span>
            <select
              className="w-full bg-black/40 border border-teal-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
              value={form.status}
              onChange={event => update("status", event.target.value)}
            >
              <option value="active">{t("teacher.statuses.active", { defaultValue: "Ativo" })}</option>
              <option value="inactive">{t("teacher.statuses.inactive", { defaultValue: "Inativo" })}</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-1">
              {t("teacher.classes.form.notes", { defaultValue: "Observações Pedagógicas" })}
            </span>
            <textarea
              rows={3}
              className="w-full bg-black/40 border border-teal-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
              value={form.notes}
              onChange={event => update("notes", event.target.value)}
              placeholder="Notas gerais sobre a ementa ou foco pedagógico..."
            />
          </label>
        </div>

        {error ? <p className="text-rose-400 text-xs mt-2">{error}</p> : null}
      </form>
    </A26Modal>
  );
}

function TeacherManageStudentsModal({ open, classItem, allStudents = [], onClose, onEnroll, onRemove, loading }) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");

  if (!open || !classItem) return null;

  const enrolledStudentIds = new Set((classItem.studentList || []).map(s => s.id));

  const filteredStudents = allStudents.filter(s => {
    const term = searchTerm.toLowerCase();
    return s.name?.toLowerCase().includes(term) || s.email?.toLowerCase().includes(term);
  });

  return (
    <A26Modal
      open={open}
      title={`${t("teacher.classes.manageStudentsTitle", { defaultValue: "Alunos da Turma" })}: ${classItem.name}`}
      description={t("teacher.classes.manageStudentsDesc", { defaultValue: "Vincule ou desvincule estudantes matriculados nesta turma." })}
      closeLabel={t("actions.close", { defaultValue: "Concluir" })}
      onClose={onClose}
    >
      <div className="space-y-4">
        <input
          type="text"
          className="w-full bg-black/40 border border-teal-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
          placeholder={t("teacher.students.searchPlaceholder", { defaultValue: "Buscar aluno por nome ou e-mail..." })}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        <div className="teacher-enrollment-list">
          {filteredStudents.length ? (
            filteredStudents.map(student => {
              const isEnrolled = enrolledStudentIds.has(student.id);
              return (
                <div key={student.id} className={`teacher-enrollment-item ${isEnrolled ? "is-enrolled" : ""}`}>
                  <div>
                    <strong className="text-white block text-sm">{student.name}</strong>
                    <span className="text-xs text-textMuted">{student.email} · {student.registration}</span>
                  </div>
                  {isEnrolled ? (
                    <A26Button
                      variant="danger"
                      size="sm"
                      onClick={() => onRemove(classItem.id, student.id)}
                      loading={loading}
                    >
                      {t("teacher.classes.removeStudent", { defaultValue: "Desvincular" })}
                    </A26Button>
                  ) : (
                    <A26Button
                      variant="liquid"
                      size="sm"
                      onClick={() => onEnroll(classItem.id, student.id)}
                      loading={loading}
                    >
                      + {t("teacher.classes.enrollStudent", { defaultValue: "Vincular" })}
                    </A26Button>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-xs text-textMuted text-center py-4">{t("teacher.students.emptySearch", { defaultValue: "Nenhum aluno encontrado." })}</p>
          )}
        </div>
      </div>
    </A26Modal>
  );
}

function TeacherStudentDossierModal({ open, student, onClose }) {
  const { t } = useLanguage();
  if (!open || !student) return null;

  return (
    <A26Modal
      open={open}
      title={student.name}
      description={t("teacher.students.dossierTitle", { defaultValue: "Dossiê Pedagógico e Histórico de Aprendizagem" })}
      closeLabel={t("actions.close", { defaultValue: "Fechar" })}
      onClose={onClose}
    >
      <div className="teacher-student-dossier">
        <div className="teacher-dossier-header">
          <div className="teacher-dossier-avatar">
            {student.name?.charAt(0) || "E"}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{student.name}</h3>
            <p className="text-xs text-textMuted">{student.email} · {student.registration}</p>
            <span className="text-[11px] text-teal-400 font-semibold">{student.className}</span>
          </div>
        </div>

        <div className="teacher-dossier-grid">
          <div className="teacher-dossier-item">
            <strong>{student.totalStudyTime}</strong>
            <span>{t("teacher.students.timeStudied", { defaultValue: "Tempo Total" })}</span>
          </div>
          <div className="teacher-dossier-item">
            <strong>{student.progress}%</strong>
            <span>{t("teacher.students.scoreScore", { defaultValue: "Progresso" })}</span>
          </div>
          <div className="teacher-dossier-item">
            <strong>{student.accessedModels}</strong>
            <span>{t("teacher.students.modelsViewed", { defaultValue: "Modelos 3D" })}</span>
          </div>
          <div className="teacher-dossier-item">
            <strong>{student.sessionCount || 1}</strong>
            <span>{t("teacher.students.sessionsCount", { defaultValue: "Sessões Ativas" })}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-agedGold">
            {t("teacher.students.studiedModelsList", { defaultValue: "Modelos Anatômicos Estudados" })}
          </h4>
          <ul className="space-y-1.5 text-xs text-textMuted bg-black/30 p-3 rounded-lg border border-teal-500/10">
            {student.topModels?.length ? (
              student.topModels.map(m => (
                <li key={m} className="flex items-center gap-2 text-white">
                  <span className="text-teal-400">✦</span> {m}
                </li>
              ))
            ) : (
              <li className="text-textMuted">Corte Sagital do Crânio Humano — Modelo Superficial 3D</li>
            )}
          </ul>
        </div>
      </div>
    </A26Modal>
  );
}

function TeacherStudyGuideModal({ open, classes = [], models = [], onClose, onSubmit, saving, error }) {
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedModels, setSelectedModels] = useState([]);
  const [objectives, setObjectives] = useState("");

  if (!open) return null;

  function toggleModel(id) {
    setSelectedModels(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function submit(e) {
    e.preventDefault();
    onSubmit({
      title,
      description,
      classId: classId || null,
      dueDate: dueDate || null,
      modelIds: selectedModels,
      objectives
    });
  }

  return (
    <A26Modal
      open={open}
      title={t("teacher.studyGuides.createTitle", { defaultValue: "Criar Roteiro de Estudo 3D" })}
      description={t("teacher.studyGuides.formEyebrow", { defaultValue: "Direcione atividades guiadas com modelos interativos" })}
      closeLabel={t("actions.close", { defaultValue: "Fechar" })}
      onClose={onClose}
      actions={(
        <>
          <A26Button variant="ghost" onClick={onClose}>{t("actions.cancel", { defaultValue: "Cancelar" })}</A26Button>
          <A26Button variant="primary" type="submit" form="teacher-guide-form" loading={saving}>
            {t("actions.save", { defaultValue: "Publicar Roteiro" })}
          </A26Button>
        </>
      )}
    >
      <form id="teacher-guide-form" className="space-y-3" onSubmit={submit}>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-1">Título do Roteiro</span>
          <input
            required
            className="w-full bg-black/40 border border-teal-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="ex: Identificação dos Forames Cranianos e Meninges"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-1">Turma Destinatária</span>
            <select
              className="w-full bg-black/40 border border-teal-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
              value={classId}
              onChange={e => setClassId(e.target.value)}
            >
              <option value="">Todas as Turmas</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-1">Data Limite</span>
            <input
              type="date"
              className="w-full bg-black/40 border border-teal-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-1">Modelos 3D Vinculados</span>
          <div className="space-y-1 max-h-32 overflow-y-auto p-2 bg-black/30 rounded-lg border border-teal-500/20">
            {models.map(m => (
              <label key={m.id} className="flex items-center gap-2 text-xs text-white cursor-pointer hover:bg-white/5 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedModels.includes(m.id || m.slug)}
                  onChange={() => toggleModel(m.id || m.slug)}
                />
                <span>{m.title}</span>
              </label>
            ))}
          </div>
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-1">Instruções e Objetivos</span>
          <textarea
            rows={3}
            className="w-full bg-black/40 border border-teal-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descreva as orientações práticas para os alunos..."
          />
        </label>

        {error ? <p className="text-rose-400 text-xs mt-2">{error}</p> : null}
      </form>
    </A26Modal>
  );
}

function TeacherProfileModal({ open, profile, onClose, onSave, saving }) {
  const { t } = useLanguage();
  const [department, setDepartment] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [academicTitle, setAcademicTitle] = useState("");

  useEffect(() => {
    if (profile && open) {
      setDepartment(profile.department || "Departamento de Morfologia e Anatomia Humana");
      setSpecialization(profile.specialization || "Anatomia Topográfica e Neuroanatomia");
      setAcademicTitle(profile.academicTitle || "Professor Adjunto");
    }
  }, [profile, open]);

  if (!open) return null;

  function submit(e) {
    e.preventDefault();
    onSave({ department, specialization, academicTitle });
  }

  return (
    <A26Modal
      open={open}
      title={t("teacher.profile.editTitle", { defaultValue: "Editar Perfil Docente" })}
      description={t("teacher.profile.editDesc", { defaultValue: "Atualize sua titulação e departamento acadêmico" })}
      closeLabel={t("actions.close", { defaultValue: "Fechar" })}
      onClose={onClose}
      actions={(
        <>
          <A26Button variant="ghost" onClick={onClose}>{t("actions.cancel", { defaultValue: "Cancelar" })}</A26Button>
          <A26Button variant="primary" type="submit" form="teacher-prof-form" loading={saving}>
            {t("actions.save", { defaultValue: "Salvar Perfil" })}
          </A26Button>
        </>
      )}
    >
      <form id="teacher-prof-form" className="space-y-3" onSubmit={submit}>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-1">Departamento</span>
          <input
            required
            className="w-full bg-black/40 border border-teal-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
            value={department}
            onChange={e => setDepartment(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-1">Especialidade / Linha de Pesquisa</span>
          <input
            required
            className="w-full bg-black/40 border border-teal-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
            value={specialization}
            onChange={e => setSpecialization(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-agedGold font-semibold block mb-1">Titulação Acadêmica</span>
          <input
            required
            className="w-full bg-black/40 border border-teal-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
            value={academicTitle}
            onChange={e => setAcademicTitle(e.target.value)}
          />
        </label>
      </form>
    </A26Modal>
  );
}

export default function Teacher({ section = "dashboard", user, onNavigate }) {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Modals & Action States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isManageStudentsOpen, setIsManageStudentsOpen] = useState(false);
  const [activeClassForStudents, setActiveClassForStudents] = useState(null);
  const [selectedStudentDossier, setSelectedStudentDossier] = useState(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [actionError, setActionError] = useState("");

  // Filters
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");

  async function loadData() {
    setLoading(true);
    setErrorMessage("");
    try {
      const payload = await loadTeacherDashboardData(user);
      setData(payload);
    } catch (err) {
      console.error("Erro ao carregar painel docente:", err);
      setErrorMessage(err?.message || "Erro ao carregar dados do professor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  async function handleCreateClass(form) {
    setSavingAction(true);
    setActionError("");
    try {
      await createTeacherClass(user, form);
      setIsClassModalOpen(false);
      await loadData();
    } catch (err) {
      setActionError(err?.message || "Não foi possível criar a turma.");
    } finally {
      setSavingAction(false);
    }
  }

  async function handleDeleteClass(classId) {
    if (!window.confirm("Deseja realmente remover esta turma?")) return;
    try {
      await deleteTeacherClass(user, classId);
      await loadData();
    } catch (err) {
      alert(err?.message || "Erro ao excluir turma.");
    }
  }

  async function handleEnrollStudent(classId, studentId) {
    setSavingAction(true);
    try {
      await enrollStudentInClass(user, { classId, studentId });
      const updated = await loadTeacherDashboardData(user);
      setData(updated);
      const updatedClass = updated.classes.find(c => c.id === classId);
      setActiveClassForStudents(updatedClass || null);
    } catch (err) {
      alert(err?.message || "Erro ao matricular aluno.");
    } finally {
      setSavingAction(false);
    }
  }

  async function handleRemoveStudent(classId, studentId) {
    setSavingAction(true);
    try {
      await removeStudentFromClass(user, { classId, studentId });
      const updated = await loadTeacherDashboardData(user);
      setData(updated);
      const updatedClass = updated.classes.find(c => c.id === classId);
      setActiveClassForStudents(updatedClass || null);
    } catch (err) {
      alert(err?.message || "Erro ao desvincular aluno.");
    } finally {
      setSavingAction(false);
    }
  }

  async function handleCreateStudyGuide(form) {
    setSavingAction(true);
    setActionError("");
    try {
      await createTeacherStudyGuide(user, form);
      setIsGuideModalOpen(false);
      await loadData();
    } catch (err) {
      setActionError(err?.message || "Não foi possível criar o roteiro.");
    } finally {
      setSavingAction(false);
    }
  }

  async function handleDeleteStudyGuide(guideId) {
    if (!window.confirm("Deseja excluir este roteiro de estudo?")) return;
    try {
      await deleteTeacherStudyGuide(user, guideId);
      await loadData();
    } catch (err) {
      alert(err?.message || "Erro ao excluir roteiro.");
    }
  }

  async function handleSaveProfile(payload) {
    setSavingAction(true);
    try {
      await updateTeacherProfile(user, payload);
      setIsProfileModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err?.message || "Erro ao salvar perfil.");
    } finally {
      setSavingAction(false);
    }
  }

  function handleExportStudentsCsv() {
    if (!data?.students?.length) return;
    const rows = [
      ["Nome", "Matricula", "Turma", "Tempo de Estudo (min)", "Modelos Acessados", "Progresso (%)", "Status", "Ultimo Acesso"],
      ...data.students.map(s => [
        s.name,
        s.registration,
        s.className,
        s.totalStudyMinutes,
        s.accessedModels,
        s.progress,
        s.status,
        s.lastAccess
      ])
    ];
    downloadTeacherCsv("relatorio-estudantes-aeternum.csv", rows);
  }

  const filteredStudents = useMemo(() => {
    if (!data?.students) return [];
    return data.students.filter(s => {
      const matchSearch = s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.registration?.toLowerCase().includes(studentSearch.toLowerCase());
      const matchClass = selectedClassFilter === "all" || s.className === selectedClassFilter ||
        s.enrolledClasses?.some(c => c.classId === selectedClassFilter || c.className === selectedClassFilter);
      return matchSearch && matchClass;
    });
  }, [data?.students, studentSearch, selectedClassFilter]);

  if (loading) {
    return (
      <TeacherPageShell section={section} profile={data?.profile}>
        <A26LoadingState message={t("common.loading", { defaultValue: "Carregando dados pedagógicos..." })} />
      </TeacherPageShell>
    );
  }

  if (errorMessage || data?.restricted) {
    return (
      <TeacherPageShell section={section} profile={data?.profile}>
        <TeacherEmptyState
          title={t("teacher.restricted.title", { defaultValue: "Acesso Docente Restrito" })}
          text={errorMessage || data?.reason || t("teacher.restricted.text", { defaultValue: "Sua conta docente precisa estar associada a uma instituição ativa." })}
          actionLabel={t("actions.refresh", { defaultValue: "Recarregar" })}
          onAction={loadData}
        />
      </TeacherPageShell>
    );
  }

  const { metrics, classes = [], students = [], models = [], studyGuides = [], lessons = [], notes = [], reports } = data;

  return (
    <TeacherPageShell section={section} profile={data?.profile} onEditProfile={() => setIsProfileModalOpen(true)}>
      {/* KPI METRIC BAR */}
      <div className="teacher-kpi-grid">
        <TeacherKpiCard icon="folder" label={t("teacher.metrics.classes", { defaultValue: "Turmas Vinculadas" })} value={metrics.classes} tone="teal" />
        <TeacherKpiCard icon="users" label={t("teacher.metrics.students", { defaultValue: "Alunos Acompanhados" })} value={metrics.students} tone="teal" />
        <TeacherKpiCard icon="cube" label={t("teacher.metrics.models", { defaultValue: "Modelos 3D Disponíveis" })} value={metrics.availableModels} tone="teal" />
        <TeacherKpiCard icon="clock" label={t("teacher.metrics.averageStudyTime", { defaultValue: "Tempo Médio de Estudo" })} value={metrics.averageStudyTime} tone="gold" />
      </div>

      {/* DASHBOARD VIEW */}
      {section === "dashboard" && (
        <div className="space-y-6">
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-teal-950/20 border border-teal-500/20">
            <span className="text-xs uppercase tracking-widest text-agedGold font-bold">
              {t("teacher.quickActions", { defaultValue: "Ações Operacionais Rápidas" })}
            </span>
            <div className="flex items-center gap-2">
              <A26Button variant="liquid" size="sm" onClick={() => setIsClassModalOpen(true)} icon={<LineIcon name="plus" />}>
                {t("teacher.classes.createButton", { defaultValue: "Nova Turma" })}
              </A26Button>
              <A26Button variant="ghost" size="sm" onClick={() => setIsGuideModalOpen(true)} icon={<LineIcon name="spark" />}>
                {t("teacher.studyGuides.createButton", { defaultValue: "Novo Roteiro 3D" })}
              </A26Button>
              <A26Button variant="ghost" size="sm" onClick={() => onNavigate?.("/professor/models")}>
                {t("teacher.models.browse", { defaultValue: "Explorar Modelos" })}
              </A26Button>
            </div>
          </div>

          {/* Academic Focus & Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <A26Card material="clear" tone="teal" className="p-4">
              <span className="text-[11px] uppercase tracking-wider text-agedGold font-bold block mb-1">
                {t("teacher.focus.mostStudied", { defaultValue: "Modelo Mais Estudado" })}
              </span>
              <strong className="text-white text-base block font-bold line-clamp-2">
                {metrics.mostUsedModel}
              </strong>
              <span className="text-xs text-teal-400 mt-2 block">
                {metrics.activeStudentsThisWeek} {t("teacher.metrics.activeStudentsThisWeek", { defaultValue: "alunos ativos esta semana" })}
              </span>
            </A26Card>

            <A26Card material="clear" tone="teal" className="p-4">
              <span className="text-[11px] uppercase tracking-wider text-agedGold font-bold block mb-1">
                {t("teacher.focus.studyGuides", { defaultValue: "Roteiros Ativos" })}
              </span>
              <strong className="text-white text-base block font-bold">
                {studyGuides.length ? `${studyGuides.length} Roteiros Publicados` : "Nenhum roteiro publicado"}
              </strong>
              <span className="text-xs text-textMuted mt-2 block">
                {studyGuides.length ? "Orientando estudos práticos" : "Crie um roteiro para direcionar os alunos"}
              </span>
            </A26Card>

            <A26Card material="clear" tone="gold" className="p-4">
              <span className="text-[11px] uppercase tracking-wider text-agedGold font-bold block mb-1">
                {t("teacher.focus.notes", { defaultValue: "Anotações Anatômicas" })}
              </span>
              <strong className="text-white text-base block font-bold">
                {notes.length ? `${notes.length} Observações Docentes` : "Sem notas pendentes"}
              </strong>
              <span className="text-xs text-textMuted mt-2 block">
                {notes.length ? "Compartilhadas com a instituição" : "Anote estruturas nos modelos 3D"}
              </span>
            </A26Card>
          </div>

          {/* Classes Grid in Dashboard */}
          <div className="teacher-section-card">
            <div className="teacher-section-header">
              <h2 className="teacher-section-title">{t("teacher.classes.title", { defaultValue: "Turmas Sob Orientação" })} ({classes.length})</h2>
              <A26Button variant="liquid" size="sm" onClick={() => setIsClassModalOpen(true)}>
                + {t("teacher.classes.createButton", { defaultValue: "Criar Turma" })}
              </A26Button>
            </div>

            {classes.length ? (
              <div className="teacher-classes-grid">
                {classes.map(c => (
                  <div key={c.id} className="teacher-class-card">
                    <div>
                      <div className="teacher-class-card-header">
                        <div>
                          <h3 className="teacher-class-card-title">{c.name}</h3>
                          <p className="teacher-class-card-sub">{c.course} · {c.semester}</p>
                        </div>
                        <span className={`teacher-status-pill teacher-status-pill--${c.status === "active" ? "active" : "inactive"}`}>
                          {c.status}
                        </span>
                      </div>

                      <div className="teacher-class-stats-grid">
                        <div>
                          <span className="teacher-class-stat-val">{c.students}</span>
                          <span className="teacher-class-stat-lbl">{t("teacher.classes.students", { defaultValue: "Alunos" })}</span>
                        </div>
                        <div>
                          <span className="teacher-class-stat-val">{c.averageProgress}%</span>
                          <span className="teacher-class-stat-lbl">{t("teacher.classes.progress", { defaultValue: "Média" })}</span>
                        </div>
                        <div>
                          <span className="teacher-class-stat-val">{c.totalStudyTime}</span>
                          <span className="teacher-class-stat-lbl">{t("teacher.classes.studyTime", { defaultValue: "Estudo" })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="teacher-class-card-actions">
                      <A26Button
                        variant="liquid"
                        size="sm"
                        onClick={() => {
                          setActiveClassForStudents(c);
                          setIsManageStudentsOpen(true);
                        }}
                      >
                        {t("teacher.classes.manageStudents", { defaultValue: "Gerenciar Alunos" })}
                      </A26Button>
                      <A26Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClass(c.id)}
                      >
                        <LineIcon name="trash" />
                      </A26Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <TeacherEmptyState
                title={t("teacher.classes.emptyTitle", { defaultValue: "Nenhuma turma cadastrada" })}
                text={t("teacher.classes.emptyText", { defaultValue: "Crie turmas para organizar seus alunos e acompanhar métricas de aprendizado." })}
                actionLabel={t("teacher.classes.createButton", { defaultValue: "Criar Primeira Turma" })}
                onAction={() => setIsClassModalOpen(true)}
              />
            )}
          </div>
        </div>
      )}

      {/* CLASSES TAB */}
      {section === "classes" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="teacher-section-title">{t("teacher.classes.listTitle", { defaultValue: "Todas as Turmas" })} ({classes.length})</h2>
            <A26Button variant="primary" onClick={() => setIsClassModalOpen(true)} icon={<LineIcon name="plus" />}>
              {t("teacher.classes.createButton", { defaultValue: "Criar Nova Turma" })}
            </A26Button>
          </div>

          {classes.length ? (
            <div className="teacher-classes-grid">
              {classes.map(c => (
                <div key={c.id} className="teacher-class-card">
                  <div>
                    <div className="teacher-class-card-header">
                      <div>
                        <h3 className="teacher-class-card-title">{c.name}</h3>
                        <p className="teacher-class-card-sub">{c.course} · {c.semester}</p>
                      </div>
                      <span className={`teacher-status-pill teacher-status-pill--${c.status === "active" ? "active" : "inactive"}`}>
                        {c.status}
                      </span>
                    </div>

                    <div className="teacher-class-stats-grid">
                      <div>
                        <span className="teacher-class-stat-val">{c.students}</span>
                        <span className="teacher-class-stat-lbl">Alunos</span>
                      </div>
                      <div>
                        <span className="teacher-class-stat-val">{c.averageProgress}%</span>
                        <span className="teacher-class-stat-lbl">Progresso</span>
                      </div>
                      <div>
                        <span className="teacher-class-stat-val">{c.totalStudyTime}</span>
                        <span className="teacher-class-stat-lbl">Tempo</span>
                      </div>
                    </div>

                    {c.notes ? <p className="text-xs text-textMuted italic mb-3">"{c.notes}"</p> : null}
                  </div>

                  <div className="teacher-class-card-actions">
                    <A26Button
                      variant="liquid"
                      size="sm"
                      onClick={() => {
                        setActiveClassForStudents(c);
                        setIsManageStudentsOpen(true);
                      }}
                    >
                      {t("teacher.classes.manageStudents", { defaultValue: "Gerenciar Alunos" })}
                    </A26Button>
                    <A26Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClass(c.id)}
                    >
                      <LineIcon name="trash" />
                    </A26Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <TeacherEmptyState
              title={t("teacher.classes.emptyTitle", { defaultValue: "Nenhuma turma cadastrada" })}
              text={t("teacher.classes.emptyText", { defaultValue: "Crie uma turma para associar estudantes da instituição e gerenciar atividades." })}
              actionLabel={t("teacher.classes.createButton", { defaultValue: "Criar Turma" })}
              onAction={() => setIsClassModalOpen(true)}
            />
          )}
        </div>
      )}

      {/* STUDENTS TAB */}
      {section === "students" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <input
                type="text"
                className="bg-black/40 border border-teal-500/30 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-teal-400 min-w-[260px]"
                placeholder={t("teacher.students.searchPlaceholder", { defaultValue: "Buscar aluno por nome, matrícula ou e-mail..." })}
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
              />
              <select
                className="bg-black/40 border border-teal-500/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
                value={selectedClassFilter}
                onChange={e => setSelectedClassFilter(e.target.value)}
              >
                <option value="all">{t("teacher.students.allClasses", { defaultValue: "Todas as Turmas" })}</option>
                {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <A26Button variant="ghost" onClick={handleExportStudentsCsv} icon={<LineIcon name="download" />}>
              {t("teacher.students.exportCsv", { defaultValue: "Exportar Relatório CSV" })}
            </A26Button>
          </div>

          {filteredStudents.length ? (
            <div className="teacher-table-wrapper">
              <table className="teacher-data-table">
                <thead>
                  <tr>
                    <th>{t("teacher.students.colName", { defaultValue: "Nome do Aluno" })}</th>
                    <th>{t("teacher.students.colRegistration", { defaultValue: "Matrícula" })}</th>
                    <th>{t("teacher.students.colClass", { defaultValue: "Turma" })}</th>
                    <th>{t("teacher.students.colLastAccess", { defaultValue: "Último Acesso" })}</th>
                    <th>{t("teacher.students.colStudyTime", { defaultValue: "Tempo de Estudo" })}</th>
                    <th>{t("teacher.students.colModels", { defaultValue: "Modelos" })}</th>
                    <th>{t("teacher.students.colProgress", { defaultValue: "Progresso" })}</th>
                    <th>{t("teacher.students.colStatus", { defaultValue: "Status" })}</th>
                    <th>{t("teacher.students.colActions", { defaultValue: "Ações" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr key={student.id}>
                      <td>
                        <strong className="teacher-student-name block">{student.name}</strong>
                        <span className="teacher-student-email">{student.email}</span>
                      </td>
                      <td><span className="font-mono text-xs text-agedGold">{student.registration}</span></td>
                      <td><span className="text-xs text-white">{student.className}</span></td>
                      <td><span className="text-xs text-textMuted">{new Date(student.lastAccess).toLocaleDateString()}</span></td>
                      <td><strong className="font-mono text-xs text-teal-400">{student.totalStudyTime}</strong></td>
                      <td><span className="text-xs text-white">{student.accessedModels} 3D</span></td>
                      <td style={{ minWidth: "120px" }}>
                        <div className="flex items-center gap-2">
                          <ProgressBar value={student.progress} />
                          <span className="font-mono text-xs text-teal-300">{student.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`teacher-status-pill teacher-status-pill--${student.status === "ativo" ? "active" : "inactive"}`}>
                          {student.status}
                        </span>
                      </td>
                      <td>
                        <A26Button
                          variant="liquid"
                          size="sm"
                          onClick={() => setSelectedStudentDossier(student)}
                        >
                          {t("teacher.students.viewDossier", { defaultValue: "Dossiê" })}
                        </A26Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <TeacherEmptyState
              title={t("teacher.students.emptyTitle", { defaultValue: "Nenhum aluno encontrado" })}
              text={t("teacher.students.emptyText", { defaultValue: "Não foram encontrados alunos para o filtro selecionado." })}
            />
          )}
        </div>
      )}

      {/* 3D MODELS TAB */}
      {section === "models" && (
        <div className="space-y-6">
          <div className="teacher-section-header">
            <h2 className="teacher-section-title">{t("teacher.models.catalogTitle", { defaultValue: "Modelos Anatômicos 3D Disponíveis" })} ({models.length})</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {models.map(m => {
              const summary = translateModelSummary(t, m);
              return (
                <A26Card key={m.id} material="regular" tone="teal" className="flex flex-col justify-between p-5">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-teal-400 font-bold block mb-1">
                      {summary.system || "Sistema Anatômico"}
                    </span>
                    <h3 className="text-lg font-bold text-white mb-2 leading-snug">{summary.title}</h3>
                    <p className="text-xs text-textMuted line-clamp-3 mb-4">{summary.description}</p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-teal-500/20">
                    <A26Button
                      variant="primary"
                      className="w-full justify-center"
                      onClick={() => onNavigate?.(`/viewer/${modelRouteId(m)}`)}
                      icon={<LineIcon name="cube" />}
                    >
                      {t("teacher.models.openModel", { defaultValue: "Abrir Modelo 3D" })}
                    </A26Button>
                    <div className="grid grid-cols-2 gap-2">
                      <A26Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsGuideModalOpen(true)}
                      >
                        {t("teacher.models.addToGuide", { defaultValue: "+ Roteiro" })}
                      </A26Button>
                      <A26Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const note = prompt("Registrar anotação anatômica para este modelo:");
                          if (note) {
                            createTeacherAnatomicalNote(user, { modelId: m.id, structure: note }).then(() => loadData());
                          }
                        }}
                      >
                        {t("teacher.models.addNote", { defaultValue: "+ Anotação" })}
                      </A26Button>
                    </div>
                  </div>
                </A26Card>
              );
            })}
          </div>
        </div>
      )}

      {/* STUDY GUIDES TAB */}
      {section === "study-guides" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="teacher-section-title">{t("teacher.studyGuides.title", { defaultValue: "Roteiros de Estudo 3D" })} ({studyGuides.length})</h2>
            <A26Button variant="primary" onClick={() => setIsGuideModalOpen(true)} icon={<LineIcon name="plus" />}>
              {t("teacher.studyGuides.createButton", { defaultValue: "Criar Roteiro" })}
            </A26Button>
          </div>

          {studyGuides.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studyGuides.map(g => (
                <A26Card key={g.id} material="regular" className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono text-agedGold uppercase font-bold">{g.className}</span>
                      <span className="text-[11px] text-teal-400 font-semibold">{g.status}</span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{g.title}</h3>
                    {g.description ? <p className="text-xs text-textMuted mb-3">{g.description}</p> : null}
                    {g.modelTitles?.length ? (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {g.modelTitles.map(mt => (
                          <span key={mt} className="px-2 py-0.5 rounded bg-teal-950/60 border border-teal-500/30 text-[10px] text-teal-300">
                            ✦ {mt}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-glassBorder/40">
                    <span className="text-[11px] text-textMuted">Prazo: {g.dueDate || "Sem data limite"}</span>
                    <A26Button variant="ghost" size="sm" onClick={() => handleDeleteStudyGuide(g.id)}>
                      <LineIcon name="trash" />
                    </A26Button>
                  </div>
                </A26Card>
              ))}
            </div>
          ) : (
            <TeacherEmptyState
              title="Nenhum roteiro criado"
              text="Crie roteiros pedagógicos interativos combinando modelos 3D com objetivos claros."
              actionLabel="Criar Roteiro"
              onAction={() => setIsGuideModalOpen(true)}
            />
          )}
        </div>
      )}

      {/* ANATOMICAL NOTES TAB */}
      {section === "anatomical-notes" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="teacher-section-title">Anotações e Observações Docentes ({notes.length})</h2>
            <A26Button
              variant="primary"
              onClick={() => {
                const struct = prompt("Estrutura anatômica:");
                const desc = struct ? prompt("Descrição ou observação clínica:") : null;
                if (struct) {
                  createTeacherAnatomicalNote(user, { structure: struct, description: desc }).then(() => loadData());
                }
              }}
              icon={<LineIcon name="plus" />}
            >
              Nova Observação
            </A26Button>
          </div>

          {notes.length ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {notes.map(n => (
                <A26Card key={n.id} material="clear" className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-white text-sm">{n.title}</strong>
                    <span className="text-[10px] uppercase font-mono text-agedGold">{n.priority}</span>
                  </div>
                  <p className="text-xs text-textMuted">{n.description || "Sem descrição adicional."}</p>
                  <span className="text-[11px] text-teal-400 block">Modelo: {n.modelTitle}</span>
                </A26Card>
              ))}
            </div>
          ) : (
            <TeacherEmptyState
              title="Nenhuma anotação anatômica"
              text="Registre notas clínicas e observações sobre estruturas 3D para enriquecer as aulas."
            />
          )}
        </div>
      )}

      {/* REPORTS TAB */}
      {section === "reports" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="teacher-section-title">Relatórios e Analytics de Aprendizagem</h2>
            <A26Button variant="ghost" onClick={handleExportStudentsCsv} icon={<LineIcon name="download" />}>
              Exportar CSV
            </A26Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="teacher-section-card">
              <h3 className="text-sm font-bold text-agedGold mb-3">Tempo de Estudo por Turma (minutos)</h3>
              <MiniBarChart data={reports?.classStudyTime || []} />
            </div>

            <div className="teacher-section-card">
              <h3 className="text-sm font-bold text-agedGold mb-3">Modelos Mais Estudados</h3>
              <MiniBarChart data={(reports?.modelRanking || []).map(r => ({ label: r.model, value: r.accesses }))} />
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <TeacherClassModal
        open={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onSubmit={handleCreateClass}
        saving={savingAction}
        error={actionError}
      />

      <TeacherManageStudentsModal
        open={isManageStudentsOpen}
        classItem={activeClassForStudents}
        allStudents={students}
        onClose={() => {
          setIsManageStudentsOpen(false);
          setActiveClassForStudents(null);
        }}
        onEnroll={handleEnrollStudent}
        onRemove={handleRemoveStudent}
        loading={savingAction}
      />

      <TeacherStudentDossierModal
        open={Boolean(selectedStudentDossier)}
        student={selectedStudentDossier}
        onClose={() => setSelectedStudentDossier(null)}
      />

      <TeacherStudyGuideModal
        open={isGuideModalOpen}
        classes={classes}
        models={models}
        onClose={() => setIsGuideModalOpen(false)}
        onSubmit={handleCreateStudyGuide}
        saving={savingAction}
        error={actionError}
      />

      <TeacherProfileModal
        open={isProfileModalOpen}
        profile={data?.profile}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        saving={savingAction}
      />
    </TeacherPageShell>
  );
}
