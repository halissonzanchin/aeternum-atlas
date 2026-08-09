import LineIcon from "../../icons/LineIcon";
import { useLanguage } from "../../../context/LanguageContext";

export default function AgendaPopoverModal({ event, onClose, onComplete, onEdit, onDelete, navigate }) {
  const { t } = useLanguage();

  if (!event) return null;

  const isTeacher = event.createdByRole === "teacher";
  const isInstitution = event.createdByRole === "institution";
  const isAITutor = event.createdByRole === "ai_tutor";

  function handleOpen3D() {
    if (event.linkedModelRoute && navigate) {
      navigate(event.linkedModelRoute);
      onClose();
    }
  }

  return (
    <div className="a26-popover-backdrop" onClick={onClose}>
      <div className="a26-popover-card" onClick={(e) => e.stopPropagation()}>
        <header className="a26-popover-header">
          <div className="a26-popover-creator">
            <span className="a26-popover-avatar">
              {event.creatorAvatar || (isTeacher ? "👨‍🏫" : isInstitution ? "🏛️" : isAITutor ? "🤖" : "👤")}
            </span>
            <div>
              <strong>{event.creatorName || "Halisson Zanchin"}</strong>
              <small>
                {isTeacher
                  ? "Professor Sincronizado"
                  : isInstitution
                    ? "Instituição / Coordenação"
                    : isAITutor
                      ? "Preceptor IA Anatômico"
                      : "Agenda Pessoal"}
              </small>
            </div>
          </div>

          <button className="a26-popover-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <div className="a26-popover-body">
          <h3 className="a26-popover-title">{event.title}</h3>
          
          <div className="a26-popover-time">
            <LineIcon name="clock" />
            <span>{event.date} · {event.startTime} — {event.endTime}</span>
          </div>

          {event.description && (
            <p className="a26-popover-description">{event.description}</p>
          )}

          <div className="a26-popover-meta">
            <span className="a26-popover-tag">{event.anatomicalSystem}</span>
            <span className={`a26-popover-priority priority-${event.priority || "medium"}`}>
              Prioridade: {event.priority}
            </span>
          </div>

          {event.linkedModel && (
            <div className="a26-popover-3d-box">
              <span>Modelo 3D Vinculado:</span>
              <strong>{event.linkedModel}</strong>
              <button className="a26-popover-3d-btn" onClick={handleOpen3D}>
                <span>👁️ Abrir Modelo 3D no Atlas</span>
              </button>
            </div>
          )}
        </div>

        <footer className="a26-popover-footer">
          <button
            className={`a26-popover-action-btn ${event.status === "completed" ? "is-active" : ""}`}
            onClick={() => {
              onComplete(event.id);
              onClose();
            }}
          >
            {event.status === "completed" ? "✓ Concluída" : "Marcar Concluída"}
          </button>

          {!isTeacher && !isInstitution && (
            <>
              <button
                className="a26-popover-action-btn"
                onClick={() => {
                  onEdit(event);
                  onClose();
                }}
              >
                Editar
              </button>
              <button
                className="a26-popover-action-btn is-danger"
                onClick={() => {
                  onDelete(event.id);
                  onClose();
                }}
              >
                Excluir
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
