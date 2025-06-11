import { Inter } from 'next/font/google';
import './globals.css';
import SessionWrapper from '../components/SessionWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Dr. Practice Management System',
  description: 'Comprehensive web app for medical practice management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionWrapper>
          {children}
        </SessionWrapper>
      </body>
    </html>
  );
}