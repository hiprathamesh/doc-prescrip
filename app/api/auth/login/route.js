// This file is no longer needed - authentication is now handled by NextAuth
// All login functionality has been moved to NextAuth's built-in handlers

export async function POST(request) {
  return new Response(JSON.stringify({ 
    success: false, 
    error: 'This endpoint is deprecated. Please use NextAuth authentication.' 
  }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' }
  });
}
