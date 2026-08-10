import { useMemo, useState } from "react";
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
import { useAuth } from "../../context/AuthContext";
import { A26Button, A26Card, A26Metric, A26SegmentedControl } from "../../components/aeternum-26";
import "../../styles/A26StudyAgenda.css";

export default function StudyAgendaPage({ navigate }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const agenda = useStudyAgenda();

  const [displayMode, setDisplayMode] = useState("hourly_week"); // 'hourly_week' | 'month' | 'day'
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [popoverEvent, setPopoverEvent] = useState(null);

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
        creatorName: user?.name || user?.email || "Usuário"
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
      {/* Google Calendar Style Unified Top Header Bar */}
      <A26Card as="header" material="substantial" tone="teal" className="study-agenda-top-bar">
        <div className="study-agenda-top-bar__left">
          <div className="a26-hero-sync-badges">
            <span className={`a26-hero-sync-badge ${agenda.syncStatus === "synced" ? "is-active" : ""}`}>
              {agenda.syncStatus === "synced" && "Sincronizado com a conta"}
              {agenda.syncStatus === "pending" && "Sincronização pendente"}
              {agenda.syncStatus === "local" && "Disponível somente neste dispositivo"}
              {agenda.syncStatus === "auth-required" && "Sessão necessária"}
              {agenda.syncStatus === "loading" && "Verificando sincronização"}
            </span>
          </div>
          <h1>{t("studyAgenda.title")}</h1>
        </div>

        <div className="a26-hero-actions">
          {/* Main Display Switcher (Google Calendar Pattern: Mês | Semana | Dia) */}
          <A26SegmentedControl
            className="a26-main-mode-switcher"
            label="Visualização da agenda"
            value={displayMode}
            onChange={setDisplayMode}
            options={[
              { value: "month", label: "Mês" },
              { value: "hourly_week", label: "Grade semanal" },
              { value: "day", label: "Dia" }
            ]}
          />
        </div>
      </A26Card>

      {/* Main Agenda Grid Layout (Sidebar 270px + Main Workspace 100%) */}
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
          user={user}
          events={agenda.events}
          syncStatus={agenda.syncStatus}
        />

        {/* Center Main Workspace (100% Full Width Active View) */}
        <A26Card as="main" material="clear" className="a26-agenda-view-container">
          {/* Compact Liquid Glass Summary Bar */}
          <div className="a26-weekly-quick-stats" aria-label="Resumo da semana">
            <A26Metric label="Programadas" value={weeklySummary.scheduled} icon={<LineIcon name="note" />} />
            <A26Metric label="Concluídas" value={weeklySummary.completed} tone="teal" icon={<LineIcon name="check" />} />
            <A26Metric label="Pendentes" value={weeklySummary.pending} tone="gold" icon={<LineIcon name="clock" />} />
            <A26Metric label="Tempo planejado" value={`${Math.round(weeklySummary.plannedMinutes / 60)}h`} icon={<LineIcon name="timer" />} />
            <A26Metric label="Constância" value={`${weeklySummary.completionRate}%`} tone="teal" icon={<LineIcon name="target" />} />
          </div>

          {displayMode === "hourly_week" ? (
            <AgendaHourlyGrid
              eventsByDate={filteredEventsMap}
              selectedDate={agenda.selectedDate}
              setSelectedDate={agenda.setSelectedDate}
              onSelectEvent={(evt) => setPopoverEvent(evt)}
              onNewActivity={openNewActivity}
            />
          ) : displayMode === "month" ? (
            <div className="a26-month-view-container">
              <AgendaCalendar
                eventsByDate={filteredEventsMap}
                selectedDate={agenda.selectedDate}
                setSelectedDate={agenda.setSelectedDate}
              />
              {selectedEvents.length > 0 && (
                <div className="a26-day-panel-drawer">
                  <AgendaDayPanel
                    selectedDate={agenda.selectedDate}
                    events={selectedEvents}
                    onNew={openNewActivity}
                    onEdit={openEditActivity}
                    onDelete={agenda.deleteEvent}
                    onComplete={agenda.completeEvent}
                    navigate={navigate}
                  >
                    <WeeklyStudySummary summary={weeklySummary} />
                    <UpcomingReviews reviews={upcomingReviews} navigate={navigate} />
                  </AgendaDayPanel>
                </div>
              )}
            </div>
          ) : (
            <AgendaDayPanel
              selectedDate={agenda.selectedDate}
              events={selectedEvents}
              onNew={openNewActivity}
              onEdit={openEditActivity}
              onDelete={agenda.deleteEvent}
              onComplete={agenda.completeEvent}
              navigate={navigate}
            >
              <WeeklyStudySummary summary={weeklySummary} />
              <UpcomingReviews reviews={upcomingReviews} navigate={navigate} />
            </AgendaDayPanel>
          )}
        </A26Card>
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
