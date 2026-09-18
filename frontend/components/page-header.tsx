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
    <header className="border-b border-border pb-5">
      <div className="flex items-end justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
            {title}
          </h1>
          {children && (
            <p className="max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">
              {children}
            </p>
          )}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </header>
  );
}
