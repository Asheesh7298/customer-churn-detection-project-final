"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Stat } from "@/components/stat";
import { SliderField } from "@/components/slider-field";
import { Section } from "@/components/section";
import { apiClient } from "@/lib/api-client";
import { BusinessValueResponse } from "@/lib/types";
import { formatMoney, formatPercent } from "@/lib/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Vivid analytics tones.
const C = { risk: "#f43f5e", saved: "#10b981", cost: "#f59e0b" };

export default function BusinessImpactPage() {
  const [threshold, setThreshold] = useState(0.5);
  const [lifetime, setLifetime] = useState(24);
  const [offerCost, setOfferCost] = useState(50);
  const [successRate, setSuccessRate] = useState(0.3);
  const [data, setData] = useState<BusinessValueResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setData(
        await apiClient.getBusinessValue({
          threshold,
          expected_lifetime_months: lifetime,
          retention_offer_cost: offerCost,
          retention_success_rate: successRate,
        })
      );
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [threshold, lifetime, offerCost, successRate]);

  useEffect(() => {
    const t = setTimeout(fetchData, 200);
    return () => clearTimeout(t);
  }, [fetchData]);

  const chart = data
    ? [
        { name: "Revenue at risk", value: data.revenue_at_risk, fill: C.risk },
        { name: "Expected saved", value: data.expected_revenue_saved, fill: C.saved },
        { name: "Campaign cost", value: data.intervention_cost, fill: C.cost },
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <PageHeader title="Business Impact">
        Translate churn probabilities into money. Tune the decision threshold and
        campaign economics to see the return of a targeted retention program —
        computed against real customers.
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit space-y-6 p-6">
          <SliderField
            label="Decision threshold"
            hint="Flag customers above this churn probability"
            value={threshold}
            min={0.05}
            max={0.9}
            step={0.05}
            format={(v) => formatPercent(v, 0)}
            onChange={setThreshold}
          />
          <SliderField
            label="Expected lifetime"
            hint="Months of revenue a retained customer represents"
            value={lifetime}
            min={6}
            max={60}
            step={6}
            format={(v) => `${v} mo`}
            onChange={setLifetime}
          />
          <SliderField
            label="Retention offer cost"
            hint="Cost per targeted customer"
            value={offerCost}
            min={10}
            max={200}
            step={10}
            format={(v) => formatMoney(v)}
            onChange={setOfferCost}
          />
          <SliderField
            label="Campaign success rate"
            hint="Share of at-risk customers actually saved"
            value={successRate}
            min={0.05}
            max={0.6}
            step={0.05}
            format={(v) => formatPercent(v, 0)}
            onChange={setSuccessRate}
          />
        </Card>

        <div className="space-y-6">
          <div className="grid grid-cols-2 divide-x divide-y divide-border rounded-md border border-border bg-card sm:grid-cols-4 sm:divide-y-0 [&>*]:p-5">
            <Stat
              label="Flagged"
              value={
                data ? `${data.customers_flagged}/${data.customers_evaluated}` : "—"
              }
            />
            <Stat
              label="Net benefit"
              value={data ? formatMoney(data.net_benefit) : "—"}
              tone={(data?.net_benefit ?? 0) >= 0 ? "positive" : "negative"}
            />
            <Stat
              label="ROI"
              value={data ? `${data.roi.toFixed(1)}×` : "—"}
              tone={(data?.roi ?? 0) >= 0 ? "positive" : "negative"}
            />
            <Stat
              label="Precision"
              value={formatPercent(data?.precision_at_threshold, 0)}
              hint={
                data?.recall_at_threshold != null
                  ? `recall ${formatPercent(data.recall_at_threshold, 0)}`
                  : undefined
              }
            />
          </div>

          <Section
            title="Revenue breakdown"
            description="At the current threshold and campaign settings."
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} layout="vertical" margin={{ left: 20 }}>
                  <XAxis
                    type="number"
                    tickFormatter={(v) => formatMoney(v)}
                    fontSize={12}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(v: number) => formatMoney(v)}
                    cursor={{ fill: "rgba(120,120,120,0.06)" }}
                  />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                    {chart.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {data && data.net_benefit >= 0 ? (
                <>
                  Targeting the {data.customers_flagged} highest-risk customers is
                  projected to save{" "}
                  <strong className="text-foreground">
                    {formatMoney(data.expected_revenue_saved)}
                  </strong>{" "}
                  for a campaign cost of {formatMoney(data.intervention_cost)} — a
                  net{" "}
                  <strong className="text-foreground">
                    {formatMoney(data.net_benefit)}
                  </strong>
                  .
                </>
              ) : (
                "At these settings the campaign costs more than it saves — raise the threshold or lower the offer cost."
              )}
              {loading && " (updating…)"}
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
