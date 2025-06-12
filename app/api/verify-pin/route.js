import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Enhanced configuration
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const MAX_LOCKOUT_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

// Add progressive lockout durations
const LOCKOUT_MULTIPLIERS = [1, 2, 4, 8, 16]; // Progressive backoff

// Security monitoring thresholds
const SECURITY_MONITORING = {
  REPEATED_LOCKOUTS_THRESHOLD: 3, // Alert after 3 lockouts in 24h
  MONITORING_WINDOW: 24 * 60 * 60 * 1000, // 24 hours
  HIGH_RATE_LIMIT_THRESHOLD: 50, // Alert if rate limited more than 50 times
};

function getClientIP(request) {
  // More comprehensive IP extraction
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const vercelIP = request.headers.get('x-vercel-forwarded-for');
  const cfIP = request.headers.get('cf-connecting-ip');
  const remoteAddr = request.headers.get('remote-addr');

  // Handle x-forwarded-for which can contain multiple IPs
  let clientIP = vercelIP || cfIP || realIP || remoteAddr;

  if (forwarded) {
    // Take the first IP from the forwarded chain
    clientIP = forwarded.split(',')[0].trim();
  }

  // Validate IP format (basic check)
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^(?:[a-fA-F0-9]*:+)+[a-fA-F0-9]+$/;
  if (clientIP && ipRegex.test(clientIP)) {
    return clientIP;
  }

  // Fallback to a default identifier
  return 'unknown-client';
}

async function logSecurityEvent(ip, event, details = {}) {
  try {
    const timestamp = new Date().toISOString();
    const logKey = `security_log:${ip}:${Date.now()}`;
    const logEntry = {
      timestamp,
      ip,
      event,
      details,
      userAgent: details.userAgent || 'unknown',
    };

    // Store security log with 7 day expiry
    await redis.set(logKey, JSON.stringify(logEntry), { ex: 7 * 24 * 60 * 60 });

    // Increment event counter for monitoring
    const eventCountKey = `event_count:${ip}:${event}`;
    const count = await redis.incr(eventCountKey);
    if (count === 1) {
      await redis.expire(eventCountKey, SECURITY_MONITORING.MONITORING_WINDOW / 1000);
    }

    // Check for suspicious patterns
    await checkSecurityPatterns(ip, event, count);
  } catch (error) {
    console.error('Failed to log security event:', error);
    // Don't fail the main operation if logging fails
  }
}

async function checkSecurityPatterns(ip, event, count) {
  try {
    // Check for repeated lockouts
    if (event === 'LOCKOUT_TRIGGERED' && count >= SECURITY_MONITORING.REPEATED_LOCKOUTS_THRESHOLD) {
      console.warn(`SECURITY ALERT: IP ${ip} has been locked out ${count} times in 24h`);
      // In production, you might want to send this to an external monitoring service
    }

    // Check for excessive rate limiting
    if (event === 'RATE_LIMITED' && count >= SECURITY_MONITORING.HIGH_RATE_LIMIT_THRESHOLD) {
      console.warn(`SECURITY ALERT: IP ${ip} has been rate limited ${count} times in 24h`);
    }
  } catch (error) {
    console.error('Failed to check security patterns:', error);
  }
}

async function isRateLimited(ip) {
  try {
    const key = `rate:${ip}`;
    // Use atomic pipeline to increment and set expiry
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.ttl(key);
    const results = await pipeline.exec();

    const count = results[0];
    const ttl = results[1];

    // Set expiry only if this is the first increment (ttl = -1)
    if (ttl === -1) {
      await redis.expire(key, RATE_LIMIT_WINDOW / 1000);
    }

    const isLimited = count > MAX_REQUESTS_PER_WINDOW;
    if (isLimited) {
      await logSecurityEvent(ip, 'RATE_LIMITED', { count, window: RATE_LIMIT_WINDOW });
    }

    return isLimited;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    await logSecurityEvent(ip, 'REDIS_ERROR', { operation: 'rate_limit_check', error: error.message });
    // Fail open - don't block legitimate users if Redis is down
    return false;
  }
}

async function isLockedOut(ip) {
  try {
    const lockKey = `lock:${ip}`;
    const lockedUntil = await redis.get(lockKey);

    const now = Date.now();
    if (lockedUntil && now < parseInt(lockedUntil)) {
      const remainingTime = Math.ceil((parseInt(lockedUntil) - now) / 1000);
      return { locked: true, remainingTime };
    }

    return { locked: false, remainingTime: 0 };
  } catch (error) {
    console.error('Lockout check failed:', error);
    await logSecurityEvent(ip, 'REDIS_ERROR', { operation: 'lockout_check', error: error.message });
    // Fail open - don't lock out users if Redis is down
    return { locked: false, remainingTime: 0 };
  }
}

