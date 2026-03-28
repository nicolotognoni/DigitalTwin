import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function TwinPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: memoryCounts } = await supabase
    .from("memories")
    .select("category")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const categoryDistribution = (memoryCounts ?? []).reduce(
    (acc, m) => {
      acc[m.category] = (acc[m.category] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Il mio Twin</h1>
        <p className="text-muted-foreground">
          Come ti vedono gli altri agenti
        </p>
      </div>

      {/* Profile card */}
      <div className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
            {agent?.display_name?.charAt(0) ?? "?"}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{agent?.display_name}</h2>
            <p className="text-sm text-muted-foreground">
              {agent?.memory_count ?? 0} memorie · Status: {agent?.status ?? "—"}
            </p>
          </div>
        </div>

        {agent?.personality_summary && (
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Personalità</h3>
            <p className="text-sm text-muted-foreground">
              {agent.personality_summary}
            </p>
          </div>
        )}

        {agent?.skills_summary && (
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Competenze</h3>
            <p className="text-sm text-muted-foreground">
              {agent.skills_summary}
            </p>
          </div>
        )}
      </div>

      {/* Category distribution */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold">Distribuzione memorie per categoria</h2>
        {Object.keys(categoryDistribution).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nessuna memoria ancora. Collega il MCP server per iniziare.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(categoryDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <div
                  key={category}
                  className="rounded-md bg-muted px-3 py-2 text-sm"
                >
                  <span className="font-medium capitalize">{category}</span>
                  <span className="ml-2 text-muted-foreground">{count}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
