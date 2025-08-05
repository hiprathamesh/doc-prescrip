'use client';

import Dashboard from '../components/Dashboard';
import { useEffect } from 'react';
import { initializeTheme } from '../utils/theme';
import usePageTitle from '../hooks/usePageTitle';


export default function Home() {
  usePageTitle('Dashboard');
  
  useEffect(() => {
    initializeTheme();
  }, []);
  return <Dashboard />;
}