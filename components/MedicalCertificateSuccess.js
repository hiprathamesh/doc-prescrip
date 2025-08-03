'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, FileText, CheckCircle, User, Phone, Calendar } from 'lucide-react';
import { generateMedicalCertificatePDF } from '../utils/medicalCertificatePDFGenerator';
import { formatDate } from '../utils/dateUtils';
import SharePDFButton from './SharePDFButton';
import { activityLogger } from '../utils/activityLogger';
import { toast } from 'sonner';
import useScrollToTop from '../hooks/useScrollToTop';

export default function MedicalCertificateSuccess({ certificate, patient, onBack }) {
  const [certificatePdfUrl, setCertificatePdfUrl] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(true);

  // Add refs and state for floating header
  const successHeaderRef = useRef(null);
  const [isSuccessHeaderVisible, setIsSuccessHeaderVisible] = useState(true);

  // Add scroll to top when component mounts
  useScrollToTop();

  useEffect(() => {
    generatePdf();
  }, []);

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

    const rootMarginTop = "-88px";

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

  const generatePdf = async () => {
    try {
      setIsGeneratingPdf(true);

      // Generate certificate PDF
      const certificateBlob = await generateMedicalCertificatePDF(certificate, patient, false);
      const certificateUrl = URL.createObjectURL(certificateBlob);
      setCertificatePdfUrl(certificateUrl);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const downloadCertificate = async () => {
    if (certificatePdfUrl) {
      const a = document.createElement('a');
      a.href = certificatePdfUrl;
      a.download = `medical-certificate-${certificate.patientName}-${formatDate(certificate.issuedDate)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Log download activity
      if (patient) {
        await activityLogger.logMedicalCertificatePDFDownloaded(patient, certificate.certificateFor);
      }

      toast.success('Download Started', {
        description: 'Medical certificate PDF download has started'
      });
    }
  };

  return (
    <>
      {/* Floating header */}
      <div
        className={`fixed left-0 right-0 z-30 transition-transform duration-300 ease-in-out
          ${isSuccessHeaderVisible ? '-translate-y-full' : 'translate-y-0'}
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
                <span className="text-md font-semibold text-gray-900 dark:text-gray-100">Medical Certificate Generated Successfully</span>
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
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">Medical Certificate Generated Successfully</span>
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
                  <span className="text-gray-600 dark:text-gray-400">Patient</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{certificate.patientName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Age</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{certificate.age} years</p>
                </div>
              </div>
              {patient && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Phone</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{patient.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Date</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(certificate.issuedDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Certificate Summary */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">Certificate Summary</h2>

            {/* Certificate Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              {/* Certificate Purpose */}
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Certificate Purpose</h4>
                <div className="text-gray-700 dark:text-gray-400 text-xs py-3">
                  {certificate.certificateFor}
                </div>
              </div>

              {/* Fitness Status */}
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Fitness Status</h4>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${certificate.fitnessStatus === 'fit'
                    ? 'bg-green-500'
                    : 'bg-red-500'
                    }`}></div>
                  <div className={`text-xs font-medium py-2 ${certificate.fitnessStatus === 'fit'
                    ? 'text-gray-700 dark:text-gray-400'
                    : 'text-gray-700 dark:text-gray-400'
                    }`}>
                    {certificate.fitnessStatus === 'fit' ? 'Medically Fit' : 'Medically Unfit'}
                  </div>
                </div>
              </div>

              {/* Physical Details */}
              {(certificate.height || certificate.weight || certificate.build) && (
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Physical Details</h4>
                  <div className="space-y-1">
                    {certificate.height && (
                      <div className="text-xs text-gray-700 dark:text-gray-400">
                        <span className="font-medium">Height:</span> {certificate.height}
                      </div>
                    )}
                    {certificate.weight && (
                      <div className="text-xs text-gray-700 dark:text-gray-400">
                        <span className="font-medium">Weight:</span> {certificate.weight}
                      </div>
                    )}
                    {certificate.build && (
                      <div className="text-xs text-gray-700 dark:text-gray-400">
                        <span className="font-medium">Build:</span> {certificate.build}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vital Signs */}
              {(certificate.pulse || certificate.bp || certificate.vision) && (
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Vital Signs</h4>
                  <div className="space-y-1">
                    {certificate.pulse && (
                      <div className="text-xs text-gray-700 dark:text-gray-400">
                        <span className="font-medium">Pulse:</span> {certificate.pulse}
                      </div>
                    )}
                    {certificate.bp && (
                      <div className="text-xs text-gray-700 dark:text-gray-400">
                        <span className="font-medium">BP:</span> {certificate.bp}
                      </div>
                    )}
                    {certificate.vision && (
                      <div className="text-xs text-gray-700 dark:text-gray-400">
                        <span className="font-medium">Vision:</span> {certificate.vision}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* System Examination */}
              {(certificate.lungs || certificate.cardiovascularSystem || certificate.liver || certificate.spleen) && (
                <div className="md:col-span-2">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">System Examination</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {certificate.lungs && (
                      <div className="text-xs text-gray-700 dark:text-gray-400">
                        <span className="font-medium">Lungs:</span> {certificate.lungs}
                      </div>
                    )}
                    {certificate.cardiovascularSystem && (
                      <div className="text-xs text-gray-700 dark:text-gray-400">
                        <span className="font-medium">CVS:</span> {certificate.cardiovascularSystem}
                      </div>
                    )}
                    {certificate.liver && (
                      <div className="text-xs text-gray-700 dark:text-gray-400">
                        <span className="font-medium">Liver:</span> {certificate.liver}
                      </div>
                    )}
                    {certificate.spleen && (
                      <div className="text-xs text-gray-700 dark:text-gray-400">
                        <span className="font-medium">Spleen:</span> {certificate.spleen}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Remarks */}
            {certificate.remarks && (
              <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Remarks</h4>
                <div className="text-xs text-gray-700 dark:text-gray-400 py-3">
                  {certificate.remarks}
                </div>
              </div>
            )}
          </div>

          {/* PDF Actions */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Medical Certificate PDF</h3>
              </div>
            </div>

            {isGeneratingPdf ? (
              <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="w-6 h-6 animate-spin mx-auto border-4 border-green-500 border-t-transparent rounded-full mb-2"></div>
                  <p className="text-gray-500 text-sm">Generating PDF...</p>
                </div>
              </div>
            ) : certificatePdfUrl ? (
              <iframe
                src={certificatePdfUrl}
                className="w-full h-100 border border-gray-300 rounded-lg"
                title="Medical Certificate PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">Failed to generate PDF</p>
              </div>
            )}

            <div className="flex space-x-3 mt-4 justify-end">
              <button
                onClick={downloadCertificate}
                disabled={!certificatePdfUrl || isGeneratingPdf}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white dark:text-gray-900 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm cursor-pointer font-medium"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              {patient && (
                <SharePDFButton
                  pdfUrl={certificatePdfUrl}
                  filename={`medical-certificate-${certificate.patientName}-${formatDate(certificate.issuedDate)}.pdf`}
                  phone={patient.phone}
                  disabled={!certificatePdfUrl || isGeneratingPdf}
                  type="certificate"
                  patientName={certificate.patientName}
                  certificateDate={formatDate(certificate.issuedDate)}
                  certificateFor={certificate.certificateFor}
                  certificate={certificate}
                  patient={patient}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
