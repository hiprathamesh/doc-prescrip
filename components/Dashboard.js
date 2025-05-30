'use client';

import { useState, useEffect } from 'react';
import PatientList from './PatientList';
import PatientDetails from './PatientDetails';
import NewPrescription from './NewPrescription';
import { Plus, Search } from 'lucide-react';
import { storage } from '../utils/storage';

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'details' | 'prescription'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load patients from localStorage
    const savedPatients = storage.getPatients();
    setPatients(savedPatients);
  }, []);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setCurrentView('details');
  };

  const handleNewPrescription = (patient = null) => {
    setSelectedPatient(patient);
    setCurrentView('prescription');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedPatient(null);
  };

  const handlePatientUpdate = (updatedPatients) => {
    setPatients(updatedPatients);
    storage.savePatients(updatedPatients);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Dr. Practice Management
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={() => handleNewPrescription()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
              >
                <Plus size={20} />
                <span>New Prescription</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'list' && (
          <div>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients by name, ID, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <PatientList
              patients={filteredPatients}
              onPatientSelect={handlePatientSelect}
              onNewPrescription={handleNewPrescription}
            />
          </div>
        )}

        {currentView === 'details' && selectedPatient && (
          <PatientDetails
            patient={selectedPatient}
            onBack={handleBackToList}
            onNewPrescription={() => handleNewPrescription(selectedPatient)}
          />
        )}

        {currentView === 'prescription' && (
          <NewPrescription
            patient={selectedPatient}
            patients={patients}
            onBack={handleBackToList}
            onPatientUpdate={handlePatientUpdate}
          />
        )}
      </main>
    </div>
  );
}