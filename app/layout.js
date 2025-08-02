import { Inter } from 'next/font/google';
import './globals.css';
import SessionWrapper from '../components/SessionWrapper';
import { Toaster } from "@/components/ui/sonner"
import ThemeScript from '../components/ThemeScript';
import StoreDoctorId from '../components/StoreDoctorId';
import AuthGuard from '../components/AuthGuard';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Dr. Practice Management System',
  description: 'Comprehensive web app for medical practice management',
  icons: {
    icon: '/favicon.svg', // Can also use { rel: 'icon', url: '/favicon.ico' }
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <SessionWrapper>
          <StoreDoctorId />
          <AuthGuard>
            {children}
          </AuthGuard>
        </SessionWrapper>
        <Toaster />
      </body>
    </html>
  );
}