import { getAdminNavigationItems } from "./adminNavigation.js";
import { governanceNavigation } from "./governanceRoutes.js";

const studentMenu = Object.freeze([
  ["/student/home", "navigation.home"],
  ["/models", "navigation.models3d"],
  ["/atlas", "navigation.anatomicalAtlas"],
  ["/videos", "navigation.videos"],
  ["/courses", "navigation.courses"],
  ["/history", "navigation.studyHistory"],
  ["/favorites", "navigation.favorites"],
  ["/profile", "navigation.profile"],
  ["/settings", "navigation.help"]
]);

const professorMenu = Object.freeze([
  ["/professor/dashboard", "navigation.home"],
  ["/professor/models", "navigation.models3d"],
  ["/teacher/atlas", "navigation.anatomicalAtlas"],
  ["/teacher/classes", "teacher.navigation.classes"],
  ["/teacher/students", "teacher.navigation.students"],
  ["/teacher/study-guides", "teacher.navigation.studyGuides"],
  ["/teacher/lessons", "teacher.navigation.lessons"],
  ["/teacher/anatomical-notes", "teacher.navigation.anatomicalNotes"],
  ["/teacher/reports", "teacher.navigation.academicReports"],
  ["/teacher/profile", "navigation.profile"],
  ["/settings", "navigation.help"]
]);

const institutionMenu = Object.freeze([
  ["/institution/dashboard", "navigation.home"],
  ...getAdminNavigationItems("/admin").filter(item => item.id !== "overview")
]);

function normalizedRole(role = "") {
  if (role === "professor") return "teacher";
  if (role === "coordenador") return "coordinator";
  if (role === "reitor") return "rector";
  if (role === "admin") return "institution_admin";
  return role;
}

export function navigationForRole(role) {
  const normalized = normalizedRole(role);
  if (normalized === "institution_admin") return institutionMenu;
  if (normalized === "super_admin") return getAdminNavigationItems("/super-admin");
  if (normalized === "teacher") return professorMenu;
  if (normalized === "rector") return governanceNavigation("rector");
  if (normalized === "coordinator") return governanceNavigation("coordinator");
  return studentMenu;
}

export function homePathForRole(role) {
  const normalized = normalizedRole(role);
  if (normalized === "institution_admin") return "/institution/dashboard";
  if (normalized === "super_admin") return "/super-admin";
  if (normalized === "teacher") return "/professor/dashboard";
  if (normalized === "rector") return "/rector/dashboard";
  if (normalized === "coordinator") return "/coordinator/dashboard";
  return "/student/home";
}
