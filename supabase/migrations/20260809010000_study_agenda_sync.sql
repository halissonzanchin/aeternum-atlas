-- Migration: 20260809010000_study_agenda_sync.sql
-- Description: Create study_agenda_events table for multi-account synchronization (Student + Teacher + Institution)

CREATE TABLE IF NOT EXISTS public.study_agenda_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID,
  created_by_role TEXT NOT NULL DEFAULT 'student' CHECK (created_by_role IN ('student', 'teacher', 'institution', 'ai_tutor')),
  creator_name TEXT,
  creator_avatar TEXT,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '10:00:00',
  type TEXT NOT NULL DEFAULT 'study' CHECK (type IN ('study', 'review', 'quiz', 'exam', 'teacher_assignment', 'practical_class')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  anatomical_system TEXT DEFAULT 'Geral',
  linked_model TEXT,
  linked_model_route TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'canceled')),
  is_shared_with_students BOOLEAN NOT NULL DEFAULT false,
  target_group TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_agenda_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own private events OR shared teacher/institution events
CREATE POLICY "Users can view own or shared institution agenda events"
  ON public.study_agenda_events
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (is_shared_with_students = true AND (institution_id IS NULL OR institution_id = auth.jwt()->>'institution_id'))
  );

-- Policy: Users can insert their own agenda events
CREATE POLICY "Users can create own agenda events"
  ON public.study_agenda_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own agenda events
CREATE POLICY "Users can update own agenda events"
  ON public.study_agenda_events
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own agenda events
CREATE POLICY "Users can delete own agenda events"
  ON public.study_agenda_events
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_study_agenda_date ON public.study_agenda_events (date);
CREATE INDEX IF NOT EXISTS idx_study_agenda_user ON public.study_agenda_events (user_id);
CREATE INDEX IF NOT EXISTS idx_study_agenda_shared ON public.study_agenda_events (is_shared_with_students, institution_id);
