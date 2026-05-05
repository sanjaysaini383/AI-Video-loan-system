import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.KYC_SERVICE_PORT || 3004;
app.use(express.json());

// In-memory storage for KYC records
const kycRecords: Record<string, any> = {};
const consentRecords: Record<string, any[]> = {};

// Configurable geofence (India bounding box by default)
const GEOFENCE = {
  minLat: parseFloat(process.env.GEO_MIN_LAT || '6.0'),
  maxLat: parseFloat(process.env.GEO_MAX_LAT || '37.0'),
  minLng: parseFloat(process.env.GEO_MIN_LNG || '68.0'),
  maxLng: parseFloat(process.env.GEO_MAX_LNG || '97.5'),
  country: 'India',
};

// ===========================
// KYC VERIFICATION
// ===========================
app.post('/verify', async (req, res) => {
  const { sessionId, userId, documentType, documentData } = req.body;

  console.log(`🔍 KYC verification for session ${sessionId}, type: ${documentType}`);

  // Simulate document verification
  const verificationResult = {
    id: `kyc_${Date.now()}`,
    sessionId,
    userId,
    documentType: documentType || 'aadhaar',
    status: 'verified',
    confidence: 0.95 + Math.random() * 0.04,
    verifiedAt: new Date().toISOString(),
    details: {
      nameMatch: true,
      documentValid: true,
      expiryValid: true,
    },
  };

  kycRecords[sessionId] = kycRecords[sessionId] || [];
  kycRecords[sessionId].push(verificationResult);

  res.json(verificationResult);
});

// ===========================
// GEO-LOCATION VALIDATION
// ===========================
app.post('/validate-location', (req, res) => {
  const { latitude, longitude, sessionId, declaredCity } = req.body;

  console.log(`📍 Location validation for session ${sessionId}: ${latitude}, ${longitude}`);

  const isWithinGeofence =
    latitude >= GEOFENCE.minLat && latitude <= GEOFENCE.maxLat &&
    longitude >= GEOFENCE.minLng && longitude <= GEOFENCE.maxLng;

  // Location risk assessment
  let riskLevel = 'low';
  const fraudSignals: string[] = [];

  if (!isWithinGeofence) {
    riskLevel = 'high';
    fraudSignals.push('Location outside service geofence');
  }

  // Check if location matches declared city (simplified)
  if (declaredCity && !isWithinGeofence) {
    fraudSignals.push('Location mismatch with declared city');
    riskLevel = 'high';
  }

  // VPN/proxy detection heuristic
  if (latitude === 0 && longitude === 0) {
    fraudSignals.push('Invalid coordinates - possible spoofing');
    riskLevel = 'high';
  }

  res.json({
    sessionId,
    valid: isWithinGeofence,
    riskLevel,
    fraudSignals,
    geofence: GEOFENCE.country,
    coordinates: { latitude, longitude },
    validatedAt: new Date().toISOString(),
  });
});

// ===========================
// CONSENT CAPTURE
// ===========================
app.post('/consent', (req, res) => {
  const { sessionId, userId, consentType, verballyAgreed, audioUrl } = req.body;

  console.log(`✅ Consent recorded for session ${sessionId}: ${consentType}`);

  const consent = {
    id: `consent_${Date.now()}`,
    sessionId,
    userId,
    consentType: consentType || 'loan_processing',
    verballyAgreed: verballyAgreed ?? true,
    recorded: !!audioUrl,
    audioUrl: audioUrl || null,
    timestamp: new Date().toISOString(),
    valid: true,
  };

  consentRecords[sessionId] = consentRecords[sessionId] || [];
  consentRecords[sessionId].push(consent);

  res.json(consent);
});

// Get consent records for session
app.get('/consent/:sessionId', (req, res) => {
  const consents = consentRecords[req.params.sessionId] || [];
  res.json({ sessionId: req.params.sessionId, consents });
});

// ===========================
// AGE CONSISTENCY CHECK
// ===========================
app.post('/verify-age', (req, res) => {
  const { sessionId, declaredAge, estimatedAge, declaredDob } = req.body;

  const ageDiff = Math.abs((declaredAge || 30) - (estimatedAge || 30));
  const isConsistent = ageDiff <= 5;
  const meetsMinAge = (estimatedAge || declaredAge || 30) >= parseInt(process.env.MIN_AGE || '18');
  const meetsMaxAge = (estimatedAge || declaredAge || 30) <= parseInt(process.env.MAX_AGE || '65');

  const fraudSignals: string[] = [];
  if (!isConsistent) fraudSignals.push(`Age mismatch: declared ${declaredAge} vs estimated ${estimatedAge}`);
  if (!meetsMinAge) fraudSignals.push('Below minimum age requirement');
  if (!meetsMaxAge) fraudSignals.push('Above maximum age requirement');

  res.json({
    sessionId,
    consistent: isConsistent,
    eligible: meetsMinAge && meetsMaxAge,
    declaredAge,
    estimatedAge,
    ageDifference: ageDiff,
    fraudSignals,
  });
});

// Get KYC status for session
app.get('/status/:sessionId', (req, res) => {
  const records = kycRecords[req.params.sessionId] || [];
  const consents = consentRecords[req.params.sessionId] || [];
  const allVerified = records.length > 0 && records.every((r: any) => r.status === 'verified');
  const hasConsent = consents.length > 0;

  res.json({
    sessionId: req.params.sessionId,
    kycStatus: allVerified ? 'verified' : records.length > 0 ? 'partial' : 'pending',
    consentStatus: hasConsent ? 'recorded' : 'pending',
    verifications: records,
    consents,
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'KYC Service is running',
    geofence: GEOFENCE.country,
    features: ['document_verification', 'geo_validation', 'consent_capture', 'age_verification'],
  });
});

app.listen(PORT, () => {
  console.log(`🚀 KYC Service running on port ${PORT}`);
});

export default app;
