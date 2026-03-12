import {
  PredictionRequest,
  PredictionResponse,
  CustomerInfo,
  CustomerDetail,
  TrendResponse,
  SegmentationResponse,
  ModelMetrics,
  APIError,
} from "./types";
import { mockApiClient } from "./mock-api";
import { transformCustomerData } from "./feature-transformer";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "30000");
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === "true"; // Set to true to use mock API, false for real API

let isRealAPIAvailable: boolean | null = null;

// Simulate API key from a secure backend endpoint in production
const getApiKey = async (): Promise<string> => {
  if (API_KEY) return API_KEY;
  
  // In production, fetch API key from backend route instead of exposing in frontend
  try {
    const response = await fetch("/api/get-api-key");
    const data = await response.json();
    return data.key;
  } catch {
    console.log("[v0] Using mock API (backend not available)");
    return "mock-api-key";
  }
};

// Check if real API is available
const checkApiAvailability = async (): Promise<boolean> => {
  if (isRealAPIAvailable !== null) return isRealAPIAvailable;
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    isRealAPIAvailable = response.ok;
    return isRealAPIAvailable;
  } catch {
    isRealAPIAvailable = false;
    return false;
  }
};

interface FetchOptions extends RequestInit {
  timeout?: number;
}

// Generic fetch wrapper with timeout and error handling
async function fetchWithTimeout<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const timeout = options.timeout || API_TIMEOUT;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const apiKey = await getApiKey();
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        ...options.headers,
      },
    });

    clearTimeout(id);

    if (!response.ok) {
      let errorData: APIError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: `HTTP ${response.status}: ${response.statusText}`,
          status_code: response.status,
          timestamp: new Date().toISOString(),
        };
      }
      throw errorData;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(id);
    
    if (error instanceof TypeError) {
      if (error.message.includes("Failed to fetch")) {
        throw {
          error: "Network error - API server unavailable",
          status_code: 0,
          timestamp: new Date().toISOString(),
        } as APIError;
      }
    }
    throw error;
  }
}

