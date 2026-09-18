# Deployment Guide

Two services: a **FastAPI backend** and a **Next.js frontend**. Deploy the
backend first, then point the frontend at it.

## 1. Push to GitHub

```bash
git push origin main
```

## 2. Backend → Render (or Railway)

The backend ships a Dockerfile that trains the model at build time, so the image
is self-contained.

**Render**
1. New → **Web Service** → connect this repo.
2. Root directory: `backend`
3. Environment: **Docker** (it auto-detects `backend/Dockerfile`).
4. (Optional) Environment variables:
   - `API_KEY` — set to require an `X-API-Key` header (leave unset for an open demo).
   - `FRONTEND_ORIGINS` — your frontend URL, e.g. `https://your-app.vercel.app` (or `*` for any).
5. Deploy. Note the URL, e.g. `https://your-backend.onrender.com`.
6. Verify: open `https://your-backend.onrender.com/health` — it should return `{"status":"healthy",...}`.

> Free-tier Render services sleep after inactivity; the first request after a
> while takes ~30s to wake. The frontend's demo-mode fallback covers this.

**Railway** is equivalent: new project from repo, root `backend`, it reads the
`Procfile` / Dockerfile; add the same env vars.

## 3. Frontend → Vercel

1. New Project → import this repo.
2. **Root Directory: `frontend`** (important — the Next app is not at the repo root).
3. Framework preset: **Next.js** (auto-detected).
4. Environment variables:
   - `NEXT_PUBLIC_API_BASE_URL` = the backend URL from step 2 (no trailing slash).
   - `NEXT_PUBLIC_API_KEY` = the same value as the backend's `API_KEY`, **only if** you set one.
5. Deploy.

Install command note: this project uses `--legacy-peer-deps`. If Vercel's build
fails on peer deps, set the install command to `npm install --legacy-peer-deps`.

## 4. Verify the two are talking

Open the deployed frontend. The header badge should read **"Live API"** (green).
If it says **"Demo data"** (amber), the frontend can't reach the backend — check:
- `NEXT_PUBLIC_API_BASE_URL` is correct and public.
- The backend's `FRONTEND_ORIGINS` allows the frontend origin (CORS).
- The backend is awake (hit `/health` once to wake a sleeping free instance).

## Local Docker (optional)

Run the whole stack locally with one command:

```bash
docker compose up --build
# Frontend  → http://localhost:3000
# API docs  → http://localhost:8000/docs
```
