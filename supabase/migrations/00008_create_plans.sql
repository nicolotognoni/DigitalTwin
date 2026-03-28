-- ============================================
-- PLANS — piani collaborativi salvati
-- Contengono il risultato completo di create_plan
-- con tutti i contributi degli agenti.
-- ============================================
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  plan_data jsonb not null,
  agent_ids text[] not null default '{}',
  status text default 'draft' check (status in ('draft', 'active', 'completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_plans_user on public.plans(user_id);
create index idx_plans_user_name on public.plans(user_id, name);

-- RLS
alter table public.plans enable row level security;

create policy "Users can CRUD own plans" on public.plans
  for all using (auth.uid() = user_id);

create trigger on_plans_updated
  before update on public.plans
  for each row execute function public.handle_updated_at();

-- Fuzzy search by name/description
create or replace function public.search_plans_by_name(
  p_user_id uuid,
  p_search_term text
) returns setof public.plans
language plpgsql security definer set search_path = public
as $$
begin
  return query
  select * from public.plans
  where user_id = p_user_id
    and (
      name ilike '%' || p_search_term || '%'
      or description ilike '%' || p_search_term || '%'
    )
  order by updated_at desc;
end;
$$;
