import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Import doctorService dynamically to avoid module loading issues
    const { doctorService } = await import('../../../../services/doctorService.js');

    // Initialize default doctor if it doesn't exist
    await doctorService.initializeDefaultDoctor();

    // Validate doctor credentials
    const doctor = await doctorService.validatePassword(email, password);

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create response with doctor data
    const response = NextResponse.json({
      success: true,
      doctor: {
        doctorId: doctor.doctorId,
        firstName: doctor.firstName || doctor.name?.split(' ')[0] || 'Dr.',
        lastName: doctor.lastName || doctor.name?.split(' ').slice(1).join(' ') || 'Nikam',
        name: doctor.name || `${doctor.firstName || 'Dr.'} ${doctor.lastName || 'Nikam'}`,
        email: doctor.email,
        hospitalName: doctor.hospitalName,
        hospitalAddress: doctor.hospitalAddress,
        degree: doctor.degree,
        registrationNumber: doctor.registrationNumber,
        phone: doctor.phone,
        accessType: doctor.accessType || 'doctor' // Include accessType
      }
    });

    // Set authentication cookie
    response.cookies.set('doctor-auth', doctor.doctorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
