'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Download, FileText, DollarSign, CheckCircle } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';
import { storage } from '../utils/storage';
import { generateBillPDF } from '../utils/billGenerator';
import { sendWhatsApp, generateWhatsAppMessage } from '../utils/whatsapp';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import SharePDFButton from './SharePDFButton';
import { useToast } from '../contexts/ToastContext';

export default function PrescriptionSuccess({ prescription, patient, bill, onBack }) {
  const [prescriptionPdfUrl, setPrescriptionPdfUrl] = useState(null);
  const [billPdfUrl, setBillPdfUrl] = useState(null);
  const [isGeneratingPdfs, setIsGeneratingPdfs] = useState(true);
  const [currentBill, setCurrentBill] = useState(bill);
  const { addToast } = useToast();

  useEffect(() => {
    // Since PDFs are already generated, just set the URLs
    if (prescription.pdfUrl) {
      setPrescriptionPdfUrl(prescription.pdfUrl);
    }
    if (bill && bill.pdfUrl) {
      setBillPdfUrl(bill.pdfUrl);
    }
    setIsGeneratingPdfs(false);
  }, [prescription, bill]);

  const generatePdfs = async () => {
    // This function is no longer needed since PDFs are pre-generated
    // But keeping it for backward compatibility
    try {
      setIsGeneratingPdfs(true);
      
      if (!prescription.pdfUrl) {
        const prescriptionBlob = await generatePDF(prescription, patient, false);
        const prescriptionUrl = URL.createObjectURL(prescriptionBlob);
        setPrescriptionPdfUrl(prescriptionUrl);
      }

      if (bill && !bill.pdfUrl) {
        const billBlob = await generateBillPDF(bill, patient);
        const billUrl = URL.createObjectURL(billBlob);
        setBillPdfUrl(billUrl);
      }
    } catch (error) {
      console.error('Error generating PDFs:', error);
    } finally {
      setIsGeneratingPdfs(false);
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
      
      addToast({
        title: 'Download Started',
        description: 'Prescription PDF download has started',
        type: 'success',
        duration: 3000
      });
    }
  };

  const toggleBillPayment = async () => {
    if (!currentBill) return;
    
    try {
      setIsGeneratingPdfs(true);
      
      // Update bill status
      const updatedBill = {
        ...currentBill,
        isPaid: !currentBill.isPaid,
        paidAt: !currentBill.isPaid ? new Date() : null
      };

      // Update bill in storage
      const allBills = await storage.getBills();
      const updatedBills = allBills.map(b => 
        b.id === currentBill.id ? updatedBill : b
      );
      await storage.saveBills(updatedBills);

      // Regenerate bill PDF with new status
      const { generateBillPDF } = await import('../utils/billGenerator');
      const newBillBlob = await generateBillPDF(updatedBill, patient);
      const newBillUrl = URL.createObjectURL(newBillBlob);

      // Update the bill with new PDF URL in storage
      updatedBill.pdfUrl = newBillUrl;
      const finalUpdatedBills = allBills.map(b => 
        b.id === currentBill.id ? updatedBill : b
      );
      await storage.saveBills(finalUpdatedBills);

      // Update local state
      setCurrentBill(updatedBill);
      setBillPdfUrl(newBillUrl);
      
    } catch (error) {
      console.error('Error updating bill payment status:', error);
      alert('Failed to update payment status');
    } finally {
      setIsGeneratingPdfs(false);
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
      
      addToast({
        title: 'Download Started',
        description: 'Bill PDF download has started',
        type: 'success',
        duration: 3000
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
    if (!timing) return 'As prescribed';
    const timings = [];
    if (timing.morning) timings.push('M');
    if (timing.afternoon) timings.push('A');
    if (timing.evening) timings.push('E');
    if (timing.night) timings.push('N');
    return timings.length > 0 ? timings.join('-') : 'As prescribed';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Prescription Saved Successfully
            </h1>
          </div>
        </div>

        {/* Prescription Summary */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Prescription Summary</h2>
          
          {/* Patient Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <div>
              <span className="text-sm font-semibold text-gray-700">Patient</span>
              <p className="text-gray-900 font-medium">{patient.name}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700">Age</span>
              <p className="text-gray-900 font-medium">{patient.age} years</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700">Phone</span>
              <p className="text-gray-900 font-medium">{patient.phone}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700">Date</span>
              <p className="text-gray-900 font-medium">{formatDate(prescription.visitDate)}</p>
            </div>
          </div>

          {/* Prescription Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Symptoms */}
            {prescription.symptoms?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Symptoms</h3>
                <div className="space-y-2">
                  {prescription.symptoms.map((symptom, index) => (
                    <div key={index} className="text-sm text-gray-700 bg-orange-50 p-2 rounded-lg border border-orange-200">
                      {symptom.name} ({symptom.severity}) - {symptom.duration}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnosis */}
            {prescription.diagnosis?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Diagnosis</h3>
                <div className="space-y-2">
                  {prescription.diagnosis.map((diag, index) => (
                    <div key={index} className="text-sm text-gray-700 bg-blue-50 p-2 rounded-lg border border-blue-200">
                      {diag.name}
                      {diag.description && <p className="text-xs text-gray-600 mt-1">{diag.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medications */}
            {prescription.medications?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Medications</h3>
                <div className="space-y-2">
                  {prescription.medications.map((med, index) => (
                    <div key={index} className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="font-medium">{med.name}</div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Dosage: {med.dosage}</div>
                        <div>Timing: {formatMedicationTiming(med.timing)}</div>
                        <div>Meal: {med.mealTiming?.replace('_', ' ') || 'after meal'}</div>
                        {med.duration && <div>Duration: {med.duration}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lab Tests */}
            {prescription.labResults?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Lab Tests</h3>
                <div className="space-y-2">
                  {prescription.labResults.map((lab, index) => (
                    <div key={index} className="text-sm text-gray-700 bg-purple-50 p-2 rounded-lg border border-purple-200">
                      <div className="font-medium">{lab.testName}</div>
                      {lab.remarks && (
                        <div className="text-xs text-gray-600 mt-1">Remarks: {lab.remarks}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Doctor Notes and Advice */}
          {(prescription.doctorNotes || prescription.advice) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200">
              {prescription.doctorNotes && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Doctor's Notes</h3>
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {prescription.doctorNotes.split('\n').map((note, index) => (
                      <div key={index} className="mb-1">• {note}</div>
                    ))}
                  </div>
                </div>
              )}

              {prescription.advice && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Patient Advice</h3>
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {prescription.advice.split('\n').map((advice, index) => (
                      <div key={index} className="mb-1">• {advice}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PDF Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Prescription PDF */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Prescription PDF</h3>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={downloadPrescription}
                  disabled={!prescriptionPdfUrl || isGeneratingPdfs}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <SharePDFButton
                  pdfUrl={prescriptionPdfUrl}
                  filename={`prescription-${patient.name}-${formatDate(prescription.visitDate)}.pdf`}
                  phone={patient.phone}
                  disabled={!prescriptionPdfUrl || isGeneratingPdfs}
                  type="prescription"
                  patientName={patient.name}
                  visitDate={formatDate(prescription.visitDate)}
                  prescription={prescription}
                  patient={patient}
                />
              </div>
            </div>

            {isGeneratingPdfs ? (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="w-8 h-8 animate-spin mx-auto border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
                  <p className="text-gray-500">Generating PDF...</p>
                </div>
              </div>
            ) : prescriptionPdfUrl ? (
              <iframe
                src={prescriptionPdfUrl}
                className="w-full h-64 border border-gray-300 rounded-lg"
                title="Prescription PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Failed to generate PDF</p>
              </div>
            )}
          </div>

          {/* Bill PDF */}
          {currentBill && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-bold text-gray-900">Bill PDF</h3>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={downloadBill}
                    disabled={!billPdfUrl || isGeneratingPdfs}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  <SharePDFButton
                    pdfUrl={billPdfUrl}
                    filename={`bill-${patient.name}-${formatDate(currentBill.createdAt)}.pdf`}
                    phone={patient.phone}
                    disabled={!billPdfUrl || isGeneratingPdfs}
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

              {isGeneratingPdfs ? (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="w-8 h-8 animate-spin mx-auto border-4 border-green-500 border-t-transparent rounded-full mb-2"></div>
                    <p className="text-gray-500">Updating Bill...</p>
                  </div>
                </div>
              ) : billPdfUrl ? (
                <iframe
                  src={billPdfUrl}
                  className="w-full h-64 border border-gray-300 rounded-lg"
                  title="Bill PDF Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Failed to generate bill</p>
                </div>
              )}

              {/* Bill Summary with Payment Toggle */}
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-green-800">Amount: ₹{currentBill.amount}</span>
                  <button
                    onClick={toggleBillPayment}
                    disabled={isGeneratingPdfs}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      currentBill.isPaid
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {currentBill.isPaid ? 'Paid' : 'Pending'}
                  </button>
                </div>
                <p className="text-sm text-green-700 mt-1">{currentBill.description}</p>
                {currentBill.isPaid && currentBill.paidAt && (
                  <p className="text-xs text-green-600 mt-1">
                    Paid: {formatDateTime(currentBill.paidAt)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Follow-up Information */}
        {prescription.followUpDate && (
          <div className={`mt-8 p-6 rounded-2xl border-2 ${
            prescription.followUpStatus === 'completed' 
              ? 'bg-green-50 border-green-200' 
              : prescription.followUpStatus === 'overdue'
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${
              prescription.followUpStatus === 'completed' 
                ? 'text-green-800' 
                : prescription.followUpStatus === 'overdue'
                ? 'text-red-800'
                : 'text-yellow-800'
            }`}>
              Follow-up {prescription.followUpStatus === 'completed' ? 'Completed' : 'Scheduled'}
            </h3>
            <p className={`${
              prescription.followUpStatus === 'completed' 
                ? 'text-green-700' 
                : prescription.followUpStatus === 'overdue'
                ? 'text-red-700'
                : 'text-yellow-700'
            }`}>
              {prescription.followUpStatus === 'completed' 
                ? `Follow-up was completed on: ${formatDate(prescription.followUpCompletedDate)}`
                : `Next appointment: ${formatDate(prescription.followUpDate)}`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
