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

export type ConnectionStatus = "pending" | "accepted" | "rejected" | "blocked";

export type AccessLevel = "base" | "project" | "full";

export type AgentStatus = "active" | "paused" | "suspended";

export interface User {
  readonly id: string;
  readonly email: string;
  readonly display_name: string;
  readonly avatar_url: string | null;
  readonly bio: string | null;
  readonly onboarding_completed: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface Memory {
  readonly id: string;
  readonly user_id: string;
  readonly category: MemoryCategory;
  readonly content: string;
  readonly source: MemorySource;
  readonly confidence: number;
  readonly metadata: Record<string, unknown>;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface Agent {
  readonly id: string;
  readonly user_id: string;
  readonly display_name: string;
  readonly system_prompt: string | null;
  readonly personality_summary: string | null;
  readonly skills_summary: string | null;
  readonly last_prompt_generation: string | null;
  readonly memory_count: number;
  readonly status: AgentStatus;
  readonly settings: AgentSettings;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AgentSettings {
  readonly review_mode: boolean;
  readonly off_limits_topics: readonly string[];
  readonly response_style: string;
  readonly max_interactions_per_day: number | null;
}

export interface Connection {
  readonly id: string;
  readonly requester_id: string;
  readonly receiver_id: string;
  readonly status: ConnectionStatus;
  readonly access_level: AccessLevel;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AuditLogEntry {
  readonly id: string;
  readonly agent_user_id: string;
  readonly action: string;
  readonly target_user_id: string | null;
  readonly conversation_id: string | null;
  readonly details: Record<string, unknown>;
  readonly created_at: string;
}
