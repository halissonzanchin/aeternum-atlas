import { useEffect, useMemo, useRef, useState } from "react";
import LineIcon from "../../icons/LineIcon";
import { formatAgendaDate, parseAgendaDate } from "../../../hooks/useStudyAgenda";
import { useLanguage } from "../../../context/LanguageContext";

const hoursList = Array.from({ length: 15 }, (_, i) => i + 7); // 07:00 to 21:00

function getMinutesFromTimeStr(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function getEventStyle(event) {
  const startMins = getMinutesFromTimeStr(event.startTime);
  const endMins = getMinutesFromTimeStr(event.endTime) || startMins + 60;
  const duration = Math.max(30, endMins - startMins);
  
  const startOffset = startMins - 7 * 60; // 07:00 baseline
  const topPx = Math.max(0, (startOffset / 60) * 48);
  const heightPx = (duration / 60) * 48;

  return {
    top: `${topPx}px`,
    height: `${heightPx}px`
  };
}

export default function AgendaHourlyGrid({ eventsByDate, selectedDate, setSelectedDate, onSelectEvent, onNewActivity }) {
  const { language, t } = useLanguage();
  const containerRef = useRef(null);

  // Auto scroll to 8:00 AM on mount or view change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 48; // 1 hour offset (08:00 AM)
    }
  }, []);

  // Compute week dates (Monday to Sunday)
  const weekDays = useMemo(() => {
    const curr = parseAgendaDate(selectedDate);
    const first = new Date(curr);
    const safeFirst = isNaN(first.getTime()) ? new Date() : first;
    const dayOfWeek = safeFirst.getDay();
    const diff = safeFirst.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday baseline
    safeFirst.setDate(diff);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(safeFirst);
      d.setDate(safeFirst.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const todayStr = formatAgendaDate(new Date());

  // Current time line position
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNowLine = nowMinutes >= 7 * 60 && nowMinutes <= 22 * 60;
  const nowTopPx = ((nowMinutes - 7 * 60) / 60) * 48;

  return (
    <div ref={containerRef} className="a26-hourly-grid-container">
      {/* Weekday Header Columns & All-Day Slot (Google Calendar Pattern) */}
      <div className="a26-hourly-grid__top-bar">
        <button
          className="a26-today-jump-btn"
          onClick={() => setSelectedDate(new Date())}
        >
          <span>🎯 Hoje</span>
        </button>
        <span className="a26-top-bar-divider" />
        <span className="a26-top-bar-subtitle">Semana Acadêmica & Simulados</span>
      </div>

      <div className="a26-hourly-grid__header">
        <div className="a26-hourly-grid__time-col-header">Horário</div>
        {weekDays.map(day => {
          const dateKey = formatAgendaDate(day);
          const isToday = dateKey === todayStr;
          const isSelected = dateKey === formatAgendaDate(selectedDate);

          let weekdayName = "";
          try {
            weekdayName = new Intl.DateTimeFormat(language === "pt" ? "pt-BR" : "en-US", { weekday: "short" }).format(day);
          } catch {
            weekdayName = "—";
          }
          const dayNum = day instanceof Date && !isNaN(day.getTime()) ? String(day.getDate()).padStart(2, "0") : "--";

          return (
            <button
              key={dateKey}
              className={[
                "a26-hourly-grid__day-header",
                isToday ? "is-today" : "",
                isSelected ? "is-selected" : ""
              ].join(" ")}
              onClick={() => setSelectedDate(day)}
            >
              <span className="a26-hourly-grid__weekday">{weekdayName}</span>
              <span className="a26-hourly-grid__daynum">{dayNum}</span>
            </button>
          );
        })}
      </div>

      {/* All-Day Events Slot Row */}
      <div className="a26-all-day-row">
        <div className="a26-all-day-label">Dia Todo</div>
        <div className="a26-all-day-columns">
          {weekDays.map(day => {
            const dateKey = formatAgendaDate(day);
            const dayEvents = (eventsByDate.get(dateKey) || []).filter(e => e.type === "exam" || e.priority === "urgent");

            return (
              <div key={dateKey} className="a26-all-day-cell">
                {dayEvents.map(evt => (
                  <div
                    key={evt.id}
                    className="a26-all-day-badge"
                    onClick={() => onSelectEvent(evt)}
                  >
                    <span>🏛️ {evt.title}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hourly Grid Body */}
      <div className="a26-hourly-grid__body">
        {/* Time Sidebar */}
        <div className="a26-hourly-grid__time-sidebar">
          {hoursList.map(h => (
            <div key={h} className="a26-hourly-grid__time-slot">
              <span>{String(h).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>

        {/* 7 Days Columns */}
        <div className="a26-hourly-grid__columns">
          {hoursList.map(h => (
            <div key={h} className="a26-hourly-grid__row-line" style={{ top: `${(h - 7) * 64}px` }} />
          ))}

          {showNowLine && (
            <div className="a26-hourly-grid__now-line" style={{ top: `${nowTopPx}px` }}>
              <span className="a26-hourly-grid__now-dot" />
            </div>
          )}

          {weekDays.map(day => {
            const dateKey = formatAgendaDate(day);
            const dayEvents = eventsByDate.get(dateKey) || [];

            return (
              <div key={dateKey} className="a26-hourly-grid__day-column">
                {dayEvents.map(event => {
                  const roleClass = event.createdByRole ? `by-${event.createdByRole}` : "by-student";
                  const style = getEventStyle(event);

                  return (
                    <div
                      key={event.id}
                      className={`a26-hourly-event-card ${roleClass} priority-${event.priority || "medium"}`}
                      style={style}
                      onClick={() => onSelectEvent(event)}
                    >
                      <div className="a26-hourly-event__header">
                        <span className="a26-hourly-event__time">{event.startTime} - {event.endTime}</span>
                        {event.creatorAvatar && <span className="a26-hourly-event__badge">{event.creatorAvatar}</span>}
                      </div>
                      <strong className="a26-hourly-event__title">{event.title}</strong>
                      <span className="a26-hourly-event__system">{event.anatomicalSystem}</span>

                      {event.linkedModel && (
                        <div className="a26-hourly-event__model-tag">
                          <span>👁️ 3D Modelo</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
