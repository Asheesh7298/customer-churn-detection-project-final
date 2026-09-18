"""Runtime configuration, read from environment with safe defaults."""

from __future__ import annotations

import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACT_DIR = os.path.join(BASE_DIR, "artifacts")
DATA_PATH = os.path.join(BASE_DIR, "data", "telco_churn.csv")
DB_PATH = os.getenv("DB_PATH", os.path.join(BASE_DIR, "churn.db"))

# Optional API key. When unset, auth is disabled (convenient for local demos).
API_KEY = os.getenv("API_KEY", "")

# CORS: comma-separated origins, or "*" for any.
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "*")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Risk thresholds (probability cut-offs) for low / medium / high buckets.
RISK_MEDIUM = float(os.getenv("RISK_MEDIUM", "0.33"))
RISK_HIGH = float(os.getenv("RISK_HIGH", "0.66"))

# Business-value defaults (overridable per request).
DEFAULT_EXPECTED_LIFETIME_MONTHS = 24
DEFAULT_RETENTION_OFFER_COST = 50.0  # cost of the retention offer per customer
DEFAULT_RETENTION_SUCCESS_RATE = 0.30  # fraction of at-risk customers saved


def risk_level(prob: float) -> str:
    if prob >= RISK_HIGH:
        return "high"
    if prob >= RISK_MEDIUM:
        return "medium"
    return "low"
