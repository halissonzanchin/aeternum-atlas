-- AETERNUM 26.1 — RECUPERA RESULTADOS DE SIMULADOS JÁ OBSERVADOS
-- Migração idempotente: transforma eventos históricos de conclusão em resultados
-- canônicos sem alterar tentativas que já possuem uma linha persistida.

INSERT INTO public.viewer_quiz_results (
  id,
  user_id,
  institution_id,
  model_id,
  quiz_id,
  quiz_type,
  status,
  score,
  total_questions,
  percentage,
  duration_seconds,
  correct_answers,
  incorrect_answers,
  accuracy,
  time_spent,
  started_at,
  finished_at,
  created_at
)
SELECT
  event.id,
  event.user_id,
  event.institution_id,
  event.model_id,
  COALESCE(NULLIF(event.event_data ->> 'quizId', ''), 'legacy-' || event.id::text),
  CASE
    WHEN event.event_data ->> 'quizType' = 'theoretical' THEN 'theoretical'
    ELSE 'anatomical'
  END,
  COALESCE(NULLIF(event.event_data ->> 'status', ''), 'completed'),
  GREATEST(COALESCE((event.event_data ->> 'score')::integer, 0), 0),
  GREATEST(COALESCE((event.event_data ->> 'totalQuestions')::integer, 0), 0),
  GREATEST(COALESCE((event.event_data ->> 'percentage')::numeric, 0), 0),
  GREATEST(COALESCE((event.event_data ->> 'durationSeconds')::integer, 0), 0),
  GREATEST(COALESCE((event.event_data ->> 'score')::integer, 0), 0),
  GREATEST(
    COALESCE((event.event_data ->> 'totalQuestions')::integer, 0)
      - COALESCE((event.event_data ->> 'score')::integer, 0),
    0
  ),
  GREATEST(COALESCE((event.event_data ->> 'percentage')::numeric, 0), 0),
  GREATEST(COALESCE((event.event_data ->> 'durationSeconds')::integer, 0), 0),
  event.created_at,
  event.created_at,
  event.created_at
FROM public.viewer_learning_events AS event
WHERE event.event_type = 'quiz_completed'
  AND event.user_id IS NOT NULL
  AND event.institution_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.viewer_quiz_results AS result
    WHERE result.id = event.id
       OR (
         result.user_id = event.user_id
         AND result.quiz_id = COALESCE(NULLIF(event.event_data ->> 'quizId', ''), 'legacy-' || event.id::text)
         AND result.finished_at = event.created_at
       )
  )
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.viewer_quiz_results IS
  'Fonte canônica dos resultados reais de simulados anatômicos e teóricos do Aeternum 26.1.';
