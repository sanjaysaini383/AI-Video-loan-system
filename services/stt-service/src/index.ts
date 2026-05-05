import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.STT_SERVICE_PORT || 3003;
app.use(express.json({ limit: '50mb' }));

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

if (!DEEPGRAM_API_KEY) {
  console.error('⚠️  DEEPGRAM_API_KEY not set — STT will not function');
}

// ===========================
// KEYWORD EXTRACTION ENGINE
// ===========================
function extractKeywords(text: string): Record<string, any> {
  const lower = text.toLowerCase();
  const keywords: Record<string, any> = {};

  // Employment detection
  const empPatterns = [
    { regex: /(?:self[- ]employed|own business|my business|run a business)/i, val: 'self-employed' },
    { regex: /(?:government|govt|public sector)/i, val: 'government' },
    { regex: /(?:work(?:ing)?\s+(?:as|at|in|for)|employed\s+(?:as|at|in)|i am a|i'm a)\s+(.+?)(?:\.|,|\s+at|\s+in|\s+and|\s+my|$)/i, val: null },
    { regex: /(?:salaried|salary|employed)/i, val: 'employed' },
    { regex: /(?:unemployed|not working|without a job)/i, val: 'unemployed' },
    { regex: /(?:student|studying)/i, val: 'student' },
  ];
  for (const p of empPatterns) {
    const m = text.match(p.regex);
    if (m) {
      keywords.employmentType = p.val || m[1]?.trim() || 'employed';
      if (m[1]) keywords.designation = m[1].trim();
      break;
    }
  }

  // Employer detection
  const employerMatch = text.match(/(?:at|in|for|with)\s+(?:a\s+)?(?:company called|company named)?\s*([A-Z][a-zA-Z\s]+?)(?:\.|,|$)/);
  if (employerMatch) keywords.employer = employerMatch[1].trim();

  // Income detection (numeric)
  const incomePatterns = [
    /(?:salary|income|earning|earn|make|get paid|paid)\s+(?:is\s+)?(?:about|approximately|around|roughly)?\s*(?:rs\.?\s*|₹\s*|rupees?\s*|inr\s*)?(\d[\d,]*)/i,
    /(\d[\d,]*)\s*(?:rupees|rs|₹|inr)\s*(?:per month|monthly|a month|p\.?m\.?)/i,
    /(?:monthly|per month).*?(\d[\d,]+)/i,
  ];
  // Word-number income
  const wordNumPatterns = [
    {
      regex: /(ten|fifteen|twenty|twenty-five|thirty|thirty-five|forty|forty-five|fifty|fifty-five|sixty|sixty-five|seventy|seventy-five|eighty|eighty-five|ninety|ninety-five)\s+thousand/i,
      map: { ten: 10000, fifteen: 15000, twenty: 20000, 'twenty-five': 25000, thirty: 30000, 'thirty-five': 35000, forty: 40000, 'forty-five': 45000, fifty: 50000, 'fifty-five': 55000, sixty: 60000, 'sixty-five': 65000, seventy: 70000, 'seventy-five': 75000, eighty: 80000, 'eighty-five': 85000, ninety: 90000, 'ninety-five': 95000 }
    },
    { regex: /(\d+(?:\.\d+)?)\s*(?:lakh|lac|lakhs)/i, multiplier: 100000 },
  ];

  for (const p of incomePatterns) {
    const m = text.match(p);
    if (m) {
      keywords.monthlyIncome = parseInt(m[1].replace(/,/g, ''));
      break;
    }
  }
  if (!keywords.monthlyIncome) {
    for (const wp of wordNumPatterns) {
      const m = text.match(wp.regex);
      if (m) {
        if ('map' in wp) {
          keywords.monthlyIncome = (wp.map as any)[m[1].toLowerCase()] || 0;
        } else if ('multiplier' in wp) {
          keywords.monthlyIncome = parseFloat(m[1]) * wp.multiplier;
        }
        break;
      }
    }
  }

  // Loan purpose
  const purposeMap: Record<string, string> = {
    'home renovation': 'home_renovation', 'home improvement': 'home_renovation',
    'education': 'education', 'study': 'education', 'higher studies': 'education', 'abroad': 'education',
    'business': 'business', 'business expansion': 'business',
    'personal': 'personal', 'wedding': 'wedding', 'marriage': 'wedding',
    'medical': 'medical', 'health': 'medical', 'hospital': 'medical',
    'vehicle': 'vehicle', 'car': 'vehicle', 'bike': 'vehicle',
    'debt consolidation': 'debt_consolidation', 'pay off': 'debt_consolidation',
  };
  for (const [key, val] of Object.entries(purposeMap)) {
    if (lower.includes(key)) { keywords.loanPurpose = val; break; }
  }

  // Consent detection
  const consentPhrases = [
    'i consent', 'i agree', 'i give my consent', 'yes i agree', 'i accept',
    'i provide my consent', 'i am willing', 'i do consent', 'yes, i consent',
  ];
  keywords.consentGiven = consentPhrases.some(p => lower.includes(p));

  // Loan amount requested
  const amountMatch = text.match(/(?:need|want|require|looking for|apply for)\s+(?:a loan of\s+)?(?:rs\.?\s*|₹\s*|rupees?\s*)?(\d[\d,]*)/i);
  if (amountMatch) keywords.requestedAmount = parseInt(amountMatch[1].replace(/,/g, ''));

  // Age mention
  const ageMatch = text.match(/(?:i am|i'm|age is|aged)\s+(\d{2})\s*(?:years|year|yrs)?/i);
  if (ageMatch) keywords.declaredAge = parseInt(ageMatch[1]);

  // Dependents
  const depMatch = text.match(/(\d+)\s*(?:dependents|dependant|children|kids|family members)/i);
  if (depMatch) keywords.dependents = parseInt(depMatch[1]);

  return keywords;
}

// ===========================
// TRANSCRIBE WITH DEEPGRAM (REAL API)
// ===========================
async function transcribeWithDeepgram(audioBuffer: Buffer, language: string): Promise<{ text: string; confidence: number; words: any[] }> {
  const response = await axios.post(
    'https://api.deepgram.com/v1/listen',
    audioBuffer,
    {
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm',
      },
      params: {
        language: language,
        model: 'nova-2',
        punctuate: true,
        smart_format: true,
        diarize: true,
        utterances: true,
      },
      timeout: 60000,
      maxContentLength: 100 * 1024 * 1024,
    }
  );

  const result = response.data?.results?.channels?.[0]?.alternatives?.[0];
  return {
    text: result?.transcript || '',
    confidence: result?.confidence || 0,
    words: result?.words || [],
  };
}

// ===========================
// ENDPOINTS
// ===========================

// Transcribe audio (base64 encoded)
app.post('/transcribe', async (req, res) => {
  const { sessionId, audioData, language = 'en', text: preTranscribedText } = req.body;

  console.log(`🎤 STT request for session ${sessionId}`);

  // If text is directly provided (from browser Web Speech API), just extract keywords
  if (preTranscribedText) {
    console.log(`📝 Processing pre-transcribed text (${preTranscribedText.length} chars)`);
    const extractedData = extractKeywords(preTranscribedText);
    return res.json({
      sessionId,
      transcript: {
        text: preTranscribedText,
        confidence: 0.85,
        language,
        source: 'web-speech-api',
      },
      extractedData,
      source: 'browser',
    });
  }

  // Transcribe with Deepgram
  if (!audioData) {
    return res.status(400).json({ error: 'Either audioData (base64) or text is required' });
  }

  if (!DEEPGRAM_API_KEY) {
    return res.status(503).json({ error: 'DEEPGRAM_API_KEY not configured. Cannot transcribe audio.' });
  }

  try {
    const audioBuffer = Buffer.from(audioData, 'base64');
    console.log(`🔊 Sending ${(audioBuffer.length / 1024).toFixed(1)}KB audio to Deepgram...`);

    const result = await transcribeWithDeepgram(audioBuffer, language);

    console.log(`✅ Deepgram result: "${result.text.substring(0, 100)}..." (confidence: ${(result.confidence * 100).toFixed(1)}%)`);

    const extractedData = extractKeywords(result.text);

    res.json({
      sessionId,
      transcript: {
        text: result.text,
        confidence: result.confidence,
        language,
        wordCount: result.words.length,
        source: 'deepgram-nova-2',
      },
      extractedData,
      words: result.words,
      source: 'deepgram',
    });
  } catch (error: any) {
    console.error('❌ Deepgram API error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Deepgram transcription failed',
      details: error.response?.data || error.message,
    });
  }
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'STT Service running',
    deepgram: DEEPGRAM_API_KEY ? 'configured' : 'NOT CONFIGURED',
    model: 'nova-2',
    features: ['transcription', 'keyword_extraction', 'consent_detection', 'income_detection'],
  });
});

app.listen(PORT, () => {
  console.log(`🚀 STT Service running on port ${PORT}`);
  console.log(`🎤 Deepgram: ${DEEPGRAM_API_KEY ? '✅ configured (Nova-2)' : '❌ NOT CONFIGURED'}`);
});

export default app;
