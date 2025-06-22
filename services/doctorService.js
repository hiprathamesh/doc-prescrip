import { databaseService } from './databaseService.js';
import bcrypt from 'bcryptjs';

class DoctorService {
  constructor() {
    this.defaultDoctor = {
      doctorId: 'dr_prashant_nikam_chaitanya',
      name: 'Dr. Prashant Nikam',
      email: 'admin@chaitanyahospital.com',
      hospitalName: 'Chaitanya Hospital',
      hospitalAddress: 'Deola, Maharashtra',
      degree: 'MBBS, MD',
      registrationNumber: 'MH-12345',
      phone: '+91-9876543210',
      // Default password: "admin123"
      passwordHash: '$2a$10$8K1p/a0dL8.vKUBl3.H.4.ZXjY8qQwErY3HiJ9X4o8rK9m5N2L6Tm'
    };
  }

  async initializeDefaultDoctor() {
    try {
      // Check if default doctor exists
      const existingDoctor = await databaseService.getDoctorById(this.defaultDoctor.doctorId);
      
      if (!existingDoctor) {
        // Create default doctor
        console.log('Creating default doctor...');
        await databaseService.saveDoctor(this.defaultDoctor);
        console.log('Default doctor created successfully');
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing default doctor:', error);
      return false;
    }
  }

  async validatePassword(email, password) {
    try {
      // Check against database first
      const doctor = await databaseService.getDoctorByEmail(email);
      if (doctor && await bcrypt.compare(password, doctor.passwordHash)) {
        return doctor;
      }

      // Fallback to default doctor for backward compatibility
      if (email === this.defaultDoctor.email) {
        if (password === 'admin123') {
          return this.defaultDoctor;
        }
        
        const isValid = await bcrypt.compare(password, this.defaultDoctor.passwordHash);
        if (isValid) {
          return this.defaultDoctor;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error validating doctor password:', error);
      return null;
    }
  }

  async updatePassword(doctorId, newPassword) {
    try {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);
      
      const success = await databaseService.updateDoctorPassword(doctorId, passwordHash);
      return success;
    } catch (error) {
      console.error('Error updating doctor password:', error);
      return false;
    }
  }

  async getDoctorById(doctorId) {
    try {
      if (doctorId === this.defaultDoctor.doctorId) {
        return this.defaultDoctor;
      }
      
      return await databaseService.getDoctorById(doctorId);
    } catch (error) {
      console.error('Error getting doctor by ID:', error);
      return null;
    }
  }

  async getDoctorByEmail(email) {
    try {
      return await databaseService.getDoctorByEmail(email);
    } catch (error) {
      console.error('Error getting doctor by email:', error);
      return null;
    }
  }

  async createDoctor(doctorData) {
    try {
      const success = await databaseService.saveDoctor(doctorData);
      return success;
    } catch (error) {
      console.error('Error creating doctor:', error);
      return false;
    }
  }

  async getAllDoctors() {
    try {
      return await databaseService.getAllDoctors();
    } catch (error) {
      console.error('Error getting all doctors:', error);
      return [];
    }
  }

  async updateDoctorStatus(doctorId, isActive) {
    try {
      return await databaseService.updateDoctorStatus(doctorId, isActive);
    } catch (error) {
      console.error('Error updating doctor status:', error);
      return false;
    }
  }

  async updateDoctorProfile(doctorId, updates) {
    try {
      return await databaseService.updateDoctorProfile(doctorId, updates);
    } catch (error) {
      console.error('Error updating doctor profile:', error);
      return false;
    }
  }

  // Add method to create unique doctor IDs
  generateDoctorId(name, hospitalName) {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanHospital = hospitalName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `dr_${cleanName}_${cleanHospital}`;
  }
}

export const doctorService = new DoctorService();
