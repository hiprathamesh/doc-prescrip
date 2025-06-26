import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, emailOtp, registrationData } = await request.json();

    // Validate required fields
    if (!email || !emailOtp || !registrationData) {
      return NextResponse.json(
        { success: false, error: 'All verification details are required' },
        { status: 400 }
      );
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(emailOtp)) {
      return NextResponse.json(
        { success: false, error: 'Verification code must be 6 digits' },
        { status: 400 }
      );
    }

    const { doctorService } = await import('../../../../services/doctorService');

    // Verify email OTP
    const emailValid = await doctorService.verifyOtp(email, 'email', emailOtp);

    if (!emailValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email verification code' },
        { status: 400 }
      );
    }

    // Validate registration data
    const {
      firstName,
      lastName,
      password,
      hospitalName,
      hospitalAddress,
      degree,
      registrationNumber,
      phone,
      accessKey
    } = registrationData;

    if (!firstName || !lastName || !password || !hospitalName || !degree || !registrationNumber) {
      return NextResponse.json(
        { success: false, error: 'All required registration fields must be provided' },
        { status: 400 }
      );
    }

    // Check access key if provided
    let accessType = 'trial';
    let expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6);

    if (accessKey && accessKey.trim()) {
      const keyValid = await doctorService.validateRegistrationKey(accessKey.trim());
      if (!keyValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid or already used access key' },
          { status: 400 }
        );
      }
      accessType = 'lifetime_free';
      expiryDate = null;
    }

    // Generate unique doctor ID
    const doctorId = doctorService.generateDoctorId(firstName, lastName, hospitalName);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create doctor object
    const newDoctor = {
      doctorId,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      passwordHash,
      hospitalName,
      hospitalAddress: hospitalAddress || '',
      degree,
      registrationNumber,
      phone,
      accessType,
      expiryDate,
      createdAt: new Date(),
      isActive: true,
      emailVerified: true
    };

    // Save doctor
    const success = await doctorService.createDoctor(newDoctor);

    if (success) {
      // Mark access key as used if provided
      if (accessKey && accessKey.trim()) {
        await doctorService.useRegistrationKey(accessKey.trim(), doctorId);
      }

      // Clean up OTPs
      await doctorService.cleanupOtps(email, null);

      return NextResponse.json({
        success: true,
        message: 'Doctor registered successfully',
        doctor: {
          doctorId: newDoctor.doctorId,
          firstName: newDoctor.firstName,
          lastName: newDoctor.lastName,
          name: newDoctor.name,
          email: newDoctor.email,
          hospitalName: newDoctor.hospitalName,
          hospitalAddress: newDoctor.hospitalAddress,
          degree: newDoctor.degree,
          registrationNumber: newDoctor.registrationNumber,
          phone: newDoctor.phone,
          accessType: newDoctor.accessType,
          expiryDate: newDoctor.expiryDate
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to register doctor' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}