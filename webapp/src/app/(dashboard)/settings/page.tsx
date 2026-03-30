"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface Integration {
  readonly id: string;
  readonly provider: string;
  readonly created_at: string;
}

interface Profile {
  readonly display_name: string;
  readonly bio: string | null;
  readonly avatar_url: string | null;
}

export default function SettingsPage() {
  const { data: intData, isLoading: intLoading, mutate: mutateInt } = useSWR<{ data: Integration[] }>(
    "/api/integrations/google",
    fetcher
  );
  const { data: profileData, isLoading: profileLoading, mutate: mutateProfile } = useSWR<{ data: Profile }>(
    "/api/profile",
    fetcher
  );

  const integrations: readonly Integration[] = intData?.data ?? [];
  const profile = profileData?.data;

  const connectGoogleCalendar = async () => {
    const res = await fetch("/api/integrations/google", { method: "POST" });
    const json = await res.json();
    if (json.url) {
      window.location.href = json.url;
    }
  };

  const disconnectGoogleCalendar = async () => {
    await fetch("/api/integrations/google", { method: "DELETE" });
    mutateInt();
  };

  const hasGoogleCalendar = integrations.some(
    (i) => i.provider === "google_calendar"
  );

  const isLoading = intLoading || profileLoading;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Pages / Settings</p>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile and integrations
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          {/* Profile section */}
          <ProfileForm
            currentName={profile?.display_name ?? ""}
            onSaved={() => mutateProfile()}
          />

          {/* Google Calendar */}
          <div className="rounded-lg border p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <h3 className="font-semibold">Google Calendar</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your calendar to let your friends check your availability
                  and propose meetings.
                </p>
              </div>
            </div>

            {hasGoogleCalendar ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    Connected
                  </span>
                </div>
                <button
                  onClick={disconnectGoogleCalendar}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectGoogleCalendar}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors"
              >
                Connect Google Calendar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ProfileForm({
  currentName,
  onSaved,
}: {
  currentName: string;
  onSaved: () => void;
}) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasChanges = name.trim() !== currentName;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !hasChanges) return;

    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: name.trim() }),
    });

    if (res.ok) {
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-5 space-y-4">
      <div>
        <h3 className="font-semibold">Profile</h3>
        <p className="text-sm text-muted-foreground">
          Your display name is visible to other users and their agents.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="display_name" className="text-sm font-medium">
          Display Name
        </label>
        <input
          id="display_name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="flex h-10 w-full max-w-sm rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !hasChanges || !name.trim()}
          className="inline-flex h-9 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background shadow hover:bg-foreground/90 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">Saved!</span>
        )}
      </div>
    </form>
  );
}
