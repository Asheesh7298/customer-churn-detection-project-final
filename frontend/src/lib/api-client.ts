import {
  PredictionRequest,
  PredictionResponse,
  CustomerInfo,
  CustomerDetail,
  TrendResponse,
  SegmentationResponse,
  ModelMetrics,
  ModelComparisonRow,
  WhatIfResponse,
  BusinessValueParams,
  BusinessValueResponse,
  CohortRow,
  APIError,
} from "./types";
import { mockApiClient } from "./mock-api";

// Vite exposes env vars prefixed with VITE_ via import.meta.env.
// Defaults to the live API; set VITE_API_BASE_URL (e.g. in .env.local) to
// point at a local backend instead, like http://localhost:8000.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://customer-churn-detection-project-final.onrender.com";
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || "30000");
const API_KEY = import.meta.env.VITE_API_KEY || "";
const FORCE_MOCK = import.meta.env.VITE_USE_MOCK_API === "true";

// Whether the live backend answered its health check. `null` = not yet probed.
let liveApi: boolean | null = FORCE_MOCK ? false : null;
let lastFailureAt = 0;
let inflight: Promise<boolean> | null = null;

// A free-tier backend can take ~30s to wake from sleep. A failed check is only
// trusted for this long; after that we probe again, so the app switches from
// demo data to live data once the API is up (the probe itself wakes it).
const RETRY_AFTER_MS = 15_000;

export function isLiveApi(): boolean {
  return liveApi === true;
}

