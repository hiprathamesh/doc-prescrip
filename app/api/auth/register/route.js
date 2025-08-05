import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '../../../../lib/mongodb';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const REGISTER_ATTEMPT_LIMIT = 5;
const REGISTER_ATTEMPT_WINDOW = 30 * 60; // 30 minutes
const REGISTER_LOCKOUT_TIME = 60 * 60; // 1 hour

async function checkRegisterRateLimit(email, phone, ip) {
  const key = `register:attempts:${email}:${phone}:${ip}`;
  const lockKey = `register:lockout:${email}:${phone}:${ip}`;
  const locked = await redis.get(lockKey);
  if (locked) return { locked: true };

  let attempts = await redis.get(key);
  attempts = attempts ? parseInt(attempts) : 0;
  if (attempts >= REGISTER_ATTEMPT_LIMIT) {
    await redis.set(lockKey, '1', { ex: REGISTER_LOCKOUT_TIME });
    return { locked: true };
  }
  return { locked: false, attempts, key, lockKey };
}

async function incrementRegisterAttempts(key) {
  await redis.incr(key);
  await redis.expire(key, REGISTER_ATTEMPT_WINDOW);
}

async function resetRegisterAttempts(key, lockKey) {
  await redis.del(key);
  await redis.del(lockKey);
}

// Generate unique doctor ID
function generateDoctorId(firstName, lastName, hospitalName) {
  const baseId = `${firstName.toLowerCase().replace(/[^a-z]/g, '')}_${lastName.toLowerCase().replace(/[^a-z]/g, '')}_${hospitalName.toLowerCase().replace(/[^a-z]/g, '')}`;
  return baseId;
}

export async function POST(request) {
  // Redirect HTTP to HTTPS (only in production)
  if (process.env.NODE_ENV === 'production' && request.headers.get('x-forwarded-proto') === 'http') {
    return NextResponse.redirect(`https://${request.headers.get('host')}${request.url}`, 308);
  }

  try {
    const { 
      firstName,
      lastName,
      email, 
      password, 
      hospitalName, 
      hospitalAddress, 
      degree, 
      registrationNumber, 
      phone,
      accessKey 
    } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !hospitalName || !degree || !registrationNumber || !phone) {
      return NextResponse.json(
        { success: false, error: 'All required fields must be provided including first name, last name, and phone number' },
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

    // Validate phone format (basic validation)
    const phoneRegex = /^[\+]?[1-9][\d]{3,14}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':",.<>/?\\|`~]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.' },
        { status: 400 }
      );
    }

    const { doctorService } = await import('../../../../services/doctorService');

    const client = await clientPromise;
    const db = client.db('doc-prescrip');
    const doctors = db.collection('doctors');

    // Check if email already exists
    const emailExists = await doctors.findOne({ email });
    if (emailExists) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Check if phone already exists
    const phoneExists = await doctors.findOne({ phone });
    if (phoneExists) {
      return NextResponse.json(
        { success: false, error: 'An account with this phone number already exists' },
        { status: 409 }
      );
    }

    let accessType = 'trial';
    let expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6); // 6 months from now

    // Validate access key if provided
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
    let doctorId = generateDoctorId(firstName, lastName, hospitalName);
    
    // Ensure uniqueness
    let counter = 1;
    let uniqueDoctorId = doctorId;
    while (await doctors.findOne({ doctorId: uniqueDoctorId })) {
      uniqueDoctorId = `${doctorId}_${counter}`;
      counter++;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create doctor object
    const newDoctor = {
      doctorId: uniqueDoctorId,
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
      emailVerified: false, // Will be verified through NextAuth
      isActive: true,
      profileComplete: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Rate limiting and lockout
    const rate = await checkRegisterRateLimit(email, phone, ip);
    if (rate.locked) {
      return NextResponse.json(
        { success: false, error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Save doctor
    const result = await doctors.insertOne(newDoctor);

    if (result.insertedId) {
      await resetRegisterAttempts(rate.key, rate.lockKey);
      // If access key was used, mark it as used
      if (accessKey && accessKey.trim()) {
        await doctorService.useRegistrationKey(accessKey.trim(), doctorId);
      }

      return NextResponse.json({
        success: true,
        message: 'Doctor registered successfully. Please sign in with your credentials.',
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
      await incrementRegisterAttempts(rate.key);
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
