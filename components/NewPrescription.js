'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Save, X, FileText, Search } from 'lucide-react';
import { storage } from '../utils/storage';
import { generatePDF } from '../utils/pdfGenerator';
import { sendWhatsApp, generateWhatsAppMessage } from '../utils/whatsapp';
import { formatDate, getTodayString } from '../utils/dateUtils';
import { MEDICAL_CONDITIONS, SEVERITY_OPTIONS, DURATION_OPTIONS, MEDICATION_TIMING, FREQUENCY_OPTIONS } from '../lib/constants';
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

  // Prescription templates state
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');

  useEffect(() => {
    if (selectedPatient) {
      const prescriptions = storage.getPrescriptionsByPatient(selectedPatient.id);
      if (prescriptions.length > 0) {
        setPreviousPrescription(prescriptions[prescriptions.length - 1]);
      }
    }
  }, [selectedPatient]);

  useEffect(() => {
    loadTemplates();
  }, []);

  // Focus on custom input when it becomes visible
  useEffect(() => {
    if (isAddingCustom && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [isAddingCustom]);

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

  const loadTemplates = () => {
    const savedTemplates = storage.getTemplates();
    setTemplates(savedTemplates);
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    template.description.toLowerCase().includes(templateSearch.toLowerCase()) ||
    template.diagnosis.some(d => d.name.toLowerCase().includes(templateSearch.toLowerCase()))
  );

  const applyTemplate = (template) => {
    // Apply template data to current prescription

    // Apply symptoms with proper structure
    if (template.symptoms && template.symptoms.length > 0) {
      setSymptoms(template.symptoms.map(symptom => ({
        ...symptom,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      })));
    }

    // Apply diagnosis with proper structure
    if (template.diagnosis && template.diagnosis.length > 0) {
      setDiagnoses(template.diagnosis.map(diagnosis => ({
        ...diagnosis,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      })));
    }

    // Apply medications with proper structure
    if (template.medications && template.medications.length > 0) {
      setMedications(template.medications.map(medication => ({
        ...medication,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      })));
    }

    // Apply lab results with proper structure
    if (template.labResults && template.labResults.length > 0) {
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
      patientId: selectedPatient.id,
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
    <div className="space-y-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      {/* Enhanced Header */}
      <div className="bg-white shadow-lg border-grafy-200 sticky top-0 z-40 rounded-b-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">New Prescription</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSavePrescription}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Save className="w-4 h-4" />
                <span className="font-medium">Save & Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Patient Selection */}
        {!selectedPatient && (
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Select Patient</h2>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
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
                    className="w-full p-4 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg bg-white shadow-sm hover:shadow-md appearance-none"
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
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-4 rounded-xl flex items-center space-x-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Patient</span>
                </button>
              </div>

              {isNewPatient && (
                <div className="grid grid-cols-2 gap-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 animate-in slide-in-from-top duration-300">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Name *</label>
                    <input
                      type="text"
                      value={newPatientData.name}
                      onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Age *</label>
                    <input
                      type="number"
                      value={newPatientData.age}
                      onChange={(e) => setNewPatientData({ ...newPatientData, age: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Gender</label>
                    <select
                      value={newPatientData.gender}
                      onChange={(e) => setNewPatientData({ ...newPatientData, gender: e.target.value })}
                      className="input-field"
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
                      className="input-field"
                    />
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={handleCreateNewPatient}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
          <div className="space-y-8">
            {/* Patient Info */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Patient Information</h2>
              <div className="grid grid-cols-4 gap-6 text-sm">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <span className="font-semibold text-gray-700 block mb-1">Name</span>
                  <span className="text-gray-900 font-medium">{selectedPatient.name}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <span className="font-semibold text-gray-700 block mb-1">ID</span>
                  <span className="text-gray-900 font-medium">{selectedPatient.id}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <span className="font-semibold text-gray-700 block mb-1">Age</span>
                  <span className="text-gray-900 font-medium">{selectedPatient.age} years</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <span className="font-semibold text-gray-700 block mb-1">Phone</span>
                  <span className="text-gray-900 font-medium">{selectedPatient.phone}</span>
                </div>
              </div>
            </div>

            {/* Previous Visit Reference */}
            {previousPrescription && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-8 rounded-2xl border-2 border-blue-200 shadow-lg">
                <h3 className="text-xl font-bold text-blue-900 mb-6">Previous Visit Reference</h3>
                <div className="grid grid-cols-3 gap-6 text-sm">
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

            {/* Prescription Templates Section */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Prescription Templates</h3>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-xl flex items-center space-x-2 text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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

                  {/* Templates Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
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
                            {template.diagnosis.length > 0 && (
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
                              {template.medications.length} medications • {template.symptoms.length} symptoms
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

            {/* Enhanced Medical History */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Medical History</h3>
              <div className="flex flex-wrap gap-3">
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
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
              <div className="space-y-6">
                <PillSelector
                  title="Select Symptoms"
                  items={[...PREDEFINED_SYMPTOMS, ...storage.getCustomSymptoms()]}
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
                  onAddCustom={(symptom) => {
                    storage.addCustomSymptom(symptom);
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
                    <h4 className="text-lg font-semibold text-gray-800">Selected Symptoms</h4>
                    {symptoms.map((symptom) => (
                      <div key={symptom.id} className="grid grid-cols-4 gap-4 items-center p-4 bg-gray-50 rounded-xl">
                        <div className="font-medium text-gray-900">{symptom.name}</div>
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

            {/* Diagnosis */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
              <div className="space-y-6">
                <PillSelector
                  title="Select Diagnosis"
                  items={[...PREDEFINED_DIAGNOSES, ...storage.getCustomDiagnoses()]}
                  onSelect={(diagnosis) => {
                    const newDiagnosis = {
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      name: diagnosis,
                      description: ''
                    };
                    setDiagnoses([...diagnoses, newDiagnosis]);
                  }}
                  searchPlaceholder="Search diagnoses..."
                  onAddCustom={(diagnosis) => {
                    storage.addCustomDiagnosis(diagnosis);
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
                    <h4 className="text-lg font-semibold text-gray-800">Selected Diagnoses</h4>
                    {diagnoses.map((diagnosis) => (
                      <div key={diagnosis.id} className="grid grid-cols-3 gap-4 items-center p-4 bg-gray-50 rounded-xl">
                        <div className="font-medium text-gray-900">{diagnosis.name}</div>
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={diagnosis.description}
                          onChange={(e) => updateDiagnosis(diagnosis.id, 'description', e.target.value)}
                          className="input-field"
                        />
                        <button
                          onClick={() => removeDiagnosis(diagnosis.id)}
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

            {/* Medications */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
              <div className="space-y-6">
                <MedicationSelector
                  onSelect={(medication) => {
                    const newMedication = {
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      name: medication,
                      dosage: '',
                      timing: 'after_meal',
                      frequency: '',
                      duration: ''
                    };
                    setMedications([...medications, newMedication]);
                  }}
                  onAddCustom={(medication) => {
                    storage.addCustomMedication(medication);
                    const newMedication = {
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      name: medication,
                      dosage: '',
                      timing: 'after_meal',
                      frequency: '',
                      duration: ''
                    };
                    setMedications([...medications, newMedication]);
                  }}
                />

                {/* Selected medications with details */}
                {medications.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">Selected Medications</h4>
                    {medications.map((medication) => (
                      <div key={medication.id} className="grid grid-cols-6 gap-4 items-center p-4 bg-gray-50 rounded-xl">
                        <div className="font-medium text-gray-900">{medication.name}</div>
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

            {/* Lab Results */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
              <div className="space-y-6">
                <PillSelector
                  title="Select Lab Tests"
                  items={[...PREDEFINED_LAB_TESTS, ...storage.getCustomLabTests()]}
                  onSelect={(labTest) => {
                    const newLabResult = {
                      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                      testName: labTest
                    };
                    setLabResults([...labResults, newLabResult]);
                  }}
                  searchPlaceholder="Search lab tests..."
                  onAddCustom={(labTest) => {
                    storage.addCustomLabTest(labTest);
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
                  className="input-field"
                />
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Consultation Fee</h3>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-600 font-medium text-lg">₹</span>
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
    </div>
  );
}