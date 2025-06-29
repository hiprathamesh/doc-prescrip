'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, FileText, Phone, User, Trash2, MoreVertical, Pill, Download, Share2, Calendar, MapPin, Clock, CreditCard, CheckCircle } from 'lucide-react';
import { storage } from '../utils/storage';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import SharePDFButton from './SharePDFButton';
import ConfirmationDialog from './ConfirmationDialog';
import { toast } from 'sonner';
import { activityLogger } from '../utils/activityLogger';
import useScrollToTop from '../hooks/useScrollToTop';

// Loading skeleton component for medical history
const MedicalHistorySkeleton = () => (
  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3 animate-pulse"></div>
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse"></div>
      ))}
    </div>
  </div>
);

// Loading skeleton component for visit timeline
const VisitTimelineSkeleton = () => (
  <div className="relative">
    {/* Timeline line skeleton */}
    <div className="absolute left-6 top-6 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600"></div>

    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="relative">
          {/* Timeline circle and date row skeleton */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse border-4 border-white dark:border-gray-900"></div>
            </div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1 animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
          </div>

          {/* Visit Card skeleton */}
          <div className="ml-16 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 border-gray-100 rounded-lg p-4 relative">
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-3 pr-8">
              <div className="flex items-center space-x-3">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
              </div>
            </div>

            {/* Content skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {Array.from({ length: 3 }).map((_, colIndex) => (
                <div key={colIndex}>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function PatientDetails({ patient, onBack, onNewPrescription }) {
  const [visits, setVisits] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [showFloatingHeader, setShowFloatingHeader] = useState(false);
  const headerRef = useRef(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  
  // Add loading states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [medicalHistory, setMedicalHistory] = useState([]);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    isLoading: false,
    onConfirm: null
  });

  // Add scroll to top when component mounts or patient changes
  useScrollToTop([patient?.id]);

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
      if (headerElement) {
        observer.unobserve(headerElement);
      }
    };
  }, []);

  const loadPatientData = async () => {
    setIsLoadingData(true);
    try {
      const patientPrescriptions = await storage.getPrescriptionsByPatient(patient.id);
      const patientBills = await storage.getBillsByPatient(patient.id);
      
      // Load medical certificates for this patient
      const allCertificates = JSON.parse(localStorage.getItem('medicalCertificates') || '[]');
      const patientCertificates = allCertificates.filter(cert => cert.patientId === patient.id);

      const prescriptionsArray = Array.isArray(patientPrescriptions) ? patientPrescriptions : [];
      const billsArray = Array.isArray(patientBills) ? patientBills : [];
      const certificatesArray = Array.isArray(patientCertificates) ? patientCertificates : [];

      // Combine prescriptions with their corresponding bills
      const prescriptionVisits = prescriptionsArray.map(prescription => {
        // Find the bill that specifically belongs to this prescription
        const correspondingBill = billsArray.find(bill => {
          // First try to match by prescriptionId (most accurate)
          if (bill.prescriptionId && prescription.prescriptionId) {
            return bill.prescriptionId === prescription.prescriptionId;
          }
          
          // Fallback: match by date and patient (within 1 hour window for better accuracy)
          const billDate = new Date(bill.createdAt);
          const prescriptionDate = new Date(prescription.createdAt);
          const timeDifference = Math.abs(billDate.getTime() - prescriptionDate.getTime());
          const tenSec = 10000; // 1 hour in milliseconds
          
          return bill.patientId === prescription.patientId && timeDifference <= tenSec;
        });
        
        // Use visitDate if available, otherwise fall back to createdAt
        const visitDateTime = prescription.visitDate ? new Date(prescription.visitDate) : new Date(prescription.createdAt);
        
        return {
          ...prescription,
          type: 'prescription',
          bill: correspondingBill,
          sortDate: visitDateTime,
          displayDate: visitDateTime
        };
      });

      // Add medical certificates as timeline items with proper date handling
      const certificateVisits = certificatesArray.map(certificate => {
        // Use the actual timestamp from issuedDate or createdAt, preserving the full DateTime
        let certificateDateTime;
        if (certificate.issuedDate) {
          // If issuedDate is already a Date object or proper timestamp, use it
          certificateDateTime = new Date(certificate.issuedDate);
        } else if (certificate.createdAt) {
          certificateDateTime = new Date(certificate.createdAt);
        } else {
          certificateDateTime = new Date();
        }
        
        return {
          ...certificate,
          type: 'certificate',
          id: certificate.id + '_cert',
          sortDate: certificateDateTime,
          displayDate: certificateDateTime
        };
      });

      // Combine all visits and sort by date (most recent first)
      const allVisits = [...prescriptionVisits, ...certificateVisits];
      
      // Sort by sortDate in descending order (most recent first) with proper date comparison
      const sortedVisits = allVisits.sort((a, b) => {
        const dateA = new Date(a.sortDate);
        const dateB = new Date(b.sortDate);
        
        // Ensure we have valid dates
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        
        return dateB.getTime() - dateA.getTime(); // Most recent first
      });
      
      setVisits(sortedVisits);
      
      // Calculate medical history from visits
      const calculatedMedicalHistory = getMedicalHistory(sortedVisits);
      setMedicalHistory(calculatedMedicalHistory);
    } catch (error) {
      console.error('Error loading patient data:', error);
      setVisits([]);
      setMedicalHistory([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const toggleBillPayment = async (billId) => {
    try {
      // Find the visit and bill to update
      const visitToUpdate = visits.find(visit => 
        visit.bill && (visit.bill.id === billId || visit.bill.billId === billId)
      );
      
      if (!visitToUpdate || !visitToUpdate.bill) {
        toast.error('Error', {
          description: 'Bill not found'
        });
        return;
      }

      const originalBill = { ...visitToUpdate.bill };
      const updatedBill = {
        ...originalBill,
        isPaid: !originalBill.isPaid,
        paidAt: !originalBill.isPaid ? new Date() : null
      };

      // Optimistically update the visits state
      const optimisticVisits = visits.map(visit => {
        if (visit.bill && (visit.bill.id === billId || visit.bill.billId === billId)) {
          return {
            ...visit,
            bill: updatedBill
          };
        }
        return visit;
      });
      setVisits(optimisticVisits);

      // Update storage
      const allBills = await storage.getBills();
      const billToUpdate = allBills.find(b => b.id === billId || b.billId === billId);

      if (!billToUpdate) {
        // Rollback on error
        setVisits(visits);
        toast.error('Error', {
          description: 'Bill not found in storage'
        });
        return;
      }

      const finalUpdatedBill = {
        ...billToUpdate,
        isPaid: !billToUpdate.isPaid,
        paidAt: !billToUpdate.isPaid ? new Date() : null
      };

      // Regenerate PDF with new status
      const { generateBillPDF } = await import('../utils/billGenerator');
      const newBillBlob = await generateBillPDF(finalUpdatedBill, patient);
      const newBillUrl = URL.createObjectURL(newBillBlob);
      finalUpdatedBill.pdfUrl = newBillUrl;

      const updatedBills = allBills.map(bill =>
        (bill.id === billId || bill.billId === billId) ? finalUpdatedBill : bill
      );

      await storage.saveBills(updatedBills);
      
      // Log activity immediately after successful update
      await activityLogger.logBillPaymentUpdated(patient, finalUpdatedBill.amount, finalUpdatedBill.isPaid);
      
      // Update visits with the final bill including PDF URL
      const finalVisits = visits.map(visit => {
        if (visit.bill && (visit.bill.id === billId || visit.bill.billId === billId)) {
          return {
            ...visit,
            bill: finalUpdatedBill
          };
        }
        return visit;
      });
      setVisits(finalVisits);

      toast.success(finalUpdatedBill.isPaid ? 'Payment Received' : 'Payment Marked Pending', {
        description: `Bill payment status updated successfully`
      });
    } catch (error) {
      console.error('Error updating bill payment status:', error);
      // Rollback to original visits state on error
      loadPatientData();
      toast.error('Error', {
        description: 'Failed to update payment status'
      });
    }
  };

  const deleteVisit = async (visitId, billId, visitType = 'prescription') => {
    const title = visitType === 'certificate' ? 'Delete Medical Certificate' : 'Delete Visit Record';
    const message = visitType === 'certificate' 
      ? 'Are you sure you want to delete this medical certificate? This action cannot be undone.'
      : 'Are you sure you want to delete this visit record? This action cannot be undone.';
      
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      isLoading: false,
      onConfirm: () => handleDeleteConfirm(visitId, billId, visitType)
    });
  };

  const handleDeleteConfirm = async (visitId, billId, visitType) => {
    setConfirmDialog(prev => ({ ...prev, isLoading: true }));
    
    try {
      if (visitType === 'certificate') {
        // Delete medical certificate
        const allCertificates = JSON.parse(localStorage.getItem('medicalCertificates') || '[]');
        const updatedCertificates = allCertificates.filter(cert => cert.id !== visitId.replace('_cert', ''));
        localStorage.setItem('medicalCertificates', JSON.stringify(updatedCertificates));
      } else {
        // Delete prescription
        const allPrescriptions = await storage.getPrescriptions();
        const updatedPrescriptions = allPrescriptions.filter(p => p.id !== visitId);
        await storage.savePrescriptions(updatedPrescriptions);

        // Delete bill if exists
        if (billId) {
          const allBills = await storage.getBills();
          const updatedBills = allBills.filter(b => b.id !== billId);
          await storage.saveBills(updatedBills);
        }
      }

      // Log activity
      if (visitType === 'certificate') {
        await activityLogger.logActivity('certificate_deleted', {
          patientId: patient.id,
          patientName: patient.name,
          description: `Deleted medical certificate for ${patient.name}`
        });
      } else {
        await activityLogger.logVisitDeleted(patient.name);
      }

      loadPatientData();
      setDropdownOpen(null);
      setConfirmDialog({ isOpen: false, title: '', message: '', isLoading: false, onConfirm: null });

      toast.success(visitType === 'certificate' ? 'Certificate Deleted' : 'Visit Deleted', {
        description: visitType === 'certificate' 
          ? 'Medical certificate has been deleted successfully'
          : 'Visit record has been deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting visit:', error);
      setConfirmDialog(prev => ({ ...prev, isLoading: false }));
      toast.error('Error', {
        description: `Failed to delete ${visitType === 'certificate' ? 'certificate' : 'visit record'}`
      });
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ isOpen: false, title: '', message: '', isLoading: false, onConfirm: null });
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

        toast.success('Download Started', {
          description: 'Prescription PDF is being downloaded'
        });
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error downloading prescription:', error);
      toast.error('Download Failed', {
        description: 'Failed to download prescription'
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

        toast.success('Download Started', {
          description: 'Bill PDF is being downloaded'
        });
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error downloading bill:', error);
      toast.error('Download Failed', {
        description: 'Failed to download bill'
      });
    }
  };

  const downloadCertificate = async (certificate) => {
    try {
      const { generateMedicalCertificatePDF } = await import('../utils/medicalCertificatePDFGenerator');
      const certificateBlob = await generateMedicalCertificatePDF(certificate, patient, false);
      
      const url = URL.createObjectURL(certificateBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medical-certificate-${certificate.patientName}-${formatDate(certificate.issuedDate)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log download activity
      await activityLogger.logMedicalCertificatePDFDownloaded(patient, certificate.certificateFor);

      toast.success('Download Started', {
        description: 'Medical certificate PDF is being downloaded'
      });
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Download Failed', {
        description: 'Failed to download medical certificate'
      });
    }
  };

  const formatMedicationTiming = (timing) => {
    if (!timing) return '1-0-1-0'; // Default pattern
    
    const morning = timing.morning ? '1' : '0';
    const afternoon = timing.afternoon ? '1' : '0';
    const evening = timing.evening ? '1' : '0';
    const night = timing.night ? '1' : '0';
    
    return `${morning}-${afternoon}-${evening}-${night}`;
  };

  const formatListAsText = (items, keyField = 'name') => {
    if (!items || items.length === 0) return '';
    return items.map(item => typeof item === 'string' ? item : item[keyField]).join(', ');
  };

  const getMedicalHistory = (visitsData = visits) => {
    const allDiagnoses = visitsData.flatMap(visit => visit.diagnosis || []);
    const uniqueDiagnoses = [...new Set(allDiagnoses.map(d => d.name))];
    return uniqueDiagnoses;
  };

  const totalBills = visits.reduce((sum, visit) => sum + (visit.bill?.amount || 0), 0);
  const paidBills = visits.filter(visit => visit.bill?.isPaid).reduce((sum, visit) => sum + (visit.bill?.amount || 0), 0);
  const pendingBills = totalBills - paidBills;

  const HeaderContent = ({ isFloating = false }) => (
    <div className={`${isFloating ? 'px-6 py-4' : ''} max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0`}>
      <div className="flex items-center space-x-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className='flex items-center gap-2'>
          <h1 className="text-xl sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{patient.name}</h1>
          <p className="text-sm sm:text-sm text-gray-600">ID: {patient.id}</p>
        </div>
      </div>
      <button
        onClick={onNewPrescription}
        className="w-full sm:w-auto bg-blue-600 text-white dark:text-gray-900 px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
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
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-5xl mx-auto px-6 py-3">
            <div className={` flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0`}>
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div className='flex items-center gap-2'>
                  <h1 className="text-md sm:text-md font-semibold text-gray-900 dark:text-gray-100">{patient.name}</h1>
                  <p className="text-xs sm:text-md text-gray-600">ID: {patient.id}</p>
                </div>
              </div>
              <button
                onClick={onNewPrescription}
                className="w-full sm:w-auto bg-blue-600 text-white dark:text-gray-900 px-4 py-3 sm:py-2 rounded-md text-sm font-medium flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors cursor-pointer"
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
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Electronic Medical Record</h2>
          <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Last Visit: {formatDate(patient.lastVisited)}</span>
          </div>
        </div>

        {/* Patient Demographics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Demographics</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-900 dark:text-gray-100">{patient.gender}, {patient.age} years</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">Contact</span>
            </div>
            <p className="text-sm text-gray-900 dark:text-gray-100">{patient.phone}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">Billing</span>
            </div>
            <div className="space-y-1">
              {isLoadingData ? (
                <>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-600">Total: ₹{totalBills}</p>
                  <p className="text-xs text-green-600">Paid: ₹{paidBills}</p>
                  {pendingBills > 0 && <p className="text-xs text-red-600">Pending: ₹{pendingBills}</p>}
                </>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Visits</span>
            </div>
            {isLoadingData ? (
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
            ) : (
              <p className="text-sm text-gray-900 dark:text-gray-100">{visits.length} total</p>
            )}
          </div>
        </div>

        {/* Medical History */}
        {isLoadingData ? (
          <MedicalHistorySkeleton />
        ) : (
          medicalHistory.length > 0 && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Medical History</h3>
                <div className="flex flex-wrap gap-2">
                  {medicalHistory.map((condition, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400/30 border border-red-200 dark:border-red-400/30">
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )
        )}
      </div>

      {/* Visit Timeline */}
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Visit Timeline</h2>

        {isLoadingData ? (
          <VisitTimelineSkeleton />
        ) : visits.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No visits recorded yet</p>
            <p className="text-sm text-gray-500 mt-1">Start by creating a new visit or medical certificate</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-6 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

            <div className="space-y-8">
              {visits.map((visit, index) => (
                <div key={visit.id} className="relative">
                  {/* Timeline circle and date row */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-sm ${
                        visit.type === 'certificate' 
                          ? 'bg-green-100' 
                          : 'bg-blue-100'
                      }`}>
                        {visit.type === 'certificate' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Calendar className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                        {visit.type === 'certificate' 
                          ? formatDate(visit.displayDate)
                          : formatDate(visit.visitDate || visit.displayDate)
                        }
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDateTime(visit.displayDate)}
                      </div>
                    </div>
                  </div>

                  {/* Visit Card */}
                  <div className="ml-16 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 border-gray-50 rounded-lg p-4 relative">
                    {/* More options */}
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => setDropdownOpen(dropdownOpen === visit.id ? null : visit.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {dropdownOpen === visit.id && (
                        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-900 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-800">
                          <div className="py-1">
                            {visit.type === 'certificate' ? (
                              <>
                                <button
                                  onClick={() => {
                                    downloadCertificate(visit);
                                    setDropdownOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-2 cursor-pointer"
                                >
                                  <Download className="w-4 h-4 text-gray-500" />
                                  <span>Download Certificate</span>
                                </button>
                                <SharePDFButton
                                  pdfUrl={null}
                                  filename={`medical-certificate-${visit.patientName}-${formatDate(visit.issuedDate)}.pdf`}
                                  phone={patient.phone}
                                  type="certificate"
                                  patientName={visit.patientName}
                                  certificateDate={formatDate(visit.issuedDate)}
                                  certificateFor={visit.certificateFor}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-2 cursor-pointer"
                                  variant="dropdown"
                                  onShare={() => setDropdownOpen(null)}
                                  certificate={visit}
                                  patient={patient}
                                  customText="Share Certificate PDF"
                                />
                              </>
                            ) : (
                              <>
                                {visit.pdfUrl && (
                                  <>
                                    <button
                                      onClick={() => {
                                        downloadPrescription(visit);
                                        setDropdownOpen(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-2 cursor-pointer"
                                    >
                                      <Download className="w-4 h-4 text-gray-500" />
                                      <span>Download Prescription</span>
                                    </button>
                                    <SharePDFButton
                                      pdfUrl={visit.pdfUrl}
                                      filename={`prescription-${patient.name}-${formatDate(visit.visitDate)}.pdf`}
                                      phone={patient.phone}
                                      type="prescription"
                                      patientName={patient.name}
                                      visitDate={formatDate(visit.visitDate)}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-2 cursor-pointer"
                                      variant="dropdown"
                                      onShare={() => setDropdownOpen(null)}
                                      prescription={visit}
                                      patient={patient}
                                      customText="Share Prescription PDF"
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
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-2 cursor-pointer"
                                    >
                                      <Download className="w-4 h-4 text-gray-500" />
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
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-2 cursor-pointer"
                                      variant="dropdown"
                                      onShare={() => setDropdownOpen(null)}
                                      bill={visit.bill}
                                      patient={patient}
                                      customText="Share Bill PDF"
                                    />
                                  </>
                                )}
                              </>
                            )}
                            <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                            <button
                              onClick={() => deleteVisit(visit.type === 'certificate' ? visit.id : visit.id, visit.bill?.id, visit.type)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800 flex items-center space-x-2 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>{visit.type === 'certificate' ? 'Delete Certificate' : 'Delete Visit'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Visit Header */}
                    <div className="flex items-center justify-between mb-3 pr-8">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {visit.type === 'certificate' ? (
                            <span className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>Medical Certificate</span>
                            </span>
                          ) : (
                            visit.isFollowUpVisit ? 'Follow-up Visit' : 'Regular Visit'
                          )}
                        </h3>
                        {visit.bill && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-200">₹{visit.bill.amount}</span>
                            <button
                              onClick={() => toggleBillPayment(visit.bill.id || visit.bill.billId)}
                              className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${visit.bill.isPaid
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
                      {/* Add time indicator for better chronological understanding */}
                      <div className="text-xs text-gray-500">
                        {formatDateTime(visit.displayDate)}
                      </div>
                    </div>

                    {/* Visit Content */}
                    {visit.type === 'certificate' ? (
                      /* Medical Certificate Content */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Certificate Purpose</h4>
                          <div className="text-gray-700 dark:text-gray-400 text-xs py-2">
                            {visit.certificateFor}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Fitness Status</h4>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              visit.fitnessStatus === 'fit' 
                                ? 'bg-green-500' 
                                : 'bg-red-500'
                            }`}></div>
                            <div className={`text-xs font-medium py-2 ${
                              visit.fitnessStatus === 'fit' 
                                ? 'text-gray-700 dark:text-gray-400' 
                                : 'text-gray-700 dark:text-gray-400'
                            }`}>
                              {visit.fitnessStatus === 'fit' ? 'Medically Fit' : 'Medically Unfit'}
                            </div>
                          </div>
                        </div>
                        {visit.remarks && (
                          <div className="md:col-span-2">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Remarks</h4>
                            <div className="text-xs text-gray-700 dark:text-gray-400 py-2">
                              {visit.remarks}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Prescription Visit Content */
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        {/* Symptoms */}
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-300 mb-2">Symptoms</h4>
                          <div className="space-y-1">
                            {visit.symptoms.map((symptom) => (
                              <div key={symptom.id} className="text-gray-700 dark:text-gray-400 text-xs">
                                <span className="font-medium">{symptom.name}</span>
                                <span className="text-gray-500"> • {symptom.severity} • {symptom.duration}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Diagnosis */}
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-300 mb-2">Diagnosis</h4>
                          <div className="text-xs text-gray-700 dark:text-gray-400">
                            {formatListAsText(visit.diagnosis)}
                          </div>
                        </div>

                        {/* Medications */}
                        {visit.medications?.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-800 dark:text-gray-300 mb-2 flex items-center">
                              <Pill className="w-4 h-4 mr-1" />
                              Medications
                            </h4>
                            <div className="space-y-1">
                              {visit.medications.map((med, medIndex) => (
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
                        {visit.labResults?.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-800 dark:text-gray-300 mb-2">Lab Tests</h4>
                            <div className="text-xs text-gray-700 dark:text-gray-400">
                              {formatListAsText(visit.labResults, 'testName')}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes and Advice for prescription visits */}
                    {visit.type === 'prescription' && (visit.doctorNotes || visit.advice) && (
                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                        {visit.doctorNotes && (
                          <div>
                            <span className="text-xs font-medium text-gray-800 dark:text-gray-300">Notes: </span>
                            <span className="text-xs text-gray-700 dark:text-gray-400">{visit.doctorNotes}</span>
                          </div>
                        )}
                        {visit.advice && (
                          <div>
                            <span className="text-xs font-medium text-gray-800 dark:text-gray-300">Advice: </span>
                            <span className="text-xs text-gray-700 dark:text-gray-400">{visit.advice}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Follow-up for prescription visits */}
                    {visit.type === 'prescription' && visit.followUpDate && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-800 dark:text-gray-300">Follow-up:</span>
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

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={handleCancelDelete}
        isLoading={confirmDialog.isLoading}
      />

    </div>
  );
}