'use client';

import { Phone, FileText, Trash2, MoreVertical, ArrowLeft, Search, Plus } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { useState, useRef, useEffect } from 'react';
import CustomDropdown from './CustomDropdown';
import ConfirmationDialog from './ConfirmationDialog';
import useScrollToTop from '../hooks/useScrollToTop';
import { storage } from '../utils/storage';
import { toast } from 'sonner';
import usePageTitle from '../hooks/usePageTitle';

export default function PatientList({ patients, onPatientSelect, onNewPrescription, onPatientDelete, onBack }) {
  usePageTitle('Patients');

  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('date-created');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'
  const dropdownRefs = useRef({});
  const patientHeaderRef = useRef(null);
  const [isPatientHeaderVisible, setIsPatientHeaderVisible] = useState(true);
  const searchInputRef = useRef(null);

  // Add new patient modal state
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    age: '',
    gender: 'male',
    phone: ''
  });
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);

  // Refs for new patient form fields
  const nameRef = useRef(null);
  const ageRef = useRef(null);
  const genderRef = useRef(null);
  const phoneRef = useRef(null);

  // Add confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    isLoading: false,
    onConfirm: null,
    patientToDelete: null
  });

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Patients' },
    { value: 'pending-followup', label: 'Pending Follow-up' },
    { value: 'overdue-followup', label: 'Overdue Follow-up' },
    { value: 'recent-visits', label: 'Recent Visits (Last 7 days)' },
    { value: 'no-followup', label: 'No Pending Follow-up' },
    { value: 'pending-payments', label: 'Pending Payments' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'date-created', label: 'Date Created' },
    { value: 'name', label: 'Name' },
    { value: 'last-visit', label: 'Last Visit' }
  ];

  // Filter patients based on search term and filter criteria
  const getFilteredPatients = () => {
    let filtered = patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm)
    );

    // Apply filter
    switch (filterBy) {
      case 'pending-followup':
        filtered = filtered.filter(patient => patient.followUpStatus === 'pending');
        break;
      case 'overdue-followup':
        filtered = filtered.filter(patient => patient.followUpStatus === 'overdue');
        break;
      case 'recent-visits':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filtered = filtered.filter(patient => new Date(patient.lastVisited) >= sevenDaysAgo);
        break;
      case 'no-followup':
        filtered = filtered.filter(patient => patient.followUpStatus === 'none');
        break;
      case 'pending-payments':
        filtered = filtered.filter(patient => patient.hasPendingPayments === true);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => {
          const comparison = a.name.localeCompare(b.name);
          return sortDirection === 'asc' ? comparison : -comparison;
        });
        break;
      case 'last-visit':
        filtered.sort((a, b) => {
          const comparison = new Date(a.lastVisited) - new Date(b.lastVisited);
          return sortDirection === 'asc' ? comparison : -comparison;
        });
        break;
      case 'date-created':
        filtered.sort((a, b) => {
          const comparison = new Date(a.createdAt || a.lastVisited) - new Date(b.createdAt || b.lastVisited);
          return sortDirection === 'asc' ? comparison : -comparison;
        });
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredPatients = getFilteredPatients();

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  const handleSortDirectionToggle = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleDeletePatient = (patient, e) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Patient',
      message: `Are you sure you want to delete patient ${patient.name}? This will permanently remove all their data including prescriptions and bills.`,
      isLoading: false,
      onConfirm: () => handleConfirmDelete(patient.id),
      patientToDelete: patient
    });
    setDropdownOpen(null);
  };

  const handleConfirmDelete = async (patientId) => {
    setConfirmDialog(prev => ({ ...prev, isLoading: true }));

    try {
      await onPatientDelete(patientId);
      setConfirmDialog({
        isOpen: false,
        title: '',
        message: '',
        isLoading: false,
        onConfirm: null,
        patientToDelete: null
      });
    } catch (error) {
      console.error('Error deleting patient:', error);
      setConfirmDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCancelDelete = () => {
    if (!confirmDialog.isLoading) {
      setConfirmDialog({
        isOpen: false,
        title: '',
        message: '',
        isLoading: false,
        onConfirm: null,
        patientToDelete: null
      });
    }
  };

  const handleDropdownToggle = (patientId, e) => {
    e.stopPropagation();
    setDropdownOpen(dropdownOpen === patientId ? null : patientId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !Object.values(dropdownRefs.current).some(ref =>
        ref && ref.contains(event.target)
      )) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Intersection Observer for patient-header visibility
  useEffect(() => {
    const patientHeaderElement = patientHeaderRef.current;

    if (!patientHeaderElement) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setIsPatientHeaderVisible(true);
      return;
    }

    const rootMarginTop = "-88px"; // Adjust based on main header height

    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries && entries.length > 0 && entries[0]) {
          const entry = entries[0];
          setIsPatientHeaderVisible(entry.isIntersecting);
        }
      },
      {
        root: null,
        rootMargin: `${rootMarginTop} 0px 0px 0px`,
        threshold: 0,
      }
    );

    observer.observe(patientHeaderElement);

    return () => {
      if (patientHeaderElement) {
        observer.unobserve(patientHeaderElement);
      }
    };
  }, []);

  // Handle Ctrl+K shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Add scroll to top when component mounts
  useScrollToTop();

  // Generate patient ID
  const generatePatientId = () => {
    const prefix = 'P';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${prefix}${timestamp}${random}`;
  };

  // Handle create new patient
  const handleCreateNewPatient = async () => {
    if (!newPatientData.name || !newPatientData.age || !newPatientData.phone) {
      toast.error('Missing Information', {
        description: 'Please fill all required fields (Name, Age, and Phone are required)'
      });
      return;
    }

    setIsCreatingPatient(true);
    try {
      const patientId = generatePatientId();
      const newPatient = {
        id: patientId,
        name: newPatientData.name,
        age: parseInt(newPatientData.age),
        gender: newPatientData.gender,
        phone: newPatientData.phone,
        createdAt: new Date(),
        lastVisited: new Date(),
        nextExpected: null,
        followUpStatus: 'none',
        hasPendingPayments: false
      };

      const currentPatients = await storage.getPatients();
      const updatedPatients = [...currentPatients, newPatient];
      await storage.savePatients(updatedPatients);

      toast.success('Patient Added', {
        description: `${newPatient.name} has been added successfully`
      });

      setShowNewPatientModal(false);
      setNewPatientData({ name: '', age: '', gender: 'male', phone: '' });

      // Refresh the page or notify parent component
      window.location.reload();
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error('Failed to create patient');
    } finally {
      setIsCreatingPatient(false);
    }
  };

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

  if (patients.length === 0) {
    return (
      <>
        <div className="space-y-6">
          {/* Header */}
          <div ref={patientHeaderRef} className="patient-header">
            <div className="max-w-4xl mx-auto px-6 py-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">Patients</span>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center py-12">
              {/* Empty State Image */}
              <div className="w-32 h-50 mx-auto mb-6 relative overflow-hidden">
                <picture className="w-full h-full">
                  <source srcSet="/patientsEmptyState.avif" type="image/avif" />
                  <source srcSet="/patientsEmptyState.webp" type="image/webp" />
                  <img
                    src="/patientsEmptyState.png"
                    alt="No patients"
                    className="w-full h-full object-cover"
                    draggable="false"
                  />
                </picture>
              </div>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No one here yet</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Start by adding your first patient to begin managing their medical records.</p>

              <button
                onClick={() => setShowNewPatientModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:text-gray-900 px-4 py-2 font-semibold rounded-lg flex items-center space-x-2 mx-auto transition-covers duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Patient</span>
              </button>
            </div>
          </div>
        </div>

        {/* New Patient Modal */}
        {showNewPatientModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add New Patient</h3>

              <div className="space-y-4">
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
                    autoFocus
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
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowNewPatientModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  disabled={isCreatingPatient}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNewPatient}
                  disabled={isCreatingPatient}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingPatient ? 'Creating...' : 'Create Patient'}
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                Tip: Press Enter on any field to move to the next one, or Enter on the last field to create patient
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Floating header */}
      <div
        className={`fixed left-0 right-0 z-30 transition-transform duration-300 ease-in-out
          ${isPatientHeaderVisible ? '-translate-y-full' : 'translate-y-0'}
        `}
        style={{ top: '88px' }}
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
                <span className="text-md font-semibold text-gray-900 dark:text-gray-100">Patients</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 pr-16 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                />
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded border cursor-pointer"
                  onClick={() => searchInputRef.current?.focus()}
                >
                  Ctrl K
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div ref={patientHeaderRef} className="patient-header">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">Patients</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-70 pl-9 pr-16 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                />
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border cursor-pointer"
                  onClick={() => searchInputRef.current?.focus()}
                >
                  Ctrl K
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6">
          <div className="pl-4 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-md font-medium text-gray-900 dark:text-gray-100">
                {filteredPatients.length} {filteredPatients.length === 1 ? 'Patient' : 'Patients'}
                {searchTerm && ` matching "${searchTerm}"`}
              </h2>
              <div className="flex items-center space-x-3">
                <div className="w-48">
                  <CustomDropdown
                    options={filterOptions}
                    value={filterBy}
                    onChange={setFilterBy}
                    placeholder="Filter patients..."
                  />
                </div>
                <div className="w-48">
                  <CustomDropdown
                    options={sortOptions}
                    value={sortBy}
                    onChange={handleSortChange}
                    placeholder="Sort by..."
                    showDirectionToggle={true}
                    sortDirection={sortDirection}
                    onDirectionToggle={handleSortDirectionToggle}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Subheading with patient count and controls */}


            {/* Mobile view */}
            <div className="block sm:hidden">
              <div className="divide-y divide-gray-200">
                {filteredPatients.map((patient, index) => (
                  <div key={patient.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="flex-1"
                        onClick={() => onPatientSelect(patient)}
                      >
                        <div className="font-medium text-gray-900 text-sm">{patient.name}</div>
                        <div className="text-sm text-gray-600">
                          {patient.gender} • {patient.age} years • ID: {patient.id}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Phone className="w-3 h-3 mr-1 text-gray-500" />
                          {patient.phone}
                        </div>
                      </div>

                      <div className="relative ml-4" ref={el => dropdownRefs.current[patient.id] = el}>
                        <button
                          onClick={(e) => handleDropdownToggle(patient.id, e)}
                          className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {dropdownOpen === patient.id && (
                          <div className={`absolute ${index >= filteredPatients.length - 3 ? 'bottom-full mb-2' : 'top-full mt-2'
                            } right-0 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200`}>
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNewPrescription(patient);
                                  setDropdownOpen(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2 transition-colors"
                              >
                                <FileText className="w-4 h-4" />
                                <span>New Prescription</span>
                              </button>
                              <button
                                onClick={(e) => handleDeletePatient(patient, e)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete Patient</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Last Visit:</span>
                        <div className="font-medium text-gray-900">{formatDate(patient.lastVisited)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Follow-up Status:</span>
                        <div className={`font-medium ${patient.followUpStatus === 'pending'
                          ? 'text-orange-600'
                          : patient.followUpStatus === 'overdue'
                            ? 'text-red-600'
                            : 'text-green-600'
                          }`}>
                          {patient.followUpStatus === 'pending'
                            ? `Due: ${formatDate(patient.nextExpected)}`
                            : patient.followUpStatus === 'overdue'
                              ? `Overdue: ${formatDate(patient.nextExpected)}`
                              : 'No pending follow-up'
                          }
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNewPrescription(patient);
                        }}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>New Prescription</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop view */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Last Visit
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Next Expected
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  {filteredPatients.map((patient, index) => (
                    <tr key={patient.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap" onClick={() => onPatientSelect(patient)}>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{patient.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-500">
                            {patient.gender} • {patient.age} years
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-800 dark:text-gray-300 font-medium" onClick={() => onPatientSelect(patient)}>
                        {patient.id}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap" onClick={() => onPatientSelect(patient)}>
                        <div className="flex items-center text-xs text-gray-800 dark:text-gray-300">
                          <Phone className="w-3 h-3 mr-2 text-gray-500" />
                          {patient.phone}
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-800 dark:text-gray-300" onClick={() => onPatientSelect(patient)}>
                        {formatDate(patient.lastVisited)}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-800 dark:text-gray-300" onClick={() => onPatientSelect(patient)}>
                        {formatDate(patient.nextExpected)}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNewPrescription(patient);
                            }}
                            className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 px-2 py-1 rounded-md flex items-center space-x-1 font-medium transition-colors text-xs"
                          >
                            <FileText className="w-3 h-3" />
                            <span>New Prescription</span>
                          </button>

                          <div
                            className="relative ml-4"
                            ref={el => dropdownRefs.current[patient.id] = el}
                          >
                            <button
                              onClick={(e) => handleDropdownToggle(patient.id, e)}
                              className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {dropdownOpen === patient.id && (
                              <div className={`absolute ${index >= filteredPatients.length - 3 ? 'bottom-full mb-2' : 'top-full mt-2'
                                } right-0 w-48 bg-white dark:bg-gray-900 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700`}>
                                <div className="py-1">
                                  <button
                                    onClick={(e) => handleDeletePatient(patient, e)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-800 flex items-center space-x-2 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete Patient</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={handleCancelDelete}
        isLoading={confirmDialog.isLoading}
      />
    </>
  );
}