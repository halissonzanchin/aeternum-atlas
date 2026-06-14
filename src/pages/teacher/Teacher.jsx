import { useEffect, useState } from "react";
import Card from "../../components/Card/Card";
import LineIcon from "../../components/icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";
import { loadTeacherDashboardData } from "../../services/teacher/teacherDashboardService";
import { createTeacherClass, createTeacherStudyGuide } from "../../services/teacher/teacherAcademicService";
import { translateModelSummary } from "../../utils/modelI18n";

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

function TeacherPageShell({ section, profile, children }) {
  const { t } = useLanguage();
  const [titleKey, subtitleKey] = sectionTitles[section] || sectionTitles.dashboard;
  const profileName = profile?.name || t("teacher.emptyStates.profileTitle");
  const department = profile?.department || t("teacher.emptyStates.profileDepartment");
  const institutionLabel = [profile?.institution, profile?.campus].filter(Boolean).join(" · ") || t("teacher.emptyStates.profileInstitution");

  return (
    <section className="teacher-page fade-in-up">
      <div className="teacher-hero">
        <div>
          <p className="viewer-eyebrow">{t("teacher.eyebrow")}</p>
          <h1>{t(titleKey)}</h1>
          <p>{t(subtitleKey)}</p>
        </div>
        <div className="teacher-profile-chip">
          <span>{department}</span>
          <strong>{profileName}</strong>
          <small>{institutionLabel}</small>
        </div>
      </div>
      {children}
    </section>
  );
}

