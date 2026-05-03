// Shared Queue Job Definitions
import { Queue } from 'bull';

export enum JobType {
  PROCESS_STT = 'process-stt',
  ESTIMATE_AGE = 'estimate-age',
  ASSESS_RISK = 'assess-risk',
  VERIFY_KYC = 'verify-kyc',
  GENERATE_OFFER = 'generate-offer',
  ANALYZE_LLM = 'analyze-llm',
  AUDIT_LOG = 'audit-log',
  UPLOAD_VIDEO = 'upload-video',
}

export interface STTJobData {
  sessionId: string;
  audioUrl: string;
  language?: string;
}

export interface AgeEstimationJobData {
  sessionId: string;
  videoUrl: string;
  frameRate?: number;
}

export interface RiskAssessmentJobData {
  sessionId: string;
  customerId: string;
  transcript: string;
  ageEstimate: number;
  location: { latitude: number; longitude: number };
}

export interface KYCVerificationJobData {
  sessionId: string;
  customerId: string;
  documentType: string;
  documentUrl: string;
}

export interface LoanOfferJobData {
  sessionId: string;
  customerId: string;
  riskBand: string;
  loanAmount?: number;
}

export interface LLMAnalysisJobData {
  sessionId: string;
  transcript: string;
  extractedData: Record<string, any>;
}

export interface AuditLogJobData {
  sessionId: string;
  customerId: string;
  action: string;
  details: Record<string, any>;
  source: string;
}

export interface VideoUploadJobData {
  sessionId: string;
  videoPath: string;
  bucketName: string;
}