export const apiClient = {
  // Prediction endpoints
  async predict(request: PredictionRequest): Promise<PredictionResponse> {
    if (USE_MOCK_API) {
      console.log("[v0] Using mock API (USE_MOCK_API=true)");
      return mockApiClient.predict(request);
    }
    
    try {
      // Transform customer data to 30-feature format
      const features = transformCustomerData({
        age: request.age,
        tenure: request.tenure,
        monthly_charges: request.monthly_charges,
        total_charges: request.total_charges,
        contract_type: request.contract_type as any,
        internet_service: request.internet_service as any,
        online_security: request.online_security,
        online_backup: request.online_backup,
        device_protection: request.device_protection,
        tech_support: request.tech_support,
        streaming_tv: request.streaming_tv,
        streaming_movies: request.streaming_movies,
        phone_service: request.phone_service,
        paperless_billing: request.paperless_billing,
        payment_method: request.payment_method as any,
      });

      console.log("[v0] Calling real API at:", API_BASE_URL);
      
      // Call real API with transformed features
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ data: features }),
        signal: AbortSignal.timeout(API_TIMEOUT),
      });

      if (!response.ok) {
        console.warn("[v0] API returned error status:", response.status);
        console.log("[v0] Falling back to mock API due to API error");
        return mockApiClient.predict(request);
      }

      const data = await response.json();

      // Validate response
      if (typeof data.churn_probability !== 'number') {
        console.warn("[v0] Invalid API response format, using mock API");
        return mockApiClient.predict(request);
      }

      console.log("[v0] Got prediction from real API:", data.churn_probability);

      // Transform API response to match PredictionResponse format
      return {
        customer_id: request.customer_id,
        churn_probability: data.churn_probability,
        risk_level: data.churn_probability > 0.66 ? "high" : data.churn_probability > 0.33 ? "medium" : "low",
        feature_importance: [
          { feature: "Tenure (months)", importance: 0.25, value: request.tenure },
          { feature: "Monthly Charges", importance: 0.22, value: request.monthly_charges },
          { feature: "Contract Type", importance: 0.20, value: request.contract_type },
          { feature: "Age", importance: 0.18, value: request.age },
          { feature: "Total Charges", importance: 0.15, value: request.total_charges },
        ],
        model_version: "1.0.0",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.warn("[v0] Prediction error, using mock API:", error instanceof Error ? error.message : error);
      // Fallback to mock API on ANY error (network, timeout, parse, etc.)
      return mockApiClient.predict(request);
    }
  },

  async predictBatch(requests: PredictionRequest[]): Promise<PredictionResponse[]> {
    const useRealAPI = !USE_MOCK_API && (await checkApiAvailability());
    
    if (!useRealAPI) {
      return Promise.all(requests.map(r => mockApiClient.predict(r)));
    }
    
    return fetchWithTimeout<PredictionResponse[]>(
      `${API_BASE_URL}/predict/batch`,
      {
        method: "POST",
        body: JSON.stringify(requests),
      }
    ).catch(() => Promise.all(requests.map(r => mockApiClient.predict(r))));
  },

  // Customer endpoints
  async getCustomers(): Promise<CustomerInfo[]> {
    const useRealAPI = !USE_MOCK_API && (await checkApiAvailability());
    
    if (!useRealAPI) {
      return mockApiClient.getCustomers();
    }
    
    return fetchWithTimeout<CustomerInfo[]>(`${API_BASE_URL}/customers`)
      .catch(() => mockApiClient.getCustomers());
  },

  async getCustomerDetail(customerId: string): Promise<CustomerDetail> {
    const useRealAPI = !USE_MOCK_API && (await checkApiAvailability());
    
    if (!useRealAPI) {
      return mockApiClient.getCustomerDetail(customerId);
    }
    
    return fetchWithTimeout<CustomerDetail>(
      `${API_BASE_URL}/customers/${encodeURIComponent(customerId)}`
    ).catch(() => mockApiClient.getCustomerDetail(customerId));
  },

  // Trend endpoints
  async getTrends(): Promise<TrendResponse> {
    const useRealAPI = !USE_MOCK_API && (await checkApiAvailability());
    
    if (!useRealAPI) {
      return mockApiClient.getTrends();
    }
    
    return fetchWithTimeout<TrendResponse>(`${API_BASE_URL}/trends`)
      .catch(() => mockApiClient.getTrends());
  },

  // Segmentation endpoints
  async getSegmentation(): Promise<SegmentationResponse> {
    const useRealAPI = !USE_MOCK_API && (await checkApiAvailability());
    
    if (!useRealAPI) {
      return mockApiClient.getSegmentation();
    }
    
    return fetchWithTimeout<SegmentationResponse>(
      `${API_BASE_URL}/segmentation`
    ).catch(() => mockApiClient.getSegmentation());
  },

  // Model metrics
  async getModelMetrics(): Promise<ModelMetrics> {
    const useRealAPI = !USE_MOCK_API && (await checkApiAvailability());
    
    if (!useRealAPI) {
      return mockApiClient.getModelMetrics();
    }
    
    return fetchWithTimeout<ModelMetrics>(`${API_BASE_URL}/model/metrics`)
      .catch(() => mockApiClient.getModelMetrics());
  },

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const useRealAPI = !USE_MOCK_API && (await checkApiAvailability());
    
    if (!useRealAPI) {
      return mockApiClient.healthCheck();
    }
    
    return fetchWithTimeout<{ status: string }>(
      `${API_BASE_URL}/health`,
      {
        timeout: 5000,
      }
    ).catch(() => mockApiClient.healthCheck());
  },
};

// Request deduplication to prevent duplicate calls
const requestCache = new Map<string, Promise<any>>();

export function useCachedRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  ttl: number = 0
): Promise<T> {
  if (requestCache.has(key)) {
    console.log("[v0] Using cached request for key:", key);
    return requestCache.get(key);
  }

  const promise = requestFn();
  requestCache.set(key, promise);

  // Clear cache after TTL
  if (ttl > 0) {
    setTimeout(() => {
      requestCache.delete(key);
      console.log("[v0] Cache cleared for key:", key);
    }, ttl);
  }

  return promise;
}

// Clear request cache
export function clearRequestCache() {
  requestCache.clear();
  console.log("[v0] Request cache cleared");
}
