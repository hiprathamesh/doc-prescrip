import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const FORGOT_PASSWORD_LIMIT = 3;
const FORGOT_PASSWORD_WINDOW = 30 * 60; // 30 minutes
const FORGOT_PASSWORD_LOCKOUT = 60 * 60; // 1 hour

async function checkForgotPasswordRateLimit(email, ip) {
  const key = `forgot-password:attempts:${email}:${ip}`;
  const lockKey = `forgot-password:lockout:${email}:${ip}`;
  const locked = await redis.get(lockKey);
  if (locked) return { locked: true };

  let attempts = await redis.get(key);
  attempts = attempts ? parseInt(attempts) : 0;
  if (attempts >= FORGOT_PASSWORD_LIMIT) {
    await redis.set(lockKey, '1', { ex: FORGOT_PASSWORD_LOCKOUT });
    return { locked: true };
  }
  return { locked: false, attempts, key, lockKey };
}

async function incrementForgotPasswordAttempts(key) {
  await redis.incr(key);
  await redis.expire(key, FORGOT_PASSWORD_WINDOW);
}

async function resetForgotPasswordAttempts(key, lockKey) {
  await redis.del(key);
  await redis.del(lockKey);
}

export async function POST(request) {
  // Redirect HTTP to HTTPS (only in production)
  if (process.env.NODE_ENV === 'production' && request.headers.get('x-forwarded-proto') === 'http') {
    return NextResponse.redirect(`https://${request.headers.get('host')}${request.url}`, 308);
  }

  try {
    const { email } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Validate email
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
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

    // Rate limiting
    const rate = await checkForgotPasswordRateLimit(email, ip);
    if (rate.locked) {
      return NextResponse.json(
        { success: false, error: 'Too many password reset attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { doctorService } = await import('../../../../services/doctorService');
    const { emailService } = await import('../../../../services/emailService');

    // Check if doctor exists with this email
    const doctor = await doctorService.getDoctorByEmail(email);
    if (!doctor) {
      await incrementForgotPasswordAttempts(rate.key);
      return NextResponse.json(
        { success: false, error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // Generate new password (12 characters with uppercase, lowercase, numbers, and symbols)
    const newPassword = doctorService.generateRandomPassword();

    // Update doctor's password
    const passwordUpdated = await doctorService.updatePassword(doctor.doctorId, newPassword);
    if (!passwordUpdated) {
      await incrementForgotPasswordAttempts(rate.key);
      return NextResponse.json(
        { success: false, error: 'Failed to update password. Please try again.' },
        { status: 500 }
      );
    }

    // Send password reset email
    const emailSent = await emailService.sendPasswordResetEmail(email, newPassword, doctor.firstName || doctor.name?.split(' ')[0] || 'Doctor');
    
    if (!emailSent) {
      // Rollback password change if email fails
      console.error('Failed to send password reset email, but password was already changed');
      await incrementForgotPasswordAttempts(rate.key);
      return NextResponse.json(
        { success: false, error: 'Failed to send password reset email. Please try again.' },
        { status: 500 }
      );
    }

    await resetForgotPasswordAttempts(rate.key, rate.lockKey);

    return NextResponse.json({
      success: true,
      message: 'New password has been sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}