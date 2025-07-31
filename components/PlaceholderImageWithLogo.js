'use client';

import { Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';
import { detectImageFormat, logImageLoad, logImageError, getBrowserImageSupport } from '../utils/imageUtils';

export default function PlaceholderImageWithLogo({ isDarkTheme, themeInitialized }) {
  const [loadedImageFormat, setLoadedImageFormat] = useState(null);

  const handleImageLoad = (event) => {
    const src = event.target.currentSrc || event.target.src;
    const format = detectImageFormat(src);
    setLoadedImageFormat(format);
    
    logImageLoad(format, src, {
      component: 'PlaceholderImageWithLogo',
      theme: isDarkTheme ? 'Dark' : 'Light'
    });
  };

  const handleImageError = (event) => {
    const src = event.target.src;
    const format = detectImageFormat(src);
    
    logImageError(format, src, {
      component: 'PlaceholderImageWithLogo',
      fallbackNote: 'Will fall back to next source format'
    });
  };

  useEffect(() => {
    if (themeInitialized) {
      const browserSupport = getBrowserImageSupport();
      console.log('🎨 PlaceholderImage - Theme initialized:', {
        theme: isDarkTheme ? 'Dark' : 'Light',
        browserSupport
      });
    }
  }, [themeInitialized, isDarkTheme]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background Image */}
      {themeInitialized && (
        <picture className="w-full h-full">
          {/* AVIF - Most efficient, latest browsers */}
          <source 
            srcSet={isDarkTheme ? '/placeholderIMG.avif' : '/placeholderIMGlight.avif'} 
            type="image/avif"
          />
          
          {/* WebP - Good compression, wide support */}
          <source 
            srcSet={isDarkTheme ? '/placeholderIMG.webp' : '/placeholderIMGlight.webp'} 
            type="image/webp"
          />
          
          {/* PNG - Fallback for older browsers */}
          <img
            src={isDarkTheme ? '/placeholderIMG.png' : '/placeholderIMGlight.png'}
            alt="Login placeholder"
            className="w-full h-full object-cover transition-opacity duration-300"
            style={{ filter: 'brightness(1) contrast(1)' }}
            draggable="false"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </picture>
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
      
      {/* Development indicator for loaded image format */}
      {process.env.NODE_ENV === 'development' && loadedImageFormat && (
        <div 
          className="absolute top-4 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full pointer-events-none font-mono"
          style={{ fontSize: '11px', zIndex: 10 }}
        >
          {loadedImageFormat}
        </div>
      )}
      
      {/* Optional gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-black/15"></div>
    </div>
  );
}
