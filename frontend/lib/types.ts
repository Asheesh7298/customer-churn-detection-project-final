// Prediction related types
export type RiskLevel = "low" | "medium" | "high";
export type ContractType = "month-to-month" | "one_year" | "two_year";
export type InternetService = "fiber" | "dsl" | "none";

export interface FeatureImportance {
  feature: string;
  importance: number;
  contribution_direction: "positive" | "negative";
}

export interface PredictionResponse {
  customer_id: string;
  churn_probability: number;
  risk_level: RiskLevel;
  feature_importance: FeatureImportance[];
  model_version: string;
  prediction_timestamp: string;
}

export interface PredictionRequest {
  customer_id: string;
  age: number;
  tenure: number;
  monthly_charges: number;
  total_charges: number;
  contract_type: ContractType;
  internet_service: InternetService;
  monthly_usage_gb: number;
  support_tickets: number;
  tech_support: boolean;
  online_security: boolean;
}

// Customer related types
export interface CustomerInfo {
  customer_id: string;
  name: string;
  age: number;
  tenure: number;
  monthly_charges: number;
  contract_type: string;
}

export interface CustomerDetail extends CustomerInfo {
  total_charges: number;
  internet_service: string;
  support_tickets: number;
  tech_support: boolean;
  online_security: boolean;
  churn_score: number;
  risk_level: RiskLevel;
  last_contact_days_ago: number;
}

// Trend related types
export interface TrendDataPoint {
  month: string;
  churn_rate: number;
  total_customers: number;
  churned_customers: number;
}

export interface TrendResponse {
  data: TrendDataPoint[];
  current_month_churn: number;
  trend_direction: "increasing" | "decreasing" | "stable";
}

// Segmentation related types
export interface SegmentationResponse {
  low_risk: CustomerInfo[];
  medium_risk: CustomerInfo[];
  high_risk: CustomerInfo[];
  low_risk_count: number;
  medium_risk_count: number;
  high_risk_count: number;
  avg_low_score: number;
  avg_medium_score: number;
  avg_high_score: number;
}

// Model metrics
export interface ModelMetrics {
  model_version: string;
  train_date: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  total_customers_trained: number;
  features_used: string[];
}

// API Error type
export interface APIError {
  error: string;
  status_code: number;
  timestamp: string;
}

// Hook states
export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: APIError | null;
}
