-- ============================================
-- NOTIFICATIONS — notifiche per gli utenti
-- Create server-side via SECURITY DEFINER
-- perché User A può creare notifica per User B.
-- ============================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in (
    'connection_request',
    'calendar_request',
    'plan_shared',
    'agent_interaction'
  )),
  title text not null,
  body text,
  metadata jsonb default '{}',
  is_read boolean default false,
  created_at timestamptz default now()
);

create index idx_notifications_user_unread
  on public.notifications(user_id, is_read, created_at desc);

-- RLS
alter table public.notifications enable row level security;

create policy "Users can read own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- SECURITY DEFINER: server-side notification creation (cross-user)
create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text default null,
  p_metadata jsonb default '{}'
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  insert into public.notifications (user_id, type, title, body, metadata)
  values (p_user_id, p_type, p_title, p_body, p_metadata)
  returning id into v_id;
  return v_id;
end;
$$;
