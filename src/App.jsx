import React, { useEffect, useMemo, useRef, useState } from "react";
import Button from "./components/Button/Button";
import AppLayout from "./components/Layout/AppLayout";
import Modal from "./components/Modal/Modal";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import { A26Button, A26Card, A26ErrorState, A26LoadingState, A26Surface } from "./components/aeternum-26";
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
import Admin from "./pages/administration/AdministrativeOperationsPage";
import RectorDashboard from "./pages/rector/RectorDashboard";
import CoordinatorDashboard from "./pages/coordinator/CoordinatorDashboard";
import { governanceSectionFromPath } from "./config/governanceRoutes";
import Teacher from "./pages/teacher/Teacher";
import StudyAgendaPage from "./pages/student/StudyAgendaPage";
import AnatomicalQuizzesPage from "./pages/student/AnatomicalQuizzesPage";
import StudentLearningPage from "./pages/student/StudentLearningPage";
import { canonicalSuperAdminPath, getAdminNavigationItems, isAdminRouteActive } from "./config/adminNavigation";
import { useLanguage } from "./context/LanguageContext";
import AtlasAITutor from "./features/dashboard/components/AtlasAITutor";
import { AtlasAITutorSessionProvider } from "./context/AtlasAITutorSessionContext";
import { AuthProvider } from "./context/AuthContext";
import { useAccountLearningSession } from "./hooks/useAccountLearningSession";

import LessonSandboxPage from "./features/lessons/LessonSandboxPage";
import LessonLibraryPage from "./features/lessons/LessonLibraryPage";
import LessonPlayerPage from "./features/lessons/LessonPlayerPage";
import LessonAdminReviewPage from "./features/lessons/admin/LessonAdminReviewPage";

