from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
import os
from datetime import datetime
from typing import Optional
import json

# Import routes
from routes import predict, customers, trends, segmentation

# Import models and utilities
from models.churn_model import ChurnModelPipeline
from utils.shap_explainer import SHAPExplainer
from utils.data_loader import CustomerDataLoader
from schemas.request_response import ModelMetrics

# Environment configuration
API_KEY = os.getenv("API_KEY", "dev-key-change-in-production")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Churn Prediction API",
    description="ML-powered customer churn prediction with SHAP explanations",
    version="1.0.0"
)

# Setup rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-API-Key"],
    max_age=3600,
)

# Custom middleware for API key validation
@app.middleware("http")
async def api_key_middleware(request: Request, call_next):
    """Validate API key on all requests"""
    # Skip validation for health check
    if request.url.path == "/health":
        return await call_next(request)
    
    # Check API key
    api_key = request.headers.get("X-API-Key")
    if not api_key or api_key != API_KEY:
        logger.warning(f"Invalid API key attempt from {request.client.host}")
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key"
        )
    
    # Log request (without sensitive data)
    logger.info(
        f"Request: {request.method} {request.url.path} - "
        f"Client: {request.client.host} - Time: {datetime.now().isoformat()}"
    )
    
    response = await call_next(request)
    return response


# Initialize ML model and utilities
logger.info("Loading machine learning model...")
model_pipeline = ChurnModelPipeline()

logger.info("Initializing SHAP explainer...")
# Generate sample background data for SHAP
customers_data = CustomerDataLoader()
X_background = customers_data.get_all_customers().head(50)
shap_explainer = SHAPExplainer(model_pipeline.model, X_background)

# Inject dependencies into routes
predict.set_dependencies(model_pipeline, shap_explainer, customers_data)
customers.set_dependencies(customers_data, model_pipeline)
trends.router  # No dependencies needed
segmentation.set_dependencies(customers_data, model_pipeline)

# Include routers
app.include_router(predict.router)
app.include_router(customers.router)
app.include_router(trends.router)
app.include_router(segmentation.router)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_version": model_pipeline.get_metadata().get("model_version", "unknown") if model_pipeline.get_metadata() else "unknown"
    }


# Model metrics endpoint
@app.get("/model/metrics")
@limiter.limit("10/minute")
async def get_model_metrics(request: Request):
    """Get model performance metrics"""
    try:
        metadata = model_pipeline.get_metadata()
        if not metadata:
            raise HTTPException(status_code=500, detail="Model metadata not available")
        
        return ModelMetrics(
            model_version=metadata.get("model_version", "1.0.0"),
            train_date=metadata.get("train_date", ""),
            accuracy=metadata.get("accuracy", 0),
            precision=metadata.get("precision", 0),
            recall=metadata.get("recall", 0),
            f1_score=metadata.get("f1_score", 0),
            roc_auc=metadata.get("roc_auc", 0),
            total_customers_trained=metadata.get("total_customers_trained", 0),
            features_used=metadata.get("features_used", [])
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve model metrics")


# Root endpoint
@app.get("/")
async def root():
    """API documentation"""
    return {
        "name": "Churn Prediction API",
        "version": "1.0.0",
        "description": "ML-powered customer churn prediction service",
        "endpoints": {
            "health": "/health",
            "model_metrics": "/model/metrics",
            "predict": "/predict",
            "predict_batch": "/predict/batch",
            "customers": "/customers",
            "customer_detail": "/customers/{customer_id}",
            "trends": "/trends",
            "segmentation": "/segmentation"
        },
        "documentation": "/docs"
    }


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all exceptions with generic error messages"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    return {
        "error": "Internal server error",
        "status_code": 500,
        "timestamp": datetime.now().isoformat()
    }


# Rate limit exception handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_exception_handler(request: Request, exc: RateLimitExceeded):
    """Handle rate limit exceeded"""
    logger.warning(f"Rate limit exceeded for {request.client.host}")
    
    return {
        "error": "Rate limit exceeded",
        "status_code": 429,
        "timestamp": datetime.now().isoformat()
    }


# Startup event
@app.on_event("startup")
async def startup_event():
    """Log startup information"""
    logger.info(f"Starting Churn Prediction API in {ENVIRONMENT} environment")
    logger.info(f"Frontend URL: {FRONTEND_URL}")
    logger.info(f"Model version: {model_pipeline.get_metadata().get('model_version', 'unknown') if model_pipeline.get_metadata() else 'unknown'}")
    logger.info("API is ready to accept requests")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Log shutdown"""
    logger.info("Shutting down Churn Prediction API")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=ENVIRONMENT == "development"
    )
