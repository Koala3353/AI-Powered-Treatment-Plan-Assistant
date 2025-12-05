# MediGuard AI - Clinical Decision Support Assistant

**Mission:** Supercharging clinicians with faster, data-driven decisions while ensuring safety first.

## 📋 Overview

MediGuard AI is a React-based clinical assistant that ingests patient intake data (medical history, vitals, medications) and uses the **Google Gemini 2.5 Flash** model to generate personalized treatment plans. It strictly enforces safety protocols by cross-referencing contraindications and drug interactions using both AI reasoning and a deterministic rule engine.

## Demo
[Google Drive Link to Video](https://drive.google.com/file/d/130xeRttrqV-6WHTuInZF9aeWIHDystPn/view?usp=sharing)

## ✨ Key Features

### Core Clinical Logic
*   **AI-Powered Analysis**: Generates treatment plans, dosage recommendations, and safety risk scores (Low/Medium/High).
*   **Dual-Layer Safety Check**:
    1.  **AI Validation**: The LLM flags interactions based on its training.
    2.  **Deterministic Rule Engine**: A mock database checks for critical interactions (e.g., Nitrates + PDE5 Inhibitors) to catch high-risk cases even if the AI misses them.
*   **Structured Data**: Uses **Zod** schema validation to ensure the AI output strictly adheres to the required JSON format, guaranteeing type safety in the UI.

### User Experience (UX)
*   **Patient Intake Form**: Captures vitals (auto-calculating BMI), conditions, allergies, and lifestyle factors.
*   **Clinical Dashboard**: A "busy doctor" friendly interface highlighting the **Risk Score** and critical **Warnings** immediately.
*   **"Ask MediGuard" Assistant**: A context-aware chat drawer allowing doctors to interrogate the plan or ask for clarifications.
*   **Patient Handout Generator**: Instantly creates a 5th-grade reading level guide for the patient to improve adherence.

### Compliance & Workflow
*   **Edit & Approve**: Clinicians can modify the AI's suggested dosage/duration before finalizing.
*   **Audit Logging**: Tracks every action (Intake, Modification, Approval, Rejection) for medical compliance.
*   **JSON Export**: The final medical record (Plan + Compliance Log) can be exported as a standard JSON file.

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript, Tailwind CSS
*   **AI Model**: Google Gemini 2.5 Flash (via `@google/genai` SDK)
*   **Validation**: Zod (Runtime schema validation)
*   **Icons**: Heroicons (SVG)

## 🚀 How to Run

1.  **API Key**: Ensure you have a valid Google Gemini API Key.
2.  **Environment**: This application expects the API key to be available via `process.env.API_KEY`.
3.  **Launch**:
    *   Open `index.html` in a supported environment (e.g., AI Studio, CodeSandbox).
    *   Or, if running locally, use a bundler like Vite/Parcel and set the `API_KEY` in your `.env` file.

## 🧪 Testing the "High Risk" Scenario

To verify the safety features:
1.  Click **"Load High-Risk Sample"** on the Intake screen.
    *   *Patient*: Male, 58y, Taking **Nitroglycerin**.
    *   *Complaint*: **Erectile Dysfunction** (Requesting Viagra).
2.  Click **"Generate Clinical Plan"**.
3.  **Result**:
    *   Risk Level: **HIGH** (Red).
    *   Warning: The system will flag a **Critical Contraindication** between Nitroglycerin and Sildenafil/Viagra (Hypotension risk).
    *   Source: Validated by both `AI_MODEL` and `DRUG_DB`.

## ⚠️ Disclaimer

**Prototype Only**: This application is a demonstration of AI capabilities in healthcare. It is **not** a certified medical device. Real-world deployment requires rigorous validation, HIPAA compliance, and integration with certified drug databases (e.g., First Databank, Medispan).
