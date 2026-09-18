"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Stat } from "@/components/stat";
import { RiskBadge } from "@/components/risk-badge";
import { RiskLevel } from "@/lib/risk";
import { formatPercent } from "@/lib/format";
import { apiClient } from "@/lib/api-client";
import { Upload, Download, Database, Loader2 } from "lucide-react";

const TELCO_COLUMNS = [
  "gender",
  "SeniorCitizen",
  "Partner",
  "Dependents",
  "tenure",
  "PhoneService",
  "MultipleLines",
  "InternetService",
  "OnlineSecurity",
  "OnlineBackup",
  "DeviceProtection",
  "TechSupport",
  "StreamingTV",
  "StreamingMovies",
  "Contract",
  "PaperlessBilling",
  "PaymentMethod",
  "MonthlyCharges",
  "TotalCharges",
];

interface ScoredRow {
  id: string;
  churn_probability: number;
  risk_level: string;
  actual_churn?: number;
}

// Minimal CSV parser (Telco values contain no embedded commas).
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row;
  });
}

function coerce(rows: Record<string, string>[]): Record<string, unknown>[] {
  return rows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const c of TELCO_COLUMNS) {
      if (r[c] === undefined) continue;
      if (["tenure", "SeniorCitizen"].includes(c)) out[c] = parseInt(r[c]) || 0;
      else if (["MonthlyCharges", "TotalCharges"].includes(c))
        out[c] = parseFloat(r[c]) || 0;
      else out[c] = r[c];
    }
    return out;
  });
}

export default function BatchScoringPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [scored, setScored] = useState<ScoredRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("");

  const score = async (
    input: Record<string, unknown>[],
    label: string
  ) => {
    setLoading(true);
    setSource(label);
    try {
      const results = await apiClient.scoreBatch(input);
      setScored(
        results.map((res) => ({
          id:
            (input[res.index]?.customerID as string) ||
            `Row ${res.index + 1}`,
          churn_probability: res.churn_probability,
          risk_level: res.risk_level,
          actual_churn: input[res.index]?.actual_churn as number | undefined,
        }))
      );
      setRows(input);
    } catch {
      setScored([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSample = async () => {
    const sample = await apiClient.getSampleBatch(25);
    await score(sample, "25 sample customers");
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = coerce(parseCsv(String(reader.result)));
      if (parsed.length) score(parsed, file.name);
    };
    reader.readAsText(file);
  };

  const downloadResults = () => {
    const header = "customer,churn_probability,risk_level,actual_churn";
    const body = scored
      .map(
        (s) =>
          `${s.id},${s.churn_probability.toFixed(4)},${s.risk_level},${
            s.actual_churn ?? ""
          }`
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "churn_scores.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const example =
      "Female,0,Yes,No,12,Yes,No,Fiber optic,No,Yes,No,No,Yes,Yes,Month-to-month,Yes,Electronic check,85.5,1026";
    const blob = new Blob([`${TELCO_COLUMNS.join(",")}\n${example}`], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "telco_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary = scored.length
    ? {
        total: scored.length,
        high: scored.filter((s) => s.risk_level === "high").length,
        avg:
          scored.reduce((s, r) => s + r.churn_probability, 0) / scored.length,
      }
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      <PageHeader title="Batch Scoring">
        Score many customers at once. Load a real sample from the dataset, or
        upload your own CSV of Telco-format customers, then export the scores.
      </PageHeader>

      <div className="flex flex-wrap gap-3">
        <Button onClick={loadSample} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          Load sample batch
        </Button>
        <Button variant="outline" asChild>
          <label className="cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Upload CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={onFile}
            />
          </label>
        </Button>
        <Button variant="ghost" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          CSV template
        </Button>
        {scored.length > 0 && (
          <Button variant="ghost" onClick={downloadResults}>
            <Download className="h-4 w-4 mr-2" />
            Export scores
          </Button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-3 divide-x divide-border rounded-md border border-border bg-card [&>*]:p-5">
          <Stat label="Scored" value={String(summary.total)} hint={source} />
          <Stat
            label="High risk"
            value={String(summary.high)}
            tone="negative"
            hint={`${((summary.high / summary.total) * 100).toFixed(0)}% of batch`}
          />
          <Stat
            label="Avg. churn probability"
            value={formatPercent(summary.avg)}
          />
        </div>
      )}

      {scored.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto max-h-[520px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium text-right">Churn prob.</th>
                  <th className="px-4 py-3 font-medium text-center">Risk</th>
                  <th className="px-4 py-3 font-medium text-center">Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scored
                  .slice()
                  .sort((a, b) => b.churn_probability - a.churn_probability)
                  .map((s) => (
                    <tr key={s.id} className="hover:bg-muted/40">
                      <td className="px-4 py-2.5 font-medium">{s.id}</td>
                      <td className="px-4 py-2.5 text-right tnum">
                        {formatPercent(s.churn_probability)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <RiskBadge level={s.risk_level as RiskLevel} />
                      </td>
                      <td className="px-4 py-2.5 text-center text-muted-foreground">
                        {s.actual_churn === undefined
                          ? "—"
                          : s.actual_churn
                            ? "Churned"
                            : "Stayed"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {scored.length === 0 && !loading && (
        <Card className="p-12 text-center text-muted-foreground">
          <Database className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Load a sample batch or upload a CSV to score customers.</p>
        </Card>
      )}
    </div>
  );
}

