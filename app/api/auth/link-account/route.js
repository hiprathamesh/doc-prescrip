import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import clientPromise from '../../../../lib/mongodb';
import bcrypt from 'bcryptjs';

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

    const { action, password } = await request.json();
    
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

    if (action === 'link-google') {
      // User wants to link Google account to existing email/password account
      if (!doctor.passwordHash) {
        return NextResponse.json(
          { success: false, error: 'No password set for this account' },
          { status: 400 }
        );
      }

      // Check if user already has Google linked
      if (doctor.googleId) {
        return NextResponse.json(
          { success: false, error: 'Google account is already linked to this account' },
          { status: 400 }
        );
      }

      // Update doctor with Google information from token
      await doctors.updateOne(
        { email: token.email },
        {
          $set: {
            googleId: token.sub, // Google user ID from JWT token
            isGoogleUser: true,
            image: token.picture || doctor.image,
            updatedAt: new Date()
          }
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Google account linked successfully'
      });

    } else if (action === 'set-password') {
      // Google user wants to set a password for email/password login
      if (!password || password.length < 8) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 8 characters long' },
          { status: 400 }
        );
      }

      // Validate password strength
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':",.<>/?\\|`~]).{8,}$/;
      if (!strongPasswordRegex.test(password)) {
        return NextResponse.json(
          { success: false, error: 'Password must include uppercase, lowercase, number, and special character' },
          { status: 400 }
        );
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Update doctor with password
      await doctors.updateOne(
        { email: token.email },
        {
          $set: {
            passwordHash,
            updatedAt: new Date()
          }
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Password set successfully. You can now login with email and password.'
      });

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Account linking error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}