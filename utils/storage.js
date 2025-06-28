/**
 * Storage service that uses MongoDB Atlas through API calls with multi-tenant support
 */

// API endpoints
const API_ENDPOINTS = {
  PATIENTS: '/api/patients',
  PRESCRIPTIONS: '/api/prescriptions',
  BILLS: '/api/bills',
  TEMPLATES: '/api/templates',
  CUSTOM_DATA: '/api/custom-data'
};

/**
 * Get current doctor ID from session/context
 */
function getCurrentDoctorId() {
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    const doctorId = localStorage.getItem('currentDoctorId');
    if (!doctorId) {
      console.error('No doctor ID found in localStorage');
      throw new Error('Doctor not authenticated');
    }
    return doctorId;
  }
  throw new Error('Doctor context not available');
}

/**
 * Helper function to make API calls with doctor context
 */
async function apiCall(url, options = {}) {
  try {
    const doctorId = getCurrentDoctorId();

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Doctor-ID': doctorId,
        ...options.headers
      },
      ...options
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`API call failed: ${response.status}`, data);
      throw new Error(`API call failed: ${response.status} - ${data.error || 'Unknown error'}`);
    }

    return data;
  } catch (error) {
    console.error('API call error:', error);
    // Don't return fallback data for multi-tenant security
    throw error;
  }
}

