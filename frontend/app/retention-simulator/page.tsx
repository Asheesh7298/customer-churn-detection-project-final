"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { apiClient } from "@/lib/api-client";
import { WhatIfResponse } from "@/lib/types";
import { formatPercent } from "@/lib/format";
import { ArrowDown, TrendingDown } from "lucide-react";

// A compact editable customer in raw Telco fields.
const PRESETS: Record<string, any> = {
  "High-risk new customer": {
    tenure: 2,
    MonthlyCharges: 95,
    Contract: "Month-to-month",
    InternetService: "Fiber optic",
    OnlineSecurity: "No",
    TechSupport: "No",
    PaymentMethod: "Electronic check",
    PaperlessBilling: "Yes",
  },
  "Mid-tenure fiber customer": {
    tenure: 18,
    MonthlyCharges: 80,
    Contract: "Month-to-month",
    InternetService: "Fiber optic",
    OnlineSecurity: "No",
    TechSupport: "Yes",
    PaymentMethod: "Mailed check",
    PaperlessBilling: "Yes",
  },
};

function fullTelco(p: any) {
  return {
    gender: "Male",
    SeniorCitizen: 0,
    Partner: "No",
    Dependents: "No",
    tenure: p.tenure,
    PhoneService: "Yes",
    MultipleLines: "No",
    InternetService: p.InternetService,
    OnlineSecurity: p.OnlineSecurity,
    OnlineBackup: "No",
    DeviceProtection: "No",
    TechSupport: p.TechSupport,
    StreamingTV: "No",
    StreamingMovies: "No",
    Contract: p.Contract,
    PaperlessBilling: p.PaperlessBilling,
    PaymentMethod: p.PaymentMethod,
    MonthlyCharges: p.MonthlyCharges,
    TotalCharges: p.MonthlyCharges * p.tenure,
  };
}

export default function RetentionSimulatorPage() {
  const [preset, setPreset] = useState("High-risk new customer");
  const [form, setForm] = useState<any>(PRESETS[preset]);
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const applyPreset = (name: string) => {
    setPreset(name);
    setForm(PRESETS[name]);
    setResult(null);
  };

  const update = (k: string, v: any) => {
    setForm((f: any) => ({ ...f, [k]: v }));
    setResult(null);
  };

  const run = async () => {
    setLoading(true);
    try {
      setResult(await apiClient.getWhatIf(fullTelco(form)));
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const base = result?.baseline_probability ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      <PageHeader title="Retention Simulator">
        Counterfactual &ldquo;what-if&rdquo; analysis: see how each retention
        lever would change this customer&apos;s churn probability, ranked by
        impact.
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="p-6 space-y-4 h-fit">
          <div>
            <label className="text-sm font-medium">Start from</label>
            <select
              value={preset}
              onChange={(e) => applyPreset(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.keys(PRESETS).map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </div>

          <Field label="Tenure (months)">
            <input
              type="number"
              value={form.tenure}
              min={0}
              onChange={(e) => update("tenure", parseInt(e.target.value) || 0)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Monthly charges ($)">
            <input
              type="number"
              value={form.MonthlyCharges}
              min={0}
              onChange={(e) =>
                update("MonthlyCharges", parseFloat(e.target.value) || 0)
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Select
            label="Contract"
            value={form.Contract}
            options={["Month-to-month", "One year", "Two year"]}
            onChange={(v) => update("Contract", v)}
          />
          <Select
            label="Internet service"
            value={form.InternetService}
            options={["Fiber optic", "DSL", "No"]}
            onChange={(v) => update("InternetService", v)}
          />
          <Select
            label="Tech support"
            value={form.TechSupport}
            options={["No", "Yes"]}
            onChange={(v) => update("TechSupport", v)}
          />
          <Select
            label="Online security"
            value={form.OnlineSecurity}
            options={["No", "Yes"]}
            onChange={(v) => update("OnlineSecurity", v)}
          />

          <Button onClick={run} disabled={loading} className="w-full">
            {loading ? "Simulating…" : "Run simulation"}
          </Button>
        </Card>

        <div className="space-y-6">
          {!result ? (
            <Card className="p-12 flex flex-col items-center justify-center text-center text-muted-foreground">
              <TrendingDown className="h-10 w-10 mb-3 opacity-40" />
              <p>Run a simulation to see which actions lower churn risk most.</p>
            </Card>
          ) : (
            <>
              <Card className="p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Current churn probability
                </p>
                <p className="font-display tnum mt-1 text-4xl font-semibold">
                  {formatPercent(base)}
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${base * 100}%` }}
                  />
                </div>
              </Card>

              <div className="space-y-3">
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  Retention levers, ranked
                </h2>
                {result.scenarios.map((s) => {
                  const reduces = s.delta < 0;
                  const newProb = s.churn_probability;
                  return (
                    <Card key={s.field} className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{s.label}</p>
                          <p className="text-xs text-muted-foreground">
                            New risk: {(newProb * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-1 font-semibold shrink-0 ${
                            reduces
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {reduces && <ArrowDown className="h-4 w-4" />}
                          {reduces ? "" : "+"}
                          {(s.delta * 100).toFixed(1)} pts
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={reduces ? "h-full bg-emerald-500" : "h-full bg-red-500"}
                          style={{ width: `${newProb * 100}%` }}
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </Field>
  );
}
