import express from 'express';
import Queue from 'bull';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = process.env.OFFER_SERVICE_PORT || 3008;
const prisma = new PrismaClient();

// Job queue for offer generation
const offerQueue = new Queue('offer-jobs', process.env.REDIS_URL);

// Request loan offer
app.post('/generate', express.json(), async (req, res) => {
  const { sessionId, userId, riskBand } = req.body;

  try {
    const job = await offerQueue.add(
      { sessionId, userId, riskBand },
      { priority: 1 }
    );

    res.json({ jobId: job.id, message: 'Offer generation queued' });
  } catch (error) {
    console.error('Error queuing offer job:', error);
    res.status(500).json({ error: 'Failed to generate offer' });
  }
});

// Get offer details
app.get('/offer/:offerId', async (req, res) => {
  try {
    const offer = await prisma.loanOffer.findUnique({
      where: { id: req.params.offerId },
    });

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    res.json(offer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch offer' });
  }
});

// Process offer generation
offerQueue.process(async (job) => {
  const { sessionId, userId, riskBand } = job.data;

  console.log(`Generating offer for user ${userId}`);

  // TODO: Implement offer generation logic based on policy rules
  const offer = {
    loanAmount: 250000,
    tenureMonths: 60,
    interestRate: 12.5,
    emi: 5500,
    eligibilityStatus: 'approved',
  };

  // Save to database
  const savedOffer = await prisma.loanOffer.create({
    data: {
      sessionId,
      userId,
      loanAmount: offer.loanAmount,
      tenureMonths: offer.tenureMonths,
      interestRate: offer.interestRate,
      emi: offer.emi,
      eligibilityStatus: offer.eligibilityStatus,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  return savedOffer;
});

app.get('/health', (req, res) => {
  res.json({ status: 'Offer Service is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Offer Service running on port ${PORT}`);
});

export default app;
