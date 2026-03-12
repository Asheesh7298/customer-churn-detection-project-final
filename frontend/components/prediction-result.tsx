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
      bg: "bg-green-50",
      text: "text-green-700",
      icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
    },
    medium: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
    },
    high: {
      bg: "bg-red-50",
      text: "text-red-700",
      icon: <AlertCircle className="h-6 w-6 text-red-600" />,
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
                <p className="text-5xl font-bold text-foreground">{probability}%</p>
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
