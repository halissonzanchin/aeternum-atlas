import { useMemo, useState } from "react";
import AgendaCalendar from "../../components/student/agenda/AgendaCalendar";
import AgendaDayPanel from "../../components/student/agenda/AgendaDayPanel";
import AgendaHourlyGrid from "../../components/student/agenda/AgendaHourlyGrid";
import AgendaPopoverModal from "../../components/student/agenda/AgendaPopoverModal";
import AgendaSidebar from "../../components/student/agenda/AgendaSidebar";
import AgendaTaskModal from "../../components/student/agenda/AgendaTaskModal";
import UpcomingReviews from "../../components/student/agenda/UpcomingReviews";
import WeeklyStudySummary from "../../components/student/agenda/WeeklyStudySummary";
import LineIcon from "../../components/icons/LineIcon";
import { formatAgendaDate, parseAgendaDate, useStudyAgenda } from "../../hooks/useStudyAgenda";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { A26Button, A26Card, A26Metric, A26SegmentedControl } from "../../components/aeternum-26";
import "../../styles/A26StudyAgenda.css";

export default function StudyAgendaPage({ navigate }) {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const agenda = useStudyAgenda();

  const [displayMode, setDisplayMode] = useState("month"); // 'month' | 'hourly_week' | 'day'
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

  function shiftDate(direction) {
    const curr = parseAgendaDate(agenda.selectedDate);
    if (displayMode === "month") {
      const next = new Date(curr);
      next.setMonth(next.getMonth() + direction);
      agenda.setSelectedDate(next);
    } else if (displayMode === "hourly_week") {
      const next = new Date(curr);
      next.setDate(next.getDate() + direction * 7);
      agenda.setSelectedDate(next);
    } else {
      const next = new Date(curr);
      next.setDate(next.getDate() + direction);
      agenda.setSelectedDate(next);
    }
  }

  const headerTitle = useMemo(() => {
    const safeSelected = parseAgendaDate(agenda.selectedDate);
    const localeMap = { pt: "pt-BR", es: "es-ES", en: "en-US", de: "de-DE" };
    const loc = localeMap[language] || "pt-BR";
    if (displayMode === "month") {
      const monthStr = new Intl.DateTimeFormat(loc, { month: "long", year: "numeric" }).format(safeSelected);
      return monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
    }
    if (displayMode === "hourly_week") {
      const day = safeSelected.getDay();
      const diff = safeSelected.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(safeSelected);
      start.setDate(diff);
      const startStr = new Intl.DateTimeFormat(loc, { day: "2-digit", month: "short" }).format(start);
      return `Semana de ${startStr}`;
    }
    const dayStr = new Intl.DateTimeFormat(loc, { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(safeSelected);
    return dayStr.charAt(0).toUpperCase() + dayStr.slice(1);
  }, [agenda.selectedDate, displayMode, language]);

  // Filter events based on active layers & anatomical system
  const filteredEventsMap = useMemo(() => {
    const map = new Map();
    const eventList = Array.isArray(agenda?.events) ? agenda.events : [];
    eventList.forEach(evt => {
      if (!evt) return;
      const role = evt.createdByRole || "student";
      if (layersFilter && !layersFilter[role]) return;

      if (selectedSystem !== "all" && evt.anatomicalSystem !== selectedSystem) {
        return;
      }

      const key = evt.date;
      if (key) {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(evt);
      }
    });
    return map;
  }, [agenda?.events, layersFilter, selectedSystem]);

  const selectedEvents = useMemo(() => {
    if (!agenda?.selectedDate) return [];
    const key = formatAgendaDate(agenda.selectedDate);
    return filteredEventsMap.get(key) || [];
  }, [filteredEventsMap, agenda?.selectedDate]);

  const weeklySummary = useMemo(() => {
    if (typeof agenda?.getWeeklySummary === 'function') {
      return agenda.getWeeklySummary();
    }
    return { scheduled: 0, completed: 0, pending: 0, plannedMinutes: 0, completionRate: 0 };
  }, [agenda]);

  const upcomingReviews = useMemo(() => {
    if (typeof agenda?.getUpcomingReviews === 'function') {
      return agenda.getUpcomingReviews();
    }
    return [];
  }, [agenda]);

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
          <A26Button
            variant="secondary"
            className="a26-today-btn"
            onClick={() => agenda.setSelectedDate(new Date())}
          >
            🎯 Hoje
          </A26Button>
          <div className="a26-calendar-nav-arrows">
            <button className="a26-nav-arrow" onClick={() => shiftDate(-1)} aria-label="Anterior">
              ‹
            </button>
            <button className="a26-nav-arrow" onClick={() => shiftDate(1)} aria-label="Próximo">
              ›
            </button>
          </div>
          <h1 className="a26-header-month-title">{headerTitle}</h1>
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
