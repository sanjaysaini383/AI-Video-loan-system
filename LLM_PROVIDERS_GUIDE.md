# 🤖 LLM Providers Guide - Rate Limits & Setup

> **TL;DR:** Use **Groq** for best rate limits (30 req/min) or **Ollama** for unlimited local development

---

## 📊 Comparison Table

| Provider | Rate Limit | Free Tier | Setup Time | Latency | Best For |
|----------|-----------|-----------|-----------|---------|----------|
| **Groq** ⭐ | 30 req/min | $0 | 2 min | <1s | Development & testing |
| **Ollama** 🏠 | Unlimited | $0 | 10 min | 2-5s | Local dev (no limits) |
| **Google Gemini** | 60 req/min | $0 | 3 min | 1-2s | Good balance |
| **OpenAI** | 3 req/min | $0.50/M tokens | 2 min | 0.5s | Production |
| **Anthropic** | 1 req/min | Free $5 | 2 min | 1-2s | Reasoning tasks |

---

## 🚀 Setup Instructions

### Option 1: Groq (RECOMMENDED - Highest Rate Limits)

**Rate Limit:** 30 requests/minute = ~1000+ per hour ✅

```bash
# 1. Go to https://console.groq.com/keys
# 2. Create account (takes 1 min)
# 3. Create API key
# 4. Copy to .env:

LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_actual_key_here

# 5. Restart service
docker-compose restart llm-service
```

**Supported Models:** `mixtral-8x7b-32768`, `llama2-70b-4096`

---

### Option 2: Ollama (NO RATE LIMITS - Local Development)

**Rate Limit:** Unlimited (runs locally on your machine)

```bash
# 1. Download from https://ollama.ai
# 2. Install and run: ollama run mistral
#    (First time: ~4GB download, ~2 min)
# 3. Add to .env:

LLM_PROVIDER=ollama
LOCAL_LLM_URL=http://localhost:11434

# 4. Service auto-connects (no restart needed)
```

**Available Models:**
- `mistral` (7B) - Faster, good quality
- `llama2` (7B/13B) - Slower, better reasoning
- `neural-chat` - Optimized for chat

**Check if running:**
```bash
curl http://localhost:11434/api/tags
```

---

### Option 3: Google Gemini (Good Free Tier)

**Rate Limit:** 60 requests/minute

```bash
# 1. Go to https://aistudio.google.com/app/apikey
# 2. Click "Create API key"
# 3. Add to .env:

LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here

# 4. Restart service
docker-compose restart llm-service
```

---

### Option 4: OpenAI (Popular Choice)

**Rate Limit:** 3 requests/minute (free tier), higher with payment

```bash
# 1. Go to https://platform.openai.com/api-keys
# 2. Create new secret key
# 3. Add to .env:

LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your_actual_key_here

# 4. Restart service
docker-compose restart llm-service
```

**Models:** `gpt-3.5-turbo` (fast, cheap), `gpt-4` (powerful, expensive)

---

### Option 5: Anthropic Claude (Most Restrictive)

**Rate Limit:** 1 request/minute

```bash
# 1. Go to https://console.anthropic.com
# 2. Create API key
# 3. Add to .env:

LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your_actual_key_here

# 4. Restart service
docker-compose restart llm-service
```

⚠️ **Not recommended for development** - too restrictive

---

## 🔄 Switching Providers

### Quick Switch Example: Claude → Groq

```bash
# In .env, change:
# FROM:
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxx

# TO:
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_xxx
```

Then restart:
```bash
docker-compose restart llm-service
```

### Verify Active Provider

```bash
curl http://localhost:3007/health
```

Response will show:
```json
{
  "status": "LLM Service is running",
  "provider": "groq",
  "configured": true
}
```

---

## 📈 Rate Limit Guidance

**For Development:** Use **Groq** (30 req/min) or **Ollama** (unlimited)

**For Production:** Use **OpenAI** or **Gemini** with proper API limits

**For Testing:** Use **Ollama** locally (no internet needed, no limits)

---

## 🔐 Environment Variables

**Minimum `.env` with Groq:**
```env
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
DATABASE_URL=postgresql://...
DEEPGRAM_API_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
JWT_SECRET=...
```

**All optional LLM keys (for quick switching):**
```env
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk_...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
LOCAL_LLM_URL=http://localhost:11434
```

---

## ⚠️ Troubleshooting

### "GROQ_API_KEY not configured"
```bash
# Check .env file:
cat .env | grep LLM_PROVIDER
cat .env | grep GROQ_API_KEY

# Restart service:
docker-compose restart llm-service
```

### "Ollama connection refused"
```bash
# Make sure Ollama is running:
ollama run mistral

# In another terminal, test:
curl http://localhost:11434/api/tags
```

### Service won't start
```bash
# Check logs:
docker-compose logs llm-service

# Rebuild:
docker-compose up -d --build llm-service
```

---

## 💡 Pro Tips

1. **Use Ollama for local testing** - Zero internet dependency
2. **Use Groq for CI/CD pipelines** - 30 req/min is plenty
3. **Monitor rate limits** - Check LLM provider dashboard regularly
4. **Cache responses** - Use Redis to cache analysis results
5. **Batch requests** - Group multiple transcripts into one call

---

## 📚 Further Reading

- [Groq API Docs](https://console.groq.com/docs)
- [Ollama Models](https://ollama.ai/library)
- [Google Gemini API](https://ai.google.dev)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic Claude Docs](https://docs.anthropic.com)
