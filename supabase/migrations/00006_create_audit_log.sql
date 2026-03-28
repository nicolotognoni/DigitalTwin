-- ============================================
-- AUDIT LOG — ogni interazione dell'agente viene loggata
-- ============================================
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  agent_user_id uuid not null references public.users(id),
  action text not null,
  target_user_id uuid references public.users(id),
  details jsonb default '{}',
  created_at timestamptz default now()
);

create index idx_audit_user on public.audit_log(agent_user_id, created_at desc);
-- Compound index for rate limiting queries
create index idx_audit_rate_limit on public.audit_log(agent_user_id, action, created_at desc);

-- RLS — users can read their own audit log
alter table public.audit_log enable row level security;

create policy "Users can read own audit log" on public.audit_log
  for select using (auth.uid() = agent_user_id);

-- Service role can insert (MCP server uses service role key)
create policy "Service can insert audit log" on public.audit_log
  for insert with check (true);

-- RLS policy for user search (display_name ILIKE)
-- Users can search for other users by display name
create policy "Users can search by display name" on public.users
  for select using (true);
-- Note: this opens read access to all users for search.
-- In production, consider a separate search endpoint with rate limiting.
