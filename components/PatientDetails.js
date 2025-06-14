'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, FileText, Phone, User, Trash2, MoreVertical, Pill, Download, Share2, Calendar, MapPin, Clock, CreditCard, CheckCircle } from 'lucide-react';
import { storage } from '../utils/storage';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import SharePDFButton from './SharePDFButton';
import { useToast } from '../contexts/ToastContext';

export default function PatientDetails({ patient, onBack, onNewPrescription }) {
  const [visits, setVisits] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [showFloatingHeader, setShowFloatingHeader] = useState(false);
  const headerRef = useRef(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    if (patient) {
      loadPatientData();
    }
  }, [patient]);

  // Replace the scroll-based useEffect with IntersectionObserver
  useEffect(() => {
    const headerElement = headerRef.current;

    if (!headerElement) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      console.warn('[IntersectionObserver Effect] IntersectionObserver API not available in this browser.');
      setIsHeaderVisible(true); // Fallback
      return;
    }

    // Assuming your main fixed/sticky dashboard header is 64px tall.
    const rootMarginTop = "-64px";

    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries && entries.length > 0 && entries[0]) {
          const entry = entries[0];
          // When entry.isIntersecting is false, show floating header
          setIsHeaderVisible(entry.isIntersecting);
        }
      },
      {
        root: null, // Observe intersections relative to the viewport.
        rootMargin: `${rootMarginTop} 0px 0px 0px`, // Top margin adjusted for the main header
        threshold: [0, 0.01], // Trigger when even a tiny part enters/leaves the adjusted viewport boundary.
      }
    );

    observer.observe(headerElement);

    return () => {
      observer.unobserve(headerElement);
    };
  }, []);

  const loadPatientData = async () => {
    try {
      const patientPrescriptions = await storage.getPrescriptionsByPatient(patient.id);
      const patientBills = await storage.getBillsByPatient(patient.id);

      const prescriptionsArray = Array.isArray(patientPrescriptions) ? patientPrescriptions : [];
      const billsArray = Array.isArray(patientBills) ? patientBills : [];

      // Combine prescriptions with their corresponding bills
      const combinedVisits = prescriptionsArray.map(prescription => {
        const correspondingBill = billsArray.find(bill =>
          Math.abs(new Date(bill.createdAt) - new Date(prescription.createdAt)) < 24 * 60 * 60 * 1000
        );
        return {
          ...prescription,
          bill: correspondingBill
        };
      });

      setVisits(combinedVisits.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate)));
    } catch (error) {
      console.error('Error loading patient data:', error);
      setVisits([]);
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

      const { generateBillPDF } = await import('../utils/billGenerator');
      const newBillBlob = await generateBillPDF(updatedBill, patient);
      const newBillUrl = URL.createObjectURL(newBillBlob);
      updatedBill.pdfUrl = newBillUrl;

      const updatedBills = allBills.map(bill =>
        bill.id === billId ? updatedBill : bill
      );

      await storage.saveBills(updatedBills);
      loadPatientData();

      addToast({
        title: updatedBill.isPaid ? 'Payment Received' : 'Payment Marked Pending',
        description: `Bill payment status updated successfully`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating bill payment status:', error);
      addToast({
        title: 'Error',
        description: 'Failed to update payment status',
        type: 'error'
      });
    }
  };

  const deleteVisit = async (prescriptionId, billId) => {
    if (window.confirm('Are you sure you want to delete this visit record? This action cannot be undone.')) {
      try {
        // Delete prescription
        const allPrescriptions = await storage.getPrescriptions();
        const updatedPrescriptions = allPrescriptions.filter(p => p.id !== prescriptionId);
        await storage.savePrescriptions(updatedPrescriptions);

        // Delete bill if exists
        if (billId) {
          const allBills = await storage.getBills();
          const updatedBills = allBills.filter(b => b.id !== billId);
          await storage.saveBills(updatedBills);
        }

        loadPatientData();
        setDropdownOpen(null);

        addToast({
          title: 'Visit Deleted',
          description: 'Visit record has been deleted successfully',
          type: 'success'
        });
      } catch (error) {
        console.error('Error deleting visit:', error);
        addToast({
          title: 'Error',
          description: 'Failed to delete visit record',
          type: 'error'
        });
      }
    }
  };

  const downloadPrescription = async (prescription) => {
    try {
      const validUrl = await storage.regeneratePDFIfNeeded(prescription, patient, 'prescription');

      if (validUrl) {
        const a = document.createElement('a');
        a.href = validUrl;
        a.download = `prescription-${patient.name}-${formatDate(prescription.visitDate)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        addToast({
          title: 'Download Started',
          description: 'Prescription PDF is being downloaded',
          type: 'success'
        });
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error downloading prescription:', error);
      addToast({
        title: 'Download Failed',
        description: 'Failed to download prescription',
        type: 'error'
      });
    }
  };

  const downloadBill = async (bill) => {
    try {
      const validUrl = await storage.regeneratePDFIfNeeded(bill, patient, 'bill');

      if (validUrl) {
        const a = document.createElement('a');
        a.href = validUrl;
        a.download = `bill-${patient.name}-${formatDate(bill.createdAt)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        addToast({
          title: 'Download Started',
          description: 'Bill PDF is being downloaded',
          type: 'success'
        });
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error downloading bill:', error);
      addToast({
        title: 'Download Failed',
        description: 'Failed to download bill',
        type: 'error'
      });
    }
  };

  const formatMedicationTiming = (timing) => {
    if (!timing) return 'As prescribed';
    const timings = [];
    if (timing.morning) timings.push('Morning');
    if (timing.afternoon) timings.push('Afternoon');
    if (timing.evening) timings.push('Evening');
    if (timing.night) timings.push('Night');
    return timings.length > 0 ? timings.join(', ') : 'As prescribed';
  };

  const getMedicalHistory = () => {
    const allDiagnoses = visits.flatMap(visit => visit.diagnosis || []);
    const uniqueDiagnoses = [...new Set(allDiagnoses.map(d => d.name))];
    return uniqueDiagnoses;
  };

  const totalBills = visits.reduce((sum, visit) => sum + (visit.bill?.amount || 0), 0);
  const paidBills = visits.filter(visit => visit.bill?.isPaid).reduce((sum, visit) => sum + (visit.bill?.amount || 0), 0);
  const pendingBills = totalBills - paidBills;

  const HeaderContent = ({ isFloating = false }) => (
    <div className={`${isFloating ? 'px-6 py-4' : ''} flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0`}>
      <div className="flex items-center space-x-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className='flex items-center gap-2'>
          <h1 className="text-xl sm:text-xl font-semibold text-gray-900">{patient.name}</h1>
          <p className="text-sm sm:text-sm text-gray-600">ID: {patient.id}</p>
        </div>
      </div>
      <button
        onClick={onNewPrescription}
        className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors shadow-sm"
      >
        <FileText className="w-4 h-4" />
        <span>New Visit</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Floating Header */}
      <div
        className={`fixed left-0 right-0 z-30 transition-transform duration-300 ease-in-out
          ${isHeaderVisible ? '-translate-y-full' : 'translate-y-0'}
        `}
        style={{ top: '81px' }}
      >
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-3">
            <div className={` flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0`}>
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div className='flex items-center gap-2'>
                  <h1 className="text-md sm:text-md font-semibold text-gray-900">{patient.name}</h1>
                  <p className="text-xs sm:text-md text-gray-600">ID: {patient.id}</p>
                </div>
              </div>
              <button
                onClick={onNewPrescription}
                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-md text-sm font-medium flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>New Visit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div ref={headerRef}>
        <HeaderContent />
      </div>

      {/* Patient EMR Card */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Electronic Medical Record</h2>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Last Visit: {formatDate(patient.lastVisited)}</span>
          </div>
        </div>

        {/* Patient Demographics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-gray-600">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Demographics</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-900">{patient.gender}, {patient.age} years</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-gray-600">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">Contact</span>
            </div>
            <p className="text-sm text-gray-900">{patient.phone}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-gray-600">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">Billing</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-600">Total: ₹{totalBills}</p>
              <p className="text-xs text-green-600">Paid: ₹{paidBills}</p>
              {pendingBills > 0 && <p className="text-xs text-red-600">Pending: ₹{pendingBills}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-gray-600">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Visits</span>
            </div>
            <p className="text-sm text-gray-900">{visits.length} total</p>
          </div>
        </div>

        {/* Medical History */}
        {getMedicalHistory().length > 0 && (
          <>
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Medical History</h3>
              <div className="flex flex-wrap gap-2">
                {getMedicalHistory().map((condition, index) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-800 border border-red-200">
                    {condition}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Visit Timeline */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Visit Timeline</h2>

        {visits.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No visits recorded yet</p>
            <p className="text-sm text-gray-500 mt-1">Start by creating a new visit</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div className="space-y-8">
              {visits.map((visit, index) => (
                <div key={visit.id} className="relative flex items-start space-x-4">
                  {/* Timeline circle */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="absolute top-14 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 font-medium whitespace-nowrap">
                      {formatDate(visit.visitDate)}
                    </div>
                  </div>

                  {/* Visit Card */}
                  <div className="flex-1 bg-gray-50 rounded-lg p-4 relative">
                    {/* More options */}
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => setDropdownOpen(dropdownOpen === visit.id ? null : visit.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {dropdownOpen === visit.id && (
                        <div className="absolute right-0 mt-2 w-60 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            {visit.pdfUrl && (
                              <>
                                <button
                                  onClick={() => {
                                    downloadPrescription(visit);
                                    setDropdownOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Download Prescription</span>
                                </button>
                                <SharePDFButton
                                  pdfUrl={visit.pdfUrl}
                                  filename={`prescription-${patient.name}-${formatDate(visit.visitDate)}.pdf`}
                                  phone={patient.phone}
                                  type="prescription"
                                  patientName={patient.name}
                                  visitDate={formatDate(visit.visitDate)}
                                  className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center space-x-2"
                                  variant="dropdown"
                                  onShare={() => setDropdownOpen(null)}
                                  prescription={visit}
                                  patient={patient}
                                />
                              </>
                            )}
                            {visit.bill?.pdfUrl && (
                              <>
                                <button
                                  onClick={() => {
                                    downloadBill(visit.bill);
                                    setDropdownOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 flex items-center space-x-2"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Download Bill</span>
                                </button>
                                <SharePDFButton
                                  pdfUrl={visit.bill.pdfUrl}
                                  filename={`bill-${patient.name}-${formatDate(visit.bill.createdAt)}.pdf`}
                                  phone={patient.phone}
                                  type="bill"
                                  patientName={patient.name}
                                  billDate={formatDate(visit.bill.createdAt)}
                                  amount={visit.bill.amount}
                                  isPaid={visit.bill.isPaid}
                                  className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center space-x-2"
                                  variant="dropdown"
                                  onShare={() => setDropdownOpen(null)}
                                  bill={visit.bill}
                                  patient={patient}
                                />
                              </>
                            )}
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={() => deleteVisit(visit.id, visit.bill?.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete Visit</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Visit Header */}
                    <div className="flex items-center justify-between mb-3 pr-8">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">
                          {visit.isFollowUpVisit ? 'Follow-up Visit' : 'Regular Visit'}
                        </h3>
                        {visit.bill && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">₹{visit.bill.amount}</span>
                            <button
                              onClick={() => toggleBillPayment(visit.bill.id)}
                              className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${visit.bill.isPaid
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                            >
                              {visit.bill.isPaid && <CheckCircle className="w-3 h-3" />}
                              <span>{visit.bill.isPaid ? 'Paid' : 'Pending'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDateTime(visit.createdAt)}
                      </div>
                    </div>

                    {/* Visit Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {/* Symptoms */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Symptoms</h4>
                        <div className="space-y-1">
                          {visit.symptoms.map((symptom) => (
                            <div key={symptom.id} className="text-gray-700 text-xs">
                              <span className="font-medium">{symptom.name}</span>
                              <span className="text-gray-500"> • {symptom.severity} • {symptom.duration}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Diagnosis */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Diagnosis</h4>
                        <div className="space-y-1">
                          {visit.diagnosis.map((diag) => (
                            <span key={diag.id} className="inline-block bg-red-50 text-red-800 text-xs px-2 py-1 rounded-full mr-1 mb-1 border border-red-200">
                              {diag.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Medications */}
                      {visit.medications?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                            <Pill className="w-4 h-4 mr-1" />
                            Medications
                          </h4>
                          <div className="space-y-2">
                            {visit.medications.map((med, medIndex) => (
                              <div key={medIndex} className="bg-green-50 p-2 rounded border border-green-200">
                                <div className="font-medium text-green-800 text-xs">{med.name}</div>
                                <div className="text-xs text-green-700 space-y-0.5">
                                  <div>{med.dosage} • {formatMedicationTiming(med.timing)}</div>
                                  <div>{med.mealTiming?.replace('_', ' ') || 'after meal'}</div>
                                  {med.duration && <div>{med.duration}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lab Tests */}
                      {visit.labResults?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Lab Tests</h4>
                          <div className="space-y-1">
                            {visit.labResults.map((lab, labIndex) => (
                              <div key={labIndex} className="bg-purple-50 p-2 rounded border border-purple-200">
                                <div className="font-medium text-purple-800 text-xs">{lab.testName}</div>
                                {lab.remarks && (
                                  <div className="text-xs text-purple-700 mt-1">{lab.remarks}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes and Advice */}
                    {(visit.doctorNotes || visit.advice) && (
                      <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
                        {visit.doctorNotes && (
                          <div>
                            <span className="text-xs font-medium text-gray-800">Notes: </span>
                            <span className="text-xs text-gray-700">{visit.doctorNotes}</span>
                          </div>
                        )}
                        {visit.advice && (
                          <div>
                            <span className="text-xs font-medium text-gray-800">Advice: </span>
                            <span className="text-xs text-gray-700">{visit.advice}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Follow-up */}
                    {visit.followUpDate && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-800">Follow-up:</span>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${visit.followUpStatus === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : visit.followUpStatus === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {formatDate(visit.followUpDate)}
                            {visit.followUpStatus === 'completed' && ' ✓'}
                            {visit.followUpStatus === 'overdue' && ' (Overdue)'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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