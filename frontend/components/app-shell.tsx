"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Target,
  FileSpreadsheet,
  Sparkles,
  DollarSign,
  Gauge,
  TrendingUp,
  Layers,
  BookOpen,
  Moon,
  Sun,
  Menu,
  X,
  Activity,
} from "lucide-react";
import { apiClient, isLiveApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ElementType };
type NavGroup = { label?: string; items: NavItem[] };

const NAV: NavGroup[] = [
  { items: [{ href: "/", label: "Overview", icon: LayoutDashboard }] },
  {
    label: "Predict",
    items: [
      { href: "/customer-profile", label: "Predict", icon: Target },
      { href: "/batch-scoring", label: "Batch score", icon: FileSpreadsheet },
      { href: "/retention-simulator", label: "What-if", icon: Sparkles },
    ],
  },
  {
    label: "Analyze",
    items: [
      { href: "/business-impact", label: "Business impact", icon: DollarSign },
      { href: "/model-performance", label: "Model report", icon: Gauge },
      { href: "/trend-analysis", label: "Cohorts", icon: TrendingUp },
      { href: "/customer-segmentation", label: "Segments", icon: Layers },
    ],
  },
  {
    label: "Learn",
    items: [{ href: "/explanation-panel", label: "How it works", icon: BookOpen }],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer on navigation.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar — fixed on desktop, slide-in drawer on mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 flex flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Brand onClose={() => setOpen(false)} />
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {NAV.map((group, i) => (
            <div key={i} className="space-y-1">
              {group.label && (
                <p className="px-3 pb-1 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} active={pathname === item.href} />
              ))}
            </div>
          ))}
        </nav>
        <SidebarFooter />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Content column */}
      <div className="lg:pl-60">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-display text-sm">Churn Analytics</span>
          </div>
        </header>

        <main className="min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
      <Activity className="h-4 w-4" />
    </div>
  );
}

function Brand({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
      <Link href="/" className="flex items-center gap-2">
        <Logo />
        <span className="font-display text-[0.95rem] tracking-tight">
          Churn Analytics
        </span>
      </Link>
      <button
        aria-label="Close menu"
        onClick={onClose}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
      {item.label}
    </Link>
  );
}

function SidebarFooter() {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-sidebar-border px-4 py-3">
      <ApiBadge />
      <ThemeToggle />
    </div>
  );
}

function ApiBadge() {
  const [live, setLive] = useState<boolean | null>(null);
  useEffect(() => {
    apiClient.healthCheck().then(() => setLive(isLiveApi()));
  }, []);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        live === null
          ? "bg-muted text-muted-foreground"
          : live
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
            : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
      )}
      title={
        live
          ? "Connected to the live ML API"
          : "Live API unavailable — showing demo data"
      }
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          live === null ? "bg-muted-foreground" : live ? "bg-emerald-500" : "bg-amber-500",
          live && "animate-pulse"
        )}
      />
      {live === null ? "Checking…" : live ? "Live API" : "Demo data"}
    </span>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-8 w-8" />;
  const isDark = theme === "dark";
  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
