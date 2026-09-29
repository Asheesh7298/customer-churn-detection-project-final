/** Single source of truth for risk-level presentation across the app. */

export type RiskLevel = "low" | "medium" | "high";

interface RiskStyle {
  label: string;
  /** Tailwind classes for a soft badge/surface. */
  badge: string;
  /** Solid fill for bars/markers. */
  bar: string;
  /** Text color. */
  text: string;
}

export const RISK: Record<RiskLevel, RiskStyle> = {
  low: {
    label: "Low",
    badge:
      "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-600/15",
    bar: "bg-emerald-600",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  medium: {
    label: "Medium",
    badge:
      "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-600/15",
    bar: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },
  high: {
    label: "High",
    badge:
      "bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 ring-1 ring-red-600/15",
    bar: "bg-red-600",
    text: "text-red-700 dark:text-red-400",
  },
};

export const riskFromProbability = (p: number): RiskLevel =>
  p >= 0.66 ? "high" : p >= 0.33 ? "medium" : "low";
