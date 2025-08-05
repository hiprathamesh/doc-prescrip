'use client';

import { useEffect } from 'react';
import usePageTitle from '../hooks/usePageTitle';

export default function TitleUpdater({ title }) {
  usePageTitle(title);
  return null; // This component doesn't render anything
}