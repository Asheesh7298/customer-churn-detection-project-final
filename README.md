# Customer Churn Prediction Dashboard

A comprehensive ML-powered analytics platform for predicting and analyzing customer churn with SHAP feature explanations, real-time predictions, and trend analysis.

## Features

- **Real-time Churn Predictions**: Get churn probability scores with 200-500ms response time
- **SHAP Feature Explanations**: Understand which features influence each prediction
- **Interactive Dashboard**: 6 specialized pages for different analysis views
- **Automatic Risk Segmentation**: Group customers by risk levels (low/medium/high)
- **Trend Analysis**: 12-month churn trends with forecasting indicators
- **Batch Predictions**: Process multiple customers simultaneously
- **Polling Updates**: Auto-refreshing data without manual refresh
- **Security**: API key authentication, input validation, rate limiting
- **Model Transparency**: Track model accuracy, precision, recall, and ROC-AUC

## Tech Stack

### Frontend
- **Next.js 15** with App Router
- **React 19** with hooks and suspense
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **shadcn/ui** for components

### Backend
- **FastAPI** for high-performance REST API
- **scikit-learn** for ML models
- **SHAP** for feature importance
- **Pydantic** for validation
- **Python 3.9+** runtime

### Deployment
- **Vercel** for frontend (auto-deploys on push)
- **Railway/Render/Fly.io** for backend
- **GitHub** for version control

## Quick Start

### 1. Clone & Install

```bash
# Clone repository
git clone <your-repo>
cd churn-prediction-dashboard

# Install backend dependencies
cd backend
pip install -r requirements.txt
cp .env.example .env

# Install frontend dependencies (from root)
cd ..
pnpm install
```

### 2. Run Locally

```bash
# Terminal 1: Backend
cd backend
python main.py
# Available at http://localhost:8000

# Terminal 2: Frontend
pnpm dev
# Available at http://localhost:3000
```

### 3. Explore

- Dashboard: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Select a customer and make predictions
- View trends and segmentation

## Project Structure

```
.
├── app/                          # Frontend pages
│   ├── page.tsx                 # Home/Dashboard
│   ├── customer-profile/        # Make predictions
│   ├── result-charts/           # Pie and bar charts
│   ├── trend-analysis/          # Time-series trends
│   ├── customer-segmentation/   # Risk grouping
│   ├── explanation-panel/       # SHAP explanations
│   └── api/                     # Backend API routes
├── components/                   # Reusable React components
├── lib/                         # Shared utilities
│   ├── api-client.ts            # HTTP client
│   ├── hooks.ts                 # Custom React hooks
│   └── types.ts                 # TypeScript interfaces
├── backend/                     # FastAPI application
│   ├── main.py                  # Entry point
│   ├── models/                  # ML models & training
│   ├── routes/                  # API endpoints
│   ├── schemas/                 # Pydantic validation
│   └── utils/                   # SHAP, data loading
├── SETUP.md                     # Local development guide
├── DEPLOYMENT.md                # Production deployment
└── backend/README.md            # Backend documentation
```

## API Endpoints

### Predictions
- `POST /predict` - Single prediction with feature importance
- `POST /predict/batch` - Batch predictions for multiple customers

### Data
- `GET /customers` - List all customers
- `GET /customers/{id}` - Customer details and profile
- `GET /trends` - 12-month churn trends
- `GET /segmentation` - Customers grouped by risk level

### Monitoring
- `GET /health` - Service status
- `GET /model/metrics` - Model performance metrics
- `GET /docs` - Interactive API documentation

All endpoints require `X-API-Key` header (except `/health`).

## Key Pages

### Home Dashboard
- Key metrics: accuracy, average risk, high-risk count
- Top 10 risk customers (auto-updates every 30 seconds)
- Quick action links

### Customer Profile
- Customer selection from dropdown
- Editable feature form
- Real-time prediction results
- Feature importance breakdown

### Result Charts
- Risk distribution (pie chart)
- Average churn score by risk level (bar chart)
- Customer count by segment (bar chart)
- Summary statistics

### Trend Analysis
- 12-month churn trend (area chart)
- Peak/lowest months
- Trend direction indicator
- Customer acquisition vs churn (dual-axis chart)

### Customer Segmentation
- Low/Medium/High risk groups
- Clickable customer lists
- Segmentation statistics
- Average scores per segment

### Explanation Panel
- How-to guide
- Feature contribution interpretation
- Positive/negative impact explanation

## Configuration

### Backend (.env)
```env
ENVIRONMENT=development
PORT=8000
API_KEY=dev-key-change-in-production
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
BACKEND_API_KEY=dev-key-change-in-production
```

