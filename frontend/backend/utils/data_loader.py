import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os


class CustomerDataLoader:
    """Loads and manages synthetic customer data"""
    
    def __init__(self, data_path: str = "backend/sample_data.csv"):
        self.data_path = data_path
        self.customers = self._load_or_create_data()
    
    def _load_or_create_data(self):
        """Load customer data from CSV or create synthetic data"""
        if os.path.exists(self.data_path):
            return pd.read_csv(self.data_path)
        else:
            return self._generate_synthetic_data()
    
    def _generate_synthetic_data(self):
        """Generate synthetic customer data for demo"""
        np.random.seed(42)
        n_customers = 100
        
        data = {
            'customer_id': [f'CUST{str(i).zfill(5)}' for i in range(1, n_customers + 1)],
            'name': [f'Customer {i}' for i in range(1, n_customers + 1)],
            'age': np.random.randint(18, 80, n_customers),
            'tenure': np.random.randint(0, 72, n_customers),
            'monthly_charges': np.random.uniform(20, 150, n_customers),
            'total_charges': np.random.uniform(100, 5000, n_customers),
            'contract_type': np.random.choice(['month-to-month', 'one_year', 'two_year'], n_customers),
            'internet_service': np.random.choice(['fiber', 'dsl', 'none'], n_customers),
            'monthly_usage_gb': np.random.uniform(0, 500, n_customers),
            'support_tickets': np.random.randint(0, 10, n_customers),
            'tech_support': np.random.choice([True, False], n_customers),
            'online_security': np.random.choice([True, False], n_customers),
            'last_contact_days_ago': np.random.randint(0, 180, n_customers),
        }
        
        df = pd.DataFrame(data)
        # Save for future use
        os.makedirs(os.path.dirname(self.data_path) or '.', exist_ok=True)
        df.to_csv(self.data_path, index=False)
        return df
    
    def get_all_customers(self):
        """Get all customers"""
        return self.customers
    
    def get_customer(self, customer_id: str):
        """Get a specific customer"""
        customer = self.customers[self.customers['customer_id'] == customer_id]
        if customer.empty:
            return None
        return customer.iloc[0].to_dict()
    
    def get_customers_by_ids(self, customer_ids: list):
        """Get multiple customers"""
        return self.customers[self.customers['customer_id'].isin(customer_ids)]


class TrendDataGenerator:
    """Generates trend data for visualization"""
    
    @staticmethod
    def generate_trends():
        """Generate 12-month trend data"""
        np.random.seed(42)
        months = []
        churn_rates = []
        
        base_date = datetime.now() - timedelta(days=365)
        
        for i in range(12):
            month_date = base_date + timedelta(days=30*i)
            month_str = month_date.strftime("%Y-%m")
            months.append(month_str)
            
            # Synthetic churn rate with slight trend
            base_churn = 0.15 + (i * 0.01)
            noise = np.random.normal(0, 0.02)
            churn_rate = max(0.05, min(0.35, base_churn + noise))
            churn_rates.append(churn_rate)
        
        return months, churn_rates
    
    @staticmethod
    def format_trend_response():
        """Format trend data for API response"""
        months, churn_rates = TrendDataGenerator.generate_trends()
        
        data = []
        for month, churn_rate in zip(months, churn_rates):
            total_customers = 1000 + np.random.randint(-50, 50)
            churned = int(total_customers * churn_rate)
            
            data.append({
                "month": month,
                "churn_rate": round(churn_rate, 4),
                "total_customers": total_customers,
                "churned_customers": churned,
            })
        
        return {
            "data": data,
            "current_month_churn": round(churn_rates[-1], 4),
            "trend_direction": "increasing" if churn_rates[-1] > churn_rates[0] else "decreasing"
        }
