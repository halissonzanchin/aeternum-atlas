import React from "react";
import { A26Button, A26Modal } from "./A26Primitives";
import { useSessionGuard } from "../../context/SessionGuardContext";
import { useLanguage } from "../../context/LanguageContext";

const MODAL_I18N = {
  pt: {
    situationA: {
      title: "Conta em uso em outro dispositivo",
      message: "Esta conta já possui uma sessão ativa. Para proteger seus dados acadêmicos, não é permitido iniciar um segundo acesso simultâneo.",
      guidance: "Se foi você quem iniciou a sessão anterior, encerre o acesso naquele dispositivo e tente novamente.",
      securityWarning: "Caso não reconheça essa atividade, entre em contato com a administração da Aeternum Atlas para verificar a segurança da sua conta.",
      actionLogin: "Voltar ao login",
      actionSupport: "Solicitar suporte"
    },
    situationB: {
      title: "Sessão encerrada por inatividade",
      message: "Seu acesso foi encerrado após 60 minutos sem atividade para proteger sua conta e manter a disponibilidade da plataforma.",
      guidance: "Autentique-se novamente com suas credenciais para retomar seus estudos anatômicos.",
      actionLogin: "Entrar novamente"
    },
    situationC: {
      title: "Não foi possível validar seu acesso",
      message: "Estamos com uma indisponibilidade temporária na validação da sessão. Tente novamente em instantes.",
      guidance: "Por medidas de segurança (fail-closed), o acesso às áreas acadêmicas foi pausado temporariamente.",
      actionRetry: "Tentar novamente",
      actionLogin: "Voltar ao login"
    }
  },
  es: {
    situationA: {
      title: "Cuenta en uso en otro dispositivo",
      message: "Esta cuenta ya tiene una sesión activa. Para proteger sus datos académicos, no se permite iniciar un segundo acceso simultáneo.",
      guidance: "Si fue usted quien inició la sesión anterior, cierre el acceso en ese dispositivo e intente nuevamente.",
      securityWarning: "Si no reconoce esta actividad, comuníquese con la administración de Aeternum Atlas para verificar la seguridad de su cuenta.",
      actionLogin: "Volver al login",
      actionSupport: "Solicitar soporte"
    },
    situationB: {
      title: "Sesión cerrada por inactividad",
      message: "Su acceso se cerró después de 60 minutos sin actividad para proteger su cuenta y mantener la disponibilidad de la plataforma.",
      guidance: "Inicie sesión nuevamente con sus credenciales para retomar sus estudios anatómicos.",
      actionLogin: "Iniciar sesión nuevamente"
    },
    situationC: {
      title: "No se pudo validar su acceso",
      message: "Tenemos una indisponibilidad temporal para validar la sesión. Intente nuevamente en unos instantes.",
      guidance: "Por medidas de seguridad (fail-closed), el acceso a las áreas académicas se ha pausado temporalmente.",
      actionRetry: "Intentar nuevamente",
      actionLogin: "Volver al login"
    }
  }
};

