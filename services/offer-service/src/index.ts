import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.OFFER_SERVICE_PORT || 3008;
app.use(express.json());

// In-memory offer storage
const offersStore: Record<string, any> = {};

// Policy configuration
const POLICY = {
  minLoan: parseFloat(process.env.MIN_LOAN_AMOUNT || '10000'),
  maxLoan: parseFloat(process.env.MAX_LOAN_AMOUNT || '500000'),
  minAge: parseInt(process.env.MIN_AGE || '18'),
  maxAge: parseInt(process.env.MAX_AGE || '65'),
  maxDti: 0.5, // max debt-to-income ratio
};

// Interest rates by risk band
const RATE_TABLE: Record<string, { base: number; tenureAdj: Record<number, number> }> = {
  low: { base: 9.25, tenureAdj: { 12: -0.5, 24: 0, 36: 0.25, 48: 0.5, 60: 0.75 } },
  medium: { base: 12.50, tenureAdj: { 12: -0.5, 24: 0, 36: 0.5, 48: 1.0, 60: 1.5 } },
  high: { base: 18.00, tenureAdj: { 12: 0, 24: 0.5, 36: 1.0, 48: 2.0, 60: 3.0 } },
};

// EMI calculation (reducing balance method)
function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  const r = annualRate / 12 / 100; // monthly rate
  if (r === 0) return Math.round(principal / tenureMonths);
  const emi = principal * r * Math.pow(1 + r, tenureMonths) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi);
}

// Generate loan offers
function generateOffers(params: {
  riskBand: string;
  monthlyIncome: number;
  employmentStatus: string;
  loanPurpose: string;
  sessionId: string;
  userId: string;
}): any[] {
  const { riskBand, monthlyIncome, employmentStatus, loanPurpose, sessionId, userId } = params;
  const rates = RATE_TABLE[riskBand] || RATE_TABLE.medium;

  // Calculate max eligible amount based on income and risk
  const incomeMultiplier: Record<string, number> = { low: 48, medium: 30, high: 15 };
  const maxByIncome = monthlyIncome * (incomeMultiplier[riskBand] || 30);
  const maxAmount = Math.min(maxByIncome, POLICY.maxLoan);

  // Tenure options based on risk band
  const tenureOptions = riskBand === 'high' ? [12, 24] : riskBand === 'medium' ? [12, 24, 36] : [12, 24, 36, 48, 60];

  // Generate multiple offer variants
  const offers = [];
  const amountTiers = [1.0, 0.7, 0.5]; // percentage of max

  for (const tier of amountTiers) {
    const loanAmount = Math.round(maxAmount * tier / 1000) * 1000; // Round to nearest 1000
    if (loanAmount < POLICY.minLoan) continue;

    for (const tenure of tenureOptions) {
      const adj = rates.tenureAdj[tenure] || 0;
      const interestRate = rates.base + adj;
      const emi = calculateEMI(loanAmount, interestRate, tenure);

      // Check affordability (EMI should be <= 50% of monthly income)
      if (emi > monthlyIncome * POLICY.maxDti) continue;

      const totalPayable = emi * tenure;
      const totalInterest = totalPayable - loanAmount;

      const offer = {
        id: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        sessionId,
        userId,
        loanAmount,
        tenureMonths: tenure,
        interestRate: parseFloat(interestRate.toFixed(2)),
        emi,
        totalPayable,
        totalInterest,
        eligibilityStatus: riskBand === 'high' ? 'conditional' : 'approved',
        conditions: riskBand === 'high'
          ? ['Income proof required', 'Guarantor needed', 'Reduced loan amount']
          : riskBand === 'medium'
            ? ['Income verification required']
            : [],
        loanPurpose,
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48h
        accepted: false,
      };

      offers.push(offer);
      offersStore[offer.id] = offer;
    }
  }

  // Sort by best EMI-to-amount ratio
  offers.sort((a, b) => a.interestRate - b.interestRate || b.loanAmount - a.loanAmount);

  // Return top offers (max 6)
  return offers.slice(0, 6);
}

// ===========================
// ENDPOINTS
// ===========================

// Generate offers
app.post('/generate', (req, res) => {
  const { sessionId, userId, riskBand = 'medium', monthlyIncome = 50000, employmentStatus = 'employed', loanPurpose = 'personal' } = req.body;

  console.log(`💰 Generating offers for session ${sessionId}, risk: ${riskBand}, income: ₹${monthlyIncome}`);

  const offers = generateOffers({
    riskBand,
    monthlyIncome: parseFloat(monthlyIncome) || 50000,
    employmentStatus,
    loanPurpose,
    sessionId,
    userId: userId || 'unknown',
  });

  res.json({
    sessionId,
    offerCount: offers.length,
    offers,
    policy: {
      minLoan: POLICY.minLoan,
      maxLoan: POLICY.maxLoan,
      riskBand,
    },
    generatedAt: new Date().toISOString(),
  });
});

// Get offer by ID
app.get('/offer/:offerId', (req, res) => {
  const offer = offersStore[req.params.offerId];
  if (!offer) return res.status(404).json({ error: 'Offer not found' });
  res.json(offer);
});

// List all offers
app.get('/offers', (_req, res) => {
  const all = Object.values(offersStore);
  res.json(all);
});

// Accept offer
app.post('/offer/:offerId/accept', (req, res) => {
  const offer = offersStore[req.params.offerId];
  if (!offer) return res.status(404).json({ error: 'Offer not found' });

  if (new Date(offer.expiresAt) < new Date()) {
    return res.status(400).json({ error: 'Offer has expired' });
  }

  offer.accepted = true;
  offer.acceptedAt = new Date().toISOString();
  offersStore[req.params.offerId] = offer;

  console.log(`✅ Offer accepted: ${offer.id} - ₹${offer.loanAmount} @ ${offer.interestRate}%`);
  res.json({ message: 'Offer accepted successfully', offer });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'Offer Service is running',
    policy: POLICY,
    activeOffers: Object.keys(offersStore).length,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Offer Service running on port ${PORT}`);
});

export default app;
