import { supabase } from "../../lib/supabase.js";

function getDeviceFingerprint() {
  if (typeof window === "undefined") return "unknown-server";
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

class SessionGuardService {
  constructor() {
    this.currentSessionId = null;
    this.heartbeatInterval = null;
    this.listeners = new Set();
    this.isDisplaced = false;
    this.isExpired = false;
    this.displacementDetails = null;
    this.lastCheckedAt = null;
    this.pendingTransfer = null;
    this.transferStats = {
      transfersToday: 0,
      maxTransfers: 5,
      transfersRemaining: 5
    };
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
      isDisplaced: this.isDisplaced,
      isExpired: this.isExpired,
      displacementDetails: this.displacementDetails,
      pendingTransfer: this.pendingTransfer,
      currentSessionId: this.currentSessionId,
      transferStats: this.transferStats,
      lastCheckedAt: this.lastCheckedAt
    };
  }

  notifyDisplaced(details = {}) {
    if (this.isDisplaced) return;
    this.isDisplaced = true;
    this.displacementDetails = {
      reason: details.reason || "transferred_to_new_device",
      displacedAt: details.displaced_at || new Date().toISOString(),
      activeSessionId: details.active_session_id || null
    };
    this.stopHeartbeat();
    this.notify(this.getState());
  }

  notifyExpired(details = {}) {
    if (this.isExpired) return;
    this.isExpired = true;
    this.displacementDetails = {
      reason: "inactivity_timeout",
      inactivityMinutes: details.inactivity_minutes || 60,
      expiredAt: new Date().toISOString()
    };
    this.stopHeartbeat();
    this.notify(this.getState());
  }

  async registerOrConfirmSession(session, confirmTransfer = true) {
    if (!session?.access_token) return null;
    const sessionId = extractSessionIdFromToken(session.access_token);
    if (!sessionId) return null;

    this.currentSessionId = sessionId;
    const deviceFingerprint = getDeviceFingerprint();

    try {
      const { data, error } = await supabase.rpc("register_or_transfer_session", {
        p_session_id: sessionId,
        p_device_fingerprint: deviceFingerprint,
        p_ip: null,
        p_confirm_transfer: confirmTransfer,
        p_metadata: {
          client_platform: typeof navigator !== "undefined" ? navigator.platform : "web",
          registered_at: new Date().toISOString()
        }
      });

      if (error) {
        // If RPC does not exist yet (e.g. migration pending in production), fail open with warning
        console.warn("[SessionGuard] RPC register_or_transfer_session not available:", error.message);
        return null;
      }

      if (data) {
        if (data.status === "transfer_confirmation_required") {
          this.pendingTransfer = data;
          this.notify(this.getState());
          return data;
        }

        if (data.status === "transfer_limit_exceeded") {
          this.notifyDisplaced({
            reason: "transfer_limit_exceeded",
            error: data.error
          });
          return data;
        }

        if (data.status === "expired") {
          this.notifyExpired(data);
          return data;
        }

        if (data.status === "revoked" || data.code === "SESSION_REVOKED") {
          this.notifyExpired({ reason: "session_revoked", error: data.error });
          return data;
        }

        if (data.status === "forbidden" || data.code === "SESSION_ID_MISMATCH") {
          this.notifyDisplaced({ reason: "session_id_mismatch", error: data.error });
          return data;
        }

        this.isDisplaced = false;
        this.isExpired = false;
        this.displacementDetails = null;
        this.transferStats = {
          transfersToday: data.transfers_today || 0,
          maxTransfers: data.max_transfers || 5,
          transfersRemaining: typeof data.transfers_remaining === "number" ? data.transfers_remaining : 5
        };
        this.lastCheckedAt = new Date().toISOString();

        this.startHeartbeat();
        this.notify(this.getState());
      }

      return data;
    } catch (err) {
      console.warn("[SessionGuard] Registration failed:", err);
      return null;
    }
  }

  async confirmPendingTransfer() {
    if (!this.pendingTransfer) return null;
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      this.pendingTransfer = null;
      return this.registerOrConfirmSession(sessionData.session, true);
    }
    return null;
  }

  cancelPendingTransfer() {
    this.pendingTransfer = null;
    this.notify(this.getState());
  }

  async validateActiveSession() {
    if (!this.currentSessionId || this.isDisplaced || this.isExpired) return null;

    try {
      const { data, error } = await supabase.rpc("validate_session_guard", {
        p_session_id: this.currentSessionId,
        p_touch_activity: true,
        p_ip: null
      });

      if (error) {
        // If RPC not available, do not block local client
        return null;
      }

      if (data) {
        this.lastCheckedAt = new Date().toISOString();
        if (data.valid === false) {
          if (data.code === "SESSION_DISPLACED" || data.displaced) {
            this.notifyDisplaced(data);
          } else if (data.code === "SESSION_EXPIRED_INACTIVITY" || data.expired || data.code === "SESSION_REVOKED") {
            this.notifyExpired(data);
          } else if (data.code === "SESSION_ID_MISMATCH") {
            this.notifyDisplaced(data);
          }
        }
      }

      return data;
    } catch (err) {
      console.warn("[SessionGuard] Validation failed:", err);
      return null;
    }
  }

  startHeartbeat(intervalMs = 30000) {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.validateActiveSession();
    }, intervalMs);

    if (typeof window !== "undefined" && window.addEventListener) {
      this.visibilityHandler = () => {
        if (document.visibilityState === "visible") {
          this.validateActiveSession();
        }
      };
      document.addEventListener("visibilitychange", this.visibilityHandler);
    }
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (typeof window !== "undefined" && this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  async revokeSession() {
    this.stopHeartbeat();
    const sessionId = this.currentSessionId;
    this.currentSessionId = null;
    this.isDisplaced = false;
    this.isExpired = false;
    this.displacementDetails = null;

    if (sessionId) {
      try {
        await supabase.rpc("revoke_active_session", {
          p_session_id: sessionId,
          p_reason: "user_logout"
        });
      } catch (err) {
        console.warn("[SessionGuard] Revocation error:", err);
      }
    }
    this.notify(this.getState());
  }
}

export const sessionGuardService = new SessionGuardService();
