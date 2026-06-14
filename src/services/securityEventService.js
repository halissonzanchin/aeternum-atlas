import { trackEvent } from "./analytics/analyticsService";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase/supabaseClient";
import { readStorage, storageKeys, writeStorage } from "./storage/storageService";

export const securityEventTypes = {
  printscreenAttempt: "printscreen_attempt",
  devtoolsAttempt: "devtools_attempt",
  rightClickBlocked: "right_click_blocked",
  tabBlur: "tab_blur",
  screenRecordingSuspected: "screen_recording_suspected",
  unauthorizedShareSuspected: "unauthorized_share_suspected",
  shortcutBlocked: "shortcut_blocked",
  policyAccepted: "policy_accepted"
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function eventId() {
  return `sec-${crypto.randomUUID?.() || Date.now().toString(36)}`;
}

function resolveUserId(user) {
  return user?.id || user?.user_id || null;
}

function resolveInstitutionId(user) {
  return (
    user?.institutionId ||
    user?.institution_id ||
    user?.institution?.id ||
    user?.institution?.institution_id ||
    null
  );
}

function resolveModelId(model) {
  const rawModelId =
    model?.supabaseModelId ||
    model?.supabase_model_id ||
    model?.modelUuid ||
    model?.model_uuid ||
    model?.model_id ||
    model?.id ||
    null;

  return UUID_PATTERN.test(rawModelId || "") ? rawModelId : null;
}

function resolveRawModelId(model) {
  return (
    model?.id ||
    model?.slug ||
    model?.sketchfabUid ||
    model?.sketchfab_uid ||
    model?.model_id ||
    null
  );
}

function resolveUserAgent() {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent || "";
}

function persistLocalSecurityEvent(event) {
  const events = readStorage(storageKeys.securityEvents, []);
  writeStorage(storageKeys.securityEvents, [event, ...events].slice(0, 1200));
  return event;
}

export async function logSecurityEvent({
  user,
  model,
  eventType,
  metadata = {},
  sessionId = null
}) {
  if (!eventType) return null;

  const userId = resolveUserId(user);
  const institutionId = resolveInstitutionId(user);
  const modelId = resolveModelId(model);
  const rawModelId = resolveRawModelId(model);
  const timestamp = new Date().toISOString();
  const userAgent = resolveUserAgent();

  const enrichedMetadata = {
    ...metadata,
    session_id: sessionId,
    model_id_raw: rawModelId,
    model_title: model?.title || model?.shortTitle || null,
    path: typeof window !== "undefined" ? window.location.pathname : null
  };

  const localEvent = persistLocalSecurityEvent({
    id: eventId(),
    userId: userId || "anonymous",
    institutionId,
    modelId: modelId || rawModelId,
    eventType,
    metadata: enrichedMetadata,
    userAgent,
    timestamp,
    createdAt: timestamp,
    remoteStatus: "pending"
  });

  trackEvent({
    userId: userId || "anonymous",
    institutionId,
    role: user?.role || "student",
    modelId: modelId || rawModelId,
    eventType: `security_${eventType}`,
    metadata: enrichedMetadata,
    timestamp
  });

  if (!userId || !institutionId || !isSupabaseConfigured()) {
    return { localEvent, remoteEvent: null, error: null };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("security_events")
      .insert({
        institution_id: institutionId,
        user_id: userId,
        event_type: eventType,
        model_id: modelId,
        metadata: enrichedMetadata,
        user_agent: userAgent
      })
      .select()
      .maybeSingle();

    if (error) {
      console.warn("[security_events] Evento salvo localmente; envio remoto falhou.", error);
      return { localEvent, remoteEvent: null, error };
    }

    return { localEvent, remoteEvent: data, error: null };
  } catch (error) {
    console.warn("[security_events] Evento salvo localmente; envio remoto indisponível.", error);
    return { localEvent, remoteEvent: null, error };
  }
}
