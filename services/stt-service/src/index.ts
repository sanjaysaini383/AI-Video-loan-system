import express from 'express';
import Queue from 'bull';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.STT_SERVICE_PORT || 3003;

// Job queue for STT processing
const sttQueue = new Queue('stt-jobs', process.env.REDIS_URL);

// Submit STT job
app.post('/transcribe', express.json(), async (req, res) => {
  const { audioUrl, sessionId, language = 'en' } = req.body;

  try {
    const job = await sttQueue.add(
      { audioUrl, sessionId, language },
      { attempts: 3, backoff: 'exponential' }
    );

    res.json({ jobId: job.id, message: 'Transcription job queued' });
  } catch (error) {
    console.error('Error queuing STT job:', error);
    res.status(500).json({ error: 'Failed to queue transcription' });
  }
});

// Get transcription result
app.get('/transcribe/:jobId', async (req, res) => {
  const job = await sttQueue.getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const state = await job.getState();
  const progress = job.progress();

  res.json({ state, progress, data: job.data });
});

// Process STT jobs
sttQueue.process(async (job) => {
  const { audioUrl, sessionId, language } = job.data;

  // TODO: Integrate with Deepgram or OpenAI Whisper API
  console.log(`Processing transcription for session ${sessionId}`);

  // Simulated transcription
  const transcript = {
    text: 'Sample transcribed text',
    confidence: 0.95,
    language,
    duration: 120,
  };

  return { sessionId, transcript };
});

app.get('/health', (req, res) => {
  res.json({ status: 'STT Service is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 STT Service running on port ${PORT}`);
});

export default app;
