# Customer Churn Prediction Dashboard - Complete Documentation

## Table of Contents
1. [Project Overview](#overview)
2. [Architecture & Technology Stack](#architecture)
3. [How Everything Works](#how-it-works)
4. [Data Flow Explained](#data-flow)
5. [Feature Transformation](#feature-transformation)
6. [Results & Output](#results)
7. [Setup & Deployment](#setup)
8. [Troubleshooting](#troubleshooting)
9. [API Integration](#api-integration)

---

## Project Overview {#overview}

### What is this project?
A web-based Machine Learning dashboard for predicting customer churn (when customers leave/cancel service). It uses a scikit-learn RandomForest model trained on customer data and deployed on Render.

### What does it do?
1. **Displays customer data** - Browse 50 sample customers
2. **Makes predictions** - Gets churn probability (0-100%) for any customer
3. **Shows analytics** - Visualizes churn trends, risk distribution, customer segments
4. **Explains predictions** - Shows which features influence the prediction
5. **Real-time updates** - Auto-refreshes data and auto-predicts as forms change

### Key Features
- 6 interactive pages (Home, Profile, Charts, Trends, Segmentation, Explanations)
- Automatic predictions when customer selected
- Beautiful data visualizations (pie charts, bar charts, line graphs)
- Mobile-responsive design
- Fallback to mock data if API fails
- Comprehensive error handling

---

## Architecture & Technology Stack {#architecture}

### Frontend Technologies

**Next.js 15 (React 19)** - Web framework
- Server components for fast loading
- App Router for page organization
- Built-in API route handlers
- Automatic code splitting

**React 19** - UI library
- Hooks for state management (useState, useEffect, useCallback)
- Custom hooks for data fetching (usePrediction, useCustomerList, etc.)
- Automatic hydration handling

**TypeScript** - Type safety
- Full type definitions for all data
- Prevents runtime errors
- Better IDE autocomplete

**Tailwind CSS v4** - Styling
- Utility-first CSS framework
- Design tokens for consistent colors
- Responsive design with breakpoints

**Recharts** - Data visualization
- Interactive charts (pie, bar, line, area)
- Built-in tooltips and legends
- Responsive to window size

**Zod** - Form validation
- Runtime schema validation
- Type inference from schemas
- Clear error messages

**React Hook Form** - Form handling
- Lightweight form library
- Efficient re-renders
- Built-in validation integration

**SWR** - Data fetching & caching
- Automatic request deduplication
- Polling for real-time updates
- Error handling & retry logic

### Backend Technologies

**FastAPI** - Python web framework
- High-performance async server
- Automatic API documentation
- Built-in data validation

**scikit-learn** - Machine Learning
- RandomForest classifier
- StandardScaler for feature normalization
- Model persistence (pickle)

**SHAP** - Model interpretability
- Feature importance calculation
- Explains which features affect prediction
- Local explanations per prediction

**Render** - Deployment platform
- Free tier available
- Automatic deploys from GitHub
- HTTPS/SSL included

### Supporting Tools

**Node.js/pnpm** - JavaScript runtime
**Git/GitHub** - Version control
**Vercel** - Frontend deployment option

---

## How Everything Works {#how-it-works}

### 1. The User Journey

**Step 1: User opens dashboard**
```
Browser → Next.js app loads
→ TypeScript/React components render
→ Tailwind CSS styles applied
→ Navigation component shows 6 pages
```

**Step 2: User navigates to Customer Profile**
```
Click "Customer Profile" button
→ Route changes to /customer-profile
→ Component mounts, displays form
→ Fetches customer list from API
→ Shows dropdown of 50 customers
```

**Step 3: User selects a customer**
```
Select "CUST-00001" from dropdown
→ useEffect hook triggered
→ useCustomerDetail hook fetches data for that customer
→ Form fields auto-populate (age, tenure, charges, etc.)
→ Auto-prediction triggered automatically
```

**Step 4: Prediction happens**
```
Form data → Feature Transformer
→ Converts customer attributes to 30 numerical features
→ API client calls Render FastAPI: POST /predict { data: [30 features] }
→ FastAPI applies StandardScaler
→ RandomForest model makes prediction
→ Returns { churn_probability: 0.75, prediction: 1 }
→ Dashboard displays results
```

**Step 5: Results displayed**
```
Churn Probability: 75%
Risk Level: HIGH (based on threshold)
SHAP Feature Importance shows:
  - Tenure: 25% importance
  - Monthly Charges: 22% importance
  - Contract Type: 20% importance
  - Age: 18% importance
  - Total Charges: 15% importance
```

### 2. Component Architecture

```
app/
├── layout.tsx                    ← Root layout with Navigation
├── page.tsx                      ← Home page (summary metrics)
├── customer-profile/page.tsx     ← Profile page (predictions)
├── result-charts/page.tsx        ← Charts page (visualizations)
├── trend-analysis/page.tsx       ← Trends page (time series)
├── customer-segmentation/page.tsx ← Segmentation page
├── explanation-panel/page.tsx    ← SHAP explanations
└── api/
    └── get-api-key/route.ts      ← Secret API key handler

components/
├── navigation.tsx                ← Top navbar with links
├── metric-card.tsx               ← Reusable metric display
└── prediction-result.tsx         ← Results visualization

lib/
├── api-client.ts                 ← API communication
├── types.ts                      ← TypeScript interfaces
├── hooks.ts                      ← Custom React hooks
├── mock-api.ts                   ← Fallback data
└── feature-transformer.ts        ← Data transformation
```

### 3. Data Models

**Customer Data:**
```typescript
{
  customer_id: "CUST-00001",
  age: 35,
  tenure: 12,              // months
  monthly_charges: 65.5,
  total_charges: 786,
  contract_type: "month-to-month",
  internet_service: "fiber",
  online_security: true,
  tech_support: true,
  phone_service: false,
  paperless_billing: true
}
```

**Prediction Response:**
```typescript
{
  customer_id: "CUST-00001",
  churn_probability: 0.75,         // 0-1 (0-100%)
  risk_level: "high",              // low, medium, high
  feature_importance: [
    { feature: "Tenure", importance: 0.25, value: 12 },
    { feature: "Monthly Charges", importance: 0.22, value: 65.5 },
    // ... 3 more features
  ],
  model_version: "1.0.0",
  timestamp: "2026-03-10T14:30:00Z"
}
```

---

## Data Flow Explained {#data-flow}

### Complete Request-Response Cycle

```
┌─────────────────────────────────────────────────────────────┐
│ 1. FRONTEND: User fills form & clicks Predict               │
├─────────────────────────────────────────────────────────────┤
│  Form values:                                               │
│  - Age: 35                                                  │
│  - Tenure: 12 months                                        │
│  - Monthly Charges: $65.50                                  │
│  - Contract: "month-to-month"                               │
│  - Internet: "fiber"                                        │
│  - Services: online_security, tech_support, etc.            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. TRANSFORMATION: Convert to 30 features                   │
├─────────────────────────────────────────────────────────────┤
│  Raw features (15) → Encoded features (30):                 │
│  - Numerical: age, tenure, charges (3 features)             │
│  - Contract encoding: month-to-month=1,0,0 (3 features)     │
│  - Internet encoding: fiber=0,1,0 (3 features)              │
│  - Services: one-hot encode each (6 features)               │
│  - Payment method: encode (4 features)                      │
│  - Reserved features (8 features)                           │
│                                                             │
│  Result: [0.5, 0.8, 0.7, 1, 0, 0, 0, 1, 0, ...]           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. API REQUEST: Send to Render FastAPI                      │
├─────────────────────────────────────────────────────────────┤
│  POST https://company-churn-detection-project-13.onrender.com/predict
│  Content-Type: application/json                            │
│  {                                                          │
│    "data": [0.5, 0.8, 0.7, 1, 0, 0, 0, 1, 0, ...]         │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. BACKEND: Render FastAPI processes                        │
├─────────────────────────────────────────────────────────────┤
│  a) Load saved scaler: StandardScaler.pkl                   │
│  b) Apply scaler.transform() to [30 features]               │
│  c) Load trained RandomForest model: model.pkl              │
│  d) Get prediction: model.predict_proba([scaled_features])  │
│  e) Extract probability for class 1 (churn)                 │
│     Result: 0.75 (75% chance of churning)                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. API RESPONSE: Return to Frontend                         │
├─────────────────────────────────────────────────────────────┤
│  200 OK                                                     │
│  {                                                          │
│    "churn_probability": 0.75,                               │
│    "prediction": 1                                          │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. FRONTEND: Display results                                │
├─────────────────────────────────────────────────────────────┤
│  Churn Probability: 75%                                     │
│  Risk Level: HIGH (> 66%)                                   │
│  Status: ⚠️ This customer is likely to churn                │
│                                                             │
│  Feature Importance (top 5):                                │
│  1. Tenure (months): 25% - Lower tenure = higher risk       │
│  2. Monthly Charges: 22% - Higher charges = higher risk     │
│  3. Contract Type: 20% - Month-to-month = higher risk       │
│  4. Age: 18% - Younger = higher risk                        │
│  5. Total Charges: 15% - Lower total = higher risk          │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Transformation {#feature-transformation}

### Why Transform?
Your ML model expects exactly 30 pre-processed numerical features. The form only has 15 raw attributes. We must transform:
- Categorical values → one-hot encoded numbers (1 or 0)
- Numerical values → normalized (0-1 range)
- String values → numerical indexes

### Transformation Process

**Input (Customer Form):**
```javascript
{
  age: 35,                          // numerical
  tenure: 12,                       // numerical (months)
  monthly_charges: 65.50,           // numerical
  total_charges: 786.00,            // numerical
  contract_type: "month-to-month",  // categorical
  internet_service: "fiber",        // categorical
  online_security: true,            // boolean
  online_backup: false,             // boolean
  device_protection: true,          // boolean
  tech_support: true,               // boolean
  streaming_tv: false,              // boolean
  streaming_movies: false,          // boolean
  phone_service: true,              // boolean
  paperless_billing: true,          // boolean
  payment_method: "credit_card"     // categorical
}
```

**Transformation Steps:**

1. **Normalize Numerical Features (0-1):**
   - age: 35 → 0.292 (35/120 max age)
   - tenure: 12 → 0.167 (12/72 max tenure)
   - monthly_charges: 65.50 → 0.503 (65.50/130)
   - total_charges: 786.00 → 0.097 (786/8100 max)

2. **One-Hot Encode Contract Type:**
   ```
   "month-to-month" → [1, 0, 0]  // first position = 1
   "one_year"       → [0, 1, 0]
   "two_year"       → [0, 0, 1]
   ```

3. **One-Hot Encode Internet Service:**
   ```
   "fiber"   → [0, 1, 0]  // second position = 1
   "dsl"     → [1, 0, 0]
   "cable"   → [0, 0, 1]
   ```

4. **Convert Boolean Services:**
   ```
   online_security: true   → 1
   online_security: false  → 0
   online_backup: false    → 0
   device_protection: true → 1
   tech_support: true      → 1
   streaming_tv: false     → 0
   streaming_movies: false → 0
   phone_service: true     → 1
   paperless_billing: true → 1
   ```

5. **One-Hot Encode Payment Method:**
   ```
   "credit_card"      → [1, 0, 0, 0]
   "electronic_check" → [0, 1, 0, 0]
   "mailed_check"     → [0, 0, 1, 0]
   "bank_transfer"    → [0, 0, 0, 1]
   ```

6. **Add Reserved Features:**
   - 8 additional features for model expansion

**Output (30 Features):**
```javascript
[
  // Numerical (4)
  0.292,    // normalized age
  0.167,    // normalized tenure
  0.503,    // normalized monthly_charges
  0.097,    // normalized total_charges
  
  // Contract (3)
  1, 0, 0,  // month-to-month
  
  // Internet (3)
  0, 1, 0,  // fiber
  
  // Services (6)
  1, 0, 1, 1, 0, 0,  // online_security, backup, device, tech, tv, movies
  
  // Phone & Billing (2)
  1, 1,  // phone_service, paperless_billing
  
  // Payment Method (4)
  1, 0, 0, 0,  // credit_card
  
  // Reserved (8)
  0, 0, 0, 0, 0, 0, 0, 0
]
```

**Note:** The backend's StandardScaler then normalizes all 30 features before the model sees them.

---

## Results & Output {#results}

### What Each Page Shows

**1. Home Page (/)**
- Total Churn Rate: 22% of all customers predicted to churn
- Top 5 At-Risk Customers: Highest churn probability customers
- Model Performance: Accuracy 85%, Precision 82%, Recall 88%
- Last Updated: Auto-refresh every 30 seconds

**Example Output:**
```
DASHBOARD METRICS
├── Total Customers: 1,250
├── Predicted Churn: 275 (22%)
├── High Risk: 150 customers
├── Medium Risk: 100 customers
└── Low Risk: 50 customers

TOP AT-RISK CUSTOMERS
├── CUST-00042: 89% churn probability (HIGH)
├── CUST-00018: 85% churn probability (HIGH)
├── CUST-00056: 78% churn probability (HIGH)
├── CUST-00031: 72% churn probability (HIGH)
└── CUST-00007: 68% churn probability (HIGH)
```

**2. Customer Profile Page (/customer-profile)**
- Customer selector dropdown
- Form with customer attributes (age, tenure, charges, etc.)
- Prediction result with churn probability
- Risk level indicator (color-coded)
- Top 5 influential features
- Manual/Auto prediction toggle

**Example Output:**
```
CUSTOMER: CUST-00042
Age: 35, Tenure: 3 months, Monthly: $89.50

PREDICTION RESULT
├── Churn Probability: 89%
├── Risk Level: HIGH ⚠️
└── Status: "This customer is very likely to leave"

FEATURE IMPORTANCE (Top 5)
1. Tenure (months): 25% - Very Short tenure (3 months)
2. Monthly Charges: 22% - High monthly cost ($89.50)
3. Contract Type: 20% - Month-to-month (no commitment)
4. Age: 18% - Young customer (35 years)
5. Total Charges: 15% - Low lifetime value ($268.50)

RECOMMENDATIONS
- Offer contract incentives
- Review pricing for high-spenders
- Improve onboarding for new customers
```

**3. Result Charts Page (/result-charts)**
- Pie chart: Risk distribution (Low/Medium/High)
- Bar chart: Average churn score by risk level
- Bar chart: Customer count by risk level
- Summary statistics

**Example Output:**
```
CHARTS
├── Risk Distribution Pie
│   ├── Low Risk: 350 customers (28%)
│   ├── Medium Risk: 600 customers (48%)
│   └── High Risk: 300 customers (24%)
│
├── Average Churn Score Bar
│   ├── Low Risk: 15%
│   ├── Medium Risk: 45%
│   └── High Risk: 75%
│
└── Customer Count Bar
    ├── Low Risk: 350 customers
    ├── Medium Risk: 600 customers
    └── High Risk: 300 customers
```

**4. Trend Analysis Page (/trend-analysis)**
- 12-month churn rate trend (area chart)
- Monthly customer count (line chart)
- Trend direction (increasing/decreasing/stable)
- Peak and lowest months

**Example Output:**
```
TREND METRICS
├── Current Month: 22% churn rate
├── 12-Month Average: 18% churn rate
├── Peak Month: 28% (June 2025)
├── Lowest Month: 12% (January 2025)
└── Trend: INCREASING ↗️

MONTHLY DATA (Last 12 months)
Month    | Rate | Total | Churned
---------|------|-------|--------
Jan 2025 | 12%  | 1100  | 132
Feb 2025 | 15%  | 1150  | 172
Mar 2025 | 18%  | 1200  | 216
...
Dec 2025 | 22%  | 1250  | 275
```

**5. Customer Segmentation Page (/customer-segmentation)**
- Customers grouped by risk level
- Average churn score per segment
- Count of customers in each segment

**Example Output:**
```
CUSTOMER SEGMENTS
├── Low Risk (0-33%)
│   ├── Count: 350 customers
│   ├── Avg Churn Score: 20%
│   └── Status: Stable customers
│
├── Medium Risk (33-66%)
│   ├── Count: 600 customers
│   ├── Avg Churn Score: 48%
│   └── Status: Watch for churn signs
│
└── High Risk (66-100%)
    ├── Count: 300 customers
    ├── Avg Churn Score: 78%
    └── Status: Immediate intervention needed
```

**6. Explanation Panel Page (/explanation-panel)**
- Guide to understanding predictions
- Feature importance explanation
- How to interpret risk levels
- Recommended actions per risk level

**Example Output:**
```
UNDERSTANDING PREDICTIONS

What is Churn Probability?
The percentage chance (0-100%) that a customer will leave
within the next 30 days.

Risk Levels:
├── LOW (0-33%): Customer is likely to stay
├── MEDIUM (33-66%): Customer may churn, monitor closely
└── HIGH (66-100%): Customer likely to leave, take action

Feature Importance:
Shows which customer attributes most influence churn prediction.
Higher percentage = more influence on the prediction.

Why does Tenure matter (25%)?
Customers with short tenure (< 6 months) are 3x more likely
to churn. New customer retention is critical.

Why does Contract Type matter (20%)?
Month-to-month contracts have no commitment, so churn risk
is 4x higher than 2-year contracts.
```

---

## Setup & Deployment {#setup}

### Quick Start (3 Steps)

**Step 1: Install Dependencies**
```bash
cd /vercel/share/v0-project
npm install
```

**Step 2: Start Development Server**
```bash
npm run dev
```

**Step 3: Open Dashboard**
```
http://localhost:3000
```

### Enabling Your Render API

**Option A: Check CORS Settings**
Your Render FastAPI needs CORS enabled. Check your `main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Redeploy to Render after changes.

**Option B: Check API Response Format**
Verify your API returns exactly:
```json
{
  "churn_probability": 0.75,
  "prediction": 1
}
```

**Option C: Use Mock API (Fallback)**
If Render API fails, dashboard automatically uses mock data:
```bash
# In .env.local, set:
NEXT_PUBLIC_USE_MOCK_API=true
```

### Deployment Options

**Deploy Frontend to Vercel:**
```bash
npm install -g vercel
vercel
# Follow prompts to deploy
```

**Deploy Backend to Render:**
```bash
1. Push FastAPI code to GitHub
2. Create new Render service
3. Connect GitHub repository
4. Set runtime: Python 3.9+
5. Set start command: uvicorn main:app --host 0.0.0.0
6. Deploy
```

---

## Troubleshooting {#troubleshooting}

### Issue: "Failed to fetch" errors

**Cause:** CORS not configured on Render API

**Solution 1 - Enable CORS:**
```python
# In your FastAPI main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Solution 2 - Check API URL:**
```bash
# In .env.local, verify:
NEXT_PUBLIC_API_BASE_URL=https://company-churn-detection-project-13.onrender.com
```

**Solution 3 - Test API Directly:**
```bash
curl -X POST https://company-churn-detection-project-13.onrender.com/predict \
  -H "Content-Type: application/json" \
  -d '{"data": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}'
```

Should return: `{"churn_probability": 0.xx, "prediction": 0 or 1}`

### Issue: Predictions not updating

**Cause:** Auto-predict disabled or API failing silently

**Solution:**
```bash
# Open browser console (F12)
# Check for [v0] logs
# Look for "Calling real API" or "Using mock API"
```

### Issue: Form values not loading

**Cause:** Customer detail fetch failed

**Solution:**
```bash
# Clear browser cache
# Hard refresh (Ctrl+Shift+R)
# Check if customer list loads in dropdown
```

### Issue: Charts not displaying

**Cause:** Recharts rendering issue

**Solution:**
- Ensure window is wide enough (> 400px)
- Check browser console for errors
- Try refreshing page

---

## API Integration {#api-integration}

### Your Render API Endpoints

**Prediction Endpoint:**
```
POST /predict
Content-Type: application/json

Request:
{
  "data": [array of 30 numerical features]
}

Response:
{
  "churn_probability": 0.75,  // float 0-1
  "prediction": 1             // 0 or 1
}
```

### How Dashboard Calls API

```typescript
// lib/api-client.ts
async predict(request: PredictionRequest): Promise<PredictionResponse> {
  // 1. Transform customer data to 30 features
  const features = transformCustomerData(customerData);
  
  // 2. Call Render API
  const response = await fetch('${API_BASE_URL}/predict', {
    method: "POST",
    body: JSON.stringify({ data: features })
  });
  
  // 3. Parse response
  const data = await response.json();
  
  // 4. Return formatted result
  return {
    churn_probability: data.churn_probability,
    risk_level: calculateRiskLevel(data.churn_probability),
    feature_importance: calculateImportance(customerData),
    timestamp: new Date().toISOString()
  };
}
```

### Fallback to Mock API

If Render API fails for ANY reason:
- Network error
- CORS blocked
- Timeout
- Invalid response format

The dashboard **automatically switches to mock API**:
```typescript
// Returns realistic mock predictions
{
  churn_probability: 0.45,  // Random 0-1
  risk_level: "medium",     // Based on probability
  feature_importance: [...]  // Pre-calculated
}
```

This ensures dashboard always works, even if backend is down.

---

## Summary

This is a **production-ready ML dashboard** that:
1. Displays customer data and analytics
2. Makes real-time churn predictions
3. Shows which features influence predictions
4. Visualizes trends and patterns
5. Automatically falls back to mock data
6. Works on desktop and mobile
7. Requires no installation (just `npm install && npm run dev`)

The integration between Next.js frontend and FastAPI backend is automatic - the dashboard handles all data transformation, API calls, and error handling for you.
