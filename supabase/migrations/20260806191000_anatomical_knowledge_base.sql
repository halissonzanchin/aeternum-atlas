-- Supabase Migration: Base de Conhecimento Vetorial para Livros de Anatomia (RAG)

-- 1. Ativar extensão de vetores (pgvector)
create extension if not exists vector;

-- 2. Tabela de Conhecimento Médico-Anatômico
create table if not exists public.anatomical_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  book_title text not null,
  chapter_title text,
  page_number integer,
  chunk_index integer,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  embedding vector(768),
  created_at timestamp with time zone default now()
);

-- Indexação vetorial HNSW para busca por similaridade em milissegundos
create index if not exists idx_anatomical_knowledge_embedding 
on public.anatomical_knowledge_base 
using hnsw (embedding vector_cosine_ops);

-- Indexação por título de livro
create index if not exists idx_anatomical_knowledge_book 
on public.anatomical_knowledge_base (book_title);

-- 3. Função RPC para busca semântica por similaridade de cosseno
create or replace function public.match_anatomical_knowledge (
  query_embedding vector(768),
  match_threshold float default 0.45,
  match_count int default 4
)
returns table (
  id uuid,
  book_title text,
  chapter_title text,
  page_number integer,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    book_title,
    chapter_title,
    page_number,
    content,
    1 - (public.anatomical_knowledge_base.embedding <=> query_embedding) as similarity
  from public.anatomical_knowledge_base
  where 1 - (public.anatomical_knowledge_base.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

-- Permissões RLS
alter table public.anatomical_knowledge_base enable row level security;

create policy "Leitura pública autorizada de conhecimento anatômico"
  on public.anatomical_knowledge_base
  for select
  using (true);
