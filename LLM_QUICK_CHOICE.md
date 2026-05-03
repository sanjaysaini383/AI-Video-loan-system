# 🤖 LLM Provider - Quick Decision Guide

> **Can't decide which API to use?** Start here. Takes 2 minutes.

---

## ❓ What's Your Situation?

### 👨‍💻 "I'm just testing locally"
**👉 Use: Ollama (Local)**
```bash
# Download from https://ollama.ai
ollama run mistral
# Then in .env:
LLM_PROVIDER=ollama
LOCAL_LLM_URL=http://localhost:11434
```
**Why?** No rate limits, no internet needed, completely free

---

### 🚀 "I need to test the full system soon"
**👉 Use: Groq**
```bash
# 1. Get key from https://console.groq.com/keys (2 min)
# 2. Add to .env:
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
```
**Why?** 30 requests/minute = ~1000+ per hour. Perfect for development.

---

### 🎬 "I'm running production with high volume"
**👉 Use: OpenAI or Gemini**
```bash
# OpenAI: https://platform.openai.com/api-keys
# OR Gemini: https://aistudio.google.com/app/apikey

LLM_PROVIDER=openai
OPENAI_API_KEY=sk_your_key_here
```
**Why?** Reliable, scalable, enterprise support available

---

### 😕 "I'm frustrated with Anthropic rate limits"
**👉 Use: Groq (30x faster limits) or Ollama (unlimited)**

Anthropic gives you **1 request/minute**. That's too slow for testing.

| Provider | Requests/Min |
|----------|-------------|
| Anthropic | 1 ❌ |
| Ollama | Unlimited ✅ |
| Groq | 30 ✅✅ |
| Gemini | 60 ✅✅ |

---

## 📋 Recommendation By Use Case

| Situation | Provider | Time to Setup |
|-----------|----------|--------------|
| Local development | **Ollama** | 10 min |
| Quick testing | **Groq** | 2 min |
| Production | **OpenAI/Gemini** | 3 min |
| Benchmarking all models | **Groq + Ollama** | 12 min |
| Budget conscious | **Ollama** | 10 min |
| Most restrictive setup | **Don't use Anthropic** | N/A |

---

## 🔄 How to Switch (Takes 30 seconds)

**Currently using:** Anthropic  
**Want to try:** Groq

```bash
# Step 1: Edit .env
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here

# Step 2: Restart service
docker-compose restart llm-service

# Step 3: Verify
curl http://localhost:3007/health
```

Done! All future requests use Groq.

---

## 🎯 My Actual Recommendation

### For Development Right Now:
1. **First choice:** Use **Ollama** locally (no API keys needed)
2. **Second choice:** Use **Groq** (30 req/min, plenty for testing)

### Why NOT Anthropic for Development:
- **1 request/minute** = way too slow for testing
- Every mistake = waiting 1 minute for next try
- Not good for rapid iteration

### Why Groq Works:
- **30 requests/minute** = test every second if you want
- Free tier covers unlimited development
- Faster inference than Anthropic anyway

---

## 📚 Full Documentation

For detailed info on all providers, see: [LLM_PROVIDERS_GUIDE.md](./LLM_PROVIDERS_GUIDE.md)

---

## ⚡ 5-Minute Setup (Groq)

```bash
# 1. Get API key (visit: https://console.groq.com/keys)
# Takes: 1 minute

# 2. Update .env
cat > .env << 'EOF'
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_YOUR_ACTUAL_KEY_HERE
DATABASE_URL=postgresql://...
DEEPGRAM_API_KEY=...
# ... other vars
EOF
# Takes: 1 minute

# 3. Restart service
docker-compose restart llm-service
# Takes: 2 minutes

# 4. Test
curl http://localhost:3007/health | jq .
# Takes: 1 minute
```

**Total: 5 minutes** ✅

---

## 🚀 Next Steps

1. Choose your LLM provider from the table above
2. Get the API key (or install Ollama)
3. Update `.env` file
4. Run: `docker-compose restart llm-service`
5. Start testing!

Any questions? See [LLM_PROVIDERS_GUIDE.md](./LLM_PROVIDERS_GUIDE.md)
