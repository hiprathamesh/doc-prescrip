/**
 * Activity Logger Utility
 * Tracks various user activities across the application
 */

export const ACTIVITY_TYPES = {
  PRESCRIPTION_CREATED: 'prescription_created',
  PATIENT_CREATED: 'patient_created',
  TEMPLATE_CREATED: 'template_created',
  TEMPLATE_EDITED: 'template_edited',
  TEMPLATE_DELETED: 'template_deleted',
  MEDICAL_CERTIFICATE_CREATED: 'medical_certificate_created',
  MEDICAL_CERTIFICATE_DOWNLOADED: 'medical_certificate_downloaded',
  BILL_PAYMENT_UPDATED: 'bill_payment_updated',
  CUSTOM_SYMPTOM_ADDED: 'custom_symptom_added',
  CUSTOM_DIAGNOSIS_ADDED: 'custom_diagnosis_added',
  CUSTOM_LAB_TEST_ADDED: 'custom_lab_test_added',
  CUSTOM_MEDICATION_ADDED: 'custom_medication_added',
  PATIENT_DELETED: 'patient_deleted',
  VISIT_DELETED: 'visit_deleted'
};

export const ACTIVITY_ICONS = {
  [ACTIVITY_TYPES.PRESCRIPTION_CREATED]: 'FileText',
  [ACTIVITY_TYPES.PATIENT_CREATED]: 'UserPlus',
  [ACTIVITY_TYPES.TEMPLATE_CREATED]: 'Plus',
  [ACTIVITY_TYPES.TEMPLATE_EDITED]: 'Edit',
  [ACTIVITY_TYPES.TEMPLATE_DELETED]: 'Trash2',
  [ACTIVITY_TYPES.MEDICAL_CERTIFICATE_CREATED]: 'Award',
  [ACTIVITY_TYPES.MEDICAL_CERTIFICATE_DOWNLOADED]: 'Download',
  [ACTIVITY_TYPES.BILL_PAYMENT_UPDATED]: 'CreditCard',
  [ACTIVITY_TYPES.CUSTOM_SYMPTOM_ADDED]: 'Plus',
  [ACTIVITY_TYPES.CUSTOM_DIAGNOSIS_ADDED]: 'Plus',
  [ACTIVITY_TYPES.CUSTOM_LAB_TEST_ADDED]: 'Plus',
  [ACTIVITY_TYPES.CUSTOM_MEDICATION_ADDED]: 'Plus',
  [ACTIVITY_TYPES.PATIENT_DELETED]: 'UserMinus',
  [ACTIVITY_TYPES.VISIT_DELETED]: 'Trash2'
};

export const ACTIVITY_COLORS = {
  [ACTIVITY_TYPES.PRESCRIPTION_CREATED]: 'blue',
  [ACTIVITY_TYPES.PATIENT_CREATED]: 'green',
  [ACTIVITY_TYPES.TEMPLATE_CREATED]: 'purple',
  [ACTIVITY_TYPES.TEMPLATE_EDITED]: 'orange',
  [ACTIVITY_TYPES.TEMPLATE_DELETED]: 'red',
  [ACTIVITY_TYPES.MEDICAL_CERTIFICATE_CREATED]: 'cyan',
  [ACTIVITY_TYPES.MEDICAL_CERTIFICATE_DOWNLOADED]: 'blue',
  [ACTIVITY_TYPES.BILL_PAYMENT_UPDATED]: 'yellow',
  [ACTIVITY_TYPES.CUSTOM_SYMPTOM_ADDED]: 'indigo',
  [ACTIVITY_TYPES.CUSTOM_DIAGNOSIS_ADDED]: 'indigo',
  [ACTIVITY_TYPES.CUSTOM_LAB_TEST_ADDED]: 'indigo',
  [ACTIVITY_TYPES.CUSTOM_MEDICATION_ADDED]: 'indigo',
  [ACTIVITY_TYPES.PATIENT_DELETED]: 'red',
  [ACTIVITY_TYPES.VISIT_DELETED]: 'red'
};

class ActivityLogger {
  constructor() {
    // Remove local storage reference
    this.listeners = new Set(); // Add listeners for real-time updates
  }

