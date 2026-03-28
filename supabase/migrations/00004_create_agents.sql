-- ============================================
-- AGENTI — configurazione del Digital Twin
-- ============================================
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

-- RLS
alter table public.agents enable row level security;

create policy "Users can read own agent" on public.agents
  for select using (auth.uid() = user_id);

create policy "Users can update own agent" on public.agents
  for update using (auth.uid() = user_id);

create policy "Users can insert own agent" on public.agents
  for insert with check (auth.uid() = user_id);

-- Connected users can read agent profiles (for ask_agent)
create policy "Connected users can read agent profiles" on public.agents
  for select using (
    user_id in (
      select receiver_id from public.connections where requester_id = auth.uid() and status = 'accepted'
      union
      select requester_id from public.connections where receiver_id = auth.uid() and status = 'accepted'
    )
  );

create trigger on_agents_updated
  before update on public.agents
  for each row execute function public.handle_updated_at();

-- Auto-create agent when user profile is created
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
