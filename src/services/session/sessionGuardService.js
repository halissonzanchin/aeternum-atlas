import { supabase } from "../../lib/supabase.js";

export const SESSION_GUARD_STATES = Object.freeze({
  SESSION_GRANTED: "SESSION_GRANTED",
  SESSION_VALID: "SESSION_VALID",
  SESSION_ALREADY_ACTIVE: "SESSION_ALREADY_ACTIVE",
  SESSION_EXPIRED_INACTIVITY: "SESSION_EXPIRED_INACTIVITY",
  SESSION_RELEASED: "SESSION_RELEASED",
  SESSION_REVOKED: "SESSION_REVOKED",
  SESSION_GUARD_UNAVAILABLE: "SESSION_GUARD_UNAVAILABLE"
});

export const QUALIFIED_ACTIVITY_TYPES = Object.freeze([
  "form_tool_interaction",
  "ai_tutor_query",
  "quiz_answer_submission",
  "flashcard_review",
  "agenda_edit",
  "model_3d_interaction",
  "active_navigation_reading",
  "educational_progress"
]);

const NON_QUALIFIED_SIGNALS = new Set([
  "heartbeat",
  "jwt_refresh",
  "data_polling",
  "health_check",
  "session_sync",
  "background_update",
  "login_attempt_refused",
  "presence_check"
]);

function getAnonymizedDeviceSeed() {
  if (typeof window === "undefined") return "server-node";
  const nav = window.navigator || {};
  const screen = window.screen || {};
  const parts = [
    nav.userAgent || "",
    nav.language || "",
    screen.width ? `${screen.width}x${screen.height}` : "",
    Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || ""
  ];
  return parts.filter(Boolean).join(" | ");
}

export function extractSessionIdFromToken(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonStr);
    return parsed.session_id || null;
  } catch {
    return null;
  }
}

export function isQualifiedActivityType(activityType) {
  if (!activityType || typeof activityType !== "string") return false;
  const normalized = activityType.trim().toLowerCase();
  if (NON_QUALIFIED_SIGNALS.has(normalized)) return false;
  return QUALIFIED_ACTIVITY_TYPES.includes(normalized);
}

