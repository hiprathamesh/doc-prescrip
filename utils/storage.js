/**
 * Storage service that uses MongoDB Atlas through API calls
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
 * Helper function to make API calls
 */
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
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
    // Don't return empty structure for non-GET requests
    if (options.method && options.method !== 'GET') {
      throw error;
    }
    // Return empty structure for GET requests
    return { success: true, data: [] };
  }
}

export const storage = {
  
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

  // Add new function for saving single prescription
  savePrescription: async (prescription) => {
    try {
      // Validate prescription data before sending
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
      throw error; // Re-throw the error so the calling code can handle it
    }
  },

  getPrescriptionsByPatient: async (patientId) => {
    try {
      // Ensure patientId is always a string for consistency
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

  getBillsByPatient: async (patientId) => {
    try {
      // Ensure patientId is always a string for consistency
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
      // Check if blob URL is still accessible
      const response = await fetch(item.pdfUrl);
      if (response.ok) {
        return item.pdfUrl; // URL is still valid
      }
    } catch (error) {
      // URL is invalid, need to regenerate
    }
    
    try {
      if (type === 'prescription') {
        const { generatePDF } = await import('./pdfGenerator');
        const pdfBlob = await generatePDF(item, patient, false);
        const newUrl = URL.createObjectURL(pdfBlob);
        
        // Update the stored prescription with new URL
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
        
        // Update the stored bill with new URL
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
  }
};

export default storage;