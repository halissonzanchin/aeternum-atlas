import { useEffect, useState, useMemo } from "react";
import {
  agendaAnatomicalSystems,
  agendaEventTypes,
  agendaModelOptions,
  agendaPriorities,
  agendaReminders,
  agendaRepeats,
  agendaStatuses
} from "../../../data/studyAgendaCatalog";
import { formatAgendaDate } from "../../../hooks/useStudyAgenda";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import { A26Button, A26Surface } from "../../aeternum-26";
import { getSavedDecks } from "../../../services/ai/flashcardSpacedRepetitionService";

function defaultForm(selectedDate) {
  return {
    title: "",
    description: "",
    date: formatAgendaDate(selectedDate),
    startTime: "19:00",
    endTime: "19:40",
    type: "study",
    priority: "medium",
    anatomicalSystem: "Cardiovascular",
    linkedModel: "",
    linkedModelRoute: "",
    linkedFlashcardDeck: "",
    linkedFlashcardRoute: "/flashcards",
    status: "pending",
    repeat: "none",
    reminder: "none"
  };
}

export default function AgendaTaskModal({ open, selectedDate, event, onClose, onSubmit }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const userId = user?.id || "student-default";
  const [form, setForm] = useState(() => defaultForm(selectedDate));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Dynamically fetch live saved flashcard decks (automatically syncs with deletions)
  const savedFlashcardDecks = useMemo(() => {
    if (!open) return [];
    return getSavedDecks(userId);
  }, [open, userId]);

  useEffect(() => {
    if (!open) return;
    setForm(event ? { ...defaultForm(selectedDate), ...event } : defaultForm(selectedDate));
    setErrors({});
    setSubmitting(false);
  }, [event, open, selectedDate]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (keyEvent) => {
      if (keyEvent.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, submitting]);

  const compatibleModels = useMemo(() => {
    const normalizedSystem = String(form.anatomicalSystem || "").toLocaleLowerCase("pt-BR");
    const exact = agendaModelOptions.filter((option) =>
      String(option.system || "").toLocaleLowerCase("pt-BR").includes(normalizedSystem)
      || normalizedSystem.includes(String(option.system || "").toLocaleLowerCase("pt-BR"))
    );
    const remaining = agendaModelOptions.filter((option) => !exact.includes(option));
    return [...exact, ...remaining];
  }, [form.anatomicalSystem]);

  if (!open) return null;

  function update(name, value) {
    if (name === "linkedModel") {
      const option = agendaModelOptions.find(item => item.label === value);
      setForm(previous => ({ ...previous, linkedModel: value, linkedModelRoute: option?.route || "" }));
      return;
    }
    setForm(previous => ({ ...previous, [name]: value }));
  }

  function setDuration(minutes) {
    const [hours = 0, mins = 0] = String(form.startTime || "00:00").split(":").map(Number);
    const end = hours * 60 + mins + minutes;
    update("endTime", `${String(Math.floor(end / 60) % 24).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`);
  }

  async function submit(eventSubmit) {
    eventSubmit.preventDefault();
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "Informe um título para a atividade.";
    if (!form.date) nextErrors.date = "Escolha uma data.";
    if (!form.startTime || !form.endTime || form.endTime <= form.startTime) {
      nextErrors.time = "A hora final deve ser posterior à hora inicial.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const result = await onSubmit({ ...form, title: form.title.trim(), description: form.description.trim() });
      if (result?.success === false) throw new Error(result.error || "Não foi possível salvar a atividade.");
    } catch (submitError) {
      setErrors({ submit: submitError?.message || "Não foi possível salvar a atividade." });
      setSubmitting(false);
    }
  }

  return (
    <div
      className="agenda-modal-backdrop"
      role="presentation"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <A26Surface
        as="form"
        material="substantial"
        tone="teal"
        className="agenda-task-modal"
        onSubmit={submit}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <header className="agenda-modal-header">
          <div>
            <p className="viewer-eyebrow">{event ? t("studyAgenda.editActivity") : t("studyAgenda.newActivity")}</p>
            <h2 className="text-xl font-bold text-agedGold">{event ? t("studyAgenda.editActivity") : t("studyAgenda.createActivity")}</h2>
          </div>
          <A26Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>{t("actions.close")}</A26Button>
        </header>

        <div className="agenda-modal-intro">
          <strong>Planeje uma sessão conectada</strong>
          <span>Defina quando estudar e conecte diretamente o modelo 3D ou baralho que será usado.</span>
        </div>

        <div className="agenda-form-grid">
          <div className="agenda-form-section agenda-form-wide">
            <span className="agenda-form-section__index">01</span>
            <div><strong>Essencial</strong><small>O compromisso e seu horário real.</small></div>
          </div>
          <label className={`field ${errors.title ? "has-error" : ""}`}>
            <span>{t("studyAgenda.form.title")}</span>
            <input value={form.title} onChange={(inputEvent) => update("title", inputEvent.target.value)} required aria-invalid={Boolean(errors.title)} />
            {errors.title ? <small className="agenda-field-error">{errors.title}</small> : null}
          </label>
          <label className="field">
            <span>{t("studyAgenda.form.date")}</span>
            <input type="date" value={form.date} onChange={(inputEvent) => update("date", inputEvent.target.value)} />
          </label>
          <label className="field">
            <span>{t("studyAgenda.form.startTime")}</span>
            <input type="time" value={form.startTime} onChange={(inputEvent) => update("startTime", inputEvent.target.value)} />
          </label>
          <label className="field">
            <span>{t("studyAgenda.form.endTime")}</span>
            <input type="time" value={form.endTime} onChange={(inputEvent) => update("endTime", inputEvent.target.value)} />
          </label>
          <div className="agenda-duration-presets agenda-form-wide" aria-label="Durações sugeridas">
            <span>Sugestões de duração</span>
            {[25, 40, 60].map((minutes) => (
              <button type="button" key={minutes} onClick={() => setDuration(minutes)}>{minutes} min</button>
            ))}
            {errors.time ? <small className="agenda-field-error">{errors.time}</small> : null}
          </div>

          <div className="agenda-form-section agenda-form-wide">
            <span className="agenda-form-section__index">02</span>
            <div><strong>Intenção de estudo</strong><small>Classifique a atividade para medir sua rotina com precisão.</small></div>
          </div>
          <label className="field">
            <span>{t("studyAgenda.form.type")}</span>
            <select value={form.type} onChange={(inputEvent) => update("type", inputEvent.target.value)}>
              {agendaEventTypes.map(type => <option key={type} value={type}>{t(`studyAgenda.eventTypes.${type}`)}</option>)}
            </select>
          </label>
          <label className="field">
            <span>{t("studyAgenda.form.priority")}</span>
            <select value={form.priority} onChange={(inputEvent) => update("priority", inputEvent.target.value)}>
              {agendaPriorities.map(priority => <option key={priority} value={priority}>{t(`studyAgenda.priorities.${priority}`)}</option>)}
            </select>
          </label>
          <label className="field">
            <span>{t("studyAgenda.form.system")}</span>
            <select value={form.anatomicalSystem} onChange={(inputEvent) => update("anatomicalSystem", inputEvent.target.value)}>
              {agendaAnatomicalSystems.map(system => <option key={system} value={system}>{system}</option>)}
            </select>
          </label>
          <label className="field">
            <span>{t("studyAgenda.form.model")}</span>
            <select value={form.linkedModel || ""} onChange={(inputEvent) => update("linkedModel", inputEvent.target.value)}>
              <option value="">{t("studyAgenda.noLinkedModel")}</option>
              {compatibleModels.map(option => <option key={option.label} value={option.label}>{option.label}</option>)}
            </select>
          </label>

          <div className="agenda-form-section agenda-form-wide">
            <span className="agenda-form-section__index">03</span>
            <div><strong>Ferramentas conectadas</strong><small>Os atalhos ficam disponíveis no evento salvo.</small></div>
          </div>

          {/* Flashcard Deck Selector - Synced live with saved decks */}
          <label className="field">
            <span className="text-emerald-400 font-semibold">🎴 Baralho de Flashcards Relacionado</span>
            <select value={form.linkedFlashcardDeck || ""} onChange={(inputEvent) => update("linkedFlashcardDeck", inputEvent.target.value)}>
              <option value="">Sem baralho de flashcards vinculado</option>
              {savedFlashcardDecks.map(deck => (
                <option key={deck.id || deck.title} value={deck.title}>
                  {deck.title} ({deck.cards?.length || 0} cards)
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>{t("common.status")}</span>
            <select value={form.status} onChange={(inputEvent) => update("status", inputEvent.target.value)}>
              {agendaStatuses.map(status => <option key={status} value={status}>{t(`studyAgenda.status.${status}`)}</option>)}
            </select>
          </label>
          <label className="field">
            <span>{t("studyAgenda.form.repeat")}</span>
            <select value={form.repeat} onChange={(inputEvent) => update("repeat", inputEvent.target.value)} disabled={Boolean(event)}>
              {agendaRepeats.map(repeat => <option key={repeat} value={repeat}>{t(`studyAgenda.repeats.${repeat}`)}</option>)}
            </select>
          </label>
          <label className="field">
            <span>{t("studyAgenda.form.reminder")}</span>
            <select value={form.reminder} onChange={(inputEvent) => update("reminder", inputEvent.target.value)}>
              {agendaReminders.map(reminder => <option key={reminder} value={reminder}>{t(`studyAgenda.reminders.${reminder}`)}</option>)}
            </select>
          </label>

          <label className="field agenda-form-wide">
            <span>{t("studyAgenda.form.description")}</span>
            <textarea value={form.description} rows={2} onChange={(inputEvent) => update("description", inputEvent.target.value)} />
          </label>

          <div className="agenda-link-summary agenda-form-wide">
            <div className={form.linkedModel ? "is-linked" : ""}>
              <span>3D</span><strong>{form.linkedModel || "Sem modelo vinculado"}</strong>
            </div>
            <div className={form.linkedFlashcardDeck ? "is-linked" : ""}>
              <span>Cards</span><strong>{form.linkedFlashcardDeck || "Sem baralho vinculado"}</strong>
            </div>
            <div className="is-linked">
              <span>Atlas AI</span><strong>Planejamento disponível no evento salvo</strong>
            </div>
          </div>
        </div>

        {errors.submit ? <div className="agenda-submit-error" role="alert">{errors.submit}</div> : null}

        <footer className="agenda-modal-footer">
          <A26Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>{t("actions.cancel")}</A26Button>
          <A26Button type="submit" variant="primary" disabled={submitting}>{submitting ? "Salvando…" : t("actions.save")}</A26Button>
        </footer>
      </A26Surface>
    </div>
  );
}
