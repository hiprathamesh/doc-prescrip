import { databaseService } from './databaseService.js';
import bcrypt from 'bcryptjs';

class DoctorService {
  constructor() {
    this.defaultDoctor = {
      doctorId: 'dr_prashant_nikam_chaitanya',
      name: 'Dr. Prashant Nikam',
      lastName: 'Nikam',
      email: 'roy@l.p',
      hospitalName: 'Chaitanya Hospital',
      hospitalAddress: 'Deola, Maharashtra',
      degree: 'MBBS, MD',
      registrationNumber: 'MH-12345',
      phone: '+91-9876543210',
      // Default password: "admin123"
      passwordHash: '$2a$10$8K1p/a0dL8.vKUBl3.H.4.ZXjY8qQwErY3HiJ9X4o8rK9m5N2L6Tm',
      accessType: 'admin', // admin, lifetime_free, trial
      isActive: true,
      expiryDate: null
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
      if (doctor) {
        // Check if account is expired for trial users
        if (doctor.accessType === 'trial' && doctor.expiryDate && new Date() > new Date(doctor.expiryDate)) {
          return { error: 'Account has expired. Please renew your subscription.' };
        }
        
        if (await bcrypt.compare(password, doctor.passwordHash)) {
          return doctor;
        }
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

  async validateAdminPassword(password) {
    try {
      // Check if password matches admin password (plain text or hashed)
      if (password === 'admin123') {
        return true;
      }
      
      // Also check against the hashed password
      const isValid = await bcrypt.compare(password, this.defaultDoctor.passwordHash);
      return isValid;
    } catch (error) {
      console.error('Error validating admin password:', error);
      return false;
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

  async validateRegistrationKey(key) {
    try {
      return await databaseService.validateRegistrationKey(key);
    } catch (error) {
      console.error('Error validating registration key:', error);
      return false;
    }
  }

  async useRegistrationKey(key, doctorId) {
    try {
      return await databaseService.useRegistrationKey(key, doctorId);
    } catch (error) {
      console.error('Error using registration key:', error);
      return false;
    }
  }

  async checkEmailExists(email) {
    try {
      const doctor = await databaseService.getDoctorByEmail(email);
      return !!doctor;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  }

  async checkPhoneExists(phone) {
    try {
      return await databaseService.checkPhoneExists(phone);
    } catch (error) {
      console.error('Error checking phone:', error);
      return false;
    }
  }

  async generateRegistrationKey() {
    try {
      // Generate a 16-character uppercase alphanumeric key
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let key = '';
      for (let i = 0; i < 16; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Format as XXXX-XXXX-XXXX-XXXX
      const formattedKey = key.match(/.{1,4}/g).join('-');
      
      const success = await databaseService.saveRegistrationKey(formattedKey);
      return success ? formattedKey : null;
    } catch (error) {
      console.error('Error generating registration key:', error);
      return null;
    }
  }

  // Update method to create unique doctor IDs using firstName and lastName
  generateDoctorId(firstName, lastName, hospitalName) {
    const cleanFirstName = firstName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanLastName = lastName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanHospital = hospitalName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `dr_${cleanFirstName}_${cleanLastName}_${cleanHospital}`;
  }

  async generateAndStoreOtp(identifier, type) {
    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const salt = await bcrypt.genSalt(10);
      const otpHash = await bcrypt.hash(otp, salt);
      const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store OTP hash, expiry, and reset failed attempts
      const success = await databaseService.storeOtp(identifier, type, otpHash, expiry);
      if (success) {
        await databaseService.resetOtpAttempts(identifier, type); // Reset failed attempts on new OTP
        return otp;
      }
      return null;
    } catch (error) {
      console.error('Error generating OTP:', error);
      return null;
    }
  }

  async verifyOtp(identifier, type, otp) {
    try {
      // Get OTP record: { otpHash, expiry, used, failedAttempts }
      const otpRecord = await databaseService.getOtpRecord(identifier, type);
      if (!otpRecord || otpRecord.used) return false;

      // Check expiry
      if (Date.now() > otpRecord.expiry) {
        await databaseService.markOtpUsed(identifier, type); // Expire OTP
        return false;
      }

      // Compare hash
      const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
      if (isValid) {
        await databaseService.markOtpUsed(identifier, type); // One-time use
        await databaseService.resetOtpAttempts(identifier, type);
        return true;
      } else {
        // Increment failed attempts
        const attempts = await databaseService.incrementOtpAttempts(identifier, type);
        if (attempts >= 5) {
          await databaseService.lockOtp(identifier, type, 30 * 60 * 1000); // 30 min lockout
        }
        return false;
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return false;
    }
  }

  async cleanupOtps(email, phone) {
    try {
      if (phone) {
        await databaseService.cleanupOtps(email, phone);
      } else {
        await databaseService.cleanupOtps(email, null);
      }
      return true;
    } catch (error) {
      console.error('Error cleaning up OTPs:', error);
      return false;
    }
  }

  generateRandomPassword() {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the remaining 8 characters randomly
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password to randomize positions
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

export const doctorService = new DoctorService();
