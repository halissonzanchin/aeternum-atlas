import { useEffect, useMemo, useState } from "react";
import { fetchAgendaEvents, createAgendaEvent, updateAgendaEvent, deleteAgendaEvent } from "../services/studyAgendaService";
import { useAuth } from "../context/AuthContext";

export function formatAgendaDate(date) {
  if (!date) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }
  let parsed;
  if (date instanceof Date) {
    parsed = isNaN(date.getTime()) ? new Date() : date;
  } else {
    const str = String(date).trim();
    if (!str || str === "undefined" || str === "null") parsed = new Date();
    else parsed = new Date(str.includes("T") ? str : `${str}T12:00:00`);
    if (isNaN(parsed.getTime())) parsed = new Date();
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseAgendaDate(date) {
  if (!date) return new Date();
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? new Date() : new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  }
  const str = String(date).trim();
  if (!str || str === "undefined" || str === "null") return new Date();
  const parsed = new Date(str.includes("T") ? str : `${str}T12:00:00`);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function startOfWeek(date) {
  const parsed = parseAgendaDate(date);
  parsed.setDate(parsed.getDate() - parsed.getDay());
  return parsed;
}

function addDays(date, amount) {
  const next = parseAgendaDate(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date, amount) {
  const next = parseAgendaDate(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function durationMinutes(event) {
  const [startHour = 0, startMinute = 0] = (event.startTime || "00:00").split(":").map(Number);
  const [endHour = 0, endMinute = 0] = (event.endTime || event.startTime || "00:00").split(":").map(Number);
  return Math.max(0, (endHour * 60 + endMinute) - (startHour * 60 + startMinute));
}

function repeatedDates(startDate, repeat) {
  if (!repeat || repeat === "none") return [startDate];

  const dates = [startDate];
  for (let index = 1; index < 5; index += 1) {
    if (repeat === "daily") dates.push(formatAgendaDate(addDays(startDate, index)));
    if (repeat === "weekly") dates.push(formatAgendaDate(addDays(startDate, index * 7)));
    if (repeat === "biweekly") dates.push(formatAgendaDate(addDays(startDate, index * 15)));
    if (repeat === "monthly") dates.push(formatAgendaDate(addMonths(startDate, index)));
  }
  return dates;
}

function sortEvents(events) {
  if (!Array.isArray(events)) return [];
  return [...events].sort((a, b) => `${a?.date || ''} ${a?.startTime || '00:00'}`.localeCompare(`${b?.date || ''} ${b?.startTime || '00:00'}`));
}

export function useStudyAgenda() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => parseAgendaDate(new Date()));
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("loading");
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchAgendaEvents(user)
      .then(result => {
        if (mounted) {
          const rawEvents = result && Array.isArray(result.events) ? result.events : [];
          setEvents(sortEvents(rawEvents));
          setSyncStatus(result?.syncStatus || "local");
          setSyncError(result?.error || null);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setEvents([]);
          setSyncStatus("local");
          setSyncError(err?.message || "Erro no carregamento");
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [user?.id]);

  async function addEvent(event) {
    if (!event) return { success: false, error: "Atividade inválida." };
    const dates = repeatedDates(event.date || formatAgendaDate(new Date()), event.repeat);
    const addedEvents = [];
    
    for (const d of dates) {
       const payload = { ...event, date: d };
       const result = await createAgendaEvent(user, payload);
       if (result?.event) addedEvents.push(result.event);
       if (result?.syncStatus) setSyncStatus(result.syncStatus);
       if (result?.error) setSyncError(result.error);
    }
    
    setEvents(previous => sortEvents([...(Array.isArray(previous) ? previous : []), ...addedEvents]));
    return {
      success: addedEvents.length === dates.length,
      events: addedEvents,
      error: addedEvents.length === dates.length ? null : "Não foi possível salvar todas as ocorrências."
    };
  }

  async function updateEvent(eventId, payload) {
    if (!eventId) return { success: false, error: "Atividade inválida." };
    const result = await updateAgendaEvent(user, eventId, payload);
    if (result?.syncStatus) setSyncStatus(result.syncStatus);
    if (result?.error) setSyncError(result.error);
    if (result?.success) {
      setEvents(previous => sortEvents((Array.isArray(previous) ? previous : []).map(event => event?.id === eventId ? { ...event, ...payload, updatedAt: new Date().toISOString() } : event)));
    }
    return result;
  }

  async function deleteEventItem(eventId) {
    if (!eventId) return;
    const result = await deleteAgendaEvent(user, eventId);
    if (result?.syncStatus) setSyncStatus(result.syncStatus);
    if (result?.error) setSyncError(result.error);
    if (result?.success) {
      setEvents(previous => (Array.isArray(previous) ? previous : []).filter(event => event?.id !== eventId));
    }
  }

  function completeEvent(eventId) {
    updateEvent(eventId, { status: "completed" });
  }

  function getEventsByDate(date) {
    if (!date) return [];
    const key = formatAgendaDate(date);
    const safeEvents = Array.isArray(events) ? events : [];
    return sortEvents(safeEvents.filter(event => event && event.date === key));
  }

  function getWeeklySummary(date = selectedDate) {
    const safeDate = date || new Date();
    const start = startOfWeek(safeDate);
    const weekDates = Array.from({ length: 7 }, (_, index) => formatAgendaDate(addDays(start, index)));
    const safeEvents = Array.isArray(events) ? events : [];
    const weekEvents = safeEvents.filter(event => event && weekDates.includes(event.date));
    const completed = weekEvents.filter(event => event && event.status === "completed");
    const plannedMinutes = weekEvents.reduce((sum, event) => sum + durationMinutes(event), 0);
    const completedMinutes = completed.reduce((sum, event) => sum + durationMinutes(event), 0);

    return {
      scheduled: weekEvents.length,
      completed: completed.length,
      pending: weekEvents.filter(event => event && event.status === "pending").length,
      plannedMinutes,
      completedMinutes,
      completionRate: weekEvents.length ? Math.round((completed.length / weekEvents.length) * 100) : 0
    };
  }

  function getUpcomingReviews() {
    const today = formatAgendaDate(new Date());
    const safeEvents = Array.isArray(events) ? events : [];
    return sortEvents(safeEvents)
      .filter(event => event && event.type === "review" && event.date >= today && event.status !== "completed")
      .slice(0, 5);
  }

  const eventsByDate = useMemo(() => {
    const safeEvents = Array.isArray(events) ? events : [];
    return safeEvents.reduce((map, event) => {
      if (!event || !event.date) return map;
      const list = map.get(event.date) || [];
      list.push(event);
      map.set(event.date, list);
      return map;
    }, new Map());
  }, [events]);

  return {
    events: Array.isArray(events) ? events : [],
    eventsByDate,
    selectedDate: selectedDate || new Date(),
    setSelectedDate,
    addEvent,
    updateEvent,
    deleteEvent: deleteEventItem,
    completeEvent,
    getEventsByDate,
    getWeeklySummary,
    getUpcomingReviews,
    loading,
    syncStatus,
    syncError
  };
}
