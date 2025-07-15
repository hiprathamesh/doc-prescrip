'use client';

import { Stethoscope } from 'lucide-react';

export default function PlaceholderImageWithLogo({ isDarkTheme, themeInitialized }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background Image */}
      {themeInitialized && (
        <img
          src={isDarkTheme ? '/placeholderIMG.png' : '/placeholderIMGlight.png'}
          alt="Login placeholder"
          className="w-full h-full object-cover transition-opacity duration-300"
          style={{ filter: 'brightness(1) contrast(1)' }}
          draggable="false"
          onError={(e) => {
            // Fallback to solid color if image fails to load
            e.target.style.display = 'none';
          }}
        />
      )}
      {!themeInitialized && (
        <div className="w-full h-full bg-gray-200 dark:bg-gray-800" />
      )}
      
      {/* Overlay with Logo and Text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center select-none">
          <div className="inline-flex items-center justify-center gap-4 mb-2">
            <Stethoscope className="w-11 h-11 text-blue-700 dark:text-blue-500 drop-shadow-lg" style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5)) drop-shadow(0 0 8px rgba(255,255,255,0.3))' }} />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" style={{ textShadow: '2px 2px 5px rgba(20,20,20,0.25), 0 0 8px rgba(255,255,255,0.3), 1px 1px 2px rgba(20,20,20,0.3)' }}>
              Doc Prescrip
            </h1>
          </div>
        </div>
      </div>
      
      {/* Optional gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-black/15"></div>
    </div>
  );
}
