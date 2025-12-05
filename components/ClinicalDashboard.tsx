import React, { useState, useRef, useEffect } from 'react';
import { ClinicalAnalysis, PatientData, RiskLevel, ChatMessage, TreatmentRecommendation, ChatSession } from '../types';
import { createClinicalChatSession, generatePatientHandout } from '../services/geminiService';

interface DashboardProps {
  analysis: ClinicalAnalysis;
  patient: PatientData;
  onApprove: (finalPlan: TreatmentRecommendation) => void;
  onReject: () => void;
}

export const ClinicalDashboard: React.FC<DashboardProps> = ({ analysis, patient, onApprove, onReject }) => {
  const [showChat, setShowChat] = useState(false);
  const [showHandout, setShowHandout] = useState(false);
  const [handoutContent, setHandoutContent] = useState<string>("");
  const [isGeneratingHandout, setIsGeneratingHandout] = useState(false);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editablePlan, setEditablePlan] = useState<TreatmentRecommendation>(analysis.treatmentPlan);

  // Chat State
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const session = createClinicalChatSession(patient, analysis);
    setChatSession(session);
    setMessages([{ role: 'model', text: "I've reviewed the patient's file. I'm ready to answer any questions." }]);
  }, [patient, analysis]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showChat]);

  const handleSendMessage = async () => {
    if (!inputMsg.trim() || !chatSession) return;
    const userText = inputMsg;
    setInputMsg("");
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsChatLoading(true);

    try {
      const response = await chatSession.sendMessage({ message: userText });
      setMessages(prev => [...prev, { role: 'model', text: response.text || "Error." }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Error communicating with MediGuard AI." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateHandout = async () => {
    setShowHandout(true);
    if (!handoutContent) {
      setIsGeneratingHandout(true);
      try {
        const text = await generatePatientHandout(patient, analysis);
        setHandoutContent(text);
      } catch (e) {
        setHandoutContent("Failed to generate handout. Please try again.");
      } finally {
        setIsGeneratingHandout(false);
      }
    }
  };

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.High: return 'bg-red-50 text-red-900 border-red-200';
      case RiskLevel.Medium: return 'bg-orange-50 text-orange-900 border-orange-200';
      case RiskLevel.Low: return 'bg-green-50 text-green-900 border-green-200';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-100';
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 relative">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-xs font-bold px-3 py-1 rounded-lg shadow-sm">STEP 2 OF 3</span>
             <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Review & Edit Plan</h1>
           </div>
          <p className="text-gray-500">
            Patient: <span className="font-medium text-gray-800">{patient.gender}, {patient.age}y</span> | 
            Complaint: <span className="font-medium text-gray-800">{patient.primaryComplaint}</span>
          </p>
        </div>
        
        <div className="flex gap-4 items-center">
            <div className={`px-6 py-4 rounded-xl border-2 flex flex-col items-center justify-center min-w-[160px] shadow-md ${getRiskColor(analysis.riskLevel)}`}>
              <span className="text-xs uppercase tracking-wider font-bold opacity-90">Safety Risk</span>
              <div className="text-3xl font-black tracking-tight mt-1">{analysis.riskLevel.toUpperCase()}</div>
              <div className="text-xs font-semibold mt-1.5 opacity-80">Score: {analysis.riskScore}/100</div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
           <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
             <h2 className="text-lg font-bold text-gray-800 mb-3 tracking-tight">Clinical Analysis</h2>
             <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
           </div>

          {/* Treatment Plan Editor */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 overflow-hidden relative">
             <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center shadow-md">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                    Primary Treatment Recommendation
                </h2>
                <div className="flex items-center gap-2 bg-blue-800 px-3 py-1 rounded text-white text-xs">
                    <span>AI Confidence:</span>
                    <span className={`font-bold ${getConfidenceColor(editablePlan.confidenceScore || 0).replace('bg-green-50', 'bg-white').replace('border-green-100', '')} px-1 rounded`}>
                        {editablePlan.confidenceScore}%
                    </span>
                </div>
             </div>
             
             <div className="p-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Medication</label>
                        <input 
                          type="text" 
                          value={editablePlan.medication}
                          onChange={e => setEditablePlan({...editablePlan, medication: e.target.value})}
                          className="w-full border rounded p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Dosage</label>
                        <input 
                          type="text" 
                          value={editablePlan.dosage}
                          onChange={e => setEditablePlan({...editablePlan, dosage: e.target.value})}
                          className="w-full border rounded p-2"
                        />
                      </div>
                       <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Duration</label>
                        <input 
                          type="text" 
                          value={editablePlan.duration}
                          onChange={e => setEditablePlan({...editablePlan, duration: e.target.value})}
                          className="w-full border rounded p-2"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Rationale</label>
                      <textarea 
                          value={editablePlan.rationale}
                          onChange={e => setEditablePlan({...editablePlan, rationale: e.target.value})}
                          className="w-full border rounded p-2 h-24"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setIsEditing(false)} className="text-gray-600 px-4 py-2 hover:bg-gray-100 rounded">Cancel</button>
                      <button onClick={() => setIsEditing(false)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save Changes</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col md:flex-row gap-6 mb-6">
                        <div className="flex-1">
                            <label className="text-xs uppercase text-gray-500 font-bold">Medication</label>
                            <div className="text-2xl font-bold text-gray-900">{editablePlan.medication}</div>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs uppercase text-gray-500 font-bold">Dosage</label>
                            <div className="text-xl font-semibold text-gray-900">{editablePlan.dosage}</div>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs uppercase text-gray-500 font-bold">Duration</label>
                            <div className="text-xl font-semibold text-gray-900">{editablePlan.duration}</div>
                        </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                        <label className="text-xs uppercase text-blue-800 font-bold mb-1 block">Clinical Rationale</label>
                        <p className="text-blue-900 text-sm leading-relaxed">{editablePlan.rationale}</p>
                    </div>
                  </>
                )}
             </div>
          </div>

          {/* Warnings */}
          {(analysis.warnings.length > 0 || analysis.contraindications.length > 0) && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
               <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                   <span className="bg-yellow-500 text-white rounded-full p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></span>
                   Safety Alerts
               </h2>
               
               <div className="space-y-3">
                 {analysis.contraindications.map((contra, idx) => (
                   <div key={`contra-${idx}`} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <div>
                        <span className="text-xs font-bold text-red-800 uppercase tracking-wide block">Contraindication</span>
                        <p className="text-red-900 text-sm font-medium">{contra}</p>
                      </div>
                   </div>
                 ))}

                 {analysis.warnings.map((warn, idx) => (
                   <div key={`warn-${idx}`} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border w-fit ${
                            warn.severity === 'High' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-orange-100 text-orange-800'
                        }`}>
                            {warn.severity}
                        </span>
                        {warn.source === 'DRUG_DB' && (
                            <span className="text-[10px] font-mono text-gray-500 uppercase">Validated by DB</span>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm">{warn.description}</p>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>

        {/* Right Column: Enhanced Alternatives */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-md font-bold text-gray-900 mb-4 uppercase tracking-wide text-sm flex items-center justify-between">
                <span>Alternative Options</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">{analysis.alternatives.length} available</span>
            </h2>
            <div className="space-y-4">
              {analysis.alternatives.map((alt, idx) => (
                <div 
                    key={idx} 
                    className="group border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md cursor-pointer bg-white relative overflow-hidden"
                    onClick={() => setEditablePlan(alt)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{alt.medication}</h3>
                        <span className="text-sm font-medium text-gray-500">{alt.dosage} • {alt.duration}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${getConfidenceColor(alt.confidenceScore)}`}>
                        {alt.confidenceScore}% Match
                    </span>
                  </div>
                  
                  <div className="mt-3 flex gap-2 items-start bg-gray-50 p-2.5 rounded-md">
                     <svg className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                     <p className="text-sm text-gray-600 leading-snug">
                        <span className="font-semibold text-indigo-900 block mb-0.5 text-xs uppercase">Why consider this?</span> 
                        {alt.rationale}
                     </p>
                  </div>
                  
                  <div className="mt-2 text-right opacity-0 group-hover:opacity-100 absolute top-2 right-2">
                       <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">Click to Select</span>
                  </div>
                </div>
              ))}
              
              {analysis.alternatives.length === 0 && (
                  <p className="text-sm text-gray-500 italic text-center py-4">No specific alternatives recommended by AI.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-2xl z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 w-full md:w-auto">
                <button 
                    onClick={() => setShowChat(!showChat)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-bold rounded-xl hover:from-indigo-100 hover:to-purple-100 shadow-sm hover:shadow-md"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                    {showChat ? 'Close Assistant' : 'Ask MediGuard'}
                </button>
                <button 
                    onClick={handleGenerateHandout}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-indigo-700 font-bold rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 shadow-sm hover:shadow-md"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Patient Handout
                </button>
            </div>

            <div className="flex gap-3 w-full md:w-auto justify-end">
                <button onClick={onReject} className="px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg">
                    Reject Plan
                </button>
                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg"
                >
                    {isEditing ? 'Done Editing' : 'Modify Plan'}
                </button>
                <button 
                    onClick={() => onApprove(editablePlan)}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                >
                    Approve & Prescribe
                </button>
            </div>
        </div>
      </div>

      {/* Chat Drawer */}
      {showChat && (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col h-[500px]">
            <div className="bg-indigo-600 p-4 flex justify-between text-white rounded-t-xl shadow-sm">
                <h3 className="font-bold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                    MediGuard Assistant
                </h3>
                <button onClick={() => setShowChat(false)} className="hover:bg-indigo-700 rounded p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg p-3 text-sm shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isChatLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white border rounded-lg rounded-bl-none p-3 shadow-sm flex gap-2 items-center">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="p-3 bg-white border-t rounded-b-xl flex gap-2">
                <input 
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    value={inputMsg}
                    onChange={e => setInputMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about risks, alternatives..."
                />
                <button 
                    onClick={handleSendMessage} 
                    disabled={!inputMsg.trim() || isChatLoading}
                    className="bg-indigo-600 text-white px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
            </div>
        </div>
      )}

      {/* Patient Handout Modal */}
      {showHandout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                <div className="p-5 border-b flex justify-between items-center bg-indigo-50">
                    <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Patient Education Guide
                    </h3>
                    <button onClick={() => setShowHandout(false)} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div className="p-8 overflow-y-auto flex-1 bg-white">
                    {isGeneratingHandout ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
                            <p className="text-gray-500 font-medium">Writing clear instructions...</p>
                        </div>
                    ) : (
                        <div className="prose prose-indigo max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed text-base">{handoutContent}</pre>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                     <button onClick={() => setShowHandout(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg">Close</button>
                     <button onClick={() => window.print()} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        Print Guide
                     </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};