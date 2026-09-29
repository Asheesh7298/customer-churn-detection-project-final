# Deployment Guide

Two services: a **FastAPI backend** (Render) and a **React + Vite frontend**
(Vercel). Deploy the backend first.

## 1. Push to GitHub

```bash
git push origin main
```

## 2. Backend → Render

**New → Web Service** → connect this repo, then:

| Setting | Value |
|---|---|
| Language | Python 3 |
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn churn_service.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/health` |

Python is pinned by `backend/.python-version` (3.12). The trained model is
committed in `backend/artifacts/`, so the service loads it at startup — no
training happens on Render. `requirements.txt` holds only runtime dependencies;
training and test tools (xgboost, pytest) live in `requirements-dev.txt`.

Optional environment variables:
- `API_KEY` — require an `X-API-Key` header on prediction endpoints.
- `FRONTEND_ORIGINS` — allowed CORS origins (defaults to `*`).

Verify: `https://<your-service>.onrender.com/health` returns `{"status":"healthy",...}`.

> Free-tier services sleep after ~15 minutes idle and take ~30s to wake. The
> frontend shows a labelled snapshot of real results meanwhile, and switches to
> live data automatically once the API responds.

## 3. Frontend → Vercel

1. New Project → import this repo.
2. **Root Directory: `frontend`**.
3. That's it — `frontend/vercel.json` tells Vercel it's a Vite app, where the
   build output is, and to route every URL to `index.html` so links like
   `/model` work on refresh.

No environment variables are required: the app calls the live Render API by
default. To point it elsewhere, set `VITE_API_BASE_URL` (and `VITE_API_KEY`
only if the backend sets `API_KEY`). `VITE_*` values are baked in at build
time, so redeploy after changing them.

## 4. Verify the two are talking

The badge at the bottom of the sidebar should read **"Live API"** (green). If it
reads **"Demo data"** (amber) for more than a minute:
- Open the backend's `/health` URL to check it's up.
- Check `VITE_API_BASE_URL`, if you set one, is correct.
- Check the backend's `FRONTEND_ORIGINS` allows your frontend's origin.

## Local Docker (optional)

Run the whole stack locally with one command:

```bash
docker compose up --build
# Frontend  → http://localhost:3000
# API docs  → http://localhost:8000/docs
```
