"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Stat, StatRow } from "@/components/stat";
import { RiskBadge } from "@/components/risk-badge";
import { useModelMetrics, useTopRiskCustomers } from "@/lib/hooks";
import { formatPercent } from "@/lib/format";
import { RiskLevel } from "@/lib/risk";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function HomePage() {
  const { data: metrics } = useModelMetrics(true);
  const { customers: topRisk, loading: riskLoading } =
    useTopRiskCustomers(30000);
  const [avgChurnScore, setAvgChurnScore] = useState(0);

  useEffect(() => {
    if (topRisk.length > 0) {
      setAvgChurnScore(
        topRisk.reduce((sum, c) => sum + c.churn_probability, 0) /
          topRisk.length
      );
    }
  }, [topRisk]);

  const highRiskCount = topRisk.filter((c) => c.risk_level === "high").length;

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-4 md:p-8">
      <PageHeader
        title="Retention Intelligence"
        aside={
          <Link href="/customer-profile">
            <Button>Score a customer</Button>
          </Link>
        }
      >
        Predict which telecom customers are about to leave, understand why, and
        weigh what it is worth to keep them — on a model trained over 7,043 real
        accounts.
      </PageHeader>

      <StatRow>
        <Stat
          label="Model AUC"
          value={formatPercent(metrics?.roc_auc)}
          hint={metrics ? `v${metrics.model_version}` : " "}
          emphasis
        />
        <Stat
          label="Avg. risk, top 20"
          value={formatPercent(avgChurnScore)}
          hint="highest-probability accounts"
          emphasis
        />
        <Stat
          label="High-risk"
          value={String(highRiskCount)}
          hint={`of ${topRisk.length} reviewed`}
          tone="negative"
          emphasis
        />
        <Stat
          label="Recall"
          value={formatPercent(metrics?.recall)}
          hint={metrics ? `precision ${formatPercent(metrics.precision)}` : " "}
          emphasis
        />
      </StatRow>

      {/* Watchlist */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Retention watchlist
          </h2>
          <p className="text-sm text-muted-foreground">
            Refreshes every 30s
          </p>
        </div>

        {riskLoading && topRisk.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            Loading accounts…
          </Card>
        ) : topRisk.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            No customer data available. Start the API to populate the watchlist.
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Account</th>
                    <th className="px-6 py-3 font-medium text-right">
                      Churn probability
                    </th>
                    <th className="px-6 py-3 font-medium text-right">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topRisk.slice(0, 10).map((customer) => (
                    <tr
                      key={customer.customer_id}
                      className="transition-colors hover:bg-muted/40"
                    >
                      <td className="px-6 py-3.5 font-medium">
                        {customer.customer_id}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-3">
                          <div className="hidden h-1 w-24 overflow-hidden rounded-full bg-muted sm:block">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${customer.churn_probability * 100}%`,
                              }}
                            />
                          </div>
                          <span className="tnum font-medium">
                            {formatPercent(customer.churn_probability)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <RiskBadge
                          level={customer.risk_level as RiskLevel}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      {/* Directory */}
      <section className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3">
        {[
          {
            href: "/retention-simulator",
            title: "Retention simulator",
            body: "Test which action lowers a customer's churn the most.",
          },
          {
            href: "/business-impact",
            title: "Business impact",
            body: "Turn a targeting threshold into revenue saved and ROI.",
          },
          {
            href: "/model-performance",
            title: "Model report",
            body: "Held-out metrics, curves, and model comparison.",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group bg-card p-6 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-display text-base font-semibold">
                {item.title}
              </h3>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
