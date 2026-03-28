import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { count: unreadCount }] = await Promise.all([
    supabase
      .from("users")
      .select("display_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
  ]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card p-4 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Digital Twin</h2>
          <p className="text-xs text-muted-foreground">
            {profile?.display_name ?? user.email}
          </p>
        </div>

        <nav className="space-y-1">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/twin">Il mio Twin</NavLink>
          <NavLink href="/twin/memories">Memorie</NavLink>
          <NavLink href="/plans">Piani</NavLink>
          <NavLink href="/notifications" badge={unreadCount ?? 0}>
            Notifiche
          </NavLink>
          <NavLink href="/network">Network</NavLink>
          <NavLink href="/network/requests">Richieste</NavLink>
          <NavLink href="/settings">Impostazioni</NavLink>
        </nav>

        <div className="pt-4 border-t">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Esci
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  children,
  badge,
}: {
  href: string;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <span>{children}</span>
      {badge != null && badge > 0 && (
        <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </Link>
  );
}
