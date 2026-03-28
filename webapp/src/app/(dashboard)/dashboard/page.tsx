import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: agent }, { data: memories }, { data: connections }] =
    await Promise.all([
      supabase
        .from("agents")
        .select("display_name, memory_count, status, personality_summary")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("memories")
        .select("category", { count: "exact" })
        .eq("user_id", user.id)
        .eq("is_active", true),
      supabase
        .from("connections")
        .select("id", { count: "exact" })
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq("status", "accepted"),
    ]);

  const memoryCount = memories?.length ?? 0;
  const connectionCount = connections?.length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Panoramica del tuo Digital Twin
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Memorie"
          value={memoryCount}
          description="memorie attive"
        />
        <StatCard
          title="Connessioni"
          value={connectionCount}
          description="utenti connessi"
        />
        <StatCard
          title="Status"
          value={agent?.status ?? "—"}
          description={agent?.display_name ?? "Twin non configurato"}
        />
      </div>

      {/* Twin summary */}
      {agent?.personality_summary && (
        <div className="rounded-lg border p-6 space-y-2">
          <h2 className="font-semibold">Profilo Twin</h2>
          <p className="text-sm text-muted-foreground">
            {agent.personality_summary}
          </p>
        </div>
      )}

      {/* Empty state */}
      {memoryCount === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
          <h3 className="font-medium">Nessuna memoria ancora</h3>
          <p className="text-sm text-muted-foreground">
            Collega il MCP server a ChatGPT per iniziare a raccogliere memorie
            automaticamente, oppure aggiungile manualmente dalla pagina Memorie.
          </p>
        </div>
      )}

      {connectionCount === 0 && memoryCount > 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
          <h3 className="font-medium">Nessuna connessione</h3>
          <p className="text-sm text-muted-foreground">
            Vai nella sezione Network per cercare altri utenti e inviare
            richieste di connessione. Una volta connessi, i vostri Twin
            potranno comunicare.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-lg border p-4 space-y-1">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
