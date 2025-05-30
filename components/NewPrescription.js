'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { storage } from '../utils/storage';
import { generatePDF } from '../utils/pdfGenerator';
import { sendWhatsApp, generateWhatsAppMessage } from '../utils/whatsapp';
import { formatDate, getTodayString } from '../utils/dateUtils';
import { MEDICAL_CONDITIONS, SEVERITY_OPTIONS, DURATION_OPTIONS, MEDICATION_TIMING, FREQUENCY_OPTIONS } from '../lib/constants';

export default function NewPrescription({ patient, patients, onBack, onPatientUpdate }) {
  const [selectedPatient, setSelectedPatient] = useState(patient);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    gender: 'male',
    age: '',
    phone: ''
  });

  // Prescription form state
  const [symptoms, setSymptoms] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [medications, setMedications] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState({
    alcoholConsumption: false,
    smoking: false,
    kidneyStone: false,
    diabetes: false,
    hypertension: false,
    heartDisease: false,
    allergies: [],
    otherConditions: []
  });
  const [doctorNotes, setDoctorNotes] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [consultationFee, setConsultationFee] = useState('500');

  // Previous prescription for reference
  const [previousPrescription, setPreviousPrescription] = useState(null);

  useEffect(() => {
    if (selectedPatient) {
      const prescriptions = storage.getPrescriptionsByPatient(selectedPatient.id);
      if (prescriptions.length > 0) {
        setPreviousPrescription(prescriptions[prescriptions.length - 1]);
      }
    }
  }, [selectedPatient]);

  const generatePatientId = () => {
    const prefix = 'P';
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  };

  const handleCreateNewPatient = () => {
    if (!newPatientData.name || !newPatientData.age || !newPatientData.phone) {
      alert('Please fill all required fields for new patient');
      return;
    }

    const newPatient = {
      id: generatePatientId(),
      name: newPatientData.name,
      gender: newPatientData.gender,
      age: parseInt(newPatientData.age),
      phone: newPatientData.phone,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedPatients = [...patients, newPatient];
    storage.savePatients(updatedPatients);
    onPatientUpdate(updatedPatients);
    setSelectedPatient(newPatient);
    setIsNewPatient(false);
  };

  // Symptoms functions
  const addSymptom = () => {
    const newSymptom = {
      id: Date.now().toString(),
      name: '',
      severity: 'mild',
      duration: ''
    };
    setSymptoms([...symptoms, newSymptom]);
  };

  const updateSymptom = (id, field, value) => {
    setSymptoms(symptoms.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSymptom = (id) => {
    setSymptoms(symptoms.filter(s => s.id !== id));
  };

  // Diagnosis functions
  const addDiagnosis = () => {
    const newDiagnosis = {
      id: Date.now().toString(),
      name: '',
      description: ''
    };
    setDiagnoses([...diagnoses, newDiagnosis]);
  };

  const updateDiagnosis = (id, field, value) => {
    setDiagnoses(diagnoses.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const removeDiagnosis = (id) => {
    setDiagnoses(diagnoses.filter(d => d.id !== id));
  };

  // Medication functions
  const addMedication = () => {
    const newMedication = {
      id: Date.now().toString(),
      name: '',
      dosage: '',
      timing: 'after_meal',
      frequency: '',
      duration: ''
    };
    setMedications([...medications, newMedication]);
  };

  const updateMedication = (id, field, value) => {
    setMedications(medications.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const removeMedication = (id) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  // Lab Results functions
  const addLabResult = () => {
    const newLabResult = {
      id: Date.now().toString(),
      testName: '',
      result: '',
      normalRange: '',
      notes: ''
    };
    setLabResults([...labResults, newLabResult]);
  };

  const updateLabResult = (id, field, value) => {
    setLabResults(labResults.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeLabResult = (id) => {
    setLabResults(labResults.filter(l => l.id !== id));
  };

  const handleSavePrescription = async () => {
    if (!selectedPatient) {
      alert('Please select a patient');
      return;
    }

    const prescription = {
      id: Date.now().toString(),
      patientId: selectedPatient.id,
      visitDate: new Date(),
      symptoms,
      diagnosis: diagnoses,
      medications,
      labResults,
      medicalHistory,
      doctorNotes,
      advice,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      createdAt: new Date()
    };

    // Save prescription
    const prescriptions = storage.getPrescriptions();
    prescriptions.push(prescription);
    storage.savePrescriptions(prescriptions);

    // Create bill if consultation fee is provided
    if (consultationFee && parseFloat(consultationFee) > 0) {
      const bill = {
        id: Date.now().toString() + '_bill',
        patientId: selectedPatient.id,
        prescriptionId: prescription.id,
        amount: parseFloat(consultationFee),
        description: `Consultation - ${formatDate(new Date())}`,
        isPaid: false,
        createdAt: new Date()
      };

      const bills = storage.getBills();
      bills.push(bill);
      storage.saveBills(bills);
    }

    // Update patient's last visited date
    const updatedPatients = patients.map(p =>
      p.id === selectedPatient.id
        ? { 
            ...p, 
            lastVisited: new Date(), 
            nextExpected: followUpDate ? new Date(followUpDate) : undefined,
            updatedAt: new Date()
          }
        : p
    );
    storage.savePatients(updatedPatients);
    onPatientUpdate(updatedPatients);

    // Generate and send PDF
    try {
      await generatePDF(prescription, selectedPatient);
      
      // Send WhatsApp message
      const message = generateWhatsAppMessage(selectedPatient.name, formatDate(new Date()));
      sendWhatsApp(selectedPatient.phone, message);
      
      alert('Prescription saved and sent successfully!');
      onBack();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Prescription saved but failed to generate PDF');
      onBack();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">New Prescription</h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleSavePrescription}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            <span>Save & Send</span>
          </button>
        </div>
      </div>

      {/* Patient Selection */}
      {!selectedPatient && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Select Patient</h2>
          <div className="space-y-4">
            <select
              onChange={(e) => {
                if (e.target.value === 'new') {
                  setIsNewPatient(true);
                } else {
                  const patient = patients.find(p => p.id === e.target.value);
                  setSelectedPatient(patient || null);
                }
              }}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select existing patient...</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({patient.id}) - {patient.phone}
                </option>
              ))}
              <option value="new">+ Add New Patient</option>
            </select>

            {isNewPatient && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newPatientData.name}
                    onChange={(e) => setNewPatientData({...newPatientData, name: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                  <input
                    type="number"
                    value={newPatientData.age}
                    onChange={(e) => setNewPatientData({...newPatientData, age: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={newPatientData.gender}
                    onChange={(e) => setNewPatientData({...newPatientData, gender: e.target.value})}
                    className="input-field"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={newPatientData.phone}
                    onChange={(e) => setNewPatientData({...newPatientData, phone: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div className="col-span-2">
                  <button
                    onClick={handleCreateNewPatient}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Create Patient
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedPatient && (
        <div className="space-y-6">
          {/* Patient Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {selectedPatient.name}
              </div>
              <div>
                <span className="font-medium">ID:</span> {selectedPatient.id}
              </div>
              <div>
                <span className="font-medium">Age:</span> {selectedPatient.age}
              </div>
              <div>
                <span className="font-medium">Phone:</span> {selectedPatient.phone}
              </div>
            </div>
          </div>

          {/* Previous Visit Reference */}
          {previousPrescription && (
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Previous Visit Reference</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Medications</h4>
                  <ul className="space-y-1">
                    {previousPrescription.medications.map(med => (
                      <li key={med.id} className="text-blue-700">
                        {med.name} - {med.dosage}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Diagnosis</h4>
                  <ul className="space-y-1">
                    {previousPrescription.diagnosis.map(diag => (
                      <li key={diag.id} className="text-blue-700">{diag.name}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Previous Advice</h4>
                  <p className="text-blue-700">{previousPrescription.advice}</p>
                </div>
              </div>
            </div>
          )}

          {/* Medical History */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Medical History</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {MEDICAL_CONDITIONS.map((condition) => {
                const key = condition.toLowerCase().replace(/\s+/g, '');
                const mappedKey = key === 'alcoholconsumption' ? 'alcoholConsumption' : 
                                 key === 'kidneystone' ? 'kidneyStone' : 
                                 key === 'heartdisease' ? 'heartDisease' : key;
                
                return (
                  <label key={condition} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={medicalHistory[mappedKey] || false}
                      onChange={(e) => setMedicalHistory({
                        ...medicalHistory,
                        [mappedKey]: e.target.checked
                      })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{condition}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Symptoms */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Symptoms</h3>
              <button
                onClick={addSymptom}
                className="bg-green-600 text-white px-3 py-1 rounded flex items-center space-x-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Symptom</span>
              </button>
            </div>
            <div className="space-y-3">
              {symptoms.map((symptom) => (
                <div key={symptom.id} className="grid grid-cols-4 gap-3 items-center">
                  <input
                    type="text"
                    placeholder="Symptom name"
                    value={symptom.name}
                    onChange={(e) => updateSymptom(symptom.id, 'name', e.target.value)}
                    className="input-field"
                  />
                  <select
                    value={symptom.severity}
                    onChange={(e) => updateSymptom(symptom.id, 'severity', e.target.value)}
                    className="input-field"
                  >
                    {SEVERITY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <select
                    value={symptom.duration}
                    onChange={(e) => updateSymptom(symptom.id, 'duration', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select duration</option>
                    {DURATION_OPTIONS.map(duration => (
                      <option key={duration} value={duration}>{duration}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeSymptom(symptom.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnosis */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Diagnosis</h3>
              <button
                onClick={addDiagnosis}
                className="bg-green-600 text-white px-3 py-1 rounded flex items-center space-x-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Diagnosis</span>
              </button>
            </div>
            <div className="space-y-3">
              {diagnoses.map((diagnosis) => (
                <div key={diagnosis.id} className="grid grid-cols-3 gap-3 items-center">
                  <input
                    type="text"
                    placeholder="Diagnosis name"
                    value={diagnosis.name}
                    onChange={(e) => updateDiagnosis(diagnosis.id, 'name', e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={diagnosis.description}
                    onChange={(e) => updateDiagnosis(diagnosis.id, 'description', e.target.value)}
                    className="input-field"
                  />
                  <button
                    onClick={() => removeDiagnosis(diagnosis.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Medications */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Medications</h3>
              <button
                onClick={addMedication}
                className="bg-green-600 text-white px-3 py-1 rounded flex items-center space-x-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Medication</span>
              </button>
            </div>
            <div className="space-y-3">
              {medications.map((medication) => (
                <div key={medication.id} className="grid grid-cols-6 gap-3 items-center">
                  <input
                    type="text"
                    placeholder="Medication name"
                    value={medication.name}
                    onChange={(e) => updateMedication(medication.id, 'name', e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Dosage"
                    value={medication.dosage}
                    onChange={(e) => updateMedication(medication.id, 'dosage', e.target.value)}
                    className="input-field"
                  />
                  <select
                    value={medication.timing}
                    onChange={(e) => updateMedication(medication.id, 'timing', e.target.value)}
                    className="input-field"
                  >
                    {MEDICATION_TIMING.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <select
                    value={medication.frequency}
                    onChange={(e) => updateMedication(medication.id, 'frequency', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Frequency</option>
                    {FREQUENCY_OPTIONS.map(freq => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Duration"
                    value={medication.duration}
                    onChange={(e) => updateMedication(medication.id, 'duration', e.target.value)}
                    className="input-field"
                  />
                  <button
                    onClick={() => removeMedication(medication.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Lab Results */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Lab Results</h3>
              <button
                onClick={addLabResult}
                className="bg-green-600 text-white px-3 py-1 rounded flex items-center space-x-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Lab Result</span>
              </button>
            </div>
            <div className="space-y-3">
              {labResults.map((lab) => (
                <div key={lab.id} className="grid grid-cols-5 gap-3 items-center">
                  <input
                    type="text"
                    placeholder="Test name"
                    value={lab.testName}
                    onChange={(e) => updateLabResult(lab.id, 'testName', e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Result"
                    value={lab.result}
                    onChange={(e) => updateLabResult(lab.id, 'result', e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Normal range"
                    value={lab.normalRange}
                    onChange={(e) => updateLabResult(lab.id, 'normalRange', e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Notes"
                    value={lab.notes}
                    onChange={(e) => updateLabResult(lab.id, 'notes', e.target.value)}
                    className="input-field"
                  />
                  <button
                    onClick={() => removeLabResult(lab.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Notes and Advice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Doctor's Notes</h3>
              <textarea
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Internal notes for reference..."
                rows={4}
                className="input-field"
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Advice to Patient</h3>
              <textarea
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                placeholder="Advice and instructions for the patient..."
                rows={4}
                className="input-field"
              />
            </div>
          </div>

          {/* Follow-up and Consultation Fee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Follow-up Date</h3>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                min={getTodayString()}
                className="input-field"
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Consultation Fee</h3>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">₹</span>
                <input
                  type="number"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  placeholder="500"
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}