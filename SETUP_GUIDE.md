# Customer Churn Prediction Dashboard - Setup Guide

## Quick Start (3 Steps)

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# http://localhost:3000
```

## What's Configured

### Your Render API
- **URL**: https://company-churn-detection-project-13.onrender.com
- **Endpoint**: POST `/predict`
- **Input**: `{ "data": [30 numerical features] }`
- **Output**: `{ "prediction": 0|1, "churn_probability": 0.0-1.0 }`
- **CORS**: Enabled (allowing all origins)

### Dashboard Configuration
- **Environment**: `.env.local`
- **API Base URL**: `https://company-churn-detection-project-13.onrender.com`
- **Mock API**: Disabled (`NEXT_PUBLIC_USE_MOCK_API=false`)
- **Auto-Predict**: Enabled (predicts when customer selected)

## How It Works

1. **User selects customer** or **enters form data**
2. **Frontend transforms customer data** → 30 numerical features using feature transformer
3. **API client sends features** to your Render model
4. **Your model predicts** and returns probability
5. **Dashboard displays** risk level, probability, and charts

### Feature Transformation
The frontend automatically converts customer attributes to 30 features your model expects:
- **Positions 0-3**: Normalized numerical features (age, tenure, charges)
- **Positions 4-9**: One-hot encoded contract type and internet service
- **Positions 10-18**: Binary service features and reserved space
- **Positions 19-22**: One-hot encoded payment method
- **Positions 23-29**: Reserved for model compatibility

## 6 Dashboard Pages

1. **Home** (`/`) - Overview with top-risk customers
2. **Customer Profile** (`/customer-profile`) - Make predictions with form
3. **Result Charts** (`/result-charts`) - Risk distribution analysis
4. **Trend Analysis** (`/trend-analysis`) - 12-month churn trends
5. **Segmentation** (`/customer-segmentation`) - Customer risk groups
6. **Explanations** (`/explanation-panel`) - How predictions work

## Features

- ✅ Auto-predict when customer selected
- ✅ Real-time charts with Recharts
- ✅ Responsive design (mobile to desktop)
- ✅ Error handling with graceful fallbacks
- ✅ CORS-enabled API integration
- ✅ Feature transformation built-in

## Troubleshooting

### "Failed to fetch" errors
- Render free tier has 50-second cold start on first request
- Wait 60 seconds after redeploying before testing
- Check Render dashboard for deployment logs
- Verify CORS is enabled in your `app.py`

### App not showing predictions
- Check browser console for API logs (`[v0]` prefix)
- Verify `.env.local` has `NEXT_PUBLIC_USE_MOCK_API=false`
- Restart dev server after changing `.env.local`
- Check that your scaler.pkl and churn_rf_model.pkl are on Render

### Testing your API
```bash
curl -X POST https://company-churn-detection-project-13.onrender.com/predict \
  -H "Content-Type: application/json" \
  -d '{"data": [0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0]}'
```

Should return: `{"prediction": 0, "churn_probability": 0.xx}`

## Documentation

Read **PROJECT_DOCUMENTATION.md** for complete technical details:
- Full architecture explanation
- Technology stack breakdown
- Data flow diagrams
- Feature transformation examples
- Deployment instructions

## Environment Variables

```
NEXT_PUBLIC_API_BASE_URL=https://company-churn-detection-project-13.onrender.com
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_USE_MOCK_API=false
```

## Technology Stack

**Frontend**
- Next.js 16 (React 19) - App Router
- TypeScript - Type safety
- Tailwind CSS - Styling
- Recharts - Data visualization
- React Hook Form - Form handling
- SWR - Data fetching & caching

**Backend (Your Render API)**
- FastAPI - Python web framework
- scikit-learn - Machine learning
- RandomForest - Churn prediction model
- joblib - Model serialization
- CORS - Cross-origin requests

## Next Steps

1. Run `npm run dev`
2. Open http://localhost:3000
3. Select a customer or enter form data
4. Watch predictions update in real-time
5. Check charts on other pages

Dashboard is production-ready with your custom ML model!
