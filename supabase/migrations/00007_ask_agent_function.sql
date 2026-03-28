-- ============================================
-- SECURITY DEFINER function for ask_agent
--
-- This function allows a connected user to read another user's
-- memories and agent data for the Digital Twin response.
-- It verifies the connection exists before returning any data.
-- Runs with elevated privileges (SECURITY DEFINER) but enforces
-- its own access control via the connection check.
-- ============================================

create or replace function public.get_connected_agent_data(
  p_requester_id uuid,
  p_target_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_user record;
  v_is_connected boolean;
  v_memories jsonb;
  v_agent record;
  v_memory_count int;
begin
  -- 1. Find target user by display_name
  select id, display_name into v_target_user
  from public.users
  where lower(display_name) = lower(p_target_display_name)
  limit 1;

  if v_target_user is null then
    return jsonb_build_object('error', 'user_not_found');
  end if;

  -- 2. Verify connection exists and is accepted
  v_is_connected := public.are_connected(p_requester_id, v_target_user.id);

  if not v_is_connected then
    return jsonb_build_object('error', 'not_connected');
  end if;

  -- 3. Get target's active memories
  select jsonb_agg(
    jsonb_build_object(
      'category', m.category,
      'content', m.content,
      'confidence', m.confidence,
      'created_at', m.created_at
    ) order by m.confidence desc, m.created_at desc
  )
  into v_memories
  from public.memories m
  where m.user_id = v_target_user.id
    and m.is_active = true;

  -- 4. Get memory count
  select count(*) into v_memory_count
  from public.memories
  where user_id = v_target_user.id
    and is_active = true;

  -- 5. Get agent data
  select display_name, personality_summary, skills_summary, status
  into v_agent
  from public.agents
  where user_id = v_target_user.id;

  return jsonb_build_object(
    'target_user_id', v_target_user.id,
    'target_display_name', v_target_user.display_name,
    'memories', coalesce(v_memories, '[]'::jsonb),
    'memory_count', v_memory_count,
    'agent', jsonb_build_object(
      'display_name', v_agent.display_name,
      'personality_summary', v_agent.personality_summary,
      'skills_summary', v_agent.skills_summary,
      'status', v_agent.status
    )
  );
end;
$$;

-- Also create a function for logging audit entries
-- (users can't INSERT directly due to RLS, so we use SECURITY DEFINER)
create or replace function public.log_agent_interaction(
  p_agent_user_id uuid,
  p_action text,
  p_target_user_id uuid default null,
  p_details jsonb default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (agent_user_id, action, target_user_id, details)
  values (p_agent_user_id, p_action, p_target_user_id, p_details);
end;
$$;

-- Function to get rate limit count
create or replace function public.get_ask_agent_count_today(p_user_id uuid)
returns int
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int
  from public.audit_log
  where agent_user_id = p_user_id
    and action = 'ask_agent'
    and created_at > now() - interval '1 day';
$$;
