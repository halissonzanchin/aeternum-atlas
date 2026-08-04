import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { navigationForRole } from "../src/config/roleNavigation.js";
import {
  canAccessRoute,
  getRouteRule
} from "../src/services/permissions/permissionService.js";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const studentPage = await readFile(new URL("../src/pages/student/StudentLearningPage.jsx", import.meta.url), "utf8");
const studentCss = await readFile(new URL("../src/pages/student/StudentLearningPage.css", import.meta.url), "utf8");
const dailyCss = await readFile(new URL("../src/styles/A26DailyExperience.css", import.meta.url), "utf8");
const teacher = await readFile(new URL("../src/pages/teacher/Teacher.jsx", import.meta.url), "utf8");
const agenda = await readFile(new URL("../src/pages/student/StudyAgendaPage.jsx", import.meta.url), "utf8");
const quizzes = await readFile(new URL("../src/pages/student/AnatomicalQuizzesPage.jsx", import.meta.url), "utf8");
const shellNavigation = await readFile(new URL("../src/components/Layout/shellNavigation.js", import.meta.url), "utf8");

const activeStudent = {
  id: "student-contract",
  role: "student",
  status: "ativo",
  institutionId: "tenant-contract"
};

const activeTeacher = {
  id: "teacher-contract",
  role: "teacher",
  status: "ativo",
  institutionId: "tenant-contract"
};

test("student primary routes no longer use the duplicated SimpleModule", () => {
  assert.doesNotMatch(app, /SimpleModule/);
  for (const [path, section] of [
    ["/videos", "videos"],
    ["/courses", "courses"],
    ["/history", "history"],
    ["/favorites", "favorites"],
    ["/progress", "progress"]
  ]) {
    assert.match(app, new RegExp(`path === "${path}"[\\s\\S]*?<StudentLearningPage section="${section}"`));
  }
});

test("student daily experience is grounded in observed account data", () => {
  assert.match(studentPage, /data-testid="a26-student-experience"/);
  assert.match(studentPage, /data-a26-source="account-observed"/);
  assert.match(studentPage, /useDashboardData\(user\)/);
  assert.match(studentPage, /getFavoriteModels\(user, models\)/);
  assert.match(studentPage, /systemProgress/);
  assert.doesNotMatch(studentPage, /getProgressBySystem\(user, models\)/);
  assert.match(studentPage, /A26EmptyState/);
  assert.match(studentPage, /Somente dados observados na conta/);
});

test("agenda and simulations declare their persisted or institutional source", () => {
  assert.match(agenda, /data-testid="a26-student-agenda"/);
  assert.match(agenda, /data-a26-source="account-persisted"/);
  assert.match(quizzes, /data-testid="a26-student-quizzes"/);
  assert.match(quizzes, /data-a26-source="institutional-catalog"/);
});

test("teacher areas use actionable empty states and real operational actions", () => {
  assert.match(teacher, /data-testid="a26-teacher-experience"/);
  assert.match(teacher, /data-a26-source="tenant-observed"/);
  assert.match(teacher, /function TeacherEmptyState\(\{ title, text, actionLabel, onAction \}\)/);
  assert.match(teacher, /action=\{actionLabel && onAction/);
  assert.match(teacher, /createTeacherClass\(user, form\)/);
  assert.match(teacher, /createTeacherStudyGuide\(user, form\)/);
  assert.match(teacher, /downloadTeacherCsv/);
});

test("phase 4 controls are touch-safe and introduce no direct blur", () => {
  assert.match(studentCss, /min-height:\s*44px/);
  assert.match(dailyCss, /min-height:\s*44px/);
  assert.match(studentCss, /@media \(max-width:\s*760px\)/);
  assert.match(dailyCss, /@media \(max-width:\s*1023px\)/);
  assert.doesNotMatch(studentCss, /(?:-webkit-)?backdrop-filter\s*:/);
  assert.doesNotMatch(dailyCss, /(?:-webkit-)?backdrop-filter\s*:/);
});

test("student and teacher navigation remain role-scoped", () => {
  const studentPaths = navigationForRole("student").map(([path]) => path);
  const teacherPaths = navigationForRole("teacher").map(([path]) => path);
  assert.ok(studentPaths.includes("/history"));
  assert.ok(studentPaths.includes("/favorites"));
  assert.ok(teacherPaths.includes("/teacher/classes"));
  assert.ok(teacherPaths.includes("/teacher/reports"));
  assert.equal(getRouteRule("/history")?.roles?.includes("student"), true);
  assert.equal(canAccessRoute(activeStudent, "/history"), true);
  assert.equal(canAccessRoute(activeTeacher, "/history"), false);
  assert.equal(canAccessRoute(activeTeacher, "/teacher/classes"), true);
  assert.equal(canAccessRoute(activeStudent, "/teacher/classes"), false);
});

test("secondary study routes remain identifiable in the shared shell", () => {
  assert.match(shellNavigation, /"\/progress": "studentHome\.evolutionTitle"/);
  assert.match(shellNavigation, /"\/study-agenda": "studentHome\.tools\.agenda\.title"/);
  assert.match(shellNavigation, /"\/quizzes": "studentHome\.tools\.quizzes\.title"/);
  assert.match(shellNavigation, /secondaryShellRoute\(path, t\)/);
});
