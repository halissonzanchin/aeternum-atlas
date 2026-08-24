-- Migration: 202608240001_vita_knowledge_base.sql
-- Descricao: Base de conhecimento anatomico vetorial e busca semantica para os Tutores da Aeternum Vita

CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Chunks Bibliograficos da Aeternum Vita
CREATE TABLE IF NOT EXISTS public.vita_knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_title VARCHAR(255) NOT NULL,
    chapter_title VARCHAR(255),
    page_number INTEGER,
    section_reference VARCHAR(128),
    anatomical_structures TEXT[],
    content TEXT NOT NULL,
    language VARCHAR(8) NOT NULL DEFAULT 'pt',
    embedding vector(768),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vita_chunks_language ON public.vita_knowledge_chunks(language);
CREATE INDEX IF NOT EXISTS idx_vita_chunks_book_title ON public.vita_knowledge_chunks(book_title);
CREATE INDEX IF NOT EXISTS idx_vita_chunks_structures ON public.vita_knowledge_chunks USING GIN(anatomical_structures);

-- 2. Funcao de Busca Semantica
CREATE OR REPLACE FUNCTION public.match_vita_knowledge(
    query_embedding vector(768),
    match_threshold FLOAT DEFAULT 0.65,
    match_count INT DEFAULT 8,
    filter_language VARCHAR(8) DEFAULT 'pt'
)
RETURNS TABLE (
    id UUID,
    book_title VARCHAR(255),
    page_number INTEGER,
    section_reference VARCHAR(128),
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        vkc.id,
        vkc.book_title,
        vkc.page_number,
        vkc.section_reference,
        vkc.content,
        1 - (vkc.embedding <=> query_embedding) AS similarity
    FROM public.vita_knowledge_chunks vkc
    WHERE vkc.language = filter_language
      AND 1 - (vkc.embedding <=> query_embedding) > match_threshold
    ORDER BY vkc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 3. Politicas RLS
ALTER TABLE public.vita_knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to anatomical knowledge"
    ON public.vita_knowledge_chunks
    FOR SELECT
    TO public
    USING (true);