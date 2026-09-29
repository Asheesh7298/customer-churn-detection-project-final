import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Stat } from "@/components/stat";
import { useSegmentation } from "@/lib/hooks";
import { formatMoney, formatPercent } from "@/lib/format";
import { RISK, RiskLevel } from "@/lib/risk";
import { CustomerInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Segment {
  level: RiskLevel;
  count: number;
  avgScore: number;
  customers: CustomerInfo[];
}

export default function Segments() {
  const { data: segmentation, loading } = useSegmentation(true);

  const segments: Segment[] = segmentation
    ? [
        {
          level: "low",
          count: segmentation.low_risk_count,
          avgScore: segmentation.avg_low_score,
          customers: segmentation.low_risk,
        },
        {
          level: "medium",
          count: segmentation.medium_risk_count,
          avgScore: segmentation.avg_medium_score,
          customers: segmentation.medium_risk,
        },
        {
          level: "high",
          count: segmentation.high_risk_count,
          avgScore: segmentation.avg_high_score,
          customers: segmentation.high_risk,
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <PageHeader title="Customer Segmentation">
        Real customers grouped by churn risk level. Select a customer to open
        their prediction.
      </PageHeader>

      {loading && !segmentation ? (
        <Card className="p-8 text-center text-muted-foreground">Loading segments…</Card>
      ) : segments.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No segmentation data available.
        </Card>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-3 divide-x divide-border rounded-md border border-border bg-card [&>*]:p-5">
            {segments.map((s) => (
              <Stat
                key={s.level}
                label={`${RISK[s.level].label} risk`}
                value={s.count}
                hint={`avg. churn ${formatPercent(s.avgScore)}`}
              />
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {segments.map((s) => (
              <Card key={s.level} className="p-6">
                <h3 className={cn("mb-4 font-semibold", RISK[s.level].text)}>
                  {RISK[s.level].label} risk ({s.count})
                </h3>
                <div className="max-h-96 space-y-1 overflow-y-auto">
                  {s.customers.slice(0, 10).map((c) => (
                    <Link
                      key={c.customer_id}
                      to={`/predict?customerId=${c.customer_id}`}
                      className="block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                    >
                      <p className="font-medium">{c.customer_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.contract_type}, {formatMoney(c.monthly_charges, 2)}/mo
                      </p>
                    </Link>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
