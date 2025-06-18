'use client';

import Dashboard from '../components/Dashboard';
import { useEffect } from 'react';
import { initializeTheme } from '../utils/theme';


export default function Home() {
  useEffect(() => {
    initializeTheme();
  }, []);
  return <Dashboard />;
}