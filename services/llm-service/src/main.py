from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
import logging
import httpx
import json
import re

# Load .env from project root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))
load_dotenv()

app = FastAPI(title="LLM Service - Real Groq Integration")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# LLM Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq").lower()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
LOCAL_LLM_URL = os.getenv("LOCAL_LLM_URL", "http://localhost:11434")

# Validate configuration
if LLM_PROVIDER == "groq" and not GROQ_API_KEY:
    logger.error("FATAL: GROQ_API_KEY is required when LLM_PROVIDER=groq")

SYSTEM_PROMPT = """You are a senior loan underwriting AI analyst working for a digital lending platform. 
Analyze the customer loan application conversation transcript and extract structured intelligence for automated loan decisioning.

Your analysis must be thorough, accurate, and based ONLY on information present in the transcript.

Return ONLY a valid JSON object (no markdown, no explanation) with these EXACT fields:

{
  "classification": "low" | "medium" | "high",
  "confidence": <float 0.0-1.0>,
  "risks": ["list of specific risk indicators found in conversation"],
  "customer_persona": "brief description of customer profile based on conversation",
  "extracted_data": {
    "employment_type": "salaried" | "self_employed" | "government" | "unemployed" | "student" | "unknown",
    "employer_name": "company/employer name or null",
    "designation": "job title or null",
    "monthly_income": <number or null>,
    "annual_income": <number or null>,
    "loan_purpose": "specific purpose stated",
    "loan_amount_requested": <number or null>,
    "consent_given": <boolean>,
    "declared_age": <number or null>,
    "family_dependents": <number or null>,
    "existing_loans": <number or null>,
    "property_owned": <boolean or null>
  },
  "sentiment": "positive" | "neutral" | "negative" | "anxious" | "confident",
  "red_flags": ["any concerning statements, inconsistencies, or evasive behavior"],
  "recommendation": "clear recommendation for the lending decision",
  "income_stability": "stable" | "variable" | "uncertain" | "unknown",
  "repayment_capacity": "high" | "moderate" | "low" | "unknown"
}"""


class LLMAnalysisRequest(BaseModel):
    session_id: str
    transcript: str
    extracted_data: dict = {}


class LLMAnalysisResponse(BaseModel):
    customer_classification: str
    risk_indicators: List[str]
    confidence: float
    structured_insights: dict


def parse_llm_json(raw_text: str) -> dict:
    """Robustly extract JSON from LLM response"""
    text = raw_text.strip()
    
    # Remove markdown code blocks
    text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'```\s*$', '', text, flags=re.MULTILINE)
    text = text.strip()
    
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Find JSON object boundaries
    start = text.find('{')
    if start == -1:
        raise ValueError("No JSON object found in LLM response")
    
    # Find matching closing brace
    depth = 0
    end = start
    for i in range(start, len(text)):
        if text[i] == '{':
            depth += 1
        elif text[i] == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    
    try:
        return json.loads(text[start:end])
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON from LLM: {e}")


async def analyze_with_groq(transcript: str) -> dict:
    """Call Groq API with real API key"""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not configured")
    
    logger.info(f"Calling Groq API (llama-3.3-70b-versatile)...")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Analyze this loan application conversation:\n\n{transcript}"},
                ],
                "temperature": 0.1,  # Low temp for consistent structured output
                "max_tokens": 2048,
                "top_p": 1,
            },
        )
    
    if response.status_code != 200:
        error_detail = response.text
        logger.error(f"Groq API error {response.status_code}: {error_detail}")
        raise ValueError(f"Groq API returned {response.status_code}: {error_detail}")
    
    data = response.json()
    content = data["choices"][0]["message"]["content"]
    
    logger.info(f"Groq response received: {len(content)} chars")
    logger.debug(f"Raw Groq response: {content[:500]}")
    
    parsed = parse_llm_json(content)
    parsed["_model"] = data.get("model", "mixtral-8x7b-32768")
    parsed["_provider"] = "groq"
    parsed["_usage"] = data.get("usage", {})
    
    return parsed


async def analyze_with_openai(transcript: str) -> dict:
    """Call OpenAI API"""
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not configured")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Analyze this loan application conversation:\n\n{transcript}"},
                ],
                "temperature": 0.1,
                "max_tokens": 2048,
            },
        )

    if response.status_code != 200:
        raise ValueError(f"OpenAI API error: {response.status_code}")

    data = response.json()
    content = data["choices"][0]["message"]["content"]
    parsed = parse_llm_json(content)
    parsed["_provider"] = "openai"
    parsed["_model"] = data.get("model", "gpt-3.5-turbo")
    return parsed


