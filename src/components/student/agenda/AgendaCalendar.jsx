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
  const [viewMode, setViewMode] = useState(() => window.innerWidth <= 640 ? "week" : "month");
  const [cursor, setCursor] = useState(() => parseAgendaDate(selectedDate));
  const locale = localeFor(language);
  const days = useMemo(() => {
    if (viewMode === "month") return monthDays(cursor);
    if (viewMode === "week") return Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(selectedDate), index));
    return [parseAgendaDate(selectedDate)];
  }, [cursor, selectedDate, viewMode]);

  function shift(direction) {
    if (viewMode === "month") setCursor(current => addMonths(current, direction));
    if (viewMode === "week") {
      const next = addDays(selectedDate, direction * 7);
      setSelectedDate(next);
      setCursor(next);
    }
    if (viewMode === "day") {
      const next = addDays(selectedDate, direction);
      setSelectedDate(next);
      setCursor(next);
    }
  }

  function selectDay(day) {
    setSelectedDate(day);
    setCursor(day);
  }

  const title = viewMode === "month"
    ? new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(cursor)
    : viewMode === "week"
      ? t("studyAgenda.weekOf", { date: new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit" }).format(startOfWeek(selectedDate)) })
      : new Intl.DateTimeFormat(locale, { weekday: "long", day: "2-digit", month: "long" }).format(selectedDate);

  return (
    <section className="agenda-calendar">
      <div className="agenda-calendar__toolbar">
        <div className="agenda-view-switcher">
          {viewModes.map(mode => (
            <button
              key={mode}
              className={viewMode === mode ? "is-active" : ""}
              onClick={() => setViewMode(mode)}
            >
              {t(`studyAgenda.views.${mode}`)}
            </button>
          ))}
        </div>
        <div className="agenda-calendar__nav">
          <button onClick={() => shift(-1)} aria-label={t("actions.back")}><LineIcon name="chevron" /></button>
          <strong>{title}</strong>
          <button onClick={() => shift(1)} aria-label={t("actions.open")}><LineIcon name="chevron" /></button>
        </div>
      </div>

      {viewMode !== "day" ? (
        <>
          <div className="agenda-weekdays">
            {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map(day => <span key={day}>{t(`studyAgenda.weekdays.${day}`)}</span>)}
          </div>
          <div className={`agenda-calendar-grid agenda-calendar-grid--${viewMode}`}>
            {days.map(day => {
              const key = formatAgendaDate(day);
              const dayEvents = eventsByDate.get(key) || [];
              const outside = viewMode === "month" && day.getMonth() !== cursor.getMonth();
              return (
                <button
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
                  <span>{String(day.getDate()).padStart(2, "0")}</span>
                  {dayEvents.length ? (
                    <div className="agenda-day-markers">
                      {dayEvents.slice(0, 3).map(event => <i key={event.id} className={`agenda-marker agenda-marker--${event.type}`} />)}
                      <small>{t("studyAgenda.eventsShort", { count: dayEvents.length })}</small>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="agenda-day-focus">
          {(eventsByDate.get(formatAgendaDate(selectedDate)) || []).length ? (
            (eventsByDate.get(formatAgendaDate(selectedDate)) || []).map(event => (
              <button key={event.id} className={`agenda-day-focus-item agenda-day-focus-item--${event.type}`}>
                <span>{event.startTime} — {event.endTime}</span>
                <strong>{event.title}</strong>
                <small>{event.anatomicalSystem}</small>
              </button>
            ))
          ) : (
            <p>{t("studyAgenda.noActivities")}</p>
          )}
        </div>
      )}
    </section>
  );
}
