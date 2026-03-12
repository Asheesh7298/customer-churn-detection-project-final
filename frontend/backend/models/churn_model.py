import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import joblib
import os
from datetime import datetime


class ChurnModelPipeline:
    """Churn prediction model with preprocessing"""
    
    def __init__(self, model_path: str = "backend/models/churn_model.pkl"):
        self.model_path = model_path
        self.scaler_path = model_path.replace(".pkl", "_scaler.pkl")
        self.label_encoders_path = model_path.replace(".pkl", "_encoders.pkl")
        
        self.model = None
        self.scaler = None
        self.label_encoders = {}
        self.feature_names = None
        self.model_metadata = None
        
        self._load_or_create_model()
    
    def _load_or_create_model(self):
        """Load existing model or train new one"""
        if os.path.exists(self.model_path):
            self._load_model()
        else:
            self._train_model()
    
    def _train_model(self):
        """Train a new churn model"""
        # Generate training data
        np.random.seed(42)
        n_samples = 1000
        
        X = pd.DataFrame({
            'age': np.random.randint(18, 80, n_samples),
            'tenure': np.random.randint(0, 72, n_samples),
            'monthly_charges': np.random.uniform(20, 150, n_samples),
            'total_charges': np.random.uniform(100, 5000, n_samples),
            'monthly_usage_gb': np.random.uniform(0, 500, n_samples),
            'support_tickets': np.random.randint(0, 10, n_samples),
            'contract_type': np.random.choice(['month-to-month', 'one_year', 'two_year'], n_samples),
            'internet_service': np.random.choice(['fiber', 'dsl', 'none'], n_samples),
            'tech_support': np.random.choice([True, False], n_samples),
            'online_security': np.random.choice([True, False], n_samples),
        })
        
        # Create synthetic churn labels (based on features)
        y = (
            (X['tenure'] < 12) * 0.4 +
            (X['monthly_charges'] > 100) * 0.2 +
            (X['contract_type'] == 'month-to-month') * 0.3 +
            (X['support_tickets'] > 5) * 0.1 +
            np.random.normal(0, 0.1, n_samples)
        ) > 0.5
        
        # Store original feature names
        self.feature_names = X.columns.tolist()
        
        # Encode categorical features
        self.label_encoders = {}
        for col in ['contract_type', 'internet_service']:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col])
            self.label_encoders[col] = le
        
        # Convert boolean to int
        X['tech_support'] = X['tech_support'].astype(int)
        X['online_security'] = X['online_security'].astype(int)
        
        # Scale features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            random_state=42,
            n_jobs=-1
        )
        self.model.fit(X_scaled, y)
        
        # Calculate model metrics
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
        from sklearn.metrics import roc_auc_score
        
        y_pred = self.model.predict(X_scaled)
        y_pred_proba = self.model.predict_proba(X_scaled)[:, 1]
        
        self.model_metadata = {
            "model_version": "1.0.0",
            "train_date": datetime.now().isoformat(),
            "accuracy": float(accuracy_score(y, y_pred)),
            "precision": float(precision_score(y, y_pred, zero_division=0)),
            "recall": float(recall_score(y, y_pred, zero_division=0)),
            "f1_score": float(f1_score(y, y_pred, zero_division=0)),
            "roc_auc": float(roc_auc_score(y, y_pred_proba)),
            "total_customers_trained": int(n_samples),
            "features_used": self.feature_names
        }
        
        # Save model
        self._save_model()
    
    def _save_model(self):
        """Save model and preprocessors to disk"""
        os.makedirs(os.path.dirname(self.model_path) or '.', exist_ok=True)
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.scaler, self.scaler_path)
        joblib.dump(self.label_encoders, self.label_encoders_path)
        
        # Save metadata
        metadata_path = self.model_path.replace(".pkl", "_metadata.json")
        import json
        with open(metadata_path, 'w') as f:
            json.dump(self.model_metadata, f)
    
    def _load_model(self):
        """Load model and preprocessors from disk"""
        self.model = joblib.load(self.model_path)
        self.scaler = joblib.load(self.scaler_path)
        self.label_encoders = joblib.load(self.label_encoders_path)
        
        # Load metadata
        metadata_path = self.model_path.replace(".pkl", "_metadata.json")
        if os.path.exists(metadata_path):
            import json
            with open(metadata_path, 'r') as f:
                self.model_metadata = json.load(f)
        
        # Set feature names from metadata
        if self.model_metadata:
            self.feature_names = self.model_metadata.get("features_used", [])
    
    def predict(self, X: pd.DataFrame):
        """Make prediction on input data"""
        if self.model is None:
            raise ValueError("Model not loaded")
        
        # Copy to avoid modifying original
        X_processed = X.copy()
        
        # Encode categorical features
        for col in ['contract_type', 'internet_service']:
            if col in X_processed.columns and col in self.label_encoders:
                X_processed[col] = self.label_encoders[col].transform(X_processed[[col]].values.ravel())
        
        # Convert boolean to int
        for col in ['tech_support', 'online_security']:
            if col in X_processed.columns:
                X_processed[col] = X_processed[col].astype(int)
        
        # Ensure column order matches training
        X_processed = X_processed[self.feature_names]
        
        # Scale
        X_scaled = self.scaler.transform(X_processed)
        
        # Predict
        y_pred = self.model.predict(X_scaled)
        y_pred_proba = self.model.predict_proba(X_scaled)[:, 1]
        
        return y_pred, y_pred_proba
    
    def get_feature_importances(self):
        """Get feature importances from model"""
        if self.model is None:
            raise ValueError("Model not loaded")
        
        importances = self.model.feature_importances_
        return dict(zip(self.feature_names, importances))
    
    def get_metadata(self):
        """Get model metadata"""
        return self.model_metadata
