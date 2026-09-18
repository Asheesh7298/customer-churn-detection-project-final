FROM python:3.11-slim

WORKDIR /app

# Dev requirements include xgboost, needed to train at build time.
COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements-dev.txt

COPY . .

# Train the model at build time so the image ships with ready artifacts.
RUN python train.py

EXPOSE 8000

CMD ["uvicorn", "churn_service.main:app", "--host", "0.0.0.0", "--port", "8000"]
