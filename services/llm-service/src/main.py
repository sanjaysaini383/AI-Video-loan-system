from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import logging
import httpx

load_dotenv()

app = FastAPI(title="LLM Service - Conversation Analysis")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LLMAnalysisRequest(BaseModel):
    session_id: str
    transcript: str
    extracted_data: dict

class LLMAnalysisResponse(BaseModel):
    customer_classification: str
    risk_indicators: list
    confidence: float
    structured_insights: dict

@app.post("/analyze", response_model=LLMAnalysisResponse)
async def analyze_conversation(request: LLMAnalysisRequest):
    """
    Use LLM to analyze conversation context and extract insights
    TODO: Integrate with Anthropic Claude API or OpenAI
    """
    try:
        logger.info(f"Analyzing conversation for session {request.session_id}")
        
        # TODO: Call Claude API with transcript
        # response = anthropic.messages.create(
        #     model="claude-3-sonnet-20240229",
        #     max_tokens=1024,
        #     messages=[{"role": "user", "content": request.transcript}]
        # )
        
        # Placeholder response
        response = LLMAnalysisResponse(
            customer_classification="salaried_professional",
            risk_indicators=["low_employment_tenure"],
            confidence=0.85,
            structured_insights={
                "employment_type": "salaried",
                "loan_purpose": "personal_use",
                "income_stability": "moderate"
            }
        )
        
        return response
    except Exception as e:
        logger.error(f"LLM analysis error: {e}")
        raise HTTPException(status_code=500, detail="LLM analysis failed")

@app.get("/health")
async def health():
    return {"status": "LLM Service is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("LLM_SERVICE_PORT", 3007)))
