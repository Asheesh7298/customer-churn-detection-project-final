"""FastAPI application: real churn predictions, explanations, and analytics."""

from __future__ import annotations

from datetime import datetime, timezone

import pandas as pd
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import catalog, config, db
from .model import get_model
from .schemas import (
    BusinessValueParams,
    BusinessValueResponse,
    CustomerFeatures,
    PredictionResponse,
    WhatIfResponse,
)

app = FastAPI(
    title="Churn Prediction API",
    version="2.0.0",
    description="Real ML churn predictions with SHAP explanations and "
    "business-value analytics, trained on the IBM Telco dataset.",
)

_origins = ["*"] if config.FRONTEND_ORIGINS == "*" else [
    o.strip() for o in config.FRONTEND_ORIGINS.split(",")
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=config.FRONTEND_ORIGINS != "*",
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-API-Key"],
)

# "What-if" retention levers: field -> (value, human label).
WHATIF_LEVERS = [
    ("Contract", "Two year", "Switch to a two-year contract"),
    ("OnlineSecurity", "Yes", "Add online security"),
    ("TechSupport", "Yes", "Add tech support"),
    ("PaymentMethod", "Credit card (automatic)", "Move to automatic card payment"),
    ("PaperlessBilling", "No", "Switch off paperless billing"),
    ("InternetService", "DSL", "Downgrade fiber to DSL"),
]


def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    """Validate the API key when one is configured; no-op otherwise."""
    if config.API_KEY and x_api_key != config.API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


@app.on_event("startup")
def _startup() -> None:
    db.init_db()
    get_model()  # warm the model + SHAP explainer


@app.get("/health")
def health() -> dict:
    m = get_model()
    return {
        "status": "healthy",
        "model_version": m.metrics.get("model_version"),
        "model_type": m.metrics.get("model_type"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/model/metrics")
def model_metrics() -> dict:
    return get_model().metrics


@app.get("/model/comparison")
def model_comparison() -> dict:
    return get_model().comparison


@app.get("/model/feature-importance")
def feature_importance() -> dict:
    return get_model().feature_importance


@app.post("/predict", response_model=PredictionResponse, dependencies=[Depends(require_api_key)])
def predict(customer: CustomerFeatures, customer_id: str | None = Query(default=None)):
    model = get_model()
    df = pd.DataFrame([customer.model_dump()])
    prob = float(model.predict_proba(df)[0])
    risk = config.risk_level(prob)

    db.log_prediction(prob, risk, customer.MonthlyCharges)

    return PredictionResponse(
        customer_id=customer_id,
        churn_probability=prob,
        churn_prediction=int(prob >= 0.5),
        risk_level=risk,
        top_contributions=model.explain(df),
        model_version=model.metrics.get("model_version", "2.0.0"),
        prediction_timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/whatif", response_model=WhatIfResponse, dependencies=[Depends(require_api_key)])
def whatif(customer: CustomerFeatures):
    model = get_model()
    base = customer.model_dump()
    base_prob = float(model.predict_proba(pd.DataFrame([base]))[0])

    scenarios = []
    for field, value, label in WHATIF_LEVERS:
        if base.get(field) == value:
            continue  # already at this setting
        variant = {**base, field: value}
        prob = float(model.predict_proba(pd.DataFrame([variant]))[0])
        scenarios.append(
            {
                "field": field,
                "label": label,
                "churn_probability": prob,
                "delta": prob - base_prob,
            }
        )
    scenarios.sort(key=lambda s: s["delta"])  # biggest reduction first
    return WhatIfResponse(baseline_probability=base_prob, scenarios=scenarios)


@app.post("/predict/batch", dependencies=[Depends(require_api_key)])
async def predict_batch(payload: list[CustomerFeatures]):
    if not payload:
        raise HTTPException(status_code=422, detail="Empty batch")
    if len(payload) > 5000:
        raise HTTPException(status_code=422, detail="Batch too large (max 5000)")
    model = get_model()
    df = pd.DataFrame([c.model_dump() for c in payload])
    probs = model.predict_proba(df)
    return {
        "count": len(probs),
        "results": [
            {
                "index": i,
                "churn_probability": float(p),
                "churn_prediction": int(p >= 0.5),
                "risk_level": config.risk_level(float(p)),
            }
            for i, p in enumerate(probs)
        ],
    }


@app.get("/customers")
def customers(limit: int = Query(default=100, ge=1, le=250)):
    return {"customers": catalog.list_customers(limit=limit)}


@app.get("/customers/{customer_id}")
def customer_detail(customer_id: str):
    detail = catalog.get_customer(customer_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return detail


@app.get("/segmentation")
def segmentation():
    return catalog.segmentation()


@app.get("/sample-batch")
def sample_batch(n: int = Query(default=20, ge=1, le=200)):
    """Real customer rows (raw Telco fields) for the batch-scoring demo."""
    return {"rows": catalog.sample_feature_rows(n)}


@app.get("/cohorts")
def cohorts():
    """Real churn rate by tenure cohort (from dataset labels)."""
    return {"cohorts": catalog.cohort_churn()}


@app.get("/trends")
def trends(days: int = Query(default=14, ge=1, le=90)):
    """Live prediction volume and average risk from the prediction log."""
    return {"trends": db.prediction_trends(days=days)}


@app.post("/business-value", response_model=BusinessValueResponse)
def business_value(params: BusinessValueParams):
    return catalog.business_value(params)
