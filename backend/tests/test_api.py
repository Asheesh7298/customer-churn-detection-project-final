"""End-to-end API tests. Run with: pytest -q (from the backend directory)."""

import warnings

import pytest
from fastapi.testclient import TestClient

warnings.filterwarnings("ignore")

from churn_service.main import app  # noqa: E402

HIGH_RISK = {
    "tenure": 1,
    "MonthlyCharges": 95.0,
    "TotalCharges": 95.0,
    "Contract": "Month-to-month",
    "InternetService": "Fiber optic",
    "PaymentMethod": "Electronic check",
}
LOW_RISK = {
    "tenure": 68,
    "MonthlyCharges": 25.0,
    "TotalCharges": 1700.0,
    "Contract": "Two year",
    "InternetService": "DSL",
    "OnlineSecurity": "Yes",
    "TechSupport": "Yes",
    "PaymentMethod": "Credit card (automatic)",
}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_metrics_are_real(client):
    m = client.get("/model/metrics").json()
    # Honest Telco numbers, not the old hard-coded 0.85.
    assert 0.7 <= m["roc_auc"] <= 0.95
    assert m["confusion_matrix"]
    assert len(m["curves"]["roc"]) > 5


def test_high_risk_scores_higher_than_low_risk(client):
    hi = client.post("/predict", json=HIGH_RISK).json()
    lo = client.post("/predict", json=LOW_RISK).json()
    assert hi["churn_probability"] > lo["churn_probability"]
    assert hi["risk_level"] == "high"
    assert lo["risk_level"] == "low"
    assert len(hi["top_contributions"]) > 0


def test_whatif_reduces_churn(client):
    w = client.post("/whatif", json=HIGH_RISK).json()
    assert w["scenarios"]
    # The top-ranked lever should lower churn (negative delta).
    assert w["scenarios"][0]["delta"] < 0


def test_business_value_roi(client):
    bv = client.post("/business-value", json={"threshold": 0.5}).json()
    assert bv["customers_flagged"] > 0
    assert bv["net_benefit"] != 0


def test_cohort_churn_decreases_with_tenure(client):
    cohorts = client.get("/cohorts").json()["cohorts"]
    first, last = cohorts[0]["churn_rate"], cohorts[-1]["churn_rate"]
    assert first > last  # new customers churn more than tenured ones


def test_batch(client):
    r = client.post("/predict/batch", json=[HIGH_RISK, LOW_RISK]).json()
    assert r["count"] == 2


def test_validation_rejects_bad_contract(client):
    bad = {**HIGH_RISK, "Contract": "lifetime"}
    assert client.post("/predict", json=bad).status_code == 422


def test_unknown_customer_404(client):
    assert client.get("/customers/does-not-exist").status_code == 404


def test_sample_batch_scores(client):
    rows = client.get("/sample-batch?n=8").json()["rows"]
    assert len(rows) == 8
    assert "customerID" in rows[0]
    scored = client.post("/predict/batch", json=rows).json()
    assert scored["count"] == 8
