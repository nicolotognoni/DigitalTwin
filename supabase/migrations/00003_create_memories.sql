-- ============================================
-- MEMORIE — unità atomiche di conoscenza sull'utente
-- ============================================
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category text not null check (category in (
    'identity',
    'skill',
    'preference',
    'decision',
    'project',
    'relationship',
    'opinion',
    'communication',
    'goal'
  )),
  content text not null,
  embedding vector(1536),
  source text not null check (source in (
    'chatgpt', 'claude', 'perplexity', 'manual', 'integration'
  )),
  confidence float default 0.8 check (confidence between 0 and 1),
  metadata jsonb default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_memories_user on public.memories(user_id);
create index idx_memories_category on public.memories(user_id, category);
create index idx_memories_embedding on public.memories
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- RLS — solo il proprietario
alter table public.memories enable row level security;

create policy "Users can CRUD own memories" on public.memories
  for all using (auth.uid() = user_id);

create trigger on_memories_updated
  before update on public.memories
  for each row execute function public.handle_updated_at();

-- Funzione per semantic search
create or replace function public.search_memories(
  query_embedding vector(1536),
  match_user_id uuid,
  match_category text default null,
  match_limit int default 10
)
returns table (
  id uuid,
  content text,
  category text,
  confidence float,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    m.id,
    m.content,
    m.category,
    m.confidence,
    m.metadata,
    1 - (m.embedding <=> query_embedding) as similarity
  from public.memories m
  where m.user_id = match_user_id
    and m.is_active = true
    and (match_category is null or m.category = match_category)
  order by m.embedding <=> query_embedding
  limit match_limit;
end;
$$;
