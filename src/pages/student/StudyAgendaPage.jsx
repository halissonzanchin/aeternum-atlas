import { useMemo, useState } from "react";
import AgendaCalendar from "../../components/student/agenda/AgendaCalendar";
import AgendaDayPanel from "../../components/student/agenda/AgendaDayPanel";
import AgendaTaskModal from "../../components/student/agenda/AgendaTaskModal";
import UpcomingReviews from "../../components/student/agenda/UpcomingReviews";
import WeeklyStudySummary from "../../components/student/agenda/WeeklyStudySummary";
import { formatAgendaDate, useStudyAgenda } from "../../hooks/useStudyAgenda";
import { useLanguage } from "../../context/LanguageContext";

export default function StudyAgendaPage({ navigate }) {
  const { t } = useLanguage();
  const agenda = useStudyAgenda();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const selectedEvents = useMemo(() => agenda.getEventsByDate(agenda.selectedDate), [agenda.events, agenda.selectedDate]);
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
      agenda.addEvent({ ...payload, date: payload.date || formatAgendaDate(agenda.selectedDate) });
    }
    setModalOpen(false);
    setEditingEvent(null);
  }

  return (
    <section className="study-agenda-page fade-in-up">
      <header className="study-agenda-hero">
        <div>
          <p className="viewer-eyebrow">{t("studyAgenda.eyebrow")}</p>
          <h1>{t("studyAgenda.title")}</h1>
          <p>{t("studyAgenda.subtitle")}</p>
        </div>
        <button className="viewer-primary-button" onClick={openNewActivity}>{t("studyAgenda.newActivity")}</button>
      </header>

      <div className="study-agenda-layout">
        <AgendaCalendar
          eventsByDate={agenda.eventsByDate}
          selectedDate={agenda.selectedDate}
          setSelectedDate={agenda.setSelectedDate}
        />

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

      <button className="agenda-floating-add" onClick={openNewActivity} aria-label={t("studyAgenda.newActivity")}>+</button>

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
