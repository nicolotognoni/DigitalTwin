"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

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
  const { data, isLoading, mutate } = useSWR<{ data: ConnectionData[] }>(
    "/api/connections",
    fetcher
  );
  const { data: meData } = useSWR<{ user: { id: string } }>(
    "/api/auth/me",
    fetcher
  );
  const connections: readonly ConnectionData[] = data?.data ?? [];
  const currentUserId = meData?.user?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<readonly UserResult[]>([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim().length < 2) return;

    setSearching(true);
    const res = await fetch(
      `/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`
    );
    const { data: results } = await res.json();
    setSearchResults(results ?? []);
    setSearching(false);
  }

  async function handleConnect(userId: string) {
    await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiver_id: userId }),
    });
    setSearchResults(searchResults.filter((u) => u.id !== userId));
    mutate();
  }

  const acceptedConnections = connections.filter(
    (c) => c.status === "accepted"
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Pages / Network</p>
        <h1 className="text-3xl font-bold">Network</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search users and manage your connections
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="flex h-10 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={searching || searchQuery.trim().length < 2}
          className="inline-flex h-10 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background shadow hover:bg-foreground/90 disabled:opacity-50 transition-colors"
        >
          {searching ? "..." : "Search"}
        </button>
      </form>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Search results</h2>
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
                className="inline-flex h-8 items-center rounded-lg bg-foreground px-3 text-xs font-medium text-background shadow hover:bg-foreground/90 transition-colors"
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Connected users */}
      <div className="space-y-3">
        <h2 className="font-semibold">
          Connections ({acceptedConnections.length})
        </h2>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : acceptedConnections.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              No connections yet. Search for users to get started.
            </p>
          </div>
        ) : (
          acceptedConnections.map((conn) => {
            const otherUser =
              conn.requester_id === currentUserId
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
                  Connected
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
