'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { storage } from '../utils/storage';

export default function TitleManager() {
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    const updateTitleFromPath = async () => {
      // Only update title if no specific component has set it
      const currentTitle = document.title;
      
      // If the title has already been set by a component, don't override it
      if (currentTitle !== 'Doc Prescrip' && !currentTitle.includes('Doc Prescrip')) {
        return;
      }

      let pageTitle = '';
      
      // Determine page title from pathname
      switch (pathname) {
        case '/':
          pageTitle = 'Dashboard';
          break;
        case '/login':
          pageTitle = 'Login';
          break;
        case '/privacy':
          pageTitle = 'Privacy Policy';
          break;
        case '/terms':
          pageTitle = 'Terms of Service';
          break;
        case '/404':
        case '/not-found':
          pageTitle = 'Page Not Found';
          break;
        default:
          // For dynamic routes or other pages, extract from pathname
          if (pathname.includes('/patient/')) {
            pageTitle = 'Patient Details';
          } else if (pathname.includes('/billing')) {
            pageTitle = 'Billing';
          } else if (pathname.includes('/templates')) {
            pageTitle = 'Templates';
          } else if (pathname.includes('/settings')) {
            pageTitle = 'Settings';
          } else pageTitle = 'Page Not Found';
          break;
      }

      // Get doctor information if user is logged in
      let doctorName = '';
      if (session?.user) {
        try {
          const doctorContext = storage.getDoctorContext();
          if (doctorContext?.lastName) {
            doctorName = `Dr. ${doctorContext.lastName}`;
          }
        } catch (error) {
          console.error('Error fetching doctor context for title:', error);
        }
      }

      // Build title
      let title = '';
      if (pageTitle) {
        if (doctorName) {
          title = `${pageTitle} | ${doctorName} | Doc Prescrip`;
        } else {
          title = `${pageTitle} | Doc Prescrip`;
        }
      } else {
        if (doctorName) {
          title = `${doctorName} | Doc Prescrip`;
        } else {
          title = 'Doc Prescrip';
        }
      }

      document.title = title;
    };

    // Small delay to allow components to set their own titles first
    const timeoutId = setTimeout(updateTitleFromPath, 100);
    
    return () => clearTimeout(timeoutId);
  }, [pathname, session]);

  return null; // This component doesn't render anything
}