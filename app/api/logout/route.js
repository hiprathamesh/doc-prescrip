import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Redis } from '@upstash/redis';
import { jwtVerify } from 'jose';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default_jwt_secret');

async function verifyJwt(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (err) {
    return null;
  }
}

export async function POST(request) {
  try {
    // Check if user has NextAuth session (Google OAuth)
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    // Check for custom JWT auth
    let doctorId = null;
    const doctorAuthCookie = request.cookies.get('doctor-auth');
    const refreshCookie = request.cookies.get('doctor-refresh');
    
    if (doctorAuthCookie?.value) {
      const decoded = await verifyJwt(doctorAuthCookie.value);
      if (decoded?.doctorId) {
        doctorId = decoded.doctorId;
      }
    }
    
    const response = NextResponse.json({ 
      success: true,
      hasNextAuthSession: !!token
    });
    
    // Clear custom JWT authentication cookies
    response.cookies.set('pin-auth', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/'
    });
    
    response.cookies.set('doctor-auth', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/'
    });

    response.cookies.set('doctor-refresh', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/'
    });
    
    // Clean up refresh tokens from Redis if we have a doctor ID
    if (doctorId && refreshCookie?.value) {
      try {
        await redis.del(`refresh:${doctorId}:${refreshCookie.value}`);
      } catch (error) {
        console.error('Error cleaning up refresh token:', error);
      }
    }
    
    // Clear NextAuth session cookies if they exist
    if (token) {
      // Clear NextAuth session cookies with proper naming
      const isProduction = process.env.NODE_ENV === 'production';
      const cookiePrefix = isProduction ? '__Secure-' : '';
      
      response.cookies.set(`${cookiePrefix}next-auth.session-token`, '', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        expires: new Date(0),
        path: '/'
      });
      
      response.cookies.set(`${cookiePrefix}next-auth.csrf-token`, '', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        expires: new Date(0),
        path: '/'
      });

      response.cookies.set(`${cookiePrefix}next-auth.callback-url`, '', {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        expires: new Date(0),
        path: '/'
      });
    }
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
