"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export default function ExplanationPanelPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <PageHeader title="Reading the Explanations">
        How to interpret SHAP feature contributions and prediction output.
      </PageHeader>

      <div className="grid gap-6">
        <Card className="p-8">
          <h2 className="text-xl font-semibold mb-4">How to Use</h2>
          <ol className="space-y-3 text-muted-foreground list-decimal list-inside">
            <li>Go to Customer Profile page</li>
            <li>Select a customer or enter their details</li>
            <li>Click "Predict Churn Risk"</li>
            <li>View the top contributing factors in the right panel</li>
            <li>Understand which features increase or decrease churn risk</li>
          </ol>
        </Card>

        <Card className="p-8">
          <h2 className="text-xl font-semibold mb-4">Feature Contributions</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-2">↑ Positive Contribution (Increases Risk)</p>
              <p className="text-sm text-muted-foreground">Features that push the prediction toward higher churn probability</p>
            </div>
            <div>
              <p className="font-medium mb-2">↓ Negative Contribution (Decreases Risk)</p>
              <p className="text-sm text-muted-foreground">Features that push the prediction toward lower churn probability</p>
            </div>
          </div>
        </Card>

        <Card className="p-8 text-center text-muted-foreground">
          <p>SHAP summary plots and detailed visualizations will render here</p>
          <p className="text-sm mt-2">Make a prediction on the Customer Profile page to see explanations</p>
        </Card>
      </div>
    </div>
  );
}
