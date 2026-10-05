-- AETERNUM ATLAS — HARDEN STAGING SOVEREIGN RETRIEVAL (LOCAL-L3-R3B)
-- Non-destructive migration for Staging environment only.

-- 1. Enable unaccent extension
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Create pt_unaccent text search configuration
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'pt_unaccent') THEN
    CREATE TEXT SEARCH CONFIGURATION public.pt_unaccent (COPY = portuguese);
    ALTER TEXT SEARCH CONFIGURATION public.pt_unaccent
      ALTER MAPPING FOR hword, hword_part, word
      WITH unaccent, portuguese_stem;
  END IF;
END $$;

-- 3. Dedicated Sovereign Hybrid Multi-Stage Retrieval RPC
CREATE OR REPLACE FUNCTION public.match_vita_sovereign_knowledge(
  search_query text,
  target_entities text[] DEFAULT '{}'::text[],
  target_domain text DEFAULT NULL,
  match_count integer DEFAULT 4
)
RETURNS TABLE (
  id uuid,
  book_title text,
  source_file text,
  source_sha256 text,
  page_number integer,
  chunk_index integer,
  content text,
  metadata jsonb,
  lexical_rank double precision,
  retrieval_stage integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_limit integer := LEAST(GREATEST(match_count, 1), 12);
  v_clean_query text := NULLIF(btrim(search_query), '');
BEGIN
  -- STAGE 1: Exact entity match on metadata->structures or topic (EXCLUDING qa_only)
  IF target_entities IS NOT NULL AND cardinality(target_entities) > 0 THEN
    RETURN QUERY
    SELECT
      k.id, k.book_title, k.source_file, k.source_sha256, k.page_number, k.chunk_index,
      k.content, k.metadata, 0.95::double precision AS lexical_rank, 1 AS retrieval_stage
    FROM public.vita_anatomical_knowledge k
    WHERE (k.metadata->>'qa_only' IS DISTINCT FROM 'true')
      AND (
        EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(COALESCE(k.metadata->'structures', '[]'::jsonb)) s
          WHERE s = ANY(target_entities)
        )
        OR (k.metadata->>'topic') = ANY(target_entities)
      )
    ORDER BY k.page_number
    LIMIT v_limit;

    IF FOUND THEN
      RETURN;
    END IF;
  END IF;

  -- STAGE 2: Focused FTS matching with pt_unaccent and websearch (EXCLUDING qa_only)
  IF v_clean_query IS NOT NULL THEN
    RETURN QUERY
    WITH ranked AS (
      SELECT
        k.id, k.book_title, k.source_file, k.source_sha256, k.page_number, k.chunk_index,
        k.content, k.metadata,
        ts_rank_cd(
          to_tsvector('public.pt_unaccent', coalesce(k.book_title, '') || ' ' || coalesce(k.content, '')),
          websearch_to_tsquery('public.pt_unaccent', v_clean_query),
          32
        )::double precision AS lexical_rank,
        2 AS retrieval_stage
      FROM public.vita_anatomical_knowledge k
      WHERE (k.metadata->>'qa_only' IS DISTINCT FROM 'true')
    )
    SELECT r.id, r.book_title, r.source_file, r.source_sha256, r.page_number, r.chunk_index,
           r.content, r.metadata, r.lexical_rank, r.retrieval_stage
    FROM ranked r
    WHERE r.lexical_rank > 0.05
    ORDER BY r.lexical_rank DESC, r.page_number
    LIMIT v_limit;

    IF FOUND THEN
      RETURN;
    END IF;

    -- STAGE 3: Relaxed plainto_tsquery matching with pt_unaccent (EXCLUDING qa_only)
    RETURN QUERY
    WITH relaxed AS (
      SELECT
        k.id, k.book_title, k.source_file, k.source_sha256, k.page_number, k.chunk_index,
        k.content, k.metadata,
        ts_rank_cd(
          to_tsvector('public.pt_unaccent', coalesce(k.book_title, '') || ' ' || coalesce(k.content, '')),
          plainto_tsquery('public.pt_unaccent', v_clean_query),
          32
        )::double precision AS lexical_rank,
        3 AS retrieval_stage
      FROM public.vita_anatomical_knowledge k
      WHERE (k.metadata->>'qa_only' IS DISTINCT FROM 'true')
    )
    SELECT r.id, r.book_title, r.source_file, r.source_sha256, r.page_number, r.chunk_index,
           r.content, r.metadata, r.lexical_rank, r.retrieval_stage
    FROM relaxed r
    WHERE r.lexical_rank > 0.01
    ORDER BY r.lexical_rank DESC, r.page_number
    LIMIT v_limit;

    IF FOUND THEN
      RETURN;
    END IF;
  END IF;

  -- STAGE 4: Domain fallback (EXCLUDING qa_only)
  IF target_domain IS NOT NULL THEN
    RETURN QUERY
    SELECT
      k.id, k.book_title, k.source_file, k.source_sha256, k.page_number, k.chunk_index,
      k.content, k.metadata, 0.25::double precision AS lexical_rank, 4 AS retrieval_stage
    FROM public.vita_anatomical_knowledge k
    WHERE (k.metadata->>'qa_only' IS DISTINCT FROM 'true')
      AND (k.metadata->>'domain') = target_domain
    ORDER BY k.page_number
    LIMIT v_limit;
  END IF;
END;
$function$;

-- 4. Update legacy match_vita_anatomical_knowledge to exclude qa_only rows
CREATE OR REPLACE FUNCTION public.match_vita_anatomical_knowledge(search_query text, match_count integer DEFAULT 8)
 RETURNS TABLE(id uuid, book_title text, page_number integer, content text, lexical_rank double precision)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
          'public.pt_unaccent',
          coalesce(knowledge.book_title, '') || ' ' || coalesce(knowledge.content, '')
        ),
        websearch_to_tsquery('public.pt_unaccent', parameters.terms),
        32
      )::DOUBLE PRECISION AS lexical_rank,
      parameters.result_limit
    FROM public.vita_anatomical_knowledge AS knowledge
    CROSS JOIN parameters
    WHERE parameters.terms IS NOT NULL
      AND (knowledge.metadata->>'qa_only' IS DISTINCT FROM 'true')
  )
  SELECT ranked.id, ranked.book_title, ranked.page_number, ranked.content, ranked.lexical_rank
  FROM ranked
  WHERE ranked.lexical_rank > 0
  ORDER BY ranked.lexical_rank DESC, ranked.page_number
  LIMIT (SELECT result_limit FROM parameters);
$function$;

-- 5. Permissions
GRANT EXECUTE ON FUNCTION public.match_vita_sovereign_knowledge TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_vita_anatomical_knowledge TO anon, authenticated, service_role;
