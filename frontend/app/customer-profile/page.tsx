"use client";

import { useState, useEffect } from "react";
import { useCustomerList, usePrediction, useCustomerDetail } from "@/lib/hooks";
import { PredictionResult } from "@/components/prediction-result";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContractType, InternetService } from "@/lib/types";
import { AlertCircle } from "lucide-react";

export default function CustomerProfilePage() {
  const { data: customers, loading: customersLoading } = useCustomerList();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const { data: customerDetail } = useCustomerDetail(
    selectedCustomerId || null
  );

  const { data: prediction, isSubmitting, error: predictionError, predict } =
    usePrediction();

  // Form state
  const [formData, setFormData] = useState({
    age: 35,
    tenure: 12,
    monthly_charges: 65.5,
    total_charges: 786,
    contract_type: "month-to-month" as ContractType,
    internet_service: "fiber" as InternetService,
    monthly_usage_gb: 250,
    support_tickets: 2,
    tech_support: true,
    online_security: false,
  });

  // Auto-predict only when customer is selected (not on every form field change)
  useEffect(() => {
    if (selectedCustomerId && !isSubmitting && customerDetail) {
      const autoPredict = async () => {
        try {
          console.log("[v0] Auto-predicting for customer:", selectedCustomerId);
          await predict({
            customer_id: selectedCustomerId,
            ...formData,
          });
        } catch (error) {
          console.error("[v0] Auto-predict error:", error);
        }
      };

      // Only predict when customer is selected, with debounce
      const timer = setTimeout(autoPredict, 800);
      return () => clearTimeout(timer);
    }
  }, [selectedCustomerId, customerDetail]); // Only these trigger new predictions

  // Auto-select first customer
  useEffect(() => {
    if (customers && customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].customer_id);
    }
  }, [customers, selectedCustomerId]);

  // Load customer data when selected
  useEffect(() => {
    if (customerDetail && customerDetail.contract_type) {
      const contractType = customerDetail.contract_type.toLowerCase();
      setFormData({
        age: customerDetail.age,
        tenure: customerDetail.tenure,
        monthly_charges: customerDetail.monthly_charges,
        total_charges: customerDetail.total_charges,
        contract_type: (contractType.includes("month")
          ? "month-to-month"
          : contractType.includes("one")
            ? "one_year"
            : "two_year") as ContractType,
        internet_service: (customerDetail.internet_service?.toLowerCase?.() || "fiber") as InternetService,
        monthly_usage_gb: 250,
        support_tickets: customerDetail.support_tickets || 0,
        tech_support: customerDetail.tech_support || false,
        online_security: customerDetail.online_security || false,
      });
    }
  }, [customerDetail]);

  const handleManualPredict = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      alert("Please select a customer");
      return;
    }

    try {
      await predict({
        customer_id: selectedCustomerId,
        ...formData,
      });
    } catch (error) {
      console.error("Prediction error:", error);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <PageHeader title="Customer Profile">
        Select a customer and adjust their attributes to predict churn risk and
        see the factors behind it.
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <form onSubmit={handleManualPredict} className="space-y-6">
              {/* Customer Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                  disabled={customersLoading}
                >
                  <option value="">Choose a customer...</option>
                  {customers?.map((c) => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.customer_id} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Demographics */}
              <div className="space-y-4">
                <h3 className="font-semibold">Demographics</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Age</label>
                    <Input
                      type="number"
                      min="18"
                      max="120"
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          age: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Tenure (months)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="72"
                      value={formData.tenure}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tenure: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Charges */}
              <div className="space-y-4">
                <h3 className="font-semibold">Billing</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Monthly Charges ($)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.monthly_charges}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthly_charges: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Total Charges ($)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.total_charges}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          total_charges: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="space-y-4">
                <h3 className="font-semibold">Services</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Contract Type
                    </label>
                    <select
                      value={formData.contract_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contract_type: e.target.value as ContractType,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                    >
                      <option value="month-to-month">Month-to-Month</option>
                      <option value="one_year">1 Year</option>
                      <option value="two_year">2 Year</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Internet Service
                    </label>
                    <select
                      value={formData.internet_service}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          internet_service: e.target.value as InternetService,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                    >
                      <option value="fiber">Fiber</option>
                      <option value="dsl">DSL</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Monthly Usage (GB)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.monthly_usage_gb}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthly_usage_gb: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Support Tickets
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.support_tickets}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        support_tickets: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.tech_support}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tech_support: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Tech Support</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.online_security}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          online_security: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">
                      Online Security
                    </span>
                  </label>
                </div>
              </div>

              {/* Error */}
              {predictionError && (
                <div className="flex gap-3 p-4 bg-red-50 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Prediction Error</p>
                    <p>{predictionError.error}</p>
                  </div>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting || !selectedCustomerId}
                className="w-full"
              >
                {isSubmitting ? "Predicting..." : "Predict Churn Risk"}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Click to get prediction. Auto-predicts when you select a customer.
              </p>
            </form>
          </Card>
        </div>

        {/* Prediction Result */}
        <div className="space-y-6">
          {prediction ? (
            <>
              <PredictionResult prediction={prediction} />

              {/* SHAP feature contributions */}
              {prediction.feature_importance.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold">Why this prediction?</h3>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    SHAP contributions — how each feature pushed this
                    customer&apos;s churn risk up or down.
                  </p>
                  <div className="space-y-3">
                    {(() => {
                      const maxImp = Math.max(
                        ...prediction.feature_importance.map((f) => f.importance),
                        0.0001
                      );
                      return prediction.feature_importance.map((feat, i) => {
                        const up = feat.contribution_direction === "positive";
                        return (
                          <div key={i} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm gap-2">
                              <span className="font-medium truncate">
                                {feat.feature}
                                {feat.value !== undefined && (
                                  <span className="text-muted-foreground font-normal">
                                    {" "}
                                    = {String(feat.value)}
                                  </span>
                                )}
                              </span>
                              <span
                                className={`text-xs font-semibold shrink-0 ${
                                  up
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {up ? "↑ Risk" : "↓ Risk"}
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className={`h-full rounded-full ${
                                  up ? "bg-red-500" : "bg-emerald-500"
                                }`}
                                style={{
                                  width: `${(feat.importance / maxImp) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                Select a customer and click "Predict" to see results
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
