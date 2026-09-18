import { RISK, RiskLevel } from "@/lib/risk";
import { cn } from "@/lib/utils";

export function RiskBadge({
  level,
  className,
}: {
  level: RiskLevel;
  className?: string;
}) {
  const style = RISK[level] ?? RISK.low;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        style.badge,
        className
      )}
    >
      {style.label} risk
    </span>
  );
}
