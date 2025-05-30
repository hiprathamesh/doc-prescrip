'use client';

import { User, Phone, FileText } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

export default function PatientList({ patients, onPatientSelect, onNewPrescription }) {
  if (patients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
        <p className="text-gray-500 mb-4">Start by creating a new prescription for a patient.</p>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Visit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Next Expected
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {patients.map((patient) => (
              <tr key={patient.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap" onClick={() => onPatientSelect(patient)}>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                    <div className="text-sm text-gray-500">
                      {patient.gender} • {patient.age} years
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" onClick={() => onPatientSelect(patient)}>
                  {patient.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap" onClick={() => onPatientSelect(patient)}>
                  <div className="flex items-center text-sm text-gray-900">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {patient.phone}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" onClick={() => onPatientSelect(patient)}>
                  {formatDate(patient.lastVisited)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" onClick={() => onPatientSelect(patient)}>
                  {formatDate(patient.nextExpected)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewPrescription(patient);
                    }}
                    className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                  >
                    <FileText className="w-4 h-4" />
                    <span>New Prescription</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}