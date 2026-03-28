-- ============================================
-- 00012_semantic_agent_search.sql
--
-- Replaces the full-memory fetch in get_connected_agent_data with a
-- semantic (pgvector) search. Only the top-N most relevant memories
-- for the caller's question/task are returned, dramatically reducing
-- payload size and improving prompt quality.
--
-- Response shape is intentionally identical to get_connected_agent_data
-- so no downstream TypeScript changes are needed in prompt-builder.ts.
-- ============================================

CREATE OR REPLACE FUNCTION public.get_connected_agent_memories_semantic(
  p_requester_id       uuid,
  p_target_display_name text,
  p_query_embedding    vector(1536),
  p_match_limit        int DEFAULT 15
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user  record;
  v_is_connected boolean;
  v_memories     jsonb;
  v_agent        record;
  v_memory_count int;
BEGIN
  -- 1. Resolve target user by display_name (case-insensitive)
  SELECT id, display_name
  INTO v_target_user
  FROM public.users
  WHERE lower(display_name) = lower(p_target_display_name)
  LIMIT 1;

  IF v_target_user IS NULL THEN
    RETURN jsonb_build_object('error', 'user_not_found');
  END IF;

  -- 2. Verify accepted connection (reuses existing helper)
  v_is_connected := public.are_connected(p_requester_id, v_target_user.id);
  IF NOT v_is_connected THEN
    RETURN jsonb_build_object('error', 'not_connected');
  END IF;

  -- 3. Semantic search: top-N memories ordered by cosine distance to query.
  --    Only memories that have an embedding stored are considered.
  --    The <=> operator is pgvector's cosine distance (0 = identical, 2 = opposite).
  SELECT jsonb_agg(
    jsonb_build_object(
      'category',   m.category,
      'content',    m.content,
      'confidence', m.confidence,
      'created_at', m.created_at
    )
  )
  INTO v_memories
  FROM (
    SELECT category, content, confidence, created_at
    FROM public.memories
    WHERE user_id     = v_target_user.id
      AND is_active   = true
      AND embedding   IS NOT NULL
    ORDER BY embedding <=> p_query_embedding
    LIMIT p_match_limit
  ) m;

  -- 4. Total memory count (for confidence score — unchanged from original)
  SELECT count(*)
  INTO v_memory_count
  FROM public.memories
  WHERE user_id   = v_target_user.id
    AND is_active = true;

  -- 5. Agent profile metadata
  SELECT display_name, personality_summary, skills_summary, status
  INTO v_agent
  FROM public.agents
  WHERE user_id = v_target_user.id;

  -- Return shape matches get_connected_agent_data for TS compatibility
  RETURN jsonb_build_object(
    'target_user_id',      v_target_user.id,
    'target_display_name', v_target_user.display_name,
    'memories',            COALESCE(v_memories, '[]'::jsonb),
    'memory_count',        v_memory_count,
    'agent', jsonb_build_object(
      'display_name',        v_agent.display_name,
      'personality_summary', v_agent.personality_summary,
      'skills_summary',      v_agent.skills_summary,
      'status',              v_agent.status
    )
  );
END;
$$;
