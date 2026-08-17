import { getSupabaseClient, isSupabaseConfigured } from "./supabase/supabaseClient.js";

const STORAGE_PREFIX = "aeternum_study_agenda_v2";

function storageKey(userId = "anonymous") {
  return `${STORAGE_PREFIX}:${userId}`;
}

function createId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readLocalEvents(userId) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(userId)) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalEvents(userId, events) {
  window.localStorage.setItem(storageKey(userId), JSON.stringify(events));
}

function mapToAppEvent(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    date: row.date,
    startTime: String(row.start_time || row.startTime || "09:00").slice(0, 5),
    endTime: String(row.end_time || row.endTime || "10:00").slice(0, 5),
    type: row.type || "study",
    priority: row.priority || "medium",
    anatomicalSystem: row.anatomical_system || row.anatomicalSystem || "Geral",
    linkedModel: row.linked_model || row.linkedModel || "",
    linkedModelRoute: row.linked_model_route || row.linkedModelRoute || "",
    linkedFlashcardDeck: row.linked_flashcard_deck || row.linkedFlashcardDeck || "",
    linkedFlashcardRoute: row.linked_flashcard_route || row.linkedFlashcardRoute || "/flashcards",
    reminder: row.reminder || "none",
    status: row.status || "pending",
    createdByRole: row.created_by_role || row.createdByRole || "student",
    creatorName: row.creator_name || row.creatorName || "Usuário",
    creatorAvatar: row.creator_avatar || row.creatorAvatar || "",
    isShared: Boolean(row.is_shared_with_students ?? row.isShared),
    syncState: row.syncState || "synced",
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}

function mapToDatabaseEvent(user, event) {
  return {
    id: event.id,
    user_id: user.id,
    institution_id: user.institutionId || user.institution_id || null,
    created_by_role: event.createdByRole || "student",
    creator_name: event.creatorName || user.name || user.email || "Usuário",
    creator_avatar: event.creatorAvatar || null,
    title: String(event.title || "").trim().slice(0, 180),
    description: String(event.description || "").trim().slice(0, 4000),
    date: event.date,
    start_time: event.startTime || "09:00",
    end_time: event.endTime || "10:00",
    type: event.type || "study",
    priority: event.priority || "medium",
    anatomical_system: event.anatomicalSystem || "Geral",
    linked_model: event.linkedModel || null,
    linked_model_route: event.linkedModelRoute || null,
    linked_flashcard_deck: event.linkedFlashcardDeck || null,
    linked_flashcard_route: event.linkedFlashcardRoute || null,
    reminder: event.reminder || "none",
    status: event.status || "pending",
    is_shared_with_students: Boolean(event.isShared),
    target_group: event.targetGroup || "self"
  };
}

function pendingLocalEvents(userId) {
  return readLocalEvents(userId).filter((event) => event.syncState === "pending");
}

async function flushPendingEvents(client, user) {
  const pending = pendingLocalEvents(user.id);
  if (!pending.length) return [];

  const records = pending.map((event) => mapToDatabaseEvent(user, event));
  const { data, error } = await client
    .from("study_agenda_events")
    .upsert(records, { onConflict: "id" })
    .select("*");

  if (error) return pending;
  writeLocalEvents(user.id, []);
  return (data || []).map(mapToAppEvent);
}

export async function fetchAgendaEvents(user) {
  if (!user?.id) return { events: [], syncStatus: "auth-required", error: null };

  const local = readLocalEvents(user.id);
  if (!isSupabaseConfigured()) {
    return { events: local, syncStatus: "local", error: null };
  }

  const client = getSupabaseClient();
  const stillPending = await flushPendingEvents(client, user);
  const { data, error } = await client
    .from("study_agenda_events")
    .select("*")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return { events: local, syncStatus: "pending", error: error.message };
  }

  const remote = (data || []).map(mapToAppEvent);
  const remoteIds = new Set(remote.map((event) => event.id));
  const pending = stillPending.filter((event) => !remoteIds.has(event.id));
  return {
    events: [...remote, ...pending],
    syncStatus: pending.length ? "pending" : "synced",
    error: null
  };
}

