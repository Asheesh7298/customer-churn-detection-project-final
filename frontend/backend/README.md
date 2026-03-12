# Churn Prediction API - Backend

A FastAPI-based machine learning service for predicting customer churn with SHAP feature explanations.

## Features

- **Churn Prediction**: Real-time prediction using trained scikit-learn model
- **SHAP Explanations**: Feature importance and contribution direction
- **Batch Predictions**: Process multiple customers at once
- **Customer Management**: Retrieve customer data and profiles
- **Trend Analysis**: Historical churn trends over time
- **Customer Segmentation**: Group customers by risk levels
- **Security**: API key authentication, rate limiting, input validation
- **Model Monitoring**: Track model performance metrics

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Update with your configuration:
```
API_KEY=your-secure-32-character-key
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
PORT=8000
```

### 3. Run the API

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Predictions
- `POST /predict` - Single customer prediction with feature importance
- `POST /predict/batch` - Batch predictions for multiple customers

### Customers
- `GET /customers` - List all customers
- `GET /customers/{customer_id}` - Get detailed customer profile

### Trends
- `GET /trends` - 12-month churn trend data

### Segmentation
- `GET /segmentation` - Customers grouped by risk level

### Model Metrics
- `GET /model/metrics` - Model performance metrics (accuracy, precision, recall, etc.)

## Request Format

All requests (except health check) require the `X-API-Key` header:

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "customer_id": "CUST001",
    "age": 35,
    "tenure": 12,
    "monthly_charges": 65.5,
    "total_charges": 786.0,
    "contract_type": "month-to-month",
    "internet_service": "fiber",
    "monthly_usage_gb": 250,
    "support_tickets": 2,
    "tech_support": true,
    "online_security": false
  }'
```

## Response Example

```json
{
  "customer_id": "CUST001",
  "churn_probability": 0.72,
  "risk_level": "high",
  "feature_importance": [
    {
      "feature": "tenure",
      "importance": 0.35,
      "contribution_direction": "negative"
    },
    {
      "feature": "monthly_charges",
      "importance": 0.28,
      "contribution_direction": "positive"
    }
  ],
  "model_version": "1.0.0",
  "prediction_timestamp": "2026-02-20T10:30:00"
}
```

## Security Features

- **API Key Authentication**: All endpoints protected with X-API-Key header
- **Rate Limiting**: 100 requests/minute per IP (configurable)
- **Input Validation**: Pydantic models enforce strict input constraints
- **CORS**: Whitelist frontend domains only
- **Error Handling**: Generic error messages to prevent info leakage
- **Logging**: Request logging without sensitive data

## Model Architecture

The churn prediction model is a RandomForest classifier trained on:
- 1000+ customer samples
- 10 features (age, tenure, charges, contract type, usage, support, etc.)
- Achieves ~85% accuracy on validation data

Features used:
1. Age
2. Tenure (months as customer)
3. Monthly Charges
4. Total Charges
5. Monthly Usage (GB)
6. Support Tickets
7. Contract Type
8. Internet Service Type
9. Tech Support (boolean)
10. Online Security (boolean)

## Training New Model

To retrain the model with your own data:

1. Add CSV file with customer data to `backend/`
2. Update `DATA_PATH` in `.env`
3. Delete existing model files: `backend/models/churn_model*`
4. Restart the API - model will auto-train on startup

## Deployment

### Option 1: Railway

```bash
# Install railway CLI
# Connect GitHub repo
railway link
railway up
```

### Option 2: Render

1. Connect GitHub repo to Render
2. Set build command: `pip install -r backend/requirements.txt`
3. Set start command: `python backend/main.py`
4. Set environment variables in Render dashboard

### Option 3: Fly.io

```bash
fly launch
fly deploy
```

## Docker Deployment

```bash
docker build -t churn-api .
docker run -p 8000:8000 \
  -e API_KEY=your-key \
  -e FRONTEND_URL=https://yourdomain.com \
  churn-api
```

## Monitoring

Monitor the API with:
- Request logs in stdout
- Model metrics endpoint: `/model/metrics`
- Health check: `/health`

## Troubleshooting

### Model not loaded
- Check `MODEL_PATH` environment variable
- Ensure model files exist in `backend/models/`
- Check logs for training errors

### SHAP errors
- SHAP may fail with complex models - uses fallback feature importances
- Check backend logs for detailed error messages

### CORS errors
- Update `FRONTEND_URL` environment variable
- Ensure frontend includes `X-API-Key` header

### Rate limiting
- Check IP-based rate limits in logs
- Update `RATE_LIMIT` in main.py if needed

## Development

```bash
# Run with auto-reload
uvicorn main:app --reload

# Generate API docs
# Visit http://localhost:8000/docs for Swagger UI

# Run tests (if available)
pytest tests/
```

## License

MIT