function currentPath() {
  return window.location.pathname || "/";
}

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global Error Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="a26-access-page" data-testid="a26-global-error">
          <A26ErrorState
            title="Não foi possível carregar esta área"
            text={this.state.error?.message || "A interface preservou a sessão. Atualize a página para tentar novamente."}
            action={<A26Button variant="secondary" onClick={() => window.location.reload()}>Atualizar página</A26Button>}
          />
          {this.state.error?.stack && (
            <details style={{ maxWidth: '720px', margin: '16px auto', padding: '12px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f87171', fontSize: '11px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Ver detalhes do erro técnico</summary>
              <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{this.state.error.stack}</pre>
            </details>
          )}
        </main>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { t } = useLanguage();
  const [path, setPath] = useState(currentPath());
  const [user, setUser] = useState(() => getCurrentUser());
  const [authReady, setAuthReady] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const authEpochRef = useRef(0);

  useAccountLearningSession(user, authReady);

  useEffect(() => {
    const onPopState = () => setPath(currentPath());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    let mounted = true;
    const restoreEpoch = authEpochRef.current;

    restoreAuthSession()
      .then(restoredUser => {
        if (mounted && authEpochRef.current === restoreEpoch) setUser(restoredUser);
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

  function handleAuth(nextUser) {
    authEpochRef.current += 1;
    setUser(nextUser);
  }

  async function handleLogout() {
    authEpochRef.current += 1;
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

    if ((user?.role === "super_admin" || user?.role === "admin" || user?.role === "institution_admin") && (path === "/admin" || path.startsWith("/admin/"))) {
      const basePath = user?.role === "super_admin" ? "/super-admin" : "/admin";
      const canonicalItem = getAdminNavigationItems(basePath).find(item => isAdminRouteActive(path, item));
      if (canonicalItem?.path && canonicalItem.path !== path) {
        return <RedirectTo to={canonicalItem.path} replace={replace} />;
      }
    }

    if (path === "/") return <Home navigate={navigate} />;
    if (path === "/login") return <Login navigate={navigate} onAuth={handleAuth} />;
    if (path === "/register") return <Register navigate={navigate} onAuth={handleAuth} />;

    if (!authReady && (isPrivatePath(path) || isAdminPath(path))) {
      return <AuthBootstrap />;
    }
    if (path.startsWith("/atlas-viewer/")) {
      return (
        <ProtectedRoute user={user} path={path} navigate={navigate}>
          <LegacyViewerRedirect id={path.split("/").pop()} replace={replace} />
        </ProtectedRoute>
      );
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

    const privatePage = renderPrivatePage(path, { user, navigate, onAuth: handleAuth, notify, showInstitutionalModal, onLogout: handleLogout });

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

  const isPublicRoute = path === "/" || path === "/login" || path === "/register";
  const usesDedicatedViewerTutor = path.startsWith("/viewer/") || path.startsWith("/teacher/viewer/");
  const usesLegacyViewerRedirect = path.startsWith("/atlas-viewer/");
  const showGlobalTutor = authReady && Boolean(user) && !isPublicRoute && !usesDedicatedViewerTutor && !usesLegacyViewerRedirect;
  const tutorSessionIdentity = user?.id || user?.email || "anonymous";

  return (
    <AuthProvider user={user}>
      <AtlasAITutorSessionProvider key={tutorSessionIdentity} user={user}>
        <GlobalErrorBoundary>
          {content}
          {showGlobalTutor ? (
            <AtlasAITutor path={path} />
          ) : null}
          <Modal
            open={Boolean(modal)}
            title={modal?.title}
            onClose={() => setModal(null)}
            actions={<Button variant="teal" onClick={() => { setModal(null); navigate("/license"); }}>{modal?.action}</Button>}
          >
            {modal?.body}
          </Modal>
          {toast ? (
            <A26Surface
              material="opaque"
              tone="teal"
              className="a26-toast"
              role="status"
              aria-live="polite"
            >
              {toast}
            </A26Surface>
          ) : null}
        </GlobalErrorBoundary>
      </AtlasAITutorSessionProvider>
    </AuthProvider>
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
    <main className="a26-access-page" data-testid="a26-auth-bootstrap">
      <A26LoadingState
        title={t("common.sessionValidationTitle")}
        text={t("common.sessionValidationBody")}
      />
    </main>
  );
}

function renderPrivatePage(path, context) {
  const { user, navigate, onAuth, notify, showInstitutionalModal, onLogout } = context;

  if (path === "/dashboard") {
    return <RedirectTo to="/student/home" replace={(to) => navigate(to)} />;
  }
  if (path === "/student/home") return <Dashboard user={user} navigate={navigate} showInstitutionalModal={showInstitutionalModal} />;
  if (path.startsWith("/rector/")) {
    const section = governanceSectionFromPath("rector", path);
    if (section) return <RectorDashboard user={user} section={section} />;
  }
  if (path.startsWith("/coordinator/")) {
    const section = governanceSectionFromPath("coordinator", path);
    if (section) return <CoordinatorDashboard user={user} section={section} />;
  }
  if (path === "/institution/dashboard") return <Admin user={user} section="overview" path={path} navigate={navigate} notify={notify} />;
  if (path === "/admin/dashboard") return <Admin user={user} section="overview" path={path} navigate={navigate} notify={notify} />;
  if (path === "/models") return <Models user={user} navigate={navigate} onLocked={showInstitutionalModal} />;
  if (path.startsWith("/models/")) return <ModelDetail id={path.split("/").pop()} user={user} navigate={navigate} />;
  if (path === "/license") return <License user={user} onAuth={onAuth} navigate={navigate} notify={notify} />;
  if (path === "/profile") return <Profile user={user} onAuth={onAuth} notify={notify} />;
  if (path === "/settings") return <Settings user={user} onLogout={onLogout} notify={notify} />;
  if (path === "/history") return <StudentLearningPage section="history" user={user} navigate={navigate} />;
  if (path === "/favorites") return <StudentLearningPage section="favorites" user={user} navigate={navigate} />;
  if (path === "/progress") return <StudentLearningPage section="progress" user={user} navigate={navigate} />;
  if (path === "/study-agenda") return <StudyAgendaPage navigate={navigate} />;
  if (path === "/flashcards") return <StudentLearningPage section="flashcards" user={user} navigate={navigate} />;
  if (path === "/quizzes") return <AnatomicalQuizzesPage navigate={navigate} />;
  if (path === "/summaries") return <StudentLearningPage section="summaries" user={user} navigate={navigate} />;
  if (path === "/guided-study") return <StudentLearningPage section="guided-study" user={user} navigate={navigate} />;
  if (path === "/ai-tutor") return <StudentLearningPage section="ai-tutor" user={user} navigate={navigate} />;
  if (path === "/review") return <StudentLearningPage section="review" user={user} navigate={navigate} />;
  if (path === "/study-lists") return <StudentLearningPage section="study-lists" user={user} navigate={navigate} />;
  if (path === "/classes") return <StudentLearningPage section="classes" user={user} navigate={navigate} />;
  if (path === "/recommendations") return <StudentLearningPage section="recommendations" user={user} navigate={navigate} />;
  if (path === "/academic-reports") return <StudentLearningPage section="academic-reports" user={user} navigate={navigate} />;
  if (path === "/atlas" || path.startsWith("/atlas/")) return <Atlas path={path} navigate={navigate} />;
  if (path === "/radiology") return <StudentLearningPage section="radiology" user={user} navigate={navigate} />;
  if (path === "/lessons") return <LessonLibraryPage navigate={navigate} />;
  if (path === "/lessons/sandbox") return <LessonSandboxPage />;
  if (path.startsWith("/lessons/")) {
    const slug = path.split("/")[2];
    if (slug) return <LessonPlayerPage lessonSlug={slug} navigate={navigate} />;
  }
  if (path === "/videos") return <StudentLearningPage section="videos" user={user} navigate={navigate} />;
  if (path === "/courses") return <StudentLearningPage section="courses" user={user} navigate={navigate} />;
  if (path === "/teacher" || path === "/teacher/dashboard" || path === "/professor/dashboard") return <Teacher section="dashboard" user={user} navigate={navigate} />;
  if (path === "/teacher/models" || path === "/professor/models") return <Teacher section="models" user={user} navigate={navigate} />;
  if (path === "/teacher/atlas" || path.startsWith("/teacher/atlas/")) {
    const atlasPath = path.replace(/^\/teacher\/atlas/, "/atlas");
    const teacherAtlasNavigate = (to) => navigate(to.replace(/^\/atlas/, "/teacher/atlas"));
    return <Atlas path={atlasPath} navigate={teacherAtlasNavigate} />;
  }
  if (path.startsWith("/teacher/")) return <Teacher section={path.split("/")[2] || "dashboard"} user={user} navigate={navigate} />;
  if (path === "/institution-admin") return <Admin user={user} section="overview" path={path} navigate={navigate} notify={notify} />;
  if (path.startsWith("/institution-admin/")) return <Admin user={user} section={path.split("/")[2] || "overview"} path={path} navigate={navigate} notify={notify} />;
  if (path === "/super-admin") return <Admin user={user} section="overview" path={path} navigate={navigate} notify={notify} />;
  if (path === "/super-admin/lessons") {
    return (
      <ProtectedRoute user={user} adminOnly={true} path={path} navigate={navigate}>
        <LessonAdminReviewPage navigate={navigate} />
      </ProtectedRoute>
    );
  }
  if (path.startsWith("/super-admin/")) return <Admin user={user} section={path.split("/")[2] || "overview"} path={path} navigate={navigate} notify={notify} />;
  if ((path === "/admin" || path.startsWith("/admin/")) && !["super_admin", "admin", "institution_admin"].includes(user?.role)) {
    return <NotFound navigate={navigate} />;
  }
  if (path === "/admin") return <Admin user={user} section="dashboard" path={path} navigate={navigate} notify={notify} />;
  if (path.startsWith("/admin/")) return <Admin user={user} section={path.split("/")[2] || "dashboard"} path={path} navigate={navigate} notify={notify} />;
  return null;
}

function NotFound({ navigate }) {
  const { t } = useLanguage();
  return (
    <main className="a26-access-page">
      <A26Card className="a26-access-state">
        <h1 className="display-title">{t("errors.notFoundTitle")}</h1>
        <p className="mt-4 text-textMuted">{t("errors.notFoundText")}</p>
        <A26Button variant="primary" onClick={() => navigate("/")}>{t("navigation.home")}</A26Button>
      </A26Card>
    </main>
  );
}

const LEGACY_VIEWER_MODEL_MAP = {
  "neuro-001-enc": "corte-sagital-cranio-humano-superficial",
  "corte-sagital-encefalo": "corte-sagital-cranio-humano-superficial"
};

function LegacyViewerRedirect({ id, replace }) {
  const destinationId = LEGACY_VIEWER_MODEL_MAP[id] || id;

  useEffect(() => {
    replace(`/viewer/${destinationId}`);
  }, [destinationId, replace]);

  return <AuthBootstrap />;
}
