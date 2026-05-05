from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
import logging
import math

load_dotenv()

app = FastAPI(title="Risk Assessment Service")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Policy configuration
MIN_AGE = int(os.getenv("MIN_AGE", "18"))
MAX_AGE = int(os.getenv("MAX_AGE", "65"))
MIN_LOAN = float(os.getenv("MIN_LOAN_AMOUNT", "10000"))
MAX_LOAN = float(os.getenv("MAX_LOAN_AMOUNT", "500000"))


class RiskAssessmentRequest(BaseModel):
    session_id: str
    user_id: str
    transcript: str = ""
    age_estimate: int = 30
    location: dict = {}
    employment_status: Optional[str] = "employed"
    monthly_income: Optional[float] = 50000
    loan_purpose: Optional[str] = "personal"
    declared_age: Optional[int] = None
    credit_score: Optional[int] = None


class RiskAssessmentResponse(BaseModel):
    risk_band: str
    risk_score: float
    propensity_score: float
    fraud_indicators: List[str]
    reasons: List[str]
    max_eligible_amount: float
    recommended_tenure: List[int]
    interest_rate_range: dict
    bureau_score: int
    decision_explanation: str


# Simulated bureau data
def get_bureau_score(user_id: str) -> dict:
    """Simulate bureau/credit score lookup"""
    import hashlib
    hash_val = int(hashlib.md5(user_id.encode()).hexdigest(), 16) % 400
    score = 550 + hash_val  # Range: 550-950
    
    return {
        "score": min(score, 900),
        "active_loans": hash_val % 4,
        "defaults": 1 if score < 600 else 0,
        "credit_age_months": 12 + (hash_val % 120),
        "enquiries_last_6m": hash_val % 5,
    }


def calculate_risk_score(
    age: int,
    income: float,
    employment: str,
    bureau: dict,
    location: dict,
    declared_age: Optional[int] = None,
) -> tuple:
    """Rule-based risk scoring engine"""
    score = 0.0
    fraud_indicators = []
    reasons = []

    # --- Age Risk (10% weight) ---
    if age < MIN_AGE:
        score += 0.3
        fraud_indicators.append("Below minimum age")
    elif age > MAX_AGE:
        score += 0.2
        reasons.append("Near maximum age limit")
    elif 25 <= age <= 45:
        score += 0.0  # Prime age
    else:
        score += 0.05

    # Age consistency check
    if declared_age and abs(declared_age - age) > 5:
        score += 0.15
        fraud_indicators.append(f"Age mismatch: declared {declared_age} vs estimated {age}")

    # --- Income Risk (25% weight) ---
    if income <= 0:
        score += 0.25
        fraud_indicators.append("Zero or negative income declared")
    elif income < 15000:
        score += 0.15
        reasons.append("Low income bracket")
    elif income < 30000:
        score += 0.08
        reasons.append("Moderate income bracket")
    elif income >= 100000:
        score += 0.0
        reasons.append("High income bracket - low risk")
    else:
        score += 0.03

    # --- Employment Risk (15% weight) ---
    emp_lower = (employment or "").lower()
    if emp_lower in ["employed", "government", "government employee"]:
        score += 0.0
        reasons.append("Stable employment")
    elif emp_lower == "self-employed":
        score += 0.05
        reasons.append("Self-employed - moderate risk")
    elif emp_lower in ["unemployed", "student"]:
        score += 0.2
        reasons.append("Unemployed/student - higher risk")
    else:
        score += 0.03

    # --- Bureau Score (30% weight) ---
    bureau_score = bureau.get("score", 700)
    if bureau_score >= 800:
        score += 0.0
        reasons.append(f"Excellent credit score: {bureau_score}")
    elif bureau_score >= 700:
        score += 0.05
        reasons.append(f"Good credit score: {bureau_score}")
    elif bureau_score >= 600:
        score += 0.15
        reasons.append(f"Fair credit score: {bureau_score}")
    else:
        score += 0.25
        reasons.append(f"Poor credit score: {bureau_score}")

    if bureau.get("defaults", 0) > 0:
        score += 0.15
        fraud_indicators.append(f"Previous defaults: {bureau['defaults']}")

    if bureau.get("enquiries_last_6m", 0) > 3:
        score += 0.05
        reasons.append("Multiple recent credit enquiries")

    # --- Location Risk (10% weight) ---
    lat = location.get("lat", location.get("latitude", 28.6))
    lng = location.get("lng", location.get("longitude", 77.2))
    if lat == 0 and lng == 0:
        score += 0.1
        fraud_indicators.append("Invalid/spoofed location")
    elif not (6.0 <= lat <= 37.0 and 68.0 <= lng <= 97.5):
        score += 0.1
        fraud_indicators.append("Location outside India")

    # --- Existing Debt (10% weight) ---
    active_loans = bureau.get("active_loans", 0)
    if active_loans >= 3:
        score += 0.1
        reasons.append(f"High existing debt: {active_loans} active loans")
    elif active_loans >= 1:
        score += 0.03

    # Normalize score (0-1)
    risk_score = min(max(score, 0.0), 1.0)

    return risk_score, fraud_indicators, reasons


