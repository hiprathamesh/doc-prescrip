'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, DollarSign, Calendar, Phone, User } from 'lucide-react';
import { storage } from '../utils/storage';
import { formatDate, formatDateTime } from '../utils/dateUtils';

export default function PatientDetails({ patient, onBack, onNewPrescription }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);
  const [activeTab, setActiveTab] = useState('prescriptions');

  useEffect(() => {
    if (patient) {
      const patientPrescriptions = storage.getPrescriptionsByPatient(patient.id);
      const patientBills = storage.getBillsByPatient(patient.id);
      setPrescriptions(patientPrescriptions.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate)));
      setBills(patientBills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }
  }, [patient]);

  const toggleBillPayment = (billId) => {
    const allBills = storage.getBills();
    const updatedBills = allBills.map(bill => 
      bill.id === billId 
        ? { ...bill, isPaid: !bill.isPaid, paidAt: !bill.isPaid ? new Date() : null }
        : bill
    );
    storage.saveBills(updatedBills);
    setBills(storage.getBillsByPatient(patient.id));
  };

  const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const paidBills = bills.filter(bill => bill.isPaid).reduce((sum, bill) => sum + bill.amount, 0);
  const pendingBills = totalBills - paidBills;

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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
            <p className="text-gray-500">Patient ID: {patient.id}</p>
          </div>
        </div>
        <button
          onClick={onNewPrescription}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
        >
          <FileText className="w-4 h-4" />
          <span>New Prescription</span>
        </button>
      </div>

      {/* Patient Info Card */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="font-medium capitalize">{patient.gender}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Age</p>
            <p className="font-medium">{patient.age} years</p>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{patient.phone}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Last Visit</p>
              <p className="font-medium">{formatDate(patient.lastVisited)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bills Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Total Bills</p>
              <p className="text-xl font-bold text-gray-900">₹{totalBills}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Paid</p>
              <p className="text-xl font-bold text-green-600">₹{paidBills}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-red-600">₹{pendingBills}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'prescriptions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Prescriptions ({prescriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bills'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Bills ({bills.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              {prescriptions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No prescriptions found</p>
              ) : (
                prescriptions.map((prescription) => (
                  <div key={prescription.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Visit on {formatDate(prescription.visitDate)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(prescription.createdAt)}
                        </p>
                      </div>
                      {prescription.followUpDate && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          Follow-up: {formatDate(prescription.followUpDate)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Symptoms</h4>
                        <ul className="space-y-1">
                          {prescription.symptoms.map((symptom) => (
                            <li key={symptom.id} className="text-gray-600">
                              {symptom.name} ({symptom.severity}) - {symptom.duration}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Diagnosis</h4>
                        <ul className="space-y-1">
                          {prescription.diagnosis.map((diag) => (
                            <li key={diag.id} className="text-gray-600">{diag.name}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Medications</h4>
                        <ul className="space-y-1">
                          {prescription.medications.map((med) => (
                            <li key={med.id} className="text-gray-600">
                              {med.name} - {med.dosage} ({med.timing.replace('_', ' ')})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {prescription.doctorNotes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-1">Doctor's Notes</h4>
                        <p className="text-gray-600 text-sm">{prescription.doctorNotes}</p>
                      </div>
                    )}

                    {prescription.advice && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-1">Advice</h4>
                        <p className="text-gray-600 text-sm">{prescription.advice}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'bills' && (
            <div className="space-y-4">
              {bills.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No bills found</p>
              ) : (
                bills.map((bill) => (
                  <div key={bill.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{bill.description}</h3>
                      <p className="text-sm text-gray-500">
                        Created: {formatDateTime(bill.createdAt)}
                      </p>
                      {bill.isPaid && bill.paidAt && (
                        <p className="text-sm text-green-600">
                          Paid: {formatDateTime(bill.paidAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-bold text-gray-900">₹{bill.amount}</span>
                      <button
                        onClick={() => toggleBillPayment(bill.id)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          bill.isPaid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {bill.isPaid ? 'Paid' : 'Pending'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}