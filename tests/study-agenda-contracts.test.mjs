import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [
  page,
  hook,
  service,
  sidebar,
  migration,
  flashcardMigration,
  taskModal,
  dayPanel,
  tutorContext,
  taskCard,
  popover,
  primitives
] = await Promise.all([
  read("src/pages/student/StudyAgendaPage.jsx"),
  read("src/hooks/useStudyAgenda.js"),
  read("src/services/studyAgendaService.js"),
  read("src/components/student/agenda/AgendaSidebar.jsx"),
  read("supabase/migrations/20260809010000_study_agenda_sync.sql"),
  read("supabase/migrations/20260814010000_agenda_flashcard_links.sql"),
  read("src/components/student/agenda/AgendaTaskModal.jsx"),
  read("src/components/student/agenda/AgendaDayPanel.jsx"),
  read("src/services/agendaTutorContext.js"),
  read("src/components/student/agenda/AgendaTaskCard.jsx"),
  read("src/components/student/agenda/AgendaPopoverModal.jsx"),
  read("src/components/aeternum-26/A26Primitives.jsx")
]);

test("agenda starts on the real current date and contains no seeded identities", () => {
  assert.doesNotMatch(page, /new Date\(2026|Halisson Zanchin|Cloud Sincronizado|Prof\. Dr\./);
  assert.doesNotMatch(sidebar, /Halisson Zanchin|Mariana Lima|Tempo Real|Contas Conectadas/);
  assert.match(page, /agenda\.syncStatus/);
  assert.match(sidebar, /events\.filter/);
});

test("agenda persists in the canonical table and exposes honest sync state", () => {
  assert.match(service, /\.from\("study_agenda_events"\)/);
  assert.doesNotMatch(service, /mockStudyAgenda|agendaEvents/);
  assert.match(service, /syncStatus:\s*"pending"/);
  assert.match(service, /syncStatus:\s*"synced"/);
  assert.match(hook, /useAuth\(\)/);
  assert.match(hook, /setSyncStatus/);
});

test("agenda RLS derives identity and institution on the server", () => {
  assert.match(migration, /enforce_study_agenda_identity/);
  assert.match(migration, /NEW\.user_id := actor\.id/);
  assert.match(migration, /NEW\.institution_id := actor\.institution_id/);
  assert.match(migration, /FOR SELECT TO authenticated/);
  assert.match(migration, /FOR INSERT TO authenticated/);
  assert.doesNotMatch(migration, /auth\.jwt\(\).*institution_id/);
  assert.match(migration, /REVOKE ALL ON public\.study_agenda_events FROM PUBLIC, anon/);
});

test("agenda preserves linked study tools across the database boundary", () => {
  assert.match(service, /linkedFlashcardDeck:\s*row\.linked_flashcard_deck/);
  assert.match(service, /linkedFlashcardRoute:\s*row\.linked_flashcard_route/);
  assert.match(service, /linked_flashcard_deck:\s*event\.linkedFlashcardDeck/);
  assert.match(service, /linked_flashcard_route:\s*event\.linkedFlashcardRoute/);
  assert.match(flashcardMigration, /ADD COLUMN IF NOT EXISTS linked_flashcard_deck TEXT/);
  assert.match(flashcardMigration, /linked_flashcard_route TEXT/);
});

test("activity creation validates chronology and waits for persistence", () => {
  assert.match(page, /await agenda\.addEvent/);
  assert.match(page, /await agenda\.updateEvent/);
  assert.match(taskModal, /form\.endTime <= form\.startTime/);
  assert.match(taskModal, /await onSubmit\(\{ \.\.\.form,/);
  assert.match(taskModal, /Salvando/);
});

test("agenda exposes anatomical filtering and visible daily insights", () => {
  assert.match(sidebar, /agendaAnatomicalSystems/);
  assert.match(sidebar, /selectedSystem/);
  assert.match(dayPanel, /agenda-day-insights/);
  assert.match(dayPanel, /children/);
});

test("saved activities can open the authenticated tutor with agenda context", () => {
  assert.match(tutorContext, /aeternum:open-tutor/);
  assert.match(tutorContext, /source:\s*"study-agenda"/);
  assert.match(tutorContext, /linkedFlashcardDeck/);
  assert.match(taskCard, /openAgendaEventInTutor/);
  assert.match(popover, /openAgendaEventInTutor/);
});

test("Aeternum 26 metrics render semantic icons without duplicating markup", () => {
  assert.match(primitives, /function A26Metric\(\{ label, value = "—", detail, trend, icon/);
  assert.match(primitives, /a26-metric__icon/);
});
