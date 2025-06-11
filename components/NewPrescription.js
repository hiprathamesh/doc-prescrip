'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Save, X, FileText, Search, RotateCw } from 'lucide-react';
import { storage } from '../utils/storage';
import { generatePDF } from '../utils/pdfGenerator';
import { sendWhatsApp, generateWhatsAppMessage } from '../utils/whatsapp';
import { formatDate, getTodayString } from '../utils/dateUtils';
import { MEDICAL_CONDITIONS, SEVERITY_OPTIONS, DURATION_OPTIONS, MEDICATION_TIMING, MEDICATION_DURATION_OPTIONS } from '../lib/constants';
import PillSelector from './PillSelector';
import MedicationSelector from './MedicationSelector';
import { PREDEFINED_SYMPTOMS, PREDEFINED_DIAGNOSES, PREDEFINED_LAB_TESTS } from '../lib/medicalData';

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

  // Enhanced medical history state
  const [selectedMedicalHistory, setSelectedMedicalHistory] = useState(new Set());
  const [customMedicalHistory, setCustomMedicalHistory] = useState([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const customInputRef = useRef(null);

  // Enhanced doctor notes and advice state
  const [doctorNotesList, setDoctorNotesList] = useState([]);
  const [adviceList, setAdviceList] = useState([]);
  const [doctorNotesInput, setDoctorNotesInput] = useState('');
  const [adviceInput, setAdviceInput] = useState('');

  const [followUpDate, setFollowUpDate] = useState('');
  const [consultationFee, setConsultationFee] = useState('500');

  // Previous prescription for reference
  const [previousPrescription, setPreviousPrescription] = useState(null);

  // Initialize templates as empty array to prevent filter error
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');

  // Initialize custom data
  const [customSymptoms, setCustomSymptoms] = useState([]);
  const [customDiagnoses, setCustomDiagnoses] = useState([]);
  const [customLabTests, setCustomLabTests] = useState([]);
  const [customMedications, setCustomMedications] = useState([]);
  const [isLoadingCustomData, setIsLoadingCustomData] = useState(true);

  useEffect(() => {
    if (selectedPatient) {
      const prescriptions = storage.getPrescriptionsByPatient(selectedPatient.id);
      if (prescriptions.length > 0) {
        setPreviousPrescription(prescriptions[prescriptions.length - 1]);
      }
    }
  }, [selectedPatient]);

  // Add this useEffect to load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  // Focus on custom input when it becomes visible
  useEffect(() => {
    if (isAddingCustom && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [isAddingCustom]);

  // Load custom data on mount
  useEffect(() => {
    loadCustomData();
  }, []);

  const generatePatientId = () => {
    const prefix = 'P';
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  };

  const handleCreateNewPatient = async () => {
    if (!newPatientData.name || !newPatientData.age || !newPatientData.phone) {
      alert('Please fill all required fields for new patient');
      return;
    }

    try {
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
      const success = await storage.savePatients(updatedPatients);
      
      if (success) {
        onPatientUpdate(updatedPatients);
        setSelectedPatient(newPatient);
        setIsNewPatient(false);
      } else {
        alert('Failed to create patient. Please try again.');
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      alert('Failed to create patient. Please try again.');
    }
  };

  const loadTemplates = async () => {
    try {
      const savedTemplates = await storage.getTemplates();
      setTemplates(Array.isArray(savedTemplates) ? savedTemplates : []);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
  };

  // Fix the filter function with better safety checks
  const filteredTemplates = (templates || []).filter(template => {
    if (!template) return false;
    
    const nameMatch = template.name?.toLowerCase().includes(templateSearch.toLowerCase());
    const descMatch = template.description?.toLowerCase().includes(templateSearch.toLowerCase());
    const diagMatch = (template.diagnosis || []).some(d => 
      d?.name?.toLowerCase().includes(templateSearch.toLowerCase())
    );
    
    return nameMatch || descMatch || diagMatch;
  });

  const applyTemplate = (template) => {
    if (!template) return;

    // Apply symptoms with proper structure
    if (template.symptoms && Array.isArray(template.symptoms) && template.symptoms.length > 0) {
      setSymptoms(template.symptoms.map(symptom => ({
        ...symptom,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      })));
    }

    // Apply diagnosis with proper structure
    if (template.diagnosis && Array.isArray(template.diagnosis) && template.diagnosis.length > 0) {
      setDiagnoses(template.diagnosis.map(diagnosis => ({
        ...diagnosis,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      })));
    }

    // Apply medications with proper structure
    if (template.medications && Array.isArray(template.medications) && template.medications.length > 0) {
      setMedications(template.medications.map(medication => ({
        ...medication,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      })));
    }

    // Apply lab results with proper structure
    if (template.labResults && Array.isArray(template.labResults) && template.labResults.length > 0) {
      setLabResults(template.labResults.map(labResult => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        testName: labResult.testName || labResult.name || labResult
      })));
    }

    // Convert template notes to list format
    if (template.doctorNotes && template.doctorNotes.trim()) {
      const notes = template.doctorNotes.split('\n').filter(note => note.trim()).map(note => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        text: note.trim()
      }));
      setDoctorNotesList(notes);
    }

    // Convert template advice to list format
    if (template.advice && template.advice.trim()) {
      const advice = template.advice.split('\n').filter(a => a.trim()).map(a => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        text: a.trim()
      }));
      setAdviceList(advice);
    }

    setShowTemplates(false);
    setTemplateSearch('');

    // Show success message
    alert(`Template "${template.name}" applied successfully!`);
  };

  // Medical History Functions
  const toggleMedicalCondition = (condition) => {
    const newSelected = new Set(selectedMedicalHistory);
    if (newSelected.has(condition)) {
      newSelected.delete(condition);
    } else {
      newSelected.add(condition);
    }
    setSelectedMedicalHistory(newSelected);
  };

  const handleCustomMedicalHistoryAdd = () => {
    if (customInput.trim()) {
      const newCondition = customInput.trim();
      setCustomMedicalHistory([...customMedicalHistory, newCondition]);
      setSelectedMedicalHistory(new Set([...selectedMedicalHistory, newCondition]));
      setCustomInput('');
      setIsAddingCustom(false);
    }
  };

  const handleCustomInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomMedicalHistoryAdd();
    } else if (e.key === 'Escape') {
      setCustomInput('');
      setIsAddingCustom(false);
    }
  };

  const removeCustomCondition = (condition) => {
    setCustomMedicalHistory(customMedicalHistory.filter(c => c !== condition));
    const newSelected = new Set(selectedMedicalHistory);
    newSelected.delete(condition);
    setSelectedMedicalHistory(newSelected);
  };

  // Doctor Notes and Advice Functions
  const addDoctorNote = () => {
    if (doctorNotesInput.trim()) {
      const newNote = {
        id: Date.now().toString(),
        text: doctorNotesInput.trim()
      };
      setDoctorNotesList([...doctorNotesList, newNote]);
      setDoctorNotesInput('');
    }
  };

  const removeDoctorNote = (id) => {
    setDoctorNotesList(doctorNotesList.filter(note => note.id !== id));
  };

  const addAdvice = () => {
    if (adviceInput.trim()) {
      const newAdvice = {
        id: Date.now().toString(),
        text: adviceInput.trim()
      };
      setAdviceList([...adviceList, newAdvice]);
      setAdviceInput('');
    }
  };

  const removeAdvice = (id) => {
    setAdviceList(adviceList.filter(advice => advice.id !== id));
  };

  const handleDoctorNotesKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDoctorNote();
    }
  };

  const handleAdviceKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAdvice();
    }
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
      timing: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      },
      dosage: '',
      mealTiming: 'after_meal',
      duration: '',
      remarks: ''
    };
    setMedications([...medications, newMedication]);
  };

  const updateMedication = (id, field, value) => {
    setMedications(medications.map(m => {
      if (m.id === id) {
        if (field.startsWith('timing.')) {
          const timingField = field.split('.')[1];
          return {
            ...m,
            timing: {
              ...m.timing,
              [timingField]: value
            }
          };
        }
        return { ...m, [field]: value };
      }
      return m;
    }));
  };

  const removeMedication = (id) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  // Lab Results functions
  const addLabResult = () => {
    const newLabResult = {
      id: Date.now().toString(),
      testName: ''
    };
    setLabResults([...labResults, newLabResult]);
  };

  const updateLabResult = (id, field, value) => {
    setLabResults(labResults.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeLabResult = (id) => {
    setLabResults(labResults.filter(l => l.id !== id));
  };

  const toggleNewPatient = () => {
    setIsNewPatient(!isNewPatient);
  }

  const handleSavePrescription = async () => {
    if (!selectedPatient) {
      alert('Please select a patient');
      return;
    }

    try {
      // Convert medical history to the expected format
      const medicalHistoryObj = {
        alcoholConsumption: selectedMedicalHistory.has('Alcohol Consumption'),
        smoking: selectedMedicalHistory.has('Smoking'),
        kidneyStone: selectedMedicalHistory.has('Kidney Stone'),
        diabetes: selectedMedicalHistory.has('Diabetes'),
        hypertension: selectedMedicalHistory.has('Hypertension'),
        heartDisease: selectedMedicalHistory.has('Heart Disease'),
        allergies: [],
        otherConditions: Array.from(selectedMedicalHistory).filter(condition =>
          !MEDICAL_CONDITIONS.includes(condition)
        )
      };

      const prescription = {
        id: Date.now().toString(),
        // Ensure patientId is always stored as string
        patientId: selectedPatient.id?.toString(),
        visitDate: new Date(),
        symptoms,
        diagnosis: diagnoses,
        medications,
        labResults,
        medicalHistory: medicalHistoryObj,
        doctorNotes: doctorNotesList.map(note => note.text).join('\n'),
        advice: adviceList.map(advice => advice.text).join('\n'),
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        createdAt: new Date()
      };

      // Save prescription
      const prescriptions = await storage.getPrescriptions();
      const updatedPrescriptions = [...prescriptions, prescription];
      const prescriptionSaved = await storage.savePrescriptions(updatedPrescriptions);

      if (!prescriptionSaved) {
        throw new Error('Failed to save prescription');
      }

      // Create bill if consultation fee is provided
      if (consultationFee && parseFloat(consultationFee) > 0) {
        const bill = {
          id: Date.now().toString() + '_bill',
          // Ensure patientId is always stored as string
          patientId: selectedPatient.id?.toString(),
          prescriptionId: prescription.id,
          amount: parseFloat(consultationFee),
          description: `Consultation - ${formatDate(new Date())}`,
          isPaid: false,
          createdAt: new Date()
        };

        const bills = await storage.getBills();
        const updatedBills = [...bills, bill];
        await storage.saveBills(updatedBills);
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
      await storage.savePatients(updatedPatients);
      onPatientUpdate(updatedPatients);

      // Generate and send PDF
      try {
        await generatePDF(prescription, selectedPatient);

        // Send WhatsApp message
        const message = generateWhatsAppMessage(selectedPatient.name, formatDate(new Date()));
        sendWhatsApp(selectedPatient.phone, message);

        alert('Prescription saved and sent successfully!');
        onBack();
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
        alert('Prescription saved successfully, but failed to generate PDF. Please try again.');
        onBack();
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
      alert('Failed to save prescription. Please try again.');
    }
  };

  // Load custom data from storage
  const loadCustomData = async () => {
    try {
      setIsLoadingCustomData(true);
      const [symptoms, diagnoses, labTests, medications] = await Promise.all([
        storage.getCustomSymptoms(),
        storage.getCustomDiagnoses(), 
        storage.getCustomLabTests(),
        storage.getCustomMedications()
      ]);
      
      setCustomSymptoms(symptoms || []);
      setCustomDiagnoses(diagnoses || []);
      setCustomLabTests(labTests || []);
      setCustomMedications(medications || []);
    } catch (error) {
      console.error('Error loading custom data:', error);
      // Set fallback empty arrays
      setCustomSymptoms([]);
      setCustomDiagnoses([]);
      setCustomLabTests([]);
      setCustomMedications([]);
    } finally {
      setIsLoadingCustomData(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      {/* Enhanced Header */}
      <div className="bg-white shadow-lg border-gray-200 sticky top-0 z-40 rounded-b-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">New Prescription</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSavePrescription}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Save className="w-4 h-4" />
                <span className="font-medium">Save & Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Patient Selection */}
        {!selectedPatient && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Select Patient</h2>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value === 'new') {
                        setIsNewPatient(true);
                      } else {
                        const patient = patients.find(p => p.id === e.target.value);
                        setSelectedPatient(patient || null);
                      }
                    }}
                    className="w-full p-4 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base sm:text-lg bg-white shadow-sm hover:shadow-md appearance-none"
                  >
                    <option value="">Select patient...</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} ({patient.id}) - {patient.phone}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={() => toggleNewPatient()}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-4 rounded-xl flex items-center justify-center space-x-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Patient</span>
                </button>
              </div>

              {isNewPatient && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 animate-in slide-in-from-top duration-300">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Name *</label>
                    <input
                      type="text"
                      value={newPatientData.name}
                      onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Age *</label>
                    <input
                      type="number"
                      value={newPatientData.age}
                      onChange={(e) => setNewPatientData({ ...newPatientData, age: e.target.value })}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Gender</label>
                    <select
                      value={newPatientData.gender}
                      onChange={(e) => setNewPatientData({ ...newPatientData, gender: e.target.value })}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Phone *</label>
                    <input
                      type="tel"
                      value={newPatientData.phone}
                      onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <button
                      onClick={handleCreateNewPatient}
                      className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
          <div className="space-y-6 sm:space-y-8">
            {/* Patient Info */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Patient Information</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-sm">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-xl">
                  <span className="font-semibold text-gray-700 block mb-1">Name</span>
                  <span className="text-gray-900 font-medium">{selectedPatient.name}</span>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-xl">
                  <span className="font-semibold text-gray-700 block mb-1">ID</span>
                  <span className="text-gray-900 font-medium">{selectedPatient.id}</span>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-xl">
                  <span className="font-semibold text-gray-700 block mb-1">Age</span>
                  <span className="text-gray-900 font-medium">{selectedPatient.age} years</span>
                </div>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-xl">
                  <span className="font-semibold text-gray-700 block mb-1">Phone</span>
                  <span className="text-gray-900 font-medium">{selectedPatient.phone}</span>
                </div>
              </div>
            </div>

            {/* Previous Visit Reference - responsive */}
            {previousPrescription && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 sm:p-8 rounded-2xl border-2 border-blue-200 shadow-lg">
                <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-6">Previous Visit Reference</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h4 className="font-semibold text-blue-800 mb-3">Medications</h4>
                    <ul className="space-y-2">
                      {previousPrescription.medications.map(med => (
                        <li key={med.id} className="text-blue-700 bg-blue-50 p-2 rounded-lg">
                          {med.name} - {med.dosage}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h4 className="font-semibold text-blue-800 mb-3">Diagnosis</h4>
                    <ul className="space-y-2">
                      {previousPrescription.diagnosis.map(diag => (
                        <li key={diag.id} className="text-blue-700 bg-blue-50 p-2 rounded-lg">{diag.name}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h4 className="font-semibold text-blue-800 mb-3">Previous Advice</h4>
                    <p className="text-blue-700 bg-blue-50 p-3 rounded-lg">{previousPrescription.advice}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Prescription Templates Section - responsive */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Prescription Templates</h3>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-xl flex items-center justify-center space-x-2 text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>{showTemplates ? 'Hide Templates' : 'Browse Templates'}</span>
                </button>
              </div>

              {showTemplates && (
                <div className="space-y-4 animate-in slide-in-from-top duration-300">
                  {/* Template Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    />
                  </div>

                  {/* Templates Grid - responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {filteredTemplates.length > 0 ? (
                      filteredTemplates.map((template) => (
                        <div
                          key={template.id}
                          onClick={() => applyTemplate(template)}
                          className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 cursor-pointer group"
                        >
                          <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-800">
                            {template.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">{template.description}</p>

                          {/* Quick preview */}
                          <div className="space-y-2">
                            {(template.diagnosis || []).length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {template.diagnosis.slice(0, 2).map((diag, index) => (
                                  <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    {diag.name}
                                  </span>
                                ))}
                                {template.diagnosis.length > 2 && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                    +{template.diagnosis.length - 2}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="text-xs text-gray-500">
                              {(template.medications || []).length} medications • {(template.symptoms || []).length} symptoms
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        <FileText className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                        <p>
                          {templateSearch ? 'No templates match your search.' : 'No templates available.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Medical History - responsive */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Medical History</h3>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {/* Predefined conditions */}
                {MEDICAL_CONDITIONS.map((condition) => (
                  <button
                    key={condition}
                    onClick={() => toggleMedicalCondition(condition)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${selectedMedicalHistory.has(condition)
                      ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      }`}
                  >
                    {condition}
                  </button>
                ))}

                {/* Custom conditions */}
                {customMedicalHistory.map((condition) => (
                  <div key={condition} className="relative group">
                    <button
                      onClick={() => toggleMedicalCondition(condition)}
                      className={`px-4 py-2 pr-8 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${selectedMedicalHistory.has(condition)
                        ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                    >
                      {condition}
                    </button>
                    <button
                      onClick={() => removeCustomCondition(condition)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3 mx-auto" />
                    </button>
                  </div>
                ))}

                {/* Add custom condition */}
                {!isAddingCustom ? (
                  <button
                    onClick={() => setIsAddingCustom(true)}
                    className="px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 border border-green-300 transition-all duration-200 transform hover:scale-105 flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Custom</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 animate-in slide-in-from-left duration-300">
                    <input
                      ref={customInputRef}
                      type="text"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      onKeyDown={handleCustomInputKeyPress}
                      placeholder="Enter condition..."
                      className="px-4 py-2 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-[150px]"
                    />
                    <button
                      onClick={handleCustomMedicalHistoryAdd}
                      className="w-8 h-8 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingCustom(false);
                        setCustomInput('');
                      }}
                      className="w-8 h-8 bg-gray-400 text-white rounded-full hover:bg-gray-500 transition-colors flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {selectedMedicalHistory.size > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Selected Conditions:</h4>
                  <div className="text-sm text-blue-700">
                    {Array.from(selectedMedicalHistory).join(', ')}
                  </div>
                </div>
              )}
            </div>

            {/* Symptoms */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
              <div className="space-y-6">
                <PillSelector
                  title="Select Symptoms"
                  items={[...PREDEFINED_SYMPTOMS, ...customSymptoms]}
                  onSelect={(symptom) => {
                    const newSymptom = {
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      name: symptom,
                      severity: 'mild',
                      duration: ''
                    };
                    setSymptoms([...symptoms, newSymptom]);
                  }}
                  searchPlaceholder="Search symptoms..."
                  onAddCustom={async (symptom) => {
                    await storage.addCustomSymptom(symptom);
                    await loadCustomData(); // Reload custom data
                    const newSymptom = {
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      name: symptom,
                      severity: 'mild',
                      duration: ''
                    };
                    setSymptoms([...symptoms, newSymptom]);
                  }}
                />

                {/* Selected symptoms with details */}
                {symptoms.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800">Selected Symptoms</h4>
                    {symptoms.map((symptom) => (
                      <div key={symptom.id} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center p-4 bg-gray-50 rounded-xl">
                        <div className="font-medium text-gray-900 sm:mb-0 mb-2">{symptom.name}</div>
                        <select
                          value={symptom.severity}
                          onChange={(e) => updateSymptom(symptom.id, 'severity', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          {SEVERITY_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        <select
                          value={symptom.duration}
                          onChange={(e) => updateSymptom(symptom.id, 'duration', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="">Select duration</option>
                          {DURATION_OPTIONS.map(duration => (
                            <option key={duration} value={duration}>{duration}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeSymptom(symptom.id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors sm:justify-self-end"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Diagnosis */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
              <div className="space-y-6">
                <PillSelector
                  title="Select Diagnosis"
                  items={[...PREDEFINED_DIAGNOSES, ...customDiagnoses]}
                  onSelect={(diagnosis) => {
                    const newDiagnosis = {
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      name: diagnosis,
                      description: ''
                    };
                    setDiagnoses([...diagnoses, newDiagnosis]);
                  }}
                  searchPlaceholder="Search diagnoses..."
                  onAddCustom={async (diagnosis) => {
                    await storage.addCustomDiagnosis(diagnosis);
                    await loadCustomData(); // Reload custom data
                    const newDiagnosis = {
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      name: diagnosis,
                      description: ''
                    };
                    setDiagnoses([...diagnoses, newDiagnosis]);
                  }}
                />

                {/* Selected diagnoses with details */}
                {diagnoses.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800">Selected Diagnoses</h4>
                    {diagnoses.map((diagnosis) => (
                      <div key={diagnosis.id} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center p-4 bg-gray-50 rounded-xl">
                        <div className="font-medium text-gray-900 sm:mb-0 mb-2">{diagnosis.name}</div>
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={diagnosis.description}
                          onChange={(e) => updateDiagnosis(diagnosis.id, 'description', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        <button
                          onClick={() => removeDiagnosis(diagnosis.id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors sm:justify-self-end"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Medications section with responsive medication details */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
              <div className="space-y-6">
                {isLoadingCustomData ? (
                  <div className="text-center py-8">
                    <RotateCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                    <p className="text-gray-500">Loading medications...</p>
                  </div>
                ) : (
                  <MedicationSelector
                    onSelect={(medication) => {
                      const newMedication = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        name: medication,
                        timing: {
                          morning: false,
                          afternoon: false,
                          evening: false,
                          night: false
                        },
                        dosage: '',
                        mealTiming: 'after_meal',
                        duration: '',
                        remarks: ''
                      };
                      setMedications([...medications, newMedication]);
                    }}
                    onAddCustom={async (medication) => {
                      await storage.addCustomMedication(medication);
                      await loadCustomData(); // Reload custom data
                      const newMedication = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        name: medication,
                        timing: {
                          morning: false,
                          afternoon: false,
                          evening: false,
                          night: false
                        },
                        dosage: '',
                        mealTiming: 'after_meal',
                        duration: '',
                        remarks: ''
                      };
                      setMedications([...medications, newMedication]);
                    }}
                  />
                )}

                {/* Selected medications with details */}
                {medications.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800">Selected Medications</h4>
                    {medications.map((medication) => (
                      <div key={medication.id} className="p-4 bg-gray-50 rounded-xl space-y-4">
                        {/* Medication name and timing - responsive */}
                        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 items-center">
                          <div className="font-medium text-gray-900 sm:mb-0 mb-2">{medication.name}</div>
                          
                          {/* Timing checkboxes - responsive */}
                          <div className="col-span-1 sm:col-span-4 flex items-center space-x-3 justify-center sm:justify-start">
                            {Object.entries(medication.timing).map(([key, value]) => (
                              <div key={key} className="flex flex-col items-center space-y-1">
                                <button
                                  type="button"
                                  onClick={() => updateMedication(medication.id, `timing.${key}`, !value)}
                                  className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                                    value
                                      ? 'border-green-300 bg-green-100'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  {value && (
                                    <div className="w-5 h-5 bg-green-500 rounded-md"></div>
                                  )}
                                </button>
                                <span className="text-xs text-gray-600 font-medium">{key.charAt(0).toUpperCase()}</span>
                              </div>
                            ))}
                          </div>
                          
                          <button
                            onClick={() => removeMedication(medication.id)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors sm:justify-self-end"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Dosage, meal timing, and duration - responsive */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                          <input
                            type="text"
                            placeholder="Dosage (e.g., 500mg)"
                            value={medication.dosage}
                            onChange={(e) => updateMedication(medication.id, 'dosage', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                          <select
                            value={medication.mealTiming}
                            onChange={(e) => updateMedication(medication.id, 'mealTiming', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            {MEDICATION_TIMING.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          <select
                            value={medication.duration}
                            onChange={(e) => updateMedication(medication.id, 'duration', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            <option value="">Select duration</option>
                            {MEDICATION_DURATION_OPTIONS.map(duration => (
                              <option key={duration} value={duration}>{duration}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Remarks"
                            value={medication.remarks}
                            onChange={(e) => updateMedication(medication.id, 'remarks', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Lab Results */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
              <div className="space-y-6">
                <PillSelector
                  title="Select Lab Tests"
                  items={[...PREDEFINED_LAB_TESTS, ...customLabTests]}
                  onSelect={(labTest) => {
                    const newLabResult = {
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      testName: labTest
                    };
                    setLabResults([...labResults, newLabResult]);
                  }}
                  searchPlaceholder="Search lab tests..."
                  onAddCustom={async (labTest) => {
                    await storage.addCustomLabTest(labTest);
                    await loadCustomData(); // Reload custom data
                    const newLabResult = {
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      testName: labTest
                    };
                    setLabResults([...labResults, newLabResult]);
                  }}
                />

                {/* Selected lab results */}
                {labResults.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Selected Lab Tests</h4>
                    {labResults.map((lab) => (
                      <div key={lab.id} className="grid grid-cols-2 gap-4 items-center p-4 bg-gray-50 rounded-xl">
                        <div className="font-medium text-gray-900">{lab.testName}</div>
                        <button
                          onClick={() => removeLabResult(lab.id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors justify-self-end"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Doctor Notes and Advice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Doctor's Notes</h3>

                {/* Input field */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={doctorNotesInput}
                    onChange={(e) => setDoctorNotesInput(e.target.value)}
                    onKeyDown={handleDoctorNotesKeyPress}
                    placeholder="Add a note and press Enter..."
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  />
                </div>

                {/* Notes list */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {doctorNotesList.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No notes added yet</p>
                      <p className="text-xs text-gray-400">Type a note and press Enter to add</p>
                    </div>
                  ) : (
                    doctorNotesList.map((note) => (
                      <div key={note.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors border border-gray-200">
                        <p className="text-sm text-gray-800 flex-1 mr-3 leading-relaxed">{note.text}</p>
                        <button
                          onClick={() => removeDoctorNote(note.id)}
                          className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Advice to Patient</h3>

                {/* Input field */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={adviceInput}
                    onChange={(e) => setAdviceInput(e.target.value)}
                    onKeyDown={handleAdviceKeyPress}
                    placeholder="Add advice and press Enter..."
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  />
                </div>

                {/* Advice list */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {adviceList.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No advice added yet</p>
                      <p className="text-xs text-gray-400">Type advice and press Enter to add</p>
                    </div>
                  ) : (
                    adviceList.map((advice) => (
                      <div key={advice.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors border border-gray-200">
                        <p className="text-sm text-gray-800 flex-1 mr-3 leading-relaxed">{advice.text}</p>
                        <button
                          onClick={() => removeAdvice(advice.id)}
                          className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Follow-up and Consultation Fee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Follow-up Date</h3>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  min={getTodayString()}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Consultation Fee</h3>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-600 font-medium text-lg">₹</span>
                  <input
                    type="number"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    placeholder="500"
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}