'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import DocPill from './icons/DocPill';

export default function AuthGuard({ children }) {
  const { data: session, status } = useSession();
  const [isInitializing, setIsInitializing] = useState(true);
  const [doctorContextReady, setDoctorContextReady] = useState(false);
  const [minDisplayTimeElapsed, setMinDisplayTimeElapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initializeDoctorContext = async () => {
      try {
        // Don't guard the login page, terms, or privacy pages
        if (pathname === '/login' || pathname === '/terms' || pathname === '/privacy') {
          setIsInitializing(false);
          setDoctorContextReady(true);
          return;
        }

        // If we're loading the session, wait
        if (status === 'loading') {
          return;
        }

        // If not authenticated, redirect to login
        if (status === 'unauthenticated') {
          router.push('/login');
          return;
        }

        // If authenticated, check if doctor context is ready
        if (status === 'authenticated' && session?.user?.doctorId) {
          // Check if localStorage already has the doctor ID
          const existingDoctorId = localStorage.getItem('currentDoctorId');
          
          if (existingDoctorId) {
            // Context is already ready
            setDoctorContextReady(true);
            // Only end initialization when both context is ready AND minimum display time has elapsed
            if (minDisplayTimeElapsed) {
              setIsInitializing(false);
            }
            return;
          }

          // Wait for StoreDoctorId component to set the context
          console.log('🔄 Waiting for doctor context to be initialized...');
          
          // Set up event listener for when doctor context is ready
          const handleDoctorContextReady = () => {
            console.log('✅ Doctor context is now ready');
            setDoctorContextReady(true);
            // Only end initialization when both context is ready AND minimum display time has elapsed
            if (minDisplayTimeElapsed) {
              setIsInitializing(false);
            }
          };

          window.addEventListener('doctorContextReady', handleDoctorContextReady);

          // Also poll localStorage as a fallback
          const pollInterval = setInterval(() => {
            const currentDoctorId = localStorage.getItem('currentDoctorId');
            if (currentDoctorId) {
              console.log('✅ Doctor context detected via polling');
              clearInterval(pollInterval);
              window.removeEventListener('doctorContextReady', handleDoctorContextReady);
              setDoctorContextReady(true);
              // Only end initialization when both context is ready AND minimum display time has elapsed
              if (minDisplayTimeElapsed) {
                setIsInitializing(false);
              }
            }
          }, 100); // Check every 100ms

          // Timeout after 10 seconds
          const timeout = setTimeout(() => {
            console.error('❌ Timeout waiting for doctor context');
            clearInterval(pollInterval);
            window.removeEventListener('doctorContextReady', handleDoctorContextReady);
            // If timeout, redirect to login to retry
            router.push('/login');
          }, 10000);

          // Cleanup function
          return () => {
            clearInterval(pollInterval);
            clearTimeout(timeout);
            window.removeEventListener('doctorContextReady', handleDoctorContextReady);
          };
        } else if (status === 'authenticated' && !session?.user?.doctorId) {
          // Authenticated but no doctor ID - this shouldn't happen, redirect to login
          console.error('Authenticated but no doctor ID in session');
          router.push('/login');
        } else {
          // No valid session, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Error initializing doctor context:', error);
        router.push('/login');
      }
    };

    initializeDoctorContext();
  }, [session, status, router, pathname, minDisplayTimeElapsed]);

  // Minimum display time effect (for testing purposes)
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('⏰ Minimum display time elapsed');
      setMinDisplayTimeElapsed(true);
      // If doctor context is already ready, end initialization
      if (doctorContextReady) {
        setIsInitializing(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [doctorContextReady]);

  // Don't guard the login page, terms, or privacy pages
  if (pathname === '/login' || pathname === '/terms' || pathname === '/privacy') {
    return children;
  }

  // Show loading screen while initializing
  if (isInitializing || !doctorContextReady) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="mb-6">
            <DocPill 
              className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto doc-pill-loading" 
            />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Initializing Application
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Setting up your doctor profile...
          </p>
        </div>
      </div>
    );
  }

  // Once doctor context is ready, render the application
  return children;
}