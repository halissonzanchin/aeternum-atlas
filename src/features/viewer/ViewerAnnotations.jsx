import { useViewer } from './ViewerContext';
import { saveModelNote, exportModelNotePdf, getModelNote } from '../../services/modelNotesService';
import { trackEvent } from '../../services/analyticsService';
import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import LineIcon from '../../components/icons/LineIcon';

function formatNoteTimestamp(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function InnerNotesModal({ open, model, content, updatedAt, onChange, onClose, onSave, onExport }) {
  const { t } = useLanguage();
  if (!open) return null;

  const updatedLabel = updatedAt
    ? t("viewer.notesUpdatedAt", { date: formatNoteTimestamp(updatedAt) })
    : t("viewer.notesNotSaved");

  return (
    <div className="viewer-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="viewer-notes-title">
      <div className="viewer-modal viewer-notes-modal">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="viewer-eyebrow">{t("viewer.notesEyebrow")}</p>
            <h2 id="viewer-notes-title" className="mt-2 text-2xl font-bold text-clinicalWhite">{t("viewer.notesTitle")}</h2>
            <p className="viewer-notes-model">{model?.title}</p>
          </div>
          <button className="viewer-icon-button" onClick={onClose} aria-label={t("viewer.closeNotes")} data-tooltip={t("viewer.closeNotes")}>
            <LineIcon name="close" />
          </button>
        </div>

        <textarea
          className="viewer-notes-textarea"
          value={content}
          onChange={event => onChange(event.target.value)}
          placeholder={t("viewer.notesPlaceholder")}
          autoFocus
        />

        <div className="viewer-notes-footer">
          <p className="viewer-notes-meta">
            <span>{updatedLabel}</span>
            <span>{t("viewer.notesCharacters", { count: content.length })}</span>
          </p>
          <div className="viewer-notes-actions">
            <button type="button" className="viewer-secondary-button" onClick={onClose}>
              {t("viewer.closeNotes")}
            </button>
            <button type="button" className="viewer-secondary-button" onClick={onSave}>
              <LineIcon name="check" className="h-4 w-4" />
              {t("viewer.saveNotes")}
            </button>
            <button type="button" className="viewer-primary-button" onClick={onExport}>
              <LineIcon name="note" className="h-4 w-4" />
              {t("viewer.exportNotesPdf")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ViewerAnnotations() {
  const { model, user, notesOpen, setNotesOpen, setToast } = useViewer();
  const { t } = useLanguage();
  const [noteContent, setNoteContent] = useState("");
  const [noteUpdatedAt, setNoteUpdatedAt] = useState(null);

  useEffect(() => {
    if (!model?.id) {
      setNoteContent("");
      setNoteUpdatedAt(null);
      return;
    }

    const savedNote = getModelNote(user, model.id);
    setNoteContent(savedNote.content || "");
    setNoteUpdatedAt(savedNote.updatedAt || null);
  }, [model?.id, user]);

  function handleSaveNotes() {
    if (!model?.id) return;

    const savedNote = saveModelNote(user, model, noteContent);
    setNoteContent(savedNote.content);
    setNoteUpdatedAt(savedNote.updatedAt);
    trackEvent({
      userId: user?.id,
      institutionId: user?.institutionId,
      role: user?.role,
      modelId: model.id,
      eventType: "save_model_notes",
      metadata: { characters: savedNote.content.length }
    });
    setToast(t("viewer.notesSaved"));
  }

  function handleExportNotes() {
    if (!model?.id) return;

    const savedNote = saveModelNote(user, model, noteContent);
    setNoteContent(savedNote.content);
    setNoteUpdatedAt(savedNote.updatedAt);

    if (!savedNote.content.trim()) {
      setToast(t("viewer.notesEmpty"));
      return;
    }

    const filename = exportModelNotePdf({ user, model, note: savedNote });
    trackEvent({
      userId: user?.id,
      institutionId: user?.institutionId,
      role: user?.role,
      modelId: model.id,
      eventType: "export_model_notes_pdf",
      metadata: { filename, characters: savedNote.content.length }
    });
    setToast(t("viewer.notesExported"));
  }

  return (
    <InnerNotesModal
      open={notesOpen}
      model={model}
      content={noteContent}
      updatedAt={noteUpdatedAt}
      onChange={setNoteContent}
      onClose={() => setNotesOpen(false)}
      onSave={handleSaveNotes}
      onExport={handleExportNotes}
    />
  );
}
