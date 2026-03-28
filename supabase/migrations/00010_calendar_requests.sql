-- ============================================
-- CALENDAR REQUESTS — stub architetturale
-- Per future integrazioni Google Calendar.
-- Quando un utente chiede disponibilità a un amico,
-- la richiesta viene salvata qui.
-- ============================================
create table public.calendar_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  target_id uuid not null references public.users(id) on delete cascade,
  proposed_time timestamptz not null,
  duration_minutes int default 30,
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  notification_id uuid references public.notifications(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (requester_id != target_id)
);

create index idx_calendar_requests_target
  on public.calendar_requests(target_id, status);

-- RLS
alter table public.calendar_requests enable row level security;

create policy "Users can see own calendar requests" on public.calendar_requests
  for select using (auth.uid() = requester_id or auth.uid() = target_id);

create policy "Users can create calendar requests" on public.calendar_requests
  for insert with check (auth.uid() = requester_id);

create policy "Targets can update calendar requests" on public.calendar_requests
  for update using (auth.uid() = target_id);

create trigger on_calendar_requests_updated
  before update on public.calendar_requests
  for each row execute function public.handle_updated_at();
