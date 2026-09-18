"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useSegmentation } from "@/lib/hooks";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function ResultChartsPage() {
  const { data: segmentation, loading } = useSegmentation(true);

  // Risk distribution data for pie chart
  const riskDistributionData = segmentation
    ? [
        { name: "Low Risk", value: segmentation.low_risk_count },
        { name: "Medium Risk", value: segmentation.medium_risk_count },
        { name: "High Risk", value: segmentation.high_risk_count },
      ]
    : [];

  // Churn scores data for bar chart
  const churnScoresData = segmentation
    ? [
        {
          name: "Low Risk",
          score: Math.round(segmentation.avg_low_score * 100),
          count: segmentation.low_risk_count,
        },
        {
          name: "Medium Risk",
          score: Math.round(segmentation.avg_medium_score * 100),
          count: segmentation.medium_risk_count,
        },
        {
          name: "High Risk",
          score: Math.round(segmentation.avg_high_score * 100),
          count: segmentation.high_risk_count,
        },
      ]
    : [];

  const COLORS = {
    low: "#10b981",
    medium: "#f59e0b",
    high: "#ef4444",
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <PageHeader title="Churn Factor Analysis">
        Visual analysis of churn risk distribution and the factors that drive it.
      </PageHeader>

      {loading ? (
        <Card className="p-8 text-center text-muted-foreground">
          Loading charts...
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Risk Distribution Pie Chart */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Risk Level Distribution</h3>
            {riskDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) =>
                      `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill={COLORS.low} />
                    <Cell fill={COLORS.medium} />
                    <Cell fill={COLORS.high} />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </Card>

          {/* Average Churn Score by Risk Level */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Average Churn Score by Risk Level</h3>
            {churnScoresData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={churnScoresData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: "Churn Score (%)", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#3b82f6">
                    <Cell fill={COLORS.low} />
                    <Cell fill={COLORS.medium} />
                    <Cell fill={COLORS.high} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </Card>

          {/* Customer Count by Risk Level */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="font-semibold mb-4">Customer Count by Risk Level</h3>
            {churnScoresData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={churnScoresData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: "Number of Customers", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6">
                    <Cell fill={COLORS.low} />
                    <Cell fill={COLORS.medium} />
                    <Cell fill={COLORS.high} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </Card>

          {/* Summary Statistics */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="font-semibold mb-4">Summary Statistics</h3>
            {segmentation ? (
              <div className="grid gap-6 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-2xl font-bold">
                    {segmentation.low_risk_count +
                      segmentation.medium_risk_count +
                      segmentation.high_risk_count}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Low Risk Score</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(segmentation.avg_low_score * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Medium Risk Score</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {(segmentation.avg_medium_score * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg High Risk Score</p>
                  <p className="text-2xl font-bold text-red-600">
                    {(segmentation.avg_high_score * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No data available</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
