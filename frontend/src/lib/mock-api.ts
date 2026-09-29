/**
 * Demo data used only when the live API can't be reached (the sidebar badge
 * then reads "Demo data").
 *
 * Everything here is a snapshot of real results from the deployed model — the
 * metrics, tenure cohorts, segment sizes, and customers all come from the
 * actual API — so demo mode stays honest instead of showing invented numbers.
 * Only `predict` is approximated, with a simple rule that follows the same
 * drivers the real model learned (contract, tenure, fiber, charges, support).
 */
import {
  PredictionRequest,
  PredictionResponse,
  CustomerInfo,
  CustomerDetail,
  TrendResponse,
  SegmentationResponse,
  ModelMetrics,
  FeatureImportance,
  RiskLevel,
} from "./types";

// ---- Snapshot: real customers from the scored sample ----

interface SnapshotCustomer {
  id: string;
  tenure: number;
  monthly: number;
  total: number;
  contract: string;
  internet: string;
  tech: boolean;
  security: boolean;
  p: number; // churn probability from the real model
  risk: RiskLevel;
}

const CUSTOMERS: SnapshotCustomer[] = [
  { id: "9061-TIHDA", tenure: 13, monthly: 95.25, total: 1233.65, contract: "Month-to-month", internet: "Fiber optic", tech: false, security: false, p: 0.9161, risk: "high" },
  { id: "5277-ZLOOR", tenure: 2, monthly: 85.55, total: 187.45, contract: "Month-to-month", internet: "Fiber optic", tech: false, security: false, p: 0.9157, risk: "high" },
  { id: "2725-KXXWT", tenure: 1, monthly: 90.75, total: 90.75, contract: "Month-to-month", internet: "Fiber optic", tech: false, security: false, p: 0.9096, risk: "high" },
  { id: "1304-NECVQ", tenure: 2, monthly: 78.55, total: 149.55, contract: "Month-to-month", internet: "Fiber optic", tech: false, security: false, p: 0.8965, risk: "high" },
  { id: "2462-XIIJB", tenure: 5, monthly: 92.5, total: 452.7, contract: "Month-to-month", internet: "Fiber optic", tech: false, security: false, p: 0.8896, risk: "high" },
  { id: "6745-JEFZB", tenure: 35, monthly: 91.5, total: 3236.35, contract: "Month-to-month", internet: "Fiber optic", tech: true, security: false, p: 0.6469, risk: "medium" },
  { id: "9530-EHPOH", tenure: 11, monthly: 53.75, total: 608, contract: "Month-to-month", internet: "DSL", tech: false, security: false, p: 0.6461, risk: "medium" },
  { id: "0804-XBFBV", tenure: 11, monthly: 25.2, total: 321.05, contract: "Month-to-month", internet: "DSL", tech: false, security: false, p: 0.6436, risk: "medium" },
  { id: "2070-FNEXE", tenure: 7, monthly: 76.45, total: 503.6, contract: "Month-to-month", internet: "Fiber optic", tech: false, security: true, p: 0.6423, risk: "medium" },
  { id: "7148-XZPHA", tenure: 55, monthly: 79.4, total: 4238.45, contract: "Month-to-month", internet: "Fiber optic", tech: true, security: false, p: 0.2993, risk: "low" },
  { id: "7080-TNUWP", tenure: 70, monthly: 95, total: 6602.9, contract: "One year", internet: "Fiber optic", tech: false, security: false, p: 0.2957, risk: "low" },
  { id: "7623-HKYRK", tenure: 6, monthly: 19.7, total: 111.65, contract: "Month-to-month", internet: "No", tech: false, security: false, p: 0.2936, risk: "low" },
  { id: "1353-GHZOS", tenure: 22, monthly: 59.75, total: 1374.35, contract: "One year", internet: "DSL", tech: false, security: true, p: 0.2794, risk: "low" },
];

const toInfo = (c: SnapshotCustomer): CustomerInfo => ({
  customer_id: c.id,
  name: c.id,
  age: 0,
  tenure: c.tenure,
  monthly_charges: c.monthly,
  contract_type: c.contract,
});

const toDetail = (c: SnapshotCustomer): CustomerDetail => ({
  ...toInfo(c),
  total_charges: c.total,
  internet_service: c.internet,
  support_tickets: 0,
  tech_support: c.tech,
  online_security: c.security,
  churn_score: c.p,
  risk_level: c.risk,
  last_contact_days_ago: 0,
});

// ---- Snapshot: held-out test metrics ----

const METRICS: ModelMetrics = {
  model_version: "2.0.0",
  model_type: "logistic_regression",
  train_date: "2026-09-18T04:03:14Z",
  accuracy: 0.7381,
  precision: 0.5043,
  recall: 0.7834,
  f1_score: 0.6136,
  roc_auc: 0.8416,
  total_customers_trained: 5634,
  n_test: 1409,
  churn_rate: 0.2654,
  confusion_matrix: [
    [747, 288],
    [81, 293],
  ],
  features_used: [
    "tenure", "MonthlyCharges", "TotalCharges", "SeniorCitizen", "Contract",
    "InternetService", "PaymentMethod", "OnlineSecurity", "TechSupport",
  ],
};

