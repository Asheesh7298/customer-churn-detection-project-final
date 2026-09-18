FROM python:3.11-slim

WORKDIR /app

# System deps for numpy/scipy/xgboost wheels are already bundled; keep image lean.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Train the model at build time so the image ships with ready artifacts.
RUN python train.py

EXPOSE 8000

CMD ["uvicorn", "churn_service.main:app", "--host", "0.0.0.0", "--port", "8000"]
