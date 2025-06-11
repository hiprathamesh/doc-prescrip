'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Share2, FileText, CheckCircle } from 'lucide-react';
import { generateMedicalCertificatePDF } from '../utils/medicalCertificatePDFGenerator';
import { formatDate } from '../utils/dateUtils';
import SharePDFButton from './SharePDFButton';

export default function MedicalCertificateSuccess({ certificate, patient, onBack }) {
  const [certificatePdfUrl, setCertificatePdfUrl] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(true);

  useEffect(() => {
    generatePdf();
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

  const downloadCertificate = () => {
    if (certificatePdfUrl) {
      const a = document.createElement('a');
      a.href = certificatePdfUrl;
      a.download = `medical-certificate-${certificate.patientName}-${formatDate(certificate.issuedDate)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
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
              Medical Certificate Generated Successfully
            </h1>
          </div>
        </div>

        {/* Certificate Summary */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Certificate Summary</h2>
          
          {/* Patient Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <div>
              <span className="text-sm font-semibold text-gray-700">Patient</span>
              <p className="text-gray-900 font-medium">{certificate.patientName}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700">Age</span>
              <p className="text-gray-900 font-medium">{certificate.age} years</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700">Sex</span>
              <p className="text-gray-900 font-medium">{certificate.sex}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700">Date</span>
              <p className="text-gray-900 font-medium">{formatDate(certificate.issuedDate)}</p>
            </div>
          </div>

          {/* Certificate Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Certificate Purpose</h3>
              <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                {certificate.certificateFor}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Fitness Status</h3>
              <div className={`text-sm font-medium p-3 rounded-lg border ${
                certificate.fitnessStatus === 'fit' 
                  ? 'bg-green-50 text-green-800 border-green-200' 
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {certificate.fitnessStatus === 'fit' ? 'Medically Fit' : 'Medically Unfit'}
              </div>
            </div>

            {certificate.remarks && (
              <div className="md:col-span-2">
                <h3 className="font-semibold text-gray-800 mb-3">Remarks</h3>
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {certificate.remarks}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PDF Actions */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900">Medical Certificate PDF</h3>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={downloadCertificate}
                disabled={!certificatePdfUrl || isGeneratingPdf}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                />
              )}
            </div>
          </div>

          {isGeneratingPdf ? (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="w-8 h-8 animate-spin mx-auto border-4 border-green-500 border-t-transparent rounded-full mb-2"></div>
                <p className="text-gray-500">Generating PDF...</p>
              </div>
            </div>
          ) : certificatePdfUrl ? (
            <iframe
              src={certificatePdfUrl}
              className="w-full h-64 border border-gray-300 rounded-lg"
              title="Medical Certificate PDF Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Failed to generate PDF</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
