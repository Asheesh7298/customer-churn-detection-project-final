from fastapi import APIRouter, HTTPException
import pandas as pd

from schemas.request_response import CustomerInfo, SegmentationResponse

router = APIRouter(prefix="/segmentation", tags=["segmentation"])

# Injected dependencies
customer_data_loader = None
model_pipeline = None


def set_dependencies(data_loader, model):
    """Set up dependencies"""
    global customer_data_loader, model_pipeline
    customer_data_loader = data_loader
    model_pipeline = model


@router.get("", response_model=SegmentationResponse)
async def get_segmentation():
    """Get customers segmented by risk level"""
    try:
        customers = customer_data_loader.get_all_customers()
        
        low_risk = []
        medium_risk = []
        high_risk = []
        
        low_scores = []
        medium_scores = []
        high_scores = []
        
        for _, row in customers.iterrows():
            # Predict churn score
            X = pd.DataFrame([{
                'age': row['age'],
                'tenure': row['tenure'],
                'monthly_charges': row['monthly_charges'],
                'total_charges': row['total_charges'],
                'monthly_usage_gb': row['monthly_usage_gb'],
                'support_tickets': row['support_tickets'],
                'contract_type': row['contract_type'],
                'internet_service': row['internet_service'],
                'tech_support': row['tech_support'],
                'online_security': row['online_security'],
            }])
            
            _, churn_prob = model_pipeline.predict(X)
            churn_score = float(churn_prob[0])
            
            customer_info = CustomerInfo(
                customer_id=row['customer_id'],
                name=row['name'],
                age=int(row['age']),
                tenure=int(row['tenure']),
                monthly_charges=float(row['monthly_charges']),
                contract_type=row['contract_type']
            )
            
            # Segment by risk level
            if churn_score < 0.33:
                low_risk.append(customer_info)
                low_scores.append(churn_score)
            elif churn_score < 0.67:
                medium_risk.append(customer_info)
                medium_scores.append(churn_score)
            else:
                high_risk.append(customer_info)
                high_scores.append(churn_score)
        
        # Calculate averages
        avg_low = sum(low_scores) / len(low_scores) if low_scores else 0
        avg_medium = sum(medium_scores) / len(medium_scores) if medium_scores else 0
        avg_high = sum(high_scores) / len(high_scores) if high_scores else 0
        
        return SegmentationResponse(
            low_risk=low_risk[:50],  # Limit to 50 per segment
            medium_risk=medium_risk[:50],
            high_risk=high_risk[:50],
            low_risk_count=len(low_risk),
            medium_risk_count=len(medium_risk),
            high_risk_count=len(high_risk),
            avg_low_score=avg_low,
            avg_medium_score=avg_medium,
            avg_high_score=avg_high
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
