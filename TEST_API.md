# Testing Your Render ML API

## Quick Test in Browser Console

Copy and paste this in your browser console (F12 → Console tab):

```javascript
// Test your Render API
const testPrediction = async () => {
  try {
    const response = await fetch(
      'https://company-churn-detection-project-13.onrender.com/predict',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [0.5, 0.5, 0.5, 0.5, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }),
      }
    );
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', data);
    
    if (data.churn_probability !== undefined) {
      console.log('✅ API is working! Churn probability:', data.churn_probability);
    } else {
      console.log('❌ API returned unexpected format');
    }
  } catch (error) {
    console.error('❌ API Error:', error.message);
  }
};

testPrediction();
```

## Expected Response

If your API is working, you should see:
```
Status: 200
Response: {churn_probability: 0.75, prediction: 1}
✅ API is working! Churn probability: 0.75
```

## If You See "Failed to fetch"

This means CORS is not enabled. Your `app.py` must have:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then **redeploy to Render**.

## Switching from Mock to Real API

Once your API is working:

1. Change `.env.local`:
   ```
   NEXT_PUBLIC_USE_MOCK_API=false
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

3. Go to Customer Profile and select a customer
   - Auto-predict will now use your real API
   - Check browser console (F12) for API logs

## Debugging in Dashboard

The app logs API calls. Open browser console (F12 → Console) and look for:
- `[v0] Using mock API` - Using demo data
- `[v0] Calling real API at:` - Attempting real API call
- `[v0] Got prediction from real API:` - Success!
- `[v0] Prediction error:` - API failed, check CORS
