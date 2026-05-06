import Button from "../Button/Button";
import Card from "../Card/Card";

export default function ProtectedRoute({ user, adminOnly = false, navigate, children }) {
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

  const adminRoles = ["admin", "super_admin", "institution_admin"];

  if (adminOnly && !adminRoles.includes(user.role)) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <Card className="max-w-lg text-center">
          <h1 className="font-display text-4xl uppercase tracking-[0.08em] text-agedGold">Área administrativa</h1>
          <p className="mt-4 text-textMuted">Esta área é restrita à administração institucional.</p>
          <Button className="mt-6" variant="outline" onClick={() => navigate("/dashboard")}>Voltar ao dashboard</Button>
        </Card>
      </main>
    );
  }

  return children;
}
