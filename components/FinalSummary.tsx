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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 text-green-600 mb-4 shadow-lg">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Treatment Plan Finalized</h1>
        <p className="text-gray-600 text-lg">The following plan has been approved and logged for compliance.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5 border-b-2 border-gray-200 flex justify-between items-center">
            <h2 className="font-bold text-gray-800 text-lg tracking-tight">Prescription Summary</h2>
            <span className="text-sm text-gray-600 font-medium">ID: {patient.id}</span>
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

            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-xl border-2 border-yellow-100 text-sm text-yellow-900 shadow-sm">
                <strong className="font-bold">Clinical Rationale:</strong> {plan.rationale}
            </div>
        </div>
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-t-2 border-gray-200 flex flex-wrap justify-end gap-3">
            <button onClick={handleDownloadJson} className="px-4 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-white shadow-sm hover:shadow-md flex items-center gap-2 text-gray-700 font-medium">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
               Export JSON Record
            </button>
            <button onClick={() => window.print()} className="px-4 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-white shadow-sm hover:shadow-md flex items-center gap-2 text-gray-700 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                Print Prescription
            </button>
            <button className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg">
                Send to Pharmacy
            </button>
        </div>
      </div>

      {/* Audit Log Section */}
      <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-2xl shadow-2xl p-6 text-gray-300 font-mono text-sm border border-gray-800">
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