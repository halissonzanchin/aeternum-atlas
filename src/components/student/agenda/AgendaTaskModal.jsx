import { useEffect, useState } from "react";
import {
  agendaAnatomicalSystems,
  agendaEventTypes,
  agendaModelOptions,
  agendaPriorities,
  agendaReminders,
  agendaRepeats,
  agendaStatuses
} from "../../../data/mockStudyAgenda";
import { formatAgendaDate } from "../../../hooks/useStudyAgenda";
import { useLanguage } from "../../../context/LanguageContext";

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
    status: "pending",
    repeat: "none",
    reminder: "none"
  };
}

export default function AgendaTaskModal({ open, selectedDate, event, onClose, onSubmit }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(() => defaultForm(selectedDate));

  useEffect(() => {
    if (!open) return;
    setForm(event ? { ...defaultForm(selectedDate), ...event } : defaultForm(selectedDate));
  }, [event, open, selectedDate]);

  if (!open) return null;

  function update(name, value) {
    if (name === "linkedModel") {
      const option = agendaModelOptions.find(item => item.label === value);
      setForm(previous => ({ ...previous, linkedModel: value, linkedModelRoute: option?.route || "" }));
      return;
    }
    setForm(previous => ({ ...previous, [name]: value }));
  }

  function submit(eventSubmit) {
    eventSubmit.preventDefault();
    if (!form.title.trim()) return;
    onSubmit({ ...form, title: form.title.trim(), description: form.description.trim() });
  }

  return (
    <div className="agenda-modal-backdrop" role="presentation" onClick={onClose}>
      <form className="agenda-task-modal" onSubmit={submit} onClick={(clickEvent) => clickEvent.stopPropagation()}>
        <header>
          <div>
            <p className="viewer-eyebrow">{event ? t("studyAgenda.editActivity") : t("studyAgenda.newActivity")}</p>
            <h2>{event ? t("studyAgenda.editActivity") : t("studyAgenda.createActivity")}</h2>
          </div>
          <button type="button" onClick={onClose}>{t("actions.close")}</button>
        </header>

        <div className="agenda-form-grid">
          <label className="field">
            <span>{t("studyAgenda.form.title")}</span>
            <input value={form.title} onChange={(inputEvent) => update("title", inputEvent.target.value)} />
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
              {agendaModelOptions.map(option => <option key={option.label} value={option.label}>{option.label}</option>)}
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
            <textarea value={form.description} onChange={(inputEvent) => update("description", inputEvent.target.value)} />
          </label>
        </div>

        <footer>
          <button type="button" className="viewer-secondary-button" onClick={onClose}>{t("actions.cancel")}</button>
          <button type="submit" className="viewer-primary-button">{t("actions.save")}</button>
        </footer>
      </form>
    </div>
  );
}
