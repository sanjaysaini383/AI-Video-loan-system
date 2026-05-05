from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
import logging
import httpx
import json
import re

load_dotenv()

app = FastAPI(title="LLM Service - Conversation Analysis")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# LLM Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq").lower()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
LOCAL_LLM_URL = os.getenv("LOCAL_LLM_URL", "http://localhost:11434")

SYSTEM_PROMPT = """You are a loan origination AI analyst. Analyze the customer conversation transcript and extract structured intelligence for loan decisioning.

Return a JSON object with these fields:
{
  "classification": "low|medium|high" (risk classification),
  "confidence": 0.0-1.0 (your confidence in this classification),
  "risks": ["list of risk indicators found"],
  "customer_persona": "description of customer type",
  "extracted_data": {
    "employment_type": "employed|self-employed|unemployed|student",
    "employer": "name if mentioned",
    "monthly_income": number or null,
    "loan_purpose": "purpose stated",
    "consent_given": true/false,
    "family_dependents": number or null
  },
  "sentiment": "positive|neutral|negative|anxious",
  "red_flags": ["any concerning statements or inconsistencies"],
  "recommendation": "brief recommendation for the loan officer"
}

Only return valid JSON. Do not include any text outside the JSON."""


class LLMAnalysisRequest(BaseModel):
    session_id: str
    transcript: str
    extracted_data: dict = {}


class LLMAnalysisResponse(BaseModel):
    customer_classification: str
    risk_indicators: List[str]
    confidence: float
    structured_insights: dict


def parse_llm_response(raw_text: str) -> dict:
    """Extract JSON from LLM response, handling markdown code blocks"""
    text = raw_text.strip()
    
    # Try to find JSON in code blocks
    json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if json_match:
        text = json_match.group(1)
    
    # Try direct JSON parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Try to find JSON object in the text
    json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass
    
    return {"classification": "medium", "confidence": 0.5, "risks": [], "error": "Failed to parse LLM response"}


def simulate_analysis(transcript: str) -> dict:
    """Local simulation when no LLM API is configured"""
    lower = transcript.lower()
    
    # Detect risk level from keywords
    high_risk_words = ["unemployed", "debt", "default", "bankruptcy", "no income", "urgent"]
    low_risk_words = ["government", "stable", "savings", "property", "salaried", "employed"]
    
    high_count = sum(1 for w in high_risk_words if w in lower)
    low_count = sum(1 for w in low_risk_words if w in lower)
    
    if high_count > low_count:
        classification = "high"
        confidence = 0.7
    elif low_count > high_count:
        classification = "low"
        confidence = 0.82
    else:
        classification = "medium"
        confidence = 0.75
    
    # Extract data
    risks = []
    if "unemployed" in lower:
        risks.append("Customer is unemployed")
    if "urgent" in lower or "emergency" in lower:
        risks.append("Urgent funding need - possible financial distress")
    if "debt" in lower:
        risks.append("Existing debt mentioned")
    
    # Detect consent
    consent = any(w in lower for w in ["i consent", "i agree", "yes, i agree", "i accept", "give my consent"])
    
    # Detect employment
    employment = "employed"
    if "self-employed" in lower or "business" in lower:
        employment = "self-employed"
    elif "unemployed" in lower:
        employment = "unemployed"
    elif "government" in lower:
        employment = "government"
    
    # Detect sentiment
    positive_words = ["happy", "excited", "great", "thank", "appreciate"]
    negative_words = ["worried", "anxious", "concerned", "difficult", "problem"]
    
    pos = sum(1 for w in positive_words if w in lower)
    neg = sum(1 for w in negative_words if w in lower)
    sentiment = "positive" if pos > neg else "negative" if neg > pos else "neutral"
    
    return {
        "classification": classification,
        "confidence": confidence,
        "risks": risks,
        "customer_persona": f"{employment} customer seeking loan",
        "extracted_data": {
            "employment_type": employment,
            "consent_given": consent,
            "loan_purpose": "personal" if "personal" in lower else "business" if "business" in lower else "education" if "education" in lower else "home" if "home" in lower else "general",
        },
        "sentiment": sentiment,
        "red_flags": risks,
        "recommendation": f"{'Proceed with caution' if classification == 'high' else 'Recommended for approval' if classification == 'low' else 'Standard review required'}",
    }


