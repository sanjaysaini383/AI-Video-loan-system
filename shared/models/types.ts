// Shared Type Definitions
export interface VideoSession {
  id: string;
  customerId: string;
  campaignId?: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  status: 'active' | 'completed' | 'failed';
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  deviceInfo: {
    userAgent: string;
    ip: string;
    platform: string;
  };
}

export interface STTTranscript {
  sessionId: string;
  transcriptId: string;
  fullText: string;
  segments: TranscriptSegment[];
  confidence: number;
  language: string;
}

export interface TranscriptSegment {
  text: string;
  timestamp: number;
  confidence: number;
}

export interface AgeEstimation {
  sessionId: string;
  estimatedAge: number;
  confidence: number;
  faces: number;
  livenessScore: number;
}

export interface RiskAssessment {
  sessionId: string;
  riskBand: 'low' | 'medium' | 'high';
  riskScore: number;
  fraudIndicators: string[];
  propensityScore: number;
  reasons: string[];
}

export interface LoanOffer {
  id: string;
  sessionId: string;
  customerId: string;
  loanAmount: number;
  tenure: number[]; // months
  interestRate: number;
  emi: number;
  eligibilityStatus: 'approved' | 'conditional' | 'rejected';
  conditions?: string[];
  generatedAt: Date;
  expiresAt: Date;
}

export interface AuditLog {
  id: string;
  sessionId: string;
  customerId: string;
  action: string;
  details: Record<string, any>;
  timestamp: Date;
  source: string;
}

export interface ConsentRecord {
  sessionId: string;
  customerId: string;
  consentType: string;
  verbally_agreed: boolean;
  recorded: boolean;
  timestamp: Date;
  audioUrl: string;
}
