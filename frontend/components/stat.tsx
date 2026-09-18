import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A single ledger-style figure: small label above, large serif numeral below.
 * `tone` colors the value for positive/negative outcomes.
 */
export function Stat({
  label,
  value,
  hint,
  tone = "default",
  emphasis = false,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "positive" | "negative" | "accent";
  emphasis?: boolean;
}) {
  const toneClass = {
    default: "text-foreground",
    positive: "text-emerald-700 dark:text-emerald-400",
    negative: "text-red-700 dark:text-red-400",
    accent: "text-primary",
  }[tone];

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "font-display tnum font-semibold leading-none",
          emphasis ? "text-3xl md:text-4xl" : "text-2xl md:text-[1.75rem]",
          toneClass
        )}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground pt-0.5">{hint}</p>}
    </div>
  );
}

/**
 * A row of stats laid out as ledger columns, divided by hairline rules
 * (justified because these are genuinely tabular figures).
 */
export function StatRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-border rounded-md border border-border bg-card sm:grid-cols-4 sm:divide-y-0 [&>*]:p-5">
      {children}
    </div>
  );
}
