'use client';

import { User, Phone, FileText, Trash2, MoreVertical } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { useState, useRef, useEffect } from 'react';

export default function PatientList({ patients, onPatientSelect, onNewPrescription, onPatientDelete }) {
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const dropdownRefs = useRef({});

  const handleDeletePatient = (patient, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete patient ${patient.name}? This will permanently remove all their data including prescriptions and bills.`)) {
      onPatientDelete(patient.id);
    }
    setDropdownOpen(null);
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

  if (patients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
        <p className="text-gray-600 mb-4">Start by creating a new prescription for a patient.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Patients ({patients.length})</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Last Visit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Next Expected
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {patients.map((patient, index) => (
              <tr key={patient.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-6 py-4 whitespace-nowrap" onClick={() => onPatientSelect(patient)}>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                    <div className="text-sm text-gray-600">
                      {patient.gender} • {patient.age} years
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium" onClick={() => onPatientSelect(patient)}>
                  {patient.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap" onClick={() => onPatientSelect(patient)}>
                  <div className="flex items-center text-sm text-gray-800">
                    <Phone className="w-4 h-4 mr-2 text-gray-500" />
                    {patient.phone}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800" onClick={() => onPatientSelect(patient)}>
                  {formatDate(patient.lastVisited)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800" onClick={() => onPatientSelect(patient)}>
                  {formatDate(patient.nextExpected)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNewPrescription(patient);
                      }}
                      className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 font-medium transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      <span>New Prescription</span>
                    </button>
                    
                    <div 
                      className="relative"
                      ref={el => dropdownRefs.current[patient.id] = el}
                    >
                      <button
                        onClick={(e) => handleDropdownToggle(patient.id, e)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {dropdownOpen === patient.id && (
                        <div className={`absolute ${
                          // Position dropdown above if it's one of the last 3 items
                          index >= patients.length - 3 ? 'bottom-full mb-2' : 'top-full mt-2'
                        } right-0 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200`}>
                          <div className="py-1">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}