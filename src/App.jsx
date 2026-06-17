import { useEffect, useMemo, useState } from "react";
import Button from "./components/Button/Button";
import AppLayout from "./components/Layout/AppLayout";
import Modal from "./components/Modal/Modal";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Card from "./components/Card/Card";
import { getCurrentUser, logoutUser, restoreAuthSession } from "./services/auth/authService";
import { isAdminPath, isPrivatePath } from "./utils/accessControl";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Atlas from "./pages/atlas/Atlas";
import Models from "./pages/models/Models";
import ModelDetail from "./pages/model-detail/ModelDetail";
import Viewer from "./pages/viewer/Viewer";
import License from "./pages/license/License";
import Profile from "./pages/profile/Profile";
import Settings from "./pages/settings/Settings";
import Admin from "./pages/admin/Admin";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import InstitutionDashboard from "./pages/institution/InstitutionDashboard";
import RectorDashboard from "./pages/rector/RectorDashboard";
import CoordinatorDashboard from "./pages/coordinator/CoordinatorDashboard";
import Teacher from "./pages/teacher/Teacher";
import StudyAgendaPage from "./pages/student/StudyAgendaPage";
import AnatomicalQuizzesPage from "./pages/student/AnatomicalQuizzesPage";
import { canonicalSuperAdminPath, getAdminNavigationItemByPath } from "./config/adminNavigation";
import { useLanguage } from "./context/LanguageContext";

function currentPath() {
  return window.location.pathname || "/";
}

function SimpleModule({ title, text, titleKey, textKey }) {
  const { t } = useLanguage();
  const resolvedTitle = titleKey ? t(titleKey) : title;
  const resolvedText = textKey ? t(textKey) : text;
  return (
    <>
      <div className="page-title">
        <p className="eyebrow">{t("common.module")}</p>
        <h1 className="display-title">{resolvedTitle}</h1>
        <p className="mt-3 text-textMuted">{resolvedText}</p>
      </div>
      <Card className="max-w-3xl">
        <span className="badge badge-active">{t("common.available")}</span>
        <h2 className="mt-5 text-xl font-bold text-clinicalWhite">{resolvedTitle}</h2>
        <p className="mt-3 text-textMuted">{resolvedText}</p>
      </Card>
    </>
  );
}

