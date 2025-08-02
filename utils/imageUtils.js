// Image format detection and browser support utilities

export const detectImageFormat = (src) => {
  if (!src) return 'Unknown';
  
  if (src.includes('.avif')) return 'AVIF';
  if (src.includes('.webp')) return 'WebP';
  if (src.includes('.jpg') || src.includes('.jpeg')) return 'JPEG';
  if (src.includes('.png')) return 'PNG';
  if (src.includes('.svg')) return 'SVG';
  
  return 'Unknown';
};

export const getBrowserImageSupport = () => {
  if (typeof window === 'undefined') {
    return { avif: false, webp: false };
  }

  const supportsWebP = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } catch (e) {
      return false;
    }
  };

  const supportsAVIF = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    } catch (e) {
      return false;
    }
  };

  return {
    avif: supportsAVIF(),
    webp: supportsWebP()
  };
};

export const getCompressionSavings = (format) => {
  switch (format?.toUpperCase()) {
    case 'AVIF':
      return '~50% vs PNG';
    case 'WEBP':
      return '~25% vs PNG';
    case 'JPEG':
      return '~10% vs PNG';
    default:
      return 'No compression';
  }
};

export const logImageLoad = (format, src, additionalInfo = {}) => {
  const browserSupport = getBrowserImageSupport();
  
  // console.log(`✅ Image loaded successfully:`, {
  //   format: format?.toUpperCase(),
  //   src,
  //   browserSupport: {
  //     AVIF: browserSupport.avif,
  //     WebP: browserSupport.webp
  //   },
  //   compressionSavings: getCompressionSavings(format),
  //   userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').pop() : 'Unknown',
  //   ...additionalInfo
  // });
};

export const logImageError = (format, src, additionalInfo = {}) => {
  console.warn(`❌ Image failed to load:`, {
    format: format?.toUpperCase(),
    src,
    ...additionalInfo
  });
};

// Get the best image format for the current browser
export const getBestImageFormat = (baseName, supportedFormats = ['avif', 'webp', 'jpg', 'png']) => {
  const browserSupport = getBrowserImageSupport();
  
  if (supportedFormats.includes('avif') && browserSupport.avif) {
    return `${baseName}.avif`;
  }
  
  if (supportedFormats.includes('webp') && browserSupport.webp) {
    return `${baseName}.webp`;
  }
  
  if (supportedFormats.includes('jpg')) {
    return `${baseName}.jpg`;
  }
  
  return `${baseName}.png`;
};