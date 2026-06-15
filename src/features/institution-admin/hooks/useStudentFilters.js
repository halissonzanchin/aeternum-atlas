import { useState, useMemo } from "react";
import { mockInstitutionStudents } from "../../../data/mockInstitutionalAnalytics";

export function useStudentFilters() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [course, setCourse] = useState("Todos");
  const [semester, setSemester] = useState("Todos");
  const [activity, setActivity] = useState("Todos");

  const courses = useMemo(() => Array.from(new Set(mockInstitutionStudents.map(student => student.course).filter(Boolean))), []);
  const semesters = useMemo(() => Array.from(new Set(mockInstitutionStudents.map(student => student.semester).filter(Boolean))), []);

  const visibleStudents = useMemo(() => {
    return mockInstitutionStudents.filter(student => {
      const matchesQuery = [student.name, student.email, student.registration].join(" ").toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "Todos" || student.status === status;
      const matchesCourse = course === "Todos" || student.course === course;
      const matchesSemester = semester === "Todos" || student.semester === semester;
      const matchesActivity = activity === "Todos" || (activity === "ativo" ? student.totalAccesses > 0 : student.totalAccesses === 0);
      return matchesQuery && matchesStatus && matchesCourse && matchesSemester && matchesActivity;
    });
  }, [query, status, course, semester, activity]);

  return {
    query, setQuery,
    status, setStatus,
    course, setCourse,
    semester, setSemester,
    activity, setActivity,
    courses, semesters,
    visibleStudents
  };
}
