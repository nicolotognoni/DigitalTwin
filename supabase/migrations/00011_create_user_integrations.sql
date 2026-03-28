-- ============================================
-- USER INTEGRATIONS — token OAuth per servizi esterni
-- Usato per Google Calendar integration.
-- ============================================
create table public.user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null check (provider in ('google_calendar')),
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

alter table public.user_integrations enable row level security;

create policy "Users CRUD own integrations" on public.user_integrations
  for all using (auth.uid() = user_id);

create trigger on_user_integrations_updated
  before update on public.user_integrations
  for each row execute function public.handle_updated_at();
