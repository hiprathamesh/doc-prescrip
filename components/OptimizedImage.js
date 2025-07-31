'use client';

import { useEffect, useState, useRef } from 'react';

export default function OptimizedImage({ 
  baseName, 
  alt, 
  className = '', 
  style = {}, 
  onLoad,
  onError,
  draggable = false,
  ...props 
}) {
  const [loadedFormat, setLoadedFormat] = useState(null);
  const [browserSupport, setBrowserSupport] = useState({
    avif: false,
    webp: false
  });
  const imgRef = useRef(null);

  // Check browser support for modern image formats
  useEffect(() => {
    const checkSupport = async () => {
      const supportsWebP = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      };

      const supportsAVIF = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
      };

      const support = {
        avif: supportsAVIF(),
        webp: supportsWebP()
      };

      setBrowserSupport(support);
      
      console.log('🌐 Browser Format Support:', {
        AVIF: support.avif,
        WebP: support.webp,
        userAgent: navigator.userAgent.split(' ').pop()
      });
    };

    checkSupport();
  }, []);

  const handleImageLoad = (event) => {
    const src = event.target.currentSrc || event.target.src;
    let format = 'PNG';
    
    if (src.includes('.avif')) format = 'AVIF';
    else if (src.includes('.webp')) format = 'WebP';
    else if (src.includes('.jpg') || src.includes('.jpeg')) format = 'JPEG';
    
    setLoadedFormat(format);
    
    console.log(`✅ OptimizedImage loaded:`, {
      format,
      src,
      baseName,
      browserSupport,
      savings: format === 'AVIF' ? '~50% vs PNG' : format === 'WebP' ? '~25% vs PNG' : 'No compression'
    });

    if (onLoad) onLoad(event);
  };

  const handleImageError = (event) => {
    const src = event.target.src;
    let format = 'Unknown';
    
    if (src.includes('.avif')) format = 'AVIF';
    else if (src.includes('.webp')) format = 'WebP';
    else if (src.includes('.png')) format = 'PNG';
    
    console.warn(`❌ OptimizedImage failed to load:`, {
      format,
      src,
      baseName,
      fallbackAvailable: true
    });

    if (onError) onError(event);
  };

  return (
    <picture className={`optimized-image-container ${className}`}>
      {/* AVIF - Most efficient format, ~50% smaller than PNG */}
      <source 
        srcSet={`${baseName}.avif`} 
        type="image/avif"
      />
      
      {/* WebP - Good compression, ~25% smaller than PNG */}
      <source 
        srcSet={`${baseName}.webp`} 
        type="image/webp"
      />
      
      {/* JPEG - Good for photos */}
      <source 
        srcSet={`${baseName}.jpg`} 
        type="image/jpeg"
      />
      
      {/* PNG - Fallback for older browsers */}
      <img
        ref={imgRef}
        src={`${baseName}.png`}
        alt={alt}
        className={className}
        style={style}
        draggable={draggable}
        onLoad={handleImageLoad}
        onError={handleImageError}
        {...props}
      />
      
      {/* Development indicator */}
      {process.env.NODE_ENV === 'development' && loadedFormat && (
        <div 
          className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none"
          style={{ fontSize: '10px', zIndex: 10 }}
        >
          {loadedFormat}
        </div>
      )}
    </picture>
  );
}