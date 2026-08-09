-- AETERNUM 26.1 — BASE VETORIAL PRIVADA DO TUTOR IA
-- O navegador nunca consulta os livros diretamente. A Edge Function autenticada
-- recupera somente trechos verificados através do papel service_role.

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.anatomical_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_title TEXT NOT NULL,
  chapter_title TEXT,
  page_number INTEGER CHECK (page_number IS NULL OR page_number > 0),
  chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 40 AND 12000),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding extensions.vector(768) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS anatomical_knowledge_book_chunk_uidx
  ON public.anatomical_knowledge_base (book_title, chunk_index);
CREATE INDEX IF NOT EXISTS anatomical_knowledge_embedding_hnsw_idx
  ON public.anatomical_knowledge_base
  USING hnsw (embedding extensions.vector_cosine_ops);
CREATE INDEX IF NOT EXISTS anatomical_knowledge_book_idx
  ON public.anatomical_knowledge_base (book_title);

CREATE OR REPLACE FUNCTION public.match_anatomical_knowledge(
  query_embedding extensions.vector(768),
  match_threshold DOUBLE PRECISION DEFAULT 0.52,
  match_count INTEGER DEFAULT 6
)
RETURNS TABLE (
  id UUID,
  book_title TEXT,
  chapter_title TEXT,
  page_number INTEGER,
  content TEXT,
  similarity DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  SELECT
    knowledge.id,
    knowledge.book_title,
    knowledge.chapter_title,
    knowledge.page_number,
    knowledge.content,
    (1 - (knowledge.embedding <=> query_embedding))::DOUBLE PRECISION AS similarity
  FROM public.anatomical_knowledge_base AS knowledge
  WHERE (1 - (knowledge.embedding <=> query_embedding)) > LEAST(GREATEST(match_threshold, 0), 1)
  ORDER BY knowledge.embedding <=> query_embedding
  LIMIT LEAST(GREATEST(match_count, 1), 12);
$$;

ALTER TABLE public.anatomical_knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública autorizada de conhecimento anatômico"
  ON public.anatomical_knowledge_base;
DROP POLICY IF EXISTS "Authenticated users can read anatomical knowledge"
  ON public.anatomical_knowledge_base;

REVOKE ALL ON public.anatomical_knowledge_base FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.match_anatomical_knowledge(extensions.vector, DOUBLE PRECISION, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anatomical_knowledge_base TO service_role;
GRANT EXECUTE ON FUNCTION public.match_anatomical_knowledge(extensions.vector, DOUBLE PRECISION, INTEGER)
  TO service_role;

COMMENT ON TABLE public.anatomical_knowledge_base IS
  'Trechos anatômicos privados usados exclusivamente pelo Tutor IA autenticado do Aeternum 26.1.';
