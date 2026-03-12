from fastapi import APIRouter, HTTPException
from datetime import datetime
import pandas as pd
import numpy as np
from typing import List

from schemas.request_response import (
    PredictionRequest,
    PredictionResponse,
    FeatureImportance,
)

router = APIRouter(prefix="/predict", tags=["predictions"])

# Will be injected by main.py
model_pipeline = None
shap_explainer = None
customer_data_loader = None


def set_dependencies(model, explainer, data_loader):
    """Set up dependencies (called from main.py)"""
    global model_pipeline, shap_explainer, customer_data_loader
    model_pipeline = model
    shap_explainer = explainer
    customer_data_loader = data_loader


def determine_risk_level(probability: float) -> str:
    """Determine risk level based on churn probability"""
    if probability < 0.33:
        return "low"
    elif probability < 0.67:
        return "medium"
    else:
        return "high"


@router.post("", response_model=PredictionResponse)
async def predict_churn(request: PredictionRequest):
    """
    Predict churn probability for a customer
    
    Input: Customer features
    Output: Churn prediction + feature importance
    """
    try:
        # Create DataFrame from request
        X = pd.DataFrame([{
            'age': request.age,
            'tenure': request.tenure,
            'monthly_charges': request.monthly_charges,
            'total_charges': request.total_charges,
            'monthly_usage_gb': request.monthly_usage_gb,
            'support_tickets': request.support_tickets,
            'contract_type': request.contract_type.value,
            'internet_service': request.internet_service,
            'tech_support': request.tech_support,
            'online_security': request.online_security,
        }])
        
        # Make prediction
        y_pred, y_pred_proba = model_pipeline.predict(X)
        churn_probability = float(y_pred_proba[0])
        
        # Determine risk level
        risk_level = determine_risk_level(churn_probability)
        
        # Get feature importance from SHAP
        feature_importances = []
        if shap_explainer:
            importances = shap_explainer.explain_prediction(
                X,
                feature_names=model_pipeline.feature_names
            )
            feature_importances = [
                FeatureImportance(
                    feature=imp["feature"],
                    importance=round(imp["importance"], 4),
                    contribution_direction=imp["contribution_direction"]
                )
                for imp in importances
            ]
        
        # Get model metadata
        metadata = model_pipeline.get_metadata()
        model_version = metadata.get("model_version", "1.0.0") if metadata else "1.0.0"
        
        return PredictionResponse(
            customer_id=request.customer_id,
            churn_probability=churn_probability,
            risk_level=risk_level,
            feature_importance=feature_importances,
            model_version=model_version,
            prediction_timestamp=datetime.now().isoformat()
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


@router.post("/batch", response_model=List[PredictionResponse])
async def predict_batch(requests: List[PredictionRequest]):
    """
    Batch prediction for multiple customers
    """
    results = []
    
    for request in requests:
        try:
            # Create DataFrame
            X = pd.DataFrame([{
                'age': request.age,
                'tenure': request.tenure,
                'monthly_charges': request.monthly_charges,
                'total_charges': request.total_charges,
                'monthly_usage_gb': request.monthly_usage_gb,
                'support_tickets': request.support_tickets,
                'contract_type': request.contract_type.value,
                'internet_service': request.internet_service,
                'tech_support': request.tech_support,
                'online_security': request.online_security,
            }])
            
            # Predict
            y_pred, y_pred_proba = model_pipeline.predict(X)
            churn_probability = float(y_pred_proba[0])
            risk_level = determine_risk_level(churn_probability)
            
            # Feature importance
            feature_importances = []
            if shap_explainer:
                importances = shap_explainer.explain_prediction(
                    X,
                    feature_names=model_pipeline.feature_names
                )
                feature_importances = [
                    FeatureImportance(
                        feature=imp["feature"],
                        importance=round(imp["importance"], 4),
                        contribution_direction=imp["contribution_direction"]
                    )
                    for imp in importances
                ]
            
            metadata = model_pipeline.get_metadata()
            model_version = metadata.get("model_version", "1.0.0") if metadata else "1.0.0"
            
            results.append(PredictionResponse(
                customer_id=request.customer_id,
                churn_probability=churn_probability,
                risk_level=risk_level,
                feature_importance=feature_importances,
                model_version=model_version,
                prediction_timestamp=datetime.now().isoformat()
            ))
        
        except Exception as e:
            # Continue with other predictions on error
            print(f"Error predicting for {request.customer_id}: {str(e)}")
            continue
    
    return results
