import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getToken } from 'next-auth/jwt';

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
  
  // Check NextAuth session first
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  let isAuthenticated = false;
  let doctorId = null;
  let userEmail = null;

  // If user has valid NextAuth session (Google auth)
  if (token && token.email && token.doctorId) {
    isAuthenticated = true;
    doctorId = token.doctorId;
    userEmail = token.email;
    console.log('✅ Middleware: Google auth session found, doctorId:', doctorId);
  }

  // If no NextAuth session, check custom JWT authentication
  if (!isAuthenticated) {
    const doctorAuthCookie = request.cookies.get('doctor-auth');
    const cookieValue = doctorAuthCookie?.value;

    if (cookieValue) {
      // Use jose for JWT verification
      let decoded = null;
      if (cookieValue.split('.').length === 3) {
        decoded = await verifyJwt(cookieValue);
      }
      if (decoded && decoded.doctorId) {
        doctorId = decoded.doctorId;
        isAuthenticated = !!doctorId;
      } 
    }
  }

  // If accessing terms or privacy policy, always allow through (no auth required)
  if (request.nextUrl.pathname === '/terms' || 
      request.nextUrl.pathname === '/privacy') {
    console.log('🔓 Middleware: Allowing access to public page:', request.nextUrl.pathname);
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === '/googlec2f92b121acd7f08.html') {
    return NextResponse.next();
  }

  // If accessing login page, allow through
  if (request.nextUrl.pathname === '/login') {
    // If already authenticated with valid doctor ID and accessing login, redirect to home
    if (isAuthenticated && doctorId) {
      console.log('🔄 Middleware: Redirecting authenticated user from login to home');
      return NextResponse.redirect(new URL('/', request.url));
    }
    console.log('🔓 Middleware: Allowing access to login page');
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

  // Allow logout API route
  if (request.nextUrl.pathname.startsWith('/api/logout')) {
    return NextResponse.next();
  }

  // Allow refresh endpoint through
  if (request.nextUrl.pathname.startsWith('/api/auth/refresh')) {
    return NextResponse.next();
  }

  // For all other routes, check authentication with proper doctor ID
  if (!isAuthenticated || !doctorId) {
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
