import AgendaTaskCard from "./AgendaTaskCard";
import { useLanguage } from "../../../context/LanguageContext";

function formatSelectedDate(date, language, t) {
  const today = new Date();
  const selected = date instanceof Date ? date : new Date(`${date}T12:00:00`);
  const isToday = today.toDateString() === selected.toDateString();
  const localeMap = {
    pt: "pt-BR",
    es: "es-ES",
    en: "en-US",
    de: "de-DE"
  };
  const formatted = new Intl.DateTimeFormat(localeMap[language] || "pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(selected);
  return isToday ? `${t("common.today")} — ${formatted}` : formatted;
}

export default function AgendaDayPanel({
  selectedDate,
  events,
  onNew,
  onEdit,
  onDelete,
  onComplete,
  navigate,
  children
}) {
  const { language, t } = useLanguage();

  return (
    <aside className="agenda-day-panel">
      <div className="agenda-day-panel__header">
        <span>{t("studyAgenda.selectedDate")}</span>
        <h2>{formatSelectedDate(selectedDate, language, t)}</h2>
        <p>{t("studyAgenda.activitiesCount", { count: events.length })}</p>
        <button className="viewer-primary-button" onClick={onNew}>{t("studyAgenda.newActivity")}</button>
      </div>

      <div className="agenda-day-list">
        {events.length ? events.map(event => (
          <AgendaTaskCard
            key={event.id}
            event={event}
            onComplete={onComplete}
            onEdit={onEdit}
            onDelete={onDelete}
            navigate={navigate}
          />
        )) : (
          <div className="agenda-empty-state">
            <strong>{t("studyAgenda.noActivities")}</strong>
            <p>{t("studyAgenda.noActivitiesHint")}</p>
            <button className="viewer-secondary-button" onClick={onNew}>{t("studyAgenda.createForDay")}</button>
          </div>
        )}
      </div>

      {children}
    </aside>
  );
}
