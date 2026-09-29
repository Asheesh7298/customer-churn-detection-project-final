/** Shared value formatters, so every page renders numbers the same way. */

export const formatMoney = (n: number, fractionDigits = 0): string =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: fractionDigits,
  });

export const formatPercent = (n: number | null | undefined, digits = 1): string =>
  n === null || n === undefined ? "—" : `${(n * 100).toFixed(digits)}%`;

export const formatNumber = (n: number): string => n.toLocaleString("en-US");

export const titleCase = (s: string): string =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
