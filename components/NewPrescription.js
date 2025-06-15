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
import ConfirmationDialog from './ConfirmationDialog';
import PrescriptionSuccess from './PrescriptionSuccess';
import CustomSelect from './CustomSelect';
import CustomDropdown from './CustomDropdown';
import { useToast } from '../contexts/ToastContext';

export default function NewPrescription({ patient, patients, onBack, onPatientUpdate }) {
  console.log('[NewPrescription] Component rendering/re-rendering. Selected patient:', patient ? patient.id : 'none'); // TOP-LEVEL LOG

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

  // Add new state for confirmation and success
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedPrescription, setSavedPrescription] = useState(null);
  const [savedBill, setSavedBill] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const presHeaderRef = useRef(null);
  const [isPresHeaderVisible, setIsPresHeaderVisible] = useState(true);

  // Refs for new patient form fields
  const nameRef = useRef(null);
  const ageRef = useRef(null);
  const genderRef = useRef(null);
  const phoneRef = useRef(null);

  const { addToast } = useToast();

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

  // Reset header visibility when component mounts or when returning from other views
  useEffect(() => {
    setIsPresHeaderVisible(true);
  }, [selectedPatient]);

  // Intersection Observer for pres-header visibility
  useEffect(() => {
    console.log('[IntersectionObserver Effect] Hook execution started.');

    const presHeaderElement = presHeaderRef.current;
    console.log('[IntersectionObserver Effect] presHeaderRef.current:', presHeaderElement);

    if (!presHeaderElement) {
      console.log('[IntersectionObserver Effect] presHeaderRef.current is null or undefined. Observer not set.');
      return;
    }

    if (!('IntersectionObserver' in window)) {
      console.warn('[IntersectionObserver Effect] IntersectionObserver API not available in this browser.');
      setIsPresHeaderVisible(true); // Fallback
      return;
    }

    console.log('[IntersectionObserver Effect] Setting up IntersectionObserver...');

    const rootMarginTop = "-81px"; // Adjust if your main header height is different

    const observer = new window.IntersectionObserver(
      (entries) => {
        console.log('[IntersectionObserver Callback] Fired. Entries:', entries);
        if (entries && entries.length > 0 && entries[0]) {
          const entry = entries[0];
          console.log('[IntersectionObserver Callback] entry.isIntersecting:', entry.isIntersecting, 'entry.boundingClientRect.top:', entry.boundingClientRect.top);
          setIsPresHeaderVisible(entry.isIntersecting);
        } else {
          console.warn('[IntersectionObserver Callback] Received no entries or undefined entry.');
        }
      },
      {
        root: null, // Observe intersections relative to the viewport.
        rootMargin: `${rootMarginTop} 0px 0px 0px`, // Top margin adjusted for the main header
        threshold: [0, 0.01], // Trigger when even a tiny part enters/leaves the adjusted viewport boundary.
      }
    );

    observer.observe(presHeaderElement);
    console.log('[IntersectionObserver Effect] Observer is now observing:', presHeaderElement, `with rootMarginTop: ${rootMarginTop}`);

    return () => {
      console.log('[IntersectionObserver Cleanup] Unobserving:', presHeaderElement);
      if (presHeaderElement) {
        observer.unobserve(presHeaderElement);
      }
    };
  }, []); // Empty dependency array: runs once on mount and cleans up on unmount.

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
      setCustomSymptoms([]);
      setCustomDiagnoses([]);
      setCustomLabTests([]);
      setCustomMedications([]);
    } finally {
      setIsLoadingCustomData(false);
    }
  };

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

    // Store previous state for undo functionality
    const previousState = {
      symptoms,
      diagnoses,
      medications,
      labResults,
      doctorNotesList,
      adviceList
    };

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

    // Show success toast with undo functionality
    addToast({
      title: 'Template Applied',
      description: `"${template.name}" has been applied successfully`,
      type: 'success',
      duration: 6000,
      onUndo: () => {
        // Restore previous state
        setSymptoms(previousState.symptoms);
        setDiagnoses(previousState.diagnoses);
        setMedications(previousState.medications);
        setLabResults(previousState.labResults);
        setDoctorNotesList(previousState.doctorNotesList);
        setAdviceList(previousState.adviceList);
        
        // Show undo confirmation
        addToast({
          title: 'Template Undone',
          description: `"${template.name}" has been removed`,
          type: 'info',
          duration: 3000
        });
      }
    });
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
      testName: '',
      remarks: ''
    };
    setLabResults([...labResults, newLabResult]);
  };

  const updateLabResult = (id, field, value) => {
    setLabResults(labResults.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeLabResult = (id) => {
    setLabResults(labResults.filter(l => l.id !== id));
  };

  const [isAnimating, setIsAnimating] = useState(false);

  const toggleNewPatient = () => {
    if (isNewPatient) {
      // When closing, animate first then hide
      setIsAnimating(true);
      setTimeout(() => {
        setIsNewPatient(false);
        setIsAnimating(false);
        // Reset form data when closing
        setNewPatientData({
          name: '',
          gender: 'male',
          age: '',
          phone: ''
        });
      }, 300); // Match the animation duration
    } else {
      // When opening, show first then animate
      setIsNewPatient(true);
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
      }, 50); // Small delay to ensure DOM is ready
    }
  }

  const handleSavePrescription = async () => {
    if (!selectedPatient) {
      alert('Please select a patient');
      return;
    }

    // Show confirmation dialog instead of direct save
    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
    setIsProcessing(true);

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

      // Get existing prescriptions for this patient to check for pending follow-ups
      const existingPrescriptions = await storage.getPrescriptionsByPatient(selectedPatient.id);

      // Find the most recent prescription with a pending follow-up
      let completedFollowUpPrescription = null;
      if (existingPrescriptions.length > 0) {
        // Sort by visit date (most recent first)
        const sortedPrescriptions = existingPrescriptions.sort((a, b) =>
          new Date(b.visitDate) - new Date(a.visitDate)
        );

        // Find the most recent prescription with a pending follow-up
        completedFollowUpPrescription = sortedPrescriptions.find(p =>
          p.followUpDate &&
          (!p.followUpStatus || p.followUpStatus === 'pending' || p.followUpStatus === 'overdue')
        );
      }

      const prescription = {
        id: Date.now().toString(),
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
        followUpStatus: followUpDate ? 'pending' : undefined,
        isFollowUpVisit: !!completedFollowUpPrescription, // Mark this visit as a follow-up if there was a pending one
        completedFollowUpFor: completedFollowUpPrescription?.id, // Reference to the prescription this visit completes
        createdAt: new Date()
      };

      // Generate prescription PDF immediately
      const prescriptionBlob = await generatePDF(prescription, selectedPatient, false);
      const prescriptionUrl = URL.createObjectURL(prescriptionBlob);

      let bill = null;
      let billBlob = null;
      let billUrl = null;

      // Create bill if consultation fee is provided
      if (consultationFee && parseFloat(consultationFee) > 0) {
        bill = {
          id: Date.now().toString() + '_bill',
          patientId: selectedPatient.id?.toString(),
          prescriptionId: prescription.id,
          amount: parseFloat(consultationFee),
          description: `Consultation - ${formatDate(new Date())}`,
          isPaid: false,
          createdAt: new Date()
        };

        // Generate bill PDF
        const { generateBillPDF } = await import('../utils/billGenerator');
        billBlob = await generateBillPDF(bill, selectedPatient);
        billUrl = URL.createObjectURL(billBlob);
      }

      // Add PDF URLs to the objects for storage
      prescription.pdfUrl = prescriptionUrl;
      if (bill) {
        bill.pdfUrl = billUrl;
      }

      // If this visit completes a follow-up, update the previous prescription
      if (completedFollowUpPrescription) {
        const allPrescriptions = await storage.getPrescriptions();
        const updatedPrescriptions = allPrescriptions.map(p => {
          if (p.id === completedFollowUpPrescription.id) {
            return {
              ...p,
              followUpStatus: 'completed',
              followUpCompletedDate: new Date(),
              followUpCompletedBy: prescription.id
            };
          }
          return p;
        });
        await storage.savePrescriptions(updatedPrescriptions);
      }

      // Save prescription with PDF URL
      const savedPrescriptionData = await storage.savePrescription(prescription);
      if (!savedPrescriptionData) {
        throw new Error('Failed to save prescription');
      }

      // Save bill with PDF URL if exists
      if (bill) {
        const bills = await storage.getBills();
        const updatedBills = [...bills, bill];
        await storage.saveBills(updatedBills);
      }

      // Update patient's information with follow-up status
      const today = new Date();
      let patientFollowUpStatus = 'none';
      let nextExpectedDate = null;

      if (prescription.followUpDate) {
        const followUpDate = new Date(prescription.followUpDate);
        patientFollowUpStatus = followUpDate < today ? 'overdue' : 'pending';
        nextExpectedDate = followUpDate;
      }

      // Update patient's last visited date and follow-up status
      const updatedPatients = patients.map(p =>
        p.id === selectedPatient.id
          ? {
            ...p,
            lastVisited: new Date(),
            nextExpected: nextExpectedDate,
            followUpStatus: patientFollowUpStatus,
            updatedAt: new Date()
          }
          : p
      );
      await storage.savePatients(updatedPatients);
      onPatientUpdate(updatedPatients);

      // Set data for success page with current bill state
      setSavedPrescription({
        ...prescription,
        pdfUrl: prescriptionUrl
      });
      setSavedBill(bill ? { ...bill } : null);

      // Close confirmation and show success
      setShowConfirmation(false);
      setShowSuccess(true);

    } catch (error) {
      console.error('Error saving prescription:', error);
      alert('Failed to save prescription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSave = () => {
    if (!isProcessing) {
      setShowConfirmation(false);
    }
  };

  const handleBackFromSuccess = () => {
    setShowSuccess(false);
    onBack();
  };

  // Show success page if prescription was saved
  if (showSuccess && savedPrescription) {
    return (
      <PrescriptionSuccess
        prescription={savedPrescription}
        patient={selectedPatient}
        bill={savedBill}
        onBack={handleBackFromSuccess}
      />
    );
  }

  // Handle Enter key press for form navigation
  const handleKeyPress = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      }
    }
  };

  // Handle last field Enter press
  const handleLastFieldKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateNewPatient();
    }
  };

  // Handle gender dropdown Enter press
  const handleGenderEnterPress = () => {
    if (phoneRef.current) {
      phoneRef.current.focus();
    }
  };

  return (
    <>
      {/* Floating header */}
      <div
        className={`fixed left-0 right-0 z-30 transition-transform duration-300 ease-in-out
          ${isPresHeaderVisible ? '-translate-y-full' : 'translate-y-0'}
        `}
        style={{ top: '81px' }}
      >
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-md font-semibold text-gray-900">New Prescription</span>
              </div>
              <button
                onClick={handleSavePrescription}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors duration-200"
              >
                <Save className="w-4 h-4" />
                <span>Save & Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 min-h-screen">
        {/* Enhanced Header */}
        <div ref={presHeaderRef} className="pres-header">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-xl font-semibold text-gray-900">New Prescription</span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSavePrescription}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 font-medium"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 space-y-6">
          {/* Patient Selection */}
          {!selectedPatient && (
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Select Patient</h2>
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                  <div className="flex-1 relative">
                    <CustomSelect
                      options={patients.map(p => ({ value: p.id, label: `${p.name} (${p.id}) - ${p.phone}` }))}
                      value={selectedPatient?.id || ''}
                      onChange={(patientId) => {
                        if (patientId === 'new') {
                          setIsNewPatient(true);
                          setSelectedPatient(null);
                        } else {
                          const patient = patients.find(p => p.id === patientId);
                          setSelectedPatient(patient || null);
                          setIsNewPatient(false);
                        }
                      }}
                      placeholder="Select or search patient..."
                      onAddNew={() => setIsNewPatient(true)}
                    />
                  </div>
                  <button
                    onClick={toggleNewPatient}
                    className={`w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg flex items-center justify-center space-x-2 font-medium transition-all duration-200 ${isNewPatient ? 'bg-gray-600 hover:bg-gray-700' : ''
                      }`}
                  >
                    <Plus className={`w-5 h-5 transition-transform duration-300 ease-out ${isNewPatient ? 'rotate-45' : 'rotate-0'
                      }`} />
                    <span>{isNewPatient ? 'Cancel' : 'Add Patient'}</span>
                  </button>
                </div>

                {/* Animated patient creation form */}
                <div className={`transition-all duration-300 ease-out ${isNewPatient
                  ? 'max-h-96 opacity-100 transform translate-y-0'
                  : 'max-h-0 opacity-0 transform -translate-y-4'
                  }`}>
                  <div className={`transition-all duration-300 ease-out delay-75 ${isNewPatient && !isAnimating
                    ? 'opacity-100 transform translate-y-0'
                    : 'opacity-0 transform translate-y-2'
                    }`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 bg-gray-50 rounded-xl border border-gray-200 mt-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                        <input
                          ref={nameRef}
                          type="text"
                          value={newPatientData.name}
                          onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                          onKeyPress={(e) => handleKeyPress(e, ageRef)}
                          className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors h-12"
                          placeholder="Enter patient name"
                          autoFocus={isNewPatient && !isAnimating}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Age *</label>
                        <input
                          ref={ageRef}
                          type="number"
                          value={newPatientData.age}
                          onChange={(e) => setNewPatientData({ ...newPatientData, age: e.target.value })}
                          onKeyPress={(e) => handleKeyPress(e, genderRef)}
                          className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors h-12"
                          placeholder="Enter age"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                        <div ref={genderRef} tabIndex={0}>
                          <CustomDropdown
                            options={[
                              { value: 'male', label: 'Male' },
                              { value: 'female', label: 'Female' },
                              { value: 'other', label: 'Other' }
                            ]}
                            value={newPatientData.gender}
                            onChange={(value) => setNewPatientData({ ...newPatientData, gender: value })}
                            placeholder="Select gender..."
                            onEnterPress={handleGenderEnterPress}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
                        <input
                          ref={phoneRef}
                          type="tel"
                          value={newPatientData.phone}
                          onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                          onKeyPress={handleLastFieldKeyPress}
                          className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors h-12"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                          <button
                            onClick={handleCreateNewPatient}
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors duration-200"
                          >
                            Create Patient
                          </button>
                          <p className="text-xs text-gray-500">
                            Tip: Press Enter on any field to move to the next one, or Enter on the last field to create patient
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedPatient && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-5">Patient Information</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-semibold text-gray-700 block mb-1">Name</span>
                    <span className="text-gray-900 font-medium">{selectedPatient.name}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-semibold text-gray-700 block mb-1">ID</span>
                    <span className="text-gray-900 font-medium">{selectedPatient.id}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-semibold text-gray-700 block mb-1">Age</span>
                    <span className="text-gray-900 font-medium">{selectedPatient.age} years</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="font-semibold text-gray-700 block mb-1">Phone</span>
                    <span className="text-gray-900 font-medium">{selectedPatient.phone}</span>
                  </div>
                </div>
              </div>

              {/* Previous Visit Reference */}
              {previousPrescription && (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-5">Previous Visit Reference</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm">
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-700 mb-2.5">Medications</h4>
                      <ul className="space-y-1.5">
                        {previousPrescription.medications.map(med => (
                          <li key={med.id} className="text-blue-700 bg-blue-50 p-2 rounded-md">
                            {med.name} - {med.dosage}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-700 mb-2.5">Diagnosis</h4>
                      <ul className="space-y-1.5">
                        {previousPrescription.diagnosis.map(diag => (
                          <li key={diag.id} className="text-blue-700 bg-blue-50 p-2 rounded-md">{diag.name}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-700 mb-2.5">Previous Advice</h4>
                      <p className="text-blue-700 bg-blue-50 p-3 rounded-md">{previousPrescription.advice}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Prescription Templates Section */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5 space-y-3 sm:space-y-0">
                  <h3 className="text-lg font-semibold text-gray-900">Prescription Templates</h3>
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 text-sm font-medium transition-colors duration-200"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{showTemplates ? 'Hide Templates' : 'Browse Templates'}</span>
                  </button>
                </div>

                {showTemplates && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search templates..."
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors h-11"
                      />
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {filteredTemplates.length > 0 ? (
                        filteredTemplates.map((template) => (
                          <div
                            key={template.id}
                            onClick={() => applyTemplate(template)}
                            className="flex-shrink-0 w-80 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 cursor-pointer group"
                          >
                            <h4 className="font-semibold text-gray-800 mb-1.5 group-hover:text-purple-700">
                              {template.name}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2.5 line-clamp-2">{template.description}</p>

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
                        <div className="flex-shrink-0 w-full text-center py-8 text-gray-500">
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
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-5">Medical History</h3>
                <div className="flex flex-wrap gap-2.5">
                  {MEDICAL_CONDITIONS.map((condition) => (
                    <button
                      key={condition}
                      onClick={() => toggleMedicalCondition(condition)}
                      className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${selectedMedicalHistory.has(condition)
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                    >
                      {condition}
                    </button>
                  ))}

                  {customMedicalHistory.map((condition) => (
                    <div key={condition} className="relative group">
                      <button
                        onClick={() => toggleMedicalCondition(condition)}
                        className={`px-3.5 py-1.5 pr-7 rounded-full text-sm font-medium transition-colors duration-200 ${selectedMedicalHistory.has(condition)
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
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

                  {!isAddingCustom ? (
                    <button
                      onClick={() => setIsAddingCustom(true)}
                      className="px-3.5 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-600 hover:bg-green-200 border border-green-300 transition-colors duration-200 flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Custom</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <input
                        ref={customInputRef}
                        type="text"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        onKeyDown={handleCustomInputKeyPress}
                        placeholder="Enter condition..."
                        className="px-3 py-1.5 border border-gray-300 rounded-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-[140px] h-9"
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
                  <div className="mt-5 p-3.5 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-700 mb-1.5">Selected Conditions:</h4>
                    <div className="text-sm text-blue-600">
                      {Array.from(selectedMedicalHistory).join(', ')}
                    </div>
                  </div>
                )}
              </div>

              {/* Symptoms */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="space-y-5">
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
                      await loadCustomData();
                      const newSymptom = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        name: symptom,
                        severity: 'mild',
                        duration: ''
                      };
                      setSymptoms([...symptoms, newSymptom]);
                    }}
                  />

                  {symptoms.length > 0 && (
                    <div className="space-y-0">
                      <h4 className="text-base font-medium text-gray-800 mb-4">Selected Symptoms</h4>
                      <div className="divide-y divide-gray-200">
                        {symptoms.map((symptom) => (
                          <div key={symptom.id} className="flex justify-between items-center py-4">
                            <div className="font-normal text-gray-700">{symptom.name}</div>
                            <div className="flex w-100 space-x-3 pl-3 items-center">

                              <CustomDropdown
                                className="flex-1"
                                options={SEVERITY_OPTIONS.map(option => ({ value: option.value, label: option.label }))}
                                value={symptom.severity}
                                onChange={(value) => updateSymptom(symptom.id, 'severity', value)}
                                placeholder="Select severity"
                              />

                              <CustomDropdown
                                options={[
                                  { value: '', label: 'Select duration' },
                                  ...DURATION_OPTIONS.map(duration => ({ value: duration, label: duration }))
                                ]}
                                value={symptom.duration}
                                onChange={(value) => updateSymptom(symptom.id, 'duration', value)}
                                placeholder="Select duration"
                              />

                              <button
                                onClick={() => removeSymptom(symptom.id)}
                                className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-md transition-colors sm:justify-self-end"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Diagnosis */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="space-y-5">
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
                      await loadCustomData();
                      const newDiagnosis = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        name: diagnosis,
                        description: ''
                      };
                      setDiagnoses([...diagnoses, newDiagnosis]);
                    }}
                  />

                  {diagnoses.length > 0 && (
                    <div className="space-y-0">
                      <h4 className="text-base font-medium text-gray-800 mb-4">Selected Diagnoses</h4>
                      <div className="divide-y divide-gray-200">
                        {diagnoses.map((diagnosis) => (
                          <div key={diagnosis.id} className="flex justify-between items-center py-4">
                            <div className="font-normal text-gray-700">{diagnosis.name}</div>
                            <div className="flex w-100 space-x-3 pl-3 items-center">

                              <input
                                type="text"
                                placeholder="Description (optional)"
                                value={diagnosis.description}
                                onChange={(e) => updateDiagnosis(diagnosis.id, 'description', e.target.value)}
                                className="text-sm w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors h-11"
                              />

                              <button
                                onClick={() => removeDiagnosis(diagnosis.id)}
                                className=" text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-md transition-colors sm:justify-self-end"
                              >
                                <Trash2 className="w-4 h-4"></Trash2>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Medications section */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="space-y-5">
                  {isLoadingCustomData ? (
                    <div className="text-center py-6">
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
                        await loadCustomData();
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

                  {medications.length > 0 && (
                    <div className="space-y-0">
                      <h4 className="text-base font-medium text-gray-800 mb-4">Selected Medications</h4>
                      <div className="divide-y divide-gray-200">
                        {medications.map((medication) => (
                          <div key={medication.id} className="py-4 space-y-3.5">
                            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-center">
                              <div className="font-normal text-gray-700">{medication.name}</div>

                              <div className="col-span-1 sm:col-span-4 flex items-center space-x-2.5 justify-center sm:justify-start">
                                {Object.entries(medication.timing).map(([key, value]) => (
                                  <div key={key} className="flex flex-col items-center space-y-1">
                                    <button
                                      type="button"
                                      onClick={() => updateMedication(medication.id, `timing.${key}`, !value)}
                                      className={`w-7 h-7 rounded-md border-1 transition-all duration-200 flex items-center justify-center ${value
                                        ? 'border-blue-400 bg-blue-100'
                                        : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    >
                                      {value && (
                                        <div className="w-5 h-5 bg-blue-400 rounded-sm"></div>
                                      )}
                                    </button>
                                    
                                  </div>
                                ))}
                              </div>

                              <button
                                onClick={() => removeMedication(medication.id)}
                                className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-md transition-colors sm:justify-self-end"
                              >
                                <Trash2 className="w-4 h-4"></Trash2>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
                              <input
                                type="text"
                                placeholder="Dosage (e.g., 500mg)"
                                value={medication.dosage}
                                onChange={(e) => updateMedication(medication.id, 'dosage', e.target.value)}
                                className="text-sm w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors h-11"
                              />
                              <CustomDropdown
                                options={MEDICATION_TIMING.map(option => ({ value: option.value, label: option.label }))}
                                value={medication.mealTiming}
                                onChange={(value) => updateMedication(medication.id, 'mealTiming', value)}
                                placeholder="Select meal timing"
                              />
                              <CustomDropdown
                                options={[
                                  { value: '', label: 'Select duration' },
                                  ...MEDICATION_DURATION_OPTIONS.map(duration => ({ value: duration, label: duration }))
                                ]}
                                value={medication.duration}
                                onChange={(value) => updateMedication(medication.id, 'duration', value)}
                                placeholder="Select duration"
                              />
                              <input
                                type="text"
                                placeholder="Remarks"
                                value={medication.remarks}
                                onChange={(e) => updateMedication(medication.id, 'remarks', e.target.value)}
                                className="text-sm w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors h-11"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lab Results */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="space-y-5">
                  <PillSelector
                    title="Select Lab Tests"
                    items={[...PREDEFINED_LAB_TESTS, ...customLabTests]}
                    onSelect={(labTest) => {
                      const newLabResult = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        testName: labTest,
                        remarks: ''
                      };
                      setLabResults([...labResults, newLabResult]);
                    }}
                    searchPlaceholder="Search lab tests..."
                    onAddCustom={async (labTest) => {
                      await storage.addCustomLabTest(labTest);
                      await loadCustomData();
                      const newLabResult = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        testName: labTest,
                        remarks: ''
                      };
                      setLabResults([...labResults, newLabResult]);
                    }}
                  />

                  {labResults.length > 0 && (
                    <div className="space-y-0">
                      <h4 className="text-base font-medium text-gray-800 mb-4">Selected Lab Tests</h4>
                      <div className="divide-y divide-gray-200">
                        {labResults.map((lab) => (
                          <div key={lab.id} className="flex justify-between items-center py-4">
                            <div className="font-normal text-gray-700">{lab.testName}</div>
                            <div className="flex w-100 space-x-3 pl-3 items-center">
                              <input
                                type="text"
                                placeholder="Remarks (optional)"
                                value={lab.remarks}
                                onChange={(e) => updateLabResult(lab.id, 'remarks', e.target.value)}
                                className="text-sm w-full p-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors h-11"
                              />
                              <button
                                onClick={() => removeLabResult(lab.id)}
                                className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-md transition-colors sm:justify-self-end"
                              >
                                <Trash2 className="w-4 h-4"></Trash2>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Doctor Notes and Advice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-5">Doctor's Notes</h3>

                  <div className="mb-4">
                    <input
                      type="text"
                      value={doctorNotesInput}
                      onChange={(e) => setDoctorNotesInput(e.target.value)}
                      onKeyDown={handleDoctorNotesKeyPress}
                      placeholder="Add a note and press Enter..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm h-11"
                    />
                  </div>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {doctorNotesList.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <p className="text-sm">No notes added yet</p>
                        <p className="text-xs text-gray-400">Type a note and press Enter to add</p>
                      </div>
                    ) : (
                      doctorNotesList.map((note) => (
                        <div key={note.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors border border-gray-200">
                          <p className="text-sm text-gray-700 flex-1 mr-2.5 leading-relaxed">{note.text}</p>
                          <button
                            onClick={() => removeDoctorNote(note.id)}
                            className="text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 hover:bg-blue-50 rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-5">Advice to Patient</h3>

                  <div className="mb-4">
                    <input
                      type="text"
                      value={adviceInput}
                      onChange={(e) => setAdviceInput(e.target.value)}
                      onKeyDown={handleAdviceKeyPress}
                      placeholder="Add advice and press Enter..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm h-11"
                    />
                  </div>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {adviceList.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <p className="text-sm">No advice added yet</p>
                        <p className="text-xs text-gray-400">Type advice and press Enter to add</p>
                      </div>
                    ) : (
                      adviceList.map((advice) => (
                        <div key={advice.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors border border-gray-200">
                          <p className="text-sm text-gray-700 flex-1 mr-2.5 leading-relaxed">{advice.text}</p>
                          <button
                            onClick={() => removeAdvice(advice.id)}
                            className="text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 hover:bg-blue-50 rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Follow-up and Consultation Fee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-5">Follow-up Date</h3>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    min={getTodayString()}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors h-12"
                  />
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-5">Consultation Fee</h3>
                  <div className="flex items-center space-x-2.5">
                    <span className="text-gray-500 font-medium text-md">₹</span>
                    <input
                      type="number"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      placeholder="500"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors h-12"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        title="Save Prescription"
        message="Are you sure you want to save this prescription? This will generate the prescription and bill documents."
        onConfirm={handleConfirmSave}
        onCancel={handleCancelSave}
        isLoading={isProcessing}
      />
    </>
  );
}