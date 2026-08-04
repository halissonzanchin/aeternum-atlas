import { isAdminRouteActive } from "../../config/adminNavigation";
import { navigationForRole } from "../../config/roleNavigation";

export function iconForShellRoute(href = "") {
  if (href.includes("favorite")) return "favorite";
  if (href.includes("history")) return "clock";
  if (href.includes("profile")) return "user";
  if (href.includes("setting") || href.includes("help")) return "settings";
  if (href.includes("video") || href.includes("lesson")) return "camera";
  if (href.includes("course") || href.includes("guide") || href.includes("report")) return "note";
  if (href.includes("atlas") || href.includes("model") || href.includes("twin")) return "layers";
  if (href.includes("dashboard") || href.includes("home") || href === "/super-admin") return "home";
  return "library";
}

export function roleTranslationKey(role = "") {
  const normalized = {
    professor: "teacher",
    coordenador: "coordinator",
    reitor: "rector",
    institution_admin: "institutionAdmin",
    super_admin: "superAdmin"
  }[role] || role || "student";

  return `settings.roles.${normalized}`;
}

export function shellNavigationForRole(role, path, t) {
  return navigationForRole(role).map(item => {
    const administrative = !Array.isArray(item);
    const href = administrative ? item.path : item[0];
    const labelKey = administrative
      ? (item.sidebarLabelKey || item.labelKey)
      : item[1];
    const fallback = administrative
      ? (item.sidebarLabel || item.label || "Módulo")
      : "Módulo";
    const translated = labelKey ? t(labelKey) : fallback;
    const label = translated === labelKey ? fallback : translated;
    const active = administrative
      ? isAdminRouteActive(path, item)
      : path === href || (href !== "/dashboard" && path.startsWith(`${href}/`));

    return {
      active,
      href,
      icon: iconForShellRoute(href),
      label
    };
  });
}

const secondaryRouteKeys = Object.freeze({
  "/progress": "studentHome.evolutionTitle",
  "/study-agenda": "studentHome.tools.agenda.title",
  "/flashcards": "studentHome.tools.flashcards.title",
  "/quizzes": "studentHome.tools.quizzes.title",
  "/summaries": "studentHome.tools.summaries.title",
  "/guided-study": "studentHome.tools.guidedStudy.title",
  "/ai-tutor": "studentHome.tools.aiTutor.title",
  "/review": "studentHome.tools.quickReview.title",
  "/study-lists": "navigation.studyLists",
  "/classes": "navigation.classes",
  "/recommendations": "navigation.recommendations",
  "/academic-reports": "navigation.academicReports",
  "/radiology": "navigation.radiology",
  "/lessons": "teacher.navigation.lessons"
});

function secondaryShellRoute(path, t) {
  const matchingPath = Object.keys(secondaryRouteKeys)
    .sort((a, b) => b.length - a.length)
    .find(href => path === href || path.startsWith(`${href}/`));
  if (!matchingPath) return null;
  const labelKey = secondaryRouteKeys[matchingPath];
  const translated = t?.(labelKey);
  return {
    active: true,
    href: matchingPath,
    icon: iconForShellRoute(matchingPath),
    label: translated && translated !== labelKey ? translated : "Aeternum Atlas"
  };
}

export function currentShellRoute(items, path, t) {
  return items.find(item => item.active)
    || items.find(item => path.startsWith(`${item.href}/`))
    || secondaryShellRoute(path, t)
    || items[0]
    || { href: path, icon: "library", label: "Aeternum Atlas" };
}
