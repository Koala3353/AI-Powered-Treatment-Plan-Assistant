import React, { useState, useEffect } from 'react';
import { PatientData, Gender, Medication } from '../types';

interface IntakeFormProps {
  onSubmit: (data: PatientData) => void;
  isLoading: boolean;
}

const SAMPLE_PATIENT: PatientData = {
  id: '12345',
  age: 58,
  gender: Gender.Male,
  weightKg: 95,
  heightCm: 178,
  bmi: 30.0,
  systolicBp: 155,
  diastolicBp: 95,
  heartRate: 78,
  smokingStatus: 'Former',
  alcoholConsumption: 'Occasional',
  exerciseFrequency: 'Sedentary',
  allergies: ['Penicillin'],
  conditions: ['Hypertension', 'Type 2 Diabetes', 'Angina'],
  currentMedications: [
    { name: 'Lisinopril', dosage: '20mg', frequency: 'Daily' },
    { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
    { name: 'Nitroglycerin', dosage: '0.4mg', frequency: 'PRN for chest pain' } // High risk with ED meds
  ],
  primaryComplaint: 'Erectile Dysfunction',
  notes: 'Patient reports symptoms worsening over the last 6 months. Requesting Viagra.'
};

const EMPTY_PATIENT: PatientData = {
  id: Date.now().toString(),
  age: 0,
  gender: Gender.Male,
  weightKg: 0,
  heightCm: 0,
  systolicBp: 120,
  diastolicBp: 80,
  heartRate: 70,
  smokingStatus: 'Never',
  alcoholConsumption: 'None',
  exerciseFrequency: 'Light',
  allergies: [],
  conditions: [],
  currentMedications: [],
  primaryComplaint: '',
  notes: ''
};

export const IntakeForm: React.FC<IntakeFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<PatientData>(EMPTY_PATIENT);
  const [newMed, setNewMed] = useState<Medication>({ name: '', dosage: '', frequency: '' });
  const [newItem, setNewItem] = useState<string>('');
  const [bmi, setBmi] = useState<string>('--');

  // Calculate BMI whenever weight or height changes
  useEffect(() => {
    if (formData.weightKg > 0 && formData.heightCm > 0) {
      const heightM = formData.heightCm / 100;
      const bmiValue = (formData.weightKg / (heightM * heightM)).toFixed(1);
      setBmi(bmiValue);
      setFormData(prev => ({ ...prev, bmi: parseFloat(bmiValue) }));
    } else {
      setBmi('--');
    }
  }, [formData.weightKg, formData.heightCm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: Number(value) }));
  };

  const addArrayItem = (field: 'allergies' | 'conditions') => {
    if (newItem.trim()) {
      setFormData(prev => ({ ...prev, [field]: [...prev[field], newItem.trim()] }));
      setNewItem('');
    }
  };

  const removeArrayItem = (field: 'allergies' | 'conditions', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addMedication = () => {
    if (newMed.name && newMed.dosage) {
      setFormData(prev => ({
        ...prev,
        currentMedications: [...prev.currentMedications, newMed]
      }));
      setNewMed({ name: '', dosage: '', frequency: '' });
    }
  };

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      currentMedications: prev.currentMedications.filter((_, i) => i !== index)
    }));
  };

  const loadSample = () => {
    setFormData({ ...SAMPLE_PATIENT, id: Date.now().toString() });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-slate-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Patient Intake</h2>
        <button
          type="button"
          onClick={loadSample}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-md"
        >
          Load High-Risk Sample
        </button>
      </div>

      <div className="p-6 space-y-8">
        {/* Demographics & Vitals */}
        <section>
          <h3 className="text-sm uppercase tracking-wide text-gray-500 font-bold mb-4 border-b pb-2">Vitals & Demographics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input type="number" name="age" value={formData.age || ''} onChange={handleNumberChange} className="w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm border p-2">
                <option value={Gender.Male}>Male</option>
                <option value={Gender.Female}>Female</option>
                <option value={Gender.Other}>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input type="number" name="weightKg" value={formData.weightKg || ''} onChange={handleNumberChange} className="w-full rounded-md border-gray-300 shadow-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input type="number" name="heightCm" value={formData.heightCm || ''} onChange={handleNumberChange} className="w-full rounded-md border-gray-300 shadow-sm border p-2" />
            </div>
            
            {/* BMI Display */}
            <div className="bg-gray-50 p-2 rounded-md border border-gray-200 flex flex-col justify-center items-center">
              <span className="text-xs text-gray-500 font-bold uppercase">BMI</span>
              <span className="text-lg font-bold text-indigo-600">{bmi}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Systolic BP</label>
              <input type="number" name="systolicBp" value={formData.systolicBp || ''} onChange={handleNumberChange} className="w-full rounded-md border-gray-300 shadow-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diastolic BP</label>
              <input type="number" name="diastolicBp" value={formData.diastolicBp || ''} onChange={handleNumberChange} className="w-full rounded-md border-gray-300 shadow-sm border p-2" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Exercise</label>
               <select name="exerciseFrequency" value={formData.exerciseFrequency} onChange={handleChange} className="w-full rounded-md border-gray-300 shadow-sm border p-2">
                 <option value="Sedentary">Sedentary</option>
                 <option value="Light">Light (1-2x/week)</option>
                 <option value="Moderate">Moderate (3-4x/week)</option>
                 <option value="Active">Active (5+/week)</option>
               </select>
            </div>
          </div>
        </section>

        {/* Clinical History */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Conditions */}
          <div>
            <h3 className="text-sm uppercase tracking-wide text-gray-500 font-bold mb-4 border-b pb-2">Medical Conditions</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Add condition (e.g. Asthma)"
                className="flex-1 rounded-md border-gray-300 border p-2 shadow-sm"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter') addArrayItem('conditions'); }}
              />
              <button
                type="button"
                onClick={() => addArrayItem('conditions')}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.conditions.map((item, idx) => (
                <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {item}
                  <button onClick={() => removeArrayItem('conditions', idx)} className="hover:text-blue-900">×</button>
                </span>
              ))}
              {formData.conditions.length === 0 && <span className="text-gray-400 text-sm italic">No conditions listed</span>}
            </div>
          </div>

          {/* Allergies */}
          <div>
             <h3 className="text-sm uppercase tracking-wide text-gray-500 font-bold mb-4 border-b pb-2">Allergies</h3>
              <div className="flex gap-2 mb-3">
               <input 
                type="text" 
                id="allergyInput"
                placeholder="Add allergy"
                className="flex-1 rounded-md border-gray-300 border p-2 shadow-sm"
                onKeyDown={(e) => {
                  if(e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value;
                    if(val) {
                      setFormData(prev => ({ ...prev, allergies: [...prev.allergies, val] }));
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
               <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('allergyInput') as HTMLInputElement;
                  if(input && input.value) {
                     setFormData(prev => ({ ...prev, allergies: [...prev.allergies, input.value] }));
                     input.value = '';
                  }
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                Add
              </button>
            </div>
             <div className="flex flex-wrap gap-2">
              {formData.allergies.map((item, idx) => (
                <span key={idx} className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {item}
                  <button onClick={() => removeArrayItem('allergies', idx)} className="hover:text-red-900">×</button>
                </span>
              ))}
               {formData.allergies.length === 0 && <span className="text-gray-400 text-sm italic">No allergies listed</span>}
            </div>
          </div>
        </section>

        {/* Medications */}
        <section>
          <h3 className="text-sm uppercase tracking-wide text-gray-500 font-bold mb-4 border-b pb-2">Current Medications</h3>
          <div className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <input
                type="text"
                placeholder="Medication Name"
                className="rounded-md border-gray-300 border p-2"
                value={newMed.name}
                onChange={e => setNewMed({ ...newMed, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Dosage (e.g. 10mg)"
                className="rounded-md border-gray-300 border p-2"
                value={newMed.dosage}
                onChange={e => setNewMed({ ...newMed, dosage: e.target.value })}
              />
               <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Frequency"
                  className="rounded-md border-gray-300 border p-2 flex-1"
                  value={newMed.frequency}
                  onChange={e => setNewMed({ ...newMed, frequency: e.target.value })}
                />
                <button
                  type="button"
                  onClick={addMedication}
                  className="bg-blue-600 text-white px-4 rounded-md hover:bg-blue-700"
                >
                  +
                </button>
               </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="px-6 py-3 relative"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.currentMedications.map((med, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{med.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{med.dosage}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{med.frequency}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => removeMedication(idx)} className="text-red-600 hover:text-red-900">Remove</button>
                    </td>
                  </tr>
                ))}
                 {formData.currentMedications.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-400 italic">No current medications added.</td>
                    </tr>
                 )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Primary Complaint */}
        <section>
           <h3 className="text-sm uppercase tracking-wide text-gray-500 font-bold mb-4 border-b pb-2">Reason for Visit</h3>
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Primary Complaint</label>
               <input
                type="text"
                name="primaryComplaint"
                placeholder="e.g. Acute lower back pain, Insomnia, Erectile Dysfunction"
                className="w-full rounded-md border-gray-300 shadow-sm border p-3 focus:ring-blue-500 focus:border-blue-500 text-lg"
                value={formData.primaryComplaint}
                onChange={handleChange}
               />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Clinical Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm border p-3"
                  value={formData.notes}
                  onChange={handleChange}
                ></textarea>
             </div>
           </div>
        </section>

        <div className="pt-6 border-t flex justify-end">
          <button
            onClick={() => onSubmit(formData)}
            disabled={isLoading || !formData.primaryComplaint}
            className={`
              px-8 py-4 rounded-lg font-bold text-lg shadow-lg flex items-center gap-2
              ${isLoading || !formData.primaryComplaint 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl transform transition hover:-translate-y-0.5'}
            `}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : (
              'Generate Clinical Plan'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};