See [SETUP.md](SETUP.md) for detailed configuration.

## Security

- **API Key Authentication**: All endpoints secured with X-API-Key header
- **Input Validation**: Pydantic models enforce strict constraints
- **Rate Limiting**: 100 requests/minute per API key
- **CORS Whitelist**: Only specified frontend domains allowed
- **Error Handling**: Generic error messages prevent information leakage
- **HTTPS**: Required for production deployments

See [DEPLOYMENT.md](DEPLOYMENT.md) for security checklist.

## Performance

- **Prediction Latency**: 200-500ms per customer
- **Batch Processing**: ~1-3 seconds for 100 customers
- **API Caching**: 60-second response caching
- **Polling**: 30-second refresh interval (configurable)
- **Model Loading**: ~2 seconds on startup, then cached

## Development

### Adding a New Feature

1. Create new page in `app/` directory
2. Add hooks in `lib/hooks.ts` for data fetching
3. Create components in `components/` as needed
4. Add API endpoint in `backend/routes/`
5. Test locally before deploying

### Modifying ML Model

1. Edit `backend/models/churn_model.py`
2. Delete model files: `rm backend/models/churn_model*`
3. Restart backend (auto-trains on startup)
4. Test predictions in Customer Profile page

### Adding Custom Data

1. Prepare CSV with columns: customer_id, age, tenure, monthly_charges, etc.
2. Place in `backend/` directory
3. Update `DATA_PATH` in `.env`
4. Restart backend

## Deployment

### Quick Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# Go to vercel.com, import from GitHub, configure env vars
```

### Quick Deploy Backend to Railway

```bash
# railway login
# railway link (select your repo)
# Add env vars in Railway dashboard
# Auto-deploys on push
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions for Railway, Render, Fly.io, and Netlify.

## Monitoring & Logs

### Backend Logs
```bash
# Local: Terminal where python main.py runs
# Railway: Dashboard → Logs
# Render: Logs tab
# Fly.io: fly logs
```

### Frontend Logs
```bash
# Local: Browser console (F12)
# Vercel: Analytics tab
# Vercel: Deployments → logs
```

## Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Port in use - change PORT in .env
# Model training fails - delete model files and restart
# Missing dependencies - pip install -r requirements.txt
```

**CORS errors**
```bash
# Check FRONTEND_URL in backend/.env
# Must match exactly: http://localhost:3000 (no trailing slash)
# Restart backend
```

**Predictions not working**
```bash
# Check X-API-Key header matches
# Check NEXT_PUBLIC_API_BASE_URL in .env.local
# Check backend is running: curl http://localhost:8000/health
```

See [SETUP.md](SETUP.md) for detailed troubleshooting.

## Advanced Usage

### Custom ML Model

Replace the RandomForest with your own:

```python
# backend/models/churn_model.py
from sklearn.ensemble import GradientBoostingClassifier

# Change model initialization
self.model = GradientBoostingClassifier(...)
```

### Real-time Updates with WebSockets

Currently uses HTTP polling. Upgrade to WebSockets for lower latency:

```python
# backend/main.py - add WebSocket route
@app.websocket("/ws/predictions")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    # Stream predictions
```

### Add Database

Connect to PostgreSQL/MySQL for persistence:

```python
# backend/main.py
from sqlalchemy import create_engine
engine = create_engine(os.getenv("DATABASE_URL"))
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes and test locally
4. Commit: `git commit -m "Add feature"`
5. Push: `git push origin feature/your-feature`
6. Create Pull Request

## License

MIT License - see LICENSE file for details

## Support

- **Documentation**: See [SETUP.md](SETUP.md) and [DEPLOYMENT.md](DEPLOYMENT.md)
- **API Docs**: http://localhost:8000/docs
- **Issues**: GitHub Issues
- **Email**: support@example.com

## Roadmap

- [ ] Export segmentation as CSV
- [ ] Custom thresholds for risk levels
- [ ] Model retraining with user data
- [ ] Real-time WebSocket updates
- [ ] Slack/email notifications
- [ ] Advanced SHAP visualizations
- [ ] A/B testing framework
- [ ] Custom model upload
- [ ] Multi-language support
- [ ] Mobile app

## Changelog

### v1.0.0 (Current)
- Initial release with 6 dashboard pages
- SHAP feature importance
- Batch predictions
- Trend analysis
- Customer segmentation
- API key security
- Rate limiting
- Comprehensive documentation

---

**Built with ❤️ for ML-powered customer insights**

For questions or feedback, please open an issue on GitHub.
