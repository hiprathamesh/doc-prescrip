import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    const { doctorService } = await import('../../../../services/doctorService');

    // Initialize default doctor if needed
    await doctorService.initializeDefaultDoctor();

    // Verify admin password
    const isValidAdmin = await doctorService.validateAdminPassword(password);
    
    if (!isValidAdmin) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin password' },
        { status: 401 }
      );
    }

    // Generate new key
    const newKey = await doctorService.generateRegistrationKey();

    if (newKey) {
      return NextResponse.json({
        success: true,
        key: newKey,
        message: 'Registration key generated successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to generate key' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Key generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
