"use client";

import { Card } from "@/components/ui/card";
import { useTrendData } from "@/lib/hooks";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function TrendAnalysisPage() {
  const { data: trends, loading } = useTrendData(true, 120000); // Poll every 2 minutes

  const chartData = trends
    ? trends.data.map((point) => ({
        month: point.month.split("-")[1] + "/" + point.month.split("-")[0],
        rate: Math.round(point.churn_rate * 100 * 10) / 10,
        customers: point.total_customers,
        churned: point.churned_customers,
      }))
    : [];

  const stats = trends
    ? {
        current: Math.round(trends.current_month_churn * 100 * 10) / 10,
        direction: trends.trend_direction,
        average: chartData.length > 0
          ? Math.round(
              (chartData.reduce((sum, d) => sum + d.rate, 0) / chartData.length) * 10
            ) / 10
          : 0,
        peak: chartData.length > 0 ? Math.max(...chartData.map((d) => d.rate)) : 0,
        lowest: chartData.length > 0 ? Math.min(...chartData.map((d) => d.rate)) : 0,
      }
    : null;

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Trend Analysis</h1>
        <p className="text-muted-foreground">
          12-month churn trends and historical analysis
        </p>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-muted-foreground">
          Loading trends...
        </Card>
      ) : trends && stats ? (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Current Month</p>
              <p className="text-3xl font-bold">{stats.current}%</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">12-Month Average</p>
              <p className="text-3xl font-bold">{stats.average}%</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Peak Month</p>
              <p className="text-3xl font-bold text-red-600">{stats.peak}%</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Lowest Month</p>
              <p className="text-3xl font-bold text-green-600">{stats.lowest}%</p>
            </Card>
          </div>

          {/* Time Series Chart */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Churn Rate Over Time</h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  label={{ value: "Churn Rate (%)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip formatter={(value) => `${value}%`} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRate)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Trend Direction Indicator */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Trend Analysis</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-muted-foreground mb-2">Trend Direction</p>
                <p className="text-lg font-semibold capitalize">
                  {stats.direction === "increasing" ? (
                    <span className="text-red-600">📈 Increasing</span>
                  ) : stats.direction === "decreasing" ? (
                    <span className="text-green-600">📉 Decreasing</span>
                  ) : (
                    <span className="text-amber-600">➡️ Stable</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {stats.direction === "increasing"
                    ? "Churn rate is trending upward - consider intervention"
                    : stats.direction === "decreasing"
                      ? "Churn rate is trending downward - improvement detected"
                      : "Churn rate is stable"}
                </p>
              </div>
            </div>
          </Card>

          {/* Customer Acquisition vs Churn */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Customers vs Churn</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="customers"
                  stroke="#10b981"
                  name="Total Customers"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="churned"
                  stroke="#ef4444"
                  name="Churned Customers"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Data Table */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Monthly Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Month</th>
                    <th className="px-4 py-3 text-center font-medium">Churn Rate</th>
                    <th className="px-4 py-3 text-center font-medium">Total Customers</th>
                    <th className="px-4 py-3 text-center font-medium">Churned</th>
                  </tr>
                </thead>
                <tbody>
                  {trends.data.map((point) => (
                    <tr key={point.month} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">{point.month}</td>
                      <td className="px-4 py-3 text-center font-medium">
                        <span
                          className={
                            point.churn_rate > 0.25
                              ? "text-red-600"
                              : point.churn_rate > 0.15
                                ? "text-amber-600"
                                : "text-green-600"
                          }
                        >
                          {(point.churn_rate * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {point.total_customers}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {point.churned_customers}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center text-muted-foreground">
          No trend data available
        </Card>
      )}
    </div>
  );
}
