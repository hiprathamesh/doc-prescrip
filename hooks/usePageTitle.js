'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { storage } from '../utils/storage';

export default function usePageTitle(pageTitle = '') {
  const { data: session } = useSession();

  useEffect(() => {
    if (!pageTitle) return; // Don't do anything if no page title is provided

    const updateTitle = async () => {
      let title = '';
      
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

      // Build title based on page and authentication state
      if (doctorName) {
        title = `${pageTitle} | ${doctorName} | Doc Prescrip`;
      } else {
        title = `${pageTitle} | Doc Prescrip`;
      }

      document.title = title;
    };

    updateTitle();
  }, [pageTitle, session]);
}