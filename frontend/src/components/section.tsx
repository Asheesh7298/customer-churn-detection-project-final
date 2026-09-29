import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** A titled panel: serif heading, optional description, then content. */
export function Section({
  title,
  description,
  children,
  className,
  contentClassName,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="mb-4 space-y-1">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className={contentClassName}>{children}</div>
    </Card>
  );
}
