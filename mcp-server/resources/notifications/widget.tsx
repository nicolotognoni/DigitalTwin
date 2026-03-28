import {
  McpUseProvider,
  useWidget,
  type WidgetMetadata,
} from "mcp-use/react";
import React from "react";
import { z } from "zod";

const notificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  metadata: z.record(z.unknown()),
  is_read: z.boolean(),
  created_at: z.string(),
});

const propsSchema = z.object({
  notifications: z.array(notificationSchema),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Displays unread notifications for the user",
  props: propsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Checking notifications...",
    invoked: "Notifications",
  },
};

type Props = z.infer<typeof propsSchema>;
type NotificationItem = z.infer<typeof notificationSchema>;

const TYPE_ICONS: Record<string, string> = {
  connection_request: "🤝",
  calendar_request: "📅",
  plan_shared: "📋",
  agent_interaction: "🤖",
};

const TYPE_LABELS: Record<string, string> = {
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

export default function NotificationsWidget() {
  const { props, isPending } = useWidget<Props>();

  const darkModeCSS = `
    :root {
      --text-primary: #111;
      --text-secondary: #666;
      --bg-primary: #fff;
      --bg-card: #fff;
      --border-color: #e0e0e0;
      --badge-bg: #f0f0f0;
      --empty-color: #999;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --text-primary: #eee;
        --text-secondary: #aaa;
        --bg-primary: #1e1e1e;
        --bg-card: #2a2a2a;
        --border-color: #444;
        --badge-bg: #333;
        --empty-color: #777;
      }
    }
  `;

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <style>{darkModeCSS}</style>
        <div style={styles.container}>
          <div style={styles.empty}>Loading notifications...</div>
        </div>
      </McpUseProvider>
    );
  }

  const { notifications } = props;

  return (
    <McpUseProvider autoSize>
      <style>{darkModeCSS}</style>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>🔔 Notifications</h2>
          {notifications.length > 0 && (
            <span style={styles.badge}>{notifications.length} new</span>
          )}
        </div>

        {notifications.length === 0 ? (
          <div style={styles.empty}>
            Nessuna notifica! Tutto tranquillo. ✨
          </div>
        ) : (
          <div style={styles.list}>
            {notifications.map((n) => (
              <NotificationCard key={n.id} notification={n} />
            ))}
          </div>
        )}
      </div>
    </McpUseProvider>
  );
}

function NotificationCard({ notification }: { notification: NotificationItem }) {
  const icon = TYPE_ICONS[notification.type] ?? "📬";
  const label = TYPE_LABELS[notification.type] ?? notification.type;

  return (
    <div style={styles.card}>
      <div style={styles.cardLeft}>
        <span style={styles.icon}>{icon}</span>
      </div>
      <div style={styles.cardContent}>
        <div style={styles.cardTop}>
          <span style={styles.cardTitle}>{notification.title}</span>
          <span style={styles.time}>{timeAgo(notification.created_at)}</span>
        </div>
        {notification.body && (
          <div style={styles.cardBody}>{notification.body}</div>
        )}
        <div style={styles.typeBadge}>{label}</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    maxWidth: 500,
    margin: "0 auto",
    padding: 20,
    color: "var(--text-primary, #111)",
    backgroundColor: "var(--bg-primary, #fff)",
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
    color: "var(--text-primary, #111)",
  },
  badge: {
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
    color: "var(--empty-color, #999)",
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
    border: "1px solid var(--border-color, #e0e0e0)",
    backgroundColor: "var(--bg-card, #fff)",
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
    color: "var(--text-primary, #111)",
  },
  time: {
    fontSize: 11,
    color: "var(--text-secondary, #999)",
    flexShrink: 0,
  },
  cardBody: {
    fontSize: 13,
    color: "var(--text-secondary, #666)",
    marginTop: 4,
    lineHeight: 1.4,
  },
  typeBadge: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: 600,
    color: "var(--text-secondary, #888)",
    backgroundColor: "var(--badge-bg, #f0f0f0)",
    borderRadius: 4,
    padding: "2px 6px",
    display: "inline-block",
    textTransform: "uppercase" as const,
    letterSpacing: "0.03em",
  },
};
