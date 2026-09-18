"""Pydantic request/response models.

The customer schema mirrors the raw Telco dataset columns exactly, so the
trained sklearn Pipeline can consume a request row without any hand-rolled
feature engineering on the client.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

YesNo = Literal["Yes", "No"]


class CustomerFeatures(BaseModel):
    """A single customer described in raw Telco fields."""

    gender: Literal["Male", "Female"] = "Male"
    SeniorCitizen: Literal[0, 1] = 0
    Partner: YesNo = "No"
    Dependents: YesNo = "No"
    tenure: int = Field(1, ge=0, le=100)
    PhoneService: YesNo = "Yes"
    MultipleLines: Literal["Yes", "No", "No phone service"] = "No"
    InternetService: Literal["DSL", "Fiber optic", "No"] = "Fiber optic"
    OnlineSecurity: Literal["Yes", "No", "No internet service"] = "No"
    OnlineBackup: Literal["Yes", "No", "No internet service"] = "No"
    DeviceProtection: Literal["Yes", "No", "No internet service"] = "No"
    TechSupport: Literal["Yes", "No", "No internet service"] = "No"
    StreamingTV: Literal["Yes", "No", "No internet service"] = "No"
    StreamingMovies: Literal["Yes", "No", "No internet service"] = "No"
    Contract: Literal["Month-to-month", "One year", "Two year"] = "Month-to-month"
    PaperlessBilling: YesNo = "Yes"
    PaymentMethod: Literal[
        "Electronic check",
        "Mailed check",
        "Bank transfer (automatic)",
        "Credit card (automatic)",
    ] = "Electronic check"
    MonthlyCharges: float = Field(70.0, ge=0, le=1000)
    TotalCharges: float = Field(70.0, ge=0, le=100000)


class Contribution(BaseModel):
    feature: str
    value: str
    shap_value: float
    direction: Literal["increases", "decreases"]


class PredictionResponse(BaseModel):
    # "model_version" is a real field name here, not a Pydantic model attribute.
    model_config = {"protected_namespaces": ()}

    customer_id: Optional[str] = None
    churn_probability: float
    churn_prediction: int
    risk_level: str
    top_contributions: list[Contribution]
    model_version: str
    prediction_timestamp: str


class WhatIfChange(BaseModel):
    field: str
    label: str
    churn_probability: float
    delta: float  # change vs. the baseline probability


class WhatIfResponse(BaseModel):
    baseline_probability: float
    scenarios: list[WhatIfChange]


class BusinessValueParams(BaseModel):
    threshold: float = Field(0.5, ge=0, le=1)
    expected_lifetime_months: int = Field(24, ge=1, le=120)
    retention_offer_cost: float = Field(50.0, ge=0)
    retention_success_rate: float = Field(0.30, ge=0, le=1)


class BusinessValueResponse(BaseModel):
    threshold: float
    customers_evaluated: int
    customers_flagged: int
    revenue_at_risk: float
    intervention_cost: float
    expected_revenue_saved: float
    net_benefit: float
    roi: float
    precision_at_threshold: Optional[float] = None
    recall_at_threshold: Optional[float] = None
