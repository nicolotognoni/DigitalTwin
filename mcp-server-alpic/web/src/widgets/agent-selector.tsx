import "@/index.css";

import { mountWidget, useLayout } from "skybridge/web";
import { useToolInfo, useCallTool } from "../helpers.js";
import React, { useCallback, useMemo, useState } from "react";

interface Agent {
  readonly id: string;
  readonly name: string;
  readonly specialty: string;
  readonly icon: string;
}

interface FriendAgent extends Agent {
  readonly memory_count: number;
}

function renderMarkdown(md: string): string {
  return md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    // Headers
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>")
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Horizontal rules
    .replace(/^---$/gm, "<hr/>")
    // Paragraphs (lines not already wrapped)
    .replace(/^(?!<[hluop]|<hr|<pre|<li)(.+)$/gm, "<p>$1</p>")
    // Clean up
    .replace(/<\/ul>\s*<ul>/g, "")
    .replace(/\n{2,}/g, "\n");
}

function Markdown({ content }: { readonly content: string }) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  return (
    <div
      className="md-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function AgentCard({
  agent,
  selected,
  onToggle,
  badge,
}: {
  readonly agent: Agent;
  readonly selected: boolean;
  readonly onToggle: () => void;
  readonly badge?: string;
}) {
  return (
    <div
      onClick={onToggle}
      style={{
        ...styles.card,
        ...(selected ? styles.cardSelected : {}),
      }}
    >
      <div style={styles.cardHeader}>
        <span style={styles.cardIcon}>{agent.icon}</span>
        <div
          style={{
            ...styles.checkbox,
            ...(selected ? styles.checkboxSelected : {}),
          }}
        >
          {selected && "\u2713"}
        </div>
      </div>
      <div style={styles.cardName}>{agent.name}</div>
      <div style={styles.cardSpecialty}>{agent.specialty}</div>
      {badge && <div style={styles.badge}>{badge}</div>}
    </div>
  );
}

