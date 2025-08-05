import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import clientPromise from '../../../../lib/mongodb';

export async function POST(request) {
  try {
    // Get NextAuth token
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('doc-prescrip');
    const doctors = db.collection('doctors');

    const doctor = await doctors.findOne({ email: token.email });
    
    if (!doctor) {
      return NextResponse.json(
        { success: false, error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Remove Google-specific information
    await doctors.updateOne(
      { email: token.email },
      {
        $unset: {
          googleId: "",
          isGoogleUser: ""
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Google account disconnected successfully'
    });

  } catch (error) {
    console.error('Google unlinking error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}