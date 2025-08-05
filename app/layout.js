import { Inter } from 'next/font/google';
import './globals.css';
import SessionWrapper from '../components/SessionWrapper';
import { Toaster } from "@/components/ui/sonner"
import ThemeScript from '../components/ThemeScript';
import StoreDoctorId from '../components/StoreDoctorId';
import AuthGuard from '../components/AuthGuard';
import TitleManager from '../components/TitleManager';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Doc Prescrip',
  description: 'Comprehensive web app for medical practice management',
  icons: {
    icon: '/favicon.svg',
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
          <TitleManager />
          <AuthGuard>
            {children}
          </AuthGuard>
        </SessionWrapper>
        <Toaster />
      </body>
    </html>
  );
}