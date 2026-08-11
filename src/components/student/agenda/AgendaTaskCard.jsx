import LineIcon from "../../icons/LineIcon";
import { useLanguage } from "../../../context/LanguageContext";
import { A26Button, A26Card } from "../../aeternum-26";

export default function AgendaTaskCard({ event, onComplete, onEdit, onDelete, navigate }) {
  const { t } = useLanguage();
  const completed = event.status === "completed";

  function openLinkedModel() {
    if (event.linkedModelRoute && navigate) navigate(event.linkedModelRoute);
  }

  function openLinkedFlashcard() {
    if (navigate) navigate(event.linkedFlashcardRoute || "/flashcards");
  }

  return (
    <A26Card as="article" material="clear" className={`agenda-task-card agenda-task-card--${event.type} ${completed ? "is-completed" : ""}`}>
      <div className="agenda-task-card__time text-xs font-bold text-emerald-400 flex items-center gap-2">
        <LineIcon name="clock" />
        <span>{event.startTime} — {event.endTime}</span>
      </div>

      <div className="agenda-task-card__body space-y-2">
        <div className="agenda-task-card__header flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-agedGold">{event.title}</h3>
          <span className={`agenda-status agenda-status--${event.status}`}>
            {completed ? "✓ Concluído" : "Pendente"}
          </span>
        </div>
        
        {event.description ? (
          <p className="text-xs text-textMuted leading-relaxed bg-glassSurface/30 p-2.5 rounded-lg border border-glassBorder/20">
            {event.description}
          </p>
        ) : null}

        <div className="agenda-task-meta flex items-center gap-2 flex-wrap">
          <span>🫀 {event.anatomicalSystem || "Geral"}</span>
          <span>📚 {t(`studyAgenda.eventTypes.${event.type}`)}</span>
          <span>⚡ {t("studyAgenda.priorityLabel", { priority: t(`studyAgenda.priorities.${event.priority}`) })}</span>
        </div>

        {event.linkedModel ? (
          <div className="pt-1">
            <A26Button variant="liquid" className="text-xs px-3 py-1.5 w-full justify-start" onClick={openLinkedModel}>
              <span>🧊 Modelo 3D: {event.linkedModel} ➔</span>
            </A26Button>
          </div>
        ) : null}

        {event.linkedFlashcardDeck ? (
          <div className="pt-1">
            <A26Button variant="liquid" className="text-xs px-3 py-1.5 text-emerald-300 border-emerald-500/40 w-full justify-start" onClick={openLinkedFlashcard}>
              <span>🎴 Flashcards: {event.linkedFlashcardDeck} ➔</span>
            </A26Button>
          </div>
        ) : null}
      </div>

      <div className="agenda-task-actions flex items-center gap-2 pt-3 border-t border-glassBorder/20 flex-wrap">
        <A26Button
          type="button"
          variant={completed ? "ghost" : "liquid"}
          onClick={() => onComplete(event.id)}
        >
          {completed ? "✓ Concluído" : "✓ Concluir"}
        </A26Button>
        <A26Button type="button" variant="ghost" onClick={() => onEdit(event)}>
          ✏️ Editar
        </A26Button>
        <A26Button type="button" variant="danger" onClick={() => onDelete(event.id)}>
          🗑️ Excluir
        </A26Button>
      </div>
    </A26Card>
  );
}
