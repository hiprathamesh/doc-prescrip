import { NextResponse } from 'next/server';

export function middleware(request) {
  // Check if user has valid PIN cookie
  const pinCookie = request.cookies.get('pin-auth');
  const isAuthenticated = pinCookie?.value === 'authorized';
  
  // If accessing PIN entry page, allow through
  if (request.nextUrl.pathname === '/pin-entry') {
    // If already authenticated, redirect to home
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }
  
  // If accessing API routes for PIN verification, allow through
  if (request.nextUrl.pathname.startsWith('/api/verify-pin')) {
    return NextResponse.next();
  }
  
  // Allow NextAuth API routes (critical fix)
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }
  
  // For all other routes, check authentication
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/pin-entry', request.url));
  }
  
  return NextResponse.next();
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
