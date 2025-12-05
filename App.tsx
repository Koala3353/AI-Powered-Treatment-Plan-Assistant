import React, { useState } from 'react';
import { IntakeForm } from './components/IntakeForm';
import { ClinicalDashboard } from './components/ClinicalDashboard';
import { FinalSummary } from './components/FinalSummary';
import { analyzePatient } from './services/geminiService';
import { checkDatabaseInteractions } from './services/drugDatabase';
import { PatientData, ClinicalAnalysis, AppStep, AuditLogEntry, TreatmentRecommendation, RiskLevel } from './types';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('intake');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [analysis, setAnalysis] = useState<ClinicalAnalysis | null>(null);
  const [finalPlan, setFinalPlan] = useState<TreatmentRecommendation | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const addLog = (action: AuditLogEntry['action'], details: string) => {
    const entry: AuditLogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      action,
      user: 'Dr. Admin', // Simulated logged-in user
      details
    };
    setAuditLogs(prev => [...prev, entry]);
  };

  const handleIntakeSubmit = async (data: PatientData) => {
    setIsLoading(true);
    setError(null);
    setPatientData(data);
    addLog('INTAKE_SUBMITTED', `Patient ${data.id} intake completed.`);

    try {
      // 1. Get AI Analysis
      const result = await analyzePatient(data);
      addLog('ANALYSIS_GENERATED', `Gemini generated plan for ${data.primaryComplaint}. Risk: ${result.riskLevel}`);

      // 2. Cross-check with Mock Database
      const dbWarnings = checkDatabaseInteractions(data.currentMedications, result.treatmentPlan.medication);
      
      // 3. Merge DB Warnings into AI Result
      if (dbWarnings.length > 0) {
        result.warnings = [...dbWarnings, ...result.warnings];
        // If critical DB warning, force High Risk
        if (dbWarnings.some(w => w.severity === 'High')) {
            result.riskLevel = RiskLevel.High;
            result.riskScore = Math.max(result.riskScore, 90);
        }
      }

      setAnalysis(result);
      setStep('review');
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePlan = (plan: TreatmentRecommendation) => {
    const original = analysis?.treatmentPlan;
    
    // Detailed check for modifications
    const changes: string[] = [];
    if (original) {
        if (plan.medication !== original.medication) changes.push(`Medication: ${original.medication} -> ${plan.medication}`);
        if (plan.dosage !== original.dosage) changes.push(`Dosage: ${original.dosage} -> ${plan.dosage}`);
        if (plan.duration !== original.duration) changes.push(`Duration: ${original.duration} -> ${plan.duration}`);
    }

    if (changes.length > 0) {
        addLog('PLAN_MODIFIED', `Doctor modified: ${changes.join(', ')}`);
    } else {
        addLog('PLAN_APPROVED', `Plan accepted without modification.`);
    }
    
    setFinalPlan(plan);
    setStep('summary');
  };

  const handleRejectPlan = () => {
    addLog('PLAN_REJECTED', `Plan for ${patientData?.primaryComplaint || 'unknown'} rejected by clinician.`);
    handleRestart();
  };

  const handleRestart = () => {
    setStep('intake');
    setPatientData(null);
    setAnalysis(null);
    setFinalPlan(null);
    setAuditLogs([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">MediGuard AI</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium">
             <span className={step === 'intake' ? 'text-indigo-600 font-semibold' : 'text-gray-400'}>1. Intake</span>
             <span className="text-gray-300">→</span>
             <span className={step === 'review' ? 'text-indigo-600 font-semibold' : 'text-gray-400'}>2. Analysis & Review</span>
             <span className="text-gray-300">→</span>
             <span className={step === 'summary' ? 'text-indigo-600 font-semibold' : 'text-gray-400'}>3. Final Plan</span>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8">
        {error && (
          <div className="max-w-4xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-800">
             <p>{error}</p>
          </div>
        )}

        {step === 'intake' && (
             <IntakeForm onSubmit={handleIntakeSubmit} isLoading={isLoading} />
        )}

        {step === 'review' && patientData && analysis && (
            <ClinicalDashboard 
              analysis={analysis} 
              patient={patientData} 
              onApprove={handleApprovePlan}
              onReject={handleRejectPlan}
            />
        )}

        {step === 'summary' && patientData && finalPlan && (
            <FinalSummary 
                plan={finalPlan} 
                patient={patientData} 
                logs={auditLogs}
                onRestart={handleRestart}
            />
        )}
      </main>
    </div>
  );
};

export default App;