  // Add method to subscribe to activity updates
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners when activities change
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in activity listener:', error);
      }
    });
  }

  async logActivity(type, data) {
    try {
      // Get current doctor ID from storage
      let doctorId;
      try {
        doctorId = this.getCurrentDoctorId();
      } catch (error) {
        console.warn('No doctor context available for activity logging');
        return null;
      }

      const activity = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type,
        timestamp: new Date().toISOString(),
        doctorId,
        ...data
      };

      // Save to MongoDB via storage service
      const { storage } = await import('./storage');
      const success = await storage.saveActivity(activity);
      
      if (success) {
        // Notify listeners about the new activity
        this.notifyListeners();
        return activity;
      } else {
        console.warn('Failed to save activity to database');
        return null;
      }
    } catch (error) {
      console.error('Error logging activity:', error);
      return null;
    }
  }

  getCurrentDoctorId() {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      const doctorId = localStorage.getItem('currentDoctorId');
      if (!doctorId) {
        throw new Error('Doctor not authenticated');
      }
      return doctorId;
    }
    throw new Error('Doctor context not available');
  }

  async getActivities() {
    try {
      const { storage } = await import('./storage');
      const activities = await storage.getActivities();
      return activities;
    } catch (error) {
      console.error('Error getting activities:', error);
      return [];
    }
  }

  async clearActivities() {
    try {
      const { storage } = await import('./storage');
      return await storage.clearOldActivities();
    } catch (error) {
      console.error('Error clearing activities:', error);
      return false;
    }
  }

  // Specific activity logging methods
  async logPrescriptionCreated(patient, prescriptionId) {
    return this.logActivity(ACTIVITY_TYPES.PRESCRIPTION_CREATED, {
      patientId: patient.id,
      patientName: patient.name,
      prescriptionId,
      description: `Created prescription for ${patient.name}`
    });
  }

  async logPatientCreated(patient) {
    return this.logActivity(ACTIVITY_TYPES.PATIENT_CREATED, {
      patientId: patient.id,
      patientName: patient.name,
      description: `Added new patient: ${patient.name}`
    });
  }

  async logTemplateCreated(template) {
    return this.logActivity(ACTIVITY_TYPES.TEMPLATE_CREATED, {
      templateId: template.id,
      templateName: template.name,
      description: `Created template: ${template.name}`
    });
  }

  async logTemplateEdited(template) {
    return this.logActivity(ACTIVITY_TYPES.TEMPLATE_EDITED, {
      templateId: template.id,
      templateName: template.name,
      description: `Updated template: ${template.name}`
    });
  }

  async logTemplateDeleted(templateName) {
    return this.logActivity(ACTIVITY_TYPES.TEMPLATE_DELETED, {
      templateName,
      description: `Deleted template: ${templateName}`
    });
  }

  async logMedicalCertificateCreated(patient, certificateFor) {
    return this.logActivity(ACTIVITY_TYPES.MEDICAL_CERTIFICATE_CREATED, {
      patientId: patient?.id,
      patientName: patient?.name || 'Manual Entry',
      certificateFor,
      description: `Generated medical certificate for ${patient?.name || 'Manual Entry'}`
    });
  }

  async logMedicalCertificatePDFDownloaded(patient, certificateFor) {
    return this.logActivity(ACTIVITY_TYPES.MEDICAL_CERTIFICATE_DOWNLOADED, {
      patientId: patient?.id,
      patientName: patient?.name || 'Manual Entry',
      certificateFor,
      description: `Downloaded medical certificate PDF for ${patient?.name || 'Manual Entry'}`
    });
  }

  async logBillPaymentUpdated(patient, amount, isPaid) {
    return this.logActivity(ACTIVITY_TYPES.BILL_PAYMENT_UPDATED, {
      patientId: patient.id,
      patientName: patient.name,
      amount,
      isPaid,
      description: `${isPaid ? 'Received' : 'Marked pending'} payment of ₹${amount} from ${patient.name}`
    });
  }

  async logCustomDataAdded(type, itemName) {
    const activityType = {
      'symptom': ACTIVITY_TYPES.CUSTOM_SYMPTOM_ADDED,
      'diagnosis': ACTIVITY_TYPES.CUSTOM_DIAGNOSIS_ADDED,
      'labTest': ACTIVITY_TYPES.CUSTOM_LAB_TEST_ADDED,
      'medication': ACTIVITY_TYPES.CUSTOM_MEDICATION_ADDED
    }[type];

    if (!activityType) return null;

    return this.logActivity(activityType, {
      itemName,
      description: `Added custom ${type}: ${itemName}`
    });
  }

  async logPatientDeleted(patientName) {
    return this.logActivity(ACTIVITY_TYPES.PATIENT_DELETED, {
      patientName,
      description: `Deleted patient: ${patientName}`
    });
  }

  async logVisitDeleted(patientName) {
    return this.logActivity(ACTIVITY_TYPES.VISIT_DELETED, {
      patientName,
      description: `Deleted visit record for ${patientName}`
    });
  }
}

export const activityLogger = new ActivityLogger();
