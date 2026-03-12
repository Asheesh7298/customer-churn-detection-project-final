"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, TrendingUp, Layers, Brain } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", icon: BarChart3 },
    {
      href: "/customer-profile",
      label: "Customer Profile",
      icon: Users,
    },
    { href: "/result-charts", label: "Charts", icon: BarChart3 },
    { href: "/trend-analysis", label: "Trends", icon: TrendingUp },
    {
      href: "/customer-segmentation",
      label: "Segmentation",
      icon: Layers,
    },
    {
      href: "/explanation-panel",
      label: "Explanations",
      icon: Brain,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground hidden sm:inline">
            Churn Dashboard
          </span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
