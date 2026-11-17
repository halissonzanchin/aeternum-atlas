import React from "react";
import { A26Button, A26Modal } from "./A26Primitives";
import { useSessionGuard } from "../../context/SessionGuardContext";

export function A26SessionDisplacedModal({ onReauthenticate, onLogout }) {
  const {
    isDisplaced,
    isExpired,
    displacementDetails,
    dismiss
  } = useSessionGuard();

  if (!isDisplaced && !isExpired) return null;

  const code = displacementDetails?.code || "";
  const isTimeout =
    isExpired ||
    code === "SESSION_EXPIRED_INACTIVITY" ||
    code === "SESSION_RELEASED" ||
    code === "SESSION_REVOKED" ||
    displacementDetails?.reason === "inactivity_timeout";

  const isUnavailable = code === "SESSION_GUARD_UNAVAILABLE";

  const title = isUnavailable
    ? "Validação de Sessão Indisponível"
    : isTimeout
      ? "Sessão Encerrada"
      : "Sessão Ativa em Outro Dispositivo";

  const description = isUnavailable
    ? "Não foi possível validar sua sessão no momento. Por segurança (fail-closed), o acesso foi interrompido."
    : isTimeout
      ? "Sua sessão foi encerrada automaticamente para preservar a segurança da conta após um período sem atividade."
      : "Esta conta já possui uma sessão ativa em outro equipamento ou navegador. Pela política de prioridade da primeira sessão, novas conexões simultâneas não são permitidas.";

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
            Encerrar
          </A26Button>
          <A26Button variant="primary" onClick={handleReconnect}>
            Voltar ao login
          </A26Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", lineHeight: "1.5", color: "rgba(255,255,255,0.85)" }}>
        <p>
          {isTimeout
            ? "Autentique-se novamente com suas credenciais para retomar seus estudos anatômicos."
            : "A primeira sessão autenticada mantém prioridade absoluta enquanto estiver ativa. Para acessar neste dispositivo, encerre primeiro a sessão no dispositivo original."}
        </p>
      </div>
    </A26Modal>
  );
}
