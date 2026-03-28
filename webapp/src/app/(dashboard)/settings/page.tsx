"use client";

import { useEffect, useState, useCallback } from "react";

interface Integration {
  readonly id: string;
  readonly provider: string;
  readonly created_at: string;
}

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState<readonly Integration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = useCallback(async () => {
    const res = await fetch("/api/integrations/google");
    const json = await res.json();
    setIntegrations(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const connectGoogleCalendar = async () => {
    const res = await fetch("/api/integrations/google", { method: "POST" });
    const json = await res.json();
    if (json.url) {
      window.location.href = json.url;
    }
  };

  const disconnectGoogleCalendar = async () => {
    await fetch("/api/integrations/google", { method: "DELETE" });
    fetchIntegrations();
  };

  const hasGoogleCalendar = integrations.some(
    (i) => i.provider === "google_calendar"
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Impostazioni</h1>
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Impostazioni</h1>
        <p className="text-muted-foreground">
          Gestisci le integrazioni del tuo Digital Twin
        </p>
      </div>

      <div className="rounded-lg border p-5 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <h3 className="font-semibold">Google Calendar</h3>
            <p className="text-sm text-muted-foreground">
              Collega il tuo calendario per permettere ai tuoi amici di
              verificare la tua disponibilità e proporre meeting.
            </p>
          </div>
        </div>

        {hasGoogleCalendar ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-600">
                Collegato
              </span>
            </div>
            <button
              onClick={disconnectGoogleCalendar}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              Scollega
            </button>
          </div>
        ) : (
          <button
            onClick={connectGoogleCalendar}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Collega Google Calendar
          </button>
        )}
      </div>
    </div>
  );
}
