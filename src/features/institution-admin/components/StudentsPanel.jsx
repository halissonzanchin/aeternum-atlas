import { useState } from "react";
import Card from "../../../components/Card/Card";
import Button from "../../../components/Button/Button";
import { useLanguage } from "../../../../context/LanguageContext";
import { institutionProfile } from "../../../../data/mockInstitutionalAnalytics";
import { trackEvent } from "../../../../services/analytics/analyticsService";
import { downloadCsv } from "../utils/exportCsv";
import { useStudentFilters } from "../hooks/useStudentFilters";
import AdminTitle from "./AdminTitle";

export default function StudentsPanel({ notify }) {
  const { t } = useLanguage();
  const {
    query, setQuery,
    status, setStatus,
    course, setCourse,
    semester, setSemester,
    activity, setActivity,
    courses, semesters,
    visibleStudents
  } = useStudentFilters();

  function exportStudents() {
    const rows = [
      [
        t("institutionAdmin.name"),
        t("institutionAdmin.email"),
        t("institutionAdmin.registration"),
        t("institutionAdmin.course"),
        t("institutionAdmin.semester"),
        t("institutionAdmin.status"),
        t("institutionAdmin.createdAt"),
        t("institutionAdmin.lastAccess"),
        t("institutionAdmin.accesses"),
        t("institutionAdmin.studiedModels"),
        t("institutionAdmin.time")
      ],
      ...visibleStudents.map(student => [
        student.name,
        student.email,
        student.registration,
        student.course,
        student.semester,
        student.status,
        student.createdAt.slice(0, 10),
        student.lastAccessAt || t("institutionAdmin.noAccess"),
        student.totalAccesses,
        student.modelsStudied,
        `${student.studyMinutes} min`
      ])
    ];
    downloadCsv("aeternum-alunos-institucionais.csv", rows);
    trackEvent({ eventType: "export_csv", role: "institution_admin", institutionId: institutionProfile.id, metadata: { report: "students", rows: visibleStudents.length } });
    notify(t("institutionAdmin.csvExported"));
  }

  return (
    <>
      <AdminTitle title={t("institutionAdmin.studentsTitle")} text={t("institutionAdmin.studentsText")} />
      <Card className="mb-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70 md:col-span-2" placeholder={t("institutionAdmin.searchStudent")} value={query} onChange={event => setQuery(event.target.value)} />
          <select className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70" value={status} onChange={event => setStatus(event.target.value)}>
            <option value="Todos">{t("institutionAdmin.allStatuses")}</option>
            <option>ativo</option>
            <option>inativo</option>
            <option>pendente</option>
            <option>bloqueado</option>
          </select>
          <select className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70" value={course} onChange={event => setCourse(event.target.value)}>
            <option value="Todos">{t("institutionAdmin.allCourses")}</option>
            {courses.map(item => <option key={item}>{item}</option>)}
          </select>
          <select className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70" value={semester} onChange={event => setSemester(event.target.value)}>
            <option value="Todos">{t("institutionAdmin.allSemesters")}</option>
            {semesters.map(item => <option key={item}>{item}</option>)}
          </select>
          <select className="min-h-11 rounded-2xl border border-white/10 bg-blackDeep/60 px-4 text-clinicalWhite outline-none focus:border-techTeal/70" value={activity} onChange={event => setActivity(event.target.value)}>
            <option value="Todos">{t("institutionAdmin.allActivity")}</option>
            <option value="ativo">{t("institutionAdmin.withAccess")}</option>
            <option value="inativo">{t("institutionAdmin.withoutAccess")}</option>
          </select>
          <Button variant="outline" onClick={exportStudents}>{t("institutionAdmin.exportData")}</Button>
        </div>
      </Card>
      <Card className="table-card p-0">
        <div className="table-scroll">
          <table className="admin-table text-left text-sm">
            <thead><tr>{[
              t("institutionAdmin.name"),
              t("institutionAdmin.email"),
              t("institutionAdmin.registration"),
              t("institutionAdmin.course"),
              t("institutionAdmin.semester"),
              t("institutionAdmin.status"),
              t("institutionAdmin.createdAt"),
              t("institutionAdmin.lastAccess"),
              t("institutionAdmin.accesses"),
              t("institutionAdmin.studiedModels"),
              t("institutionAdmin.time"),
              t("institutionAdmin.actions")
            ].map(item => <th key={item} className="border-b border-white/10 bg-agedGold/5 p-4 uppercase tracking-[0.08em] text-agedGold">{item}</th>)}</tr></thead>
            <tbody className="[&_td]:border-b [&_td]:border-white/10 [&_td]:p-4 [&_td]:text-slate-200">
              {visibleStudents.map(student => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.registration}</td>
                  <td>{student.course}</td>
                  <td>{student.semester}</td>
                  <td><span className={`badge ${student.status === "ativo" ? "badge-active" : "badge-teal"}`}>{student.status}</span></td>
                  <td>{student.createdAt.slice(0, 10)}</td>
                  <td>{student.lastAccessAt || t("institutionAdmin.noAccess")}</td>
                  <td>{student.totalAccesses}</td>
                  <td>{student.modelsStudied}</td>
                  <td>{student.studyMinutes} min</td>
                  <td className="flex flex-wrap gap-2">
                    <Button variant="ghost" className="min-h-8 px-3">{t("institutionAdmin.view")}</Button>
                    <Button variant="outline" className="min-h-8 px-3">{student.status === "bloqueado" ? t("institutionAdmin.unblock") : t("institutionAdmin.block")}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
