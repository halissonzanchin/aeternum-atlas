import { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../services/auth/authService";
import { fetchAgendaEvents, createAgendaEvent, updateAgendaEvent, deleteAgendaEvent } from "../services/studyAgendaService";

export function formatAgendaDate(date) {
  const parsed = date instanceof Date ? date : new Date(`${date}T12:00:00`);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseAgendaDate(date) {
  if (date instanceof Date) return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  return new Date(`${date}T12:00:00`);
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
  return [...events].sort((a, b) => `${a.date} ${a.startTime || '00:00'}`.localeCompare(`${b.date} ${b.startTime || '00:00'}`));
}

export function useStudyAgenda() {
  const user = getCurrentUser();
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => parseAgendaDate(new Date()));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchAgendaEvents(user).then(data => {
      if (mounted) {
        setEvents(sortEvents(data));
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [user]);

  async function addEvent(event) {
    const dates = repeatedDates(event.date, event.repeat);
    const addedEvents = [];
    
    // Simplification for migration: Only creating first occurrence via supabase to avoid spam.
    // If repeat exists, others fallback to local logic or loop creation.
    for (const d of dates) {
       const payload = { ...event, date: d };
       const created = await createAgendaEvent(user, payload);
       if (created) addedEvents.push(created);
    }
    
    setEvents(previous => sortEvents([...previous, ...addedEvents]));
  }

  async function updateEvent(eventId, payload) {
    const success = await updateAgendaEvent(user, eventId, payload);
    if (success) {
      setEvents(previous => sortEvents(previous.map(event => event.id === eventId ? { ...event, ...payload, updatedAt: new Date().toISOString() } : event)));
    }
  }

  async function deleteEventItem(eventId) {
    const success = await deleteAgendaEvent(user, eventId);
    if (success) {
      setEvents(previous => previous.filter(event => event.id !== eventId));
    }
  }

  function completeEvent(eventId) {
    updateEvent(eventId, { status: "completed" });
  }

  function getEventsByDate(date) {
    const key = formatAgendaDate(date);
    return sortEvents(events.filter(event => event.date === key));
  }

  function getWeeklySummary(date = selectedDate) {
    const start = startOfWeek(date);
    const weekDates = Array.from({ length: 7 }, (_, index) => formatAgendaDate(addDays(start, index)));
    const weekEvents = events.filter(event => weekDates.includes(event.date));
    const completed = weekEvents.filter(event => event.status === "completed");
    const plannedMinutes = weekEvents.reduce((sum, event) => sum + durationMinutes(event), 0);
    const completedMinutes = completed.reduce((sum, event) => sum + durationMinutes(event), 0);

    return {
      scheduled: weekEvents.length,
      completed: completed.length,
      pending: weekEvents.filter(event => event.status === "pending").length,
      plannedMinutes,
      completedMinutes,
      completionRate: weekEvents.length ? Math.round((completed.length / weekEvents.length) * 100) : 0
    };
  }

  function getUpcomingReviews() {
    const today = formatAgendaDate(new Date());
    return sortEvents(events)
      .filter(event => event.type === "review" && event.date >= today && event.status !== "completed")
      .slice(0, 5);
  }

  const eventsByDate = useMemo(() => {
    return events.reduce((map, event) => {
      const list = map.get(event.date) || [];
      list.push(event);
      map.set(event.date, list);
      return map;
    }, new Map());
  }, [events]);

  return {
    events,
    eventsByDate,
    selectedDate,
    setSelectedDate,
    addEvent,
    updateEvent,
    deleteEvent: deleteEventItem,
    completeEvent,
    getEventsByDate,
    getWeeklySummary,
    getUpcomingReviews,
    loading
  };
}
