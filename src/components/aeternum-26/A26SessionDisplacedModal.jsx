import React from "react";
import { A26Button, A26Modal } from "./A26Primitives";
import { useSessionGuard } from "../../context/SessionGuardContext";

export function A26SessionDisplacedModal({ onReauthenticate, onLogout }) {
  const {
    isDisplaced,
    isExpired,
    displacementDetails,
    pendingTransfer,
    confirmPendingTransfer,
    cancelPendingTransfer,
    dismiss
  } = useSessionGuard();

  if (!isDisplaced && !isExpired && !pendingTransfer) return null;

  if (pendingTransfer) {
    return (
      <A26Modal
        open={true}
        title="Confirmar Troca de Dispositivo"
        description="Você já possui uma sessão ativa em outro equipamento. Deseja transferir o acesso para este navegador?"
        onClose={cancelPendingTransfer}
        closeLabel="Cancelar"
        className="a26-session-guard-modal"
        actions={
          <>
            <A26Button variant="ghost" onClick={cancelPendingTransfer}>
              Cancelar
            </A26Button>
            <A26Button variant="primary" onClick={confirmPendingTransfer}>
              Transferir para este dispositivo
            </A26Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", lineHeight: "1.5", color: "rgba(255,255,255,0.85)" }}>
          <p>
            A política de sessão única desconectará o dispositivo anterior.
          </p>
          <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.3)", color: "#93c5fd", fontSize: "12px" }}>
            <strong>Transferências restantes hoje:</strong> {pendingTransfer.transfers_remaining} de {pendingTransfer.max_transfers}.
          </div>
        </div>
      </A26Modal>
    );
  }

  const isTimeout = isExpired || displacementDetails?.reason === "inactivity_timeout";
  const title = isTimeout
    ? "Sessão Expirada por Inatividade"
    : "Sessão Ativa em Outro Dispositivo";

  const description = isTimeout
    ? "Sua sessão foi encerrada automaticamente para preservar a segurança da conta após um período sem atividade."
    : "Outro equipamento ou navegador iniciou acesso com esta conta. Para proteger seus dados acadêmicos e aplicar a política de sessão única, o acesso neste dispositivo foi suspenso.";

  const handleReconnect = () => {
    if (typeof onReauthenticate === "function") {
      onReauthenticate();
    } else {
      dismiss();
    }
  };

  const handleExit = () => {
    if (typeof onLogout === "function") {
      onLogout();
    } else {
      dismiss();
    }
  };

  return (
    <A26Modal
      open={true}
      title={title}
      description={description}
      onClose={handleExit}
      closeLabel="Sair"
      className="a26-session-guard-modal"
      actions={
        <>
          <A26Button variant="ghost" onClick={handleExit}>
            Encerrar sessão
          </A26Button>
          <A26Button variant="primary" onClick={handleReconnect}>
            Fazer login novamente
          </A26Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", lineHeight: "1.5", color: "rgba(255,255,255,0.85)" }}>
        <p>
          {isTimeout
            ? "Reconecte-se com suas credenciais para continuar seus estudos anatômicos de onde parou."
            : "A política de sessão única impede o compartilhamento indevido de contas e assegura a consistência das inferências do cérebro científico TutorEngine."}
        </p>
        {!isTimeout && (
          <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", fontSize: "12px" }}>
            <strong>Atenção:</strong> Se você não iniciou este novo acesso, recomendamos trocar sua senha imediatamente para proteger sua licença.
          </div>
        )}
      </div>
    </A26Modal>
  );
}
