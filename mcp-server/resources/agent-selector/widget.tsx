import {
  McpUseProvider,
  useWidget,
  useCallTool,
  type WidgetMetadata,
} from "mcp-use/react";
import React, { useState, useCallback, useMemo } from "react";
import { z } from "zod";

const agentSchema = z.object({
  id: z.string(),
  name: z.string(),
  specialty: z.string(),
  icon: z.string(),
});

const friendAgentSchema = agentSchema.extend({
  memory_count: z.number(),
});

const propsSchema = z.object({
  builtin_agents: z.array(agentSchema),
  friend_agents: z.array(friendAgentSchema),
});

export const widgetMetadata: WidgetMetadata = {
  description:
    "Interactive agent selector for building a collaborative planning team",
  props: propsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Loading agents...",
    invoked: "Agents ready",
  },
};

type Props = z.infer<typeof propsSchema>;
type Agent = z.infer<typeof agentSchema>;

function renderMarkdown(md: string): string {
  return md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    // Headers
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr/>')
    // Paragraphs (lines not already wrapped)
    .replace(/^(?!<[hluop]|<hr|<pre|<li)(.+)$/gm, '<p>$1</p>')
    // Clean up
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/\n{2,}/g, '\n');
}

function Markdown({ content }: { content: string }) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  return <div className="md-content" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function AgentSelector() {
  const { props, isPending } = useWidget<Props>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [planDescription, setPlanDescription] = useState("");

  const {
    callTool: callCreatePlan,
    isPending: isCreatingPlan,
    data: planResult,
  } = useCallTool("create_plan");

  const toggleAgent = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    []
  );

  const handleCreatePlan = useCallback(() => {
    if (selectedIds.size === 0 || !planDescription.trim()) return;

    callCreatePlan({
      plan_description: planDescription,
      agent_ids: [...selectedIds],
    });
  }, [selectedIds, planDescription, callCreatePlan]);

  const darkModeCSS = `
    :root {
      --text-primary: #111;
      --text-secondary: #666;
      --bg-primary: #fff;
      --bg-secondary: #fafafa;
      --bg-card: #fff;
      --border-color: #e0e0e0;
      --border-selected: #111;
      --checkbox-bg: #111;
      --badge-bg: #f0f0f0;
      --input-border: #ddd;
      --btn-bg: #111;
      --loading-bg: #f0f7ff;
      --plan-bg: #f8f8f0;
      --plan-border: #e8e8d8;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --text-primary: #eee;
        --text-secondary: #aaa;
        --bg-primary: #1e1e1e;
        --bg-secondary: #2a2a2a;
        --bg-card: #2a2a2a;
        --border-color: #444;
        --border-selected: #6ea8fe;
        --checkbox-bg: #6ea8fe;
        --badge-bg: #333;
        --input-border: #555;
        --btn-bg: #6ea8fe;
        --loading-bg: #1a2a3a;
        --plan-bg: #2a2a20;
        --plan-border: #444;
      }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .md-content h1, .md-content h2, .md-content h3, .md-content h4 {
      margin: 12px 0 6px;
      color: var(--text-primary, #111);
    }
    .md-content h2 { font-size: 15px; font-weight: 700; }
    .md-content h3 { font-size: 14px; font-weight: 600; }
    .md-content h4 { font-size: 13px; font-weight: 600; }
    .md-content p { margin: 4px 0; line-height: 1.5; }
    .md-content ul { margin: 6px 0; padding-left: 20px; }
    .md-content li { margin: 2px 0; line-height: 1.5; }
    .md-content strong { font-weight: 600; }
    .md-content pre {
      background: var(--badge-bg, #f0f0f0);
      border-radius: 6px;
      padding: 10px;
      overflow-x: auto;
      font-size: 12px;
      margin: 8px 0;
    }
    .md-content code { font-family: 'SF Mono', Menlo, monospace; font-size: 12px; }
    .md-content .inline-code {
      background: var(--badge-bg, #f0f0f0);
      padding: 1px 5px;
      border-radius: 4px;
    }
    .md-content hr {
      border: none;
      border-top: 1px solid var(--border-color, #e0e0e0);
      margin: 12px 0;
    }
  `;

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <style>{darkModeCSS}</style>
        <div style={styles.container}>
          <div style={styles.shimmer}>Loading agents...</div>
        </div>
      </McpUseProvider>
    );
  }

  const allAgents = props.builtin_agents;
  const friendAgents = props.friend_agents;

  return (
    <McpUseProvider autoSize>
      <style>{darkModeCSS}</style>
      <div style={styles.container}>
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
          <div style={styles.grid}>
            {allAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                selected={selectedIds.has(agent.id)}
                onToggle={() => toggleAgent(agent.id)}
              />
            ))}
          </div>
        </div>

        {/* Friend Agents */}
        {friendAgents.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Friends' Digital Twins</h3>
            <div style={styles.grid}>
              {friendAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  selected={selectedIds.has(agent.id)}
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
          />
        </div>

        {/* Action */}
        <div style={styles.footer}>
          <span style={styles.selectedCount}>
            {selectedIds.size} agent{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={handleCreatePlan}
            disabled={
              selectedIds.size === 0 ||
              !planDescription.trim() ||
              isCreatingPlan
            }
            style={{
              ...styles.button,
              ...(selectedIds.size === 0 ||
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
            {(
              planResult.structuredContent as any
            )?.contributions?.map((c: any) => (
              <div key={c.agentId} style={styles.contribution}>
                <div style={styles.contributionHeader}>
                  {c.icon} {c.agentName}
                </div>
                <Markdown content={c.contribution} />
              </div>
            ))}

            {/* Unified plan */}
            <div style={styles.unifiedPlan}>
              <h4 style={styles.unifiedPlanTitle}>Unified Plan</h4>
              <Markdown content={(planResult.structuredContent as any)?.unified_plan ?? ""} />
            </div>
          </div>
        )}
      </div>
    </McpUseProvider>
  );
}

function AgentCard({
  agent,
  selected,
  onToggle,
  badge,
}: {
  agent: Agent;
  selected: boolean;
  onToggle: () => void;
  badge?: string;
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
          {selected && "✓"}
        </div>
      </div>
      <div style={styles.cardName}>{agent.name}</div>
      <div style={styles.cardSpecialty}>{agent.specialty}</div>
      {badge && <div style={styles.badge}>{badge}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    maxWidth: 700,
    margin: "0 auto",
    padding: 24,
    color: "var(--text-primary, #111)",
    backgroundColor: "var(--bg-primary, #fff)",
  },
  shimmer: {
    padding: 40,
    textAlign: "center",
    color: "var(--text-secondary, #888)",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    marginBottom: 4,
    color: "var(--text-primary, #111)",
  },
  subtitle: {
    fontSize: 14,
    color: "var(--text-secondary, #888)",
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
    border: "1px solid var(--border-color, #e0e0e0)",
    borderRadius: 10,
    padding: 14,
    cursor: "pointer",
    transition: "all 0.15s",
    backgroundColor: "var(--bg-card, #fff)",
  },
  cardSelected: {
    borderColor: "var(--border-selected, #111)",
    backgroundColor: "var(--bg-secondary, #f8f8f8)",
    boxShadow: "0 0 0 1px var(--border-selected, #111)",
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
    border: "1.5px solid var(--border-color, #ccc)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
  },
  checkboxSelected: {
    backgroundColor: "var(--checkbox-bg, #111)",
    borderColor: "var(--checkbox-bg, #111)",
  },
  cardName: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 4,
    color: "var(--text-primary, #111)",
  },
  cardSpecialty: {
    fontSize: 11,
    color: "var(--text-secondary, #888)",
    lineHeight: 1.3,
  },
  badge: {
    marginTop: 6,
    fontSize: 10,
    color: "var(--text-secondary, #666)",
    backgroundColor: "var(--badge-bg, #f0f0f0)",
    borderRadius: 4,
    padding: "2px 6px",
    display: "inline-block",
  },
  textarea: {
    width: "100%",
    padding: 12,
    border: "1px solid var(--input-border, #ddd)",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "inherit",
    resize: "vertical" as const,
    outline: "none",
    boxSizing: "border-box" as const,
    backgroundColor: "var(--bg-card, #fff)",
    color: "var(--text-primary, #111)",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTop: "1px solid var(--border-color, #eee)",
  },
  selectedCount: {
    fontSize: 13,
    color: "var(--text-secondary, #666)",
  },
  button: {
    padding: "10px 24px",
    backgroundColor: "var(--btn-bg, #111)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  buttonDisabled: {
    backgroundColor: "var(--border-color, #ccc)",
    cursor: "not-allowed",
  },
  loadingBanner: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "var(--loading-bg, #f0f7ff)",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 14,
    color: "var(--text-primary, #333)",
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
    borderTop: "1px solid #eee",
    paddingTop: 20,
  },
  planResultTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 16,
  },
  contribution: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: "var(--bg-secondary, #fafafa)",
    borderRadius: 8,
    border: "1px solid var(--border-color, #eee)",
  },
  contributionHeader: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
    color: "var(--text-primary, #111)",
  },
  contributionText: {
    fontSize: 13,
    color: "var(--text-secondary, #444)",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap" as const,
  },
  unifiedPlan: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "var(--plan-bg, #f8f8f0)",
    borderRadius: 8,
    border: "1px solid var(--plan-border, #e8e8d8)",
  },
  unifiedPlanTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 12,
    color: "var(--text-primary, #111)",
  },
  unifiedPlanText: {
    fontSize: 13,
    color: "var(--text-primary, #333)",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap" as const,
  },
};