async def analyze_with_gemini(transcript: str) -> dict:
    """Call Google Gemini API"""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
            params={"key": GEMINI_API_KEY},
            json={"contents": [{"parts": [{"text": f"{SYSTEM_PROMPT}\n\nTranscript:\n{transcript}"}]}]},
        )

    if response.status_code != 200:
        raise ValueError(f"Gemini API error: {response.status_code}")

    data = response.json()
    content = data["candidates"][0]["content"]["parts"][0]["text"]
    parsed = parse_llm_json(content)
    parsed["_provider"] = "gemini"
    return parsed


async def analyze_with_anthropic(transcript: str) -> dict:
    """Call Anthropic Claude API"""
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY not configured")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={"x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json"},
            json={
                "model": "claude-3-haiku-20240307",
                "system": SYSTEM_PROMPT,
                "max_tokens": 2048,
                "messages": [{"role": "user", "content": f"Analyze this loan application conversation:\n\n{transcript}"}],
            },
        )

    if response.status_code != 200:
        raise ValueError(f"Anthropic API error: {response.status_code}")

    data = response.json()
    content = data["content"][0]["text"]
    parsed = parse_llm_json(content)
    parsed["_provider"] = "anthropic"
    return parsed


async def analyze_with_ollama(transcript: str) -> dict:
    """Call local Ollama"""
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{LOCAL_LLM_URL}/api/generate",
            json={
                "model": "mistral",
                "prompt": f"{SYSTEM_PROMPT}\n\nTranscript:\n{transcript}",
                "stream": False,
            },
        )

    data = response.json()
    parsed = parse_llm_json(data.get("response", "{}"))
    parsed["_provider"] = "ollama"
    return parsed


# Provider mapping
LLM_PROVIDERS = {
    "groq": analyze_with_groq,
    "openai": analyze_with_openai,
    "gemini": analyze_with_gemini,
    "anthropic": analyze_with_anthropic,
    "ollama": analyze_with_ollama,
}


@app.post("/analyze", response_model=LLMAnalysisResponse)
async def analyze_conversation(request: LLMAnalysisRequest):
    """Analyze conversation using configured LLM provider (real API calls)"""
    try:
        logger.info(f"[Session {request.session_id}] Analyzing via {LLM_PROVIDER}...")
        
        if LLM_PROVIDER not in LLM_PROVIDERS:
            raise HTTPException(status_code=500, detail=f"Unknown LLM provider: {LLM_PROVIDER}. Supported: {list(LLM_PROVIDERS.keys())}")
        
        analyze_fn = LLM_PROVIDERS[LLM_PROVIDER]
        result = await analyze_fn(request.transcript)
        
        logger.info(f"[Session {request.session_id}] LLM classification: {result.get('classification')} (confidence: {result.get('confidence')})")
        
        return LLMAnalysisResponse(
            customer_classification=result.get("classification", "medium"),
            risk_indicators=result.get("risks", []) + result.get("red_flags", []),
            confidence=float(result.get("confidence", 0.5)),
            structured_insights={
                "llm_provider": result.get("_provider", LLM_PROVIDER),
                "model": result.get("_model", "unknown"),
                "usage": result.get("_usage", {}),
                "customer_persona": result.get("customer_persona", ""),
                "extracted_data": result.get("extracted_data", {}),
                "sentiment": result.get("sentiment", "neutral"),
                "recommendation": result.get("recommendation", ""),
                "income_stability": result.get("income_stability", "unknown"),
                "repayment_capacity": result.get("repayment_capacity", "unknown"),
            },
        )
    except ValueError as e:
        logger.error(f"LLM parsing error: {e}")
        raise HTTPException(status_code=502, detail=f"LLM response parsing failed: {str(e)}")
    except httpx.TimeoutException:
        logger.error("LLM API timeout")
        raise HTTPException(status_code=504, detail="LLM API call timed out")
    except Exception as e:
        logger.error(f"LLM analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"LLM analysis failed: {str(e)}")


@app.get("/health")
async def health():
    provider_key = {
        "groq": bool(GROQ_API_KEY),
        "openai": bool(OPENAI_API_KEY),
        "gemini": bool(GEMINI_API_KEY),
        "anthropic": bool(ANTHROPIC_API_KEY),
        "ollama": True,
    }
    return {
        "status": "LLM Service running",
        "active_provider": LLM_PROVIDER,
        "api_key_configured": provider_key.get(LLM_PROVIDER, False),
        "available_providers": [k for k, v in provider_key.items() if v],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("LLM_SERVICE_PORT", 3007)))
