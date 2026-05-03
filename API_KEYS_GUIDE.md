# 🔑 API Keys & Credentials Quick Reference

## Where to Get API Keys

### 1. AWS S3 (Video Storage) ⭐ REQUIRED
**Link:** https://console.aws.amazon.com/

**Steps:**
1. Sign in with AWS account (create if needed)
2. Search IAM → Users → Create User
3. Attach policy: `AmazonS3FullAccess`
4. Create access key → Download CSV
5. Create S3 bucket named `video-loan-recordings`

**Credentials:**
```
AWS_ACCESS_KEY_ID=AKIA2XXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET=video-loan-recordings
AWS_REGION=us-east-1
```

**Cost:** Free tier included (12 months)

---

### 2. OpenAI API (Speech-to-Text) ⭐ REQUIRED
**Link:** https://platform.openai.com/api/keys

**Steps:**
1. Sign in or create account
2. Click profile → API keys
3. Create new secret key
4. Copy immediately (can't view again!)

**Credentials:**
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

**Cost:** Pay-as-you-go (~$0.0001 per 1K tokens for STT)

**Free Credits:** $5 free credits for first 3 months

---

### 3. Anthropic Claude API (AI Analysis) ⭐ REQUIRED
**Link:** https://console.anthropic.com/

**Steps:**
1. Sign in or create account
2. Click API Keys
3. Create new key
4. Copy the key

**Credentials:**
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
```

**Cost:** Pay-as-you-go (~$3 per 1M input tokens)

---

### 4. Deepgram API (Alternative STT) ⭐ OPTIONAL
**Link:** https://console.deepgram.com/

**Steps:**
1. Sign in or create account
2. Click API Keys
3. Create new API Key
4. Copy the key

**Credentials:**
```
DEEPGRAM_API_KEY=xxxxxxxxxxxxxxxxxxxxx
```

**Cost:** Pay-as-you-go (~$0.0043 per minute)

**Free Tier:** $200/month free credits

---

### 5. Twilio (SMS/OTP) ⭐ OPTIONAL
**Link:** https://www.twilio.com/console

**Steps:**
1. Sign in or create account
2. Copy Account SID
3. Copy Auth Token
4. Get a Twilio Phone Number
5. Verify your personal phone

**Credentials:**
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

**Cost:** Free trial ($15 credit), then pay-as-you-go

---

### 6. Security Keys (Generate Locally) ⭐ REQUIRED

#### JWT Secret
Generate a random secure string:

**Windows PowerShell:**
```powershell
$bytes = New-Object Byte[] 32
$rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
$rng.GetBytes($bytes)
[System.Convert]::ToHexString($bytes)
```

**Linux/Mac:**
```bash
openssl rand -hex 32
```

**Online Alternative:**
https://www.random.org/strings/

**Credential:**
```
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

## .env File Template

Copy this into your `.env` file:

```env
# ============ DATABASE CONFIGURATION ============
DATABASE_URL=postgresql://postgres:password@postgres:5432/video_loan_db
MONGODB_URI=mongodb://admin:password@mongo:27017/video_loan_system
REDIS_URL=redis://redis:6379

# ============ AWS CONFIGURATION ============
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_HERE
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY_HERE
AWS_S3_BUCKET=video-loan-recordings

# ============ JWT & AUTHENTICATION ============
JWT_SECRET=YOUR_RANDOM_32_CHAR_HEX_STRING_HERE
JWT_EXPIRY=24h
OTP_EXPIRY=5m

# ============ AI/ML SERVICES ============
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY_HERE
DEEPGRAM_API_KEY=YOUR_DEEPGRAM_API_KEY_HERE

# ============ SMS/NOTIFICATIONS (OPTIONAL) ============
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID_HERE
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN_HERE
TWILIO_PHONE_NUMBER=+1234567890
MSG91_AUTH_KEY=YOUR_MSG91_KEY_HERE

# ============ SERVICE PORTS ============
API_GATEWAY_PORT=3000
SESSION_SERVICE_PORT=3001
MEDIA_SERVICE_PORT=3002
STT_SERVICE_PORT=3003
KYC_SERVICE_PORT=3004
RISK_SERVICE_PORT=3005
VISION_SERVICE_PORT=3006
LLM_SERVICE_PORT=3007
OFFER_SERVICE_PORT=3008
AUDIT_SERVICE_PORT=3009

# ============ ENVIRONMENT ============
NODE_ENV=development
LOG_LEVEL=info

# ============ WEBRTC CONFIGURATION ============
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
TURN_SERVER_URL=turn:your.turn.server.com:3478
TURN_USERNAME=your_turn_username
TURN_PASSWORD=your_turn_password

# ============ POLICY CONFIGURATION ============
MIN_LOAN_AMOUNT=10000
MAX_LOAN_AMOUNT=500000
MIN_AGE=18
MAX_AGE=65
```

---

## API Key Setup Checklist

Print this and check off as you complete each step:

```
REQUIRED KEYS (Must have):
[ ] AWS Access Key ID
[ ] AWS Secret Access Key
[ ] AWS S3 Bucket created
[ ] OpenAI API Key
[ ] Anthropic Claude API Key
[ ] JWT Secret generated
[ ] .env file created

OPTIONAL KEYS (Nice to have):
[ ] Deepgram API Key
[ ] Twilio Account SID
[ ] Twilio Auth Token
[ ] Twilio Phone Number
[ ] MSG91 Auth Key

CONFIGURATION:
[ ] All .env values filled in
[ ] .env file is in .gitignore
[ ] No secrets committed to Git
[ ] Docker is running
[ ] npm install completed
[ ] Services built: docker-compose build
```

---

## Free Tier & Cost Estimates

| Service | Free Tier | Paid Cost | Status |
|---------|-----------|-----------|--------|
| **AWS S3** | 5GB/month (12 months) | $0.023/GB | ✅ Free first year |
| **OpenAI** | $5 (3 months) | $0.0001/1K tokens | ✅ Free trial |
| **Anthropic** | None | $3/1M tokens | ⚠️ Paid only |
| **Deepgram** | $200/month | $0.0043/min | ✅ Generous free tier |
| **Twilio** | $15 trial | $0.0075/SMS | ⚠️ Paid after trial |
| **Docker** | ∞ Free | - | ✅ Always free |

**Total Free Setup Cost:** ~$0 (can use free tiers)

---

## Security Best Practices

⚠️ **IMPORTANT:**
- ✅ Never commit `.env` to Git
- ✅ Keep API keys private (don't share)
- ✅ Regenerate keys if accidentally exposed
- ✅ Use environment variables in production
- ✅ Set up separate keys for dev/prod
- ✅ Regularly rotate access keys
- ✅ Monitor API usage for unusual activity

---

## Troubleshooting API Keys

### "401 Unauthorized" or "Invalid API Key"
- Double-check the key is copied correctly
- Ensure no extra spaces before/after
- Verify the key hasn't expired
- Regenerate a new key if needed

### "Quota Exceeded"
- Check your free tier usage
- Upgrade to paid plan if needed
- Monitor dashboard for limits

### "Service Unavailable"
- Check API provider's status page
- Ensure internet connection working
- Try again in a few minutes

---

## Getting Help

**For API-specific issues:**
- AWS: https://support.aws.amazon.com/
- OpenAI: https://help.openai.com/
- Anthropic: https://support.anthropic.com/
- Deepgram: https://discord.gg/xFCwNqS (Discord support)
- Twilio: https://www.twilio.com/help

**For this project:**
- Check [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)
- Check [README.md](./README.md)
- Check [DEVELOPMENT.md](./DEVELOPMENT.md)

---

✅ **Ready to set up?** Follow [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)
