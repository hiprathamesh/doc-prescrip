'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, DollarSign, Calendar, Phone, User, Trash2, MoreVertical, Pill, Download, Share2 } from 'lucide-react';
import { storage } from '../utils/storage';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import SharePDFButton from './SharePDFButton';

export default function PatientDetails({ patient, onBack, onNewPrescription }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);
  const [activeTab, setActiveTab] = useState('prescriptions');
  const [dropdownOpen, setDropdownOpen] = useState(null);

  useEffect(() => {
    if (patient) {
      loadPatientData();
    }
  }, [patient]);

  const loadPatientData = async () => {
    try {
      const patientPrescriptions = await storage.getPrescriptionsByPatient(patient.id);
      const patientBills = await storage.getBillsByPatient(patient.id);
      
      // Ensure we have arrays and sort them
      const prescriptionsArray = Array.isArray(patientPrescriptions) ? patientPrescriptions : [];
      const billsArray = Array.isArray(patientBills) ? patientBills : [];
      
      setPrescriptions(prescriptionsArray.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate)));
      setBills(billsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Error loading patient data:', error);
      setPrescriptions([]);
      setBills([]);
    }
  };

  const toggleBillPayment = async (billId) => {
    try {
      const allBills = await storage.getBills();
      const billToUpdate = allBills.find(b => b.id === billId);
      
      if (!billToUpdate) return;

      const updatedBill = {
        ...billToUpdate,
        isPaid: !billToUpdate.isPaid,
        paidAt: !billToUpdate.isPaid ? new Date() : null
      };

      // Regenerate bill PDF with new status
      const { generateBillPDF } = await import('../utils/billGenerator');
      const newBillBlob = await generateBillPDF(updatedBill, patient);
      const newBillUrl = URL.createObjectURL(newBillBlob);
      updatedBill.pdfUrl = newBillUrl;

      const updatedBills = allBills.map(bill => 
        bill.id === billId ? updatedBill : bill
      );
      
      await storage.saveBills(updatedBills);
      loadPatientData();
    } catch (error) {
      console.error('Error updating bill payment status:', error);
      alert('Failed to update payment status');
    }
  };

  const deletePrescription = async (prescriptionId) => {
    if (window.confirm('Are you sure you want to delete this prescription? This action cannot be undone.')) {
      const allPrescriptions = await storage.getPrescriptions();
      const updatedPrescriptions = allPrescriptions.filter(p => p.id !== prescriptionId);
      await storage.savePrescriptions(updatedPrescriptions);
      loadPatientData();
    }
  };

  const deleteBill = async (billId) => {
    if (window.confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
      const allBills = await storage.getBills();
      const updatedBills = allBills.filter(b => b.id !== billId);
      await storage.saveBills(updatedBills);
      loadPatientData();
      setDropdownOpen(null);
    }
  };

  const formatMedicationTiming = (timing) => {
    if (!timing) return 'As prescribed';
    const timings = [];
    if (timing.morning) timings.push('M');
    if (timing.afternoon) timings.push('A');
    if (timing.evening) timings.push('E');
    if (timing.night) timings.push('N');
    return timings.length > 0 ? timings.join('-') : 'As prescribed';
  };

  const downloadPrescription = async (prescription) => {
    try {
      // Check if PDF URL is valid and regenerate if needed
      const validUrl = await storage.regeneratePDFIfNeeded(prescription, patient, 'prescription');
      
      if (validUrl) {
        const a = document.createElement('a');
        a.href = validUrl;
        a.download = `prescription-${patient.name}-${formatDate(prescription.visitDate)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert('Failed to generate PDF for download');
      }
    } catch (error) {
      console.error('Error downloading prescription:', error);
      alert('Failed to download prescription');
    }
  };

  const downloadBill = async (bill) => {
    try {
      // Check if PDF URL is valid and regenerate if needed
      const validUrl = await storage.regeneratePDFIfNeeded(bill, patient, 'bill');
      
      if (validUrl) {
        const a = document.createElement('a');
        a.href = validUrl;
        a.download = `bill-${patient.name}-${formatDate(bill.createdAt)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert('Failed to generate PDF for download');
      }
    } catch (error) {
      console.error('Error downloading bill:', error);
      alert('Failed to download bill');
    }
  };

  const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const paidBills = bills.filter(bill => bill.isPaid).reduce((sum, bill) => sum + bill.amount, 0);
  const pendingBills = totalBills - paidBills;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{patient.name}</h1>
            <p className="text-sm sm:text-base text-gray-600 font-medium">Patient ID: {patient.id}</p>
          </div>
        </div>
        <button
          onClick={onNewPrescription}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <FileText className="w-4 h-4" />
          <span>New Prescription</span>
        </button>
      </div>

      {/* Patient Info Card */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900">Patient Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Gender</p>
              <p className="text-sm sm:text-base font-medium text-gray-900 capitalize">{patient.gender}</p>
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">Age</p>
            <p className="text-sm sm:text-base font-medium text-gray-900">{patient.age} years</p>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Phone</p>
              <p className="text-sm sm:text-base font-medium text-gray-900">{patient.phone}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Last Visit</p>
              <p className="text-sm sm:text-base font-medium text-gray-900">{formatDate(patient.lastVisited)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bills Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Bills</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">₹{totalBills}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Paid</p>
              <p className="text-lg sm:text-xl font-bold text-green-600">₹{paidBills}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Pending</p>
              <p className="text-lg sm:text-xl font-bold text-red-600">₹{pendingBills}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 min-w-max">
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'prescriptions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Prescriptions ({prescriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'bills'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Bills ({bills.length})
            </button>
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              {prescriptions.length === 0 ? (
                <p className="text-gray-600 text-center py-6 sm:py-8">No prescriptions found</p>
              ) : (
                prescriptions.map((prescription) => (
                  <div key={prescription.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50 relative">
                    {/* Delete button for prescription */}
                    <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                      <button
                        onClick={() => setDropdownOpen(dropdownOpen === `prescription-${prescription.id}` ? null : `prescription-${prescription.id}`)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {dropdownOpen === `prescription-${prescription.id}` && (
                        <div className="absolute right-0 mt-2 w-60 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            {prescription.pdfUrl && (
                              <>
                                <button
                                  onClick={() => {
                                    downloadPrescription(prescription);
                                    setDropdownOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Download Prescription</span>
                                </button>
                                <SharePDFButton
                                  pdfUrl={prescription.pdfUrl}
                                  filename={`prescription-${patient.name}-${formatDate(prescription.visitDate)}.pdf`}
                                  phone={patient.phone}
                                  type="prescription"
                                  patientName={patient.name}
                                  visitDate={formatDate(prescription.visitDate)}
                                  className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center space-x-2"
                                  variant="dropdown"
                                  onShare={() => setDropdownOpen(null)}
                                  prescription={prescription}
                                  patient={patient}
                                />
                              </>
                            )}
                            <button
                              onClick={() => deletePrescription(prescription.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete Prescription</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 pr-6 sm:pr-8">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                          Visit on {formatDate(prescription.visitDate)}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {formatDateTime(prescription.createdAt)}
                        </p>
                      </div>
                      {prescription.followUpDate && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium mt-2 sm:mt-0 self-start">
                          Follow-up: {formatDate(prescription.followUpDate)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Symptoms</h4>
                        <ul className="space-y-1">
                          {prescription.symptoms.map((symptom) => (
                            <li key={symptom.id} className="text-gray-700">
                              {symptom.name} ({symptom.severity}) - {symptom.duration}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Diagnosis</h4>
                        <ul className="space-y-1">
                          {prescription.diagnosis.map((diag) => (
                            <li key={diag.id} className="text-gray-700">{diag.name}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Medications */}
                      {prescription.medications?.length > 0 && (
                        <div className="col-span-1 md:col-span-1">
                          <h5 className="font-semibold text-gray-700 mb-2 flex items-center">
                            <Pill className="w-4 h-4 mr-2" />
                            Medications
                          </h5>
                          <div className="space-y-2">
                            {prescription.medications.map((med, index) => (
                              <div key={index} className="bg-green-50 p-2 sm:p-3 rounded-lg border border-green-200">
                                <div className="font-medium text-green-800 text-xs sm:text-sm">{med.name}</div>
                                <div className="text-xs text-green-700 space-y-1">
                                  <div>Dosage: {med.dosage}</div>
                                  <div>Timing: {formatMedicationTiming(med.timing)}</div>
                                  <div>Meal: {med.mealTiming?.replace('_', ' ') || 'after meal'}</div>
                                  {med.duration && <div>Duration: {med.duration}</div>}
                                  {med.remarks && <div>Remarks: {med.remarks}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {prescription.doctorNotes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h4 className="font-medium text-gray-800 mb-1 text-sm">Doctor's Notes</h4>
                        <p className="text-gray-700 text-xs sm:text-sm">{prescription.doctorNotes}</p>
                      </div>
                    )}

                    {prescription.advice && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h4 className="font-medium text-gray-800 mb-1 text-sm">Advice</h4>
                        <p className="text-gray-700 text-xs sm:text-sm">{prescription.advice}</p>
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
                <p className="text-gray-600 text-center py-6 sm:py-8">No bills found</p>
              ) : (
                bills.map((bill) => (
                  <div key={bill.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50 relative space-y-3 sm:space-y-0">
                    <div className="flex-1 pr-6 sm:pr-0">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base">{bill.description}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Created: {formatDateTime(bill.createdAt)}
                      </p>
                      {bill.isPaid && bill.paidAt && (
                        <p className="text-xs sm:text-sm text-green-700 font-medium">
                          Paid: {formatDateTime(bill.paidAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                      <span className="text-base sm:text-lg font-bold text-gray-900">₹{bill.amount}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleBillPayment(bill.id)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            bill.isPaid
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {bill.isPaid ? 'Paid' : 'Pending'}
                        </button>
                        
                        {/* Delete button for bill */}
                        <div className="relative">
                          <button
                            onClick={() => setDropdownOpen(dropdownOpen === `bill-${bill.id}` ? null : `bill-${bill.id}`)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {dropdownOpen === `bill-${bill.id}` && (
                            <div className="absolute right-0 mt-2 w-60 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                              <div className="py-1">
                                {bill.pdfUrl && (
                                  <>
                                    <button
                                      onClick={() => {
                                        downloadBill(bill);
                                        setDropdownOpen(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
                                    >
                                      <Download className="w-4 h-4" />
                                      <span>Download Bill</span>
                                    </button>
                                    <SharePDFButton
                                      pdfUrl={bill.pdfUrl}
                                      filename={`bill-${patient.name}-${formatDate(bill.createdAt)}.pdf`}
                                      phone={patient.phone}
                                      type="bill"
                                      patientName={patient.name}
                                      billDate={formatDate(bill.createdAt)}
                                      amount={bill.amount}
                                      isPaid={bill.isPaid}
                                      className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center space-x-2"
                                      variant="dropdown"
                                      onShare={() => setDropdownOpen(null)}
                                      bill={bill}
                                      patient={patient}
                                    />
                                  </>
                                )}
                                <button
                                  onClick={() => deleteBill(bill.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete Bill</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setDropdownOpen(null)}
        />
      )}
    </div>
  );
}