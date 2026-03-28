"use client";

import { useState, useEffect, useCallback } from "react";

interface ConnectionRequest {
  readonly id: string;
  readonly requester_id: string;
  readonly receiver_id: string;
  readonly status: string;
  readonly created_at: string;
  readonly requester: {
    readonly id: string;
    readonly display_name: string;
    readonly bio: string | null;
  };
  readonly receiver: {
    readonly id: string;
    readonly display_name: string;
    readonly bio: string | null;
  };
}

export default function RequestsPage() {
  const [connections, setConnections] = useState<readonly ConnectionRequest[]>(
    []
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [connRes, userRes] = await Promise.all([
      fetch("/api/connections"),
      fetch("/api/auth/me"),
    ]);
    const { data: connData } = await connRes.json();
    const { user } = await userRes.json();
    setConnections(connData ?? []);
    setCurrentUserId(user?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAction(id: string, status: "accepted" | "rejected") {
    await fetch(`/api/connections/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchData();
  }

  async function handleCancel(id: string) {
    await fetch(`/api/connections/${id}`, { method: "DELETE" });
    fetchData();
  }

  const incoming = connections.filter(
    (c) => c.receiver_id === currentUserId && c.status === "pending"
  );
  const outgoing = connections.filter(
    (c) => c.requester_id === currentUserId && c.status === "pending"
  );

  if (loading) {
    return <p className="text-muted-foreground">Caricamento...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Richieste di connessione</h1>
        <p className="text-muted-foreground">
          Gestisci le richieste in entrata e in uscita
        </p>
      </div>

      {/* Incoming */}
      <div className="space-y-3">
        <h2 className="font-semibold">In entrata ({incoming.length})</h2>
        {incoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nessuna richiesta in sospeso.
          </p>
        ) : (
          incoming.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                  {req.requester.display_name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{req.requester.display_name}</p>
                  {req.requester.bio && (
                    <p className="text-xs text-muted-foreground">
                      {req.requester.bio}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(req.id, "accepted")}
                  className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Accetta
                </button>
                <button
                  onClick={() => handleAction(req.id, "rejected")}
                  className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted"
                >
                  Rifiuta
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Outgoing */}
      <div className="space-y-3">
        <h2 className="font-semibold">In uscita ({outgoing.length})</h2>
        {outgoing.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nessuna richiesta inviata.
          </p>
        ) : (
          outgoing.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                  {req.receiver.display_name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{req.receiver.display_name}</p>
                  <p className="text-xs text-muted-foreground">In attesa...</p>
                </div>
              </div>
              <button
                onClick={() => handleCancel(req.id)}
                className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium text-destructive hover:bg-destructive/10"
              >
                Annulla
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