// ---- Snapshot: real churn rate by tenure cohort ----

const TRENDS: TrendResponse = {
  data: [
    { month: "0-6 mo", churn_rate: 0.5294, total_customers: 1481, churned_customers: 784 },
    { month: "7-12 mo", churn_rate: 0.3589, total_customers: 705, churned_customers: 253 },
    { month: "13-24 mo", churn_rate: 0.2871, total_customers: 1024, churned_customers: 294 },
    { month: "25-48 mo", churn_rate: 0.2039, total_customers: 1594, churned_customers: 325 },
    { month: "49-60 mo", churn_rate: 0.1442, total_customers: 832, churned_customers: 120 },
    { month: "61+ mo", churn_rate: 0.0661, total_customers: 1407, churned_customers: 93 },
  ],
  current_month_churn: 0.5294,
  trend_direction: "decreasing",
};

// ---- Snapshot: segment sizes and averages ----

const byRisk = (risk: RiskLevel) => CUSTOMERS.filter((c) => c.risk === risk).map(toInfo);

const SEGMENTATION: SegmentationResponse = {
  low_risk: byRisk("low"),
  medium_risk: byRisk("medium"),
  high_risk: byRisk("high"),
  low_risk_count: 115,
  medium_risk_count: 64,
  high_risk_count: 71,
  avg_low_score: 0.1017,
  avg_medium_score: 0.4827,
  avg_high_score: 0.8079,
};

// ---- Approximate prediction for demo mode ----

/**
 * A readable stand-in for the real model: each factor nudges the log-odds of
 * churning up or down, in the same directions the trained model learned.
 */
function demoPredict(r: PredictionRequest): PredictionResponse {
  const contractEffect =
    r.contract_type === "two_year" ? -1.6 : r.contract_type === "one_year" ? -0.4 : 1.1;
  const internetEffect =
    r.internet_service === "fiber" ? 0.7 : r.internet_service === "dsl" ? -0.1 : -0.9;

  const terms: { feature: string; effect: number; value: string | number }[] = [
    { feature: "Contract", effect: contractEffect, value: r.contract_type },
    { feature: "Internet service", effect: internetEffect, value: r.internet_service },
    { feature: "Tenure (months)", effect: -0.035 * r.tenure, value: r.tenure },
    { feature: "Monthly charges", effect: 0.012 * (r.monthly_charges - 65), value: r.monthly_charges },
    { feature: "Tech support", effect: r.tech_support ? -0.45 : 0, value: r.tech_support ? "Yes" : "No" },
    { feature: "Online security", effect: r.online_security ? -0.45 : 0, value: r.online_security ? "Yes" : "No" },
  ];

  const logOdds = -0.4 + terms.reduce((sum, t) => sum + t.effect, 0);
  const probability = 1 / (1 + Math.exp(-logOdds));
  const risk: RiskLevel = probability >= 0.66 ? "high" : probability >= 0.33 ? "medium" : "low";

  const featureImportance: FeatureImportance[] = terms
    .filter((t) => t.effect !== 0)
    .sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))
    .slice(0, 5)
    .map((t) => ({
      feature: t.feature,
      importance: Math.abs(t.effect),
      contribution_direction: t.effect > 0 ? "positive" : "negative",
      value: t.value,
    }));

  return {
    customer_id: r.customer_id,
    churn_probability: probability,
    risk_level: risk,
    feature_importance: featureImportance,
    model_version: `${METRICS.model_version} (demo)`,
    prediction_timestamp: new Date().toISOString(),
  };
}

// Small delay so demo mode feels like a network call.
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApiClient = {
  async predict(request: PredictionRequest): Promise<PredictionResponse> {
    await delay(300);
    return demoPredict(request);
  },

  async getCustomers(): Promise<CustomerInfo[]> {
    await delay(200);
    return [...CUSTOMERS].sort((a, b) => b.p - a.p).map(toInfo);
  },

  async getCustomerDetail(customerId: string): Promise<CustomerDetail> {
    await delay(200);
    const match = CUSTOMERS.find((c) => c.id === customerId) ?? CUSTOMERS[0];
    return toDetail(match);
  },

  async getTrends(): Promise<TrendResponse> {
    await delay(200);
    return TRENDS;
  },

  async getSegmentation(): Promise<SegmentationResponse> {
    await delay(200);
    return SEGMENTATION;
  },

  async getModelMetrics(): Promise<ModelMetrics> {
    await delay(150);
    return METRICS;
  },

  async healthCheck(): Promise<{ status: string }> {
    return { status: "demo" };
  },
};
