import OpenAI from "openai";
import { z } from "zod";
import { PatientData, ClinicalAnalysis, RiskLevel, ChatSession, ChatResponse } from "../types";

// Initialize OpenAI with the API key from environment variable
const API_KEY = import.meta.env.VITE_API_KEY || process.env.API_KEY;

if (!API_KEY) {
  throw new Error('API key not found. Please set the API_KEY environment variable.');
}

const openai = new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage in this demo environment
});

// --- Zod Schemas for Runtime Validation ---

const InteractionWarningSchema = z.object({
  severity: z.enum(["High", "Moderate", "Low"]),
  description: z.string(),
  source: z.optional(z.enum(["AI_MODEL", "DRUG_DB"])),
});

const TreatmentRecommendationSchema = z.object({
  medication: z.string(),
  dosage: z.string(),
  duration: z.string(),
  rationale: z.string(),
  confidenceScore: z.number().min(0).max(100),
});

const ClinicalAnalysisValidationSchema = z.object({
  riskLevel: z.enum(["Low", "Medium", "High"]),
  riskScore: z.number().min(0).max(100),
  summary: z.string(),
  warnings: z.array(InteractionWarningSchema),
  contraindications: z.array(z.string()),
  treatmentPlan: TreatmentRecommendationSchema,
  alternatives: z.array(TreatmentRecommendationSchema),
  lifestyleRecommendations: z.array(z.string()),
});

// --- Analysis Function ---

export const analyzePatient = async (patient: PatientData): Promise<ClinicalAnalysis> => {
  const model = "gpt-4o";

  const systemInstruction = `
    You are MediGuard, a clinical decision support AI.
    
    TASK:
    Analyze patient data to propose a treatment plan.
    
    RULES:
    1. Safety is paramount. Flag interactions aggressively.
    2. Provide a 'confidenceScore' (0-100) for your recommendation based on clinical guideline strength.
    3. Check for contraindications against the patient's conditions and allergies.
    4. Output STRICT JSON matching the specified structure.
    
    JSON Structure required:
    {
      "riskLevel": "Low" | "Medium" | "High",
      "riskScore": number (0-100),
      "summary": string,
      "warnings": [{ "severity": "High"|"Moderate"|"Low", "description": string }],
      "contraindications": [string],
      "treatmentPlan": { "medication": string, "dosage": string, "duration": string, "rationale": string, "confidenceScore": number },
      "alternatives": [{ "medication": string, "dosage": string, "duration": string, "rationale": string, "confidenceScore": number }],
      "lifestyleRecommendations": [string]
    }
  `;

  const prompt = `
    Analyze this patient:
    ${JSON.stringify(patient, null, 2)}
    
    Primary Complaint: ${patient.primaryComplaint}
    Current Meds: ${patient.currentMedications.map(m => m.name).join(', ')}
    
    Recommend a treatment.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const text = response.choices[0].message.content;
    if (!text) throw new Error("No response from AI");

    // 1. Parse JSON
    let rawData;
    try {
      rawData = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON:", text);
      throw new Error("AI response was not valid JSON");
    }

    // 2. Validate against Zod Schema
    const validationResult = ClinicalAnalysisValidationSchema.safeParse(rawData);

    if (!validationResult.success) {
      console.error("Schema Validation Failed:", JSON.stringify(validationResult));
      throw new Error("AI response did not match the expected clinical schema.");
    }

    const parsed = validationResult.data as ClinicalAnalysis;
    
    // Enrich warnings with Source tag
    parsed.warnings = parsed.warnings.map(w => ({ ...w, source: 'AI_MODEL' }));
    
    return parsed;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

// --- Chat Session Wrapper ---

class OpenAIChatSession implements ChatSession {
  private history: { role: 'system' | 'user' | 'assistant', content: string }[];

  constructor(systemInstruction: string) {
    this.history = [{ role: 'system', content: systemInstruction }];
  }

  async sendMessage(params: { message: string }): Promise<ChatResponse> {
    const userMsg = params.message;
    this.history.push({ role: 'user', content: userMsg });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: this.history as any,
    });

    const text = response.choices[0].message.content || "I apologize, but I couldn't generate a response.";
    this.history.push({ role: 'assistant', content: text });

    return { text };
  }
}

export const createClinicalChatSession = (patient: PatientData, initialAnalysis: ClinicalAnalysis): ChatSession => {
  const systemInstruction = `
    You are MediGuard Assistant.
    Context:
    Patient: ${JSON.stringify(patient)}
    Plan: ${JSON.stringify(initialAnalysis)}
    
    Answer doctor's questions concisely.
  `;

  return new OpenAIChatSession(systemInstruction);
};

export const generatePatientHandout = async (patient: PatientData, analysis: ClinicalAnalysis): Promise<string> => {
  const prompt = `
    Create a simple patient handout for:
    Treatment: ${analysis.treatmentPlan.medication} ${analysis.treatmentPlan.dosage}
    
    Write at 5th grade level. Use Markdown.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: 'user', content: prompt }]
  });

  return response.choices[0].message.content || "Error generating handout.";
};
