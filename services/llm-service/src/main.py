from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import logging
import httpx
import json

load_dotenv()

app = FastAPI(title="LLM Service - Conversation Analysis")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# LLM Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq").lower()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
LOCAL_LLM_URL = os.getenv("LOCAL_LLM_URL", "http://localhost:11434")

class LLMAnalysisRequest(BaseModel):
    session_id: str
    transcript: str
    extracted_data: dict

class LLMAnalysisResponse(BaseModel):
    customer_classification: str
    risk_indicators: list
    confidence: float
    structured_insights: dict

async def analyze_with_groq(transcript: str) -> dict:
    """Call Groq API (30 req/min - best for development)"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "mixtral-8x7b-32768",
                "messages": [{
                    "role": "user",
                    "content": f"Analyze this loan application conversation and classify risk:\n{transcript}\n\nRespond with JSON: {{\"classification\": \"low|medium|high\", \"risks\": [...], \"confidence\": 0.0-1.0}}"
                }],
                "max_tokens": 1024
            }
        )
    return response.json()

async def analyze_with_ollama(transcript: str) -> dict:
    """Call Local Ollama (unlimited - no rate limits)"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{LOCAL_LLM_URL}/api/generate",
            json={
                "model": "mistral",
                "prompt": f"Analyze this loan application conversation and classify risk:\n{transcript}\n\nRespond with JSON: {{\"classification\": \"low|medium|high\", \"risks\": [...], \"confidence\": 0.0-1.0}}",
                "stream": False
            }
        )
    return response.json()

async def analyze_with_openai(transcript: str) -> dict:
    """Call OpenAI API (3 req/min - higher cost)"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-3.5-turbo",
                "messages": [{
                    "role": "user",
                    "content": f"Analyze this loan application conversation and classify risk:\n{transcript}\n\nRespond with JSON: {{\"classification\": \"low|medium|high\", \"risks\": [...], \"confidence\": 0.0-1.0}}"
                }],
                "max_tokens": 1024
            }
        )
    return response.json()

async def analyze_with_gemini(transcript: str) -> dict:
    """Call Google Gemini (60 req/min - good free tier)"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
            params={"key": GEMINI_API_KEY},
            json={
                "contents": [{
                    "parts": [{
                        "text": f"Analyze this loan application conversation and classify risk:\n{transcript}\n\nRespond with JSON: {{\"classification\": \"low|medium|high\", \"risks\": [...], \"confidence\": 0.0-1.0}}"
                    }]
                }]
            }
        )
    return response.json()

async def analyze_with_anthropic(transcript: str) -> dict:
    """Call Anthropic Claude (1 req/min - most restrictive)"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "Authorization": f"Bearer {ANTHROPIC_API_KEY}",
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            },
            json={
                "model": "claude-3-haiku-20240307",
                "max_tokens": 1024,
                "messages": [{
                    "role": "user",
                    "content": f"Analyze this loan application conversation and classify risk:\n{transcript}\n\nRespond with JSON: {{\"classification\": \"low|medium|high\", \"risks\": [...], \"confidence\": 0.0-1.0}}"
                }]
            }
        )
    return response.json()

@app.post("/analyze", response_model=LLMAnalysisResponse)
async def analyze_conversation(request: LLMAnalysisRequest):
    """
    Analyze conversation using configured LLM provider
    Supports: Groq, Ollama, OpenAI, Gemini, Anthropic
    """
    try:
        logger.info(f"Analyzing conversation for session {request.session_id} using {LLM_PROVIDER}")
        
        # Route to appropriate LLM provider
        if LLM_PROVIDER == "groq":
            if not GROQ_API_KEY:
                raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
            result = await analyze_with_groq(request.transcript)
        elif LLM_PROVIDER == "ollama":
            result = await analyze_with_ollama(request.transcript)
        elif LLM_PROVIDER == "openai":
            if not OPENAI_API_KEY:
                raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
            result = await analyze_with_openai(request.transcript)
        elif LLM_PROVIDER == "gemini":
            if not GEMINI_API_KEY:
                raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
            result = await analyze_with_gemini(request.transcript)
        elif LLM_PROVIDER == "anthropic":
            if not ANTHROPIC_API_KEY:
                raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")
            result = await analyze_with_anthropic(request.transcript)
        else:
            raise HTTPException(status_code=500, detail=f"Unknown LLM provider: {LLM_PROVIDER}")
        
        # Parse and return response
        classification = result.get("classification", "medium")
        risks = result.get("risks", [])
        confidence = result.get("confidence", 0.5)
        
        response = LLMAnalysisResponse(
            customer_classification=classification,
            risk_indicators=risks,
            confidence=confidence,
            structured_insights={
                "llm_provider": LLM_PROVIDER,
                "model_used": result.get("model", "default"),
                "analysis_complete": True
            }
        )
        
        return response
    except Exception as e:
        logger.error(f"LLM analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"LLM analysis failed: {str(e)}")

@app.get("/health")
async def health():
    return {
        "status": "LLM Service is running",
        "provider": LLM_PROVIDER,
        "configured": bool(
            (LLM_PROVIDER == "groq" and GROQ_API_KEY) or
            (LLM_PROVIDER == "ollama") or
            (LLM_PROVIDER == "openai" and OPENAI_API_KEY) or
            (LLM_PROVIDER == "gemini" and GEMINI_API_KEY) or
            (LLM_PROVIDER == "anthropic" and ANTHROPIC_API_KEY)
        )
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("LLM_SERVICE_PORT", 3007)))