export async function createAgendaEvent(user, eventPayload) {
  if (!user?.id) return { event: null, syncStatus: "auth-required", error: "Sessão obrigatória." };

  const localEvent = mapToAppEvent({
    ...eventPayload,
    id: createId(),
    creatorName: user.name || user.email || "Usuário",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncState: "pending"
  });

  if (!isSupabaseConfigured()) {
    writeLocalEvents(user.id, [...readLocalEvents(user.id), localEvent]);
    return { event: localEvent, syncStatus: "local", error: null };
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("study_agenda_events")
    .insert(mapToDatabaseEvent(user, localEvent))
    .select("*")
    .single();

  if (error || !data) {
    writeLocalEvents(user.id, [...readLocalEvents(user.id), localEvent]);
    return { event: localEvent, syncStatus: "pending", error: error?.message || "Falha de sincronização." };
  }
  return { event: mapToAppEvent(data), syncStatus: "synced", error: null };
}

export async function updateAgendaEvent(user, eventId, payload) {
  if (!user?.id) return { success: false, syncStatus: "auth-required", error: "Sessão obrigatória." };
  const localEvents = readLocalEvents(user.id);
  const isPendingLocal = localEvents.some((event) => event.id === eventId && event.syncState === "pending");
  if (!isSupabaseConfigured() || isPendingLocal) {
    const events = localEvents.map((event) => event.id === eventId
      ? { ...event, ...payload, syncState: "pending", updatedAt: new Date().toISOString() }
      : event);
    writeLocalEvents(user.id, events);
    return { success: true, syncStatus: isSupabaseConfigured() ? "pending" : "local", error: null };
  }

  const fieldMap = {
    title: "title",
    description: "description",
    date: "date",
    startTime: "start_time",
    endTime: "end_time",
    type: "type",
    priority: "priority",
    anatomicalSystem: "anatomical_system",
    linkedModel: "linked_model",
    linkedModelRoute: "linked_model_route",
    linkedFlashcardDeck: "linked_flashcard_deck",
    linkedFlashcardRoute: "linked_flashcard_route",
    reminder: "reminder",
    status: "status"
  };
  const databasePayload = Object.fromEntries(
    Object.entries(payload)
      .filter(([key]) => fieldMap[key])
      .map(([key, value]) => [fieldMap[key], value])
  );
  if (typeof databasePayload.title === "string") databasePayload.title = databasePayload.title.trim().slice(0, 180);
  if (typeof databasePayload.description === "string") databasePayload.description = databasePayload.description.trim().slice(0, 4000);
  const { error } = await getSupabaseClient()
    .from("study_agenda_events")
    .update(databasePayload)
    .eq("id", eventId)
    .eq("user_id", user.id);
  return error
    ? { success: false, syncStatus: "pending", error: error.message }
    : { success: true, syncStatus: "synced", error: null };
}

export async function deleteAgendaEvent(user, eventId) {
  if (!user?.id) return { success: false, syncStatus: "auth-required", error: "Sessão obrigatória." };
  const localEvents = readLocalEvents(user.id);
  const isPendingLocal = localEvents.some((event) => event.id === eventId && event.syncState === "pending");
  if (!isSupabaseConfigured() || isPendingLocal) {
    writeLocalEvents(user.id, localEvents.filter((event) => event.id !== eventId));
    return { success: true, syncStatus: isSupabaseConfigured() ? "pending" : "local", error: null };
  }

  const { error } = await getSupabaseClient()
    .from("study_agenda_events")
    .delete()
    .eq("id", eventId)
    .eq("user_id", user.id);
  return error
    ? { success: false, syncStatus: "pending", error: error.message }
    : { success: true, syncStatus: "synced", error: null };
}
