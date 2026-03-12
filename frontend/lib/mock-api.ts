import {
  PredictionResponse,
  CustomerInfo,
  CustomerDetail,
  TrendResponse,
  SegmentationResponse,
  ModelMetrics,
} from "./types";

// Mock customer data generator
function generateMockCustomers(count: number = 50): CustomerInfo[] {
  const customers: CustomerInfo[] = [];
  const contractTypes = ["month-to-month", "one_year", "two_year"];
  const internetServices = ["DSL", "Fiber", "Cable"];

  for (let i = 1; i <= count; i++) {
    const riskScore = Math.random();
    let riskLevel: "low" | "medium" | "high" = "low";
    if (riskScore > 0.66) riskLevel = "high";
    else if (riskScore > 0.33) riskLevel = "medium";

    customers.push({
      customer_id: `CUST-${String(i).padStart(5, "0")}`,
      age: Math.floor(Math.random() * 60) + 18,
      tenure: Math.floor(Math.random() * 72),
      monthly_charges: Math.floor(Math.random() * 110) + 20,
      total_charges: Math.floor(Math.random() * 8000) + 100,
      contract_type: contractTypes[Math.floor(Math.random() * 3)],
      internet_service_type: internetServices[Math.floor(Math.random() * 3)],
      churn_probability: riskScore,
      risk_level: riskLevel,
      predicted_churn: riskScore > 0.5,
    });
  }

  // Sort by churn probability (descending) to show high-risk first
  return customers.sort((a, b) => b.churn_probability - a.churn_probability);
}

// Mock trends data
function generateMockTrends(): TrendResponse {
  const months = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    const totalCustomers = Math.floor(Math.random() * 500) + 1000;
    const churnRate = 0.1 + Math.random() * 0.2; // 10-30% churn
    const churnedCustomers = Math.floor(totalCustomers * churnRate);

    months.push({
      month: monthStr,
      total_customers: totalCustomers,
      churned_customers: churnedCustomers,
      churn_rate: churnRate,
    });
  }

  const currentRate = months[months.length - 1].churn_rate;
  const previousRate = months[months.length - 2].churn_rate;
  const trend = currentRate > previousRate ? "increasing" : currentRate < previousRate ? "decreasing" : "stable";

  return {
    data: months,
    current_month_churn: currentRate,
    trend_direction: trend,
  };
}

// Mock segmentation data
function generateMockSegmentation(): SegmentationResponse {
  return {
    low_risk_count: Math.floor(Math.random() * 500) + 400,
    medium_risk_count: Math.floor(Math.random() * 300) + 200,
    high_risk_count: Math.floor(Math.random() * 200) + 100,
    avg_low_score: Math.random() * 0.3 + 0.05,
    avg_medium_score: Math.random() * 0.2 + 0.35,
    avg_high_score: Math.random() * 0.2 + 0.65,
    factors: [
      { factor: "Contract Type", importance: 0.25 },
      { factor: "Tenure", importance: 0.2 },
      { factor: "Monthly Charges", importance: 0.18 },
      { factor: "Internet Service Type", importance: 0.15 },
      { factor: "Age", importance: 0.12 },
      { factor: "Total Charges", importance: 0.1 },
    ],
  };
}

// Mock model metrics
function generateMockMetrics(): ModelMetrics {
  return {
    model_version: "1.0.0",
    accuracy: 0.85,
    precision: 0.82,
    recall: 0.88,
    f1_score: 0.85,
    roc_auc: 0.91,
    total_customers_trained: 10000,
    features_used: [
      "age",
      "tenure",
      "monthly_charges",
      "total_charges",
      "contract_type",
      "internet_service_type",
    ],
    train_date: "2026-02-20",
  };
}

// Mock prediction with SHAP values
function generateMockPrediction(data: any): PredictionResponse {
  const riskScore = Math.random();
  let riskLevel: "low" | "medium" | "high" = "low";
  if (riskScore > 0.66) riskLevel = "high";
  else if (riskScore > 0.33) riskLevel = "medium";

  return {
    customer_id: data.customer_id || "CUST-00001",
    churn_probability: riskScore,
    risk_level: riskLevel,
    predicted_churn: riskScore > 0.5,
    feature_importance: [
      {
        feature: "tenure",
        importance: Math.random() * 0.3,
        value: data.tenure || 30,
      },
      {
        feature: "monthly_charges",
        importance: Math.random() * 0.25,
        value: data.monthly_charges || 65,
      },
      {
        feature: "contract_type",
        importance: Math.random() * 0.2,
        value: data.contract_type || "month-to-month",
      },
      {
        feature: "age",
        importance: Math.random() * 0.15,
        value: data.age || 40,
      },
      {
        feature: "total_charges",
        importance: Math.random() * 0.1,
        value: data.total_charges || 2000,
      },
    ],
    model_version: "1.0.0",
    prediction_timestamp: new Date().toISOString(),
  };
}

// Mock API client
export const mockApiClient = {
  async predict(data: any): Promise<PredictionResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return generateMockPrediction(data);
  },

  async getCustomers(): Promise<CustomerInfo[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return generateMockCustomers(50);
  },

  async getCustomerDetail(customerId: string): Promise<CustomerDetail> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const customers = generateMockCustomers(1);
    const customer = customers[0];
    return {
      customer_id: customerId,
      demographics: {
        age: customer.age,
        tenure: customer.tenure,
      },
      interaction_history: [
        {
          date: "2026-02-15",
          type: "support_call",
          duration_minutes: Math.floor(Math.random() * 30) + 5,
          resolved: Math.random() > 0.3,
        },
        {
          date: "2026-02-10",
          type: "billing_inquiry",
          duration_minutes: Math.floor(Math.random() * 20) + 2,
          resolved: Math.random() > 0.2,
        },
        {
          date: "2026-02-05",
          type: "service_issue",
          duration_minutes: Math.floor(Math.random() * 40) + 10,
          resolved: Math.random() > 0.4,
        },
      ],
      churn_risk_score: Math.random(),
    };
  },

  async getTrends(): Promise<TrendResponse> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return generateMockTrends();
  },

  async getSegmentation(): Promise<SegmentationResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return generateMockSegmentation();
  },

  async getModelMetrics(): Promise<ModelMetrics> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return generateMockMetrics();
  },

  async healthCheck(): Promise<{ status: string }> {
    return { status: "ok" };
  },
};
