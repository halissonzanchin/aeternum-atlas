/* eslint-disable no-unused-vars -- o parser ESLint atual não contabiliza identificadores usados apenas em JSX */
import { useEffect } from "react";
import { A26Button, A26Card } from "../aeternum-26";
import {
  canAccessRoute,
  getHomeForRole,
  normalizeRole
} from "../../services/permissions/permissionService";

const roleLabels = {
  student: "Aluno",
  teacher: "Professor",
  coordinator: "Coordenação",
  rector: "Reitoria",
  institution_admin: "Administração institucional",
  super_admin: "Superadministração"
};

function AccessState({ title, text, actionLabel, onAction, role = "visitante", path = "/" }) {
  return (
    <main
      className="a26-access-page"
      data-testid="a26-access-state"
      data-a26-role={role}
      data-a26-route={path}
    >
      <A26Card className="a26-access-state">
        <span className="a26-kicker">Aeternum 26 · Acesso</span>
        <small className="a26-access-state__identity">
          {roleLabels[role] || role} · {path}
        </small>
        <h1>{title}</h1>
        <p>{text}</p>
        <A26Button variant="primary" onClick={onAction}>{actionLabel}</A26Button>
      </A26Card>
    </main>
  );
}

export default function ProtectedRoute({ user, adminOnly = false, path = window.location.pathname, navigate, children }) {
  const isSuperAdminArea = String(path || "").startsWith("/super-admin");

  useEffect(() => {
    if (!user && typeof window !== "undefined") {
      const currentPathname = window.location.pathname;
      if (currentPathname === "/login" || currentPathname.startsWith("/login")) {
        return;
      }
      const fullTarget = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (fullTarget && !fullTarget.startsWith("/login")) {
        navigate(`/login?redirect=${encodeURIComponent(fullTarget)}`);
      }
    }
  }, [user, navigate]);

  if (!user) {
    const fullCurrentLocation = typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : path;
    const targetToEncode = (fullCurrentLocation && !fullCurrentLocation.startsWith("/login")) ? fullCurrentLocation : "/";
    const redirectTarget = `/login?redirect=${encodeURIComponent(targetToEncode)}`;
    return (
      <AccessState
        title="Acesso protegido"
        text="Entre na sua conta para acessar a biblioteca anatômica 3D."
        actionLabel="Iniciar sessão"
        onAction={() => navigate(redirectTarget)}
        path={path}
      />
    );
  }

  if (adminOnly && !canAccessRoute(user, path)) {
    return (
      <AccessState
        title={isSuperAdminArea ? "Superadministração" : "Área administrativa"}
        text={isSuperAdminArea
          ? "Esta área é restrita à Superadministração da plataforma."
          : "Esta área é restrita à Administração institucional."}
        actionLabel="Voltar ao dashboard"
        onAction={() => navigate(getHomeForRole(user))}
        role={normalizeRole(user?.role, user)}
        path={path}
      />
    );
  }

  if (!canAccessRoute(user, path)) {
    return (
      <AccessState
        title="Acesso restrito"
        text="Seu perfil não possui permissão para acessar este módulo institucional."
        actionLabel="Ir para minha área"
        onAction={() => navigate(getHomeForRole(user))}
        role={normalizeRole(user?.role, user)}
        path={path}
      />
    );
  }

  return children;
}
