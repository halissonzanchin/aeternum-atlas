import LineIcon from "../../icons/LineIcon";
import { useLanguage } from "../../../context/LanguageContext";

export default function AgendaTaskCard({ event, onComplete, onEdit, onDelete, navigate }) {
  const { t } = useLanguage();
  const completed = event.status === "completed";

  function openLinkedModel() {
    if (event.linkedModelRoute) navigate(event.linkedModelRoute);
  }

  return (
    <article className={`agenda-task-card agenda-task-card--${event.type} ${completed ? "is-completed" : ""}`}>
      <div className="agenda-task-card__time">
        <LineIcon name="clock" />
        <span>{event.startTime} — {event.endTime}</span>
      </div>

      <div className="agenda-task-card__body">
        <div className="agenda-task-card__header">
          <h3>{event.title}</h3>
          <span className={`agenda-status agenda-status--${event.status}`}>{t(`studyAgenda.status.${event.status}`)}</span>
        </div>
        {event.description ? <p>{event.description}</p> : null}
        <div className="agenda-task-meta">
          <span>{event.anatomicalSystem}</span>
          <span>{t(`studyAgenda.eventTypes.${event.type}`)}</span>
          <span>{t("studyAgenda.priorityLabel", { priority: t(`studyAgenda.priorities.${event.priority}`) })}</span>
        </div>
        {event.linkedModel ? (
          <button className="agenda-linked-model" onClick={openLinkedModel}>
            <LineIcon name="layers" />
            {t("studyAgenda.linkedModel")}: {event.linkedModel}
          </button>
        ) : null}
      </div>

      <div className="agenda-task-actions">
        <button type="button" disabled={completed} onClick={() => onComplete(event.id)}>
          <LineIcon name="check" />
          {t("studyAgenda.complete")}
        </button>
        <button type="button" onClick={() => onEdit(event)}>
          {t("studyAgenda.edit")}
        </button>
        <button type="button" className="danger" onClick={() => onDelete(event.id)}>
          {t("studyAgenda.delete")}
        </button>
      </div>
    </article>
  );
}