export const storage = {

  // Doctor context management
  setCurrentDoctor: (doctorId, doctorData) => {
    if (typeof window !== 'undefined') {
      if (!doctorId) {
        throw new Error('Doctor ID is required');
      }
      
      // Handle both string parameters and object parameter
      let name, lastName, accessType, phone, degree, registrationNumber, hospitalName, hospitalAddress;
      if (typeof doctorData === 'object') {
        // If second parameter is an object, extract from it
        name = doctorData.name || doctorData.firstName + ' ' + doctorData.lastName || 'Dr. Nikam';
        lastName = doctorData.lastName || doctorData.name?.split(' ').pop() || 'Nikam';
        accessType = doctorData.accessType || 'doctor';
        phone = doctorData.phone || '';
        degree = doctorData.degree || '';
        registrationNumber = doctorData.registrationNumber || '';
        hospitalName = doctorData.hospitalName || 'Chaitanya Hospital';
        hospitalAddress = doctorData.hospitalAddress || 'Deola, Maharashtra';
      } else {
        // If passed as separate parameters (legacy support)
        name = doctorData || 'Dr. Nikam';
        lastName = name.split(' ').pop() || 'Nikam';
        accessType = arguments[2] || 'doctor';
        phone = '';
        degree = '';
        registrationNumber = '';
        hospitalName = 'Chaitanya Hospital';
        hospitalAddress = 'Deola, Maharashtra';
      }
      
      localStorage.setItem('currentDoctorId', doctorId);
      localStorage.setItem('currentDoctorName', name);
      localStorage.setItem('currentDoctorLastName', lastName);
      localStorage.setItem('currentDoctorAccessType', accessType);
      localStorage.setItem('currentDoctorPhone', phone);
      localStorage.setItem('currentDoctorDegree', degree);
      localStorage.setItem('currentDoctorRegistrationNumber', registrationNumber);
      localStorage.setItem('currentDoctorHospitalName', hospitalName);
      localStorage.setItem('currentDoctorHospitalAddress', hospitalAddress);
    }
  },

  getCurrentDoctorId,

  // Add missing getDoctorContext method
  getDoctorContext: () => {
    if (typeof window !== 'undefined') {
      const doctorId = localStorage.getItem('currentDoctorId');
      const doctorName = localStorage.getItem('currentDoctorName');
      const lastName = localStorage.getItem('currentDoctorLastName');
      const accessType = localStorage.getItem('currentDoctorAccessType');
      const phone = localStorage.getItem('currentDoctorPhone');
      const degree = localStorage.getItem('currentDoctorDegree');
      const registrationNumber = localStorage.getItem('currentDoctorRegistrationNumber');
      const hospitalName = localStorage.getItem('currentDoctorHospitalName');
      const hospitalAddress = localStorage.getItem('currentDoctorHospitalAddress');

      if (doctorId) {
        return {
          id: doctorId,
          name: doctorName || 'Dr. Nikam',
          lastName: lastName || 'Nikam',
          accessType: accessType || 'doctor',
          phone: phone || '',
          degree: degree || '',
          registrationNumber: registrationNumber || '',
          hospitalName: hospitalName || 'Chaitanya Hospital',
          hospitalAddress: hospitalAddress || 'Deola, Maharashtra'
        };
      }
    }
    return null;
  },

  // Clear doctor context on logout
  clearDoctorContext: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentDoctorId');
      localStorage.removeItem('currentDoctorName');
      localStorage.removeItem('currentDoctorLastName');
      localStorage.removeItem('currentDoctorAccessType');
      localStorage.removeItem('currentDoctorPhone');
      localStorage.removeItem('currentDoctorDegree');
      localStorage.removeItem('currentDoctorRegistrationNumber');
      localStorage.removeItem('currentDoctorHospitalName');
      localStorage.removeItem('currentDoctorHospitalAddress');
    }
  },

  // PATIENTS
  getPatients: async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.PATIENTS);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting patients:', error);
      return [];
    }
  },

  savePatients: async (patients) => {
    try {
      const response = await apiCall(API_ENDPOINTS.PATIENTS, {
        method: 'POST',
        body: JSON.stringify({ patients })
      });
      return response.success !== false;
    } catch (error) {
      console.error('Error saving patients:', error);
      return false;
    }
  },

  // PRESCRIPTIONS
  getPrescriptions: async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.PRESCRIPTIONS);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting prescriptions:', error);
      return [];
    }
  },

  savePrescriptions: async (prescriptions) => {
    try {
      await apiCall(API_ENDPOINTS.PRESCRIPTIONS, {
        method: 'POST',
        body: JSON.stringify({ prescriptions })
      });
      return true;
    } catch (error) {
      console.error('Error saving prescriptions:', error);
      return false;
    }
  },

  savePrescription: async (prescription) => {
    try {
      if (!prescription.patientId) {
        throw new Error('Patient ID is required');
      }

      const response = await apiCall(`${API_ENDPOINTS.PRESCRIPTIONS}/single`, {
        method: 'POST',
        body: JSON.stringify({ prescription })
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to save prescription');
      }

      return response.data || prescription;
    } catch (error) {
      console.error('Error saving prescription:', error);
      throw error;
    }
  },

  getPrescriptionsByPatient: async (patientId) => {
    try {
      const normalizedPatientId = patientId?.toString();
      const response = await apiCall(`${API_ENDPOINTS.PRESCRIPTIONS}/patient/${normalizedPatientId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting prescriptions by patient:', error);
      return [];
    }
  },

  // BILLS
  getBills: async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.BILLS);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting bills:', error);
      return [];
    }
  },

  saveBills: async (bills) => {
    try {
      await apiCall(API_ENDPOINTS.BILLS, {
        method: 'POST',
        body: JSON.stringify({ bills })
      });
      return true;
    } catch (error) {
      console.error('Error saving bills:', error);
      return false;
    }
  },

  updateBill: async (billId, updates) => {
    try {
      const bills = await storage.getBills();
      const updatedBills = bills.map(bill =>
        bill.id === billId ? { ...bill, ...updates } : bill
      );
      const success = await storage.saveBills(updatedBills);
      return success ? updatedBills.find(b => b.id === billId) : null;
    } catch (error) {
      console.error('Error updating bill:', error);
      return null;
    }
  },

  getBillsByPatient: async (patientId) => {
    try {
      const normalizedPatientId = patientId?.toString();
      const response = await apiCall(`${API_ENDPOINTS.BILLS}/patient/${normalizedPatientId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting bills by patient:', error);
      return [];
    }
  },

  // TEMPLATES
  getTemplates: async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.TEMPLATES);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  },

  saveTemplates: async (templates) => {
    try {
      await apiCall(API_ENDPOINTS.TEMPLATES, {
        method: 'POST',
        body: JSON.stringify({ templates })
      });
      return true;
    } catch (error) {
      console.error('Error saving templates:', error);
      return false;
    }
  },

  saveTemplate: async (template) => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.TEMPLATES}/single`, {
        method: 'POST',
        body: JSON.stringify({ template })
      });
      return response.data || template;
    } catch (error) {
      console.error('Error saving template:', error);
      return null;
    }
  },

  // Add method to update template usage
  updateTemplateUsage: async (templateId) => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.TEMPLATES}/${templateId}/usage`, {
        method: 'PATCH',
        body: JSON.stringify({ lastUsed: new Date().toISOString() })
      });
      return response.success !== false;
    } catch (error) {
      console.error('Error updating template usage:', error);
      // Fallback: update locally if API fails
      try {
        const templates = await storage.getTemplates();
        const updatedTemplates = templates.map(template =>
          template.id === templateId
            ? { ...template, lastUsed: new Date().toISOString() }
            : template
        );
        return await storage.saveTemplates(updatedTemplates);
      } catch (fallbackError) {
        console.error('Fallback template usage update failed:', fallbackError);
        return false;
      }
    }
  },

  deleteTemplate: async (templateId) => {
    try {
      await apiCall(`${API_ENDPOINTS.TEMPLATES}/${templateId}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  },

  // CUSTOM DATA
  getCustomSymptoms: async () => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/symptoms`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting custom symptoms:', error);
      return [];
    }
  },

  saveCustomSymptoms: async (symptoms) => {
    try {
      await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/symptoms`, {
        method: 'POST',
        body: JSON.stringify({ items: Array.isArray(symptoms) ? symptoms : [] })
      });
      return true;
    } catch (error) {
      console.error('Error saving custom symptoms:', error);
      return false;
    }
  },

  addCustomSymptom: async (symptom) => {
    try {
      const symptoms = await storage.getCustomSymptoms();
      if (!symptoms.includes(symptom)) {
        symptoms.push(symptom);
        return await storage.saveCustomSymptoms(symptoms);
      }
      return true;
    } catch (error) {
      console.error('Error adding custom symptom:', error);
      return false;
    }
  },

  getCustomDiagnoses: async () => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/diagnoses`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting custom diagnoses:', error);
      return [];
    }
  },

  saveCustomDiagnoses: async (diagnoses) => {
    try {
      await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/diagnoses`, {
        method: 'POST',
        body: JSON.stringify({ items: Array.isArray(diagnoses) ? diagnoses : [] })
      });
      return true;
    } catch (error) {
      console.error('Error saving custom diagnoses:', error);
      return false;
    }
  },

  addCustomDiagnosis: async (diagnosis) => {
    try {
      const diagnoses = await storage.getCustomDiagnoses();
      if (!diagnoses.includes(diagnosis)) {
        diagnoses.push(diagnosis);
        return await storage.saveCustomDiagnoses(diagnoses);
      }
      return true;
    } catch (error) {
      console.error('Error adding custom diagnosis:', error);
      return false;
    }
  },

  getCustomLabTests: async () => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/lab-tests`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting custom lab tests:', error);
      return [];
    }
  },

  saveCustomLabTests: async (labTests) => {
    try {
      await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/lab-tests`, {
        method: 'POST',
        body: JSON.stringify({ items: Array.isArray(labTests) ? labTests : [] })
      });
      return true;
    } catch (error) {
      console.error('Error saving custom lab tests:', error);
      return false;
    }
  },

  addCustomLabTest: async (labTest) => {
    try {
      const labTests = await storage.getCustomLabTests();
      if (!labTests.includes(labTest)) {
        labTests.push(labTest);
        return await storage.saveCustomLabTests(labTests);
      }
      return true;
    } catch (error) {
      console.error('Error adding custom lab test:', error);
      return false;
    }
  },

  getCustomMedications: async () => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/medications`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting custom medications:', error);
      return [];
    }
  },

  saveCustomMedications: async (medications) => {
    try {
      await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/medications`, {
        method: 'POST',
        body: JSON.stringify({ items: Array.isArray(medications) ? medications : [] })
      });
      return true;
    } catch (error) {
      console.error('Error saving custom medications:', error);
      return false;
    }
  },

  addCustomMedication: async (medication) => {
    try {
      const medications = await storage.getCustomMedications();
      if (!medications.includes(medication)) {
        medications.push(medication);
        return await storage.saveCustomMedications(medications);
      }
      return true;
    } catch (error) {
      console.error('Error adding custom medication:', error);
      return false;
    }
  },

  // Add new function for regenerating PDFs when blob URLs are invalid
  regeneratePDFIfNeeded: async (item, patient, type) => {
    if (!item.pdfUrl) return null;

    try {
      const response = await fetch(item.pdfUrl);
      if (response.ok) {
        return item.pdfUrl;
      }
    } catch (error) {
      // URL is invalid, need to regenerate
    }

    try {
      if (type === 'prescription') {
        const { generatePDF } = await import('./pdfGenerator');
        const pdfBlob = await generatePDF(item, patient, false);
        const newUrl = URL.createObjectURL(pdfBlob);

        const prescriptions = await storage.getPrescriptions();
        const updatedPrescriptions = prescriptions.map(p =>
          p.id === item.id ? { ...p, pdfUrl: newUrl } : p
        );
        await storage.savePrescriptions(updatedPrescriptions);

        return newUrl;
      } else if (type === 'bill') {
        const { generateBillPDF } = await import('./billGenerator');
        const pdfBlob = await generateBillPDF(item, patient);
        const newUrl = URL.createObjectURL(pdfBlob);

        const bills = await storage.getBills();
        const updatedBills = bills.map(b =>
          b.id === item.id ? { ...b, pdfUrl: newUrl } : b
        );
        await storage.saveBills(updatedBills);

        return newUrl;
      }
    } catch (error) {
      console.error(`Error regenerating ${type} PDF:`, error);
      return null;
    }
  },

  // Settings methods
  async getSettings() {
    try {
      const settings = localStorage.getItem('doc-prescrip-settings');
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  },

  async saveSettings(settings) {
    try {
      localStorage.setItem('doc-prescrip-settings', JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },

  async exportAllData() {
    try {
      const [patients, prescriptions, bills, templates, settings] = await Promise.all([
        this.getPatients(),
        this.getPrescriptions(), 
        this.getBills(),
        this.getTemplates(),
        this.getSettings()
      ]);

      return {
        patients,
        prescriptions,
        bills,
        templates,
        settings,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  },

  async importAllData(data) {
    try {
      if (data.version !== '1.0') {
        throw new Error('Incompatible data version');
      }

      // Import patients, prescriptions, bills, templates, and settings
      const importPatients = data.patients || [];
      const importPrescriptions = data.prescriptions || [];
      const importBills = data.bills || [];
      const importTemplates = data.templates || [];
      const importSettings = data.settings || {};

      // Clear existing data (optional, based on your app's needs)
      await Promise.all([
        this.savePatients([]),
        this.savePrescriptions([]),
        this.saveBills([]),
        this.saveTemplates([]),
        this.saveSettings({})
      ]);

      // Import new data
      await Promise.all([
        this.savePatients(importPatients),
        this.savePrescriptions(importPrescriptions),
        this.saveBills(importBills),
        this.saveTemplates(importTemplates),
        this.saveSettings(importSettings)
      ]);

      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
};

export default storage;