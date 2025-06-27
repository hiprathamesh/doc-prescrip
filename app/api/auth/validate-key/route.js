import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { accessKey } = await request.json();

    if (!accessKey || !accessKey.trim()) {
      return NextResponse.json(
        { success: false, error: 'Access key is required' },
        { status: 400 }
      );
    }

    const { doctorService } = await import('../../../../services/doctorService');

    // Validate the access key
    const isValid = await doctorService.validateRegistrationKey(accessKey.trim());

    return NextResponse.json({
      success: true,
      isValid,
      message: isValid ? 'Access key is valid' : 'Access key is invalid or already used'
    });

  } catch (error) {
    console.error('Access key validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