async function recordFailedAttempt(ip) {
  try {
    const failKey = `fail:${ip}`;
    const lockKey = `lock:${ip}`;
    const lockoutCountKey = `lockout_count:${ip}`;
    const lastLockoutKey = `last_lockout:${ip}`;

    // Use atomic pipeline for failed attempt recording
    const pipeline = redis.pipeline();
    pipeline.incr(failKey);
    pipeline.ttl(failKey);
    pipeline.get(lockoutCountKey);
    const results = await pipeline.exec();

    const failedAttempts = results[0];
    const ttl = results[1];
    const lockoutCount = parseInt(results[2]) || 0;

    // Set expiry only if this is the first increment
    if (ttl === -1) {
      await redis.expire(failKey, MAX_LOCKOUT_DURATION / 1000);
    }

    await logSecurityEvent(ip, 'FAILED_ATTEMPT', {
      failedAttempts,
      lockoutCount,
      threshold: MAX_ATTEMPTS,
    });

    if (failedAttempts >= MAX_ATTEMPTS) {
      // Get current lockout count for progressive penalties
      const multiplierIndex = Math.min(lockoutCount, LOCKOUT_MULTIPLIERS.length - 1);
      const multiplier = LOCKOUT_MULTIPLIERS[multiplierIndex];

      const lockoutDuration = Math.min(LOCKOUT_DURATION * multiplier, MAX_LOCKOUT_DURATION);
      const lockedUntil = Date.now() + lockoutDuration;

      // Atomic pipeline for lockout operations
      const lockoutPipeline = redis.pipeline();
      lockoutPipeline.set(lockKey, lockedUntil.toString(), { px: lockoutDuration });
      lockoutPipeline.incr(lockoutCountKey);
      lockoutPipeline.expire(lockoutCountKey, MAX_LOCKOUT_DURATION / 1000);
      lockoutPipeline.set(lastLockoutKey, Date.now().toString(), { ex: MAX_LOCKOUT_DURATION / 1000 });
      lockoutPipeline.del(failKey); // Reset failed attempts counter
      await lockoutPipeline.exec();

      await logSecurityEvent(ip, 'LOCKOUT_TRIGGERED', {
        lockoutDuration,
        lockoutCount: lockoutCount + 1,
        multiplier,
      });
    }

    return failedAttempts;
  } catch (error) {
    console.error('Failed to record attempt:', error);
    await logSecurityEvent(ip, 'REDIS_ERROR', { operation: 'record_failed_attempt', error: error.message });
    return 1;
  }
}

async function recordSuccessfulAttempt(ip) {
  try {
    // Use atomic pipeline to clear all failure-related keys
    const pipeline = redis.pipeline();
    pipeline.del(`fail:${ip}`);
    pipeline.del(`lock:${ip}`);
    // Note: We keep lockout_count to track historical lockouts for monitoring
    await pipeline.exec();

    await logSecurityEvent(ip, 'SUCCESSFUL_LOGIN');
  } catch (error) {
    console.error('Failed to clear attempt records:', error);
    await logSecurityEvent(ip, 'REDIS_ERROR', { operation: 'record_successful_attempt', error: error.message });
    // Don't throw - successful login should still proceed
  }
}

async function checkForAbusePatterns(ip) {
  try {
    const now = Date.now();
    const dayAgo = now - SECURITY_MONITORING.MONITORING_WINDOW;

    // Check for lockout evasion patterns
    const lastLockoutKey = `last_lockout:${ip}`;
    const lastLockout = await redis.get(lastLockoutKey);

    if (lastLockout) {
      const timeSinceLastLockout = now - parseInt(lastLockout);
      // If someone was locked out recently and is trying again, increase scrutiny
      if (timeSinceLastLockout < 60 * 60 * 1000) {
        // 1 hour
        await logSecurityEvent(ip, 'POTENTIAL_LOCKOUT_EVASION', {
          timeSinceLastLockout,
          lastLockout: new Date(parseInt(lastLockout)).toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('Failed to check abuse patterns:', error);
  }
}

export async function POST(request) {
  try {
    // Validate environment
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.error('Redis configuration missing');
      return NextResponse.json(
        { success: false, error: 'Service configuration error' },
        { status: 500 }
      );
    }

    if (!process.env.SITE_PIN) {
      console.error('SITE_PIN not configured');
      return NextResponse.json(
        { success: false, error: 'Service configuration error' },
        { status: 500 }
      );
    }

    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check for abuse patterns
    await checkForAbusePatterns(clientIP);

    // Rate limiting should be checked FIRST
    if (await isRateLimited(clientIP)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please wait before trying again.',
          rateLimited: true,
        },
        { status: 429 }
      );
    }

    // Then check lockout status
    const lockoutStatus = await isLockedOut(clientIP);
    if (lockoutStatus.locked) {
      const minutes = Math.ceil(lockoutStatus.remainingTime / 60);
      await logSecurityEvent(clientIP, 'LOCKOUT_ACCESS_ATTEMPT', {
        remainingTime: lockoutStatus.remainingTime,
        userAgent,
      });

      return NextResponse.json(
        {
          success: false,
          error: `Account temporarily locked. Try again in ${minutes} minute${
            minutes !== 1 ? 's' : ''
          }.`,
          lockedOut: true,
          remainingTime: lockoutStatus.remainingTime,
        },
        { status: 423 }
      );
    }

    const { pin } = await request.json();
    if (!pin || typeof pin !== 'string' || !/^\d+$/.test(pin) || pin.length < 4 || pin.length > 10) {
      await recordFailedAttempt(clientIP);
      await logSecurityEvent(clientIP, 'INVALID_PIN_FORMAT', { userAgent });
      return NextResponse.json(
        { success: false, error: 'Invalid PIN. Please try again.' },
        { status: 401 }
      );
    }

    const correctPin = process.env.SITE_PIN || '123456';
    if (pin === correctPin) {
      await recordSuccessfulAttempt(clientIP);
      const response = NextResponse.json({ success: true });

      response.cookies.set('pin-auth', 'authorized', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60,
      });

      return response;
    } else {
      const failedAttempts = await recordFailedAttempt(clientIP);
      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - failedAttempts);

      let errorMessage = 'Invalid PIN. Please try again.';
      if (remainingAttempts <= 2 && remainingAttempts > 0) {
        errorMessage += ` ${remainingAttempts} attempt${
          remainingAttempts !== 1 ? 's' : ''
        } remaining.`;
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          remainingAttempts,
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('PIN verification error:', error);
    const clientIP = getClientIP(request);
    await logSecurityEvent(clientIP, 'SYSTEM_ERROR', { error: error.message });

    return NextResponse.json(
      { success: false, error: 'Service temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
