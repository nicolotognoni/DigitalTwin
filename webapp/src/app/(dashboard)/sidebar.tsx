"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Database,
  ClipboardList,
  Bell,
  Users,
  Inbox,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly sub?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/dashboard",
    label: "Main Dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  { href: "/twin", label: "My Twin", icon: <Bot size={18} /> },
  { href: "/twin/memories", label: "Memories", icon: <Database size={16} />, sub: true },
  { href: "/plans", label: "Plans", icon: <ClipboardList size={18} /> },
  { href: "/notifications", label: "Notifications", icon: <Bell size={18} /> },
  { href: "/network", label: "Network", icon: <Users size={18} /> },
  { href: "/network/requests", label: "Requests", icon: <Inbox size={16} />, sub: true },
  { href: "/settings", label: "Settings", icon: <Settings size={18} /> },
];

interface SidebarProps {
  readonly displayName: string;
  readonly unreadCount: number;
}

export function Sidebar({ displayName, unreadCount }: SidebarProps) {
  const pathname = usePathname();

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="flex w-64 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
          <Zap size={18} />
        </div>
        <span className="text-lg font-bold tracking-tight">DigitalTwin</span>
        <span className="ml-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Beta
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-foreground hover:text-background"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.href === "/notifications" && unreadCount > 0 && (
                <span
                  className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
                    isActive
                      ? "bg-background text-foreground"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t px-3 py-4">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
            {initials}
          </div>
          <span className="min-w-0 truncate text-sm font-medium">
            {displayName}
          </span>
          <form action="/auth/signout" method="post" className="ml-auto">
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
