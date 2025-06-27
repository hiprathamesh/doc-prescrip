'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, FileText, DollarSign, CheckCircle, Pill, FlaskConical, Calendar, User, Phone } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';
import { storage } from '../utils/storage';
import { generateBillPDF } from '../utils/billGenerator';
import { sendWhatsApp, generateWhatsAppMessage } from '../utils/whatsapp';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import SharePDFButton from './SharePDFButton';
import { toast } from 'sonner';
import useScrollToTop from '../hooks/useScrollToTop';

export default function PrescriptionSuccess({ prescription, patient, bill, onBack }) {
  const [prescriptionPdfUrl, setPrescriptionPdfUrl] = useState(null);
  const [billPdfUrl, setBillPdfUrl] = useState(null);
  const [isGeneratingPrescriptionPdf, setIsGeneratingPrescriptionPdf] = useState(false);
  const [isGeneratingBillPdf, setIsGeneratingBillPdf] = useState(false);
  const [currentBill, setCurrentBill] = useState(bill);

  // Add refs and state for floating header
  const successHeaderRef = useRef(null);
  const [isSuccessHeaderVisible, setIsSuccessHeaderVisible] = useState(true);

  // Add scroll to top when component mounts
  useScrollToTop();

  useEffect(() => {
    // Since PDFs are already generated, just set the URLs
    if (prescription.pdfUrl) {
      setPrescriptionPdfUrl(prescription.pdfUrl);
    }
    if (bill && bill.pdfUrl) {
      setBillPdfUrl(bill.pdfUrl);
    }
  }, [prescription, bill]);

  // Reset header visibility when component mounts
  useEffect(() => {
    setIsSuccessHeaderVisible(true);
  }, []);

  // Intersection Observer for success header visibility
  useEffect(() => {
    const successHeaderElement = successHeaderRef.current;

    if (!successHeaderElement) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setIsSuccessHeaderVisible(true);
      return;
    }

    const rootMarginTop = "-81px";

    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries && entries.length > 0 && entries[0]) {
          const entry = entries[0];
          setIsSuccessHeaderVisible(entry.isIntersecting);
        }
      },
      {
        root: null,
        rootMargin: `${rootMarginTop} 0px 0px 0px`,
        threshold: 0,
      }
    );

    observer.observe(successHeaderElement);

    return () => {
      if (successHeaderElement) {
        observer.unobserve(successHeaderElement);
      }
    };
  }, []);

  const generatePdfs = async () => {
    // This function is no longer needed since PDFs are pre-generated
    // But keeping it for backward compatibility
    try {
      setIsGeneratingPrescriptionPdf(true);

      if (!prescription.pdfUrl) {
        const prescriptionBlob = await generatePDF(prescription, patient, false);
        const prescriptionUrl = URL.createObjectURL(prescriptionBlob);
        setPrescriptionPdfUrl(prescriptionUrl);
      }

      if (bill && !bill.pdfUrl) {
        setIsGeneratingBillPdf(true);
        const billBlob = await generateBillPDF(bill, patient);
        const billUrl = URL.createObjectURL(billBlob);
        setBillPdfUrl(billUrl);
        setIsGeneratingBillPdf(false);
      }
    } catch (error) {
      console.error('Error generating PDFs:', error);
    } finally {
      setIsGeneratingPrescriptionPdf(false);
    }
  };

  const downloadPrescription = () => {
    if (prescriptionPdfUrl) {
      const a = document.createElement('a');
      a.href = prescriptionPdfUrl;
      a.download = `prescription-${patient.name}-${formatDate(prescription.visitDate)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success('Download Started', {
        description: 'Prescription PDF download has started'
      });
    }
  };

  const toggleBillPayment = async () => {
    if (!currentBill) return;

    try {
      // Only set loading state for bill PDF
      setIsGeneratingBillPdf(true);

      // Update bill status
      const updatedBill = {
        ...currentBill,
        isPaid: !currentBill.isPaid,
        paidAt: !currentBill.isPaid ? new Date() : null
      };

      // Update bill in storage
      const allBills = await storage.getBills();
      const updatedBills = allBills.map(b =>
        (b.id === currentBill.id || b.billId === currentBill.billId) ? updatedBill : b
      );
      await storage.saveBills(updatedBills);

      // Regenerate bill PDF with new status
      const { generateBillPDF } = await import('../utils/billGenerator');
      const newBillBlob = await generateBillPDF(updatedBill, patient);
      const newBillUrl = URL.createObjectURL(newBillBlob);

      // Update the bill with new PDF URL in storage
      updatedBill.pdfUrl = newBillUrl;
      const finalUpdatedBills = allBills.map(b =>
        (b.id === currentBill.id || b.billId === currentBill.billId) ? updatedBill : b
      );
      await storage.saveBills(finalUpdatedBills);

      // Update local state
      setCurrentBill(updatedBill);
      setBillPdfUrl(newBillUrl);

    } catch (error) {
      console.error('Error updating bill payment status:', error);
      alert('Failed to update payment status');
    } finally {
      // Only reset loading state for bill PDF
      setIsGeneratingBillPdf(false);
    }
  };

  const downloadBill = () => {
    if (billPdfUrl) {
      const a = document.createElement('a');
      a.href = billPdfUrl;
      a.download = `bill-${patient.name}-${formatDate(currentBill.createdAt)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success('Download Started', {
        description: 'Bill PDF download has started'
      });
    }
  };

  const sharePrescription = () => {
    const message = generateWhatsAppMessage(patient.name, formatDate(prescription.visitDate));
    sendWhatsApp(patient.phone, message);
  };

  const shareBill = () => {
    const message = `Hello ${patient.name},

Your bill for the consultation on ${formatDate(bill.createdAt)} is ready.

Amount: ₹${bill.amount}
Status: ${bill.isPaid ? 'Paid' : 'Pending'}

Thank you for visiting us.

Best regards,
Dr. Prashant Nikam`;
    sendWhatsApp(patient.phone, message);
  };

  const formatMedicationTiming = (timing) => {
    if (!timing) return '1-0-1-0'; // Default pattern

    const morning = timing.morning ? '1' : '0';
    const afternoon = timing.afternoon ? '1' : '0';
    const evening = timing.evening ? '1' : '0';
    const night = timing.night ? '1' : '0';

    return `${morning}-${afternoon}-${evening}-${night}`;
  };

  return (
    <>
      {/* Floating header */}
      <div
        className={`fixed left-0 right-0 z-30 transition-transform duration-300 ease-in-out
          ${isSuccessHeaderVisible ? '-translate-y-full' : 'translate-y-0'}
        `}
        style={{ top: '81px' }}
      >
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-5xl mx-auto px-6 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-md font-semibold text-gray-900 dark:text-gray-100">Prescription Saved Successfully</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 min-h-screen">
        {/* Header */}
        <div ref={successHeaderRef} className="success-header">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">Prescription Saved Successfully</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium text-green-600">Completed</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 space-y-6">
          {/* Patient Info Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="text-gray-600">Patient</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{patient.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="text-gray-600">Age</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{patient.age} years</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="text-gray-600">Phone</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{patient.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="text-gray-600">Date</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(prescription.visitDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Prescription Summary */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">Prescription Summary</h2>

            {/* Visit Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
              {/* Symptoms */}
              {prescription.symptoms?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-300 mb-2">Symptoms</h4>
                  <div className="space-y-1">
                    {prescription.symptoms.map((symptom) => (
                      <div key={symptom.id} className="text-gray-700 dark:text-gray-400 text-xs">
                        <span className="font-medium">{symptom.name}</span>
                        <span className="text-gray-500"> • {symptom.severity} • {symptom.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Diagnosis */}
              {prescription.diagnosis?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-300 mb-2">Diagnosis</h4>
                  <div className="space-y-1">
                    {prescription.diagnosis.map((diag, index) => (
                      <div key={index} className="text-xs text-gray-700 dark:text-gray-400">
                        <span className="font-medium">{diag.name}</span>
                        {diag.description && <p className="text-gray-500 mt-0.5">{diag.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications */}
              {prescription.medications?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-300 mb-2 flex items-center">
                    <Pill className="w-4 h-4 mr-1" />
                    Medications
                  </h4>
                  <div className="space-y-1">
                    {prescription.medications.map((med, medIndex) => (
                      <div key={medIndex} className="text-gray-700 dark:text-gray-400 text-xs">
                        <span className="font-medium">{med.name}</span>
                        <span className="text-gray-500"> • {med.dosage} • {formatMedicationTiming(med.timing)}</span>
                        {med.duration && <span className="text-gray-500"> • {med.duration}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Tests */}
              {prescription.labResults?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-300 mb-2 flex items-center">
                    <FlaskConical className="w-4 h-4 mr-1" />
                    Lab Tests
                  </h4>
                  <div className="space-y-1">
                    {prescription.labResults.map((lab, index) => (
                      <div key={index} className="text-xs text-gray-700 dark:text-gray-400">
                        <div className="font-medium">{lab.testName}</div>
                        {lab.remarks && (
                          <div className="text-gray-500 mt-0.5">Remarks: {lab.remarks}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Doctor Notes and Advice */}
            {(prescription.doctorNotes || prescription.advice) && (
              <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {prescription.doctorNotes && (
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-300 mb-2">Doctor's Notes</h4>
                    <div className="text-xs text-gray-700 dark:text-gray-400">
                      {prescription.doctorNotes.split('\n').map((note, index) => (
                        <div key={index} className="mb-1">• {note}</div>
                      ))}
                    </div>
                  </div>
                )}

                {prescription.advice && (
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-300 mb-2">Patient Advice</h4>
                    <div className="text-xs text-gray-700 dark:text-gray-400">
                      {prescription.advice.split('\n').map((advice, index) => (
                        <div key={index} className="mb-1">• {advice}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Follow-up Information */}
            {prescription.followUpDate && (
              <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-base">
                <h4 className="font-medium text-gray-800 dark:text-gray-300 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Follow-up {prescription.followUpStatus === 'completed' ? 'Completed' : 'Scheduled'}
                </h4>
                <div className="text-sm text-gray-700 dark:text-gray-400" >
                  {prescription.followUpStatus === 'completed'
                    ? `Follow-up was completed on: ${formatDate(prescription.followUpCompletedDate)}`
                    : `Next appointment: ${formatDate(prescription.followUpDate)}`
                  }
                </div>
              </div>
            )}
          </div>

          {/* PDF Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prescription PDF */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Prescription PDF</h3>
                </div>
              </div>

              {isGeneratingPrescriptionPdf ? (
                <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="w-6 h-6 animate-spin mx-auto border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
                    <p className="text-gray-500 text-sm">Generating PDF...</p>
                  </div>
                </div>
              ) : prescriptionPdfUrl ? (
                <iframe
                  src={prescriptionPdfUrl}
                  className="w-full flex-1 h-70 border border-gray-300 dark:border-gray-700 rounded-lg"
                  title="Prescription PDF Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-sm">Failed to generate PDF</p>
                </div>
              )}
              <div className="flex space-x-3 mt-4 justify-end">
                <button
                  onClick={downloadPrescription}
                  disabled={!prescriptionPdfUrl || isGeneratingPrescriptionPdf}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white dark:text-gray-900 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <SharePDFButton
                  pdfUrl={prescriptionPdfUrl}
                  filename={`prescription-${patient.name}-${formatDate(prescription.visitDate)}.pdf`}
                  phone={patient.phone}
                  disabled={!prescriptionPdfUrl || isGeneratingPrescriptionPdf}
                  type="prescription"
                  patientName={patient.name}
                  visitDate={formatDate(prescription.visitDate)}
                  prescription={prescription}
                  patient={patient}
                />
              </div>
            </div>

            {/* Bill PDF */}
            {currentBill && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bill PDF</h3>
                  </div>
                </div>

                {isGeneratingBillPdf ? (
                  <div className="flex items-center justify-center h-48 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-green-100 dark:border-gray-600 relative overflow-hidden">
                    {/* Background pulse animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-emerald-100/50 dark:from-green-900/20 dark:to-emerald-900/20 animate-pulse"></div>
                    
                    <div className="relative z-10 text-center">
                      {/* Main loading dots animation */}
                      <div className="flex items-center justify-center space-x-2 mb-4">
                        <div className="flex space-x-1">
                          <div 
                            className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                            style={{
                              animation: 'bounce 1.4s ease-in-out infinite both',
                              animationDelay: '0s'
                            }}
                          ></div>
                          <div 
                            className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                            style={{
                              animation: 'bounce 1.4s ease-in-out infinite both',
                              animationDelay: '0.2s'
                            }}
                          ></div>
                          <div 
                            className="w-2 h-2 bg-green-700 rounded-full animate-bounce"
                            style={{
                              animation: 'bounce 1.4s ease-in-out infinite both',
                              animationDelay: '0.4s'
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Text with subtle animation */}
                      <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                        Updating Bill...
                      </p>
                      <p className="text-green-600 dark:text-green-400 text-xs mt-1 opacity-75">
                        Please wait while we process your changes
                      </p>
                    </div>

                    {/* Custom CSS for animations */}
                    <style jsx>{`
                      @keyframes bounce {
                        0%, 80%, 100% {
                          transform: scale(1) translateY(0);
                          opacity: 0.7;
                        }
                        40% {
                          transform: scale(1.2) translateY(-10px);
                          opacity: 1;
                        }
                      }
                    `}</style>
                  </div>
                ) : billPdfUrl ? (
                  <iframe
                    src={billPdfUrl}
                    className="w-full h-48 border border-gray-300 dark:border-gray-700 rounded-lg"
                    title="Bill PDF Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-sm">Failed to generate bill</p>
                  </div>
                )}

                {/* Bill Summary with Payment Toggle */}
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800 text-sm">Amount: ₹{currentBill.amount}</span>
                    <button
                      onClick={toggleBillPayment}
                      disabled={isGeneratingBillPdf}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${currentBill.isPaid
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                    >
                      {currentBill.isPaid ? 'Paid' : 'Pending'}
                    </button>
                  </div>
                  <p className="text-xs text-green-700 mt-1">{currentBill.description}</p>
                  {currentBill.isPaid && currentBill.paidAt && (
                    <p className="text-xs text-green-600 mt-1">
                      Paid: {formatDateTime(currentBill.paidAt)}
                    </p>
                  )}
                </div>
                <div className="flex space-x-3 mt-4 justify-end">
                  <button
                    onClick={downloadBill}
                    disabled={!billPdfUrl || isGeneratingBillPdf}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white dark:text-gray-900 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  <SharePDFButton
                    pdfUrl={billPdfUrl}
                    filename={`bill-${patient.name}-${formatDate(currentBill.createdAt)}.pdf`}
                    phone={patient.phone}
                    disabled={!billPdfUrl || isGeneratingBillPdf}
                    type="bill"
                    patientName={patient.name}
                    billDate={formatDate(currentBill.createdAt)}
                    amount={currentBill.amount}
                    isPaid={currentBill.isPaid}
                    bill={currentBill}
                    patient={patient}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
