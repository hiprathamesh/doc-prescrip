import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { firstName, lastName, email, phone, resend } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
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

    const { doctorService } = await import('../../../../services/doctorService');
    const { emailService } = await import('../../../../services/emailService');

    // Check if email already exists (only for new registrations, not resends)
    if (!resend) {
      const emailExists = await doctorService.checkEmailExists(email);
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      const phoneExists = await doctorService.checkPhoneExists(phone);
      if (phoneExists) {
        return NextResponse.json(
          { success: false, error: 'An account with this phone number already exists' },
          { status: 409 }
        );
      }
    }

    // Generate and store email OTP only
    const emailOtp = await doctorService.generateAndStoreOtp(email, 'email');

    if (!emailOtp) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate verification code' },
        { status: 500 }
      );
    }

    // Send email OTP
    const emailSent = await emailService.sendOtpEmail(email, emailOtp, firstName);
    
    if (!emailSent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send email verification code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      emailSent: true
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

