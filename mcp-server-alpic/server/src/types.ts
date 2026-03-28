export type MemoryCategory =
  | "identity"
  | "skill"
  | "preference"
  | "decision"
  | "project"
  | "relationship"
  | "opinion"
  | "communication"
  | "goal";

export type MemorySource =
  | "chatgpt"
  | "claude"
  | "perplexity"
  | "manual"
  | "integration";

export interface SaveMemoryInput {
  readonly content: string;
  readonly category: MemoryCategory;
  readonly metadata?: Record<string, unknown>;
}

export interface SaveMemoryResult {
  readonly memory_id: string;
  readonly status: "created" | "deduplicated";
}

export interface AskAgentResult {
  readonly agent_name: string;
  readonly response: string;
  readonly disclaimer: string;
  readonly confidence: number;
  readonly memory_count: number;
}

export interface AskAgentError {
  readonly error:
    | "not_connected"
    | "user_not_found"
    | "twin_empty"
    | "rate_limited"
    | "api_error";
  readonly message: string;
}

// Plans
export type PlanStatus = "draft" | "active" | "completed";

export interface AgentContribution {
  readonly agentId: string;
  readonly agentName: string;
  readonly icon: string;
  readonly specialty: string;
  readonly contribution: string;
}

export interface CollaborativePlanResult {
  readonly plan_title: string;
  readonly agents_involved: readonly { id: string; name: string; icon: string }[];
  readonly contributions: readonly AgentContribution[];
  readonly unified_plan: string;
}

export interface SavedPlan {
  readonly id: string;
  readonly user_id: string;
  readonly name: string;
  readonly description: string | null;
  readonly plan_data: CollaborativePlanResult;
  readonly agent_ids: readonly string[];
  readonly status: PlanStatus;
  readonly created_at: string;
  readonly updated_at: string;
}

// Notifications
export type NotificationType =
  | "connection_request"
  | "calendar_request"
  | "plan_shared"
  | "agent_interaction";

export interface Notification {
  readonly id: string;
  readonly user_id: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly body: string | null;
  readonly metadata: Record<string, unknown>;
  readonly is_read: boolean;
  readonly created_at: string;
}
