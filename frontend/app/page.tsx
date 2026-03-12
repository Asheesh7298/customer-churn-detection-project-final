"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useModelMetrics, useTopRiskCustomers } from "@/lib/hooks";
import { PredictionResponse } from "@/lib/types";
import Link from "next/link";
import { AlertCircle, TrendingUp, Users } from "lucide-react";

export default function HomePage() {
  const { data: metrics, loading: metricsLoading } = useModelMetrics(true);
  const { customers: topRisk, loading: riskLoading } = useTopRiskCustomers(30000);
  const [avgChurnScore, setAvgChurnScore] = useState(0);

  useEffect(() => {
    if (topRisk.length > 0) {
      const avg =
        topRisk.reduce((sum, c) => sum + c.churn_probability, 0) /
        topRisk.length;
      setAvgChurnScore(avg);
    }
  }, [topRisk]);

  const highRiskCount = topRisk.filter(
    (c) => c.risk_level === "high"
  ).length;

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Churn Prediction Dashboard
        </h1>
        <p className="text-muted-foreground">
          Real-time customer churn risk monitoring and analysis
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Model Accuracy"
          value={metrics ? `${(metrics.accuracy * 100).toFixed(1)}%` : "—"}
          subtitle={metrics ? `v${metrics.model_version}` : ""}
          icon="🎯"
        />
        <MetricCard
          title="Average Churn Risk"
          value={`${(avgChurnScore * 100).toFixed(1)}%`}
          subtitle={topRisk.length > 0 ? "from top 20 customers" : ""}
          icon="📊"
        />
        <MetricCard
          title="High-Risk Customers"
          value={highRiskCount}
          subtitle={`of ${topRisk.length} analyzed`}
          trend="up"
          trendLabel="Monitor closely"
          icon="⚠️"
        />
        <MetricCard
          title="Model Precision"
          value={metrics ? `${(metrics.precision * 100).toFixed(1)}%` : "—"}
          subtitle={metrics ? `Recall: ${(metrics.recall * 100).toFixed(1)}%` : ""}
          icon="✓"
        />
      </div>

      {/* Top Risk Customers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">
              Top Risk Customers
            </h2>
            <p className="text-sm text-muted-foreground">
              Customers with highest churn probability (auto-updated every 30 seconds)
            </p>
          </div>
          <Link href="/customer-profile">
            <Button>Analyze Customer</Button>
          </Link>
        </div>

        {riskLoading ? (
          <Card className="p-8">
            <p className="text-center text-muted-foreground">Loading...</p>
          </Card>
        ) : topRisk.length === 0 ? (
          <Card className="p-8">
            <p className="text-center text-muted-foreground">
              No customer data available
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                      Customer ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground">
                      Churn Risk
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-muted-foreground">
                      Risk Level
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topRisk.slice(0, 10).map((customer) => (
                    <tr
                      key={customer.customer_id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium">
                        {customer.customer_id}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {customer.name || "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-semibold">
                          {(customer.churn_probability * 100).toFixed(1)}%
                        </div>
                        <div className="h-1 w-16 bg-gray-200 rounded-full mt-1 mx-auto overflow-hidden">
                          <div
                            className={`h-full ${
                              customer.churn_probability < 0.33
                                ? "bg-green-500"
                                : customer.churn_probability < 0.67
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                            style={{
                              width: `${customer.churn_probability * 100}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                            customer.risk_level === "low"
                              ? "bg-green-50 text-green-700"
                              : customer.risk_level === "medium"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                          }`}
                        >
                          <AlertCircle className="h-3 w-3" />
                          {customer.risk_level.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/customer-profile">
          <Card className="p-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Analyze Customer</h3>
                <p className="text-sm text-muted-foreground">
                  Get churn prediction for individual customers
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/result-charts">
          <Card className="p-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">View Charts</h3>
                <p className="text-sm text-muted-foreground">
                  Visualize churn factors and distributions
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/customer-segmentation">
          <Card className="p-6 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Segmentation</h3>
                <p className="text-sm text-muted-foreground">
                  View customers grouped by risk levels
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
