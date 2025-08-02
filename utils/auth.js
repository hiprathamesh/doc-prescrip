// filepath: c:\Repos\doc-prescrip\utils\auth.js
import { signOut as nextAuthSignOut } from 'next-auth/react';

export const logout = async () => {
  try {
    // First, call our logout API to clear custom cookies
    const response = await fetch('/api/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    // If user has NextAuth session (Google OAuth), use NextAuth signOut
    if (data.hasNextAuthSession) {
      // Use NextAuth signOut without redirect to prevent loops
      await nextAuthSignOut({ redirect: false });
      // Then manually redirect after a brief delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } else {
      // For custom JWT auth, just redirect to login
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Fallback: force redirect to login
    window.location.href = '/login';
  }
};