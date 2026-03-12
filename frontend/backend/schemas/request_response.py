from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum


class ContractType(str, Enum):
    MONTH_TO_MONTH = "month-to-month"
    ONE_YEAR = "one_year"
    TWO_YEAR = "two_year"


class PredictionRequest(BaseModel):
    """Request schema for churn prediction"""
    customer_id: str = Field(..., description="Unique customer identifier")
    age: int = Field(..., ge=18, le=120, description="Customer age")
    tenure: int = Field(..., ge=0, le=72, description="Months as customer")
    monthly_charges: float = Field(..., gt=0, le=10000, description="Monthly bill amount")
    total_charges: float = Field(..., ge=0, le=1000000, description="Total lifetime charges")
    contract_type: ContractType = Field(..., description="Contract type")
    internet_service: Literal["fiber", "dsl", "none"] = Field(..., description="Internet service type")
    monthly_usage_gb: float = Field(..., ge=0, le=5000, description="Monthly data usage in GB")
    support_tickets: int = Field(..., ge=0, le=100, description="Number of support tickets")
    tech_support: bool = Field(..., description="Has tech support")
    online_security: bool = Field(..., description="Has online security")


class FeatureImportance(BaseModel):
    """Feature importance from SHAP"""
    feature: str
    importance: float
    contribution_direction: Literal["positive", "negative"]


class PredictionResponse(BaseModel):
    """Response schema for churn prediction"""
    customer_id: str
    churn_probability: float = Field(..., ge=0, le=1, description="Churn probability 0-1")
    risk_level: Literal["low", "medium", "high"]
    feature_importance: List[FeatureImportance]
    model_version: str
    prediction_timestamp: str


class CustomerInfo(BaseModel):
    """Customer basic information"""
    customer_id: str
    name: str
    age: int
    tenure: int
    monthly_charges: float
    contract_type: str


class CustomerDetailResponse(BaseModel):
    """Detailed customer profile"""
    customer_id: str
    name: str
    age: int
    tenure: int
    monthly_charges: float
    total_charges: float
    contract_type: str
    internet_service: str
    support_tickets: int
    tech_support: bool
    online_security: bool
    churn_score: float
    risk_level: str
    last_contact_days_ago: int


class TrendDataPoint(BaseModel):
    """Single data point for trend analysis"""
    month: str
    churn_rate: float
    total_customers: int
    churned_customers: int


class TrendResponse(BaseModel):
    """Response for trend analysis"""
    data: List[TrendDataPoint]
    current_month_churn: float
    trend_direction: Literal["increasing", "decreasing", "stable"]


class SegmentationResponse(BaseModel):
    """Customer segmentation by risk level"""
    low_risk: List[CustomerInfo]
    medium_risk: List[CustomerInfo]
    high_risk: List[CustomerInfo]
    low_risk_count: int
    medium_risk_count: int
    high_risk_count: int
    avg_low_score: float
    avg_medium_score: float
    avg_high_score: float


class ModelMetrics(BaseModel):
    """Model performance metrics"""
    model_version: str
    train_date: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    total_customers_trained: int
    features_used: List[str]


class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str
    status_code: int
    timestamp: str
