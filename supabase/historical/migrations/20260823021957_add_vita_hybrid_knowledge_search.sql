-- AETERNUM VITA — biblioteca anatômica textual privada.
-- O corpus e a busca são exclusivos dos tutores de voz. Nenhuma função,
-- prompt, tabela ou fluxo da Atlas IA é substituído por esta migração.

CREATE TABLE IF NOT EXISTS public.vita_anatomical_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_title TEXT NOT NULL CHECK (char_length(book_title) BETWEEN 1 AND 500),
  source_file TEXT NOT NULL CHECK (char_length(source_file) BETWEEN 1 AND 500),
  source_sha256 TEXT NOT NULL CHECK (source_sha256 ~ '^[0-9a-f]{64}$'),
  page_number INTEGER NOT NULL CHECK (page_number > 0),
  chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 40 AND 12000),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_sha256, page_number, chunk_index)
);

CREATE INDEX IF NOT EXISTS vita_anatomical_knowledge_book_idx
  ON public.vita_anatomical_knowledge (book_title);

CREATE INDEX IF NOT EXISTS vita_anatomical_knowledge_source_idx
  ON public.vita_anatomical_knowledge (source_sha256);

CREATE INDEX IF NOT EXISTS vita_anatomical_knowledge_lexical_gin_idx
  ON public.vita_anatomical_knowledge
  USING gin (
    to_tsvector(
      'simple',
      coalesce(book_title, '') || ' ' || coalesce(content, '')
    )
  );

ALTER TABLE public.vita_anatomical_knowledge ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.vita_anatomical_knowledge FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.vita_anatomical_knowledge TO service_role;

CREATE OR REPLACE FUNCTION public.match_vita_anatomical_knowledge(
  search_query TEXT,
  match_count INTEGER DEFAULT 8
)
RETURNS TABLE (
  id UUID,
  book_title TEXT,
  page_number INTEGER,
  content TEXT,
  lexical_rank DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH parameters AS (
    SELECT
      NULLIF(btrim(search_query), '') AS terms,
      LEAST(GREATEST(match_count, 1), 12) AS result_limit
  ),
  ranked AS (
    SELECT
      knowledge.id,
      knowledge.book_title,
      knowledge.page_number,
      knowledge.content,
      ts_rank_cd(
        to_tsvector(
          'simple',
          coalesce(knowledge.book_title, '') || ' ' || coalesce(knowledge.content, '')
        ),
        websearch_to_tsquery('simple', parameters.terms),
        32
      )::DOUBLE PRECISION AS lexical_rank,
      parameters.result_limit
    FROM public.vita_anatomical_knowledge AS knowledge
    CROSS JOIN parameters
    WHERE parameters.terms IS NOT NULL
  )
  SELECT ranked.id, ranked.book_title, ranked.page_number, ranked.content, ranked.lexical_rank
  FROM ranked
  WHERE ranked.lexical_rank > 0
  ORDER BY ranked.lexical_rank DESC, ranked.page_number
  LIMIT (SELECT result_limit FROM parameters);
$$;

REVOKE ALL ON FUNCTION public.match_vita_anatomical_knowledge(TEXT, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_vita_anatomical_knowledge(TEXT, INTEGER)
  TO service_role;

COMMENT ON TABLE public.vita_anatomical_knowledge IS
  'Trechos bibliográficos privados e exclusivos dos tutores de voz Aeternum Vita.';
COMMENT ON FUNCTION public.match_vita_anatomical_knowledge(TEXT, INTEGER) IS
  'Busca textual privada e exclusiva do agente de voz Aeternum Vita.';
