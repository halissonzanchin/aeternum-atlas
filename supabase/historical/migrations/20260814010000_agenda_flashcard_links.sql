-- AETERNUM 26.1 — CONEXÕES DA AGENDA COM FLASHCARDS
-- Mantém o vínculo opcional com um baralho salvo dentro do mesmo registro
-- protegido pelas políticas RLS existentes da agenda.

ALTER TABLE public.study_agenda_events
  ADD COLUMN IF NOT EXISTS linked_flashcard_deck TEXT,
  ADD COLUMN IF NOT EXISTS linked_flashcard_route TEXT;

COMMENT ON COLUMN public.study_agenda_events.linked_flashcard_deck IS
  'Título do baralho pessoal vinculado à atividade.';
COMMENT ON COLUMN public.study_agenda_events.linked_flashcard_route IS
  'Rota interna segura para abrir a ferramenta de flashcards.';
