import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { pin } = await request.json();
    
    // Validate PIN format and length
    if (!pin || typeof pin !== 'string' || !/^\d+$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN format' },
        { status: 400 }
      );
    }
    
    if (pin.length < 4 || pin.length > 10) {
      return NextResponse.json(
        { success: false, error: 'PIN must be between 4 and 10 digits' },
        { status: 400 }
      );
    }
    
    const correctPin = process.env.SITE_PIN || '123456';
    
    if (pin === correctPin) {
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
      return NextResponse.json(
        { success: false, error: 'Invalid PIN' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
