import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildAgentPromptFromMemories } from "./prompt-builder";
import { getSpecialistAgent, SPECIALIST_AGENTS } from "./specialist-agents";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface AgentContribution {
  readonly agentId: string;
  readonly agentName: string;
  readonly icon: string;
  readonly specialty: string;
  readonly contribution: string;
}

interface CollaborativePlanResult {
  readonly plan_title: string;
  readonly agents_involved: readonly { id: string; name: string; icon: string }[];
  readonly contributions: readonly AgentContribution[];
  readonly unified_plan: string;
}

interface FriendAgentInfo {
  readonly displayName: string;
  readonly memories: readonly { category: string; content: string; confidence: number; created_at: string }[];
  readonly memoryCount: number;
}

/**
 * Fetch a friend's agent data for collaborative planning.
 */
async function fetchFriendAgent(
  supabase: SupabaseClient,
  requesterId: string,
  targetDisplayName: string
): Promise<FriendAgentInfo | null> {
  const { data, error } = await supabase.rpc("get_connected_agent_data", {
    p_requester_id: requesterId,
    p_target_display_name: targetDisplayName,
  });

  if (error || data?.error) return null;

  return {
    displayName: data.target_display_name,
    memories: data.memories ?? [],
    memoryCount: data.memory_count ?? 0,
  };
}

/**
 * Extract text from a Claude response that may contain web search results.
 * Filters out tool_use blocks and joins all text blocks.
 */
function extractTextFromResponse(response: Anthropic.Message): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

/**
 * Get a single agent's contribution to the plan.
 * Uses web_search tool so agents can research current info.
 */
async function getAgentContribution(
  systemPrompt: string,
  planDescription: string,
  agentContext: string
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: systemPrompt,
    tools: [
      { type: "web_search_20250305" as any, name: "web_search" } as any,
    ],
    messages: [
      {
        role: "user",
        content: `Progetto: ${planDescription}

${agentContext ? `Contesto: ${agentContext}` : ""}

Dai 3-5 raccomandazioni concrete dalla tua area di competenza. Se utile, cerca informazioni aggiornate su internet (framework attuali, best practice, prezzi). Sii breve e pratico.`,
      },
    ],
  });

  return extractTextFromResponse(response);
}

/**
 * Synthesize all agent contributions into a unified plan.
 */