async function checkLive(): Promise<boolean> {
  if (FORCE_MOCK) return false;
  if (liveApi === true) return true;
  if (liveApi === false && Date.now() - lastFailureAt < RETRY_AFTER_MS) return false;

  // Share one probe between the many components that ask at the same time.
  if (!inflight) {
    inflight = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`, {
          signal: AbortSignal.timeout(4000),
        });
        liveApi = res.ok;
      } catch {
        liveApi = false;
      }
      if (!liveApi) lastFailureAt = Date.now();
      return liveApi;
    })().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (API_KEY) h["X-API-Key"] = API_KEY;
  return h;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(API_TIMEOUT),
  });
  if (!res.ok) throw await asError(res);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(API_TIMEOUT),
  });
  if (!res.ok) throw await asError(res);
  return res.json();
}

async function asError(res: Response): Promise<APIError> {
  try {
    const data = await res.json();
    return {
      error: data.detail || data.error || res.statusText,
      status_code: res.status,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      error: `HTTP ${res.status}`,
      status_code: res.status,
      timestamp: new Date().toISOString(),
    };
  }
}

// --- map the friendly frontend request to raw Telco fields the model expects ---
function toTelco(r: PredictionRequest): Record<string, unknown> {
  const contract =
    r.contract_type === "two_year"
      ? "Two year"
      : r.contract_type === "one_year"
        ? "One year"
        : "Month-to-month";
  const internet =
    r.internet_service === "fiber"
      ? "Fiber optic"
      : r.internet_service === "dsl"
        ? "DSL"
        : "No";
  const hasInternet = internet !== "No";
  const svc = (on: boolean) =>
    !hasInternet ? "No internet service" : on ? "Yes" : "No";

  return {
    gender: "Male",
    SeniorCitizen: (r.age ?? 40) >= 65 ? 1 : 0,
    Partner: "No",
    Dependents: "No",
    tenure: Math.max(0, Math.round(r.tenure ?? 1)),
    PhoneService: "Yes",
    MultipleLines: "No",
    InternetService: internet,
    OnlineSecurity: svc(!!r.online_security),
    OnlineBackup: svc(false),
    DeviceProtection: svc(false),
    TechSupport: svc(!!r.tech_support),
    StreamingTV: svc(false),
    StreamingMovies: svc(false),
    Contract: contract,
    PaperlessBilling: "Yes",
    PaymentMethod: "Electronic check",
    MonthlyCharges: r.monthly_charges ?? 70,
    TotalCharges: r.total_charges ?? (r.monthly_charges ?? 70) * (r.tenure ?? 1),
  };
}

interface RawPrediction {
  churn_probability: number;
  churn_prediction: number;
  risk_level: string;
  top_contributions: {
    feature: string;
    value: string;
    shap_value: number;
    direction: string;
  }[];
  model_version: string;
  prediction_timestamp: string;
}

function fromRawPrediction(
  raw: RawPrediction,
  customerId: string
): PredictionResponse {
  return {
    customer_id: customerId,
    churn_probability: raw.churn_probability,
    risk_level: raw.risk_level as PredictionResponse["risk_level"],
    feature_importance: (raw.top_contributions || []).map((c) => ({
      feature: c.feature,
      importance: Math.abs(c.shap_value),
      contribution_direction:
        c.direction === "increases" ? "positive" : "negative",
      value: c.value,
    })),
    model_version: raw.model_version,
    prediction_timestamp: raw.prediction_timestamp,
  };
}

export const apiClient = {
  async predict(request: PredictionRequest): Promise<PredictionResponse> {
    if (!(await checkLive())) return mockApiClient.predict(request);
    try {
      const raw = await post<RawPrediction>("/predict", toTelco(request));
      return fromRawPrediction(raw, request.customer_id);
    } catch {
      return mockApiClient.predict(request);
    }
  },

  async predictRaw(telco: Record<string, unknown>): Promise<RawPrediction> {
    return post<RawPrediction>("/predict", telco);
  },

  async predictBatch(
    requests: PredictionRequest[]
  ): Promise<PredictionResponse[]> {
    return Promise.all(requests.map((r) => this.predict(r)));
  },

  async getCustomers(): Promise<CustomerInfo[]> {
    if (!(await checkLive())) return mockApiClient.getCustomers();
    try {
      const data = await get<{ customers: any[] }>("/customers?limit=100");
      return data.customers.map((c) => ({
        customer_id: c.customer_id,
        name: c.customer_id,
        age: 0,
        tenure: c.tenure,
        monthly_charges: c.monthly_charges,
        contract_type: c.contract_type,
      }));
    } catch {
      return mockApiClient.getCustomers();
    }
  },

  async getCustomerDetail(customerId: string): Promise<CustomerDetail> {
    if (!(await checkLive())) return mockApiClient.getCustomerDetail(customerId);
    try {
      const c = await get<any>(`/customers/${encodeURIComponent(customerId)}`);
      const f = c.features || {};
      return {
        customer_id: c.customer_id,
        name: c.customer_id,
        age: 0,
        tenure: f.tenure ?? 0,
        monthly_charges: f.MonthlyCharges ?? 0,
        total_charges: f.TotalCharges ?? 0,
        contract_type: f.Contract ?? "",
        internet_service: f.InternetService ?? "",
        support_tickets: 0,
        tech_support: f.TechSupport === "Yes",
        online_security: f.OnlineSecurity === "Yes",
        churn_score: c.churn_probability,
        risk_level: c.risk_level,
        last_contact_days_ago: 0,
      };
    } catch {
      return mockApiClient.getCustomerDetail(customerId);
    }
  },

  async getTrends(): Promise<TrendResponse> {
    // Cohort churn (real, from dataset labels) drives the trend view.
    if (!(await checkLive())) return mockApiClient.getTrends();
    try {
      const data = await get<{ cohorts: CohortRow[] }>("/cohorts");
      const points = data.cohorts.map((c) => ({
        month: c.cohort,
        churn_rate: c.churn_rate,
        total_customers: c.customers,
        churned_customers: c.churned,
      }));
      const current = points.length ? points[0].churn_rate : 0;
      return {
        data: points,
        current_month_churn: current,
        trend_direction: "decreasing",
      };
    } catch {
      return mockApiClient.getTrends();
    }
  },

  async getSegmentation(): Promise<SegmentationResponse> {
    if (!(await checkLive())) return mockApiClient.getSegmentation();
    try {
      const s = await get<any>("/segmentation");
      const toInfo = (arr: any[]): CustomerInfo[] =>
        (arr || []).map((c) => ({
          customer_id: c.customer_id,
          name: c.customer_id,
          age: 0,
          tenure: 0,
          monthly_charges: c.monthly_charges,
          contract_type: c.contract_type,
        }));
      return {
        low_risk: toInfo(s.low.customers),
        medium_risk: toInfo(s.medium.customers),
        high_risk: toInfo(s.high.customers),
        low_risk_count: s.low.count,
        medium_risk_count: s.medium.count,
        high_risk_count: s.high.count,
        avg_low_score: s.low.avg_probability,
        avg_medium_score: s.medium.avg_probability,
        avg_high_score: s.high.avg_probability,
      };
    } catch {
      return mockApiClient.getSegmentation();
    }
  },

  async getModelMetrics(): Promise<ModelMetrics> {
    if (!(await checkLive())) return mockApiClient.getModelMetrics();
    try {
      return await get<ModelMetrics>("/model/metrics");
    } catch {
      return mockApiClient.getModelMetrics();
    }
  },

  async getModelComparison(): Promise<ModelComparisonRow[]> {
    const data = await get<{ models: ModelComparisonRow[] }>(
      "/model/comparison"
    );
    return data.models;
  },

  async getWhatIf(telco: Record<string, unknown>): Promise<WhatIfResponse> {
    return post<WhatIfResponse>("/whatif", telco);
  },

  async getBusinessValue(
    params: BusinessValueParams
  ): Promise<BusinessValueResponse> {
    return post<BusinessValueResponse>("/business-value", params);
  },

  async getCohorts(): Promise<CohortRow[]> {
    const data = await get<{ cohorts: CohortRow[] }>("/cohorts");
    return data.cohorts;
  },

  async getSampleBatch(
    n = 20
  ): Promise<Record<string, unknown>[]> {
    const data = await get<{ rows: Record<string, unknown>[] }>(
      `/sample-batch?n=${n}`
    );
    return data.rows;
  },

  async scoreBatch(rows: Record<string, unknown>[]): Promise<
    { index: number; churn_probability: number; churn_prediction: number; risk_level: string }[]
  > {
    const data = await post<{
      results: {
        index: number;
        churn_probability: number;
        churn_prediction: number;
        risk_level: string;
      }[];
    }>("/predict/batch", rows);
    return data.results;
  },

  async healthCheck(): Promise<{ status: string }> {
    if (!(await checkLive())) return mockApiClient.healthCheck();
    try {
      return await get<{ status: string }>("/health");
    } catch {
      return mockApiClient.healthCheck();
    }
  },
};

export { toTelco };
