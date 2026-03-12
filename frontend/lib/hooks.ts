"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "./api-client";
import {
  PredictionRequest,
  PredictionResponse,
  CustomerInfo,
  CustomerDetail,
  TrendResponse,
  SegmentationResponse,
  ModelMetrics,
  APIError,
  UseApiState,
} from "./types";

// Generic hook for API calls
function useApiCall<T>(
  apiFn: () => Promise<T>,
  immediate: boolean = true,
  dependencies: any[] = []
): UseApiState<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiFn();
      setState({ data, loading: false, error: null });
    } catch (error) {
      const apiError =
        error instanceof Error
          ? {
              error: error.message,
              status_code: 0,
              timestamp: new Date().toISOString(),
            }
          : (error as APIError);
      setState({ data: null, loading: false, error: apiError });
    }
  }, [apiFn]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, dependencies);

  return { ...state, refetch: fetchData } as UseApiState<T> & {
    refetch: () => Promise<void>;
  };
}

// Hook for predictions
export function usePrediction() {
  const [state, setState] = useState<
    UseApiState<PredictionResponse> & { isSubmitting?: boolean }
  >({
    data: null,
    loading: false,
    error: null,
    isSubmitting: false,
  });

  const predict = useCallback(async (request: PredictionRequest) => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));
    try {
      const data = await apiClient.predict(request);
      setState({ data, loading: false, error: null, isSubmitting: false });
      return data;
    } catch (error) {
      const apiError =
        error instanceof Error
          ? {
              error: error.message,
              status_code: 0,
              timestamp: new Date().toISOString(),
            }
          : (error as APIError);
      setState({
        data: null,
        loading: false,
        error: apiError,
        isSubmitting: false,
      });
      throw error;
    }
  }, []);

  return { ...state, predict };
}

// Hook for customer list
export function useCustomerList(immediate: boolean = true) {
  const [state, setState] = useState<
    UseApiState<CustomerInfo[]> & { refetch?: () => Promise<void> }
  >({
    data: null,
    loading: false,
    error: null,
  });

  const fetchCustomers = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiClient.getCustomers();
      setState({ data, loading: false, error: null });
    } catch (error) {
      const apiError =
        error instanceof Error
          ? {
              error: error.message,
              status_code: 0,
              timestamp: new Date().toISOString(),
            }
          : (error as APIError);
      setState({ data: null, loading: false, error: apiError });
    }
  }, []);

  useEffect(() => {
    if (immediate) {
      fetchCustomers();
    }
  }, [immediate, fetchCustomers]);

  return { ...state, refetch: fetchCustomers };
}

// Hook for customer detail
export function useCustomerDetail(
  customerId: string | null,
  immediate: boolean = true
) {
  const [state, setState] = useState<
    UseApiState<CustomerDetail> & { refetch?: () => Promise<void> }
  >({
    data: null,
    loading: false,
    error: null,
  });

  const fetchCustomerDetail = useCallback(async () => {
    if (!customerId) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiClient.getCustomerDetail(customerId);
      setState({ data, loading: false, error: null });
    } catch (error) {
      const apiError =
        error instanceof Error
          ? {
              error: error.message,
              status_code: 0,
              timestamp: new Date().toISOString(),
            }
          : (error as APIError);
      setState({ data: null, loading: false, error: apiError });
    }
  }, [customerId]);

  useEffect(() => {
    if (immediate && customerId) {
      fetchCustomerDetail();
    }
  }, [customerId, immediate, fetchCustomerDetail]);

  return { ...state, refetch: fetchCustomerDetail };
}

// Hook for trends
export function useTrendData(
  immediate: boolean = true,
  pollInterval: number = 0
) {
  const [state, setState] = useState<
    UseApiState<TrendResponse> & { refetch?: () => Promise<void> }
  >({
    data: null,
    loading: false,
    error: null,
  });

  const fetchTrends = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiClient.getTrends();
      setState({ data, loading: false, error: null });
    } catch (error) {
      const apiError =
        error instanceof Error
          ? {
              error: error.message,
              status_code: 0,
              timestamp: new Date().toISOString(),
            }
          : (error as APIError);
      setState({ data: null, loading: false, error: apiError });
    }
  }, []);

  useEffect(() => {
    if (immediate) {
      fetchTrends();
    }

    if (pollInterval > 0) {
      const interval = setInterval(fetchTrends, pollInterval);
      return () => clearInterval(interval);
    }
  }, [immediate, pollInterval, fetchTrends]);

  return { ...state, refetch: fetchTrends };
}

// Hook for segmentation
export function useSegmentation(immediate: boolean = true) {
  const [state, setState] = useState<
    UseApiState<SegmentationResponse> & { refetch?: () => Promise<void> }
  >({
    data: null,
    loading: false,
    error: null,
  });

  const fetchSegmentation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiClient.getSegmentation();
      setState({ data, loading: false, error: null });
    } catch (error) {
      const apiError =
        error instanceof Error
          ? {
              error: error.message,
              status_code: 0,
              timestamp: new Date().toISOString(),
            }
          : (error as APIError);
      setState({ data: null, loading: false, error: apiError });
    }
  }, []);

  useEffect(() => {
    if (immediate) {
      fetchSegmentation();
    }
  }, [immediate, fetchSegmentation]);

  return { ...state, refetch: fetchSegmentation };
}

// Hook for model metrics
export function useModelMetrics(immediate: boolean = true) {
  const [state, setState] = useState<
    UseApiState<ModelMetrics> & { refetch?: () => Promise<void> }
  >({
    data: null,
    loading: false,
    error: null,
  });

  const fetchMetrics = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiClient.getModelMetrics();
      setState({ data, loading: false, error: null });
    } catch (error) {
      const apiError =
        error instanceof Error
          ? {
              error: error.message,
              status_code: 0,
              timestamp: new Date().toISOString(),
            }
          : (error as APIError);
      setState({ data: null, loading: false, error: apiError });
    }
  }, []);

  useEffect(() => {
    if (immediate) {
      fetchMetrics();
    }
  }, [immediate, fetchMetrics]);

  return { ...state, refetch: fetchMetrics };
}

// Hook for polling top risk customers
export function useTopRiskCustomers(pollInterval: number = 30000) {
  const [customers, setCustomers] = useState<
    (PredictionResponse & { name?: string })[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  const fetchTopRisk = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allCustomers = await apiClient.getCustomers();
      const predictions = await apiClient.predictBatch(
        allCustomers.slice(0, 20).map((c) => ({
          customer_id: c.customer_id,
          age: c.age,
          tenure: c.tenure,
          monthly_charges: c.monthly_charges,
          total_charges: c.monthly_charges * c.tenure || 100,
          contract_type: (c.contract_type as any) || "month-to-month",
          internet_service: "fiber",
          monthly_usage_gb: 100,
          support_tickets: 2,
          tech_support: true,
          online_security: false,
        }))
      );

      const enriched = predictions.map((p, i) => ({
        ...p,
        name: allCustomers[i]?.name,
      }));

      setCustomers(enriched.sort((a, b) => b.churn_probability - a.churn_probability));
      setLoading(false);
    } catch (err) {
      const apiError =
        err instanceof Error
          ? {
              error: err.message,
              status_code: 0,
              timestamp: new Date().toISOString(),
            }
          : (err as APIError);
      setError(apiError);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopRisk();
    const interval = setInterval(fetchTopRisk, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval, fetchTopRisk]);

  return { customers, loading, error, refetch: fetchTopRisk };
}
