'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Save, User, Phone, Calendar } from 'lucide-react';
import { storage } from '../utils/storage';
import { formatDate, getTodayString } from '../utils/dateUtils';
import ConfirmationDialog from './ConfirmationDialog';
import MedicalCertificateSuccess from './MedicalCertificateSuccess';
import CustomSelect from './CustomSelect';
import CustomDropdown from './CustomDropdown';
import { activityLogger } from '../utils/activityLogger';
import useScrollToTop from '../hooks/useScrollToTop';

export default function MedicalCertificate({ patient, patients, onBack, onPatientUpdate }) {
  const [selectedPatient, setSelectedPatient] = useState(patient);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    gender: 'male',
    age: '',
    phone: ''
  });

  // Add scroll to top when component mounts or patient changes
  useScrollToTop([selectedPatient?.id]);

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
    fitnessStatus: 'fit'
  });

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedCertificate, setSavedCertificate] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Add refs and state for floating header
  const medCertHeaderRef = useRef(null);
  const [isMedCertHeaderVisible, setIsMedCertHeaderVisible] = useState(true);

  // Refs for new patient form fields
  const nameRef = useRef(null);
  const ageRef = useRef(null);
  const genderRef = useRef(null);
  const phoneRef = useRef(null);

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

    const rootMarginTop = "-81px";

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
        await activityLogger.logPatientCreated(newPatient);
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

  const toggleNewPatient = () => {
    if (isNewPatient) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsNewPatient(false);
        setIsAnimating(false);
        setNewPatientData({
          name: '',
          gender: 'male',
          age: '',
          phone: ''
        });
      }, 300);
    } else {
      setIsNewPatient(true);
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
      }, 50);
    }
  };

  const handleSaveCertificate = () => {
    if (!selectedPatient) {
      alert('Please select a patient');
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
        // Use current DateTime instead of just the date to preserve time
        issuedDate: new Date(),
        createdAt: new Date()
      };

      // Save certificate
      const certificates = JSON.parse(localStorage.getItem('medicalCertificates') || '[]');
      certificates.push(certificate);
      localStorage.setItem('medicalCertificates', JSON.stringify(certificates));

      // Update patient's last visited date
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

  // Handle Enter key press for form navigation
  const handleKeyPress = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        if (nextRef === genderRef) {
          // For gender dropdown, focus and open it
          nextRef.current.open();
        } else {
          // For regular inputs, just focus
          nextRef.current.focus();
        }
      }
    }
  };

  const handleLastFieldKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateNewPatient();
    }
  };

  const handleGenderEnterPress = () => {
    if (phoneRef.current) {
      phoneRef.current.focus();
    }
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

  return (
    <>
      {/* Floating header */}
      <div
        className={`fixed left-0 right-0 z-30 transition-transform duration-300 ease-in-out
          ${isMedCertHeaderVisible ? '-translate-y-full' : 'translate-y-0'}
        `}
        style={{ top: '81px' }}
      >
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-5xl mx-auto px-6 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-md font-semibold text-gray-900 dark:text-gray-100">Medical Certificate</span>
              </div>
              <button
                onClick={handleSaveCertificate}
                className="bg-green-600 hover:bg-green-700 text-white dark:text-gray-900 px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors duration-200 cursor-pointer"
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
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">Medical Certificate</span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveCertificate}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white dark:text-gray-900 px-5 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 font-medium cursor-pointer"
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
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">Select Patient</h2>
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                  <div className="flex-1 relative">
                    <CustomSelect
                      options={patients.map(p => ({ value: p.id, label: `${p.name} (${p.id}) - ${p.phone}` }))
                      }
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
                    className={`w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white dark:text-gray-900 px-5 py-2.5 rounded-lg flex items-center justify-center space-x-2 font-medium transition-all duration-200 cursor-pointer ${isNewPatient ? 'bg-gray-600 hover:bg-gray-700' : ''
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 mt-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">Name *</label>
                        <input
                          ref={nameRef}
                          type="text"
                          value={newPatientData.name}
                          onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                          onKeyPress={(e) => handleKeyPress(e, ageRef)}
                          className="w-full text-sm p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-12"
                          placeholder="Enter patient name"
                          autoFocus={isNewPatient && !isAnimating}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">Age *</label>
                        <input
                          ref={ageRef}
                          type="number"
                          value={newPatientData.age}
                          onChange={(e) => setNewPatientData({ ...newPatientData, age: e.target.value })}
                          onKeyPress={(e) => handleKeyPress(e, genderRef)}
                          className="w-full text-sm p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-12"
                          placeholder="Enter age"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">Gender</label>
                        <CustomDropdown
                          ref={genderRef}
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">Phone *</label>
                        <input
                          ref={phoneRef}
                          type="tel"
                          value={newPatientData.phone}
                          onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                          onKeyPress={handleLastFieldKeyPress}
                          className="w-full text-sm p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-12"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                          <button
                            onClick={handleCreateNewPatient}
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white dark:text-gray-900 px-5 py-2.5 rounded-lg font-medium transition-colors duration-200 cursor-pointer"
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

          {/* Medical Certificate Form - Only show when patient is selected */}
          {selectedPatient && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-gray-600">Patient</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{selectedPatient.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-gray-600">ID</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{selectedPatient.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-gray-600">Age</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{selectedPatient.age} years</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-gray-600">Phone</span>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{selectedPatient.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificate Purpose and Date */}
              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Certificate Details</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Certificate For *</label>
                    <input
                      type="text"
                      value={certificateData.certificateFor}
                      onChange={(e) => setCertificateData({ ...certificateData, certificateFor: e.target.value })}
                      placeholder="e.g., Employment, Sports, School admission, etc."
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Issue Date</label>
                    <input
                      type="date"
                      value={certificateData.issuedDate}
                      onChange={(e) => setCertificateData({ ...certificateData, issuedDate: e.target.value })}
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Patient Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Name *</label>
                    <input
                      type="text"
                      value={certificateData.patientName}
                      onChange={(e) => setCertificateData({ ...certificateData, patientName: e.target.value })}
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Age *</label>
                    <input
                      type="number"
                      value={certificateData.age}
                      onChange={(e) => setCertificateData({ ...certificateData, age: e.target.value })}
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Sex *</label>
                    <CustomDropdown
                      options={[
                        { value: '', label: 'Select' },
                        { value: 'Male', label: 'Male' },
                        { value: 'Female', label: 'Female' },
                        { value: 'Other', label: 'Other' }
                      ]}
                      value={certificateData.sex}
                      onChange={(value) => setCertificateData({ ...certificateData, sex: value })}
                      placeholder="Select"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Height</label>
                    <input
                      type="text"
                      value={certificateData.height}
                      onChange={(e) => setCertificateData({ ...certificateData, height: e.target.value })}
                      placeholder="e.g., 170 cm"
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Weight</label>
                    <input
                      type="text"
                      value={certificateData.weight}
                      onChange={(e) => setCertificateData({ ...certificateData, weight: e.target.value })}
                      placeholder="e.g., 70 kg"
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Build</label>
                    <CustomDropdown
                      options={[
                        { value: '', label: 'Select' },
                        { value: 'Thin', label: 'Thin' },
                        { value: 'Medium', label: 'Medium' },
                        { value: 'Heavy', label: 'Heavy' },
                        { value: 'Athletic', label: 'Athletic' }
                      ]}
                      value={certificateData.build}
                      onChange={(value) => setCertificateData({ ...certificateData, build: value })}
                      placeholder="Select"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Examination */}
              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Physical Examination</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Identification Marks</label>
                    <input
                      type="text"
                      value={certificateData.identificationMarks}
                      onChange={(e) => setCertificateData({ ...certificateData, identificationMarks: e.target.value })}
                      placeholder="e.g., Scar on left hand"
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Colour of Eyes</label>
                    <input
                      type="text"
                      value={certificateData.colourOfEyes}
                      onChange={(e) => setCertificateData({ ...certificateData, colourOfEyes: e.target.value })}
                      placeholder="e.g., Brown"
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Colour of Skin</label>
                    <input
                      type="text"
                      value={certificateData.colourOfSkin}
                      onChange={(e) => setCertificateData({ ...certificateData, colourOfSkin: e.target.value })}
                      placeholder="e.g., Fair"
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Pulse</label>
                    <input
                      type="text"
                      value={certificateData.pulse}
                      onChange={(e) => setCertificateData({ ...certificateData, pulse: e.target.value })}
                      placeholder="e.g., 72/min"
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">BP</label>
                    <input
                      type="text"
                      value={certificateData.bp}
                      onChange={(e) => setCertificateData({ ...certificateData, bp: e.target.value })}
                      placeholder="e.g., 120/80 mmHg"
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Vision</label>
                    <input
                      type="text"
                      value={certificateData.vision}
                      onChange={(e) => setCertificateData({ ...certificateData, vision: e.target.value })}
                      placeholder="e.g., 6/6"
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                </div>
              </div>

              {/* System Examination */}
              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">System Examination</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Chest Measurement (Insp)</label>
                    <input
                      type="text"
                      value={certificateData.chestMeasurementInsp}
                      onChange={(e) => setCertificateData({ ...certificateData, chestMeasurementInsp: e.target.value })}
                      placeholder="e.g., 36 inches"
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Chest Measurement (Exp)</label>
                    <input
                      type="text"
                      value={certificateData.chestMeasurementExp}
                      onChange={(e) => setCertificateData({ ...certificateData, chestMeasurementExp: e.target.value })}
                      placeholder="e.g., 34 inches"
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Lungs</label>
                    <input
                      type="text"
                      value={certificateData.lungs}
                      onChange={(e) => setCertificateData({ ...certificateData, lungs: e.target.value })}
                      placeholder="e.g., Normal"
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Cardiovascular System</label>
                    <input
                      type="text"
                      value={certificateData.cardiovascularSystem}
                      onChange={(e) => setCertificateData({ ...certificateData, cardiovascularSystem: e.target.value })}
                      placeholder="e.g., Normal"
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Liver</label>
                    <input
                      type="text"
                      value={certificateData.liver}
                      onChange={(e) => setCertificateData({ ...certificateData, liver: e.target.value })}
                      placeholder="e.g., Not palpable"
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Spleen</label>
                    <input
                      type="text"
                      value={certificateData.spleen}
                      onChange={(e) => setCertificateData({ ...certificateData, spleen: e.target.value })}
                      placeholder="e.g., Not palpable"
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Urinary System</label>
                    <input
                      type="text"
                      value={certificateData.urinarySystem}
                      onChange={(e) => setCertificateData({ ...certificateData, urinarySystem: e.target.value })}
                      placeholder="e.g., Normal"
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Urine</label>
                    <input
                      type="text"
                      value={certificateData.urine}
                      onChange={(e) => setCertificateData({ ...certificateData, urine: e.target.value })}
                      placeholder="e.g., Normal"
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Fitness Status and Remarks */}
              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Assessment</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-3">Fitness Status</label>
                    <div className="flex space-x-6">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="fit"
                          checked={certificateData.fitnessStatus === 'fit'}
                          onChange={(e) => setCertificateData({ ...certificateData, fitnessStatus: e.target.value })}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="text-green-700 text-sm font-medium">Medically Fit</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="unfit"
                          checked={certificateData.fitnessStatus === 'unfit'}
                          onChange={(e) => setCertificateData({ ...certificateData, fitnessStatus: e.target.value })}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span className="text-red-700 text-sm font-medium">Medically Unfit</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Remarks</label>
                    <textarea
                      value={certificateData.remarks}
                      onChange={(e) => setCertificateData({ ...certificateData, remarks: e.target.value })}
                      placeholder="Any additional remarks or observations..."
                      rows={3}
                      className="w-full text-sm p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors resize-none"
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
