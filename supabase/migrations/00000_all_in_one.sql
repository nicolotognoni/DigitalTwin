-- ============================================
-- Digital-Twin MVP — Complete Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Enable pgvector
create extension if not exists vector;

-- 2. Updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 3. Users table
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  avatar_url text,
  bio text,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger on_users_updated
  before update on public.users
  for each row execute function public.handle_updated_at();

-- 4. Memories table
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category text not null check (category in (
    'identity', 'skill', 'preference', 'decision', 'project',
    'relationship', 'opinion', 'communication', 'goal'
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

create trigger on_memories_updated
  before update on public.memories
  for each row execute function public.handle_updated_at();

-- Semantic search function
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
    m.id, m.content, m.category, m.confidence, m.metadata,
    1 - (m.embedding <=> query_embedding) as similarity
  from public.memories m
  where m.user_id = match_user_id
    and m.is_active = true
    and (match_category is null or m.category = match_category)
  order by m.embedding <=> query_embedding
  limit match_limit;
end;
$$;

-- 5. Agents table
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  display_name text not null,
  system_prompt text,
  personality_summary text,
  skills_summary text,
  last_prompt_generation timestamptz,
  memory_count integer default 0,
  status text default 'active' check (status in ('active', 'paused', 'suspended')),
  settings jsonb default '{
    "review_mode": false,
    "off_limits_topics": [],
    "response_style": "balanced",
    "max_interactions_per_day": 50
  }',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger on_agents_updated
  before update on public.agents
  for each row execute function public.handle_updated_at();

-- 6. Connections table (friend requests — human-only from webapp)
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'blocked')),
  access_level text default 'base' check (access_level in ('base', 'project', 'full')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(requester_id, receiver_id),
  check (requester_id != receiver_id)
);

create index idx_connections_requester on public.connections(requester_id, status);
create index idx_connections_receiver on public.connections(receiver_id, status);

create trigger on_connections_updated
  before update on public.connections
  for each row execute function public.handle_updated_at();

-- Helper function
create or replace function public.are_connected(user_a uuid, user_b uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1 from public.connections
    where status = 'accepted'
      and ((requester_id = user_a and receiver_id = user_b)
        or (requester_id = user_b and receiver_id = user_a))
  );
$$;

-- 7. Audit log
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  agent_user_id uuid not null references public.users(id),
  action text not null,
  target_user_id uuid references public.users(id),
  details jsonb default '{}',
  created_at timestamptz default now()
);

create index idx_audit_user on public.audit_log(agent_user_id, created_at desc);
create index idx_audit_rate_limit on public.audit_log(agent_user_id, action, created_at desc);

-- ============================================
-- RLS POLICIES (after all tables exist)
-- ============================================

-- Users RLS
alter table public.users enable row level security;

create policy "Users can read own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can search by display name" on public.users
  for select using (true);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Memories RLS
alter table public.memories enable row level security;

create policy "Users can CRUD own memories" on public.memories
  for all using (auth.uid() = user_id);

-- Agents RLS
alter table public.agents enable row level security;

create policy "Users can read own agent" on public.agents
  for select using (auth.uid() = user_id);

create policy "Users can update own agent" on public.agents
  for update using (auth.uid() = user_id);

create policy "Users can insert own agent" on public.agents
  for insert with check (auth.uid() = user_id);

create policy "Connected users can read agent profiles" on public.agents
  for select using (
    user_id in (
      select receiver_id from public.connections where requester_id = auth.uid() and status = 'accepted'
      union
      select requester_id from public.connections where receiver_id = auth.uid() and status = 'accepted'
    )
  );

-- Connections RLS
alter table public.connections enable row level security;

create policy "Users can see own connections" on public.connections
  for select using (auth.uid() = requester_id or auth.uid() = receiver_id);

create policy "Users can create connection requests" on public.connections
  for insert with check (auth.uid() = requester_id);

create policy "Receivers can update connections" on public.connections
  for update using (auth.uid() = receiver_id);

create policy "Users can delete own sent requests" on public.connections
  for delete using (auth.uid() = requester_id and status = 'pending');

-- Audit log RLS
alter table public.audit_log enable row level security;

create policy "Users can read own audit log" on public.audit_log
  for select using (auth.uid() = agent_user_id);

create policy "Service can insert audit log" on public.audit_log
  for insert with check (true);

-- ============================================
-- TRIGGERS — auto-create profile + agent on signup
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_new_agent()
returns trigger as $$
begin
  insert into public.agents (user_id, display_name)
  values (new.id, new.display_name);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_user_created_create_agent
  after insert on public.users
  for each row execute function public.handle_new_agent();