function AgentSelector() {
  const { theme } = useLayout();
  const toolInfo = useToolInfo<"agent-selector">();
  const { isPending } = toolInfo;

  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [planDescription, setPlanDescription] = useState<string>("");

  const {
    callTool: callCreatePlan,
    isPending: isCreatingPlan,
    data: planResult,
  } = useCallTool("create-plan");

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleAgent = useCallback(
    (id: string) => {
      setSelectedIds(
        selectedSet.has(id)
          ? selectedIds.filter((sid) => sid !== id)
          : [...selectedIds, id]
      );
    },
    [selectedIds, selectedSet, setSelectedIds]
  );

  const handleCreatePlan = useCallback(() => {
    if (selectedIds.length === 0 || !planDescription.trim()) return;

    callCreatePlan({
      plan_description: planDescription,
      agent_ids: [...selectedIds],
    });
  }, [selectedIds, planDescription, callCreatePlan]);

  if (isPending || !toolInfo.isSuccess) {
    return (
      <div data-theme={theme} style={styles.container}>
        <div style={styles.shimmer}>Loading agents...</div>
      </div>
    );
  }

  const { output } = toolInfo;
  const allAgents = output.builtin_agents as readonly Agent[];
  const friendAgents = output.friend_agents as readonly FriendAgent[];

  return (
    <div data-theme={theme} style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Build Your Team</h2>
        <p style={styles.subtitle}>
          Select agents to collaborate on your plan
        </p>
      </div>

      {/* Specialist Agents */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Specialist Agents</h3>
        <div style={styles.grid} data-llm="specialist-agents">
          {allAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              selected={selectedSet.has(agent.id)}
              onToggle={() => toggleAgent(agent.id)}
            />
          ))}
        </div>
      </div>

      {/* Friend Agents */}
      {friendAgents.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Friends' Digital Twins</h3>
          <div style={styles.grid} data-llm="friend-agents">
            {friendAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                selected={selectedSet.has(agent.id)}
                onToggle={() => toggleAgent(agent.id)}
                badge={`${agent.memory_count} memories`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Plan Input */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Describe Your Plan</h3>
        <textarea
          value={planDescription}
          onChange={(e) => setPlanDescription(e.target.value)}
          placeholder="Describe the project or feature you want to plan..."
          style={styles.textarea}
          rows={3}
          data-llm="plan-description"
        />
      </div>

      {/* Action */}
      <div style={styles.footer}>
        <span style={styles.selectedCount} data-llm="selected-count">
          {selectedIds.length} agent{selectedIds.length !== 1 ? "s" : ""}{" "}
          selected
        </span>
        <button
          onClick={handleCreatePlan}
          disabled={
            selectedIds.length === 0 ||
            !planDescription.trim() ||
            isCreatingPlan
          }
          style={{
            ...styles.button,
            ...(selectedIds.length === 0 ||
            !planDescription.trim() ||
            isCreatingPlan
              ? styles.buttonDisabled
              : {}),
          }}
        >
          {isCreatingPlan ? "Creating plan..." : "Create Plan"}
        </button>
      </div>

      {/* Loading state */}
      {isCreatingPlan && (
        <div style={styles.loadingBanner}>
          <div style={styles.spinner} />
          Agents are collaborating on your plan...
        </div>
      )}

      {/* Plan Result */}
      {planResult && (
        <div style={styles.planResult}>
          <h3 style={styles.planResultTitle}>Collaborative Plan</h3>

          {/* Agent contributions */}
          {((): React.ReactNode => {
            const contributions = (planResult.structuredContent as Record<string, unknown>)
              ?.contributions as ReadonlyArray<{
              agentId: string;
              icon: string;
              agentName: string;
              contribution: string;
            }> | undefined;
            if (!contributions) return null;
            return contributions.map((c) => (
              <div key={c.agentId} style={styles.contribution}>
                <div style={styles.contributionHeader}>
                  {c.icon} {c.agentName}
                </div>
                <Markdown content={c.contribution} />
              </div>
            ));
          })()}

          {/* Unified plan */}
          <div style={styles.unifiedPlan}>
            <h4 style={styles.unifiedPlanTitle}>Unified Plan</h4>
            <Markdown
              content={
                ((planResult.structuredContent as Record<string, unknown>)
                  ?.unified_plan as string) ?? ""
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    maxWidth: 700,
    margin: "0 auto",
    padding: 24,
    color: "var(--text-primary)",
    backgroundColor: "var(--bg-primary)",
  },
  shimmer: {
    padding: 40,
    textAlign: "center",
    color: "var(--text-secondary)",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    marginBottom: 4,
    color: "var(--text-primary)",
  },
  subtitle: {
    fontSize: 14,
    color: "var(--text-secondary)",
    margin: 0,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: "#888",
    marginBottom: 12,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 10,
  },
  card: {
    border: "1px solid var(--border-color)",
    borderRadius: 10,
    padding: 14,
    cursor: "pointer",
    transition: "all 0.15s",
    backgroundColor: "var(--bg-card)",
  },
  cardSelected: {
    borderColor: "var(--border-selected)",
    backgroundColor: "var(--bg-secondary)",
    boxShadow: "0 0 0 1px var(--border-selected)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    border: "1.5px solid var(--border-color)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
  },
  checkboxSelected: {
    backgroundColor: "var(--checkbox-bg)",
    borderColor: "var(--checkbox-bg)",
  },
  cardName: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 4,
    color: "var(--text-primary)",
  },
  cardSpecialty: {
    fontSize: 11,
    color: "var(--text-secondary)",
    lineHeight: 1.3,
  },
  badge: {
    marginTop: 6,
    fontSize: 10,
    color: "var(--text-secondary)",
    backgroundColor: "var(--badge-bg)",
    borderRadius: 4,
    padding: "2px 6px",
    display: "inline-block",
  },
  textarea: {
    width: "100%",
    padding: 12,
    border: "1px solid var(--input-border)",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "inherit",
    resize: "vertical" as const,
    outline: "none",
    boxSizing: "border-box" as const,
    backgroundColor: "var(--bg-card)",
    color: "var(--text-primary)",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTop: "1px solid var(--border-color)",
  },
  selectedCount: {
    fontSize: 13,
    color: "var(--text-secondary)",
  },
  button: {
    padding: "10px 24px",
    backgroundColor: "var(--btn-bg)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  buttonDisabled: {
    backgroundColor: "var(--border-color)",
    cursor: "not-allowed",
  },
  loadingBanner: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "var(--loading-bg)",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 14,
    color: "var(--text-primary)",
  },
  spinner: {
    width: 18,
    height: 18,
    border: "2px solid #ddd",
    borderTopColor: "#111",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  planResult: {
    marginTop: 20,
    borderTop: "1px solid var(--border-color)",
    paddingTop: 20,
  },
  planResultTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 16,
    color: "var(--text-primary)",
  },
  contribution: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: "var(--bg-secondary)",
    borderRadius: 8,
    border: "1px solid var(--border-color)",
  },
  contributionHeader: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
    color: "var(--text-primary)",
  },
  unifiedPlan: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "var(--plan-bg)",
    borderRadius: 8,
    border: "1px solid var(--plan-border)",
  },
  unifiedPlanTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 12,
    color: "var(--text-primary)",
  },
};

export default AgentSelector;

mountWidget(<AgentSelector />);
