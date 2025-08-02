// components/StoreDoctorId.js
'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { storage } from '../utils/storage'

export default function StoreDoctorId() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.doctorId) {
      try {
        // Always store/update the doctor context for Google authenticated users
        // This ensures localStorage is immediately available for other components
        storage.setCurrentDoctor(session.user.doctorId, {
          name: session.user.doctorContext?.name || session.user.name || 'Dr. Nikam',
          firstName: session.user.doctorContext?.firstName || session.user.name?.split(' ')[0] || 'Dr.',
          lastName: session.user.doctorContext?.lastName || session.user.name?.split(' ').pop() || 'Nikam',
          accessType: session.user.doctorContext?.accessType || 'doctor',
          phone: session.user.doctorContext?.phone || '',
          degree: session.user.doctorContext?.degree || '',
          registrationNumber: session.user.doctorContext?.registrationNumber || '',
          hospitalName: session.user.doctorContext?.hospitalName || 'Chaitanya Hospital',
          hospitalAddress: session.user.doctorContext?.hospitalAddress || 'Deola, Maharashtra'
        });
        
        console.log('✅ Google login: Stored doctorId in localStorage:', session.user.doctorId);
        
        // Dispatch a custom event to notify other components that doctor context is ready
        // Use setTimeout to ensure it's dispatched after localStorage is set
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('doctorContextReady', { 
            detail: { doctorId: session.user.doctorId } 
          }));
          console.log('🔔 Dispatched doctorContextReady event');
        }, 100);
        
      } catch (error) {
        console.error('❌ Error storing doctor context from Google login:', error);
      }
    } else if (status === 'unauthenticated') {
      // Clear doctor context on logout
      try {
        storage.clearDoctorContext();
        console.log('🧹 Cleared doctor context on logout');
      } catch (error) {
        console.error('❌ Error clearing doctor context:', error);
      }
    } else if (status === 'loading') {
      // Don't do anything while session is loading
      console.log('⏳ Session loading...');
    }
  }, [status, session])

  return null // this component doesn't render anything
}
