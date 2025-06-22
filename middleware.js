import { NextResponse } from 'next/server';

export function middleware(request) {
  // Check doctor authentication
  const doctorAuthCookie = request.cookies.get('doctor-auth');
  const doctorId = doctorAuthCookie?.value;
  
  // Validate doctor ID format to prevent default fallbacks
  const isValidDoctorId = doctorId && doctorId !== 'default-doctor' && doctorId.startsWith('dr_');
  
  // If accessing login page, allow through
  if (request.nextUrl.pathname === '/login') {
    // If already authenticated with valid doctor ID, redirect to home
    if (isValidDoctorId) {
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
  
  // For all other routes, check authentication with proper doctor ID
  if (!isValidDoctorId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Add doctor ID to request headers for API routes
  const response = NextResponse.next();
  response.headers.set('X-Doctor-ID', doctorId);
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