function TeacherKpiCard({ icon, label, value, tone = "gold" }) {
  return (
    <article className={`teacher-kpi-card teacher-kpi-card--${tone}`}>
      <span><LineIcon name={icon} /></span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
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

function TeacherEmptyState({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-xl font-bold text-clinicalWhite">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-textMuted">{text}</p>
    </div>
  );
}

function defaultClassForm() {
  return {
    name: "",
    course: "Medicina",
    semester: "",
    status: "active",
    notes: ""
  };
}

function TeacherClassModal({ open, onClose, onSubmit, saving, error }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(defaultClassForm);

  useEffect(() => {
    if (open) setForm(defaultClassForm());
  }, [open]);

  if (!open) return null;

  function update(name, value) {
    setForm(previous => ({ ...previous, [name]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="agenda-modal-backdrop" role="presentation" onClick={onClose}>
      <form className="agenda-task-modal" onSubmit={submit} onClick={event => event.stopPropagation()}>
        <header>
          <div>
            <p className="viewer-eyebrow">{t("teacher.classes.formEyebrow")}</p>
            <h2>{t("teacher.classes.createTitle")}</h2>
          </div>
          <button type="button" onClick={onClose}>{t("actions.close")}</button>
        </header>

        <div className="agenda-form-grid">
          <label className="field">
            <span>{t("teacher.classes.form.name")}</span>
            <input required value={form.name} onChange={event => update("name", event.target.value)} />
          </label>
          <label className="field">
            <span>{t("teacher.classes.form.course")}</span>
            <input value={form.course} onChange={event => update("course", event.target.value)} />
          </label>
          <label className="field">
            <span>{t("teacher.classes.form.semester")}</span>
            <input value={form.semester} onChange={event => update("semester", event.target.value)} />
          </label>
          <label className="field">
            <span>{t("common.status")}</span>
            <select value={form.status} onChange={event => update("status", event.target.value)}>
              <option value="active">{t("teacher.statuses.active")}</option>
              <option value="inactive">{t("teacher.statuses.inactive")}</option>
            </select>
          </label>
          <label className="field agenda-form-wide">
            <span>{t("teacher.classes.form.notes")}</span>
            <textarea value={form.notes} onChange={event => update("notes", event.target.value)} />
          </label>
        </div>

        {error ? <p className="teacher-form-error">{error}</p> : null}

        <footer>
          <button type="button" className="viewer-secondary-button" onClick={onClose}>{t("actions.cancel")}</button>
          <button type="submit" className="viewer-primary-button" disabled={saving}>{saving ? t("common.loading") : t("actions.save")}</button>
        </footer>
      </form>
    </div>
  );
}

function defaultStudyGuideForm() {
  return {
    title: "",
    description: "",
    classId: "",
    dueDate: "",
    status: "draft",
    objectives: "",
    modelIds: []
  };
}

function TeacherStudyGuideModal({ open, onClose, onSubmit, saving, error, classes, models }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(defaultStudyGuideForm);

  useEffect(() => {
    if (open) setForm(defaultStudyGuideForm());
  }, [open]);

  if (!open) return null;

  function update(name, value) {
    setForm(previous => ({ ...previous, [name]: value }));
  }

  function toggleModel(modelId) {
    setForm(previous => {
      const selected = previous.modelIds.includes(modelId);
      return {
        ...previous,
        modelIds: selected
          ? previous.modelIds.filter(item => item !== modelId)
          : [...previous.modelIds, modelId]
      };
    });
  }

  function submit(event) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="agenda-modal-backdrop" role="presentation" onClick={onClose}>
      <form className="agenda-task-modal" onSubmit={submit} onClick={event => event.stopPropagation()}>
        <header>
          <div>
            <p className="viewer-eyebrow">{t("teacher.studyGuides.formEyebrow")}</p>
            <h2>{t("teacher.studyGuides.createTitle")}</h2>
          </div>
          <button type="button" onClick={onClose}>{t("actions.close")}</button>
        </header>

        <div className="agenda-form-grid">
          <label className="field">
            <span>{t("teacher.studyGuides.form.title")}</span>
            <input required value={form.title} onChange={event => update("title", event.target.value)} />
          </label>
          <label className="field">
            <span>{t("teacher.studyGuides.form.class")}</span>
            <select value={form.classId} onChange={event => update("classId", event.target.value)}>
              <option value="">{t("teacher.studyGuides.noLinkedClass")}</option>
              {classes.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t("teacher.studyGuides.form.dueDate")}</span>
            <input type="date" value={form.dueDate} onChange={event => update("dueDate", event.target.value)} />
          </label>
          <label className="field">
            <span>{t("teacher.studyGuides.form.status")}</span>
            <select value={form.status} onChange={event => update("status", event.target.value)}>
              <option value="draft">{t("teacher.statuses.draft")}</option>
              <option value="active">{t("teacher.statuses.active")}</option>
            </select>
          </label>
          <label className="field agenda-form-wide">
            <span>{t("teacher.studyGuides.form.description")}</span>
            <textarea value={form.description} onChange={event => update("description", event.target.value)} />
          </label>
          <label className="field agenda-form-wide">
            <span>{t("teacher.studyGuides.form.objectives")}</span>
            <textarea value={form.objectives} onChange={event => update("objectives", event.target.value)} />
            <small className="teacher-guide-hint">{t("teacher.studyGuides.objectivesHint")}</small>
          </label>
          <div className="field agenda-form-wide">
            <span>{t("teacher.studyGuides.form.models")}</span>
            {models.length ? (
              <div className="teacher-guide-model-grid">
                {models.map(model => {
                  const selected = form.modelIds.includes(model.id);
                  return (
                    <label key={model.id} className={selected ? "teacher-guide-model-option is-selected" : "teacher-guide-model-option"}>
                      <input type="checkbox" checked={selected} onChange={() => toggleModel(model.id)} />
                      <strong>{model.title}</strong>
                      <small>{model.system || model.region || t("teacher.studyGuides.modelFallback")}</small>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="teacher-guide-hint">{t("teacher.studyGuides.noModelsAvailable")}</p>
            )}
          </div>
        </div>

        {error ? <p className="teacher-form-error">{error}</p> : null}

        <footer>
          <button type="button" className="viewer-secondary-button" onClick={onClose}>{t("actions.cancel")}</button>
          <button type="submit" className="viewer-primary-button" disabled={saving}>{saving ? t("common.loading") : t("actions.save")}</button>
        </footer>
      </form>
    </div>
  );
}

function formatTeacherDate(value, locale = "pt-BR") {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function teacherStatusLabel(t, status) {
  return t(`teacher.statuses.${status || "unknown"}`);
}

function teacherPriorityLabel(t, priority) {
  return t(`teacher.priorities.${priority || "medium"}`);
}

function teacherVisibilityLabel(t, visibility) {
  return t(`teacher.visibilities.${visibility || "private"}`);
}

function teacherNoteTypeLabel(t, noteType) {
  return t(`teacher.noteTypes.${noteType || "didactic"}`);
}

function DashboardSection({ navigate, data, loading }) {
  const { t } = useLanguage();
  const metrics = data?.metrics || {};
  const classes = data?.classes || [];
  const lessons = data?.lessons || [];
  const notes = data?.notes || [];
  const modelRanking = data?.reports?.modelRanking || [];
  const dashboardMostUsed = metrics.mostUsedModel || t("teacher.emptyStates.reports");
  const nextLesson = lessons.find(lesson => {
    if (!lesson.scheduledFor) return false;
    const scheduledDate = new Date(lesson.scheduledFor);
    return !Number.isNaN(scheduledDate.getTime()) && scheduledDate.getTime() >= Date.now();
  });
  const pendingNotes = notes.filter(note => !["resolved", "archived", "closed"].includes(note.status));

  return (
    <TeacherPageShell section="dashboard" profile={data?.profile}>
      <div className="teacher-kpi-grid">
        <TeacherKpiCard icon="library" label={t("teacher.kpis.classes")} value={loading ? "..." : metrics.classes || 0} tone="teal" />
        <TeacherKpiCard icon="check" label={t("teacher.kpis.students")} value={loading ? "..." : metrics.students || 0} />
        <TeacherKpiCard icon="layers" label={t("teacher.kpis.availableModels")} value={loading ? "..." : metrics.availableModels || 0} tone="teal" />
        <TeacherKpiCard icon="clock" label={t("teacher.kpis.averageStudyTime")} value={loading ? "..." : metrics.averageStudyTime || "0 min"} />
        <TeacherKpiCard icon="reset" label={t("teacher.kpis.activeThisWeek")} value={loading ? "..." : metrics.activeStudentsThisWeek || 0} tone="teal" />
        <TeacherKpiCard icon="library" label={t("teacher.kpis.guidesCreated")} value={loading ? "..." : metrics.studyGuidesCreated || 0} />
        <TeacherKpiCard icon="help" label={t("teacher.kpis.pendingValidations")} value={loading ? "..." : metrics.pendingValidations || 0} tone="alert" />
        <TeacherKpiCard icon="spark" label={t("teacher.kpis.mostUsedModel")} value={loading ? "..." : dashboardMostUsed} tone="teal" />
      </div>

      <div className="teacher-dashboard-grid">
        <Card className="premium-panel-card">
          <div className="teacher-section-title">
            <h2>{t("teacher.dashboard.classPerformance")}</h2>
            <button onClick={() => navigate("/teacher/classes")}>{t("teacher.actions.viewClasses")}</button>
          </div>
          {classes.length ? (
            <div className="teacher-class-list">
              {classes.slice(0, 3).map(item => (
                <div key={item.id} className="teacher-class-card">
                  <span>{item.semester || item.course || t("teacher.common.classLabel")}</span>
                  <strong>{item.name}</strong>
                  <small>{item.students} {t("teacher.common.students")} · {item.totalStudyTime}</small>
                  <ProgressBar value={item.averageProgress} />
                </div>
              ))}
            </div>
          ) : (
            <TeacherEmptyState
              title={t("teacher.emptyStates.classesTitle")}
              text={t("teacher.emptyStates.classes")}
            />
          )}
        </Card>

        <Card className="premium-panel-card">
          <div className="teacher-section-title">
            <h2>{t("teacher.dashboard.academicFocus")}</h2>
            <button onClick={() => navigate("/teacher/study-guides")}>{t("teacher.actions.createGuide")}</button>
          </div>
          <div className="teacher-focus-list">
            <div>
              <span>{t("teacher.dashboard.mostStudied")}</span>
              <strong>{dashboardMostUsed}</strong>
            </div>
            <div>
              <span>{t("teacher.dashboard.nextClass")}</span>
              <strong>{nextLesson?.title || t("teacher.emptyStates.lessons")}</strong>
            </div>
            <div>
              <span>{t("teacher.dashboard.pendingNotes")}</span>
              <strong>{pendingNotes.length ? `${pendingNotes.length} ${t("teacher.common.notes")}` : t("teacher.emptyStates.notes")}</strong>
            </div>
          </div>
        </Card>
      </div>
      {!loading && modelRanking.length === 0 ? (
        <TeacherEmptyState title={t("teacher.emptyStates.reportsTitle")} text={t("teacher.emptyStates.reports")} />
      ) : null}
    </TeacherPageShell>
  );
}

function ModelsSection({ navigate, data, loading }) {
  const { t } = useLanguage();
  const models = data?.models || [];

  return (
    <TeacherPageShell section="models" profile={data?.profile}>
      <div className="teacher-model-grid">
        {models.map(model => {
          const summary = translateModelSummary(model, t);
          return (
            <article key={model.id} className="teacher-model-card">
              <span className="badge badge-teal">{summary.system}</span>
              <h2>{summary.title}</h2>
              <p>{summary.region} · {summary.level} · {summary.type}</p>
              <dl>
                <div><dt>{t("teacher.models.averageTime")}</dt><dd>{model.estimatedStudyTime}</dd></div>
                <div><dt>{t("teacher.models.accesses")}</dt><dd>{model.accessCount}</dd></div>
                <div><dt>{t("common.status")}</dt><dd>{t("common.available")}</dd></div>
              </dl>
              <div className="teacher-card-actions">
                <button className="viewer-primary-button" onClick={() => navigate(`/viewer/${modelRouteId(model)}`)}>{t("teacher.actions.openModel")}</button>
                <button className="viewer-secondary-button" onClick={() => navigate("/teacher/study-guides")}>{t("teacher.actions.addToGuide")}</button>
                <button className="viewer-secondary-button" onClick={() => navigate("/teacher/lessons")}>{t("teacher.actions.useInClass")}</button>
                <button className="viewer-secondary-button" onClick={() => navigate("/teacher/anatomical-notes")}>{t("teacher.actions.registerNote")}</button>
              </div>
            </article>
          );
        })}
        {loading ? (
          <TeacherEmptyState title={t("teacher.emptyStates.loadingTitle")} text={t("models.catalogLoading")} />
        ) : null}
        {!loading && models.length === 0 ? (
          <TeacherEmptyState title={t("teacher.emptyStates.modelsTitle")} text={t("models.emptyCatalog")} />
        ) : null}
      </div>
    </TeacherPageShell>
  );
}

function ClassesSection({ data, onCreateClass }) {
  const { t } = useLanguage();
  const classes = data?.classes || [];
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submitClass(form) {
    if (!String(form?.name || "").trim()) {
      setError(t("teacher.classes.nameRequired"));
      return;
    }

    try {
      setSaving(true);
      setError("");
      await onCreateClass(form);
      setModalOpen(false);
    } catch (submitError) {
      console.error("[teacher-classes] Falha ao salvar turma.", submitError);
      setError(t("teacher.classes.createError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <TeacherPageShell section="classes" profile={data?.profile}>
      <div className="teacher-toolbar">
        <button className="viewer-primary-button" onClick={() => setModalOpen(true)}>{t("teacher.classes.createAction")}</button>
      </div>
      {classes.length ? (
        <div className="teacher-class-grid">
          {classes.map(item => (
            <article key={item.id} className="teacher-class-detail-card">
              <span className="badge badge-teal">{item.semester || item.course || t("teacher.common.classLabel")}</span>
              <h2>{item.name}</h2>
              <p>{item.notes || t("teacher.classes.summaryFallback")}</p>
              <div className="teacher-detail-grid">
                <span>
                  {t("teacher.classes.students")}
                  <strong>{item.students}</strong>
                </span>
                <span>
                  {t("teacher.classes.averageProgress")}
                  <strong>{item.averageProgress}%</strong>
                </span>
                <span>
                  {t("teacher.classes.totalStudyTime")}
                  <strong>{item.totalStudyTime}</strong>
                </span>
                <span>
                  {t("teacher.classes.lastActivity")}
                  <strong>{formatTeacherDate(item.lastActivityAt)}</strong>
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <TeacherEmptyState title={t("teacher.emptyStates.classesTitle")} text={t("teacher.emptyStates.classes")} />
      )}
      <TeacherClassModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setError("");
        }}
        onSubmit={submitClass}
        saving={saving}
        error={error}
      />
    </TeacherPageShell>
  );
}

function formatStudentLastAccess(value) {
  return formatTeacherDate(value);
}

function StudentsSection({ data, loading }) {
  const { t } = useLanguage();
  const students = data?.students || [];

  return (
    <TeacherPageShell section="students" profile={data?.profile}>
      <Card className="premium-panel-card table-card">
        <div className="teacher-section-title">
          <h2>{t("teacher.students.tableTitle")}</h2>
          <button>{t("teacher.actions.exportAcademicData")}</button>
        </div>
        <div className="table-scroll">
          <table className="admin-table teacher-table">
            <thead>
              <tr>
                <th>{t("teacher.students.name")}</th>
                <th>{t("teacher.students.registration")}</th>
                <th>{t("teacher.students.class")}</th>
                <th>{t("teacher.students.lastAccess")}</th>
                <th>{t("teacher.students.studyTime")}</th>
                <th>{t("teacher.students.models")}</th>
                <th>{t("teacher.students.progress")}</th>
                <th>{t("common.status")}</th>
                <th>{t("teacher.students.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.registration}</td>
                  <td>{student.className}</td>
                  <td>{formatStudentLastAccess(student.lastAccess)}</td>
                  <td>{student.totalStudyTime}</td>
                  <td>{student.accessedModels}</td>
                  <td>
                    <strong>{student.progress}%</strong>
                    <ProgressBar value={student.progress} />
                  </td>
                  <td><span className={`teacher-status teacher-status--${student.status}`}>{t(`status.${student.status}`)}</span></td>
                  <td>
                    <div className="teacher-table-actions">
                      <button>{t("teacher.actions.viewHistory")}</button>
                      <button>{t("teacher.actions.recommendModel")}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading ? (
          <TeacherEmptyState title={t("teacher.emptyStates.loadingTitle")} text={t("teacher.emptyStates.studentsLoading")} />
        ) : null}
        {!loading && students.length === 0 ? (
          <TeacherEmptyState title={t("teacher.emptyStates.studentsTitle")} text={t("teacher.emptyStates.students")} />
        ) : null}
      </Card>
    </TeacherPageShell>
  );
}

function StudyGuidesSection({ data, onCreateGuide }) {
  const { t } = useLanguage();
  const guides = data?.studyGuides || [];
  const classes = data?.classes || [];
  const models = data?.models || [];
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submitGuide(form) {
    if (!String(form?.title || "").trim()) {
      setError(t("teacher.studyGuides.titleRequired"));
      return;
    }

    try {
      setSaving(true);
      setError("");
      await onCreateGuide(form);
      setModalOpen(false);
    } catch (submitError) {
      console.error("[teacher-guides] Falha ao salvar guia de estudo.", submitError);
      setError(t("teacher.studyGuides.createError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <TeacherPageShell section="study-guides" profile={data?.profile}>
      <div className="teacher-toolbar">
        <button className="viewer-primary-button" onClick={() => setModalOpen(true)}>{t("teacher.actions.createGuide")}</button>
        <button className="viewer-secondary-button">{t("teacher.actions.exportGuide")}</button>
      </div>
      {guides.length ? (
        <div className="teacher-card-grid">
          {guides.map(guide => (
            <article key={guide.id} className="teacher-resource-card">
              <span className="badge badge-teal">{guide.className || t("teacher.common.unassignedClass")}</span>
              <h2>{guide.title}</h2>
              <p>{guide.description || t("teacher.studyGuides.descriptionFallback")}</p>
              <div className="teacher-detail-grid">
                <span>
                  {t("teacher.studyGuides.models")}
                  <strong>{guide.modelTitles.length}</strong>
                </span>
                <span>
                  {t("teacher.studyGuides.objectives")}
                  <strong>{guide.objectives.length}</strong>
                </span>
              </div>
              {guide.modelTitles.length ? (
                <div className="teacher-chip-list">
                  {guide.modelTitles.map(model => <span key={model}>{model}</span>)}
                </div>
              ) : null}
              <small>{t("teacher.studyGuides.dueDate")}: {formatTeacherDate(guide.dueDate)}</small>
            </article>
          ))}
        </div>
      ) : (
        <TeacherEmptyState title={t("teacher.emptyStates.guidesTitle")} text={t("teacher.emptyStates.guides")} />
      )}
      <TeacherStudyGuideModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setError("");
        }}
        onSubmit={submitGuide}
        saving={saving}
        error={error}
        classes={classes}
        models={models}
      />
    </TeacherPageShell>
  );
}

function LessonsSection({ data }) {
  const { t } = useLanguage();
  const lessons = data?.lessons || [];
  return (
    <TeacherPageShell section="lessons" profile={data?.profile}>
      <div className="teacher-toolbar">
        <button className="viewer-primary-button">{t("teacher.actions.createLesson")}</button>
      </div>
      {lessons.length ? (
        <div className="teacher-card-grid">
          {lessons.map(lesson => (
            <article key={lesson.id} className="teacher-resource-card">
              <span className="badge badge-teal">{lesson.className || t("teacher.common.unassignedClass")}</span>
              <h2>{lesson.title}</h2>
              <small>{formatTeacherDate(lesson.scheduledFor)}</small>
              <div className="teacher-detail-grid">
                <span>
                  {t("teacher.lessons.modelCount")}
                  <strong>{lesson.modelTitles.length}</strong>
                </span>
                <span>
                  {t("teacher.lessons.structureCount")}
                  <strong>{lesson.keyStructures.length}</strong>
                </span>
              </div>
              {lesson.modelTitles.length ? (
                <div className="teacher-chip-list">
                  {lesson.modelTitles.map(model => <span key={model}>{model}</span>)}
                </div>
              ) : null}
              <p>{lesson.notes || t("teacher.lessons.notesFallback")}</p>
            </article>
          ))}
        </div>
      ) : (
        <TeacherEmptyState title={t("teacher.emptyStates.lessonsTitle")} text={t("teacher.emptyStates.lessons")} />
      )}
    </TeacherPageShell>
  );
}

function NotesSection({ data }) {
  const { t } = useLanguage();
  const notes = data?.notes || [];
  return (
    <TeacherPageShell section="anatomical-notes" profile={data?.profile}>
      <div className="teacher-toolbar">
        <button className="viewer-primary-button">{t("teacher.actions.newNote")}</button>
      </div>
      {notes.length ? (
        <div className="teacher-card-grid">
          {notes.map(note => (
            <article key={note.id} className="teacher-resource-card">
              <div className="teacher-card-status-row">
                <span className="badge badge-teal">{note.modelTitle || t("teacher.notes.modelFallback")}</span>
                <span className={`teacher-priority teacher-priority--${note.priority}`}>{teacherPriorityLabel(t, note.priority)}</span>
              </div>
              <h2>{note.title || t("teacher.notes.titleFallback")}</h2>
              <p>{note.description || t("teacher.notes.descriptionFallback")}</p>
              <div className="teacher-chip-list">
                <span>{teacherStatusLabel(t, note.status)}</span>
                <span>{teacherNoteTypeLabel(t, note.noteType)}</span>
                <span>{teacherVisibilityLabel(t, note.visibility)}</span>
              </div>
              <small>{formatTeacherDate(note.createdAt)}</small>
            </article>
          ))}
        </div>
      ) : (
        <TeacherEmptyState title={t("teacher.emptyStates.notesTitle")} text={t("teacher.emptyStates.notes")} />
      )}
    </TeacherPageShell>
  );
}

function ReportsSection({ data, loading }) {
  const { t } = useLanguage();
  const reports = data?.reports || {};
  const classStudyTime = reports.classStudyTime || [];
  const weeklyEvolution = reports.weeklyEvolution || [];
  const systemPerformance = reports.systemPerformance || [];
  const modelRanking = reports.modelRanking || [];

  return (
    <TeacherPageShell section="reports" profile={data?.profile}>
      <div className="teacher-report-grid">
        <Card className="premium-panel-card">
          <h2>{t("teacher.reports.studyTimeByClass")}</h2>
          {classStudyTime.length ? <MiniBarChart data={classStudyTime} /> : <TeacherEmptyState title={t("teacher.emptyStates.classesTitle")} text={t("teacher.emptyStates.classes")} />}
        </Card>
        <Card className="premium-panel-card">
          <h2>{t("teacher.reports.weeklyEvolution")}</h2>
          {weeklyEvolution.length ? <MiniBarChart data={weeklyEvolution} /> : <TeacherEmptyState title={t("teacher.emptyStates.reportsTitle")} text={t("teacher.emptyStates.reports")} />}
        </Card>
        <Card className="premium-panel-card">
          <h2>{t("teacher.reports.systemPerformance")}</h2>
          {systemPerformance.length ? <MiniBarChart data={systemPerformance} /> : <TeacherEmptyState title={t("teacher.emptyStates.reportsTitle")} text={t("teacher.emptyStates.reports")} />}
        </Card>
        <Card className="premium-panel-card">
          <h2>{t("teacher.reports.modelRanking")}</h2>
          <div className="teacher-ranking-list">
            {modelRanking.map((item, index) => (
              <div key={item.model}>
                <span>{index + 1}</span>
                <strong>{item.model}</strong>
                <small>{item.accesses} {t("models.accesses")}</small>
              </div>
            ))}
          </div>
          {!loading && modelRanking.length === 0 ? (
            <TeacherEmptyState title={t("teacher.emptyStates.reportsTitle")} text={t("teacher.emptyStates.reports")} />
          ) : null}
        </Card>
      </div>
    </TeacherPageShell>
  );
}

function ProfileSection({ data }) {
  const { t } = useLanguage();
  const profile = data?.profile;

  return (
    <TeacherPageShell section="profile" profile={profile}>
      <Card className="premium-panel-card teacher-profile-card">
        <span className="badge badge-teal">{profile?.department || t("teacher.emptyStates.profileDepartment")}</span>
        <h2>{profile?.name || t("teacher.emptyStates.profileTitle")}</h2>
        <p>{profile?.email || "-"}</p>
        <p>{[profile?.institution, profile?.campus].filter(Boolean).join(" · ") || t("teacher.emptyStates.profileInstitution")}</p>
        {profile?.specialties?.length ? (
          <div className="teacher-chip-list">
            {profile.specialties.map(item => <span key={item}>{item}</span>)}
          </div>
        ) : null}
        <small>{t("teacher.profile.permissions")}</small>
      </Card>
    </TeacherPageShell>
  );
}

export default function Teacher({ section = "dashboard", navigate, user }) {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setData(null);

    loadTeacherDashboardData(user)
      .then(payload => {
        if (mounted) setData(payload);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  async function handleCreateClass(form) {
    await createTeacherClass(user, form);
    const refreshed = await loadTeacherDashboardData(user);
    setData(refreshed);
  }

  async function handleCreateStudyGuide(form) {
    await createTeacherStudyGuide(user, form);
    const refreshed = await loadTeacherDashboardData(user);
    setData(refreshed);
  }

  if (data?.restricted) {
    return (
      <TeacherPageShell section={section} profile={data?.profile}>
        <TeacherEmptyState title={t("teacher.emptyStates.restrictedTitle")} text={data.reason || t("teacher.emptyStates.restricted")} />
      </TeacherPageShell>
    );
  }

  if (section === "models") return <ModelsSection navigate={navigate} data={data} loading={loading} />;
  if (section === "classes") return <ClassesSection data={data} onCreateClass={handleCreateClass} />;
  if (section === "students") return <StudentsSection data={data} loading={loading} />;
  if (section === "study-guides") return <StudyGuidesSection data={data} onCreateGuide={handleCreateStudyGuide} />;
  if (section === "lessons" || section === "classes-plans") return <LessonsSection data={data} />;
  if (section === "anatomical-notes") return <NotesSection data={data} />;
  if (section === "reports") return <ReportsSection data={data} loading={loading} />;
  if (section === "profile") return <ProfileSection data={data} />;
  return <DashboardSection navigate={navigate} data={data} loading={loading} />;
}
