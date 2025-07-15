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
        <div className="text-center">
          <div className="inline-flex items-center justify-center gap-4 mb-2">
            <Stethoscope
              className="w-12 h-12 text-blue-600"
              style={{
                filter: `drop-shadow(2px 2px 4px ${isDarkTheme ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.7)'})`
              }}
            />
            <h1
              className="text-4xl font-bold text-gray-900 dark:text-gray-100"
              style={{
                textShadow: isDarkTheme
                  ? '2px 2px 4px rgba(0, 0, 0, 0.7), 1px 1px 2px rgba(0, 0, 0, 0.5)'
                  : '2px 2px 4px rgba(255, 255, 255, 0.3), 1px 1px 2px rgba(255, 255, 255, 0.2)'
              }}
            >
              Doc Prescrip
            </h1>
          </div>
        </div>
      </div>

      {/* Optional gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20"></div>
    </div>
  );
}
