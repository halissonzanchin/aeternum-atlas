import { useMemo, useState } from "react";
import LineIcon from "../../icons/LineIcon";
import { formatAgendaDate, parseAgendaDate } from "../../../hooks/useStudyAgenda";
import { useLanguage } from "../../../context/LanguageContext";

const viewModes = ["month", "week", "day"];

function sameDate(a, b) {
  return formatAgendaDate(a) === formatAgendaDate(b);
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

function startOfWeek(date) {
  const next = parseAgendaDate(date);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

function monthDays(cursor) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 12);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function localeFor(language) {
  return { pt: "pt-BR", es: "es-ES", en: "en-US", de: "de-DE" }[language] || "pt-BR";
}

export default function AgendaCalendar({ eventsByDate, selectedDate, setSelectedDate }) {
  const { language, t } = useLanguage();
  const safeSelected = selectedDate ? parseAgendaDate(selectedDate) : new Date();

  const days = useMemo(() => {
    return monthDays(safeSelected);
  }, [safeSelected]);

  function selectDay(day) {
    setSelectedDate(day);
  }

  return (
    <section className="agenda-calendar">
      <div className="agenda-weekdays">
        {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map(day => <span key={day}>{t(`studyAgenda.weekdays.${day}`)}</span>)}
      </div>
      <div className="agenda-calendar-grid agenda-calendar-grid--month">
        {days.map(day => {
          const key = formatAgendaDate(day);
          const dayEvents = (eventsByDate && typeof eventsByDate.get === 'function') ? (eventsByDate.get(key) || []) : [];
          const outside = day.getMonth() !== safeSelected.getMonth();
          return (
            <div
              key={key}
              className={[
                "agenda-day-cell",
                outside ? "is-outside" : "",
                sameDate(day, new Date()) ? "is-today" : "",
                sameDate(day, selectedDate) ? "is-selected" : "",
                dayEvents.length ? "has-events" : ""
              ].join(" ")}
              onClick={() => selectDay(day)}
            >
              <div className="agenda-day-cell__top">
                <span className="agenda-day-cell__number">{day.getDate()}</span>
              </div>
              <div className="agenda-day-cell__chips">
                {dayEvents.slice(0, 3).map(evt => (
                  <div key={evt.id} className={`agenda-event-chip agenda-event-chip--${evt.createdByRole || "student"}`}>
                    <span className="agenda-event-chip__time">{evt.startTime || "09:00"}</span>
                    <span className="agenda-event-chip__title">{evt.title}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="agenda-event-chip agenda-event-chip--more">
                    +{dayEvents.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