export default function App() {
  const { t } = useLanguage();
  const [path, setPath] = useState(currentPath());
  const [user, setUser] = useState(() => getCurrentUser());
  const [authReady, setAuthReady] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    let mounted = true;

    restoreAuthSession()
      .then(restoredUser => {
        if (mounted) setUser(restoredUser);
      })
      .finally(() => {
        if (mounted) setAuthReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function navigate(to) {
    window.history.pushState({}, "", to);
    setPath(to);
  }

  function replace(to) {
    window.history.replaceState({}, "", to);
    setPath(to);
  }

  function notify(message) {
    setToast(message);
  }

  async function handleLogout() {
    await logoutUser();
    setUser(null);
    navigate("/");
  }

  function showInstitutionalModal() {
    setModal({
      title: t("errors.moduleTitle"),
      body: t("errors.moduleBody"),
      action: t("errors.viewLicense")
    });
  }

  const content = useMemo(() => {
    const canonicalAdminPath = canonicalSuperAdminPath(path);
    if (canonicalAdminPath && canonicalAdminPath !== path) {
      return <RedirectTo to={canonicalAdminPath} replace={replace} />;
    }

    if ((user?.role === "super_admin" || user?.role === "admin") && (path === "/admin" || path.startsWith("/admin/"))) {
      const canonicalItem = getAdminNavigationItemByPath(path);
      if (canonicalItem?.path && canonicalItem.path !== path) {
        return <RedirectTo to={canonicalItem.path} replace={replace} />;
      }
    }

    if (path === "/") return <Home navigate={navigate} />;
    if (path === "/login") return <Login navigate={navigate} onAuth={setUser} />;
    if (path === "/register") return <Register navigate={navigate} onAuth={setUser} />;

    if (!authReady && (isPrivatePath(path) || isAdminPath(path))) {
      return <AuthBootstrap />;
    }
    if (path.startsWith("/viewer/")) {
      return (
        <ProtectedRoute user={user} path={path} navigate={navigate}>
          <Viewer id={path.split("/").pop()} user={user} navigate={navigate} notify={notify} onLogout={handleLogout} />
        </ProtectedRoute>
      );
    }
    if (path.startsWith("/teacher/viewer/")) {
      return (
        <ProtectedRoute user={user} path={path} navigate={navigate}>
          <Viewer id={path.split("/").pop()} user={user} navigate={navigate} notify={notify} onLogout={handleLogout} />
        </ProtectedRoute>
      );
    }

    const privatePage = renderPrivatePage(path, { user, navigate, onAuth: setUser, notify, showInstitutionalModal, onLogout: handleLogout });

    if (isPrivatePath(path) || isAdminPath(path) || privatePage) {
      return (
        <ProtectedRoute user={user} adminOnly={isAdminPath(path)} path={path} navigate={navigate}>
          <AppLayout user={user} path={path} navigate={navigate} onLogout={handleLogout}>
            {privatePage || <NotFound navigate={navigate} />}
          </AppLayout>
        </ProtectedRoute>
      );
    }

    return <NotFound navigate={navigate} />;
  }, [authReady, path, user, t]);

  return (
    <>
      {content}
      <Modal
        open={Boolean(modal)}
        title={modal?.title}
        onClose={() => setModal(null)}
        actions={<Button variant="teal" onClick={() => { setModal(null); navigate("/license"); }}>{modal?.action}</Button>}
      >
        {modal?.body}
      </Modal>
      {toast ? <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border border-techTeal/30 bg-navyDeep/95 p-4 text-sm text-clinicalWhite shadow-premium backdrop-blur-xl">{toast}</div> : null}
    </>
  );
}

function RedirectTo({ to, replace }) {
  useEffect(() => {
    replace(to);
  }, [replace, to]);

  return null;
}

function AuthBootstrap() {
  const { t } = useLanguage();

  return (
    <main className="grid min-h-screen place-items-center p-5">
      <Card className="max-w-lg text-center">
        <p className="eyebrow">{t("common.loading")}</p>
        <h1 className="display-title">{t("common.sessionValidationTitle")}</h1>
        <p className="mt-4 text-textMuted">{t("common.sessionValidationBody")}</p>
      </Card>
    </main>
  );
}

function renderPrivatePage(path, context) {
  const { user, navigate, onAuth, notify, showInstitutionalModal, onLogout } = context;

  if (path === "/dashboard") {
    return <RedirectTo to="/student/home" replace={(to) => navigate(to)} />;
  }
  if (path === "/student/home") return <Dashboard user={user} navigate={navigate} showInstitutionalModal={showInstitutionalModal} />;
  if (path === "/rector/dashboard") return <RectorDashboard />;
  if (path === "/coordinator/dashboard") return <CoordinatorDashboard />;
  if (path === "/institution/dashboard") return <InstitutionDashboard />;
  if (path === "/admin/dashboard") return <SuperAdminDashboard />;
  if (path === "/models") return <Models user={user} navigate={navigate} onLocked={showInstitutionalModal} />;
  if (path.startsWith("/models/")) return <ModelDetail id={path.split("/").pop()} user={user} navigate={navigate} />;
  if (path === "/license") return <License user={user} onAuth={onAuth} navigate={navigate} notify={notify} />;
  if (path === "/profile") return <Profile user={user} onAuth={onAuth} notify={notify} />;
  if (path === "/settings") return <Settings user={user} onLogout={onLogout} notify={notify} />;
  if (path === "/history") return <SimpleModule titleKey="modules.historyTitle" textKey="modules.historyText" />;
  if (path === "/favorites") return <SimpleModule titleKey="modules.favoritesTitle" textKey="modules.favoritesText" />;
  if (path === "/progress") return <SimpleModule titleKey="studentHome.evolutionTitle" textKey="studentHome.evolutionSubtitle" />;
  if (path === "/study-agenda") return <StudyAgendaPage navigate={navigate} />;
  if (path === "/flashcards") return <SimpleModule titleKey="studentHome.tools.flashcards.title" textKey="studentHome.tools.flashcards.description" />;
  if (path === "/quizzes") return <AnatomicalQuizzesPage navigate={navigate} />;
  if (path === "/summaries") return <SimpleModule titleKey="studentHome.tools.summaries.title" textKey="studentHome.tools.summaries.description" />;
  if (path === "/guided-study") return <SimpleModule titleKey="studentHome.tools.guidedStudy.title" textKey="studentHome.tools.guidedStudy.description" />;
  if (path === "/ai-tutor") return <SimpleModule titleKey="studentHome.tools.aiTutor.title" textKey="studentHome.tools.aiTutor.description" />;
  if (path === "/review") return <SimpleModule titleKey="studentHome.tools.quickReview.title" textKey="studentHome.tools.quickReview.description" />;
  if (path === "/study-lists") return <SimpleModule titleKey="modules.studyListsTitle" textKey="modules.studyListsText" />;
  if (path === "/classes") return <SimpleModule titleKey="modules.classesTitle" textKey="modules.classesText" />;
  if (path === "/recommendations") return <SimpleModule titleKey="modules.recommendationsTitle" textKey="modules.recommendationsText" />;
  if (path === "/academic-reports") return <SimpleModule titleKey="modules.academicReportsTitle" textKey="modules.academicReportsText" />;
  if (path === "/atlas" || path.startsWith("/atlas/")) return <Atlas path={path} navigate={navigate} />;
  if (path === "/radiology") return <SimpleModule titleKey="modules.radiologyTitle" textKey="modules.radiologyText" />;
  if (path === "/videos") return <SimpleModule titleKey="modules.videosTitle" textKey="modules.videosText" />;
  if (path === "/courses") return <SimpleModule titleKey="modules.coursesTitle" textKey="modules.coursesText" />;
  if (path === "/teacher" || path === "/teacher/dashboard" || path === "/professor/dashboard") return <Teacher section="dashboard" user={user} navigate={navigate} />;
  if (path === "/teacher/models" || path === "/professor/models") return <Teacher section="models" user={user} navigate={navigate} />;
  if (path === "/teacher/atlas" || path.startsWith("/teacher/atlas/")) {
    const atlasPath = path.replace(/^\/teacher\/atlas/, "/atlas");
    const teacherAtlasNavigate = (to) => navigate(to.replace(/^\/atlas/, "/teacher/atlas"));
    return <Atlas path={atlasPath} navigate={teacherAtlasNavigate} />;
  }
  if (path.startsWith("/teacher/")) return <Teacher section={path.split("/")[2] || "dashboard"} user={user} navigate={navigate} />;
  if (path === "/institution-admin") return <Admin section="overview" path={path} navigate={navigate} notify={notify} />;
  if (path.startsWith("/institution-admin/")) return <Admin section={path.split("/")[2] || "overview"} path={path} navigate={navigate} notify={notify} />;
  if (path === "/super-admin") return <Admin section="overview" path={path} navigate={navigate} notify={notify} />;
  if (path.startsWith("/super-admin/")) return <Admin section={path.split("/")[2] || "overview"} path={path} navigate={navigate} notify={notify} />;
  if ((path === "/admin" || path.startsWith("/admin/")) && !["super_admin", "admin", "institution_admin"].includes(user?.role)) {
    return <NotFound navigate={navigate} />;
  }
  if (path === "/admin") return <Admin section="dashboard" path={path} navigate={navigate} notify={notify} />;
  if (path.startsWith("/admin/")) return <Admin section={path.split("/")[2] || "dashboard"} path={path} navigate={navigate} notify={notify} />;
  return null;
}

function NotFound({ navigate }) {
  const { t } = useLanguage();
  return (
    <main className="grid min-h-screen place-items-center p-5">
      <Card className="max-w-lg text-center">
        <h1 className="display-title">{t("errors.notFoundTitle")}</h1>
        <p className="mt-4 text-textMuted">{t("errors.notFoundText")}</p>
        <Button className="mt-6" variant="primary" onClick={() => navigate("/")}>{t("navigation.home")}</Button>
      </Card>
    </main>
  );
}
