-- FASE 7.3: SUPABASE LEARNING ANALYTICS INTEGRATION
-- Migração segura: sem comandos destrutivos. Apenas IF NOT EXISTS

-- 1. viewer_learning_sessions
CREATE TABLE IF NOT EXISTS public.viewer_learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id UUID, -- Opcional, depende de modelagem existente
    model_id TEXT NOT NULL,
    session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_end TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. viewer_learning_events
CREATE TABLE IF NOT EXISTS public.viewer_learning_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.viewer_learning_sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    structure_id TEXT,
    annotation_id TEXT,
    quiz_id TEXT,
    event_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. viewer_quiz_results
CREATE TABLE IF NOT EXISTS public.viewer_quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id TEXT NOT NULL,
    correct_answers INTEGER DEFAULT 0,
    incorrect_answers INTEGER DEFAULT 0,
    accuracy NUMERIC DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.viewer_learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewer_learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewer_quiz_results ENABLE ROW LEVEL SECURITY;

-- POLICIES BÁSICAS E SEGURAS
-- Qualquer pessoa logada pode INSERIR na sua própria sessão/resultado
CREATE POLICY "Users can insert their own learning sessions" 
ON public.viewer_learning_sessions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own learning sessions" 
ON public.viewer_learning_sessions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert learning events" 
ON public.viewer_learning_events FOR INSERT 
TO authenticated 
WITH CHECK (true); -- Simplificado para inserção atrelada a uma sessão existente

CREATE POLICY "Users can view their own learning events" 
ON public.viewer_learning_events FOR SELECT 
TO authenticated 
USING (
    session_id IN (
        SELECT id FROM public.viewer_learning_sessions WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own quiz results" 
ON public.viewer_quiz_results FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own quiz results" 
ON public.viewer_quiz_results FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- POLICIES PARA SUPER ADMINS E PROFESSORES (Permitem visualizar tudo temporariamente - aprimorar na Fase Enterprise)
CREATE POLICY "Super Admins can view all sessions" 
ON public.viewer_learning_sessions FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin', 'institution_admin', 'rector', 'coordinator', 'teacher')
    )
);

CREATE POLICY "Super Admins can view all events" 
ON public.viewer_learning_events FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin', 'institution_admin', 'rector', 'coordinator', 'teacher')
    )
);

CREATE POLICY "Super Admins can view all quiz results" 
ON public.viewer_quiz_results FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin', 'institution_admin', 'rector', 'coordinator', 'teacher')
    )
);
