import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const OTP_ATTEMPT_LIMIT = 5;
const OTP_ATTEMPT_WINDOW = 15 * 60; // 15 minutes
const OTP_LOCKOUT_TIME = 30 * 60; // 30 minutes

async function checkOtpRateLimit(email, ip) {
  const key = `otp:attempts:${email}:${ip}`;
  const lockKey = `otp:lockout:${email}:${ip}`;
  const locked = await redis.get(lockKey);
  if (locked) return { locked: true };

  let attempts = await redis.get(key);
  attempts = attempts ? parseInt(attempts) : 0;
  if (attempts >= OTP_ATTEMPT_LIMIT) {
    await redis.set(lockKey, '1', { ex: OTP_LOCKOUT_TIME });
    return { locked: true };
  }
  return { locked: false, attempts, key, lockKey };
}

async function incrementOtpAttempts(key) {
  await redis.incr(key);
  await redis.expire(key, OTP_ATTEMPT_WINDOW);
}

async function resetOtpAttempts(key, lockKey) {
  await redis.del(key);
  await redis.del(lockKey);
}

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

    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Rate limiting and lockout
    const rate = await checkOtpRateLimit(email, ip);
    if (rate.locked) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Generate and store email OTP only
    const emailOtp = await doctorService.generateAndStoreOtp(email, 'email');

    if (!emailOtp) {
      await incrementOtpAttempts(rate.key);
      return NextResponse.json(
        { success: false, error: 'Failed to generate verification code' },
        { status: 500 }
      );
    }

    // Send email OTP
    const emailSent = await emailService.sendOtpEmail(email, emailOtp, firstName);
    
    if (!emailSent) {
      await incrementOtpAttempts(rate.key);
      return NextResponse.json(
        { success: false, error: 'Failed to send email verification code' },
        { status: 500 }
      );
    }

    await resetOtpAttempts(rate.key, rate.lockKey);

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

