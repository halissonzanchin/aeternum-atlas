-- AETERNUM 26.1 — LEAST PRIVILEGE PARA A AGENDA
-- Corrige instalações em que os privilégios padrão do Data API concederam
-- capacidades além do CRUD necessário ao papel authenticated.

REVOKE ALL ON public.study_agenda_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_agenda_events TO authenticated;
