import { agendaEvents } from "../../data/mockStudyAgenda";
import { readStorage, storageKeys, writeStorage } from "../storage/storageService";

function normalizeEvent(event) {
  return {
    id: event.id || `evt-${crypto.randomUUID?.() || Date.now()}`,
    status: "pending",
    priority: "medium",
    type: "study",
    repeat: "none",
    reminder: "none",
    ...event
  };
}

export function listStudyAgendaEvents(userId = "student-demo") {
  const allEvents = readStorage(storageKeys.studyAgenda, null);
  const source = allEvents || agendaEvents.map(event => ({ ...event, userId }));
  writeStorage(storageKeys.studyAgenda, source);
  return source.filter(event => !event.userId || event.userId === userId);
}

export function saveStudyAgendaEvents(events) {
  return writeStorage(storageKeys.studyAgenda, events);
}

export function addStudyAgendaEvent(userId, payload) {
  const events = readStorage(storageKeys.studyAgenda, agendaEvents.map(event => ({ ...event, userId })));
  const event = normalizeEvent({ ...payload, userId });
  saveStudyAgendaEvents([...events, event]);
  return event;
}

export function updateStudyAgendaEvent(eventId, payload) {
  const events = readStorage(storageKeys.studyAgenda, []);
  const nextEvents = events.map(event => event.id === eventId ? normalizeEvent({ ...event, ...payload }) : event);
  saveStudyAgendaEvents(nextEvents);
  return nextEvents.find(event => event.id === eventId) || null;
}

export function deleteStudyAgendaEvent(eventId) {
  const events = readStorage(storageKeys.studyAgenda, []);
  const nextEvents = events.filter(event => event.id !== eventId);
  saveStudyAgendaEvents(nextEvents);
  return nextEvents;
}

export function completeStudyAgendaEvent(eventId) {
  return updateStudyAgendaEvent(eventId, { status: "completed", completedAt: new Date().toISOString() });
}

export function getStudyAgendaEventsByDate(userId, date) {
  const dateKey = typeof date === "string" ? date : date.toISOString().slice(0, 10);
  return listStudyAgendaEvents(userId).filter(event => event.date === dateKey);
}

export function getUpcomingReviews(userId, limit = 5) {
  const today = new Date().toISOString().slice(0, 10);
  return listStudyAgendaEvents(userId)
    .filter(event => event.type === "review" && event.date >= today && event.status !== "completed")
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
    .slice(0, limit);
}
