"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Memory, MemoryCategory } from "@/types";

const CATEGORIES: readonly MemoryCategory[] = [
  "identity",
  "skill",
  "preference",
  "decision",
  "project",
  "relationship",
  "opinion",
  "communication",
  "goal",
] as const;

export default function MemoriesPage() {
  const [memories, setMemories] = useState<readonly Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MemoryCategory | "all">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<readonly Memory[] | null>(null);
  const [searching, setSearching] = useState(false);

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/memories");
    const { data } = await res.json();
    setMemories(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const filteredMemories =
    filter === "all"
      ? memories
      : memories.filter((m) => m.category === filter);

  async function handleToggle(id: string, currentActive: boolean) {
    await fetch(`/api/memories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !currentActive }),
    });
    setMemories(
      memories.map((m) =>
        m.id === id ? { ...m, is_active: !currentActive } : m
      )
    );
  }

  async function handleDelete(id: string) {
    await fetch(`/api/memories/${id}`, { method: "DELETE" });
    setMemories(memories.filter((m) => m.id !== id));
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    const res = await fetch("/api/memories/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: searchQuery.trim(), category: filter === "all" ? undefined : filter }),
    });
    const { results } = await res.json();
    setSearchResults(results ?? []);
    setSearching(false);
  }

  function clearSearch() {
    setSearchQuery("");
    setSearchResults(null);
  }

  const displayMemories = searchResults ?? filteredMemories;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Memorie</h1>
          <p className="text-muted-foreground">
            {searchResults
              ? `${searchResults.length} risultati per "${searchQuery}"`
              : `${memories.length} memorie totali`}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          {showAddForm ? "Chiudi" : "Aggiungi memoria"}
        </button>
      </div>

      {showAddForm && (
        <AddMemoryForm
          onAdded={() => {
            fetchMemories();
            setShowAddForm(false);
          }}
        />
      )}

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cerca nelle memorie (ricerca semantica)..."
          className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={searching || !searchQuery.trim()}
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
        >
          {searching ? "..." : "Cerca"}
        </button>
        {searchResults && (
          <button
            type="button"
            onClick={clearSearch}
            className="inline-flex h-10 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            Mostra tutte
          </button>
        )}
      </form>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterButton
          active={filter === "all"}
          onClick={() => setFilter("all")}
        >
          Tutte
        </FilterButton>
        {CATEGORIES.map((cat) => (
          <FilterButton
            key={cat}
            active={filter === cat}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </FilterButton>
        ))}
      </div>

      {/* Memory list */}
      {loading ? (
        <p className="text-muted-foreground">Caricamento...</p>
      ) : displayMemories.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {filter === "all"
              ? "Nessuna memoria. Aggiungi la prima o collega il MCP server."
              : `Nessuna memoria nella categoria "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayMemories.map((memory) => (
            <div
              key={memory.id}
              className={`rounded-lg border p-4 space-y-2 ${
                !memory.is_active ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                      {memory.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      via {memory.source}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      confidence: {Math.round(memory.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-sm">{memory.content}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(memory.id, memory.is_active)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {memory.is_active ? "Disattiva" : "Attiva"}
                  </button>
                  <button
                    onClick={() => handleDelete(memory.id)}
                    className="text-xs text-destructive hover:text-destructive/80"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {children}
    </button>
  );
}

function AddMemoryForm({ onAdded }: { onAdded: () => void }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<MemoryCategory>("skill");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    await fetch("/api/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim(), category }),
    });
    setSaving(false);
    setContent("");
    onAdded();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border p-4 space-y-3 bg-card"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Scrivi una memoria... (es. 'Preferisco TypeScript a JavaScript per progetti grandi')"
        rows={3}
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="flex items-center gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as MemoryCategory)}
          className="flex h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Salvataggio..." : "Salva"}
        </button>
      </div>
    </form>
  );
}
