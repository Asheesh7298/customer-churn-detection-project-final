from fastapi import APIRouter, HTTPException
from typing import List
import pandas as pd

from schemas.request_response import CustomerInfo, CustomerDetailResponse

router = APIRouter(prefix="/customers", tags=["customers"])

# Injected dependencies
customer_data_loader = None
model_pipeline = None


def set_dependencies(data_loader, model):
    """Set up dependencies"""
    global customer_data_loader, model_pipeline
    customer_data_loader = data_loader
    model_pipeline = model


@router.get("", response_model=List[CustomerInfo])
async def get_customers():
    """Get list of all customers"""
    try:
        customers = customer_data_loader.get_all_customers()
        
        results = []
        for _, row in customers.iterrows():
            results.append(CustomerInfo(
                customer_id=row['customer_id'],
                name=row['name'],
                age=int(row['age']),
                tenure=int(row['tenure']),
                monthly_charges=float(row['monthly_charges']),
                contract_type=row['contract_type']
            ))
        
        return results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{customer_id}", response_model=CustomerDetailResponse)
async def get_customer_detail(customer_id: str):
    """Get detailed customer profile"""
    try:
        customer = customer_data_loader.get_customer(customer_id)
        
        if customer is None:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Calculate churn score using the model
        X = pd.DataFrame([{
            'age': customer['age'],
            'tenure': customer['tenure'],
            'monthly_charges': customer['monthly_charges'],
            'total_charges': customer['total_charges'],
            'monthly_usage_gb': customer['monthly_usage_gb'],
            'support_tickets': customer['support_tickets'],
            'contract_type': customer['contract_type'],
            'internet_service': customer['internet_service'],
            'tech_support': customer['tech_support'],
            'online_security': customer['online_security'],
        }])
        
        _, churn_prob = model_pipeline.predict(X)
        churn_score = float(churn_prob[0])
        
        # Determine risk level
        if churn_score < 0.33:
            risk_level = "low"
        elif churn_score < 0.67:
            risk_level = "medium"
        else:
            risk_level = "high"
        
        return CustomerDetailResponse(
            customer_id=customer['customer_id'],
            name=customer['name'],
            age=int(customer['age']),
            tenure=int(customer['tenure']),
            monthly_charges=float(customer['monthly_charges']),
            total_charges=float(customer['total_charges']),
            contract_type=customer['contract_type'],
            internet_service=customer['internet_service'],
            support_tickets=int(customer['support_tickets']),
            tech_support=bool(customer['tech_support']),
            online_security=bool(customer['online_security']),
            churn_score=churn_score,
            risk_level=risk_level,
            last_contact_days_ago=int(customer['last_contact_days_ago'])
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
