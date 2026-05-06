import Card from "../../components/Card/Card";
import LineIcon from "../../components/icons/LineIcon";
import { mockModels } from "../../data/mockModels";
import {
  teacherAnatomicalNotes,
  teacherClasses,
  teacherDashboardStats,
  teacherLessonPlans,
  teacherProfile,
  teacherReports,
  teacherStudents,
  teacherStudyGuides
} from "../../data/teacherMockData";
import { useLanguage } from "../../context/LanguageContext";
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

function TeacherPageShell({ section, children }) {
  const { t } = useLanguage();
  const [titleKey, subtitleKey] = sectionTitles[section] || sectionTitles.dashboard;

  return (
    <section className="teacher-page fade-in-up">
      <div className="teacher-hero">
        <div>
          <p className="viewer-eyebrow">{t("teacher.eyebrow")}</p>
          <h1>{t(titleKey)}</h1>
          <p>{t(subtitleKey)}</p>
        </div>
        <div className="teacher-profile-chip">
          <span>{teacherProfile.department}</span>
          <strong>{teacherProfile.name}</strong>
          <small>{teacherProfile.institution} · {teacherProfile.campus}</small>
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

function DashboardSection({ navigate }) {
  const { t } = useLanguage();

  return (
    <TeacherPageShell section="dashboard">
      <div className="teacher-kpi-grid">
        <TeacherKpiCard icon="library" label={t("teacher.kpis.classes")} value={teacherDashboardStats.classes} tone="teal" />
        <TeacherKpiCard icon="check" label={t("teacher.kpis.students")} value={teacherDashboardStats.students} />
        <TeacherKpiCard icon="layers" label={t("teacher.kpis.availableModels")} value={teacherDashboardStats.availableModels} tone="teal" />
        <TeacherKpiCard icon="clock" label={t("teacher.kpis.averageStudyTime")} value={teacherDashboardStats.averageStudyTime} />
        <TeacherKpiCard icon="reset" label={t("teacher.kpis.activeThisWeek")} value={teacherDashboardStats.activeStudentsThisWeek} tone="teal" />
        <TeacherKpiCard icon="library" label={t("teacher.kpis.guidesCreated")} value={teacherDashboardStats.studyGuidesCreated} />
        <TeacherKpiCard icon="help" label={t("teacher.kpis.pendingValidations")} value={teacherDashboardStats.pendingValidations} tone="alert" />
        <TeacherKpiCard icon="spark" label={t("teacher.kpis.mostUsedModel")} value={teacherDashboardStats.mostUsedModel} tone="teal" />
      </div>

      <div className="teacher-dashboard-grid">
        <Card className="premium-panel-card">
          <div className="teacher-section-title">
            <h2>{t("teacher.dashboard.classPerformance")}</h2>
            <button onClick={() => navigate("/teacher/classes")}>{t("teacher.actions.viewClasses")}</button>
          </div>
          <div className="teacher-class-list">
            {teacherClasses.map(item => (
              <button key={item.id} className="teacher-class-card" onClick={() => navigate("/teacher/classes")}>
                <span>{item.semester}</span>
                <strong>{item.name}</strong>
                <small>{item.students} {t("teacher.common.students")} · {item.totalStudyHours}h</small>
                <ProgressBar value={item.averageProgress} />
              </button>
            ))}
          </div>
        </Card>

        <Card className="premium-panel-card">
          <div className="teacher-section-title">
            <h2>{t("teacher.dashboard.academicFocus")}</h2>
            <button onClick={() => navigate("/teacher/study-guides")}>{t("teacher.actions.createGuide")}</button>
          </div>
          <div className="teacher-focus-list">
            <div>
              <span>{t("teacher.dashboard.mostStudied")}</span>
              <strong>{teacherDashboardStats.mostUsedModel}</strong>
            </div>
            <div>
              <span>{t("teacher.dashboard.nextClass")}</span>
              <strong>{teacherLessonPlans[0].title}</strong>
            </div>
            <div>
              <span>{t("teacher.dashboard.pendingNotes")}</span>
              <strong>{teacherAnatomicalNotes.length} {t("teacher.common.notes")}</strong>
            </div>
          </div>
        </Card>
      </div>
    </TeacherPageShell>
  );
}

function ModelsSection({ navigate }) {
  const { t } = useLanguage();

  return (
    <TeacherPageShell section="models">
      <div className="teacher-model-grid">
        {mockModels.map(model => {
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
                <button className="viewer-primary-button" onClick={() => navigate(model.id === "coracao-humano-superficial" ? `/viewer/${model.id}` : `/models/${model.id}`)}>{t("teacher.actions.openModel")}</button>
                <button className="viewer-secondary-button" onClick={() => navigate("/teacher/study-guides")}>{t("teacher.actions.addToGuide")}</button>
                <button className="viewer-secondary-button" onClick={() => navigate("/teacher/lessons")}>{t("teacher.actions.useInClass")}</button>
                <button className="viewer-secondary-button" onClick={() => navigate("/teacher/anatomical-notes")}>{t("teacher.actions.registerNote")}</button>
              </div>
            </article>
          );
        })}
      </div>
    </TeacherPageShell>
  );
}

function ClassesSection() {
  const { t } = useLanguage();
  return (
    <TeacherPageShell section="classes">
      <div className="teacher-class-grid">
        {teacherClasses.map(item => (
          <article key={item.id} className="teacher-class-detail-card">
            <span className="badge badge-gold">{item.semester}</span>
            <h2>{item.name}</h2>
            <p>{item.course} · {item.performance}</p>
            <div className="teacher-detail-grid">
              <span><strong>{item.students}</strong>{t("teacher.common.students")}</span>
              <span><strong>{item.averageProgress}%</strong>{t("teacher.common.progress")}</span>
              <span><strong>{item.totalStudyHours}h</strong>{t("teacher.common.studyTime")}</span>
              <span><strong>{item.lastActivity}</strong>{t("teacher.common.lastActivity")}</span>
            </div>
            <ProgressBar value={item.averageProgress} />
            <div className="teacher-chip-list">
              {item.recommendedModels.map(model => <span key={model}>{model}</span>)}
            </div>
          </article>
        ))}
      </div>
    </TeacherPageShell>
  );
}

function StudentsSection() {
  const { t } = useLanguage();
  return (
    <TeacherPageShell section="students">
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
              {teacherStudents.map(student => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.registration}</td>
                  <td>{student.className}</td>
                  <td>{student.lastAccess}</td>
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
      </Card>
    </TeacherPageShell>
  );
}

function StudyGuidesSection() {
  const { t } = useLanguage();
  return (
    <TeacherPageShell section="study-guides">
      <div className="teacher-toolbar">
        <button className="viewer-primary-button">{t("teacher.actions.createGuide")}</button>
        <button className="viewer-secondary-button">{t("teacher.actions.exportGuide")}</button>
      </div>
      <div className="teacher-card-grid">
        {teacherStudyGuides.map(guide => (
          <article key={guide.id} className="teacher-resource-card">
            <span className="badge badge-teal">{guide.status}</span>
            <h2>{guide.title}</h2>
            <p>{guide.description}</p>
            <small>{guide.className} · {guide.dueDate}</small>
            <div className="teacher-chip-list">
              {guide.models.map(model => <span key={model}>{model}</span>)}
            </div>
            <ul>
              {guide.objectives.map(objective => <li key={objective}>{objective}</li>)}
            </ul>
            <strong>{guide.completedStudents} {t("teacher.studyGuides.completedStudents")}</strong>
          </article>
        ))}
      </div>
    </TeacherPageShell>
  );
}

function LessonsSection() {
  const { t } = useLanguage();
  return (
    <TeacherPageShell section="lessons">
      <div className="teacher-toolbar">
        <button className="viewer-primary-button">{t("teacher.actions.createLesson")}</button>
      </div>
      <div className="teacher-card-grid">
        {teacherLessonPlans.map(lesson => (
          <article key={lesson.id} className="teacher-resource-card">
            <span className="badge badge-gold">{lesson.date}</span>
            <h2>{lesson.title}</h2>
            <p>{lesson.className}</p>
            <div className="teacher-chip-list">
              {lesson.models.map(model => <span key={model}>{model}</span>)}
            </div>
            <h3>{t("teacher.lessons.keyStructures")}</h3>
            <ul>{lesson.keyStructures.map(item => <li key={item}>{item}</li>)}</ul>
            <h3>{t("teacher.lessons.objectives")}</h3>
            <ul>{lesson.objectives.map(item => <li key={item}>{item}</li>)}</ul>
            <small>{lesson.notes}</small>
          </article>
        ))}
      </div>
    </TeacherPageShell>
  );
}

function NotesSection() {
  const { t } = useLanguage();
  return (
    <TeacherPageShell section="anatomical-notes">
      <div className="teacher-toolbar">
        <button className="viewer-primary-button">{t("teacher.actions.newNote")}</button>
      </div>
      <div className="teacher-card-grid">
        {teacherAnatomicalNotes.map(note => (
          <article key={note.id} className="teacher-resource-card">
            <span className={`teacher-priority teacher-priority--${note.priority}`}>{note.priority}</span>
            <h2>{note.model}</h2>
            <p>{note.structure} · {note.type}</p>
            <strong>{note.description}</strong>
            <small>{note.status}</small>
          </article>
        ))}
      </div>
    </TeacherPageShell>
  );
}

function ReportsSection() {
  const { t } = useLanguage();
  return (
    <TeacherPageShell section="reports">
      <div className="teacher-report-grid">
        <Card className="premium-panel-card">
          <h2>{t("teacher.reports.studyTimeByClass")}</h2>
          <MiniBarChart data={teacherReports.classStudyTime} />
        </Card>
        <Card className="premium-panel-card">
          <h2>{t("teacher.reports.weeklyEvolution")}</h2>
          <MiniBarChart data={teacherReports.weeklyEvolution} />
        </Card>
        <Card className="premium-panel-card">
          <h2>{t("teacher.reports.systemPerformance")}</h2>
          <MiniBarChart data={teacherReports.systemPerformance} />
        </Card>
        <Card className="premium-panel-card">
          <h2>{t("teacher.reports.modelRanking")}</h2>
          <div className="teacher-ranking-list">
            {teacherReports.modelRanking.map((item, index) => (
              <div key={item.model}>
                <span>{index + 1}</span>
                <strong>{item.model}</strong>
                <small>{item.accesses} {t("models.accesses")}</small>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </TeacherPageShell>
  );
}

function ProfileSection() {
  const { t } = useLanguage();
  return (
    <TeacherPageShell section="profile">
      <Card className="premium-panel-card teacher-profile-card">
        <span className="badge badge-teal">{teacherProfile.department}</span>
        <h2>{teacherProfile.name}</h2>
        <p>{teacherProfile.email}</p>
        <p>{teacherProfile.institution} · {teacherProfile.campus}</p>
        <div className="teacher-chip-list">
          {teacherProfile.specialties.map(item => <span key={item}>{item}</span>)}
        </div>
        <small>{t("teacher.profile.permissions")}</small>
      </Card>
    </TeacherPageShell>
  );
}

export default function Teacher({ section = "dashboard", navigate }) {
  if (section === "models") return <ModelsSection navigate={navigate} />;
  if (section === "classes") return <ClassesSection />;
  if (section === "students") return <StudentsSection />;
  if (section === "study-guides") return <StudyGuidesSection />;
  if (section === "lessons" || section === "classes-plans") return <LessonsSection />;
  if (section === "anatomical-notes") return <NotesSection />;
  if (section === "reports") return <ReportsSection />;
  if (section === "profile") return <ProfileSection />;
  return <DashboardSection navigate={navigate} />;
}
