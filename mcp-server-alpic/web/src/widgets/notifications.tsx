import "@/index.css";

import { mountWidget, useLayout } from "skybridge/web";
import { useToolInfo } from "../helpers.js";
import React from "react";

interface NotificationItem {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly body: string | null;
  readonly metadata: Record<string, unknown>;
  readonly is_read: boolean;
  readonly created_at: string;
}

const TYPE_ICONS: Readonly<Record<string, string>> = {
  connection_request: "\uD83E\uDD1D",
  calendar_request: "\uD83D\uDCC5",
  plan_shared: "\uD83D\uDCCB",
  agent_interaction: "\uD83E\uDD16",
};

const TYPE_LABELS: Readonly<Record<string, string>> = {
  connection_request: "Connection",
  calendar_request: "Calendar",
  plan_shared: "Plan",
  agent_interaction: "Agent",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "ora";
  if (minutes < 60) return `${minutes} min fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} or${hours === 1 ? "a" : "e"} fa`;
  const days = Math.floor(hours / 24);
  return `${days} giorn${days === 1 ? "o" : "i"} fa`;
}

function NotificationCard({
  notification,
}: {
  readonly notification: NotificationItem;
}) {
  const icon = TYPE_ICONS[notification.type] ?? "\uD83D\uDCEC";
  const label = TYPE_LABELS[notification.type] ?? notification.type;

  return (
    <div style={styles.card}>
      <div style={styles.cardLeft}>
        <span style={styles.icon}>{icon}</span>
      </div>
      <div style={styles.cardContent}>
        <div style={styles.cardTop}>
          <span style={styles.cardTitle}>{notification.title}</span>
          <span style={styles.time}>
            {timeAgo(notification.created_at)}
          </span>
        </div>
        {notification.body && (
          <div style={styles.cardBody}>{notification.body}</div>
        )}
        <div style={styles.typeBadge}>{label}</div>
      </div>
    </div>
  );
}

function NotificationsWidget() {
  const { theme } = useLayout();
  const toolInfo = useToolInfo<"notifications">();
  const { isPending } = toolInfo;

  if (isPending || !toolInfo.isSuccess) {
    return (
      <div data-theme={theme} style={styles.container}>
        <div style={styles.empty}>Loading notifications...</div>
      </div>
    );
  }

  const { output } = toolInfo;
  const notifications = output.notifications as readonly NotificationItem[];

  return (
    <div data-theme={theme} style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{"\uD83D\uDD14"} Notifications</h2>
        {notifications.length > 0 && (
          <span style={styles.headerBadge}>{notifications.length} new</span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={styles.empty}>
          Nessuna notifica! Tutto tranquillo. {"\u2728"}
        </div>
      ) : (
        <div style={styles.list} data-llm="notification-list">
          {notifications.map((n: NotificationItem) => (
            <NotificationCard key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    maxWidth: 500,
    margin: "0 auto",
    padding: 20,
    color: "var(--text-primary)",
    backgroundColor: "var(--bg-primary)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    color: "var(--text-primary)",
  },
  headerBadge: {
    fontSize: 12,
    fontWeight: 600,
    backgroundColor: "#ef4444",
    color: "#fff",
    borderRadius: 12,
    padding: "3px 10px",
  },
  empty: {
    padding: 32,
    textAlign: "center" as const,
    color: "var(--empty-color)",
    fontSize: 14,
  },
  list: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  card: {
    display: "flex",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--bg-card)",
  },
  cardLeft: {
    flexShrink: 0,
    display: "flex",
    alignItems: "flex-start",
    paddingTop: 2,
  },
  icon: {
    fontSize: 20,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  time: {
    fontSize: 11,
    color: "var(--text-secondary)",
    flexShrink: 0,
  },
  cardBody: {
    fontSize: 13,
    color: "var(--text-secondary)",
    marginTop: 4,
    lineHeight: 1.4,
  },
  typeBadge: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: 600,
    color: "var(--text-secondary)",
    backgroundColor: "var(--badge-bg)",
    borderRadius: 4,
    padding: "2px 6px",
    display: "inline-block",
    textTransform: "uppercase" as const,
    letterSpacing: "0.03em",
  },
};

export default NotificationsWidget;

mountWidget(<NotificationsWidget />);
