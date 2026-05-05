import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.STT_SERVICE_PORT || 3003;
app.use(express.json({ limit: '50mb' }));

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// Simulated loan conversation snippets for demo mode
const SIMULATED_TRANSCRIPTS = [
  {
    text: "Hello, I am applying for a personal loan. I work as a software engineer at a technology company. My monthly salary is approximately fifty thousand rupees. I need the loan for home renovation purposes.",
    keywords: { employment: "software engineer", employer: "technology company", income: "50000", purpose: "home renovation", consent: false },
  },
  {
    text: "Good afternoon. I am self-employed and run a retail business. My monthly turnover is around two lakh rupees and net income is about seventy-five thousand. I want to take this loan for expanding my business operations. Yes, I consent to the verification process.",
    keywords: { employment: "self-employed", employer: "retail business", income: "75000", purpose: "business expansion", consent: true },
  },
  {
    text: "Hi, I am a government employee working as a teacher. My salary is forty-two thousand per month. I am looking for an education loan for my daughter's higher studies abroad. I agree to the terms and give my consent.",
    keywords: { employment: "government employee", employer: "government school", income: "42000", purpose: "education", consent: true },
  },
  {
    text: "I work in the private sector as a marketing manager. My monthly income is sixty-five thousand rupees. I need a personal loan for my wedding expenses. Yes, I provide my consent for this process.",
    keywords: { employment: "marketing manager", employer: "private company", income: "65000", purpose: "personal - wedding", consent: true },
  },
];

// Extract keywords from transcript
function extractKeywords(text: string): Record<string, any> {
  const lower = text.toLowerCase();
  const keywords: Record<string, any> = {};

  // Employment detection
  const empPatterns = [
    /(?:i am|i'm|work as|working as|employed as)\s+(?:a\s+)?(.+?)(?:\.|,|\s+at|\s+in)/i,
    /(?:self[- ]employed|freelancer|business owner)/i,
  ];
  for (const p of empPatterns) {
    const m = text.match(p);
    if (m) { keywords.employment = m[1] || m[0]; break; }
  }

  // Income detection
  const incomePatterns = [
    /(?:salary|income|earning|earn|make|get paid)\s+(?:is\s+)?(?:about\s+|approximately\s+|around\s+)?(?:rs\.?\s*|₹\s*|rupees?\s*)?(\d[\d,]*)/i,
    /(\d[\d,]*)\s*(?:rupees|rs|₹)\s*(?:per month|monthly|a month)/i,
    /(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\s*(thousand)/i,
  ];
  const wordToNum: Record<string, number> = {
    twenty: 20000, thirty: 30000, forty: 40000, fifty: 50000,
    sixty: 60000, seventy: 70000, eighty: 80000, ninety: 90000,
  };
  for (const p of incomePatterns) {
    const m = text.match(p);
    if (m) {
      if (wordToNum[m[1]?.toLowerCase()]) {
        keywords.monthlyIncome = wordToNum[m[1].toLowerCase()];
      } else {
        keywords.monthlyIncome = parseInt(m[1].replace(/,/g, ''));
      }
      break;
    }
  }

  // Purpose detection
  const purposePatterns = [
    /(?:loan for|need.*for|purpose.*is|want.*for)\s+(.+?)(?:\.|$)/i,
  ];
  for (const p of purposePatterns) {
    const m = text.match(p);
    if (m) { keywords.loanPurpose = m[1].trim(); break; }
  }

  // Consent detection
  keywords.consentGiven = /(?:i consent|i agree|i provide my consent|give my consent|yes.*consent|i accept)/i.test(lower);

  return keywords;
}

// Transcribe audio (with simulation fallback)
app.post('/transcribe', async (req, res) => {
  const { sessionId, audioData, language = 'en' } = req.body;

  console.log(`🎤 Transcription request for session ${sessionId}`);

  // If Deepgram key available, attempt real transcription
  if (DEEPGRAM_API_KEY && DEEPGRAM_API_KEY !== 'your_deepgram_key_here' && audioData) {
    try {
      const { default: axios } = await import('axios');
      const audioBuffer = Buffer.from(audioData, 'base64');
      const response = await axios.post(
        `https://api.deepgram.com/v1/listen?language=${language}&punctuate=true&model=nova-2`,
        audioBuffer,
        {
          headers: {
            'Authorization': `Token ${DEEPGRAM_API_KEY}`,
            'Content-Type': 'audio/webm',
          },
          timeout: 30000,
        }
      );
      const transcript = response.data?.results?.channels?.[0]?.alternatives?.[0];
      const text = transcript?.transcript || '';
      const confidence = transcript?.confidence || 0;

      res.json({
        sessionId,
        transcript: { text, confidence, language, duration: 0 },
        extractedData: extractKeywords(text),
        source: 'deepgram',
      });
      return;
    } catch (error: any) {
      console.log('⚠️  Deepgram failed, falling back to simulation:', error.message);
    }
  }

  // Simulation mode
  const simulated = SIMULATED_TRANSCRIPTS[Math.floor(Math.random() * SIMULATED_TRANSCRIPTS.length)];
  const transcript = {
    text: simulated.text,
    confidence: 0.92 + Math.random() * 0.06,
    language,
    duration: Math.floor(30 + Math.random() * 90),
  };

  res.json({
    sessionId,
    transcript,
    extractedData: simulated.keywords,
    source: 'simulation',
  });
});

// Real-time transcription status
app.get('/transcribe/:sessionId/status', (req, res) => {
  res.json({
    sessionId: req.params.sessionId,
    status: 'ready',
    supported_languages: ['en', 'hi', 'ta', 'te', 'bn', 'mr'],
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'STT Service is running',
    deepgram: DEEPGRAM_API_KEY && DEEPGRAM_API_KEY !== 'your_deepgram_key_here' ? 'configured' : 'simulation-mode',
    supported_languages: ['en', 'hi'],
  });
});

app.listen(PORT, () => {
  console.log(`🚀 STT Service running on port ${PORT}`);
  console.log(`🎤 Mode: ${DEEPGRAM_API_KEY && DEEPGRAM_API_KEY !== 'your_deepgram_key_here' ? 'Deepgram API' : 'Simulation'}`);
});

export default app;
