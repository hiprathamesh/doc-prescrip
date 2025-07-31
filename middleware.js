import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Secure JWT validation using jose
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyJwt(token) {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE
    });
    if (!payload.doctorId || !payload.exp) {
      return null;
    }
    return payload;
  } catch (err) {
    console.warn('JWT verification failed');
    return null;
  }
}

export async function middleware(request) {
  const staticAssetPattern = /^\/(darkUI\d\.png|lightUI\d\.png|favicon\.ico|logo\.png|.*\.(css|js|jpg|jpeg|png|webp|avif|svg|ico))$/;
  if (staticAssetPattern.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  
  // Check doctor authentication
  const doctorAuthCookie = request.cookies.get('doctor-auth');
  const cookieValue = doctorAuthCookie?.value;

  let isValidDoctorAuth = false;
  let doctorId = null;

  if (cookieValue) {
    // Use jose for JWT verification
    let decoded = null;
    if (cookieValue.split('.').length === 3) {
      decoded = await verifyJwt(cookieValue);
    }
    if (decoded && decoded.doctorId) {
      doctorId = decoded.doctorId;
      isValidDoctorAuth = !!doctorId;
    } 
  }

  // If accessing login page, allow through
  if (request.nextUrl.pathname === '/login') {
    // If already authenticated with valid doctor ID, redirect to home
    if (isValidDoctorAuth) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // If accessing PIN entry page (legacy), redirect to login
  if (request.nextUrl.pathname === '/pin-entry') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If accessing API routes for PIN verification (legacy), allow through
  if (request.nextUrl.pathname.startsWith('/api/verify-pin')) {
    return NextResponse.next();
  }

  // Allow doctor authentication API routes
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Allow refresh endpoint through
  if (request.nextUrl.pathname.startsWith('/api/auth/refresh')) {
    return NextResponse.next();
  }

  // For all other routes, check authentication with proper doctor ID
  if (!isValidDoctorAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Add doctor ID to request headers for API routes
  const response = NextResponse.next();
  if (doctorId) {
    response.headers.set('X-Doctor-ID', doctorId);
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
