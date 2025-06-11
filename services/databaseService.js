import { getCollection } from '../lib/mongodb';
import { ObjectId } from 'mongodb'; // Add this import

const COLLECTIONS = {
  PATIENTS: 'patients',
  PRESCRIPTIONS: 'prescriptions',
  BILLS: 'bills',
  TEMPLATES: 'templates',
  CUSTOM_DATA: 'custom_data'
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
      return patients.map(patient => ({ 
        ...patient, 
        // Use patientId if available, otherwise fall back to _id conversion
        id: patient.patientId || patient._id.toString() 
      }));
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  }

  async savePatients(patients) {
    try {
      const collection = await getCollection(COLLECTIONS.PATIENTS);
      
      // Clear existing patients
      const deleteResult = await collection.deleteMany({});
      console.log(`Deleted ${deleteResult.deletedCount} existing patients`);
      
      if (patients.length > 0) {
        const patientsToInsert = patients.map(({ id, ...patient }) => ({
          ...patient,
          // Store the original string ID as a custom field to maintain consistency
          patientId: id,
          createdAt: patient.createdAt || new Date(),
          updatedAt: new Date()
        }));
        
        const insertResult = await collection.insertMany(patientsToInsert);
        console.log(`Inserted ${insertResult.insertedCount} patients`);
      }
      
      return true;
    } catch (error) {
      console.error('Database error saving patients:', error);
      return false;
    }
  }

  // ==================== PRESCRIPTIONS OPERATIONS ====================
  
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

  async getPrescriptionsByPatient(patientId) {
    try {
      const collection = await getCollection(COLLECTIONS.PRESCRIPTIONS);
      // Search by both patientId field and the string patientId to handle both cases
      const prescriptions = await collection.find({ 
        $or: [
          { patientId: patientId },
          { patientId: patientId.toString() }
        ]
      }).sort({ createdAt: -1 }).toArray();
      return prescriptions.map(prescription => ({ ...prescription, id: prescription._id.toString() }));
    } catch (error) {
      console.error('Error fetching prescriptions by patient:', error);
      return [];
    }
  }

  async savePrescription(prescription) {
    try {
      const collection = await getCollection(COLLECTIONS.PRESCRIPTIONS);

      // Helper to check for valid ObjectId
      const isValidObjectId = (id) => {
        return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
      };

      if (prescription.id && isValidObjectId(prescription.id)) {
        // Update existing prescription
        const { id, ...updateData } = prescription;
        const prescriptionToUpdate = {
          ...updateData,
          updatedAt: new Date()
        };

        const result = await collection.replaceOne(
          { _id: new ObjectId(id) },
          prescriptionToUpdate
        );

        if (result.matchedCount === 0) {
          throw new Error(`Prescription with id ${id} not found`);
        }

        return { ...prescriptionToUpdate, id };
      } else {
        // Insert new prescription (either no id or not a valid ObjectId)
        const prescriptionToSave = {
          ...prescription,
          createdAt: prescription.createdAt || new Date(),
          updatedAt: new Date()
        };

        // Remove the id field if it exists but is not a valid ObjectId
        delete prescriptionToSave.id;

        const result = await collection.insertOne(prescriptionToSave);
        return { ...prescriptionToSave, id: result.insertedId.toString() };
      }
    } catch (error) {
      console.error('Database error saving prescription:', error);
      throw new Error(`Database error: ${error.message}`);
    }
  }

  // ==================== BILLS OPERATIONS ====================
  
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

  async getBillsByPatient(patientId) {
    try {
      const collection = await getCollection(COLLECTIONS.BILLS);
      // Search by both patientId field and the string patientId to handle both cases
      const bills = await collection.find({ 
        $or: [
          { patientId: patientId },
          { patientId: patientId.toString() }
        ]
      }).sort({ createdAt: -1 }).toArray();
      return bills.map(bill => ({ ...bill, id: bill._id.toString() }));
    } catch (error) {
      console.error('Error fetching bills by patient:', error);
      return [];
    }
  }

  // ==================== TEMPLATES OPERATIONS ====================
  
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

  async saveTemplate(template) {
    try {
      const collection = await getCollection(COLLECTIONS.TEMPLATES);
      const templateToSave = {
        ...template,
        createdAt: template.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      if (template.id) {
        // Update existing template
        const { id, ...updateData } = templateToSave;
        await collection.replaceOne(
          { _id: new ObjectId(id) },
          updateData
        );
        templateToSave.id = id;
      } else {
        // Insert new template
        const result = await collection.insertOne(templateToSave);
        templateToSave.id = result.insertedId.toString();
      }
      
      return templateToSave;
    } catch (error) {
      console.error('Error saving template:', error);
      return null;
    }
  }

  async deleteTemplate(templateId) {
    try {
      const collection = await getCollection(COLLECTIONS.TEMPLATES);
      await collection.deleteOne({ _id: new ObjectId(templateId) });
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  }

  // ==================== CUSTOM DATA OPERATIONS ====================
  
  async getCustomData(type) {
    try {
      const collection = await getCollection(COLLECTIONS.CUSTOM_DATA);
      const result = await collection.findOne({ type });
      return result ? result.items : [];
    } catch (error) {
      console.error(`Error fetching custom ${type}:`, error);
      return [];
    }
  }

  async saveCustomData(type, items) {
    try {
      const collection = await getCollection(COLLECTIONS.CUSTOM_DATA);
      await collection.replaceOne(
        { type },
        { 
          type, 
          items: Array.isArray(items) ? items : [],
          updatedAt: new Date(),
          createdAt: new Date()
        },
        { upsert: true }
      );
      return true;
    } catch (error) {
      console.error(`Error saving custom ${type}:`, error);
      return false;
    }
  }

  // Custom data helpers
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
    return this.getCustomData('lab-tests');
  }

  async saveCustomLabTests(labTests) {
    return this.saveCustomData('lab-tests', labTests);
  }

  async getCustomMedications() {
    return this.getCustomData('medications');
  }

  async saveCustomMedications(medications) {
    return this.saveCustomData('medications', medications);
  }
}

export const databaseService = new DatabaseService();