from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and scaler using absolute paths (works on all deployment platforms)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model = joblib.load(os.path.join(BASE_DIR, "churn_rf_model.pkl"))
scaler = joblib.load(os.path.join(BASE_DIR, "scaler.pkl"))

# CORS setup — replace the URL below with your actual frontend URL
# Use ["*"] to allow all origins during development/testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔁 Replace "*" with your real frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InputData(BaseModel):
    data: list

@app.get("/")
def home():
    return {"message": "Churn Prediction API is running 🚀"}

@app.post("/predict")
def predict(input_data: InputData):
    expected_length = 30
    if len(input_data.data) != expected_length:
        raise HTTPException(
            status_code=422,
            detail=f"Input should have exactly {expected_length} features, but got {len(input_data.data)}",
        )

    input_array = np.array(input_data.data).reshape(1, -1)
    input_scaled = scaler.transform(input_array)

    prediction = model.predict(input_scaled)
    probability = model.predict_proba(input_scaled)

    return {
        "prediction": int(prediction[0]),
        "churn_probability": float(probability[0][1])
    }

# Entry point for local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)