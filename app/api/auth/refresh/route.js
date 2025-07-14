import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function POST(request) {
  try {
    const cookies = request.cookies;
    const refreshToken = cookies.get('doctor-refresh')?.value || request.headers.get('x-refresh-token');

    if (!refreshToken) {
      return NextResponse.json({ success: false, error: 'No refresh token provided' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, jwtSecret, {
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE
      });
    } catch (err) {
      return NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 });
    }

    // Check Redis for token validity
    const redisKey = `refresh:${decoded.doctorId}:${refreshToken}`;
    const valid = await redis.get(redisKey);
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Refresh token revoked or expired' }, { status: 401 });
    }

    // Rotate refresh token: delete old, issue new
    await redis.del(redisKey);
    const newRefreshToken = jwt.sign(
      { doctorId: decoded.doctorId, type: 'refresh', iss: process.env.JWT_ISSUER, aud: process.env.JWT_AUDIENCE },
      jwtSecret,
      { expiresIn: '30d' }
    );
    await redis.set(`refresh:${decoded.doctorId}:${newRefreshToken}`, 'valid', { ex: 30 * 24 * 60 * 60 });

    // Issue new access token
    const accessToken = jwt.sign(
      {
        doctorId: decoded.doctorId,
        iss: process.env.JWT_ISSUER,
        aud: process.env.JWT_AUDIENCE
      },
      jwtSecret,
      { expiresIn: '15m' }
    );

    const response = NextResponse.json({ success: true });
    response.cookies.set('doctor-auth', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/'
    });
    response.cookies.set('doctor-refresh', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