async function synthesizePlan(
  planDescription: string,
  contributions: readonly AgentContribution[]
): Promise<string> {
  const contributionsSummary = contributions
    .map(
      (c) =>
        `### ${c.icon} ${c.agentName} (${c.specialty})\n${c.contribution}`
    )
    .join("\n\n---\n\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: `Sintetizza i contributi degli specialisti in un piano d'azione breve e chiaro. Organizza per fasi con deliverable. Sii conciso.`,
    messages: [
      {
        role: "user",
        content: `Progetto: ${planDescription}

${contributionsSummary}

Piano unificato:`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

/**
 * List all available agents (built-in + connected friends).
 */
export async function listAvailableAgents(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  readonly builtin_agents: readonly {
    id: string;
    name: string;
    specialty: string;
    icon: string;
  }[];
  readonly friend_agents: readonly {
    id: string;
    name: string;
    specialty: string;
    icon: string;
    memory_count: number;
  }[];
}> {
  const builtinAgents = SPECIALIST_AGENTS.map((a) => ({
    id: a.id,
    name: a.name,
    specialty: a.specialty,
    icon: a.icon,
  }));

  const { data: connections } = await supabase
    .from("connections")
    .select("requester_id, receiver_id")
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
    .eq("status", "accepted");

  const friendIds = (connections ?? []).map((c) =>
    c.requester_id === userId ? c.receiver_id : c.requester_id
  );

  let friendAgents: {
    id: string;
    name: string;
    specialty: string;
    icon: string;
    memory_count: number;
  }[] = [];

  if (friendIds.length > 0) {
    const { data: agents } = await supabase
      .from("agents")
      .select("user_id, display_name, memory_count, personality_summary")
      .in("user_id", friendIds);

    friendAgents = (agents ?? []).map((a) => ({
      id: `friend:${a.display_name}`,
      name: `${a.display_name}'s Twin`,
      specialty: a.personality_summary || "Based on their stored memories",
      icon: "👤",
      memory_count: a.memory_count ?? 0,
    }));
  }

  return { builtin_agents: builtinAgents, friend_agents: friendAgents };
}

/**
 * Prepare agent task (resolve system prompt + metadata) without calling Claude.
 * Used to parallelize agent contributions.
 */
async function resolveAgentTask(
  supabase: SupabaseClient,
  userId: string,
  agentId: string
): Promise<{
  agentId: string;
  agentName: string;
  icon: string;
  specialty: string;
  systemPrompt: string | null;
} | null> {
  if (agentId.startsWith("friend:")) {
    const displayName = agentId.replace("friend:", "");
    const friendData = await fetchFriendAgent(supabase, userId, displayName);

    if (!friendData || friendData.memoryCount < 3) {
      return {
        agentId,
        agentName: `${displayName}'s Twin`,
        icon: "👤",
        specialty: "Digital Twin",
        systemPrompt: null, // signals skip
      };
    }

    const systemPrompt = buildAgentPromptFromMemories(
      friendData.displayName,
      friendData.memories as any
    );

    return {
      agentId,
      agentName: `${friendData.displayName}'s Twin`,
      icon: "👤",
      specialty: "Digital Twin - competenze ed esperienza personale",
      systemPrompt:
        systemPrompt +
        "\n\nContribuisci al piano con il tuo punto di vista e la tua esperienza personale.",
    };
  }

  const specialist = getSpecialistAgent(agentId);
  if (!specialist) return null;

  return {
    agentId,
    agentName: specialist.name,
    icon: specialist.icon,
    specialty: specialist.specialty,
    systemPrompt: specialist.systemPrompt,
  };
}

/**
 * Create a collaborative plan using multiple agents.
 * Agent contributions are fetched in parallel for speed.
 */
export async function createCollaborativePlan(
  supabase: SupabaseClient,
  userId: string,
  planDescription: string,
  agentIds: readonly string[],
  context?: string
): Promise<CollaborativePlanResult> {
  // Phase 1: Resolve all agent tasks (fetch friend data, etc.)
  const tasks = await Promise.all(
    agentIds.map((id) => resolveAgentTask(supabase, userId, id))
  );

  // Phase 2: Call Claude in parallel for all agents with valid prompts
  const contributionPromises = tasks.map(async (task) => {
    if (!task) return null;

    if (task.systemPrompt === null) {
      // Agent doesn't have enough data — return skip contribution
      return {
        agentId: task.agentId,
        agentName: task.agentName,
        icon: task.icon,
        specialty: task.specialty,
        contribution: `Il Digital Twin non ha abbastanza memorie per contribuire al piano.`,
      } satisfies AgentContribution;
    }

    const contribution = await getAgentContribution(
      task.systemPrompt,
      planDescription,
      context ?? ""
    );

    return {
      agentId: task.agentId,
      agentName: task.agentName,
      icon: task.icon,
      specialty: task.specialty,
      contribution,
    } satisfies AgentContribution;
  });

  const results = await Promise.all(contributionPromises);
  const contributions = results.filter(
    (r): r is AgentContribution => r !== null
  );
  const agentsInvolved = contributions.map((c) => ({
    id: c.agentId,
    name: c.agentName,
    icon: c.icon,
  }));

  // Phase 3: Synthesize all contributions into a unified plan
  const unifiedPlan = await synthesizePlan(planDescription, contributions);

  return {
    plan_title: planDescription.slice(0, 100),
    agents_involved: agentsInvolved,
    contributions,
    unified_plan: unifiedPlan,
  };
}
