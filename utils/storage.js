/**
 * Storage service that uses MongoDB Atlas through API calls with multi-tenant support
 */

// API endpoints
const API_ENDPOINTS = {
  PATIENTS: '/api/patients',
  PRESCRIPTIONS: '/api/prescriptions',
  BILLS: '/api/bills',
  TEMPLATES: '/api/templates',
  CUSTOM_DATA: '/api/custom-data',
  ACTIVITIES: '/api/activities'
};

/**
 * Get current doctor ID from session/context
 */
function getCurrentDoctorId() {
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    const doctorId = localStorage.getItem('currentDoctorId');
    if (!doctorId) {
      // Try to wait for StoreDoctorId component to set the context
      console.warn('No doctor ID found in localStorage - this might be during Google auth initialization');
      throw new Error('Doctor not authenticated - Please wait for authentication to complete');
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
    let doctorId;
    
    try {
      doctorId = getCurrentDoctorId();
    } catch (error) {
      // If doctor ID not found in localStorage, try to get it from NextAuth session
      if (typeof window !== 'undefined') {
        // Check if we're in the middle of Google auth process
        const cookies = document.cookie.split(';');
        const nextAuthSessionCookie = cookies.find(cookie => 
          cookie.trim().startsWith('next-auth.session-token=') ||
          cookie.trim().startsWith('__Secure-next-auth.session-token=')
        );
        
        if (nextAuthSessionCookie) {
          // Wait a bit for StoreDoctorId component to set localStorage
          console.log('⏳ Waiting for doctor context to be available...');
          
          // Try to wait for doctorContextReady event with shorter timeout
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Timeout waiting for doctor context - please refresh the page'));
            }, 3000); // Reduced timeout to 3 seconds
            
            const handleDoctorContextReady = () => {
              clearTimeout(timeout);
              window.removeEventListener('doctorContextReady', handleDoctorContextReady);
              
              // Now try the API call again
              apiCall(url, options).then(resolve).catch(reject);
            };
            
            window.addEventListener('doctorContextReady', handleDoctorContextReady);
            
            // Also try polling localStorage as a fallback with shorter intervals
            const pollInterval = setInterval(() => {
              const currentDoctorId = localStorage.getItem('currentDoctorId');
              if (currentDoctorId) {
                clearInterval(pollInterval);
                clearTimeout(timeout);
                window.removeEventListener('doctorContextReady', handleDoctorContextReady);
                
                // Now try the API call again
                apiCall(url, options).then(resolve).catch(reject);
              }
            }, 50); // Check every 50ms
          });
        }
      }
      
      // Re-throw the original error if we can't resolve it
      throw error;
    }

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

class Storage {
  constructor() {
    // Initialize databaseService for hospital logo operations
    this.databaseService = null;
    // Only initialize on server side
    if (typeof window === 'undefined') {
      this.initializeDatabaseService();
    }
  }

  async initializeDatabaseService() {
    try {
      // Only import on server side
      if (typeof window === 'undefined') {
        // Dynamically import databaseService to avoid circular dependencies
        const { databaseService } = await import('../services/databaseService');
        this.databaseService = databaseService;
      }
    } catch (error) {
      console.error('Failed to initialize database service:', error);
    }
  }

  // Doctor context management
  setCurrentDoctor(doctorId, doctorData) {
    if (typeof window !== 'undefined') {
      if (!doctorId) {
        throw new Error('Doctor ID is required');
      }
      
      // Handle both string parameters and object parameter
      let name, lastName, accessType, phone, degree, registrationNumber, hospitalName, hospitalAddress, specialization;
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
        specialization = doctorData.specialization || '';
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
        specialization = '';
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
      localStorage.setItem('currentDoctorSpecialization', specialization);
    }
  }

  getCurrentDoctorId() {
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

  getDoctorContext() {
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
      const specialization = localStorage.getItem('currentDoctorSpecialization');

      if (doctorId) {
        return {
          id: doctorId,
          doctorId: doctorId, // Add doctorId property for consistency
          name: doctorName || 'Dr. Nikam',
          lastName: lastName || 'Nikam',
          accessType: accessType || 'doctor',
          phone: phone || '',
          degree: degree || '',
          registrationNumber: registrationNumber || '',
          hospitalName: hospitalName || 'Chaitanya Hospital',
          hospitalAddress: hospitalAddress || 'Deola, Maharashtra',
          specialization: specialization || ''
        };
      }
    }
    return null;
  }

