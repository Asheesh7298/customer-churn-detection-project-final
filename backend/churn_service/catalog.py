"""Real customer catalog derived from the Telco dataset.

Loads a sample of genuine customers, scores them with the trained model, and
serves the dashboard's customer list, segmentation, cohort churn, and
business-value analytics. Nothing here is fabricated: churn cohorts use the
dataset's real labels, and risk scores come from the real model.
"""

from __future__ import annotations

from functools import lru_cache

import pandas as pd

from . import config
from .model import get_model

SAMPLE_SIZE = 250
RANDOM_STATE = 42


@lru_cache(maxsize=1)
def _full_dataset() -> pd.DataFrame:
    df = pd.read_csv(config.DATA_PATH)
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce").fillna(0.0)
    df["ChurnLabel"] = (df["Churn"].astype(str).str.strip() == "Yes").astype(int)
    return df


@lru_cache(maxsize=1)
def _scored_customers() -> pd.DataFrame:
    """A stable sample of real customers with model churn scores attached."""
    df = _full_dataset().sample(SAMPLE_SIZE, random_state=RANDOM_STATE).copy()
    feature_cols = [c for c in df.columns if c not in ("customerID", "Churn", "ChurnLabel")]
    probs = get_model().predict_proba(df[feature_cols])
    df = df.reset_index(drop=True)
    df["churn_probability"] = probs
    df["risk_level"] = [config.risk_level(p) for p in probs]
    return df


def list_customers(limit: int = 250, sort_by_risk: bool = True) -> list[dict]:
    df = _scored_customers()
    if sort_by_risk:
        df = df.sort_values("churn_probability", ascending=False)
    out = []
    for _, r in df.head(limit).iterrows():
        out.append(
            {
                "customer_id": r["customerID"],
                "tenure": int(r["tenure"]),
                "monthly_charges": float(r["MonthlyCharges"]),
                "contract_type": r["Contract"],
                "internet_service": r["InternetService"],
                "churn_probability": float(r["churn_probability"]),
                "risk_level": r["risk_level"],
                "actual_churn": int(r["ChurnLabel"]),
            }
        )
    return out


def get_customer(customer_id: str) -> dict | None:
    df = _scored_customers()
    match = df[df["customerID"] == customer_id]
    if match.empty:
        return None
    r = match.iloc[0]
    feature_cols = [
        c for c in df.columns
        if c not in ("customerID", "Churn", "ChurnLabel", "churn_probability", "risk_level")
    ]
    return {
        "customer_id": r["customerID"],
        "features": {c: _clean(r[c]) for c in feature_cols},
        "churn_probability": float(r["churn_probability"]),
        "risk_level": r["risk_level"],
        "actual_churn": int(r["ChurnLabel"]),
    }


def segmentation() -> dict:
    df = _scored_customers()
    out = {}
    for level in ("low", "medium", "high"):
        seg = df[df["risk_level"] == level]
        out[level] = {
            "count": int(len(seg)),
            "avg_probability": float(seg["churn_probability"].mean()) if len(seg) else 0.0,
            "avg_monthly_charges": float(seg["MonthlyCharges"].mean()) if len(seg) else 0.0,
            "customers": [
                {
                    "customer_id": r["customerID"],
                    "churn_probability": float(r["churn_probability"]),
                    "monthly_charges": float(r["MonthlyCharges"]),
                    "contract_type": r["Contract"],
                }
                for _, r in seg.sort_values("churn_probability", ascending=False)
                .head(50)
                .iterrows()
            ],
        }
    return out


def sample_feature_rows(n: int = 20) -> list[dict]:
    """Raw Telco feature dicts for real customers, ready to POST to /predict/batch."""
    df = _full_dataset().sample(n, random_state=7).reset_index(drop=True)
    feature_cols = [
        c for c in df.columns if c not in ("customerID", "Churn", "ChurnLabel")
    ]
    rows = []
    for _, r in df.iterrows():
        row = {c: _clean(r[c]) for c in feature_cols}
        row["customerID"] = r["customerID"]
        row["actual_churn"] = int(r["ChurnLabel"])
        rows.append(row)
    return rows


def cohort_churn() -> list[dict]:
    """Real churn rate by tenure bucket, from the full dataset's true labels."""
    df = _full_dataset()
    buckets = [
        ("0-6 mo", 0, 6),
        ("7-12 mo", 7, 12),
        ("13-24 mo", 13, 24),
        ("25-48 mo", 25, 48),
        ("49-60 mo", 49, 60),
        ("61+ mo", 61, 1000),
    ]
    out = []
    for label, lo, hi in buckets:
        seg = df[(df["tenure"] >= lo) & (df["tenure"] <= hi)]
        if len(seg) == 0:
            continue
        out.append(
            {
                "cohort": label,
                "customers": int(len(seg)),
                "churned": int(seg["ChurnLabel"].sum()),
                "churn_rate": float(seg["ChurnLabel"].mean()),
                "avg_monthly_charges": float(seg["MonthlyCharges"].mean()),
            }
        )
    return out


def business_value(params) -> dict:
    """Estimate revenue impact of acting on model-flagged churners.

    Uses the scored real-customer sample. A customer is 'flagged' when their
    churn probability clears the threshold; we then estimate the revenue their
    churn would cost and how much a retention campaign could recover.
    """
    df = _scored_customers()
    clv = df["MonthlyCharges"] * params.expected_lifetime_months
    flagged = df["churn_probability"] >= params.threshold

    # Expected revenue lost to churn among flagged customers.
    revenue_at_risk = float((df.loc[flagged, "churn_probability"] * clv[flagged]).sum())
    intervention_cost = float(flagged.sum() * params.retention_offer_cost)
    expected_saved = revenue_at_risk * params.retention_success_rate
    net_benefit = expected_saved - intervention_cost
    roi = net_benefit / intervention_cost if intervention_cost > 0 else 0.0

    # Precision/recall at this threshold against real labels.
    pred = flagged.astype(int)
    actual = df["ChurnLabel"]
    tp = int(((pred == 1) & (actual == 1)).sum())
    fp = int(((pred == 1) & (actual == 0)).sum())
    fn = int(((pred == 0) & (actual == 1)).sum())
    precision = tp / (tp + fp) if (tp + fp) else None
    recall = tp / (tp + fn) if (tp + fn) else None

    return {
        "threshold": params.threshold,
        "customers_evaluated": int(len(df)),
        "customers_flagged": int(flagged.sum()),
        "revenue_at_risk": round(revenue_at_risk, 2),
        "intervention_cost": round(intervention_cost, 2),
        "expected_revenue_saved": round(expected_saved, 2),
        "net_benefit": round(net_benefit, 2),
        "roi": round(roi, 3),
        "precision_at_threshold": precision,
        "recall_at_threshold": recall,
    }


def _clean(v):
    try:
        import numpy as np

        if isinstance(v, (np.integer,)):
            return int(v)
        if isinstance(v, (np.floating,)):
            return float(v)
    except Exception:
        pass
    return v
