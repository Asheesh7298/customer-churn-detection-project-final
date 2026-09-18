# Model Card — Telco Customer Churn Classifier

A short, honest summary of the model that powers this project. Regenerate the
underlying numbers any time with `python backend/train.py`.

## Overview

- **Task:** Binary classification — will a telecom customer churn?
- **Model:** Logistic Regression (selected from LogReg / Random Forest / XGBoost by held-out ROC-AUC)
- **Pipeline:** scikit-learn `Pipeline` = `ColumnTransformer` (one-hot for categoricals, standardize for numerics) → classifier
- **Version:** 2.0.0
- **Frameworks:** scikit-learn, XGBoost, SHAP

## Data

- **Source:** IBM Telco Customer Churn dataset (7,043 customers, 19 features + label)
- **Split:** 80/20 stratified — **5,634 train / 1,409 test**
- **Class balance:** ~26.5% churn (imbalanced; handled with balanced class weights / `scale_pos_weight`)
- **Cleaning:** `TotalCharges` coerced to numeric (blank for tenure-0 customers → 0); `customerID` dropped

## Performance (held-out test set)

| Metric | Score |
|---|---|
| ROC-AUC | **0.842** |
| Accuracy | 0.738 |
| Precision | 0.504 |
| Recall | **0.783** |
| F1 | 0.614 |

**Confusion matrix** (threshold 0.5):

|  | Predicted stay | Predicted churn |
|---|---|---|
| **Actual stay** | 747 (TN) | 288 (FP) |
| **Actual churn** | 81 (FN) | 293 (TP) |

The model is intentionally **recall-leaning**: it catches 78% of real churners at
the cost of some false positives, because missing a churner typically costs more
than a wasted retention offer. The threshold is tunable on the app's Business
Impact page.

### Model comparison

| Model | ROC-AUC | F1 | Recall |
|---|---|---|---|
| **Logistic Regression** ✅ | 0.842 | 0.614 | 0.783 |
| Random Forest | 0.835 | 0.616 | 0.676 |
| XGBoost | 0.834 | 0.626 | 0.754 |

## Top drivers (feature importance)

1. Tenure — shorter tenure strongly increases churn
2. Two-year contract — strongly decreases churn
3. Fiber-optic internet — associated with higher churn
4. Monthly charges
5. Month-to-month contract — increases churn

Per-prediction attributions are computed with SHAP and surfaced in the UI.

## Intended use & limitations

- **Intended use:** decision support for retention teams and as a portfolio/demo of an end-to-end ML system. Not for automated decisions affecting customers without human review.
- **Limitations:**
  - Trained on a single, historical, US-centric telecom dataset; will not transfer to other businesses without retraining.
  - No demographic fairness audit has been performed. `gender` and `SeniorCitizen` are inputs — review for bias before any real deployment.
  - Precision at the default threshold is moderate (~0.50); tune the threshold to the business's cost trade-off.
  - Static model — no automated retraining or drift monitoring in this version.

## Reproducibility

Everything is seeded (`random_state=42`). Run `python backend/train.py` to
regenerate the model and all metrics in `backend/artifacts/`.
