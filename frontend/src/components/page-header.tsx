import { ReactNode } from "react";

/** Classic masthead: a serif title over a subtitle, closed by a hairline rule. */
export function PageHeader({
  title,
  children,
  aside,
}: {
  title: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="font-display text-2xl tracking-tight">{title}</h1>
        {children && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {children}
          </p>
        )}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </header>
  );
}
