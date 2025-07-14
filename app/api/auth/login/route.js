import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW = 15 * 60; // 15 minutes
const LOGIN_LOCKOUT_TIME = 30 * 60; // 30 minutes

async function checkLoginRateLimit(email, ip) {
  const key = `login:attempts:${email}:${ip}`;
  const lockKey = `login:lockout:${email}:${ip}`;
  const locked = await redis.get(lockKey);
  if (locked) return { locked: true };

  let attempts = await redis.get(key);
  attempts = attempts ? parseInt(attempts) : 0;
  if (attempts >= LOGIN_ATTEMPT_LIMIT) {
    await redis.set(lockKey, '1', { ex: LOGIN_LOCKOUT_TIME });
    return { locked: true };
  }
  return { locked: false, attempts, key, lockKey };
}

async function incrementLoginAttempts(key) {
  await redis.incr(key);
  await redis.expire(key, LOGIN_ATTEMPT_WINDOW);
}

async function resetLoginAttempts(key, lockKey) {
  await redis.del(key);
  await redis.del(lockKey);
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Rate limiting and lockout
    const rate = await checkLoginRateLimit(email, ip);
    if (rate.locked) {
      return NextResponse.json(
        { success: false, error: 'Too many failed login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Import doctorService dynamically to avoid module loading issues
    const { doctorService } = await import('../../../../services/doctorService.js');

    // Initialize default doctor if it doesn't exist
    await doctorService.initializeDefaultDoctor();

    // Validate doctor credentials
    const doctor = await doctorService.validatePassword(email, password);

    if (!doctor) {
      await incrementLoginAttempts(rate.key);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    await resetLoginAttempts(rate.key, rate.lockKey);

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