class SessionGuardService {
  constructor() {
    this.currentSessionId = null;
    this.isAuthorizedSession = false;
    this.status = null;
    this.presenceInterval = null;
    this.listeners = new Set();
    this.isDisplaced = false;
    this.isExpired = false;
    this.isUnavailable = false;
    this.displacementDetails = null;
    this.lastCheckedAt = null;
    this.lastQualifiedActivitySentAt = 0;
    this.activityThrottleMs = 60_000; // Group/throttle qualified UI activity writes to at most 1/min
    this.domListenersAttached = false;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(state) {
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.error("[SessionGuard] Error in listener:", err);
      }
    }
  }

  getState() {
    return {
      status: this.status,
      isAuthorized: this.isAuthorizedSession,
      isDisplaced: this.isDisplaced,
      isExpired: this.isExpired,
      isUnavailable: this.isUnavailable,
      displacementDetails: this.displacementDetails,
      pendingTransfer: null, // Voluntary transfer strictly disabled under First Session Wins
      currentSessionId: this.currentSessionId,
      lastCheckedAt: this.lastCheckedAt
    };
  }

  notifyAlreadyActive(details = {}) {
    this.status = SESSION_GUARD_STATES.SESSION_ALREADY_ACTIVE;
    this.isAuthorizedSession = false;
    this.currentSessionId = null;
    this.isDisplaced = true;
    this.isExpired = false;
    this.isUnavailable = false;
    this.displacementDetails = {
      code: SESSION_GUARD_STATES.SESSION_ALREADY_ACTIVE,
      reason: "session_already_active",
      error: details.error || "Esta conta já possui uma sessão ativa em outro dispositivo. Para proteger seus dados acadêmicos, não é permitido iniciar um segundo acesso simultâneo."
    };
    this.stopMonitoring();
    this.notify(this.getState());
  }

  notifyDisplaced(details = {}) {
    const code = details.code || SESSION_GUARD_STATES.SESSION_ALREADY_ACTIVE;
    this.status = code;
    this.isAuthorizedSession = false;
    this.currentSessionId = null;
    this.isDisplaced = true;
    this.isUnavailable = false;
    this.displacementDetails = {
      code,
      reason: details.reason || "session_already_active",
      error: details.error || "Esta conta já possui uma sessão ativa em outro dispositivo."
    };
    this.stopMonitoring();
    this.notify(this.getState());
  }

  notifyExpired(details = {}) {
    const code = details.code || SESSION_GUARD_STATES.SESSION_EXPIRED_INACTIVITY;
    this.status = code;
    this.isAuthorizedSession = false;
    this.currentSessionId = null;
    this.isExpired = true;
    this.isUnavailable = false;
    this.displacementDetails = {
      code,
      reason: details.reason || "inactivity_timeout",
      error: details.error || "Seu acesso foi encerrado após 60 minutos sem atividade para proteger sua conta e manter a disponibilidade da plataforma."
    };
    this.stopMonitoring();
    this.notify(this.getState());
  }

  notifyUnavailable(details = {}) {
    this.status = SESSION_GUARD_STATES.SESSION_GUARD_UNAVAILABLE;
    this.isAuthorizedSession = false;
    this.isUnavailable = true;
    this.isDisplaced = false;
    this.isExpired = false;
    this.displacementDetails = {
      code: SESSION_GUARD_STATES.SESSION_GUARD_UNAVAILABLE,
      reason: details.reason || "session_guard_unavailable",
      error: details.error || "Estamos com uma indisponibilidade temporária na validação da sessão. Tente novamente em instantes."
    };
    this.stopMonitoring();
    this.notify(this.getState());
  }

  reset() {
    this.stopMonitoring();
    this.status = null;
    this.isAuthorizedSession = false;
    this.currentSessionId = null;
    this.isDisplaced = false;
    this.isExpired = false;
    this.isUnavailable = false;
    this.displacementDetails = null;
    this.notify(this.getState());
  }

  async registerOrConfirmSession(session) {
    if (!session?.access_token) {
      this.notifyUnavailable({ reason: "missing_access_token" });
      return {
        status: SESSION_GUARD_STATES.SESSION_GUARD_UNAVAILABLE,
        code: SESSION_GUARD_STATES.SESSION_GUARD_UNAVAILABLE,
        valid: false,
        allowed: false
      };
    }

    const sessionId = extractSessionIdFromToken(session.access_token);
    if (!sessionId) {
      this.notifyUnavailable({ reason: "missing_session_id_claim" });
      return {
        status: SESSION_GUARD_STATES.SESSION_GUARD_UNAVAILABLE,
        code: SESSION_GUARD_STATES.SESSION_GUARD_UNAVAILABLE,
        valid: false,
        allowed: false
      };
    }

    this.currentSessionId = sessionId;
    const deviceFingerprint = getAnonymizedDeviceSeed();

    try {
      const { data, error } = await supabase.rpc("register_or_transfer_session", {
        p_session_id: sessionId,
        p_device_fingerprint: deviceFingerprint,
        p_ip: null,
        p_confirm_transfer: false,
        p_metadata: {
          policy: "FIRST_SESSION_WINS",
          client_platform: typeof navigator !== "undefined" ? navigator.platform : "web"
        }
      });

      // Fail-Closed on RPC error
      if (error || !data) {
        console.error("[SessionGuard] Fail-closed: RPC register_or_transfer_session falhou:", error?.message);
        this.notifyUnavailable({ error: error?.message });
        return {
          status: SESSION_GUARD_STATES.SESSION_GUARD_UNAVAILABLE,
          code: SESSION_GUARD_STATES.SESSION_GUARD_UNAVAILABLE,
          valid: false,
          allowed: false,
          error: error?.message || "Falha na validação de sessão."
        };
      }

      const code = data.code || data.status;

      if (code === SESSION_GUARD_STATES.SESSION_ALREADY_ACTIVE || data.other_device_active) {
        this.notifyAlreadyActive(data);
        return {
          ...data,
          status: SESSION_GUARD_STATES.SESSION_ALREADY_ACTIVE,
          code: SESSION_GUARD_STATES.SESSION_ALREADY_ACTIVE,
          valid: false,
          allowed: false
        };
      }

      if (code === SESSION_GUARD_STATES.SESSION_EXPIRED_INACTIVITY || data.status === "expired" || data.expired) {
        this.notifyExpired({ ...data, code: SESSION_GUARD_STATES.SESSION_EXPIRED_INACTIVITY });
        return {
          ...data,
          status: SESSION_GUARD_STATES.SESSION_EXPIRED_INACTIVITY,
          code: SESSION_GUARD_STATES.SESSION_EXPIRED_INACTIVITY,
          valid: false,
          allowed: false
        };
      }

      if (code === SESSION_GUARD_STATES.SESSION_RELEASED || data.released) {
        this.notifyExpired({ ...data, code: SESSION_GUARD_STATES.SESSION_RELEASED, reason: "session_released" });
        return {
          ...data,
          status: SESSION_GUARD_STATES.SESSION_RELEASED,
          code: SESSION_GUARD_STATES.SESSION_RELEASED,
          valid: false,
          allowed: false
        };
      }

      if (
        code === SESSION_GUARD_STATES.SESSION_REVOKED ||
        data.status === "revoked" ||
        data.status === "forbidden" ||
        code === "SESSION_ID_MISMATCH" ||
        code === "USER_INACTIVE"
      ) {
        this.notifyExpired({ ...data, code: SESSION_GUARD_STATES.SESSION_REVOKED, reason: "session_revoked" });
        return {
          ...data,
          status: SESSION_GUARD_STATES.SESSION_REVOKED,
          code: SESSION_GUARD_STATES.SESSION_REVOKED,
          valid: false,
          allowed: false
        };
      }

      if (code === SESSION_GUARD_STATES.SESSION_GUARD_UNAVAILABLE) {
        this.notifyUnavailable(data);
        return {
          ...data,
          status: SESSION_GUARD_STATES.SESSION_GUARD_UNAVAILABLE,
          code: SESSION_GUARD_STATES.SESSION_GUARD_UNAVAILABLE,
          valid: false,
          allowed: false
        };
      }

      // Authorized: SESSION_GRANTED or SESSION_VALID
      this.status = code === SESSION_GUARD_STATES.SESSION_GRANTED
        ? SESSION_GUARD_STATES.SESSION_GRANTED
        : SESSION_GUARD_STATES.SESSION_VALID;
      this.isAuthorizedSession = true;
      this.currentSessionId = sessionId;
      this.isDisplaced = false;
      this.isExpired = false;
      this.isUnavailable = false;
      this.displacementDetails = null;
      this.lastCheckedAt = new Date().toISOString();
      if (this.status === SESSION_GUARD_STATES.SESSION_GRANTED) {
        this.lastQualifiedActivitySentAt = Date.now();
      }

      this.startMonitoring();
      this.notify(this.getState());

      return {
        ...data,
        status: this.status,
        code: this.status,
        valid: true,
        allowed: true
      };
    } catch (err) {
      console.error("[SessionGuard] Fail-closed exception during registration:", err);
      this.notifyUnavailable({ error: err?.message });
      return {
        status: SESSION_GUARD_STATES.SESSION_GUARD_UNAVAILABLE,
        code: SESSION_GUARD_STATES.SESSION_GUARD_UNAVAILABLE,
        valid: false,
        allowed: false,
        error: err?.message
      };
    }
  }

  async confirmPendingTransfer() {
    // Voluntary transfer is strictly prohibited under First Session Wins
    return {
      status: SESSION_GUARD_STATES.SESSION_ALREADY_ACTIVE,
      code: SESSION_GUARD_STATES.SESSION_ALREADY_ACTIVE,
      valid: false,
      allowed: false
    };
  }

  cancelPendingTransfer() {
    this.notify(this.getState());
  }

  /**
   * Passive presence check: verifies if the session is still valid on the server
   * WITHOUT resetting last_qualified_activity_at.
   */
  async validateActiveSession({ touchActivity = false, activityType = "presence_check" } = {}) {
    if (!this.currentSessionId || this.isDisplaced || this.isExpired) return null;

    const qualified = Boolean(touchActivity && isQualifiedActivityType(activityType));

    try {
      const { data, error } = await supabase.rpc("validate_session_guard", {
        p_session_id: this.currentSessionId,
        p_touch_activity: qualified,
        p_ip: null,
        p_activity_type: qualified ? activityType : "presence_check"
      });

      if (error || !data) {
        console.error("[SessionGuard] Fail-closed: RPC validate_session_guard falhou:", error?.message);
        this.notifyUnavailable({ error: error?.message });
        return {
          valid: false,
          status: SESSION_GUARD_STATES.SESSION_GUARD_UNAVAILABLE,
          code: SESSION_GUARD_STATES.SESSION_GUARD_UNAVAILABLE
        };
      }

      this.lastCheckedAt = new Date().toISOString();

      if (data.valid === false) {
        const code = data.code || data.status;
        if (code === SESSION_GUARD_STATES.SESSION_ALREADY_ACTIVE || data.other_device_active || code === "SESSION_DISPLACED") {
          this.notifyAlreadyActive(data);
        } else if (code === SESSION_GUARD_STATES.SESSION_EXPIRED_INACTIVITY || data.expired) {
          this.notifyExpired({ ...data, code: SESSION_GUARD_STATES.SESSION_EXPIRED_INACTIVITY });
        } else if (code === SESSION_GUARD_STATES.SESSION_RELEASED || data.released) {
          this.notifyExpired({ ...data, code: SESSION_GUARD_STATES.SESSION_RELEASED, reason: "session_released" });
        } else if (code === SESSION_GUARD_STATES.SESSION_GUARD_UNAVAILABLE) {
          this.notifyUnavailable(data);
        } else {
          this.notifyExpired({ ...data, code: SESSION_GUARD_STATES.SESSION_REVOKED, reason: "session_revoked" });
        }
      } else {
        this.status = SESSION_GUARD_STATES.SESSION_VALID;
      }

      return data;
    } catch (err) {
      console.error("[SessionGuard] Fail-closed exception in validateActiveSession:", err);
      this.notifyUnavailable({ error: err?.message });
      return {
        valid: false,
        status: SESSION_GUARD_STATES.SESSION_GUARD_UNAVAILABLE,
        code: SESSION_GUARD_STATES.SESSION_GUARD_UNAVAILABLE
      };
    }
  }

  /**
   * Records a qualified student activity (throttled to avoid excessive DB writes).
   * Non-qualified signals (heartbeats, JWT refreshes, polling, sync) are strictly ignored.
   */
  async recordQualifiedActivity(activityType, { forceImmediate = false } = {}) {
    if (!this.currentSessionId || this.isDisplaced || this.isExpired) return null;
    if (!isQualifiedActivityType(activityType)) {
      return null;
    }

    const now = Date.now();
    if (!forceImmediate && now - this.lastQualifiedActivitySentAt < this.activityThrottleMs) {
      return null;
    }

    this.lastQualifiedActivitySentAt = now;
    return this.validateActiveSession({
      touchActivity: true,
      activityType: activityType.trim().toLowerCase()
    });
  }

  startMonitoring(presenceIntervalMs = 60_000) {
    this.stopMonitoring();

    // Passive presence check ONLY (touchActivity: false) — NEVER resets 60m inactivity timer!
    this.presenceInterval = setInterval(() => {
      this.validateActiveSession({ touchActivity: false, activityType: "presence_check" });
    }, presenceIntervalMs);

    if (typeof window !== "undefined" && typeof document !== "undefined") {
      this.visibilityHandler = () => {
        if (document.visibilityState === "visible") {
          this.validateActiveSession({ touchActivity: false, activityType: "presence_check" });
        }
      };
      document.addEventListener("visibilitychange", this.visibilityHandler);

      // Attach qualified user interaction listeners (throttled to 1 write / 60s)
      this.qualifiedInteractionHandler = (event) => {
        if (!event?.isTrusted) return; // Reject synthetic/scripted untrusted browser events
        const type = event.type;
        if (type === "submit" || type === "change" || type === "input") {
          this.recordQualifiedActivity("form_tool_interaction");
        } else if (type === "scroll" || type === "keydown" || type === "pointerdown") {
          this.recordQualifiedActivity("active_navigation_reading");
        }
      };

      window.addEventListener("pointerdown", this.qualifiedInteractionHandler, { passive: true });
      window.addEventListener("keydown", this.qualifiedInteractionHandler, { passive: true });
      window.addEventListener("scroll", this.qualifiedInteractionHandler, { passive: true });
      window.addEventListener("submit", this.qualifiedInteractionHandler, { passive: true });
      window.addEventListener("change", this.qualifiedInteractionHandler, { passive: true });
      this.domListenersAttached = true;
    }
  }

  stopMonitoring() {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }
    if (typeof document !== "undefined" && this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (typeof window !== "undefined" && this.domListenersAttached && this.qualifiedInteractionHandler) {
      window.removeEventListener("pointerdown", this.qualifiedInteractionHandler);
      window.removeEventListener("keydown", this.qualifiedInteractionHandler);
      window.removeEventListener("scroll", this.qualifiedInteractionHandler);
      window.removeEventListener("submit", this.qualifiedInteractionHandler);
      window.removeEventListener("change", this.qualifiedInteractionHandler);
      this.qualifiedInteractionHandler = null;
      this.domListenersAttached = false;
    }
  }

  // Alias for backward compatibility
  startHeartbeat(intervalMs = 60_000) {
    this.startMonitoring(intervalMs);
  }

  stopHeartbeat() {
    this.stopMonitoring();
  }

  async revokeSession(reason = "user_logout") {
    this.stopMonitoring();
    const sessionId = this.currentSessionId;
    const wasAuthorized = this.isAuthorizedSession;
    this.currentSessionId = null;
    this.isAuthorizedSession = false;
    this.status = SESSION_GUARD_STATES.SESSION_RELEASED;
    this.isDisplaced = false;
    this.isExpired = false;
    this.isUnavailable = false;
    this.displacementDetails = null;

    // CRITICAL: Only invoke server revoke RPC if this client actually holds an authorized active session!
    // Refused second logins or unvalidated sessions must NEVER touch the server's active session!
    if (wasAuthorized && sessionId) {
      try {
        await supabase.rpc("revoke_active_session", {
          p_session_id: sessionId,
          p_reason: reason
        });
      } catch (err) {
        console.warn("[SessionGuard] Revocation error:", err);
      }
    }
    this.notify(this.getState());
  }

  async retryValidation() {
    this.isUnavailable = false;
    this.notify(this.getState());
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        this.notifyUnavailable({ reason: "missing_access_token" });
        return { valid: false, allowed: false };
      }
      return this.registerOrConfirmSession(sessionData.session);
    } catch (err) {
      this.notifyUnavailable({ error: err?.message });
      return { valid: false, allowed: false };
    }
  }
}

export const sessionGuardService = new SessionGuardService();
