import express from 'express';
import Queue from 'bull';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = process.env.KYC_SERVICE_PORT || 3004;
const prisma = new PrismaClient();

// Job queue for KYC verification
const kycQueue = new Queue('kyc-jobs', process.env.REDIS_URL);

// Submit KYC verification job
app.post('/verify', express.json(), async (req, res) => {
  const { sessionId, userId, documentType, documentUrl } = req.body;

  try {
    const job = await kycQueue.add(
      { sessionId, userId, documentType, documentUrl },
      { attempts: 3, backoff: 'exponential' }
    );

    res.json({ jobId: job.id, message: 'KYC verification job queued' });
  } catch (error) {
    console.error('Error queuing KYC job:', error);
    res.status(500).json({ error: 'Failed to queue verification' });
  }
});

// Get geo-location and validate
app.post('/validate-location', express.json(), async (req, res) => {
  const { latitude, longitude, sessionId } = req.body;

  try {
    // TODO: Implement geofence validation and fraud detection
    res.json({
      valid: true,
      riskLevel: 'low',
      message: 'Location validated',
    });
  } catch (error) {
    res.status(500).json({ error: 'Location validation failed' });
  }
});

// Process KYC jobs
kycQueue.process(async (job) => {
  const { sessionId, userId, documentType } = job.data;

  console.log(`Processing KYC verification for ${userId}`);

  // TODO: Integrate with document verification APIs
  const result = {
    sessionId,
    userId,
    documentType,
    status: 'verified',
    confidence: 0.98,
  };

  // Save to database
  await prisma.kYCVerification.create({
    data: {
      sessionId,
      verificationType: documentType,
      status: 'completed',
      verificationResult: JSON.stringify(result),
    },
  });

  return result;
});

app.get('/health', (req, res) => {
  res.json({ status: 'KYC Service is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 KYC Service running on port ${PORT}`);
});

export default app;
