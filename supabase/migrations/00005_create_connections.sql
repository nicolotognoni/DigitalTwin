-- ============================================
-- CONNESSIONI — grafo sociale tra utenti
-- Friend requests inviate SOLO dagli utenti nella webapp.
-- Una volta accepted, i due agent possono comunicare.
-- ============================================
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'blocked')),
  access_level text default 'base' check (access_level in (
    'base',
    'project',
    'full'
  )),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(requester_id, receiver_id),
  check (requester_id != receiver_id)
);

create index idx_connections_requester on public.connections(requester_id, status);
create index idx_connections_receiver on public.connections(receiver_id, status);

-- RLS
alter table public.connections enable row level security;

create policy "Users can see own connections" on public.connections
  for select using (auth.uid() = requester_id or auth.uid() = receiver_id);

create policy "Users can create connection requests" on public.connections
  for insert with check (auth.uid() = requester_id);

create policy "Receivers can update connections" on public.connections
  for update using (auth.uid() = receiver_id);

create policy "Users can delete own sent requests" on public.connections
  for delete using (auth.uid() = requester_id and status = 'pending');

create trigger on_connections_updated
  before update on public.connections
  for each row execute function public.handle_updated_at();

-- Helper: check if two users are connected
create or replace function public.are_connected(user_a uuid, user_b uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.connections
    where status = 'accepted'
      and (
        (requester_id = user_a and receiver_id = user_b)
        or (requester_id = user_b and receiver_id = user_a)
      )
  );
$$;
