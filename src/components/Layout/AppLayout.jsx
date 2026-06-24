import Sidebar from "../Sidebar/Sidebar";
import LanguageSelector from "../LanguageSelector";
import { useLanguage } from "../../context/LanguageContext";
import { getAdminNavigationItems, isAdminRouteActive } from "../../config/adminNavigation";

const studentMenu = [
  ["/student/home", "navigation.home"],
  ["/models", "navigation.models"],
  ["/atlas", "navigation.anatomicalAtlas"],
  ["/videos", "navigation.videos"],
  ["/courses", "navigation.courses"],
  ["/history", "navigation.studyHistory"],
  ["/favorites", "navigation.favorites"],
  ["/profile", "navigation.profile"],
  ["/settings", "navigation.help"]
];

const institutionMenu = [
  ["/institution/dashboard", "navigation.home"],
  ...getAdminNavigationItems("/admin")
];

const rectorMenu = [
  ["/rector/dashboard", "navigation.home"],
  ["/rector/indicators", "Indicadores Institucionais"],
  ["/rector/engagement", "Engajamento"],
  ["/rector/utilization", "Utilização"],
  ["/rector/roi", "ROI Acadêmico"]
];

const coordinatorMenu = [
  ["/coordinator/dashboard", "navigation.home"],
  ["/coordinator/professors", "Professores"],
  ["/coordinator/classes", "Turmas"],
  ["/coordinator/disciplines", "Disciplinas"],
  ["/coordinator/heatmaps", "Heatmaps"],
  ["/coordinator/risk", "Alunos em Risco"]
];

const professorMenu = [
  ["/teacher/dashboard", "navigation.home"],
  ["/teacher/models", "navigation.models3d"],
  ["/teacher/atlas", "navigation.anatomicalAtlas"],
  ["/teacher/classes", "teacher.navigation.classes"],
  ["/teacher/students", "teacher.navigation.students"],
  ["/teacher/study-guides", "teacher.navigation.studyGuides"],
  ["/teacher/lessons", "teacher.navigation.lessons"],
  ["/teacher/anatomical-notes", "teacher.navigation.anatomicalNotes"],
  ["/teacher/reports", "teacher.navigation.academicReports"],
  ["/teacher/profile", "navigation.profile"],
  ["/settings", "navigation.help"]
];

const superAdminMenu = [
  ["/admin/dashboard", "navigation.home"],
  ...getAdminNavigationItems("/super-admin")
];

function mobileMenuForRole(role) {
  if (role === "institution_admin") return institutionMenu;
  if (role === "super_admin" || role === "admin") return superAdminMenu;
  if (role === "teacher" || role === "professor") return professorMenu;
  if (role === "rector" || role === "reitor") return rectorMenu;
  if (role === "coordinator" || role === "coordenador") return coordinatorMenu;
  return studentMenu;
}

export default function AppLayout({ user, path, navigate, onLogout, children }) {
  const { t } = useLanguage();
  const mobileMenu = mobileMenuForRole(user?.role);

  return (
    <div className="app-shell">
      <Sidebar user={user} path={path} navigate={navigate} onLogout={onLogout} />
      <main className="app-main">
        <header className="topbar">
          <div className="topbar-user">
            <div className="topbar-avatar">{user?.name?.[0] || "A"}</div>
            <div className="topbar-user-text">
              <h3>{user?.name}</h3>
              <p>
                {user?.institution || t("auth.institution")} · {user?.course || t("common.academicAccess")} · {t("common.institutionalAccess")}
              </p>
            </div>
          </div>
          <div className="topbar-actions">
            <input className="topbar-search" aria-label={t("common.searchPlaceholder")} placeholder={t("common.searchPlaceholder")} />
            <LanguageSelector compact />
          </div>
        </header>

        <nav className="mobile-nav lg:hidden">
          {mobileMenu.map(item => {
            const isAdminItem = !Array.isArray(item);
            const href = isAdminItem ? item.path : item[0];
            const labelKey = item.sidebarLabelKey || item.labelKey || item.label || item.title || item.name;
            const defaultLabel = item.sidebarLabel || item.label || item.title || item.name || 'Menu';
            const translatedAdmin = labelKey ? t(labelKey) : defaultLabel;
            const label = isAdminItem 
              ? (translatedAdmin === labelKey ? defaultLabel : translatedAdmin) 
              : (item[1] ? t(item[1]) : 'Menu');
            const active = isAdminItem
              ? isAdminRouteActive(path, item)
              : path === href || (href !== "/dashboard" && path.startsWith(`${href}/`));

            return (
              <button
                key={`${href}-${label}`}
                onClick={() => navigate(href)}
                className={`shrink-0 rounded-2xl border px-3 py-2 text-sm font-bold ${active ? "border-techTeal/40 bg-techTeal/10 text-techTeal" : "border-white/10 bg-white/[0.03] text-slate-300"}`}
              >
                {label}
              </button>
            );
          })}
          <button onClick={onLogout} className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-bold text-slate-300">
            {t("navigation.logout")}
          </button>
        </nav>

        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
