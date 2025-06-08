import { getCollection } from '../lib/mongodb';

// Collection names - these will be your MongoDB collections
const COLLECTIONS = {
  PATIENTS: 'patients',
  PRESCRIPTIONS: 'prescriptions', 
  BILLS: 'bills',
  TEMPLATES: 'prescription_templates',
  CUSTOM_SYMPTOMS: 'custom_symptoms',
  CUSTOM_DIAGNOSES: 'custom_diagnoses',
  CUSTOM_LAB_TESTS: 'custom_lab_tests',
  CUSTOM_MEDICATIONS: 'custom_medications'
};

/**
 * Database service class to handle all MongoDB operations
 * This replaces the localStorage functionality with MongoDB operations
 */
class DatabaseService {
  
  // ==================== PATIENTS OPERATIONS ====================
  
  /**
   * Get all patients from database
   * @returns {Promise<Array>} Array of patient objects
   */
  async getPatients() {
    try {
      const collection = await getCollection(COLLECTIONS.PATIENTS);
      const patients = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return patients.map(patient => ({ ...patient, id: patient._id.toString() }));
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  }

  /**
   * Save/Update patients in database
   * @param {Array} patients - Array of patient objects
   * @returns {Promise<boolean>} Success status
   */
  async savePatients(patients) {
    try {
      const collection = await getCollection(COLLECTIONS.PATIENTS);
      
      // Clear existing patients and insert new ones
      await collection.deleteMany({});
      
      if (patients.length > 0) {
        // Remove 'id' field and let MongoDB generate _id
        const patientsToInsert = patients.map(({ id, ...patient }) => ({
          ...patient,
          createdAt: patient.createdAt || new Date(),
          updatedAt: new Date()
        }));
        
        await collection.insertMany(patientsToInsert);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving patients:', error);
      return false;
    }
  }

  /**
   * Add a single patient to database
   * @param {Object} patient - Patient object
   * @returns {Promise<Object|null>} Created patient with database ID
   */
  async addPatient(patient) {
    try {
      const collection = await getCollection(COLLECTIONS.PATIENTS);
      const patientData = {
        ...patient,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await collection.insertOne(patientData);
      return { ...patientData, id: result.insertedId.toString() };
    } catch (error) {
      console.error('Error adding patient:', error);
      return null;
    }
  }

  // ==================== PRESCRIPTIONS OPERATIONS ====================

  /**
   * Get all prescriptions from database
   * @returns {Promise<Array>} Array of prescription objects
   */
  async getPrescriptions() {
    try {
      const collection = await getCollection(COLLECTIONS.PRESCRIPTIONS);
      const prescriptions = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return prescriptions.map(prescription => ({ ...prescription, id: prescription._id.toString() }));
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      return [];
    }
  }

  /**
   * Save prescriptions to database
   * @param {Array} prescriptions - Array of prescription objects
   * @returns {Promise<boolean>} Success status
   */
  async savePrescriptions(prescriptions) {
    try {
      const collection = await getCollection(COLLECTIONS.PRESCRIPTIONS);
      
      await collection.deleteMany({});
      
      if (prescriptions.length > 0) {
        const prescriptionsToInsert = prescriptions.map(({ id, ...prescription }) => ({
          ...prescription,
          createdAt: prescription.createdAt || new Date(),
          updatedAt: new Date()
        }));
        
        await collection.insertMany(prescriptionsToInsert);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving prescriptions:', error);
      return false;
    }
  }

  /**
   * Get prescriptions for a specific patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Array of prescriptions for the patient
   */
  async getPrescriptionsByPatient(patientId) {
    try {
      const collection = await getCollection(COLLECTIONS.PRESCRIPTIONS);
      const prescriptions = await collection.find({ patientId }).sort({ createdAt: -1 }).toArray();
      return prescriptions.map(prescription => ({ ...prescription, id: prescription._id.toString() }));
    } catch (error) {
      console.error('Error fetching prescriptions by patient:', error);
      return [];
    }
  }

  // ==================== BILLS OPERATIONS ====================

  /**
   * Get all bills from database
   * @returns {Promise<Array>} Array of bill objects
   */
  async getBills() {
    try {
      const collection = await getCollection(COLLECTIONS.BILLS);
      const bills = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return bills.map(bill => ({ ...bill, id: bill._id.toString() }));
    } catch (error) {
      console.error('Error fetching bills:', error);
      return [];
    }
  }

  /**
   * Save bills to database
   * @param {Array} bills - Array of bill objects
   * @returns {Promise<boolean>} Success status
   */
  async saveBills(bills) {
    try {
      const collection = await getCollection(COLLECTIONS.BILLS);
      
      await collection.deleteMany({});
      
      if (bills.length > 0) {
        const billsToInsert = bills.map(({ id, ...bill }) => ({
          ...bill,
          createdAt: bill.createdAt || new Date(),
          updatedAt: new Date()
        }));
        
        await collection.insertMany(billsToInsert);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving bills:', error);
      return false;
    }
  }

  /**
   * Get bills for a specific patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Array of bills for the patient
   */
  async getBillsByPatient(patientId) {
    try {
      const collection = await getCollection(COLLECTIONS.BILLS);
      const bills = await collection.find({ patientId }).sort({ createdAt: -1 }).toArray();
      return bills.map(bill => ({ ...bill, id: bill._id.toString() }));
    } catch (error) {
      console.error('Error fetching bills by patient:', error);
      return [];
    }
  }

  // ==================== TEMPLATES OPERATIONS ====================

  /**
   * Get all prescription templates
   * @returns {Promise<Array>} Array of template objects
   */
  async getTemplates() {
    try {
      const collection = await getCollection(COLLECTIONS.TEMPLATES);
      const templates = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return templates.map(template => ({ ...template, id: template._id.toString() }));
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }

  /**
   * Save templates to database
   * @param {Array} templates - Array of template objects
   * @returns {Promise<boolean>} Success status
   */
  async saveTemplates(templates) {
    try {
      const collection = await getCollection(COLLECTIONS.TEMPLATES);
      
      await collection.deleteMany({});
      
      if (templates.length > 0) {
        const templatesToInsert = templates.map(({ id, ...template }) => ({
          ...template,
          createdAt: template.createdAt || new Date(),
          updatedAt: new Date()
        }));
        
        await collection.insertMany(templatesToInsert);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving templates:', error);
      return false;
    }
  }

  // ==================== CUSTOM DATA OPERATIONS ====================

  /**
   * Generic function to get custom data (symptoms, diagnoses, lab tests, medications)
   * @param {string} type - Type of custom data
   * @returns {Promise<Array>} Array of custom items
   */
  async getCustomData(type) {
    try {
      const collectionName = COLLECTIONS[`CUSTOM_${type.toUpperCase()}`];
      if (!collectionName) {
        throw new Error(`Invalid custom data type: ${type}`);
      }
      
      const collection = await getCollection(collectionName);
      const result = await collection.findOne({ type });
      return result ? result.items : [];
    } catch (error) {
      console.error(`Error fetching custom ${type}:`, error);
      return [];
    }
  }

  /**
   * Generic function to save custom data
   * @param {string} type - Type of custom data
   * @param {Array} items - Array of custom items
   * @returns {Promise<boolean>} Success status
   */
  async saveCustomData(type, items) {
    try {
      const collectionName = COLLECTIONS[`CUSTOM_${type.toUpperCase()}`];
      if (!collectionName) {
        throw new Error(`Invalid custom data type: ${type}`);
      }
      
      const collection = await getCollection(collectionName);
      
      await collection.replaceOne(
        { type },
        { type, items, updatedAt: new Date() },
        { upsert: true }
      );
      
      return true;
    } catch (error) {
      console.error(`Error saving custom ${type}:`, error);
      return false;
    }
  }

  // Specific methods for each custom data type
  async getCustomSymptoms() {
    return this.getCustomData('symptoms');
  }

  async saveCustomSymptoms(symptoms) {
    return this.saveCustomData('symptoms', symptoms);
  }

  async getCustomDiagnoses() {
    return this.getCustomData('diagnoses');
  }

  async saveCustomDiagnoses(diagnoses) {
    return this.saveCustomData('diagnoses', diagnoses);
  }

  async getCustomLabTests() {
    return this.getCustomData('lab_tests');
  }

  async saveCustomLabTests(labTests) {
    return this.saveCustomData('lab_tests', labTests);
  }

  async getCustomMedications() {
    return this.getCustomData('medications');
  }

  async saveCustomMedications(medications) {
    return this.saveCustomData('medications', medications);
  }
}

// Export a singleton instance
export const databaseService = new DatabaseService();