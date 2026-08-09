import { useEffect, useMemo, useState } from "react";
import AgendaCalendar from "../../components/student/agenda/AgendaCalendar";
import AgendaDayPanel from "../../components/student/agenda/AgendaDayPanel";
import AgendaHourlyGrid from "../../components/student/agenda/AgendaHourlyGrid";
import AgendaPopoverModal from "../../components/student/agenda/AgendaPopoverModal";
import AgendaSidebar from "../../components/student/agenda/AgendaSidebar";
import AgendaTaskModal from "../../components/student/agenda/AgendaTaskModal";
import UpcomingReviews from "../../components/student/agenda/UpcomingReviews";
import WeeklyStudySummary from "../../components/student/agenda/WeeklyStudySummary";
import { formatAgendaDate, useStudyAgenda } from "../../hooks/useStudyAgenda";
import { useLanguage } from "../../context/LanguageContext";
import "../../styles/A26StudyAgenda.css";

export default function StudyAgendaPage({ navigate }) {
  const { t } = useLanguage();
  const agenda = useStudyAgenda();

  const [displayMode, setDisplayMode] = useState("hourly_week"); // 'hourly_week' | 'month' | 'day'
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [popoverEvent, setPopoverEvent] = useState(null);

  // Set default initial view date to August 10, 2026 (active study week)
  useEffect(() => {
    agenda.setSelectedDate(new Date(2026, 7, 10));
  }, []);

  // Synchronized layers filter
  const [layersFilter, setLayersFilter] = useState({
    student: true,
    teacher: true,
    institution: true,
    ai_tutor: true
  });

  const [selectedSystem, setSelectedSystem] = useState("all");

  // Filter events based on active layers & anatomical system
  const filteredEventsMap = useMemo(() => {
    const map = new Map();
    agenda.events.forEach(evt => {
      const role = evt.createdByRole || "student";
      if (!layersFilter[role]) return;

      if (selectedSystem !== "all" && evt.anatomicalSystem !== selectedSystem) {
        return;
      }

      const key = evt.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(evt);
    });
    return map;
  }, [agenda.events, layersFilter, selectedSystem]);

  const selectedEvents = useMemo(() => {
    const key = formatAgendaDate(agenda.selectedDate);
    return filteredEventsMap.get(key) || [];
  }, [filteredEventsMap, agenda.selectedDate]);

  const weeklySummary = useMemo(() => agenda.getWeeklySummary(), [agenda.events, agenda.selectedDate]);
  const upcomingReviews = useMemo(() => agenda.getUpcomingReviews(), [agenda.events]);

  function openNewActivity() {
    setEditingEvent(null);
    setModalOpen(true);
  }

  function openEditActivity(event) {
    setEditingEvent(event);
    setModalOpen(true);
  }

  function submitActivity(payload) {
    if (editingEvent) {
      agenda.updateEvent(editingEvent.id, payload);
    } else {
      agenda.addEvent({
        ...payload,
        date: payload.date || formatAgendaDate(agenda.selectedDate),
        createdByRole: "student",
        creatorName: "Halisson Zanchin"
      });
    }
    setModalOpen(false);
    setEditingEvent(null);
  }

  return (
    <section
      className="study-agenda-page fade-in-up"
      data-testid="a26-student-agenda"
      data-a26-source="account-persisted"
    >
      {/* Liquid Glass Hero Header */}
      <header className="study-agenda-hero">
        <div>
          <div className="a26-hero-sync-badges">
            <span className="a26-hero-sync-badge is-active">🟢 Cloud Sincronizado</span>
            <span className="a26-hero-sync-badge is-teacher">👨‍🏫 Prof. Dr. Halisson Zanchin Conectado</span>
          </div>
          <h1>{t("studyAgenda.title")}</h1>
          <p>Agenda acadêmica interconectada: sincronize sua rotina com seus professores, simulados e o Tutor IA.</p>
        </div>

        <div className="a26-hero-actions">
          {/* Main Display Switcher */}
          <div className="a26-main-mode-switcher">
            <button
              className={displayMode === "hourly_week" ? "is-active" : ""}
              onClick={() => setDisplayMode("hourly_week")}
            >
              📊 Grade Semanal
            </button>
            <button
              className={displayMode === "month" ? "is-active" : ""}
              onClick={() => setDisplayMode("month")}
            >
              📅 Mês
            </button>
          </div>

          <button className="viewer-primary-button" onClick={openNewActivity}>
            + Nova Atividade
          </button>
        </div>
      </header>

      {/* Main Agenda Grid Layout */}
      <div className="study-agenda-main-grid">
        {/* Left Sidebar Filters & Mini Calendar */}
        <AgendaSidebar
          selectedDate={agenda.selectedDate}
          setSelectedDate={agenda.setSelectedDate}
          layersFilter={layersFilter}
          setLayersFilter={setLayersFilter}
          selectedSystem={selectedSystem}
          setSelectedSystem={setSelectedSystem}
          onNewActivity={openNewActivity}
        />

        {/* Center Main View (Hourly Grid OR Month Calendar) */}
        <main className="a26-agenda-view-container">
          {displayMode === "hourly_week" ? (
            <AgendaHourlyGrid
              eventsByDate={filteredEventsMap}
              selectedDate={agenda.selectedDate}
              setSelectedDate={agenda.setSelectedDate}
              onSelectEvent={(evt) => setPopoverEvent(evt)}
              onNewActivity={openNewActivity}
            />
          ) : (
            <AgendaCalendar
              eventsByDate={filteredEventsMap}
              selectedDate={agenda.selectedDate}
              setSelectedDate={agenda.setSelectedDate}
            />
          )}

          {/* Side Summary & Reviews Stack */}
          <div className="a26-agenda-summary-stack">
            <AgendaDayPanel
              selectedDate={agenda.selectedDate}
              events={selectedEvents}
              onNew={openNewActivity}
              onEdit={openEditActivity}
              onDelete={agenda.deleteEvent}
              onComplete={agenda.completeEvent}
              navigate={navigate}
            />
            <WeeklyStudySummary summary={weeklySummary} />
            <UpcomingReviews reviews={upcomingReviews} navigate={navigate} />
          </div>
        </main>
      </div>

      {/* Floating Popover Event Modal */}
      {popoverEvent && (
        <AgendaPopoverModal
          event={popoverEvent}
          onClose={() => setPopoverEvent(null)}
          onComplete={agenda.completeEvent}
          onEdit={openEditActivity}
          onDelete={agenda.deleteEvent}
          navigate={navigate}
        />
      )}

      {/* Create / Edit Task Modal */}
      <AgendaTaskModal
        open={modalOpen}
        selectedDate={agenda.selectedDate}
        event={editingEvent}
        onClose={() => {
          setModalOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={submitActivity}
      />
    </section>
  );
}
