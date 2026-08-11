import LineIcon from "../../icons/LineIcon";
import { useLanguage } from "../../../context/LanguageContext";
import { A26Button, A26Surface } from "../../aeternum-26";

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

  const priorityLabels = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    urgent: "Urgente"
  };

  const priorityColorClasses = {
    low: "bg-slate-800/80 text-slate-300 border-slate-600/50",
    medium: "bg-amber-950/60 text-amber-300 border-amber-500/40",
    high: "bg-rose-950/60 text-rose-300 border-rose-500/40",
    urgent: "bg-red-950 text-red-400 border-red-500 font-bold"
  };

  return (
    <div className="a26-popover-backdrop" onClick={onClose}>
      <A26Surface
        material="substantial"
        tone="teal"
        className="a26-popover-card border border-glassBorder/60 shadow-2xl rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Google Calendar Style Header */}
        <header className="a26-popover-header flex items-center justify-between pb-3 mb-4 border-b border-glassBorder/40">
          <div className="a26-popover-creator flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg shadow-sm">
              {event.creatorAvatar || (isTeacher ? "👨‍🏫" : isInstitution ? "🏛️" : isAITutor ? "🤖" : "👤")}
            </span>
            <div className="flex flex-col">
              <strong className="text-sm font-bold text-textMain leading-tight">
                {event.creatorName || "Halisson Zanchin"}
              </strong>
              <small className="text-xs text-textMuted mt-0.5">
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

          <div className="flex items-center gap-2">
            {!isTeacher && !isInstitution && (
              <>
                <button
                  type="button"
                  title="Editar Atividade"
                  className="p-2 text-textMuted hover:text-agedGold hover:bg-glassSurface rounded-lg transition"
                  onClick={() => { onEdit(event); onClose(); }}
                >
                  <LineIcon name="edit" />
                </button>
                <button
                  type="button"
                  title="Excluir Atividade"
                  className="p-2 text-textMuted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  onClick={() => { onDelete(event.id); onClose(); }}
                >
                  <LineIcon name="trash" />
                </button>
              </>
            )}
            <button
              type="button"
              className="p-2 text-textMuted hover:text-textMain rounded-lg transition"
              onClick={onClose}
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Event Body */}
        <div className="a26-popover-body space-y-4">
          <h3 className="text-xl font-bold text-agedGold leading-snug">{event.title}</h3>
          
          <div className="flex items-center gap-2 text-sm text-emerald-400 font-semibold bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-500/30 w-fit">
            <LineIcon name="clock" />
            <span>{event.date} • {event.startTime} — {event.endTime}</span>
          </div>

          {event.description && (
            <div className="flex items-start gap-2.5 text-sm text-textMain bg-glassSurface/40 p-3 rounded-xl border border-glassBorder/30">
              <span className="text-agedGold text-base">📝</span>
              <p className="whitespace-pre-wrap leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* System & Priority Badges (Properly Spaced & Formatted) */}
          <div className="flex items-center gap-2.5 flex-wrap pt-1">
            <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-teal-950/60 text-teal-300 border border-teal-500/40">
              🫀 {event.anatomicalSystem || "Anatomia Geral"}
            </span>
            <span className={`px-3 py-1 text-xs font-semibold rounded-lg border ${priorityColorClasses[event.priority] || priorityColorClasses.medium}`}>
              Prioridade: {priorityLabels[event.priority] || event.priority || "Média"}
            </span>
            <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-glassSurface text-textMuted border border-glassBorder/40">
              Status: {event.status === "completed" ? "✓ Concluída" : "Pendente"}
            </span>
          </div>

          {/* Linked 3D Model Box */}
          {event.linkedModel && (
            <div className="p-3.5 rounded-xl border border-teal-500/30 bg-teal-950/30 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs text-textMuted block">Modelo 3D Vinculado:</span>
                <strong className="text-sm font-bold text-teal-300 block mt-0.5">{event.linkedModel}</strong>
              </div>
              <A26Button variant="liquid" className="text-xs px-3 py-1.5" onClick={handleOpen3D}>
                <span>👁️ Abrir Modelo 3D ➔</span>
              </A26Button>
            </div>
          )}

          {/* Linked Flashcard Deck Box */}
          {event.linkedFlashcardDeck && (
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs text-textMuted block">Baralho de Flashcards Vinculado:</span>
                <strong className="text-sm font-bold text-emerald-300 block mt-0.5">🎴 {event.linkedFlashcardDeck}</strong>
              </div>
              <A26Button
                variant="liquid"
                className="text-xs px-3 py-1.5 text-emerald-300 border-emerald-500/40"
                onClick={() => {
                  if (navigate) navigate(event.linkedFlashcardRoute || "/flashcards");
                  onClose();
                }}
              >
                <span>🎴 Praticar Flashcards ➔</span>
              </A26Button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <footer className="a26-popover-footer flex items-center justify-end gap-3 pt-4 mt-5 border-t border-glassBorder/40">
          <A26Button
            variant={event.status === "completed" ? "primary" : "liquid"}
            onClick={() => {
              onComplete(event.id);
              onClose();
            }}
          >
            {event.status === "completed" ? "✓ Marcar como Pendente" : "✓ Marcar como Concluída"}
          </A26Button>
        </footer>
      </A26Surface>
    </div>
  );
}
