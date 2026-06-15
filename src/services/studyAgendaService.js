import { getSupabaseClient, isSupabaseConfigured } from "./supabase/supabaseClient";
import { agendaEvents } from "../data/mockStudyAgenda";

const STORAGE_KEY = "aeternum_study_agenda";

function id() {
  return `evt-${crypto.randomUUID?.() || Date.now()}`;
}

function readLocalStorage() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : agendaEvents;
  } catch {
    return agendaEvents;
  }
}

function writeLocalStorage(events) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function mapToAppEvent(dbEvent) {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    description: dbEvent.description || "",
    date: dbEvent.date,
    priority: dbEvent.priority || "medium",
    status: dbEvent.status || "pending",
    type: "study",
    anatomical_system: dbEvent.anatomical_system,
    linked_model_id: dbEvent.linked_model_id,
    reminder_enabled: dbEvent.reminder_enabled,
    startTime: "09:00",
    endTime: "10:00", // Default 1 hour to keep UI metrics working
  };
}

export async function fetchAgendaEvents(user) {
  if (!user?.id || !isSupabaseConfigured()) {
    return readLocalStorage();
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("study_agenda")
    .select("*")
    .eq("user_id", user.id);

  if (error || !data) {
    console.error("Supabase fallback: fetchAgendaEvents failed", error);
    return readLocalStorage();
  }

  return data.map(mapToAppEvent);
}

export async function createAgendaEvent(user, eventPayload) {
  const localEvent = {
    ...eventPayload,
    id: id(),
    createdAt: new Date().toISOString()
  };

  if (!user?.id || !isSupabaseConfigured()) {
    const current = readLocalStorage();
    writeLocalStorage([...current, localEvent]);
    return localEvent;
  }

  const client = getSupabaseClient();
  const { data, error } = await client.from("study_agenda").insert([{
    user_id: user.id,
    title: eventPayload.title,
    description: eventPayload.description || "",
    date: eventPayload.date,
    priority: eventPayload.priority || "medium",
    status: eventPayload.status || "pending"
  }]).select().single();

  if (error || !data) {
    console.error("Supabase fallback: createAgendaEvent failed", error);
    const current = readLocalStorage();
    writeLocalStorage([...current, localEvent]);
    return localEvent;
  }

  return mapToAppEvent(data);
}

export async function updateAgendaEvent(user, eventId, payload) {
  if (!user?.id || !isSupabaseConfigured()) {
    const current = readLocalStorage();
    const updated = current.map(evt => evt.id === eventId ? { ...evt, ...payload, updatedAt: new Date().toISOString() } : evt);
    writeLocalStorage(updated);
    return true;
  }

  // Se eventId é fake (gerado pelo fallback), tentar atualizar no localStorage também só por garantia
  if (String(eventId).startsWith("evt-")) {
    const current = readLocalStorage();
    writeLocalStorage(current.map(evt => evt.id === eventId ? { ...evt, ...payload } : evt));
    return true;
  }

  const client = getSupabaseClient();
  const updateData = {};
  if (payload.status) updateData.status = payload.status;
  if (payload.title) updateData.title = payload.title;
  if (payload.description !== undefined) updateData.description = payload.description;

  const { error } = await client
    .from("study_agenda")
    .update(updateData)
    .eq("id", eventId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Supabase fallback: updateAgendaEvent failed", error);
    return false;
  }
  return true;
}

export async function deleteAgendaEvent(user, eventId) {
  if (!user?.id || !isSupabaseConfigured()) {
    const current = readLocalStorage();
    writeLocalStorage(current.filter(evt => evt.id !== eventId));
    return true;
  }

  if (String(eventId).startsWith("evt-")) {
    const current = readLocalStorage();
    writeLocalStorage(current.filter(evt => evt.id !== eventId));
    return true;
  }

  const client = getSupabaseClient();
  const { error } = await client
    .from("study_agenda")
    .delete()
    .eq("id", eventId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Supabase fallback: deleteAgendaEvent failed", error);
    return false;
  }
  return true;
}
