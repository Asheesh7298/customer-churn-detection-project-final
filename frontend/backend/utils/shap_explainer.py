import shap
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple


class SHAPExplainer:
    """SHAP-based feature importance explainer"""
    
    def __init__(self, model, X_background: pd.DataFrame = None):
        """
        Initialize SHAP explainer
        
        Args:
            model: Trained sklearn model
            X_background: Background dataset for SHAP (sample of training data)
        """
        self.model = model
        self.X_background = X_background
        self.explainer = None
        
        # Create explainer if background data provided
        if X_background is not None:
            self._initialize_explainer()
    
    def _initialize_explainer(self):
        """Initialize TreeExplainer for tree-based models"""
        try:
            self.explainer = shap.TreeExplainer(self.model)
        except Exception as e:
            print(f"Warning: Could not create TreeExplainer: {e}")
            # Fallback to KernelExplainer if TreeExplainer fails
            self.explainer = shap.KernelExplainer(
                self.model.predict_proba,
                self.X_background.iloc[:100]  # Use 100 samples for background
            )
    
    def explain_prediction(
        self, 
        X: pd.DataFrame,
        feature_names: List[str] = None
    ) -> List[Dict]:
        """
        Explain a single or batch prediction
        
        Args:
            X: Input features (single row or multiple rows)
            feature_names: Names of features
            
        Returns:
            List of feature importance dictionaries
        """
        if self.explainer is None:
            # Fallback: use model's feature importances
            return self._get_feature_importances_fallback(feature_names)
        
        try:
            # Get SHAP values
            shap_values = self.explainer.shap_values(X)
            
            # For binary classification, take the positive class
            if isinstance(shap_values, list):
                shap_values = shap_values[1]
            
            # Get predictions
            predictions = self.model.predict_proba(X)[:, 1]
            
            # Take the first sample if batch
            if isinstance(shap_values, np.ndarray) and len(shap_values.shape) > 1:
                shap_values = shap_values[0]
                prediction = predictions[0]
            else:
                prediction = predictions
            
            # Create importance list
            importances = []
            feature_names = feature_names or [f"feature_{i}" for i in range(len(shap_values))]
            
            for feature_name, shap_value in zip(feature_names, shap_values):
                importances.append({
                    "feature": feature_name,
                    "importance": float(np.abs(shap_value)),
                    "contribution_direction": "positive" if shap_value > 0 else "negative",
                    "shap_value": float(shap_value)
                })
            
            # Sort by absolute importance
            importances.sort(key=lambda x: x["importance"], reverse=True)
            
            # Return top 5 features
            return importances[:5]
        
        except Exception as e:
            print(f"Error in SHAP explanation: {e}")
            return self._get_feature_importances_fallback(feature_names)
    
    def _get_feature_importances_fallback(self, feature_names: List[str] = None) -> List[Dict]:
        """
        Fallback method using model's feature importances
        """
        if not hasattr(self.model, 'feature_importances_'):
            return []
        
        importances = self.model.feature_importances_
        feature_names = feature_names or [f"feature_{i}" for i in range(len(importances))]
        
        importance_list = []
        for feature_name, importance in zip(feature_names, importances):
            importance_list.append({
                "feature": feature_name,
                "importance": float(importance),
                "contribution_direction": "positive",  # Can't determine direction without SHAP
                "shap_value": float(importance)
            })
        
        # Sort by importance and return top 5
        importance_list.sort(key=lambda x: x["importance"], reverse=True)
        return importance_list[:5]


class ExplanationFormatter:
    """Format SHAP explanations for API responses"""
    
    @staticmethod
    def format_feature_importance(
        feature_importances: List[Dict],
        prediction_probability: float,
        risk_level: str
    ) -> List[Dict]:
        """
        Format feature importances with interpretation
        
        Args:
            feature_importances: List of importance dicts from SHAP
            prediction_probability: Churn probability (0-1)
            risk_level: Risk level (low/medium/high)
            
        Returns:
            Formatted list of explanations
        """
        formatted = []
        
        for item in feature_importances:
            formatted_item = {
                "feature": item["feature"],
                "importance": item["importance"],
                "contribution_direction": item["contribution_direction"],
                "interpretation": ExplanationFormatter._interpret_contribution(
                    item["feature"],
                    item["contribution_direction"],
                    risk_level
                )
            }
            formatted.append(formatted_item)
        
        return formatted
    
    @staticmethod
    def _interpret_contribution(
        feature: str,
        direction: str,
        risk_level: str
    ) -> str:
        """Generate interpretation text for a feature"""
        direction_text = "increases" if direction == "positive" else "decreases"
        
        interpretation_map = {
            "tenure": f"Customer tenure {direction_text} churn risk",
            "monthly_charges": f"Higher monthly charges {direction_text} churn risk",
            "contract_type": f"Contract type {direction_text} churn risk",
            "support_tickets": f"Number of support tickets {direction_text} churn risk",
            "tech_support": f"Tech support availability {direction_text} churn risk",
            "online_security": f"Online security {direction_text} churn risk",
            "internet_service": f"Internet service type {direction_text} churn risk",
            "total_charges": f"Total charges {direction_text} churn risk",
            "monthly_usage_gb": f"Monthly usage {direction_text} churn risk",
            "age": f"Customer age {direction_text} churn risk",
        }
        
        return interpretation_map.get(feature, f"{feature} {direction_text} churn risk")
