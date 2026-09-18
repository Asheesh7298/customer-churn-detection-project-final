"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  BarChart3,
  Users,
  TrendingUp,
  Layers,
  Brain,
  Gauge,
  DollarSign,
  Sparkles,
  Moon,
  Sun,
  FileSpreadsheet,
} from "lucide-react";
import { apiClient, isLiveApi } from "@/lib/api-client";

const links = [
  { href: "/", label: "Home", icon: BarChart3 },
  { href: "/customer-profile", label: "Predict", icon: Users },
  { href: "/batch-scoring", label: "Batch", icon: FileSpreadsheet },
  { href: "/retention-simulator", label: "What-If", icon: Sparkles },
  { href: "/business-impact", label: "ROI", icon: DollarSign },
  { href: "/model-performance", label: "Model", icon: Gauge },
  { href: "/trend-analysis", label: "Cohorts", icon: TrendingUp },
  { href: "/customer-segmentation", label: "Segments", icon: Layers },
  { href: "/explanation-panel", label: "Guide", icon: Brain },
];

function ApiBadge() {
  const [live, setLive] = useState<boolean | null>(null);
  useEffect(() => {
    apiClient.healthCheck().then(() => setLive(isLiveApi()));
  }, []);
  if (live === null) return null;
  return (
    <span
      className={`hidden md:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        live
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
          : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
      }`}
      title={
        live
          ? "Connected to the live ML API"
          : "Live API unavailable — showing demo data"
      }
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          live ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {live ? "Live API" : "Demo data"}
    </span>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" />;
  const isDark = theme === "dark";
  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <nav className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="flex items-baseline gap-2 shrink-0">
          <span className="font-display text-lg font-semibold tracking-tight">
            Churn&nbsp;Analytics
          </span>
        </Link>

        <div className="flex items-center gap-4 overflow-x-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 py-1 text-sm transition-colors ${
                  isActive
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ApiBadge />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