def calculate_propensity(income: float, employment: str, bureau: dict) -> float:
    """Calculate loan acceptance propensity score"""
    propensity = 0.5
    if income >= 50000:
        propensity += 0.2
    elif income >= 30000:
        propensity += 0.1
    
    if employment in ["employed", "government"]:
        propensity += 0.15
    
    if bureau.get("score", 700) >= 750:
        propensity += 0.15
    
    return min(propensity, 1.0)


@app.post("/assess", response_model=RiskAssessmentResponse)
async def assess_risk(request: RiskAssessmentRequest):
    """Comprehensive risk assessment with fraud detection and policy evaluation"""
    try:
        logger.info(f"Assessing risk for session {request.session_id}")

        # Get bureau data
        bureau = get_bureau_score(request.user_id)
        income = request.monthly_income or 50000

        # Calculate risk
        risk_score, fraud_indicators, reasons = calculate_risk_score(
            age=request.age_estimate,
            income=income,
            employment=request.employment_status or "employed",
            bureau=bureau,
            location=request.location,
            declared_age=request.declared_age,
        )

        # Determine risk band
        if risk_score < 0.25:
            risk_band = "low"
        elif risk_score < 0.55:
            risk_band = "medium"
        else:
            risk_band = "high"

        # Calculate max eligible amount
        income_multiplier = {"low": 48, "medium": 30, "high": 12}
        max_amount = min(income * income_multiplier[risk_band], MAX_LOAN)
        max_amount = max(max_amount, MIN_LOAN) if risk_band != "high" else max_amount

        # Interest rate ranges by risk band
        rate_ranges = {
            "low": {"min": 8.5, "max": 10.5},
            "medium": {"min": 11.0, "max": 14.5},
            "high": {"min": 16.0, "max": 22.0},
        }

        # Propensity
        propensity = calculate_propensity(income, request.employment_status or "employed", bureau)

        # Decision explanation
        explanation = f"Based on risk band '{risk_band}' (score: {risk_score:.2f}), "
        explanation += f"bureau score {bureau['score']}, "
        explanation += f"monthly income ₹{income:,.0f}, "
        explanation += f"the customer is eligible for up to ₹{max_amount:,.0f}."
        if fraud_indicators:
            explanation += f" Fraud signals detected: {', '.join(fraud_indicators)}."

        return RiskAssessmentResponse(
            risk_band=risk_band,
            risk_score=round(risk_score, 4),
            propensity_score=round(propensity, 4),
            fraud_indicators=fraud_indicators,
            reasons=reasons,
            max_eligible_amount=max_amount,
            recommended_tenure=[12, 24, 36, 48, 60] if risk_band == "low" else [12, 24, 36],
            interest_rate_range=rate_ranges[risk_band],
            bureau_score=bureau["score"],
            decision_explanation=explanation,
        )
    except Exception as e:
        logger.error(f"Risk assessment error: {e}")
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}")


@app.get("/health")
async def health():
    return {
        "status": "Risk Service is running",
        "features": ["risk_scoring", "fraud_detection", "bureau_simulation", "propensity_scoring"],
        "policy": {"min_age": MIN_AGE, "max_age": MAX_AGE, "min_loan": MIN_LOAN, "max_loan": MAX_LOAN},
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("RISK_SERVICE_PORT", 3005)))
