"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Stat } from "@/components/stat";
import { Section } from "@/components/section";
import { apiClient } from "@/lib/api-client";
import { ModelMetrics, ModelComparisonRow } from "@/lib/types";
import { formatPercent, titleCase } from "@/lib/format";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const NAVY = "#6366f1"; // indigo — matches the app accent
const GREEN = "#10b981"; // emerald

export default function ModelPerformancePage() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [comparison, setComparison] = useState<ModelComparisonRow[]>([]);

  useEffect(() => {
    apiClient.getModelMetrics().then(setMetrics).catch(() => {});
    apiClient.getModelComparison().then(setComparison).catch(() => setComparison([]));
  }, []);

  const cm = metrics?.confusion_matrix;
  const roc = metrics?.curves?.roc.map((p) => ({ fpr: p.x, tpr: p.y })) ?? [];
  const pr = metrics?.curves?.pr.map((p) => ({ recall: p.x, precision: p.y })) ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <PageHeader title="Model Report">
        Honest metrics on a held-out test set
        {metrics?.n_test ? ` of ${metrics.n_test} customers` : ""}. The selected
        model is{" "}
        <strong className="text-foreground">
          {metrics?.model_type ? titleCase(metrics.model_type) : "…"}
        </strong>
        , chosen by ROC-AUC.
      </PageHeader>

      <div className="grid grid-cols-2 divide-x divide-y divide-border rounded-md border border-border bg-card md:grid-cols-5 md:divide-y-0 [&>*]:p-5">
        <Stat label="ROC-AUC" value={formatPercent(metrics?.roc_auc)} tone="accent" emphasis />
        <Stat label="Accuracy" value={formatPercent(metrics?.accuracy)} />
        <Stat label="Precision" value={formatPercent(metrics?.precision)} />
        <Stat label="Recall" value={formatPercent(metrics?.recall)} />
        <Stat label="F1 score" value={formatPercent(metrics?.f1_score)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Confusion matrix"
          description="Test-set predictions at the 0.5 threshold."
        >
          {cm ? (
            <div className="grid grid-cols-[auto_1fr_1fr] gap-2 text-sm">
              <div />
              <HeadCell>Predicted stay</HeadCell>
              <HeadCell>Predicted churn</HeadCell>
              <RowLabel>Actual stay</RowLabel>
              <CmCell n={cm[0][0]} kind="good" label="True negatives" />
              <CmCell n={cm[0][1]} kind="bad" label="False positives" />
              <RowLabel>Actual churn</RowLabel>
              <CmCell n={cm[1][0]} kind="bad" label="False negatives" />
              <CmCell n={cm[1][1]} kind="good" label="True positives" />
            </div>
          ) : (
            <Empty />
          )}
        </Section>

        <Section
          title="ROC curve"
          description={`AUC ${formatPercent(metrics?.roc_auc)} — the further above the diagonal, the better.`}
        >
          <Curve
            data={roc}
            xKey="fpr"
            yKey="tpr"
            color={NAVY}
            xLabel="FPR"
          />
        </Section>

        <Section
          title="Precision–Recall curve"
          description={`Informative under class imbalance (${formatPercent(metrics?.churn_rate)} churn).`}
        >
          <Curve
            data={pr}
            xKey="recall"
            yKey="precision"
            color={GREEN}
            xLabel="Recall"
          />
        </Section>

        <Section
          title="Model comparison"
          description="Three classifiers evaluated on the same split."
        >
          {comparison.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Model</th>
                    <th className="py-2 px-2 text-right font-medium">AUC</th>
                    <th className="py-2 px-2 text-right font-medium">F1</th>
                    <th className="py-2 pl-2 text-right font-medium">Recall</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison
                    .slice()
                    .sort((a, b) => b.roc_auc - a.roc_auc)
                    .map((m, i) => (
                      <tr key={m.model} className="border-b border-border last:border-0">
                        <td className="py-2.5 pr-4 font-medium">
                          {titleCase(m.model)}
                          {i === 0 && (
                            <span className="ml-2 rounded-sm bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                              selected
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right tnum">{formatPercent(m.roc_auc)}</td>
                        <td className="py-2.5 px-2 text-right tnum">{formatPercent(m.f1_score)}</td>
                        <td className="py-2.5 pl-2 text-right tnum">{formatPercent(m.recall)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty />
          )}
        </Section>
      </div>
    </div>
  );
}

function Curve({
  data,
  xKey,
  yKey,
  color,
  xLabel,
}: {
  data: any[];
  xKey: string;
  yKey: string;
  color: string;
  xLabel: string;
}) {
  return (
    <div className="h-56">
      {data.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
            <XAxis
              dataKey={xKey}
              type="number"
              domain={[0, 1]}
              tickFormatter={(v) => v.toFixed(1)}
              fontSize={11}
            />
            <YAxis domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} fontSize={11} />
            <Tooltip
              formatter={(v: number) => v.toFixed(3)}
              labelFormatter={(l) => `${xLabel} ${Number(l).toFixed(2)}`}
            />
            <Line type="monotone" dataKey={yKey} stroke={color} dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Empty />
      )}
    </div>
  );
}

function HeadCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-1 text-center text-xs font-medium text-muted-foreground">
      {children}
    </div>
  );
}
function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center pr-2 text-xs font-medium text-muted-foreground">
      {children}
    </div>
  );
}
function CmCell({ n, kind, label }: { n: number; kind: "good" | "bad"; label: string }) {
  return (
    <div
      className={`rounded-md p-4 text-center ${
        kind === "good"
          ? "bg-emerald-50 dark:bg-emerald-950/40"
          : "bg-red-50 dark:bg-red-950/40"
      }`}
    >
      <div className="font-display tnum text-2xl font-semibold">{n}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
function Empty() {
  return (
    <div className="flex h-full items-center justify-center py-10 text-sm text-muted-foreground">
      No data — start the backend to see live metrics.
    </div>
  );
}
