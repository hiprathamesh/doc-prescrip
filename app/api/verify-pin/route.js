import { NextResponse } from 'next/server';

// In-memory store for rate limiting (use Redis/database in production)
const attemptStore = new Map();

// Configuration
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('x-vercel-forwarded-for') || 
                    request.headers.get('cf-connecting-ip') ||
                    forwarded?.split(',')[0] ||
                    realIP ||
                    'unknown';
  return remoteAddr;
}

function getAttemptData(ip) {
  if (!attemptStore.has(ip)) {
    attemptStore.set(ip, {
      failedAttempts: 0,
      lastAttempt: 0,
      lockedUntil: 0,
      requestCount: 0,
      windowStart: Date.now()
    });
  }
  return attemptStore.get(ip);
}

function isRateLimited(ip) {
  const data = getAttemptData(ip);
  const now = Date.now();
  
  // Reset window if expired
  if (now - data.windowStart > RATE_LIMIT_WINDOW) {
    data.requestCount = 0;
    data.windowStart = now;
  }
  
  data.requestCount++;
  return data.requestCount > MAX_REQUESTS_PER_WINDOW;
}

function isLockedOut(ip) {
  const data = getAttemptData(ip);
  const now = Date.now();
  
  // Check if still locked out
  if (data.lockedUntil > now) {
    return {
      locked: true,
      remainingTime: Math.ceil((data.lockedUntil - now) / 1000)
    };
  }
  
  // Reset if lockout expired
  if (data.lockedUntil > 0 && data.lockedUntil <= now) {
    data.failedAttempts = 0;
    data.lockedUntil = 0;
  }
  
  return { locked: false, remainingTime: 0 };
}

function recordFailedAttempt(ip) {
  const data = getAttemptData(ip);
  const now = Date.now();
  
  data.failedAttempts++;
  data.lastAttempt = now;
  
  // Progressive lockout
  if (data.failedAttempts >= MAX_ATTEMPTS) {
    // Exponential backoff: 15 min, 30 min, 1 hour, 2 hours, etc.
    const lockoutMultiplier = Math.pow(2, Math.floor(data.failedAttempts / MAX_ATTEMPTS) - 1);
    data.lockedUntil = now + (LOCKOUT_DURATION * lockoutMultiplier);
  }
  
  return data.failedAttempts;
}

function recordSuccessfulAttempt(ip) {
  if (attemptStore.has(ip)) {
    attemptStore.delete(ip);
  }
}

export async function POST(request) {
  try {
    const clientIP = getClientIP(request);
    
    // Check rate limiting
    if (isRateLimited(clientIP)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please wait before trying again.',
          rateLimited: true 
        },
        { status: 429 }
      );
    }
    
    // Check if IP is locked out
    const lockoutStatus = isLockedOut(clientIP);
    if (lockoutStatus.locked) {
      const minutes = Math.ceil(lockoutStatus.remainingTime / 60);
      return NextResponse.json(
        { 
          success: false, 
          error: `Account temporarily locked. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
          lockedOut: true,
          remainingTime: lockoutStatus.remainingTime
        },
        { status: 423 }
      );
    }
    
    const { pin } = await request.json();
    
    // Validate PIN format and length
    if (!pin || typeof pin !== 'string' || !/^\d+$/.test(pin)) {
      recordFailedAttempt(clientIP);
      return NextResponse.json(
        { success: false, error: 'Invalid PIN format' },
        { status: 400 }
      );
    }
    
    if (pin.length < 4 || pin.length > 10) {
      recordFailedAttempt(clientIP);
      return NextResponse.json(
        { success: false, error: 'PIN must be between 4 and 10 digits' },
        { status: 400 }
      );
    }
    
    const correctPin = process.env.SITE_PIN || '123456';
    
    if (pin === correctPin) {
      recordSuccessfulAttempt(clientIP);
      
      const response = NextResponse.json({ success: true });
      
      // Set secure cookie that expires in 24 hours
      response.cookies.set('pin-auth', 'authorized', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 // 24 hours
      });
      
      return response;
    } else {
      const failedAttempts = recordFailedAttempt(clientIP);
      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - failedAttempts);
      
      let errorMessage = 'Invalid PIN. Please try again.';
      if (remainingAttempts <= 2 && remainingAttempts > 0) {
        errorMessage += ` ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`;
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          remainingAttempts: remainingAttempts
        },
        { status: 401 }
      );
    }
  } catch (error) {
    const clientIP = getClientIP(request);
    recordFailedAttempt(clientIP);
    
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