async def call_llm(transcript: str) -> dict:
    """Route to appropriate LLM provider"""
    prompt = f"{SYSTEM_PROMPT}\n\nTranscript:\n{transcript}"
    
    try:
        if LLM_PROVIDER == "groq" and GROQ_API_KEY and GROQ_API_KEY != "gsk_your-groq-key-here":
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                    json={"model": "mixtral-8x7b-32768", "messages": [{"role": "user", "content": prompt}], "max_tokens": 1024},
                )
                data = resp.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "{}")
                return parse_llm_response(content)

        elif LLM_PROVIDER == "gemini" and GEMINI_API_KEY and GEMINI_API_KEY != "your-gemini-key-here":
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
                    params={"key": GEMINI_API_KEY},
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                )
                data = resp.json()
                content = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
                return parse_llm_response(content)

        elif LLM_PROVIDER == "openai" and OPENAI_API_KEY and OPENAI_API_KEY != "sk-your-openai-key-here":
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
                    json={"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": prompt}], "max_tokens": 1024},
                )
                data = resp.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "{}")
                return parse_llm_response(content)

        elif LLM_PROVIDER == "ollama":
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{LOCAL_LLM_URL}/api/generate",
                    json={"model": "mistral", "prompt": prompt, "stream": False},
                )
                data = resp.json()
                return parse_llm_response(data.get("response", "{}"))

        elif LLM_PROVIDER == "anthropic" and ANTHROPIC_API_KEY and ANTHROPIC_API_KEY != "sk-ant-your-key-here":
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={"x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json"},
                    json={"model": "claude-3-haiku-20240307", "max_tokens": 1024, "messages": [{"role": "user", "content": prompt}]},
                )
                data = resp.json()
                content = data.get("content", [{}])[0].get("text", "{}")
                return parse_llm_response(content)

    except Exception as e:
        logger.warning(f"LLM API call failed ({LLM_PROVIDER}): {e}, falling back to simulation")

    # Fallback to simulation
    return simulate_analysis(transcript)


@app.post("/analyze", response_model=LLMAnalysisResponse)
async def analyze_conversation(request: LLMAnalysisRequest):
    """Analyze conversation using LLM or simulation"""
    try:
        logger.info(f"Analyzing conversation for session {request.session_id} using {LLM_PROVIDER}")
        
        result = await call_llm(request.transcript)
        
        return LLMAnalysisResponse(
            customer_classification=result.get("classification", "medium"),
            risk_indicators=result.get("risks", result.get("red_flags", [])),
            confidence=float(result.get("confidence", 0.5)),
            structured_insights={
                "llm_provider": LLM_PROVIDER,
                "customer_persona": result.get("customer_persona", ""),
                "extracted_data": result.get("extracted_data", {}),
                "sentiment": result.get("sentiment", "neutral"),
                "recommendation": result.get("recommendation", ""),
                "analysis_complete": True,
            },
        )
    except Exception as e:
        logger.error(f"LLM analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"LLM analysis failed: {str(e)}")


@app.get("/health")
async def health():
    has_key = bool(
        (LLM_PROVIDER == "groq" and GROQ_API_KEY and GROQ_API_KEY != "gsk_your-groq-key-here")
        or (LLM_PROVIDER == "ollama")
        or (LLM_PROVIDER == "openai" and OPENAI_API_KEY)
        or (LLM_PROVIDER == "gemini" and GEMINI_API_KEY)
        or (LLM_PROVIDER == "anthropic" and ANTHROPIC_API_KEY)
    )
    return {
        "status": "LLM Service is running",
        "provider": LLM_PROVIDER,
        "configured": has_key,
        "mode": "api" if has_key else "simulation",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("LLM_SERVICE_PORT", 3007)))
