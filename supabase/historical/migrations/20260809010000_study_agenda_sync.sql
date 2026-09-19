-- AETERNUM 26.1 — AGENDA DE ESTUDOS SINCRONIZADA
-- Eventos reais, isolados por usuário e instituição. Identidade, papel e tenant
-- são derivados no servidor; o navegador não pode atribuí-los arbitrariamente.

CREATE TABLE IF NOT EXISTS public.study_agenda_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  created_by_role TEXT NOT NULL DEFAULT 'student'
    CHECK (created_by_role IN ('student', 'teacher', 'institution', 'ai_tutor')),
  creator_name TEXT NOT NULL,
  creator_avatar TEXT,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 4000),
  date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '10:00:00',
  type TEXT NOT NULL DEFAULT 'study'
    CHECK (type IN ('study', 'review', 'quiz', 'exam', 'task', 'class', 'note', 'teacher_assignment', 'practical_class')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  anatomical_system TEXT NOT NULL DEFAULT 'Geral',
  linked_model TEXT,
  linked_model_route TEXT,
  reminder TEXT NOT NULL DEFAULT 'none',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'canceled', 'missed')),
  is_shared_with_students BOOLEAN NOT NULL DEFAULT false,
  target_group TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE OR REPLACE FUNCTION public.enforce_study_agenda_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor public.users%ROWTYPE;
BEGIN
  SELECT * INTO actor FROM public.users WHERE id = auth.uid();
  IF actor.id IS NULL OR lower(coalesce(actor.status, '')) NOT IN ('active', 'ativo') THEN
    RAISE EXCEPTION 'Perfil ativo obrigatório para usar a agenda.';
  END IF;

  NEW.user_id := actor.id;
  NEW.institution_id := actor.institution_id;
  NEW.creator_name := coalesce(nullif(actor.name, ''), actor.email, 'Usuário');
  NEW.created_by_role := CASE lower(coalesce(actor.role, 'student'))
    WHEN 'teacher' THEN 'teacher'
    WHEN 'professor' THEN 'teacher'
    WHEN 'coordinator' THEN 'institution'
    WHEN 'coordenador' THEN 'institution'
    WHEN 'rector' THEN 'institution'
    WHEN 'reitor' THEN 'institution'
    WHEN 'admin' THEN 'institution'
    WHEN 'institution_admin' THEN 'institution'
    WHEN 'super_admin' THEN 'institution'
    ELSE 'student'
  END;
  IF NEW.created_by_role = 'student' THEN
    NEW.is_shared_with_students := false;
    NEW.target_group := 'self';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS study_agenda_identity_trigger ON public.study_agenda_events;
CREATE TRIGGER study_agenda_identity_trigger
  BEFORE INSERT OR UPDATE ON public.study_agenda_events
  FOR EACH ROW EXECUTE FUNCTION public.enforce_study_agenda_identity();

ALTER TABLE public.study_agenda_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own or shared institution agenda events" ON public.study_agenda_events;
CREATE POLICY "Users can view own or shared institution agenda events"
  ON public.study_agenda_events FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR (
      is_shared_with_students
      AND institution_id = (
        SELECT profile.institution_id FROM public.users AS profile WHERE profile.id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can create own agenda events" ON public.study_agenda_events;
CREATE POLICY "Users can create own agenda events"
  ON public.study_agenda_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own agenda events" ON public.study_agenda_events;
CREATE POLICY "Users can update own agenda events"
  ON public.study_agenda_events FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own agenda events" ON public.study_agenda_events;
CREATE POLICY "Users can delete own agenda events"
  ON public.study_agenda_events FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

REVOKE ALL ON public.study_agenda_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_agenda_events TO authenticated;
REVOKE ALL ON FUNCTION public.enforce_study_agenda_identity() FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_study_agenda_user_date
  ON public.study_agenda_events (user_id, date, start_time);
CREATE INDEX IF NOT EXISTS idx_study_agenda_shared
  ON public.study_agenda_events (institution_id, date)
  WHERE is_shared_with_students;

COMMENT ON TABLE public.study_agenda_events IS
  'Agenda acadêmica persistida e sincronizada do Aeternum 26.1.';
