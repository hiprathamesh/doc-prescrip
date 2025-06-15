'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Save, Calendar } from 'lucide-react';
import { storage } from '../utils/storage';
import { formatDate, getTodayString } from '../utils/dateUtils';
import ConfirmationDialog from './ConfirmationDialog';
import MedicalCertificateSuccess from './MedicalCertificateSuccess';
import { activityLogger } from '../utils/activityLogger';

export default function MedicalCertificate({ patient, patients, onBack, onPatientUpdate }) {
  const [selectedPatient, setSelectedPatient] = useState(patient);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    gender: 'male',
    age: '',
    phone: ''
  });

  // Medical certificate form state
  const [certificateData, setCertificateData] = useState({
    patientName: '',
    age: '',
    sex: '',
    height: '',
    weight: '',
    identificationMarks: '',
    build: '',
    colourOfEyes: '',
    colourOfSkin: '',
    pulse: '',
    bp: '',
    vision: '',
    chestMeasurementInsp: '',
    chestMeasurementExp: '',
    lungs: '',
    cardiovascularSystem: '',
    liver: '',
    spleen: '',
    urinarySystem: '',
    urine: '',
    remarks: '',
    issuedDate: getTodayString(),
    certificateFor: '',
    fitnessStatus: 'fit' // 'fit' or 'unfit'
  });

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedCertificate, setSavedCertificate] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Update form when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      setCertificateData(prev => ({
        ...prev,
        patientName: selectedPatient.name,
        age: selectedPatient.age?.toString() || '',
        sex: selectedPatient.gender === 'male' ? 'Male' : selectedPatient.gender === 'female' ? 'Female' : 'Other'
      }));
    }
  }, [selectedPatient]);

  // Add refs and state for floating header
  const medCertHeaderRef = useRef(null);
  const [isMedCertHeaderVisible, setIsMedCertHeaderVisible] = useState(true);

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

  const handleSaveCertificate = () => {
    if (!certificateData.patientName || !certificateData.age || !certificateData.sex) {
      alert('Please fill in the required patient information');
      return;
    }
    
    if (!certificateData.certificateFor) {
      alert('Please specify what this certificate is for');
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
    setIsProcessing(true);
    
    try {
      const certificate = {
        id: Date.now().toString(),
        patientId: selectedPatient?.id || null,
        ...certificateData,
        issuedDate: new Date(certificateData.issuedDate),
        createdAt: new Date()
      };

      // Save certificate (you'll need to add this to storage)
      // For now, we'll just save it locally
      const certificates = JSON.parse(localStorage.getItem('medicalCertificates') || '[]');
      certificates.push(certificate);
      localStorage.setItem('medicalCertificates', JSON.stringify(certificates));

      // If patient was selected, update their last visited date
      if (selectedPatient) {
        const updatedPatients = patients.map(p =>
          p.id === selectedPatient.id
            ? {
              ...p,
              lastVisited: new Date(),
              updatedAt: new Date()
            }
            : p
        );
        await storage.savePatients(updatedPatients);
        onPatientUpdate(updatedPatients);
      }

      setSavedCertificate(certificate);
      
      // Log activity
      await activityLogger.logMedicalCertificateCreated(selectedPatient, certificateData.certificateFor);
      
      setShowConfirmation(false);
      setShowSuccess(true);

    } catch (error) {
      console.error('Error saving medical certificate:', error);
      alert('Failed to save medical certificate. Please try again.');
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

  // Show success page if certificate was saved
  if (showSuccess && savedCertificate) {
    return (
      <MedicalCertificateSuccess
        certificate={savedCertificate}
        patient={selectedPatient}
        onBack={handleBackFromSuccess}
      />
    );
  }

  // Reset header visibility when component mounts
  useEffect(() => {
    setIsMedCertHeaderVisible(true);
  }, [selectedPatient]);

  // Intersection Observer for medical certificate header visibility
  useEffect(() => {
    const medCertHeaderElement = medCertHeaderRef.current;

    if (!medCertHeaderElement) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setIsMedCertHeaderVisible(true);
      return;
    }

    const rootMarginTop = "-81px"; // Adjusted to match main header height

    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries && entries.length > 0 && entries[0]) {
          const entry = entries[0];
          setIsMedCertHeaderVisible(entry.isIntersecting);
        }
      },
      {
        root: null,
        rootMargin: `${rootMarginTop} 0px 0px 0px`,
        threshold: 0,
      }
    );

    observer.observe(medCertHeaderElement);

    return () => {
      if (medCertHeaderElement) {
        observer.unobserve(medCertHeaderElement);
      }
    };
  }, []);

  return (
    <>
      {/* Floating header */}
      <div
        className={`fixed left-0 right-0 z-30 transition-transform duration-300 ease-in-out
          ${isMedCertHeaderVisible ? '-translate-y-full' : 'translate-y-0'}
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
                <span className="text-md font-semibold text-gray-900">Medical Certificate</span>
              </div>
              <button
                onClick={handleSaveCertificate}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors duration-200"
              >
                <Save className="w-4 h-4" />
                <span>Save Certificate</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 min-h-screen">
        {/* Header */}
        <div ref={medCertHeaderRef} className="med-cert-header">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-xl font-semibold text-gray-900">Medical Certificate</span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveCertificate}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 font-medium"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Certificate</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 space-y-6">
          {/* Patient Selection */}
          {!selectedPatient && (
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Select Patient or Enter Manually</h2>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="flex-1 relative">
                    <select
                      onChange={(e) => {
                        if (e.target.value === 'new') {
                          setIsNewPatient(true);
                        } else if (e.target.value === 'manual') {
                          // Skip patient selection, go to manual entry
                          setSelectedPatient(null);
                        } else {
                          const patient = patients.find(p => p.id === e.target.value);
                          setSelectedPatient(patient || null);
                        }
                      }}
                      className="w-full p-4 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-base sm:text-lg bg-white shadow-sm hover:shadow-md appearance-none"
                    >
                      <option value="">Select patient or enter manually...</option>
                      <option value="manual">📝 Enter Details Manually</option>
                      <option disabled>──────────</option>
                      {patients.map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name} ({patient.id}) - {patient.phone}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => setIsNewPatient(true)}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 rounded-xl flex items-center justify-center space-x-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add New Patient</span>
                  </button>
                </div>

                {isNewPatient && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    {/* ...existing new patient form... */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Name *</label>
                      <input
                        type="text"
                        value={newPatientData.name}
                        onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Age *</label>
                      <input
                        type="number"
                        value={newPatientData.age}
                        onChange={(e) => setNewPatientData({ ...newPatientData, age: e.target.value })}
                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Gender</label>
                      <select
                        value={newPatientData.gender}
                        onChange={(e) => setNewPatientData({ ...newPatientData, gender: e.target.value })}
                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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

          {/* Medical Certificate Form */}
          {(selectedPatient || !isNewPatient) && (
            <div className="space-y-6">
              {/* Certificate Purpose and Date */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Certificate Details</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Certificate For *</label>
                    <input
                      type="text"
                      value={certificateData.certificateFor}
                      onChange={(e) => setCertificateData({ ...certificateData, certificateFor: e.target.value })}
                      placeholder="e.g., Employment, Sports, School admission, etc."
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Issue Date</label>
                    <input
                      type="date"
                      value={certificateData.issuedDate}
                      onChange={(e) => setCertificateData({ ...certificateData, issuedDate: e.target.value })}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Patient Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Name *</label>
                    <input
                      type="text"
                      value={certificateData.patientName}
                      onChange={(e) => setCertificateData({ ...certificateData, patientName: e.target.value })}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Age *</label>
                    <input
                      type="number"
                      value={certificateData.age}
                      onChange={(e) => setCertificateData({ ...certificateData, age: e.target.value })}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Sex *</label>
                    <select
                      value={certificateData.sex}
                      onChange={(e) => setCertificateData({ ...certificateData, sex: e.target.value })}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Height</label>
                    <input
                      type="text"
                      value={certificateData.height}
                      onChange={(e) => setCertificateData({ ...certificateData, height: e.target.value })}
                      placeholder="e.g., 170 cm"
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Weight</label>
                    <input
                      type="text"
                      value={certificateData.weight}
                      onChange={(e) => setCertificateData({ ...certificateData, weight: e.target.value })}
                      placeholder="e.g., 70 kg"
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Build</label>
                    <select
                      value={certificateData.build}
                      onChange={(e) => setCertificateData({ ...certificateData, build: e.target.value })}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    >
                      <option value="">Select</option>
                      <option value="Thin">Thin</option>
                      <option value="Medium">Medium</option>
                      <option value="Heavy">Heavy</option>
                      <option value="Athletic">Athletic</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Physical Examination */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Physical Examination</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Identification Marks</label>
                    <input
                      type="text"
                      value={certificateData.identificationMarks}
                      onChange={(e) => setCertificateData({ ...certificateData, identificationMarks: e.target.value })}
                      placeholder="e.g., Scar on left hand"
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Colour of Eyes</label>
                    <input
                      type="text"
                      value={certificateData.colourOfEyes}
                      onChange={(e) => setCertificateData({ ...certificateData, colourOfEyes: e.target.value })}
                      placeholder="e.g., Brown"
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Colour of Skin</label>
                    <input
                      type="text"
                      value={certificateData.colourOfSkin}
                      onChange={(e) => setCertificateData({ ...certificateData, colourOfSkin: e.target.value })}
                      placeholder="e.g., Fair"
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Pulse</label>
                    <input
                      type="text"
                      value={certificateData.pulse}
                      onChange={(e) => setCertificateData({ ...certificateData, pulse: e.target.value })}
                      placeholder="e.g., 72/min"
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">BP</label>
                    <input
                      type="text"
                      value={certificateData.bp}
                      onChange={(e) => setCertificateData({ ...certificateData, bp: e.target.value })}
                      placeholder="e.g., 120/80 mmHg"
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Vision</label>
                    <input
                      type="text"
                      value={certificateData.vision}
                      onChange={(e) => setCertificateData({ ...certificateData, vision: e.target.value })}
                      placeholder="e.g., 6/6"
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* System Examination */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">System Examination</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Chest Measurement (Insp)</label>
                    <input
                      type="text"
                      value={certificateData.chestMeasurementInsp}
                      onChange={(e) => setCertificateData({ ...certificateData, chestMeasurementInsp: e.target.value })}
                      placeholder="e.g., 36 inches"
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Chest Measurement (Exp)</label>
                    <input
                      type="text"
                      value={certificateData.chestMeasurementExp}
                      onChange={(e) => setCertificateData({ ...certificateData, chestMeasurementExp: e.target.value })}
                      placeholder="e.g., 34 inches"
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Lungs</label>
                    <input
                      type="text"
                      value={certificateData.lungs}
                      onChange={(e) => setCertificateData({ ...certificateData, lungs: e.target.value })}
                      placeholder="e.g., Normal"
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Cardiovascular System</label>
                    <input
                      type="text"
                      value={certificateData.cardiovascularSystem}
                      onChange={(e) => setCertificateData({ ...certificateData, cardiovascularSystem: e.target.value })}
                      placeholder="e.g., Normal"
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Liver</label>
                    <input
                      type="text"
                      value={certificateData.liver}
                      onChange={(e) => setCertificateData({ ...certificateData, liver: e.target.value })}
                      placeholder="e.g., Not palpable"
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Spleen</label>
                    <input
                      type="text"
                      value={certificateData.spleen}
                      onChange={(e) => setCertificateData({ ...certificateData, spleen: e.target.value })}
                      placeholder="e.g., Not palpable"
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Urinary System</label>
                    <input
                      type="text"
                      value={certificateData.urinarySystem}
                      onChange={(e) => setCertificateData({ ...certificateData, urinarySystem: e.target.value })}
                      placeholder="e.g., Normal"
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Urine</label>
                    <input
                      type="text"
                      value={certificateData.urine}
                      onChange={(e) => setCertificateData({ ...certificateData, urine: e.target.value })}
                      placeholder="e.g., Normal"
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Fitness Status and Remarks */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Assessment</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Fitness Status</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="fit"
                          checked={certificateData.fitnessStatus === 'fit'}
                          onChange={(e) => setCertificateData({ ...certificateData, fitnessStatus: e.target.value })}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="text-green-700 font-medium">Medically Fit</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="unfit"
                          checked={certificateData.fitnessStatus === 'unfit'}
                          onChange={(e) => setCertificateData({ ...certificateData, fitnessStatus: e.target.value })}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span className="text-red-700 font-medium">Medically Unfit</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Remarks</label>
                    <textarea
                      value={certificateData.remarks}
                      onChange={(e) => setCertificateData({ ...certificateData, remarks: e.target.value })}
                      placeholder="Any additional remarks or observations..."
                      rows={4}
                      className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
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
        title="Save Medical Certificate"
        message="Are you sure you want to save this medical certificate? This will generate the certificate document."
        onConfirm={handleConfirmSave}
        onCancel={handleCancelSave}
        isLoading={isProcessing}
      />
    </>
  );
}
