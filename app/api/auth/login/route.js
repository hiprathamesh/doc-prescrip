import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import jwt from 'jsonwebtoken';

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

// JWT validation utility
function validateJwt(token) {
  try {
    const secret = process.env.JWT_SECRET || 'default_jwt_secret';
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
}

export async function POST(request) {
  // Redirect HTTP to HTTPS (only in production)
  if (process.env.NODE_ENV === 'production' && request.headers.get('x-forwarded-proto') === 'http') {
    return NextResponse.redirect(`https://${request.headers.get('host')}${request.url}`, 308);
  }

  try {
    const { email, password } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Strong password validation
    // const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':",.<>/?\\|`~]).{8,}$/;
    // if (!strongPasswordRegex.test(password)) {
    //   return NextResponse.json(
    //     { success: false, error: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.' },
    //     { status: 400 }
    //   );
    // }

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

    // Generate JWT access token (short-lived)
    const jwtPayload = {
      doctorId: doctor.doctorId,
      email: doctor.email,
      name: doctor.name,
      accessType: doctor.accessType || 'doctor',
      iss: process.env.JWT_ISSUER,
      aud: process.env.JWT_AUDIENCE
    };
    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
    const accessToken = jwt.sign(jwtPayload, jwtSecret, { expiresIn: '15m' });

    // Generate refresh token (long-lived, random string)
    const refreshToken = jwt.sign(
      { doctorId: doctor.doctorId, type: 'refresh', iss: process.env.JWT_ISSUER, aud: process.env.JWT_AUDIENCE },
      jwtSecret,
      { expiresIn: '30d' }
    );

    // Store refresh token in Redis for rotation/revocation
    await redis.set(`refresh:${doctor.doctorId}:${refreshToken}`, 'valid', { ex: 30 * 24 * 60 * 60 });

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
        accessType: doctor.accessType || 'doctor'
      }
    });

    // Set authentication cookies
    response.cookies.set('doctor-auth', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/'
    });
    response.cookies.set('doctor-refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
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
