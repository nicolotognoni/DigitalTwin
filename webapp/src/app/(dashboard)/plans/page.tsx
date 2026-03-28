"use client";

import { useEffect, useState, useCallback } from "react";

interface Plan {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly status: string;
  readonly agent_ids: readonly string[];
  readonly created_at: string;
  readonly updated_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Bozza",
  active: "Attivo",
  completed: "Completato",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PlansPage() {
  const [plans, setPlans] = useState<readonly Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    const res = await fetch("/api/plans");
    const json = await res.json();
    setPlans(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Piani</h1>
        <p className="text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Piani</h1>
        <p className="text-muted-foreground">
          Piani collaborativi creati con i tuoi agenti
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
          <h3 className="font-medium">Nessun piano ancora</h3>
          <p className="text-sm text-muted-foreground">
            Crea un piano in ChatGPT con il team di agenti. I piani verranno
            salvati automaticamente e mostrati qui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-lg border p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {plan.description}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                    STATUS_COLORS[plan.status] ?? "bg-gray-100 text-gray-800"
                  }`}
                >
                  {STATUS_LABELS[plan.status] ?? plan.status}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{plan.agent_ids.length} agenti</span>
                <span>Creato il {formatDate(plan.created_at)}</span>
                {plan.updated_at !== plan.created_at && (
                  <span>Aggiornato il {formatDate(plan.updated_at)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
