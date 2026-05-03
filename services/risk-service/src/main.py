from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import logging

load_dotenv()

app = FastAPI(title="Risk Assessment Service")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# TODO: Load ML models (scikit-learn, XGBoost)
# model = joblib.load('models/risk_model.pkl')

class RiskAssessmentRequest(BaseModel):
    session_id: str
    user_id: str
    transcript: str
    age_estimate: int
    location: dict
    employment_status: str = None
    monthly_income: float = None

class RiskAssessmentResponse(BaseModel):
    risk_band: str  # low, medium, high
    risk_score: float
    propensity_score: float
    fraud_indicators: list
    reasons: list

@app.post("/assess", response_model=RiskAssessmentResponse)
async def assess_risk(request: RiskAssessmentRequest):
    """
    Assess loan risk based on customer data
    TODO: Integrate with bureau data and ML models
    """
    try:
        logger.info(f"Assessing risk for session {request.session_id}")
        
        # Placeholder logic
        risk_score = 0.45
        risk_band = "medium" if risk_score > 0.5 else "low"
        
        response = RiskAssessmentResponse(
            risk_band=risk_band,
            risk_score=risk_score,
            propensity_score=0.72,
            fraud_indicators=[],
            reasons=["Income verification needed", "New to credit history"]
        )
        
        return response
    except Exception as e:
        logger.error(f"Risk assessment error: {e}")
        raise HTTPException(status_code=500, detail="Risk assessment failed")

@app.get("/health")
async def health():
    return {"status": "Risk Service is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("RISK_SERVICE_PORT", 3005)))
