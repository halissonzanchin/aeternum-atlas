import Button from "../Button/Button";
import Card from "../Card/Card";
import { canAccessRoute, getHomeForRole } from "../../services/permissions/permissionService";

export default function ProtectedRoute({ user, adminOnly = false, path = window.location.pathname, navigate, children }) {
  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <Card className="max-w-lg text-center">
          <h1 className="font-display text-4xl uppercase tracking-[0.08em] text-agedGold">Acesso protegido</h1>
          <p className="mt-4 text-textMuted">Entre na sua conta para acessar a biblioteca anatômica 3D.</p>
          <Button className="mt-6" variant="teal" onClick={() => navigate("/login")}>Iniciar sessão</Button>
        </Card>
      </main>
    );
  }

  if (adminOnly && !canAccessRoute(user, path)) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <Card className="max-w-lg text-center">
          <h1 className="font-display text-4xl uppercase tracking-[0.08em] text-agedGold">Área administrativa</h1>
          <p className="mt-4 text-textMuted">Esta área é restrita à administração institucional.</p>
          <Button className="mt-6" variant="outline" onClick={() => navigate(getHomeForRole(user))}>Voltar ao dashboard</Button>
        </Card>
      </main>
    );
  }

  if (!canAccessRoute(user, path)) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <Card className="max-w-lg text-center">
          <h1 className="font-display text-4xl uppercase tracking-[0.08em] text-agedGold">Acesso restrito</h1>
          <p className="mt-4 text-textMuted">Seu perfil não possui permissão para acessar este módulo institucional.</p>
          <Button className="mt-6" variant="outline" onClick={() => navigate(getHomeForRole(user))}>Ir para minha área</Button>
        </Card>
      </main>
    );
  }

  return children;
}
