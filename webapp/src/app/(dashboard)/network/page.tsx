"use client";

import { useState, useEffect, useCallback } from "react";

interface UserResult {
  readonly id: string;
  readonly display_name: string;
  readonly avatar_url: string | null;
  readonly bio: string | null;
}

interface ConnectionData {
  readonly id: string;
  readonly requester_id: string;
  readonly receiver_id: string;
  readonly status: string;
  readonly requester: UserResult;
  readonly receiver: UserResult;
}

export default function NetworkPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<readonly UserResult[]>([]);
  const [connections, setConnections] = useState<readonly ConnectionData[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    const res = await fetch("/api/connections");
    const { data } = await res.json();
    setConnections(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim().length < 2) return;

    setSearching(true);
    const res = await fetch(
      `/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`
    );
    const { data } = await res.json();
    setSearchResults(data ?? []);
    setSearching(false);
  }

  async function handleConnect(userId: string) {
    await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiver_id: userId }),
    });
    setSearchResults(searchResults.filter((u) => u.id !== userId));
    fetchConnections();
  }

  const acceptedConnections = connections.filter(
    (c) => c.status === "accepted"
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Network</h1>
        <p className="text-muted-foreground">
          Cerca utenti e gestisci le tue connessioni
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cerca per nome o email..."
          className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={searching || searchQuery.trim().length < 2}
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
        >
          {searching ? "..." : "Cerca"}
        </button>
      </form>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Risultati ricerca</h2>
          {searchResults.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                  {user.display_name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{user.display_name}</p>
                  {user.bio && (
                    <p className="text-xs text-muted-foreground">{user.bio}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleConnect(user.id)}
                className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90"
              >
                Connetti
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Connected users */}
      <div className="space-y-3">
        <h2 className="font-semibold">
          Connessioni ({acceptedConnections.length})
        </h2>
        {loading ? (
          <p className="text-muted-foreground">Caricamento...</p>
        ) : acceptedConnections.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              Nessuna connessione ancora. Cerca utenti per iniziare.
            </p>
          </div>
        ) : (
          acceptedConnections.map((conn) => {
            const otherUser =
              conn.requester.id === conn.requester_id
                ? conn.receiver
                : conn.requester;
            return (
              <div
                key={conn.id}
                className="flex items-center gap-3 rounded-lg border p-4"
              >
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                  {otherUser.display_name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{otherUser.display_name}</p>
                  {otherUser.bio && (
                    <p className="text-xs text-muted-foreground">
                      {otherUser.bio}
                    </p>
                  )}
                </div>
                <span className="ml-auto text-xs text-green-600 font-medium">
                  Connesso
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
