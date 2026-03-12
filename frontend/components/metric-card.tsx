"use client";

import { Card } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  icon?: React.ReactNode;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
}: MetricCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>

          {trend && trendLabel && (
            <div className="mt-4 flex items-center gap-1">
              {trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : trend === "down" ? (
                <TrendingDown className="h-4 w-4 text-green-500" />
              ) : null}
              <p
                className={`text-xs font-medium ${
                  trend === "up"
                    ? "text-red-500"
                    : trend === "down"
                      ? "text-green-500"
                      : "text-muted-foreground"
                }`}
              >
                {trendLabel}
              </p>
            </div>
          )}
        </div>

        {icon && <div className="text-3xl">{icon}</div>}
      </div>
    </Card>
  );
}
