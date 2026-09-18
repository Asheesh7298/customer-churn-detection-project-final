"use client";

import { Card } from "@/components/ui/card";
import { PredictionResponse, RiskLevel } from "@/lib/types";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

interface PredictionResultProps {
  prediction: PredictionResponse;
}

export function PredictionResult({ prediction }: PredictionResultProps) {
  const riskColors: Record<RiskLevel, { bg: string; text: string; icon: React.ReactNode }> = {
    low: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      text: "text-emerald-700 dark:text-emerald-400",
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
    },
    medium: {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-400",
      icon: <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
    },
    high: {
      bg: "bg-red-50 dark:bg-red-950/40",
      text: "text-red-700 dark:text-red-400",
      icon: <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />,
    },
  };

  const riskStyle = riskColors[prediction.risk_level];
  const probability = Math.round(prediction.churn_probability * 100);

  return (
    <Card className={`p-8 ${riskStyle.bg}`}>
      <div className="flex items-start gap-6">
        <div>{riskStyle.icon}</div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">
            Churn Prediction Result
          </h3>

          <div className="mt-4 grid gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Churn Probability
              </p>
              <div className="mt-2 flex items-baseline gap-3">
                <p className="font-display tnum text-5xl font-semibold text-foreground">{probability}%</p>
                <p className={`text-lg font-semibold ${riskStyle.text}`}>
                  {prediction.risk_level.toUpperCase()} RISK
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Risk Score
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {probability}%
                </p>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    probability < 33
                      ? "bg-green-500"
                      : probability < 67
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${probability}%` }}
                />
              </div>
            </div>

            <div className="mt-2 text-sm text-muted-foreground">
              <p>
                Model Version: <span className="font-medium">{prediction.model_version}</span>
              </p>
              <p className="mt-1 text-xs">
                Prediction made at {new Date(prediction.prediction_timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