  // Clear doctor context on logout
  clearDoctorContext() {
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
      localStorage.removeItem('currentDoctorSpecialization');
    }
  }

  // PATIENTS
  async getPatients() {
    try {
      const response = await apiCall(API_ENDPOINTS.PATIENTS);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting patients:', error);
      return [];
    }
  }

  async savePatients(patients) {
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
  }

  // PRESCRIPTIONS
  async getPrescriptions() {
    try {
      const response = await apiCall(API_ENDPOINTS.PRESCRIPTIONS);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting prescriptions:', error);
      return [];
    }
  }

  async savePrescriptions(prescriptions) {
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
  }

  async savePrescription(prescription) {
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
  }

  async getPrescriptionsByPatient(patientId) {
    try {
      const normalizedPatientId = patientId?.toString();
      const response = await apiCall(`${API_ENDPOINTS.PRESCRIPTIONS}/patient/${normalizedPatientId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting prescriptions by patient:', error);
      return [];
    }
  }

  // BILLS
  async getBills() {
    try {
      const response = await apiCall(API_ENDPOINTS.BILLS);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting bills:', error);
      return [];
    }
  }

  async saveBills(bills) {
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
  }

  async updateBill(billId, updates) {
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
  }

  async getBillsByPatient(patientId) {
    try {
      const normalizedPatientId = patientId?.toString();
      const response = await apiCall(`${API_ENDPOINTS.BILLS}/patient/${normalizedPatientId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting bills by patient:', error);
      return [];
    }
  }

  // TEMPLATES
  async getTemplates() {
    try {
      const response = await apiCall(API_ENDPOINTS.TEMPLATES);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }

  async saveTemplates(templates) {
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
  }

  async saveTemplate(template) {
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
  }

  async deleteTemplate(templateId) {
    try {
      // Get current templates from localStorage
      const templates = await this.getTemplates();
      
      // Filter out the template to delete using templateId
      const updatedTemplates = templates.filter(template => template.templateId !== templateId);
      
      // Save the updated templates back to localStorage
      await this.saveTemplates(updatedTemplates);
      
      return true; // Return success
    } catch (error) {
      console.error('Error deleting template:', error);
      return false; // Return failure
    }
  }

  // Add method to update template usage
  async updateTemplateUsage(templateId) {
    try {
      const templates = await this.getTemplates();
      const updatedTemplates = templates.map(template => 
        template.templateId === templateId 
          ? { ...template, lastUsed: new Date() }
          : template
      );
      await this.saveTemplates(updatedTemplates);
      return true;
    } catch (error) {
      console.error('Error updating template usage:', error);
      return false;
    }
  }

  // CUSTOM DATA
  async getCustomSymptoms() {
    try {
      const response = await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/symptoms`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting custom symptoms:', error);
      return [];
    }
  }

  async saveCustomSymptoms(symptoms) {
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
  }

  async addCustomSymptom(symptom) {
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
  }

  async getCustomDiagnoses() {
    try {
      const response = await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/diagnoses`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting custom diagnoses:', error);
      return [];
    }
  }

  async saveCustomDiagnoses(diagnoses) {
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
  }

  async addCustomDiagnosis(diagnosis) {
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
  }

  async getCustomLabTests() {
    try {
      const response = await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/lab-tests`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting custom lab tests:', error);
      return [];
    }
  }

  async saveCustomLabTests(labTests) {
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
  }

  async addCustomLabTest(labTest) {
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
  }

  async getCustomMedications() {
    try {
      const response = await apiCall(`${API_ENDPOINTS.CUSTOM_DATA}/medications`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting custom medications:', error);
      return [];
    }
  }

  async saveCustomMedications(medications) {
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
  }

  async addCustomMedication(medication) {
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
  }

  // Add new function for regenerating PDFs when blob URLs are invalid
  async regeneratePDFIfNeeded(item, patient, type) {
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
  }

  // Settings methods
  async getSettings() {
    try {
      const settings = localStorage.getItem('doc-prescrip-settings');
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error loading settings:', error);
      return null;
    }
  }

  async saveSettings(settings) {
    try {
      localStorage.setItem('doc-prescrip-settings', JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

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
  }

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

  // Hospital Logo methods
  async uploadHospitalLogo(file, doctorId) {
    try {
      if (!doctorId || doctorId === 'default-doctor') {
        throw new Error('Valid doctor ID is required for logo upload');
      }

      // For client-side uploads, use the API endpoint instead
      if (typeof window !== 'undefined') {
        const formData = new FormData();
        formData.append('logo', file);
        
        const response = await fetch('/api/hospital-logo/upload', {
          method: 'POST',
          headers: {
            'X-Doctor-ID': doctorId,
          },
          body: formData,
        });
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to upload logo');
        }
        
        return result;
      }

      // Server-side direct database access
      // Ensure databaseService is initialized
      if (!this.databaseService) {
        await this.initializeDatabaseService();
        if (!this.databaseService) {
          throw new Error('Database service not available');
        }
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const logoData = {
              base64: e.target.result,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type
            };

            const success = await this.databaseService.saveHospitalLogo(doctorId, logoData);
            if (success) {
              resolve({ success: true, logoData });
            } else {
              reject(new Error('Failed to save logo to database'));
            }
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Error uploading hospital logo:', error);
      throw error;
    }
  }

  async getHospitalLogo(doctorId) {
    try {
      if (!doctorId || doctorId === 'default-doctor') {
        return null;
      }

      // For client-side requests, use the API endpoint
      if (typeof window !== 'undefined') {
        try {
          const response = await fetch(`/api/hospital-logo?doctorId=${doctorId}`);
          const result = await response.json();
          return result.success ? result.logoData : null;
        } catch (error) {
          console.error('Error fetching logo via API:', error);
          return null;
        }
      }

      // Server-side direct database access
      // Ensure databaseService is initialized
      if (!this.databaseService) {
        await this.initializeDatabaseService();
        if (!this.databaseService) {
          console.warn('Database service not available for logo retrieval');
          return null;
        }
      }

      const logoDocument = await this.databaseService.getHospitalLogo(doctorId);
      if (logoDocument) {
        return {
          base64: logoDocument.logoBase64,
          fileName: logoDocument.fileName,
          fileSize: logoDocument.fileSize,
          mimeType: logoDocument.mimeType
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting hospital logo:', error);
      return null;
    }
  }

  async deleteHospitalLogo(doctorId) {
    try {
      if (!doctorId || doctorId === 'default-doctor') {
        throw new Error('Valid doctor ID is required for logo deletion');
      }

      // For client-side requests, use the API endpoint
      if (typeof window !== 'undefined') {
        const response = await fetch('/api/hospital-logo', {
          method: 'DELETE',
          headers: {
            'X-Doctor-ID': doctorId,
          },
        });
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete logo');
        }
        
        return true;
      }

      // Server-side direct database access
      // Ensure databaseService is initialized
      if (!this.databaseService) {
        await this.initializeDatabaseService();
        if (!this.databaseService) {
          throw new Error('Database service not available');
        }
      }

      return await this.databaseService.deleteHospitalLogo(doctorId);
    } catch (error) {
      console.error('Error deleting hospital logo:', error);
      throw error;
    }
  }

  // ACTIVITIES
  async getActivities() {
    try {
      const response = await apiCall(API_ENDPOINTS.ACTIVITIES);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error getting activities:', error);
      return [];
    }
  }

  async saveActivity(activity) {
    try {
      const response = await apiCall(`${API_ENDPOINTS.ACTIVITIES}/single`, {
        method: 'POST',
        body: JSON.stringify({ activity })
      });
      return response.success !== false;
    } catch (error) {
      console.error('Error saving activity:', error);
      return false;
    }
  }

  async clearOldActivities(days = 30) {
    try {
      const response = await apiCall(`${API_ENDPOINTS.ACTIVITIES}/cleanup?days=${days}`, {
        method: 'DELETE'
      });
      return response.success !== false;
    } catch (error) {
      console.error('Error clearing old activities:', error);
      return false;
    }
  }

  async clearAllActivities() {
    try {
      const response = await apiCall(`${API_ENDPOINTS.ACTIVITIES}`, {
        method: 'DELETE'
      });
      return response.success !== false;
    } catch (error) {
      console.error('Error clearing all activities:', error);
      return false;
    }
  }

  // Add JWT utility methods
  parseJwtToken(token) {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];
      const decoded = JSON.parse(atob(payload));
      // Check issuer/audience
      if (
        decoded.iss !== process.env.JWT_ISSUER ||
        decoded.aud !== process.env.JWT_AUDIENCE
      ) {
        return null;
      }
      // Check if token is expired
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        return null;
      }
      return decoded;
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }

  setCurrentDoctor(doctorId, additionalData = {}) {
    if (typeof window !== 'undefined') {
      // Store individual doctor properties for backward compatibility
      localStorage.setItem('currentDoctorId', doctorId);
      localStorage.setItem('currentDoctorName', additionalData.name || '');
      localStorage.setItem('currentDoctorLastName', additionalData.lastName || '');
      localStorage.setItem('currentDoctorAccessType', additionalData.accessType || 'doctor');
      localStorage.setItem('currentDoctorPhone', additionalData.phone || '');
      localStorage.setItem('currentDoctorDegree', additionalData.degree || '');
      localStorage.setItem('currentDoctorRegistrationNumber', additionalData.registrationNumber || '');
      localStorage.setItem('currentDoctorHospitalName', additionalData.hospitalName || '');
      localStorage.setItem('currentDoctorHospitalAddress', additionalData.hospitalAddress || '');
    }
  }

  getDoctorContext() {
    if (typeof window === 'undefined') return null;

    // First try to get doctor info from JWT token in cookie
    const cookies = document.cookie.split(';');
    const doctorAuthCookie = cookies.find(cookie => 
      cookie.trim().startsWith('doctor-auth=')
    );
    
    if (doctorAuthCookie) {
      const token = doctorAuthCookie.split('=')[1];
      const decoded = this.parseJwtToken(token);
      
      if (decoded && decoded.doctorId) {
        return {
          id: decoded.doctorId,
          doctorId: decoded.doctorId,
          name: decoded.name || localStorage.getItem('currentDoctorName') || '',
          lastName: decoded.name ? decoded.name.split(' ').slice(1).join(' ') : localStorage.getItem('currentDoctorLastName') || '',
          accessType: decoded.accessType || localStorage.getItem('currentDoctorAccessType') || 'doctor',
          phone: localStorage.getItem('currentDoctorPhone') || '',
          degree: localStorage.getItem('currentDoctorDegree') || '',
          registrationNumber: localStorage.getItem('currentDoctorRegistrationNumber') || '',
          hospitalName: localStorage.getItem('currentDoctorHospitalName') || '',
          hospitalAddress: localStorage.getItem('currentDoctorHospitalAddress') || ''
        };
      }
    }

    // Fallback to localStorage for backward compatibility
    const doctorId = localStorage.getItem('currentDoctorId');
    if (!doctorId) return null;

    return {
      id: doctorId,
      doctorId: doctorId,
      name: localStorage.getItem('currentDoctorName') || '',
      lastName: localStorage.getItem('currentDoctorLastName') || '',
      accessType: localStorage.getItem('currentDoctorAccessType') || 'doctor',
      phone: localStorage.getItem('currentDoctorPhone') || '',
      degree: localStorage.getItem('currentDoctorDegree') || '',
      registrationNumber: localStorage.getItem('currentDoctorRegistrationNumber') || '',
      hospitalName: localStorage.getItem('currentDoctorHospitalName') || '',
      hospitalAddress: localStorage.getItem('currentDoctorHospitalAddress') || ''
    };
  }

  clearDoctorContext() {
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
      localStorage.removeItem('currentDoctorSpecialization');
    }
  }

  // Method to ensure doctor context is available (for Google auth users)
  async ensureDoctorContext(session) {
    if (typeof window !== 'undefined') {
      const existingDoctorId = localStorage.getItem('currentDoctorId');
      
      // If no doctor context in localStorage but we have a session, populate it
      if (!existingDoctorId && session?.user?.doctorId) {
        console.log('🔄 Populating doctor context from session data...');
        this.setCurrentDoctor(session.user.doctorId, {
          name: session.user.doctorContext?.name || session.user.name || 'Dr. Nikam',
          firstName: session.user.doctorContext?.firstName || session.user.name?.split(' ')[0] || 'Dr.',
          lastName: session.user.doctorContext?.lastName || session.user.name?.split(' ').pop() || 'Nikam',
          accessType: session.user.doctorContext?.accessType || 'doctor',
          phone: session.user.doctorContext?.phone || '',
          degree: session.user.doctorContext?.degree || '',
          registrationNumber: session.user.doctorContext?.registrationNumber || '',
          hospitalName: session.user.doctorContext?.hospitalName || 'Chaitanya Hospital',
          hospitalAddress: session.user.doctorContext?.hospitalAddress || 'Deola, Maharashtra'
        });
        return true;
      }
      return !!existingDoctorId;
    }
    return false;
  }
}

export const storage = new Storage();
export default storage;