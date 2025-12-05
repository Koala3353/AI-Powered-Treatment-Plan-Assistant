import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { z } from "zod";
import { PatientData, ClinicalAnalysis, RiskLevel } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

// --- Gemini API Schema (for Generation) ---

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    riskLevel: {
      type: Type.STRING,
      enum: ["Low", "Medium", "High"],
      description: "The overall safety risk level.",
    },
    riskScore: {
      type: Type.INTEGER,
      description: "A calculated risk score from 0 (safe) to 100 (critical).",
    },
    summary: {
      type: Type.STRING,
      description: "A concise clinical summary.",
    },
    warnings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          severity: {
            type: Type.STRING,
            enum: ["High", "Moderate", "Low"],
          },
          description: {
            type: Type.STRING,
            description: "Description of the warning.",
          },
        },
        required: ["severity", "description"],
      },
    },
    contraindications: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    treatmentPlan: {
      type: Type.OBJECT,
      properties: {
        medication: { type: Type.STRING },
        dosage: { type: Type.STRING },
        duration: { type: Type.STRING },
        rationale: { type: Type.STRING },
        confidenceScore: { 
          type: Type.INTEGER, 
          description: "Confidence in this recommendation (0-100)" 
        },
      },
      required: ["medication", "dosage", "duration", "rationale", "confidenceScore"],
    },
    alternatives: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          medication: { type: Type.STRING },
          dosage: { type: Type.STRING },
          duration: { type: Type.STRING },
          rationale: { 
              type: Type.STRING,
              description: "A concise explanation of why this specific treatment is recommended as an alternative, including benefits over the primary option if applicable." 
          },
          confidenceScore: { type: Type.INTEGER },
        },
        required: ["medication", "dosage", "duration", "rationale", "confidenceScore"],
      },
    },
    lifestyleRecommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    "riskLevel",
    "riskScore",
    "summary",
    "warnings",
    "contraindications",
    "treatmentPlan",
    "alternatives",
    "lifestyleRecommendations",
  ],
};

export const analyzePatient = async (patient: PatientData): Promise<ClinicalAnalysis> => {
  const model = "gemini-2.5-flash";

  const systemInstruction = `
    You are MediGuard, a clinical decision support AI.
    
    TASK:
    Analyze patient data to propose a treatment plan.
    
    RULES:
    1. Safety is paramount. Flag interactions aggressively.
    2. Provide a 'confidenceScore' (0-100) for your recommendation based on clinical guideline strength.
    3. Check for contraindications against the patient's conditions and allergies.
    4. Output STRICT JSON.
  `;

  const prompt = `
    Analyze this patient:
    ${JSON.stringify(patient, null, 2)}
    
    Primary Complaint: ${patient.primaryComplaint}
    Current Meds: ${patient.currentMedications.map(m => m.name).join(', ')}
    
    Recommend a treatment.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.1,
      },
    });

    const text = response.text;
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
      console.error("Schema Validation Failed:", validationResult.error);
      throw new Error("AI response did not match the expected clinical schema.");
    }

    const parsed = validationResult.data as ClinicalAnalysis;
    
    // Enrich warnings with Source tag (since AI schema doesn't strictly require it)
    parsed.warnings = parsed.warnings.map(w => ({ ...w, source: 'AI_MODEL' }));
    
    return parsed;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const createClinicalChatSession = (patient: PatientData, initialAnalysis: ClinicalAnalysis): Chat => {
  const systemInstruction = `
    You are MediGuard Assistant.
    Context:
    Patient: ${JSON.stringify(patient)}
    Plan: ${JSON.stringify(initialAnalysis)}
    
    Answer doctor's questions concisely.
  `;

  return genAI.chats.create({
    model: "gemini-2.5-flash",
    config: { systemInstruction },
  });
};

export const generatePatientHandout = async (patient: PatientData, analysis: ClinicalAnalysis): Promise<string> => {
  const prompt = `
    Create a simple patient handout for:
    Treatment: ${analysis.treatmentPlan.medication} ${analysis.treatmentPlan.dosage}
    
    Write at 5th grade level. Use Markdown.
  `;

  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });

  return response.text || "Error generating handout.";
};