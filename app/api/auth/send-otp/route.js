import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const OTP_ATTEMPT_LIMIT = 5;
const OTP_ATTEMPT_WINDOW = 15 * 60; // 15 minutes
const OTP_LOCKOUT_TIME = 30 * 60; // 30 minutes
const OTP_VERIFY_ATTEMPT_LIMIT = 5;
const OTP_VERIFY_LOCKOUT_TIME = 30 * 60; // 30 minutes

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

// Add brute force protection for OTP verification
export async function verifyOtpHandler(email, otp) {
  const verifyKey = `otp:verify:attempts:${email}`;
  const verifyLockKey = `otp:verify:lockout:${email}`;
  const locked = await redis.get(verifyLockKey);
  if (locked) return { locked: true };

  let attempts = await redis.get(verifyKey);
  attempts = attempts ? parseInt(attempts) : 0;
  if (attempts >= OTP_VERIFY_ATTEMPT_LIMIT) {
    await redis.set(verifyLockKey, '1', { ex: OTP_VERIFY_LOCKOUT_TIME });
    return { locked: true };
  }
  return { locked: false, attempts, verifyKey, verifyLockKey };
}

export async function incrementOtpVerifyAttempts(verifyKey) {
  await redis.incr(verifyKey);
  await redis.expire(verifyKey, OTP_ATTEMPT_WINDOW);
}

export async function resetOtpVerifyAttempts(verifyKey, verifyLockKey) {
  await redis.del(verifyKey);
  await redis.del(verifyLockKey);
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
  // Redirect HTTP to HTTPS (only in production)
  if (process.env.NODE_ENV === 'production' && request.headers.get('x-forwarded-proto') === 'http') {
    return NextResponse.redirect(`https://${request.headers.get('host')}${request.url}`, 308);
  }

  return new Response(JSON.stringify({ 
    success: false, 
    error: 'This endpoint is deprecated. Please use NextAuth authentication.' 
  }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' }
  });
}

