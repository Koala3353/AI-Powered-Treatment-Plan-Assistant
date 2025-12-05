import React from 'react';
import { TreatmentRecommendation, PatientData, AuditLogEntry } from '../types';

interface FinalSummaryProps {
  plan: TreatmentRecommendation;
  patient: PatientData;
  logs: AuditLogEntry[];
  onRestart: () => void;
}

export const FinalSummary: React.FC<FinalSummaryProps> = ({ plan, patient, logs, onRestart }) => {
  
  const handleDownloadJson = () => {
    const record = {
      meta: {
        app: "MediGuard AI",
        version: "1.0",
        exportedAt: new Date().toISOString()
      },
      patient: patient,
      finalTreatmentPlan: plan,
      complianceLog: logs
    };
    
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mediguard_record_${patient.id}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Treatment Plan Finalized</h1>
        <p className="text-gray-500">The following plan has been approved and logged for compliance.</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-bold text-gray-700">Prescription Summary</h2>
            <span className="text-sm text-gray-500">ID: {patient.id}</span>
        </div>
        <div className="p-8">
            <div className="flex justify-between items-start mb-8 pb-8 border-b border-dashed border-gray-300">
                <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">Medication</div>
                    <div className="text-3xl font-bold text-indigo-900">{plan.medication}</div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">Dosage</div>
                    <div className="text-2xl font-bold text-gray-900">{plan.dosage}</div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">Frequency</div>
                    <div className="text-lg font-medium">{plan.duration}</div>
                </div>
                <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">Patient</div>
                    <div className="text-lg font-medium">{patient.gender}, {patient.age} years</div>
                </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm text-yellow-800">
                <strong>Clinical Rationale:</strong> {plan.rationale}
            </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 border-t flex flex-wrap justify-end gap-3">
            <button onClick={handleDownloadJson} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors flex items-center gap-2 text-gray-700">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
               Export JSON Record
            </button>
            <button onClick={() => window.print()} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors flex items-center gap-2 text-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                Print Prescription
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm">
                Send to Pharmacy
            </button>
        </div>
      </div>

      {/* Audit Log Section */}
      <div className="bg-gray-900 rounded-xl shadow-lg p-6 text-gray-300 font-mono text-sm">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Compliance Audit Log
        </h3>
        <div className="space-y-3">
            {logs.map((log) => (
                <div key={log.id} className="flex gap-4 border-l-2 border-gray-700 pl-4 py-1">
                    <div className="w-24 shrink-0 text-gray-500 text-xs">
                        {log.timestamp.toLocaleTimeString()}
                    </div>
                    <div>
                        <span className={`font-bold mr-2 ${
                            log.action === 'PLAN_APPROVED' ? 'text-green-400' : 
                            log.action === 'PLAN_MODIFIED' ? 'text-yellow-400' : 'text-blue-400'
                        }`}>
                            [{log.action}]
                        </span>
                        <span className="text-gray-400 mr-2">by {log.user}:</span>
                        <span className="text-gray-200">{log.details}</span>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button onClick={onRestart} className="text-indigo-600 font-medium hover:text-indigo-800">
            Start New Patient Intake
        </button>
      </div>
    </div>
  );
};