import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [page, hook, service, sidebar, migration] = await Promise.all([
  read("src/pages/student/StudyAgendaPage.jsx"),
  read("src/hooks/useStudyAgenda.js"),
  read("src/services/studyAgendaService.js"),
  read("src/components/student/agenda/AgendaSidebar.jsx"),
  read("supabase/migrations/20260809010000_study_agenda_sync.sql")
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