export function A26SessionDisplacedModal({ onReauthenticate, onLogout, onRetry }) {
  const {
    isDisplaced,
    isExpired,
    isUnavailable,
    displacementDetails,
    dismiss
  } = useSessionGuard();

  const { language } = useLanguage() || { language: "pt" };
  const effectiveLang = (language === "es" || language === "pt") ? language : "pt";
  const i18n = MODAL_I18N[effectiveLang];

  if (!isDisplaced && !isExpired && !isUnavailable) return null;

  const code = displacementDetails?.code || "";
  const reason = displacementDetails?.reason || "";

  // Classification of the 3 explicit situations:
  // Situação C: Erro temporário de RPC/rede (fail-closed)
  const isSituationC =
    isUnavailable ||
    code === "SESSION_GUARD_UNAVAILABLE" ||
    reason === "session_guard_unavailable" ||
    reason === "missing_access_token";

  // Situação B: Sessão expirada após 60 minutos de inatividade
  const isSituationB =
    !isSituationC &&
    (isExpired ||
      code === "SESSION_EXPIRED_INACTIVITY" ||
      code === "SESSION_RELEASED" ||
      code === "SESSION_REVOKED" ||
      reason === "inactivity_timeout" ||
      reason === "session_released" ||
      reason === "session_revoked");

  // Situação A: Outro dispositivo já está utilizando a conta (First Session Wins)
  const isSituationA = !isSituationC && !isSituationB;

  const handleReturnToLogin = () => {
    if (typeof onReauthenticate === "function") {
      onReauthenticate();
    } else if (typeof onLogout === "function") {
      onLogout();
    } else {
      dismiss();
    }
  };

  const handleRetry = () => {
    if (typeof onRetry === "function") {
      onRetry();
    } else {
      handleReturnToLogin();
    }
  };

  const handleSupport = () => {
    const subject = encodeURIComponent("Aeternum Atlas - Suporte de Sessão e Acesso");
    const body = encodeURIComponent(
      `Olá equipe de suporte da Aeternum Atlas,\n\nRecebi a notificação de 'Conta em uso em outro dispositivo' no portal.\nCódigo do evento: ${code || "SESSION_ALREADY_ACTIVE"}\nData/Hora: ${new Date().toISOString()}\n\nPor favor, auxiliem na verificação de segurança da minha conta.`
    );
    window.open(`mailto:suporte@aeternumatlas.com?subject=${subject}&body=${body}`, "_blank");
  };

  if (isSituationC) {
    const texts = i18n.situationC;
    return (
      <A26Modal
        open={true}
        title={texts.title}
        description={texts.message}
        onClose={handleReturnToLogin}
        closeLabel={texts.actionLogin}
        className="a26-session-guard-modal a26-session-guard-modal--unavailable"
        actions={
          <>
            <A26Button variant="ghost" onClick={handleReturnToLogin}>
              {texts.actionLogin}
            </A26Button>
            <A26Button variant="primary" onClick={handleRetry}>
              {texts.actionRetry}
            </A26Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", lineHeight: "1.5", color: "rgba(255,255,255,0.85)" }}>
          <p>{texts.guidance}</p>
        </div>
      </A26Modal>
    );
  }

  if (isSituationB) {
    const texts = i18n.situationB;
    return (
      <A26Modal
        open={true}
        title={texts.title}
        description={texts.message}
        onClose={handleReturnToLogin}
        closeLabel={texts.actionLogin}
        className="a26-session-guard-modal a26-session-guard-modal--expired"
        actions={
          <A26Button variant="primary" onClick={handleReturnToLogin}>
            {texts.actionLogin}
          </A26Button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", lineHeight: "1.5", color: "rgba(255,255,255,0.85)" }}>
          <p>{texts.guidance}</p>
        </div>
      </A26Modal>
    );
  }

  // Default: Situação A (Outro dispositivo já está utilizando a conta)
  const texts = i18n.situationA;
  return (
    <A26Modal
      open={true}
      title={texts.title}
      description={texts.message}
      onClose={handleReturnToLogin}
      closeLabel={texts.actionLogin}
      className="a26-session-guard-modal a26-session-guard-modal--active"
      actions={
        <>
          <A26Button variant="ghost" onClick={handleSupport}>
            {texts.actionSupport}
          </A26Button>
          <A26Button variant="primary" onClick={handleReturnToLogin}>
            {texts.actionLogin}
          </A26Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", lineHeight: "1.5", color: "rgba(255,255,255,0.85)" }}>
        <p>{texts.guidance}</p>
        <p style={{ color: "rgba(255, 180, 160, 0.9)", fontSize: "12px", borderLeft: "2px solid #ef4444", paddingLeft: "8px" }}>
          {texts.securityWarning}
        </p>
      </div>
    </A26Modal>
  );
}
