/**
 * Updated storage service that uses MongoDB Atlas through API calls
 * This replaces localStorage with cloud database storage
 */

// API endpoints for different data types
const API_ENDPOINTS = {
  PATIENTS: '/api/patients',
  PRESCRIPTIONS: '/api/prescriptions',
  BILLS: '/api/bills',
  TEMPLATES: '/api/templates',
  CUSTOM_DATA: '/api/custom-data'
};

/**
 * Helper function to make API calls
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} API response
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
      throw new Error(data.error || `API call failed: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API call error:', error);
    // Fallback to empty data for GET requests
    if (!options.method || options.method === 'GET') {
      return { success: true, data: [] };
    }
    throw error;
  }
}

export const storage = {
  
  // ==================== PATIENTS OPERATIONS ====================
  
  /**
   * Get all patients from MongoDB Atlas
   * @returns {Promise<Array>} Array of patient objects
   */
  getPatients: async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.PATIENTS);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  },

  /**
   * Save patients to MongoDB Atlas
   * @param {Array} patients - Array of patient objects
   * @returns {Promise<boolean>} Success status
   */
  savePatients: async (patients) => {
    try {
      await apiCall(API_ENDPOINTS.PATIENTS, {
        method: 'POST',
        body: JSON.stringify({ patients })
      });
      return true;
    } catch (error) {
      console.error('Error saving patients:', error);
      return false;
    }
  },

  // ==================== PRESCRIPTIONS OPERATIONS ====================

  /**
   * Get all prescriptions from MongoDB Atlas
   * @returns {Promise<Array>} Array of prescription objects
   */
  getPrescriptions: async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.PRESCRIPTIONS);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      return [];
    }
  },

  /**
   * Save prescriptions to MongoDB Atlas
   * @param {Array} prescriptions - Array of prescription objects
   * @returns {Promise<boolean>} Success status
   */
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

  /**
   * Get prescriptions for a specific patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Array of prescriptions for the patient
   */
  getPrescriptionsByPatient: async (patientId) => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.PRESCRIPTIONS}/patient/${patientId}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching prescriptions by patient:', error);
      return [];
    }
  },

  // ==================== BILLS OPERATIONS ====================

  /**
   * Get all bills from MongoDB Atlas
   * @returns {Promise<Array>} Array of bill objects
   */
  getBills: async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.BILLS);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching bills:', error);
      return [];
    }
  },

  /**
   * Save bills to MongoDB Atlas
   * @param {Array} bills - Array of bill objects
   * @returns {Promise<boolean>} Success status
   */
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

  /**
   * Get bills for a specific patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Array of bills for the patient
   */
  getBillsByPatient: async (patientId) => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.BILLS}/patient/${patientId}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching bills by patient:', error);
      return [];
    }
  },

  // ==================== TEMPLATES OPERATIONS ====================

  /**
   * Get all prescription templates
   * @returns {Promise<Array>} Array of template objects
   */
  getTemplates: async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.TEMPLATES);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  },

  /**
   * Save templates to MongoDB Atlas
   * @param {Array} templates - Array of template objects
   * @returns {Promise<boolean>} Success status
   */
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

  /**
   * Get a specific template by ID
   * @param {string} id - Template ID
   * @returns {Promise<Object|null>} Template object or null
   */
  getTemplate: async (id) => {
    try {
      const templates = await storage.getTemplates();
      return templates.find(template => template.id === id) || null;
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  },

  // ==================== CUSTOM DATA OPERATIONS ====================

  /**
   * Get custom symptoms from MongoDB Atlas
   * @returns {Promise<Array>} Array of custom symptoms
   */
  getCustomSymptoms: async () => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/symptoms`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching custom symptoms:', error);
      return []; // Always return an array
    }
  },

  /**
   * Save custom symptoms to MongoDB Atlas
   * @param {Array} symptoms - Array of symptom strings
   * @returns {Promise<boolean>} Success status
   */
  saveCustomSymptoms: async (symptoms) => {
    try {
      await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/symptoms`, {
        method: 'POST',
        body: JSON.stringify({ items: symptoms })
      });
      return true;
    } catch (error) {
      console.error('Error saving custom symptoms:', error);
      return false;
    }
  },

  /**
   * Add a custom symptom (helper method)
   * @param {string} symptom - Symptom to add
   * @returns {Promise<boolean>} Success status
   */
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

  /**
   * Get custom diagnoses from MongoDB Atlas
   * @returns {Promise<Array>} Array of custom diagnoses
   */
  getCustomDiagnoses: async () => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/diagnoses`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching custom diagnoses:', error);
      return []; // Always return an array
    }
  },

  /**
   * Save custom diagnoses to MongoDB Atlas
   * @param {Array} diagnoses - Array of diagnosis strings
   * @returns {Promise<boolean>} Success status
   */
  saveCustomDiagnoses: async (diagnoses) => {
    try {
      await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/diagnoses`, {
        method: 'POST',
        body: JSON.stringify({ items: diagnoses })
      });
      return true;
    } catch (error) {
      console.error('Error saving custom diagnoses:', error);
      return false;
    }
  },

  /**
   * Add a custom diagnosis (helper method)
   * @param {string} diagnosis - Diagnosis to add
   * @returns {Promise<boolean>} Success status
   */
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

  /**
   * Get custom lab tests from MongoDB Atlas
   * @returns {Promise<Array>} Array of custom lab tests
   */
  getCustomLabTests: async () => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/lab-tests`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching custom lab tests:', error);
      return []; // Always return an array
    }
  },

  /**
   * Save custom lab tests to MongoDB Atlas
   * @param {Array} labTests - Array of lab test strings
   * @returns {Promise<boolean>} Success status
   */
  saveCustomLabTests: async (labTests) => {
    try {
      await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/lab-tests`, {
        method: 'POST',
        body: JSON.stringify({ items: labTests })
      });
      return true;
    } catch (error) {
      console.error('Error saving custom lab tests:', error);
      return false;
    }
  },

  /**
   * Add a custom lab test (helper method)
   * @param {string} labTest - Lab test to add
   * @returns {Promise<boolean>} Success status
   */
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

  /**
   * Get custom medications from MongoDB Atlas
   * @returns {Promise<Array>} Array of custom medications
   */
  getCustomMedications: async () => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/medications`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching custom medications:', error);
      return []; // Always return an array
    }
  },

  /**
   * Save custom medications to MongoDB Atlas
   * @param {Array} medications - Array of medication strings
   * @returns {Promise<boolean>} Success status
   */
  saveCustomMedications: async (medications) => {
    try {
      await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/medications`, {
        method: 'POST',
        body: JSON.stringify({ items: medications })
      });
      return true;
    } catch (error) {
      console.error('Error saving custom medications:', error);
      return false;
    }
  },

  /**
   * Add a custom medication (helper method)
   * @param {string} medication - Medication to add
   * @returns {Promise<boolean>} Success status
   */
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
};