import AeternumLogo from "../AeternumLogo";
import Button from "../Button/Button";
import { useLanguage } from "../../context/LanguageContext";
import { getAdminNavigationItems, isAdminRouteActive } from "../../config/adminNavigation";

const studentMenu = [
  ["/student/home", "navigation.home"],
  ["/models", "navigation.models3d"],
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

function menuForRole(role) {
  if (role === "institution_admin") return institutionMenu;
  if (role === "super_admin" || role === "admin") return superAdminMenu;
  if (role === "teacher" || role === "professor") return professorMenu;
  if (role === "rector" || role === "reitor") return rectorMenu;
  if (role === "coordinator" || role === "coordenador") return coordinatorMenu;
  return studentMenu;
}

function homeForRole(role) {
  if (role === "institution_admin") return "/institution/dashboard";
  if (role === "super_admin" || role === "admin") return "/admin/dashboard";
  if (role === "teacher" || role === "professor") return "/professor/dashboard";
  if (role === "rector" || role === "reitor") return "/rector/dashboard";
  if (role === "coordinator" || role === "coordenador") return "/coordinator/dashboard";
  return "/student/home";
}

export default function Sidebar({ path, user, navigate, onLogout }) {
  const { t } = useLanguage();
  const menu = menuForRole(user?.role);

  return (
    <aside className="app-sidebar hidden lg:flex">
      <button onClick={() => navigate(homeForRole(user?.role))} className="sidebar-brand sidebar-brand--stacked text-left" aria-label={`${t("common.appName")} dashboard`}>
        <AeternumLogo variant="symbol" size="md" theme="dark" />
        <span className="sidebar-brand-title">AETERNUM ATLAS</span>
      </button>

      <nav className="sidebar-nav">
        {menu.map(item => {
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
              className={`relative flex items-center overflow-hidden rounded-2xl px-4 py-3 text-left text-sm font-bold transition-all duration-300 hover:translate-x-1 ${active ? "bg-techTeal/10 text-clinicalWhite shadow-[inset_0_0_0_1px_rgba(47,184,181,0.3),0_4px_15px_rgba(47,184,181,0.1)]" : "text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"}`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-1/2 w-[3px] -translate-y-1/2 rounded-r-full bg-techTeal shadow-[0_0_10px_rgba(47,184,181,0.8)]" />
              )}
              <span className="truncate w-full atlas-nowrap-label">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <Button variant="ghost" className="w-full" onClick={onLogout}>{t("navigation.logout")}</Button>
      </div>
    </aside>
  );
}
