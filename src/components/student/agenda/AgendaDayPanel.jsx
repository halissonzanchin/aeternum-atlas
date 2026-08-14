import AgendaTaskCard from "./AgendaTaskCard";
import { useLanguage } from "../../../context/LanguageContext";
import { A26Button, A26Sidebar } from "../../aeternum-26";

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
  events = [],
  onNew,
  onEdit,
  onDelete,
  onComplete,
  navigate,
  children
}) {
  const { language, t } = useLanguage();
  const safeEvents = Array.isArray(events) ? events : [];

  return (
    <div className="agenda-day-full-workspace">
      <div className="agenda-day-full-header">
        <div>
          <span className="agenda-day-panel__eyebrow">{t("studyAgenda.selectedDate")}</span>
          <h2 className="agenda-day-panel__title">{formatSelectedDate(selectedDate, language, t)}</h2>
          <p className="agenda-day-panel__subtitle">{t("studyAgenda.activitiesCount", { count: safeEvents.length })}</p>
        </div>
        <A26Button variant="primary" onClick={onNew}>+ Nova Atividade</A26Button>
      </div>

      <div className="agenda-day-full-list">
        {safeEvents.length ? (
          <div className="agenda-day-grid-tasks">
            {safeEvents.map(event => (
              <AgendaTaskCard
                key={event.id}
                event={event}
                onComplete={onComplete}
                onEdit={onEdit}
                onDelete={onDelete}
                navigate={navigate}
              />
            ))}
          </div>
        ) : (
          <div className="agenda-empty-state agenda-empty-state--full">
            <strong>{t("studyAgenda.noActivities")}</strong>
            <p>{t("studyAgenda.noActivitiesHint")}</p>
            <A26Button variant="secondary" onClick={onNew}>{t("studyAgenda.createForDay")}</A26Button>
          </div>
        )}
      </div>
      {children ? <div className="agenda-day-insights">{children}</div> : null}
    </div>
  );
}
