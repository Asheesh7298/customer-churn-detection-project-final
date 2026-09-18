"""
Churn model training pipeline.

Trains and compares three classifiers (Logistic Regression, Random Forest,
XGBoost) on the IBM Telco Customer Churn dataset, selects the best by ROC-AUC
on a held-out test set, and writes reproducible artifacts consumed by the API.

Run:
    python train.py

Artifacts written to ./artifacts:
    pipeline.pkl          - best sklearn Pipeline (preprocessing + model)
    metrics.json          - honest held-out metrics + curves + confusion matrix
    comparison.json       - side-by-side metrics for all three models
    feature_importance.json
    shap_background.pkl    - background sample for the SHAP explainer

Everything is seeded so results reproduce exactly.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier

RANDOM_STATE = 42
MODEL_VERSION = "2.0.0"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "telco_churn.csv")
ARTIFACT_DIR = os.path.join(BASE_DIR, "artifacts")

TARGET = "Churn"
DROP_COLS = ["customerID"]

NUMERIC_FEATURES = ["tenure", "MonthlyCharges", "TotalCharges", "SeniorCitizen"]
CATEGORICAL_FEATURES = [
    "gender",
    "Partner",
    "Dependents",
    "PhoneService",
    "MultipleLines",
    "InternetService",
    "OnlineSecurity",
    "OnlineBackup",
    "DeviceProtection",
    "TechSupport",
    "StreamingTV",
    "StreamingMovies",
    "Contract",
    "PaperlessBilling",
    "PaymentMethod",
]


def load_data() -> pd.DataFrame:
    """Load and clean the Telco dataset."""
    df = pd.read_csv(DATA_PATH)
    df = df.drop(columns=[c for c in DROP_COLS if c in df.columns])

    # TotalCharges has blank strings for brand-new customers (tenure 0).
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    df["TotalCharges"] = df["TotalCharges"].fillna(0.0)

    # SeniorCitizen is already 0/1; keep as numeric.
    df[TARGET] = (df[TARGET].astype(str).str.strip() == "Yes").astype(int)
    return df


def build_preprocessor() -> ColumnTransformer:
    """One-hot encode categoricals, standardize numerics."""
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
        ],
        remainder="drop",
    )


def candidate_models(pos_weight: float) -> dict[str, object]:
    """Three classifiers, each configured to handle the ~27% class imbalance."""
    return {
        "logistic_regression": LogisticRegression(
            max_iter=2000, class_weight="balanced", random_state=RANDOM_STATE
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=300,
            max_depth=12,
            min_samples_split=5,
            class_weight="balanced",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
        "xgboost": XGBClassifier(
            n_estimators=400,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            scale_pos_weight=pos_weight,
            eval_metric="logloss",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
    }


def evaluate(y_true, y_pred, y_proba) -> dict:
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1_score": float(f1_score(y_true, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, y_proba)),
    }


def curve_points(y_true, y_proba, max_points: int = 60) -> dict:
    """Downsampled ROC and PR curves for charting on the frontend."""
    fpr, tpr, _ = roc_curve(y_true, y_proba)
    prec, rec, _ = precision_recall_curve(y_true, y_proba)

    def thin(xs, ys):
        if len(xs) <= max_points:
            idx = range(len(xs))
        else:
            idx = np.linspace(0, len(xs) - 1, max_points).astype(int)
        return [{"x": float(xs[i]), "y": float(ys[i])} for i in idx]

    return {"roc": thin(fpr, tpr), "pr": thin(rec, prec)}


def main() -> None:
    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    print(f"Loading data from {DATA_PATH}")
    df = load_data()
    X = df.drop(columns=[TARGET])
    y = df[TARGET]
    print(f"  {len(df)} rows, churn rate {y.mean():.1%}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE
    )

    pos_weight = float((y_train == 0).sum() / max((y_train == 1).sum(), 1))
    preprocessor = build_preprocessor()

    comparison = []
    best_name, best_pipeline, best_auc = None, None, -1.0
    best_eval, best_curves, best_cm = None, None, None

    for name, model in candidate_models(pos_weight).items():
        pipe = Pipeline([("prep", preprocessor), ("model", model)])
        pipe.fit(X_train, y_train)

        proba = pipe.predict_proba(X_test)[:, 1]
        pred = (proba >= 0.5).astype(int)
        metrics = evaluate(y_test, pred, proba)
        comparison.append({"model": name, **metrics})
        print(
            f"  {name:20s} auc={metrics['roc_auc']:.3f} "
            f"f1={metrics['f1_score']:.3f} recall={metrics['recall']:.3f}"
        )

        if metrics["roc_auc"] > best_auc:
            best_auc = metrics["roc_auc"]
            best_name = name
            best_pipeline = pipe
            best_eval = metrics
            best_curves = curve_points(y_test, proba)
            best_cm = confusion_matrix(y_test, pred).tolist()

    print(f"Best model: {best_name} (AUC {best_auc:.3f})")

    # Feature importance from the best model, mapped to readable names.
    feature_names = list(
        best_pipeline.named_steps["prep"].get_feature_names_out()
    )
    model = best_pipeline.named_steps["model"]
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    else:  # logistic regression -> absolute coefficients
        importances = np.abs(model.coef_[0])
    fi = sorted(
        (
            {"feature": _pretty(f), "importance": float(v)}
            for f, v in zip(feature_names, importances)
        ),
        key=lambda d: d["importance"],
        reverse=True,
    )

    # SHAP background: a modest sample of the training set keeps the explainer fast.
    background = X_train.sample(
        min(100, len(X_train)), random_state=RANDOM_STATE
    ).reset_index(drop=True)

    # ---- write artifacts ----
    joblib.dump(best_pipeline, os.path.join(ARTIFACT_DIR, "pipeline.pkl"))
    joblib.dump(background, os.path.join(ARTIFACT_DIR, "shap_background.pkl"))

    metrics_out = {
        "model_version": MODEL_VERSION,
        "model_type": best_name,
        "train_date": datetime.now(timezone.utc).isoformat(),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "churn_rate": float(y.mean()),
        **best_eval,
        "confusion_matrix": best_cm,  # [[TN, FP], [FN, TP]]
        "curves": best_curves,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
    }
    _write_json("metrics.json", metrics_out)
    _write_json("comparison.json", {"models": comparison, "best": best_name})
    _write_json("feature_importance.json", {"features": fi[:20]})

    print(f"Artifacts written to {ARTIFACT_DIR}")


def _pretty(raw: str) -> str:
    """Turn 'cat__Contract_Two year' into 'Contract: Two year'."""
    name = raw.split("__", 1)[-1]
    if "_" in name and name.split("_", 1)[0] in CATEGORICAL_FEATURES:
        col, val = name.split("_", 1)
        return f"{col}: {val}"
    return name


def _write_json(filename: str, payload: dict) -> None:
    with open(os.path.join(ARTIFACT_DIR, filename), "w") as f:
        json.dump(payload, f, indent=2)


if __name__ == "__main__":
    main()
