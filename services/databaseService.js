import { getCollection } from '../lib/mongodb';

// Collection names
const COLLECTIONS = {
  PATIENTS: 'patients',
  PRESCRIPTIONS: 'prescriptions',
  BILLS: 'bills',
  TEMPLATES: 'templates',
  CUSTOM_SYMPTOMS: 'custom_symptoms',
  CUSTOM_DIAGNOSES: 'custom_diagnoses',
  CUSTOM_LAB_TESTS: 'custom_lab_tests',
  CUSTOM_MEDICATIONS: 'custom_medications'
};

/**
 * Database service class to handle all MongoDB operations
 */
class DatabaseService {
  
  // ==================== PATIENTS OPERATIONS ====================
  
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

  async savePatients(patients) {
    try {
      console.log('Saving patients to MongoDB:', patients.length);
      const collection = await getCollection(COLLECTIONS.PATIENTS);
      
      // Clear existing patients
      await collection.deleteMany({});
      
      if (patients.length > 0) {
        const patientsToInsert = patients.map(({ id, ...patient }) => ({
          ...patient,
          createdAt: patient.createdAt || new Date(),
          updatedAt: new Date()
        }));
        
        const result = await collection.insertMany(patientsToInsert);
        console.log('Patients inserted:', result.insertedCount);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving patients:', error);
      throw error; // Re-throw to see the actual error
    }
  }

  // ==================== CUSTOM DATA OPERATIONS ====================
  
  async getCustomSymptoms() {
    try {
      const collection = await getCollection(COLLECTIONS.CUSTOM_SYMPTOMS);
      const result = await collection.findOne({ type: 'symptoms' });
      return result ? result.items : [];
    } catch (error) {
      console.error('Error fetching custom symptoms:', error);
      return [];
    }
  }

  async saveCustomSymptoms(symptoms) {
    try {
      const collection = await getCollection(COLLECTIONS.CUSTOM_SYMPTOMS);
      await collection.replaceOne(
        { type: 'symptoms' },
        { type: 'symptoms', items: symptoms, updatedAt: new Date() },
        { upsert: true }
      );
      return true;
    } catch (error) {
      console.error('Error saving custom symptoms:', error);
      return false;
    }
  }

  async getCustomDiagnoses() {
    try {
      const collection = await getCollection(COLLECTIONS.CUSTOM_DIAGNOSES);
      const result = await collection.findOne({ type: 'diagnoses' });
      return result ? result.items : [];
    } catch (error) {
      console.error('Error fetching custom diagnoses:', error);
      return [];
    }
  }

  async saveCustomDiagnoses(diagnoses) {
    try {
      const collection = await getCollection(COLLECTIONS.CUSTOM_DIAGNOSES);
      await collection.replaceOne(
        { type: 'diagnoses' },
        { type: 'diagnoses', items: diagnoses, updatedAt: new Date() },
        { upsert: true }
      );
      return true;
    } catch (error) {
      console.error('Error saving custom diagnoses:', error);
      return false;
    }
  }

  async getCustomLabTests() {
    try {
      const collection = await getCollection(COLLECTIONS.CUSTOM_LAB_TESTS);
      const result = await collection.findOne({ type: 'lab_tests' });
      return result ? result.items : [];
    } catch (error) {
      console.error('Error fetching custom lab tests:', error);
      return [];
    }
  }

  async saveCustomLabTests(labTests) {
    try {
      const collection = await getCollection(COLLECTIONS.CUSTOM_LAB_TESTS);
      await collection.replaceOne(
        { type: 'lab_tests' },
        { type: 'lab_tests', items: labTests, updatedAt: new Date() },
        { upsert: true }
      );
      return true;
    } catch (error) {
      console.error('Error saving custom lab tests:', error);
      return false;
    }
  }

  async getCustomMedications() {
    try {
      const collection = await getCollection(COLLECTIONS.CUSTOM_MEDICATIONS);
      const result = await collection.findOne({ type: 'medications' });
      return result ? result.items : [];
    } catch (error) {
      console.error('Error fetching custom medications:', error);
      return [];
    }
  }

  async saveCustomMedications(medications) {
    try {
      const collection = await getCollection(COLLECTIONS.CUSTOM_MEDICATIONS);
      await collection.replaceOne(
        { type: 'medications' },
        { type: 'medications', items: medications, updatedAt: new Date() },
        { upsert: true }
      );
      return true;
    } catch (error) {
      console.error('Error saving custom medications:', error);
      return false;
    }
  }

  // Add other methods (prescriptions, bills, templates) here...
}

export const databaseService = new DatabaseService();