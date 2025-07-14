import { getCollection } from '../lib/mongodb';
import { ObjectId } from 'mongodb';

class DatabaseService {
  constructor() {
    this.collections = {
      patients: 'patients',
      prescriptions: 'prescriptions', 
      bills: 'bills',
      templates: 'templates',
      customData: 'custom-data',
      doctors: 'doctors',
      registrationKeys: 'registration-keys',
      otps: 'otps',
      hospitalLogos: 'hospital-logos' // Add new collection
    };
  }

  // Helper method to ensure doctor context
  validateDoctorId(doctorId) {
    if (!doctorId || doctorId === 'default-doctor') {
      throw new Error('Invalid doctor context - multi-tenant violation');
    }
    return doctorId;
  }

  // ==================== PATIENTS OPERATIONS ====================
  
  async getPatients(doctorId = 'default-doctor') {
    try {
      const validDoctorId = this.validateDoctorId(doctorId);
      const collection = await getCollection(this.collections.patients);
      const patients = await collection.find({ doctorId: validDoctorId }).sort({ createdAt: -1 }).toArray();
      return patients.map(patient => ({ 
        ...patient, 
        id: patient.patientId || patient._id.toString() 
      }));
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  }

  async savePatients(patients, doctorId = 'default-doctor') {
    try {
      const validDoctorId = this.validateDoctorId(doctorId);
      const collection = await getCollection(this.collections.patients);
      
      // Clear existing patients for this doctor only
      const deleteResult = await collection.deleteMany({ doctorId: validDoctorId });
      console.log(`Deleted ${deleteResult.deletedCount} existing patients for doctor ${doctorId}`);
      
      if (patients.length > 0) {
        const patientsToInsert = patients.map(({ id, ...patient }) => ({
          ...patient,
          doctorId: validDoctorId,
          patientId: id,
          createdAt: patient.createdAt || new Date(),
          updatedAt: new Date()
        }));
        
        const insertResult = await collection.insertMany(patientsToInsert);
        console.log(`Inserted ${insertResult.insertedCount} patients for doctor ${doctorId}`);
      }
      
      return true;
    } catch (error) {
      console.error('Database error saving patients:', error);
      return false;
    }
  }

  // ==================== PRESCRIPTIONS OPERATIONS ====================
  
  async getPrescriptions(doctorId = 'default-doctor') {
    try {
      const validDoctorId = this.validateDoctorId(doctorId);
      const collection = await getCollection(this.collections.prescriptions);
      const prescriptions = await collection.find({ doctorId: validDoctorId }).sort({ createdAt: -1 }).toArray();
      return prescriptions.map(prescription => ({ ...prescription, id: prescription._id.toString() }));
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      return [];
    }
  }

  async savePrescriptions(prescriptions, doctorId = 'default-doctor') {
    try {
      const validDoctorId = this.validateDoctorId(doctorId);
      const collection = await getCollection(this.collections.prescriptions);
      await collection.deleteMany({ doctorId: validDoctorId });
      
      if (prescriptions.length > 0) {
        const prescriptionsToInsert = prescriptions.map(({ id, ...prescription }) => ({
          ...prescription,
          doctorId: validDoctorId,
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

  async getPrescriptionsByPatient(patientId, doctorId = 'default-doctor') {
    try {
      const validDoctorId = this.validateDoctorId(doctorId);
      const collection = await getCollection(this.collections.prescriptions);
      const prescriptions = await collection.find({ 
        doctorId: validDoctorId,
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

  async savePrescription(prescription, doctorId = 'default-doctor') {
    try {
      const validDoctorId = this.validateDoctorId(doctorId);
      const collection = await getCollection(this.collections.prescriptions);

      // Helper to check for valid ObjectId
      const isValidObjectId = (id) => {
        return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
      };

      if (prescription.id && isValidObjectId(prescription.id)) {
        // Update existing prescription
        const { id, ...updateData } = prescription;
        const prescriptionToUpdate = {
          ...updateData,
          doctorId: validDoctorId,
          updatedAt: new Date()
        };

        const result = await collection.replaceOne(
          { _id: new ObjectId(id), doctorId: validDoctorId },
          prescriptionToUpdate
        );

        if (result.matchedCount === 0) {
          throw new Error(`Prescription with id ${id} not found for doctor ${doctorId}`);
        }

        return { ...prescriptionToUpdate, id };
      } else {
        // Insert new prescription (either no id or not a valid ObjectId)
        const prescriptionToSave = {
          ...prescription,
          doctorId: validDoctorId,
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
  
  async getBills(doctorId = 'default-doctor') {
    try {
      const validDoctorId = this.validateDoctorId(doctorId);
      const collection = await getCollection(this.collections.bills);
      const bills = await collection.find({ doctorId: validDoctorId }).sort({ createdAt: -1 }).toArray();
      return bills.map(bill => ({ ...bill, id: bill._id.toString() }));
    } catch (error) {
      console.error('Error fetching bills:', error);
      return [];
    }
  }

  async saveBills(bills, doctorId = 'default-doctor') {
    try {
      const validDoctorId = this.validateDoctorId(doctorId);
      const collection = await getCollection(this.collections.bills);
      await collection.deleteMany({ doctorId: validDoctorId });
      
      if (bills.length > 0) {
        const billsToInsert = bills.map(({ id, ...bill }) => ({
          ...bill,
          doctorId: validDoctorId,
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

  async getBillsByPatient(patientId, doctorId = 'default-doctor') {
    try {
      const validDoctorId = this.validateDoctorId(doctorId);
      const collection = await getCollection(this.collections.bills);
      const bills = await collection.find({ 
        doctorId: validDoctorId,
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
  
  async getTemplates(doctorId = 'default-doctor') {
    try {
      const validDoctorId = this.validateDoctorId(doctorId);
      const collection = await getCollection(this.collections.templates);
      const templates = await collection.find({ doctorId: validDoctorId }).sort({ createdAt: -1 }).toArray();
      return templates.map(template => ({ 
        ...template, 
        id: template._id.toString(),
        templateId: template.templateId || template._id.toString() // Fallback for existing templates
      }));
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }

  async saveTemplates(templates, doctorId = 'default-doctor') {
    try {
      const validDoctorId = this.validateDoctorId(doctorId);
      const collection = await getCollection(this.collections.templates);
      await collection.deleteMany({ doctorId: validDoctorId });
      
      if (templates.length > 0) {
        const templatesToInsert = templates.map(({ id, ...template }) => ({
          ...template,
          doctorId: validDoctorId,
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

  async saveTemplate(template, doctorId = 'default-doctor') {
    try {
      const validDoctorId = this.validateDoctorId(doctorId);
      const collection = await getCollection(this.collections.templates);
      
      // Generate templateId if not provided
      const templateId = template.templateId || `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const templateToSave = {
        ...template,
        templateId,
        doctorId: validDoctorId,
        createdAt: template.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      if (template.id && template.templateId) {
        // Update existing template using templateId
        const { id, ...updateData } = templateToSave;
        const result = await collection.replaceOne(
          { templateId: template.templateId, doctorId: validDoctorId },
          updateData
        );
        
        if (result.matchedCount === 0) {
          // If no match found, try by _id for backwards compatibility
          await collection.replaceOne(
            { _id: new ObjectId(template.id), doctorId: validDoctorId },
            { ...updateData, templateId }
          );
        }
        templateToSave.id = template.id;
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

  async deleteTemplate(templateId, doctorId = 'default-doctor') {
    try {
      const validDoctorId = this.validateDoctorId(doctorId);
      const collection = await getCollection(this.collections.templates);
      const result = await collection.deleteOne({ 
        templateId: templateId, 
        doctorId: validDoctorId 
      });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  }

  async updateTemplateUsage(templateId, lastUsed, doctorId) {
    try {
      const validDoctorId = this.validateDoctorId(doctorId);
      // Update the template's lastUsed field in the database
      const collection = await getCollection(this.collections.templates);
      const result = await collection.updateOne(
        { 
          templateId: templateId,
          doctorId: validDoctorId 
        },
        { 
          $set: { 
            lastUsed: new Date(lastUsed),
            updatedAt: new Date()
          } 
        }
      );
      
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Database error updating template usage:', error);
      return false;
    }
  }

  // ==================== CUSTOM DATA OPERATIONS ====================
  
  async getCustomData(type, doctorId = 'default-doctor') {
    try {
      const validDoctorId = this.validateDoctorId(doctorId);
      const collection = await getCollection(this.collections.customData);
      const result = await collection.findOne({ type, doctorId: validDoctorId });
      return result ? result.items : [];
    } catch (error) {
      console.error(`Error fetching custom ${type}:`, error);
      return [];
    }
  }

  async saveCustomData(type, items, doctorId = 'default-doctor') {
    try {
      const validDoctorId = this.validateDoctorId(doctorId);
      const collection = await getCollection(this.collections.customData);
      await collection.replaceOne(
        { type, doctorId: validDoctorId },
        { 
          type, 
          doctorId: validDoctorId,
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
  async getCustomSymptoms(doctorId = 'default-doctor') {
    return this.getCustomData('symptoms', doctorId);
  }

  async saveCustomSymptoms(symptoms, doctorId = 'default-doctor') {
    return this.saveCustomData('symptoms', symptoms, doctorId);
  }

  async getCustomDiagnoses(doctorId = 'default-doctor') {
    return this.getCustomData('diagnoses', doctorId);
  }

  async saveCustomDiagnoses(diagnoses, doctorId = 'default-doctor') {
    return this.saveCustomData('diagnoses', diagnoses, doctorId);
  }

  async getCustomLabTests(doctorId = 'default-doctor') {
    return this.getCustomData('lab-tests', doctorId);
  }

  async saveCustomLabTests(labTests, doctorId = 'default-doctor') {
    return this.saveCustomData('lab-tests', labTests, doctorId);
  }

  async getCustomMedications(doctorId = 'default-doctor') {
    return this.getCustomData('medications', doctorId);
  }

  async saveCustomMedications(medications, doctorId = 'default-doctor') {
    return this.saveCustomData('medications', medications, doctorId);
  }

  // ==================== DOCTOR OPERATIONS ====================
  
  async getDoctorById(doctorId) {
    try {
      const collection = await getCollection(this.collections.doctors);
      const doctor = await collection.findOne({ doctorId });
      return doctor;
    } catch (error) {
      console.error('Error fetching doctor by ID:', error);
      return null;
    }
  }

  async getDoctorByEmail(email) {
    try {
      const collection = await getCollection(this.collections.doctors);
      const doctor = await collection.findOne({ email });
      return doctor;
    } catch (error) {
      console.error('Error fetching doctor by email:', error);
      return null;
    }
  }

  async saveDoctor(doctor) {
    try {
      const collection = await getCollection(this.collections.doctors);
      const doctorToSave = {
        ...doctor,
        createdAt: doctor.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      const result = await collection.insertOne(doctorToSave);
      return result.acknowledged;
    } catch (error) {
      console.error('Error saving doctor:', error);
      return false;
    }
  }

  async updateDoctorPassword(doctorId, passwordHash) {
    try {
      const collection = await getCollection(this.collections.doctors);
      const result = await collection.updateOne(
        { doctorId },
        { 
          $set: { 
            passwordHash,
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating doctor password:', error);
      return false;
    }
  }

  async getAllDoctors() {
    try {
      const collection = await getCollection(this.collections.doctors);
      const doctors = await collection.find({}).sort({ createdAt: -1 }).toArray();
      // Remove password hashes from response
      return doctors.map(({ passwordHash, ...doctor }) => doctor);
    } catch (error) {
      console.error('Error fetching all doctors:', error);
      return [];
    }
  }

  async updateDoctorStatus(doctorId, isActive) {
    try {
      const collection = await getCollection(this.collections.doctors);
      const result = await collection.updateOne(
        { doctorId },
        { 
          $set: { 
            isActive,
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating doctor status:', error);
      return false;
    }
  }

  async updateDoctorProfile(doctorId, updates) {
    try {
      const collection = await getCollection(this.collections.doctors);
      const result = await collection.updateOne(
        { doctorId },
        { 
          $set: { 
            ...updates,
            updatedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating doctor profile:', error);
      return false;
    }
  }

  async checkPhoneExists(phone) {
    try {
      const collection = await getCollection(this.collections.doctors);
      const doctor = await collection.findOne({ phone });
      return !!doctor;
    } catch (error) {
      console.error('Error checking phone exists:', error);
      return false;
    }
  }

  // ==================== REGISTRATION KEY OPERATIONS ====================
  
  async saveRegistrationKey(key) {
    try {
      const collection = await getCollection(this.collections.registrationKeys);
      const keyData = {
        key,
        isUsed: false,
        usedBy: null,
        usedAt: null,
        createdAt: new Date()
      };
      
      const result = await collection.insertOne(keyData);
      return result.acknowledged;
    } catch (error) {
      console.error('Error saving registration key:', error);
      return false;
    }
  }

  async validateRegistrationKey(key) {
    try {
      const collection = await getCollection(this.collections.registrationKeys);
      const keyData = await collection.findOne({ key, isUsed: false });
      return !!keyData;
    } catch (error) {
      console.error('Error validating registration key:', error);
      return false;
    }
  }

  async getRegistrationKeyDetails(key) {
    try {
      const collection = await getCollection(this.collections.registrationKeys);
      const keyData = await collection.findOne({ key });
      return keyData;
    } catch (error) {
      console.error('Error getting registration key details:', error);
      return null;
    }
  }

  async useRegistrationKey(key, doctorId) {
    try {
      const collection = await getCollection(this.collections.registrationKeys);
      const result = await collection.updateOne(
        { key, isUsed: false },
        { 
          $set: { 
            isUsed: true,
            usedBy: doctorId,
            usedAt: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error using registration key:', error);
      return false;
    }
  }

  // ==================== OTP OPERATIONS ====================

  // Store OTP hash, expiry, and reset failed attempts
  async storeOtp(identifier, type, otpHash, expiry) {
    try {
      const collection = await getCollection(this.collections.otps);
      // Remove any existing OTP for this identifier and type
      await collection.deleteMany({ identifier, type });
      const otpData = {
        identifier,
        type,
        otpHash,
        expiry,
        used: false,
        failedAttempts: 0,
        lockedUntil: null,
        createdAt: new Date()
      };
      const result = await collection.insertOne(otpData);
      return result.acknowledged;
    } catch (error) {
      console.error('Error storing OTP:', error);
      return false;
    }
  }

  // Get OTP record for verification
  async getOtpRecord(identifier, type) {
    try {
      const collection = await getCollection(this.collections.otps);
      const otpRecord = await collection.findOne({ identifier, type });
      return otpRecord;
    } catch (error) {
      console.error('Error getting OTP record:', error);
      return null;
    }
  }

  // Mark OTP as used (one-time use or expired)
  async markOtpUsed(identifier, type) {
    try {
      const collection = await getCollection(this.collections.otps);
      await collection.updateOne(
        { identifier, type },
        { $set: { used: true } }
      );
      return true;
    } catch (error) {
      console.error('Error marking OTP used:', error);
      return false;
    }
  }

  // Increment failed OTP attempts and return new count
  async incrementOtpAttempts(identifier, type) {
    try {
      const collection = await getCollection(this.collections.otps);
      const result = await collection.findOneAndUpdate(
        { identifier, type },
        { $inc: { failedAttempts: 1 } },
        { returnDocument: 'after' }
      );
      return result.value ? result.value.failedAttempts : 0;
    } catch (error) {
      console.error('Error incrementing OTP attempts:', error);
      return 0;
    }
  }

  // Reset OTP failed attempts
  async resetOtpAttempts(identifier, type) {
    try {
      const collection = await getCollection(this.collections.otps);
      await collection.updateOne(
        { identifier, type },
        { $set: { failedAttempts: 0, lockedUntil: null } }
      );
      return true;
    } catch (error) {
      console.error('Error resetting OTP attempts:', error);
      return false;
    }
  }

  // Lock OTP for a period (e.g., after too many failed attempts)
  async lockOtp(identifier, type, lockDurationMs) {
    try {
      const collection = await getCollection(this.collections.otps);
      const lockedUntil = Date.now() + lockDurationMs;
      await collection.updateOne(
        { identifier, type },
        { $set: { lockedUntil } }
      );
      return true;
    } catch (error) {
      console.error('Error locking OTP:', error);
      return false;
    }
  }

  // Remove OTPs for given email and/or phone
  async cleanupOtps(email, phone) {
    try {
      const collection = await getCollection(this.collections.otps);
      const conditions = [{ identifier: email }];
      if (phone) {
        conditions.push({ identifier: phone });
      }
      await collection.deleteMany({ $or: conditions });
      return true;
    } catch (error) {
      console.error('Error cleaning up OTPs:', error);
      return false;
    }
  }

  // Remove expired OTPs
  async cleanupExpiredOtps() {
    try {
      const collection = await getCollection(this.collections.otps);
      const result = await collection.deleteMany({
        expiry: { $lt: Date.now() }
      });
      console.log(`Cleaned up ${result.deletedCount} expired OTPs`);
      return true;
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
      return false;
    }
  }

  // ==================== HOSPITAL LOGO OPERATIONS ====================
  
  async saveHospitalLogo(doctorId, logoData) {
    try {
      const collection = await getCollection(this.collections.hospitalLogos);
      const logoDocument = {
        doctorId,
        logoBase64: logoData.base64,
        fileName: logoData.fileName,
        fileSize: logoData.fileSize,
        mimeType: logoData.mimeType,
        uploadedAt: new Date(),
        updatedAt: new Date()
      };
      
      // Use upsert to replace existing logo or create new one
      const result = await collection.replaceOne(
        { doctorId },
        logoDocument,
        { upsert: true }
      );
      
      return result.acknowledged;
    } catch (error) {
      console.error('Error saving hospital logo:', error);
      return false;
    }
  }

  async getHospitalLogo(doctorId) {
    try {
      const collection = await getCollection(this.collections.hospitalLogos);
      const logoDocument = await collection.findOne({ doctorId });
      return logoDocument;
    } catch (error) {
      console.error('Error fetching hospital logo:', error);
      return null;
    }
  }

  async deleteHospitalLogo(doctorId) {
    try {
      const collection = await getCollection(this.collections.hospitalLogos);
      const result = await collection.deleteOne({ doctorId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting hospital logo:', error);
      return false;
    }
  }

  // Activity methods
  async getActivities(doctorId) {
    try {
      const collection = await getCollection('activities');
      const activities = await collection
        .find({ doctorId })
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray();
      
      return activities;
    } catch (error) {
      console.error('Error getting activities:', error);
      return [];
    }
  }

  async saveActivity(activity, doctorId) {
    try {
      const collection = await getCollection('activities');
      
      // Ensure the activity has the correct doctorId
      activity.doctorId = doctorId;
      activity.timestamp = activity.timestamp || new Date().toISOString();
      
      const result = await collection.insertOne(activity);
      
      if (result.insertedId) {
        return { ...activity, _id: result.insertedId };
      }
      
      return null;
    } catch (error) {
      console.error('Error saving activity:', error);
      return null;
    }
  }

  async clearOldActivities(doctorId, cutoffDays = 30) {
    try {
      const collection = await getCollection('activities');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - cutoffDays);

      const result = await collection.deleteMany({
        doctorId,
        timestamp: { $lt: cutoffDate.toISOString() }
      });

      return result.deletedCount;
    } catch (error) {
      console.error('Error clearing old activities:', error);
      return 0;
    }
  }
}

export const databaseService = new DatabaseService();