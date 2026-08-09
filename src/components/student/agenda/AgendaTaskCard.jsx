import LineIcon from "../../icons/LineIcon";
import { useLanguage } from "../../../context/LanguageContext";
import { A26Button, A26Card } from "../../aeternum-26";

export default function AgendaTaskCard({ event, onComplete, onEdit, onDelete, navigate }) {
  const { t } = useLanguage();
  const completed = event.status === "completed";

  function openLinkedModel() {
    if (event.linkedModelRoute) navigate(event.linkedModelRoute);
  }

  return (
    <A26Card as="article" material="clear" className={`agenda-task-card agenda-task-card--${event.type} ${completed ? "is-completed" : ""}`}>
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
          <A26Button variant="ghost" className="agenda-linked-model" onClick={openLinkedModel}>
            <LineIcon name="layers" />
            {t("studyAgenda.linkedModel")}: {event.linkedModel}
          </A26Button>
        ) : null}
      </div>

      <div className="agenda-task-actions">
        <A26Button type="button" variant="liquid" disabled={completed} onClick={() => onComplete(event.id)}>
          <LineIcon name="check" />
          {t("studyAgenda.complete")}
        </A26Button>
        <A26Button type="button" variant="ghost" onClick={() => onEdit(event)}>
          {t("studyAgenda.edit")}
        </A26Button>
        <A26Button type="button" variant="danger" className="danger" onClick={() => onDelete(event.id)}>
          {t("studyAgenda.delete")}
        </A26Button>
      </div>
    </A26Card>
  );
}
