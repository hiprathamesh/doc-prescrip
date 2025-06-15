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
    this.storageKey = 'recentActivities';
  }

  async logActivity(type, data) {
    try {
      const activity = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type,
        timestamp: new Date().toISOString(),
        ...data
      };

      const activities = await this.getActivities();
      const updatedActivities = [activity, ...activities].slice(0, 50); // Keep only last 50 activities
      
      localStorage.setItem(this.storageKey, JSON.stringify(updatedActivities));
      return activity;
    } catch (error) {
      console.error('Error logging activity:', error);
      return null;
    }
  }

  async getActivities() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting activities:', error);
      return [];
    }
  }

  async clearActivities() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
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
