export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other'
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

export interface PatientData {
  id: string;
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  bmi?: number; // Calculated metric
  systolicBp: number;
  diastolicBp: number;
  heartRate: number;
  smokingStatus: 'Never' | 'Former' | 'Current';
  alcoholConsumption: 'None' | 'Occasional' | 'Frequent';
  exerciseFrequency: 'Sedentary' | 'Light' | 'Moderate' | 'Active';
  allergies: string[];
  conditions: string[];
  currentMedications: Medication[];
  primaryComplaint: string;
  notes?: string;
}

export enum RiskLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

export interface InteractionWarning {
  severity: 'High' | 'Moderate' | 'Low';
  description: string;
  source?: 'AI_MODEL' | 'DRUG_DB'; // Track where the warning came from
}

export interface TreatmentRecommendation {
  medication: string;
  dosage: string;
  duration: string;
  rationale: string;
  confidenceScore: number; // 0-100
}

export interface ClinicalAnalysis {
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  summary: string;
  warnings: InteractionWarning[];
  contraindications: string[];
  treatmentPlan: TreatmentRecommendation;
  alternatives: TreatmentRecommendation[];
  lifestyleRecommendations: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: 'INTAKE_SUBMITTED' | 'ANALYSIS_GENERATED' | 'PLAN_MODIFIED' | 'PLAN_APPROVED' | 'PLAN_REJECTED';
  user: string; // e.g., "Dr. Smith" or "System"
  details: string;
}

export type AppStep = 'intake' | 'review' | 'summary';