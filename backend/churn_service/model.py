"""Model artifacts loader, prediction, and SHAP explanations.

Loads the artifacts produced by train.py exactly once and exposes helpers the
API routes use. Everything is defensive: if SHAP fails for any reason the
prediction still succeeds, just without per-feature contributions.
"""

from __future__ import annotations

import json
import os
from functools import lru_cache

import joblib
import numpy as np
import pandas as pd

from . import config

# Human-friendly labels for the raw feature columns.
FEATURE_LABELS = {
    "tenure": "Tenure (months)",
    "MonthlyCharges": "Monthly charges",
    "TotalCharges": "Total charges",
    "SeniorCitizen": "Senior citizen",
    "Contract": "Contract",
    "InternetService": "Internet service",
    "PaymentMethod": "Payment method",
    "OnlineSecurity": "Online security",
    "TechSupport": "Tech support",
    "PaperlessBilling": "Paperless billing",
    "Partner": "Partner",
    "Dependents": "Dependents",
    "MultipleLines": "Multiple lines",
}


class ChurnModel:
    def __init__(self) -> None:
        self.pipeline = joblib.load(os.path.join(config.ARTIFACT_DIR, "pipeline.pkl"))
        self.background = joblib.load(
            os.path.join(config.ARTIFACT_DIR, "shap_background.pkl")
        )
        with open(os.path.join(config.ARTIFACT_DIR, "metrics.json")) as f:
            self.metrics = json.load(f)
        with open(os.path.join(config.ARTIFACT_DIR, "comparison.json")) as f:
            self.comparison = json.load(f)
        with open(
            os.path.join(config.ARTIFACT_DIR, "feature_importance.json")
        ) as f:
            self.feature_importance = json.load(f)

        self.prep = self.pipeline.named_steps["prep"]
        self.clf = self.pipeline.named_steps["model"]
        self.trans_names = list(self.prep.get_feature_names_out())
        # SHAP is imported lazily on first explanation to keep startup light
        # (matters on small/free instances).
        self._explainer = None
        self._explainer_ready = False

    # ---- prediction ----
    def predict_proba(self, df: pd.DataFrame) -> np.ndarray:
        """Churn probabilities for a DataFrame of raw feature rows."""
        return self.pipeline.predict_proba(df)[:, 1]

    # ---- explanations ----
    def _get_explainer(self):
        """Build the SHAP explainer on first use, once."""
        if not self._explainer_ready:
            self._explainer = self._build_explainer()
            self._explainer_ready = True
        return self._explainer

    def _build_explainer(self):
        try:
            import shap

            bg = self.prep.transform(self.background)
            if hasattr(self.clf, "feature_importances_"):
                return shap.TreeExplainer(self.clf, bg)
            return shap.LinearExplainer(self.clf, bg)
        except Exception:  # pragma: no cover - SHAP is best-effort
            return None

    def explain(self, df: pd.DataFrame, top_n: int = 6) -> list[dict]:
        """Top SHAP contributions for the first row of df."""
        explainer = self._get_explainer()
        if explainer is None:
            return []
        try:
            import shap  # noqa: F401

            x = self.prep.transform(df.iloc[[0]])
            values = explainer.shap_values(x)
            if isinstance(values, list):  # some explainers return per-class lists
                values = values[-1]
            values = np.asarray(values).reshape(-1)

            row = df.iloc[0]
            contribs = []
            for name, sv in zip(self.trans_names, values):
                col, shown_value = self._describe(name, row)
                contribs.append(
                    {
                        "feature": col,
                        "value": shown_value,
                        "shap_value": float(sv),
                        "direction": "increases" if sv > 0 else "decreases",
                    }
                )
            contribs.sort(key=lambda c: abs(c["shap_value"]), reverse=True)
            return contribs[:top_n]
        except Exception:
            return []

    def _describe(self, trans_name: str, row: pd.Series) -> tuple[str, str]:
        """Map a transformed feature name back to a readable (label, value)."""
        raw = trans_name.split("__", 1)[-1]
        # Numeric features keep their column name.
        if raw in row.index:
            label = FEATURE_LABELS.get(raw, raw)
            return label, str(row[raw])
        # One-hot columns look like 'Contract_Two year'.
        for col in row.index:
            prefix = f"{col}_"
            if raw.startswith(prefix):
                label = FEATURE_LABELS.get(col, col)
                return label, str(row[col])
        return raw, ""


@lru_cache(maxsize=1)
def get_model() -> ChurnModel:
    return ChurnModel()
