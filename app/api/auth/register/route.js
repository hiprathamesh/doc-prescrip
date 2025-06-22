import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { 
      name, 
      email, 
      password, 
      hospitalName, 
      hospitalAddress, 
      degree, 
      registrationNumber, 
      phone 
    } = await request.json();

    // Validate required fields
    if (!name || !email || !password || !hospitalName || !degree || !registrationNumber) {
      return NextResponse.json(
        { success: false, error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const { doctorService } = await import('../../../../services/doctorService');

    // Check if doctor already exists
    const existingDoctor = await doctorService.getDoctorByEmail(email);
    if (existingDoctor) {
      return NextResponse.json(
        { success: false, error: 'A doctor with this email already exists' },
        { status: 409 }
      );
    }

    // Generate unique doctor ID
    const doctorId = `dr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create doctor object
    const newDoctor = {
      doctorId,
      name,
      email,
      passwordHash,
      hospitalName,
      hospitalAddress: hospitalAddress || '',
      degree,
      registrationNumber,
      phone: phone || '',
      createdAt: new Date(),
      isActive: true
    };

    // Save doctor
    const success = await doctorService.createDoctor(newDoctor);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Doctor registered successfully',
        doctor: {
          doctorId: newDoctor.doctorId,
          name: newDoctor.name,
          email: newDoctor.email,
          hospitalName: newDoctor.hospitalName,
          hospitalAddress: newDoctor.hospitalAddress,
          degree: newDoctor.degree,
          registrationNumber: newDoctor.registrationNumber,
          phone: newDoctor.phone
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to register doctor' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Doctor registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
