"use client";

import { Card } from "@/components/ui/card";
import { useSegmentation } from "@/lib/hooks";
import { MetricCard } from "@/components/metric-card";
import Link from "next/link";

export default function SegmentationPage() {
  const { data: segmentation, loading } = useSegmentation(true);

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Customer Segmentation</h1>
        <p className="text-muted-foreground">Customers grouped by churn risk level</p>
      </div>

      {loading ? (
        <Card className="p-8 text-center text-muted-foreground">Loading segmentation...</Card>
      ) : segmentation ? (
        <div className="space-y-8">
          {/* Summary Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Low Risk"
              value={segmentation.low_risk_count}
              subtitle={`Avg: ${(segmentation.avg_low_score * 100).toFixed(1)}%`}
              icon="✓"
            />
            <MetricCard
              title="Medium Risk"
              value={segmentation.medium_risk_count}
              subtitle={`Avg: ${(segmentation.avg_medium_score * 100).toFixed(1)}%`}
              icon="⚠️"
            />
            <MetricCard
              title="High Risk"
              value={segmentation.high_risk_count}
              subtitle={`Avg: ${(segmentation.avg_high_score * 100).toFixed(1)}%`}
              icon="🔴"
            />
          </div>

          {/* Risk Level Sections */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Low Risk */}
            <Card className="p-6 border-green-200">
              <h3 className="font-semibold text-green-700 mb-4">Low Risk ({segmentation.low_risk_count})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {segmentation.low_risk.slice(0, 10).map((c) => (
                  <Link
                    key={c.customer_id}
                    href={`/customer-profile?customerId=${c.customer_id}`}
                    className="block p-2 rounded hover:bg-green-50 text-sm"
                  >
                    <p className="font-medium">{c.customer_id}</p>
                    <p className="text-xs text-muted-foreground">{c.name}</p>
                  </Link>
                ))}
              </div>
            </Card>

            {/* Medium Risk */}
            <Card className="p-6 border-amber-200">
              <h3 className="font-semibold text-amber-700 mb-4">Medium Risk ({segmentation.medium_risk_count})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {segmentation.medium_risk.slice(0, 10).map((c) => (
                  <Link
                    key={c.customer_id}
                    href={`/customer-profile?customerId=${c.customer_id}`}
                    className="block p-2 rounded hover:bg-amber-50 text-sm"
                  >
                    <p className="font-medium">{c.customer_id}</p>
                    <p className="text-xs text-muted-foreground">{c.name}</p>
                  </Link>
                ))}
              </div>
            </Card>

            {/* High Risk */}
            <Card className="p-6 border-red-200">
              <h3 className="font-semibold text-red-700 mb-4">High Risk ({segmentation.high_risk_count})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {segmentation.high_risk.slice(0, 10).map((c) => (
                  <Link
                    key={c.customer_id}
                    href={`/customer-profile?customerId=${c.customer_id}`}
                    className="block p-2 rounded hover:bg-red-50 text-sm"
                  >
                    <p className="font-medium">{c.customer_id}</p>
                    <p className="text-xs text-muted-foreground">{c.name}</p>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center text-muted-foreground">No segmentation data available</Card>
      )}
    </div>
  );
}
