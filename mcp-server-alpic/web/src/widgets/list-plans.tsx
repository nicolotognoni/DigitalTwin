import "@/index.css";

import { mountWidget, useLayout } from "skybridge/web";
import { useToolInfo } from "../helpers.js";
import React from "react";

interface PlanItem {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: string;
  readonly agent_ids: readonly string[];
  readonly created_at: string;
  readonly updated_at: string;
}

const STATUS_CONFIG: Readonly<
  Record<string, { label: string }>
> = {
  draft: { label: "Draft" },
  active: { label: "Active" },
  completed: { label: "Completed" },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "ora";
  if (diffMins < 60) return `${diffMins} min fa`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} or${diffHours === 1 ? "a" : "e"} fa`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} giorn${diffDays === 1 ? "o" : "i"} fa`;

  return d.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function PlanCard({ plan }: { readonly plan: PlanItem }) {
  const status = STATUS_CONFIG[plan.status] ?? STATUS_CONFIG.draft;
  const agentCount = plan.agent_ids.length;

  return (
    <div style={s.card}>
      {/* Top row: name + status */}
      <div style={s.cardTop}>
        <div style={s.cardTitleRow}>
          <div style={s.planIcon}>
            <span style={s.planIconText}>{"\uD83D\uDCCB"}</span>
          </div>
          <div style={s.cardTitleBlock}>
            <span style={s.cardTitle}>{plan.name}</span>
            {plan.description && (
              <p style={s.cardDescription}>{plan.description}</p>
            )}
          </div>
        </div>
        <span style={s.statusBadge}>
          {status.label}
        </span>
      </div>

      {/* Bottom row: meta */}
      <div style={s.cardMeta}>
        <div style={s.metaItem}>
          <span style={s.metaLabel}>Agents</span>
          <span style={s.metaValue}>{agentCount}</span>
        </div>
        <div style={s.metaDivider} />
        <div style={s.metaItem}>
          <span style={s.metaLabel}>Created</span>
          <span style={s.metaValue}>{formatDate(plan.created_at)}</span>
        </div>
        <div style={s.metaDivider} />
        <div style={s.metaItem}>
          <span style={s.metaLabel}>Updated</span>
          <span style={s.metaValue}>{formatDate(plan.updated_at)}</span>
        </div>
      </div>
    </div>
  );
}

function PlansListWidget() {
  const { theme } = useLayout();
  const toolInfo = useToolInfo<"list-plans">();
  const { isPending } = toolInfo;

  if (isPending || !toolInfo.isSuccess) {
    return (
      <div data-theme={theme} style={s.container}>
        <div style={s.loadingContainer}>
          <div style={s.spinner} />
          <span style={s.loadingText}>Loading plans...</span>
        </div>
      </div>
    );
  }

  const { output } = toolInfo;
  const plans = output.plans as readonly PlanItem[];
  const count = output.count as number;

  return (
    <div data-theme={theme} style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.headerDot} />
          <div>
            <h2 style={s.title}>Your Plans</h2>
            <p style={s.subtitle}>Collaborative plans created with your agent team</p>
          </div>
        </div>
        {count > 0 && (
          <span style={s.countBadge}>
            {count} plan{count !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      {plans.length === 0 ? (
        <div style={s.empty}>
          <span style={s.emptyIcon}>{"\uD83D\uDCCB"}</span>
          <span style={s.emptyTitle}>No plans yet</span>
          <span style={s.emptyText}>
            Crea un piano con il team di agenti per vederlo qui.
          </span>
        </div>
      ) : (
        <div style={s.list} data-llm="plans-list">
          {plans.map((plan: PlanItem) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    maxWidth: 600,
    margin: "0 auto",
    padding: 24,
    color: "var(--text-primary)",
    backgroundColor: "var(--bg-primary)",
  },

  // Loading
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 48,
  },
  loadingText: {
    fontSize: 13,
    color: "var(--text-tertiary)",
  },
  spinner: {
    width: 18,
    height: 18,
    border: "2px solid var(--border-color)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  // Header
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottom: "1px solid var(--border-color)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: "var(--accent)",
    flexShrink: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    letterSpacing: "-0.02em",
    color: "var(--text-primary)",
  },
  subtitle: {
    fontSize: 12,
    color: "var(--text-tertiary)",
    margin: 0,
    marginTop: 2,
  },
  countBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-secondary)",
    backgroundColor: "var(--badge-bg)",
    borderRadius: "var(--radius-full)",
    padding: "4px 12px",
    letterSpacing: "0.02em",
  },

  // Empty state
  empty: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 6,
    padding: 48,
  },
  emptyIcon: {
    fontSize: 32,
    opacity: 0.3,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  emptyText: {
    fontSize: 12,
    color: "var(--text-tertiary)",
    textAlign: "center" as const,
  },

  // List
  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },

  // Card
  card: {
    padding: 16,
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-card)",
    boxShadow: "var(--shadow-sm)",
    animation: "fadeIn 0.3s ease-out",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  cardTitleRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  planIcon: {
    width: 36,
    height: 36,
    borderRadius: "var(--radius-sm)",
    backgroundColor: "var(--accent-soft)",
    border: "1px solid var(--border-color)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  planIconText: {
    fontSize: 16,
  },
  cardTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-primary)",
    lineHeight: 1.3,
    display: "block",
  },
  cardDescription: {
    fontSize: 12,
    color: "var(--text-secondary)",
    margin: 0,
    marginTop: 3,
    lineHeight: 1.4,
    overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
    whiteSpace: "nowrap" as const,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 600,
    borderRadius: "var(--radius-full)",
    padding: "3px 10px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--badge-bg)",
    color: "var(--text-secondary)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },

  // Meta row
  cardMeta: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    paddingTop: 12,
    borderTop: "1px solid var(--border-color)",
  },
  metaItem: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "var(--text-tertiary)",
  },
  metaValue: {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--text-secondary)",
  },
  metaDivider: {
    width: 1,
    height: 24,
    backgroundColor: "var(--border-color)",
    flexShrink: 0,
  },
};

export default PlansListWidget;

mountWidget(<PlansListWidget />);
