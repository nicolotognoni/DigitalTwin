"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly body: string | null;
  readonly metadata: Record<string, unknown>;
  readonly is_read: boolean;
  readonly created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  connection_request: "🤝",
  calendar_request: "📅",
  plan_shared: "📋",
  agent_interaction: "🤖",
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "ora";
  if (minutes < 60) return `${minutes} min fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} or${hours === 1 ? "a" : "e"} fa`;
  const days = Math.floor(hours / 24);
  return `${days} giorn${days === 1 ? "o" : "i"} fa`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<readonly Notification[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications");
    const json = await res.json();
    setNotifications(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_id: notificationId }),
    });
    fetchNotifications();
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all_read: true }),
    });
    fetchNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Notifiche</h1>
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifiche</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} non lett${unreadCount === 1 ? "a" : "e"}`
              : "Tutto letto"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Segna tutte come lette
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
          <h3 className="font-medium">Nessuna notifica</h3>
          <p className="text-sm text-muted-foreground">
            Le notifiche appariranno quando qualcuno interagisce con il tuo Twin
            o ti invia una richiesta di connessione.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg border p-4 flex items-start gap-3 transition-colors ${
                n.is_read ? "opacity-60" : "bg-accent/30"
              }`}
            >
              <span className="text-xl mt-0.5">
                {TYPE_ICONS[n.type] ?? "📬"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                {n.body && (
                  <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                )}
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markAsRead(n.id)}
                  className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                >
                  Letta
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
